/**
 * Talks to the CUSTODI Chrome extension (if installed) through Chrome's externally_connectable channel.
 * The extension only accepts these messages from http://localhost / 127.0.0.1 and only allows:
 * reading Live Observe status, stopping a session and syncing trusted domains. It cannot be started from
 * the website — starting needs your click inside the extension so Chrome can ask for permission.
 */
import { useCallback, useEffect, useState } from "react";

/** Fixed by the public "key" in apps/extension/public/manifest.json, so it is the same on every computer. */
export const EXTENSION_ID = "hbhalijjblgneikgjipkleckcpemmlkj";
export const EXTENSION_FOLDER = "apps/extension/dist";

export interface LiveEventDTO {
  at: number;
  host: string;
  path: string;
  title: string;
  risk: "low" | "medium" | "high";
  status: string;
  score: number;
  headline: string;
  findings: { title: string; severity: string; evidence?: string; detail?: string }[];
  action: string;
}
export interface LiveDTO {
  active: boolean;
  startedAt: number;
  endsAt: number;
  minutes: number;
  events: LiveEventDTO[];
  skipped: number;
}
export interface SessionSummaryDTO {
  startedAt: number;
  endedAt: number;
  minutes: number;
  endedBy: "user" | "timer";
  pagesScanned: number;
  skipped: number;
  counts: Record<"low" | "medium" | "high", number>;
  events: LiveEventDTO[];
}

export type ExtensionState =
  | { kind: "checking" }
  | { kind: "unsupported" }
  | { kind: "not-connected" }
  | { kind: "connected"; version: string; live: LiveDTO | null; lastSession: SessionSummaryDTO | null };

type ChromeLike = { runtime?: { sendMessage?: (id: string, msg: unknown, cb: (res: unknown) => void) => void; lastError?: unknown } };
const chromeApi = () => (globalThis as { chrome?: ChromeLike }).chrome;

export function isChromium(): boolean {
  const brands = (navigator as Navigator & { userAgentData?: { brands?: { brand: string }[] } }).userAgentData?.brands;
  if (brands?.length) return brands.some((b) => /Chromium|Google Chrome|Microsoft Edge|Brave/i.test(b.brand));
  return /Chrome\//.test(navigator.userAgent) && !/Firefox|FxiOS/.test(navigator.userAgent);
}

export function sendToExtension<T = Record<string, unknown>>(msg: unknown, timeoutMs = 1200): Promise<T | null> {
  const api = chromeApi();
  if (!api?.runtime?.sendMessage) return Promise.resolve(null);
  return new Promise((resolve) => {
    const t = setTimeout(() => resolve(null), timeoutMs);
    try {
      api.runtime!.sendMessage!(EXTENSION_ID, msg, (res) => {
        clearTimeout(t);
        void api.runtime?.lastError; // read to silence "unchecked lastError"
        resolve((res as T) ?? null);
      });
    } catch {
      clearTimeout(t);
      resolve(null);
    }
  });
}

export function useExtension(pollMs = 0) {
  const [state, setState] = useState<ExtensionState>({ kind: "checking" });

  const refresh = useCallback(async () => {
    if (!isChromium()) return setState({ kind: "unsupported" });
    const res = await sendToExtension<{ ok: boolean; version: string; live: LiveDTO | null; lastSession: SessionSummaryDTO | null }>({ type: "custodi:status" });
    if (res?.ok) setState({ kind: "connected", version: res.version, live: res.live, lastSession: res.lastSession });
    else setState({ kind: "not-connected" });
  }, []);

  useEffect(() => {
    void refresh();
    if (!pollMs) return;
    const id = setInterval(() => void refresh(), pollMs);
    return () => clearInterval(id);
  }, [refresh, pollMs]);

  const stop = useCallback(async () => {
    await sendToExtension({ type: "live:stop" });
    await refresh();
  }, [refresh]);

  const syncTrusted = useCallback(async (domains: string[]) => {
    const res = await sendToExtension<{ ok: boolean; count: number }>({ type: "settings:trustedDomains", domains });
    return res?.ok ? res.count : null;
  }, []);

  return { state, refresh, stop, syncTrusted };
}
