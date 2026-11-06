/**
 * Shared extension logic: collecting page signals (only after a user action or during a visible
 * Live session), running the shared @custodi/core analyzer, storing results and setting the badge.
 */
import { analyzePage, analyzeUrl, EMPTY_FIELDS, type PageReport, type PageSignals, type Report, type UrlReport } from "@custodi/core";

export interface StoredScan {
  report: Report;
  origin: "page" | "message" | "live";
}

/** One page checked during a Live Observe session. Only the result is kept — never the page text. */
export interface LiveEvent {
  at: number;
  host: string;
  path: string;
  title: string;
  risk: Report["riskLevel"];
  status: string;
  score: number;
  headline: string;
  findings: { title: string; severity: string; evidence?: string; detail?: string }[];
  action: string;
}

export interface LiveState {
  active: boolean;
  startedAt: number;
  endsAt: number;
  minutes: number;
  events: LiveEvent[];
  /** Pages that couldn't be read (browser settings pages, Web Store…). */
  skipped: number;
}

export interface SessionSummary {
  startedAt: number;
  endedAt: number;
  minutes: number;
  endedBy: "user" | "timer";
  pagesScanned: number;
  skipped: number;
  counts: Record<Report["riskLevel"], number>;
  events: LiveEvent[];
}

export function toLiveEvent(report: Report, url: string, title?: string): LiveEvent {
  let host = url;
  let path = "";
  try {
    const u = new URL(url);
    host = u.hostname;
    path = u.pathname.slice(0, 60);
  } catch {
    /* keep raw */
  }
  return {
    at: Date.now(),
    host,
    path,
    title: (title ?? "").slice(0, 80),
    risk: report.riskLevel,
    status: "status" in report ? report.status : "",
    score: report.score,
    headline: report.headline,
    findings: report.findings
      .filter((f) => f.severity !== "info")
      .slice(0, 3)
      .map((f) => ({ title: f.title, severity: f.severity, evidence: f.evidence[0]?.text.slice(0, 120), detail: f.detail })),
    action: report.nextSteps[0] ?? "",
  };
}

export const LIVE_ALARM = "custodi-live-end";
const MAX_HISTORY = 100;

/**
 * Runs INSIDE the page (via chrome.scripting.executeScript). Must be self-contained.
 * Reads visible text and the *kinds* of input fields present. Never reads what the user typed.
 */
export function collectPageSignals(): PageSignals {
  const fields = { password: 0, otp: 0, card: 0, cvv: 0, upiPin: 0, govId: 0, bankAccount: 0 };
  const inputs = Array.from(document.querySelectorAll("input, select, textarea")) as HTMLInputElement[];
  for (const el of inputs) {
    const type = (el.getAttribute("type") || "").toLowerCase();
    if (type === "hidden" || type === "submit" || type === "button") continue;
    const label = el.id ? document.querySelector(`label[for="${CSS.escape(el.id)}"]`)?.textContent || "" : "";
    const hint = [el.name, el.id, el.getAttribute("placeholder"), el.getAttribute("aria-label"), el.getAttribute("autocomplete"), label]
      .join(" ")
      .toLowerCase();
    if (/upi.?pin|\bmpin\b/.test(hint)) fields.upiPin++;
    else if (type === "password" && !/otp|code/.test(hint)) fields.password++;
    else if (/one-time-code|\botp\b|one.?time|verification.?code/.test(hint)) fields.otp++;
    else if (/cc-csc|\bcvv\b|\bcvc\b|security.?code/.test(hint)) fields.cvv++;
    else if (/cc-number|card.?(no|num)|credit.?card|debit.?card/.test(hint)) fields.card++;
    else if (/aadhaa?r|\bpan\b|pan.?(card|no|number)|passport/.test(hint)) fields.govId++;
    else if (/account.?(no|num)|\bifsc\b|bank.?account/.test(hint)) fields.bankAccount++;
  }
  const formActionHosts: string[] = [];
  for (const f of Array.from(document.forms)) {
    try {
      const action = f.getAttribute("action");
      if (action) formActionHosts.push(new URL(action, location.href).hostname);
    } catch {
      /* ignore malformed action */
    }
  }
  return {
    url: location.href,
    title: document.title.slice(0, 300),
    text: (document.body?.innerText || "").slice(0, 20000),
    fields,
    formActionHosts,
  };
}

export function isScannableUrl(url: string | undefined): url is string {
  if (!url) return false;
  if (!/^https?:/i.test(url)) return false;
  return !/^https:\/\/(chrome\.google\.com\/webstore|chromewebstore\.google\.com)/i.test(url);
}

export async function getTrustedDomains(): Promise<string[]> {
  const { trustedDomains } = await chrome.storage.local.get("trustedDomains");
  return Array.isArray(trustedDomains) ? trustedDomains : [];
}

/** Scans a tab. Falls back to URL-only analysis if the page itself can't be read. */
export async function scanTab(tabId: number, url: string): Promise<PageReport | UrlReport> {
  const trustedDomains = await getTrustedDomains();
  try {
    const [res] = await chrome.scripting.executeScript({ target: { tabId }, func: collectPageSignals });
    const signals = res?.result as PageSignals | undefined;
    if (signals) return analyzePage({ ...signals, fields: { ...EMPTY_FIELDS, ...signals.fields } }, { trustedDomains });
  } catch {
    /* page not readable (permission or restricted page) */
  }
  return analyzeUrl(url, { trustedDomains });
}

export async function saveScan(scan: StoredScan) {
  const { history = [] } = (await chrome.storage.local.get("history")) as { history?: StoredScan[] };
  await chrome.storage.local.set({ history: [scan, ...history].slice(0, MAX_HISTORY) });
}

const BADGE = {
  high: { text: "!", color: "#fb5a6b" },
  medium: { text: "?", color: "#fbbf3c" },
} as const;

export async function setTabBadge(tabId: number, risk: Report["riskLevel"]) {
  if (risk === "low") {
    // Clear the per-tab badge so the global (ON / empty) badge shows. Low is never shown as "safe".
    await chrome.action.setBadgeText({ tabId, text: "" });
    return;
  }
  await chrome.action.setBadgeText({ tabId, text: BADGE[risk].text });
  await chrome.action.setBadgeBackgroundColor({ tabId, color: BADGE[risk].color });
}

export async function getLive(): Promise<LiveState | null> {
  const { live } = (await chrome.storage.local.get("live")) as { live?: LiveState };
  return live ?? null;
}
