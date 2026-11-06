/**
 * Local-only storage for CUSTODI's prototype. Nothing leaves the device.
 * By default only the analysis result (with short evidence quotes) is saved — not the full message.
 */
import { riskScore, VERDICT, type Report } from "@custodi/core";
import { useSyncExternalStore } from "react";

export interface HistoryEntry {
  report: Report;
  /** Only present if the user turned on "Save full message text". */
  messageText?: string;
  /** web = typed/pasted by the user, sample = one of CUSTODI's fictional samples, pwa-share = shared into the app. */
  origin: "web" | "pwa-share" | "sample";
}

export interface Settings {
  keepHistory: boolean;
  saveFullText: boolean;
  trustedDomains: string[];
}

const HISTORY_KEY = "custodi.history.v1";
const SETTINGS_KEY = "custodi.settings.v1";
const MAX_ENTRIES = 200;

const DEFAULT_SETTINGS: Settings = { keepHistory: true, saveFullText: false, trustedDomains: [] };

function read<T>(key: string, fallback: T): T {
  try {
    // Data saved before the CUSTODI rename lived under "shield.*" keys — read it once if present.
    const raw = localStorage.getItem(key) ?? localStorage.getItem(key.replace(/^custodi\./, "shield."));
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full or blocked — the app still works without history */
  }
}

/** Scans saved by older CUSTODI versions lack score/verdict; fill them in from their own findings. */
function migrate(list: HistoryEntry[]): HistoryEntry[] {
  if (!Array.isArray(list)) return [];
  return list
    .filter((h) => h && h.report && Array.isArray(h.report.findings))
    .map((h) =>
      h.report.verdict && typeof h.report.score === "number"
        ? h
        : { ...h, report: { ...h.report, score: riskScore(h.report.findings), verdict: VERDICT[h.report.riskLevel] } as Report },
    );
}

let history: HistoryEntry[] = migrate(read<HistoryEntry[]>(HISTORY_KEY, []));
let settings: Settings = { ...DEFAULT_SETTINGS, ...read<Partial<Settings>>(SETTINGS_KEY, {}) };
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === HISTORY_KEY) history = migrate(read(HISTORY_KEY, []));
    if (e.key === SETTINGS_KEY) settings = { ...DEFAULT_SETTINGS, ...read(SETTINGS_KEY, {}) };
    emit();
  });
}

/** "hr.team@gmail.com" → "hr•••@gmail.com", "+91 98765 43210" → "+91•••••10". */
export function maskSender(raw: string): string {
  const s = raw.trim();
  if (s.includes("@")) {
    const [user = "", domain = ""] = s.split("@");
    return `${user.slice(0, 2)}•••@${domain}`;
  }
  const digits = s.replace(/\D/g, "");
  if (digits.length >= 6) return `${s.slice(0, 3)}•••••${digits.slice(-2)}`;
  return s.length > 4 ? `${s.slice(0, 2)}•••` : s;
}

/** Sender details are masked everywhere in a stored report (the live result on screen is unchanged). */
function maskReport(report: Report): Report {
  if (report.kind !== "message" || !report.sender) return report;
  const raw = report.sender;
  const masked = maskSender(raw);
  return JSON.parse(JSON.stringify(report).split(raw).join(masked)) as Report;
}

export function saveScan(report: Report, opts: { messageText?: string; origin?: HistoryEntry["origin"] } = {}) {
  if (!settings.keepHistory) return;
  report = maskReport(report);
  const entry: HistoryEntry = {
    report,
    origin: opts.origin ?? "web",
    messageText: settings.saveFullText ? opts.messageText : undefined,
  };
  history = [entry, ...history].slice(0, MAX_ENTRIES);
  write(HISTORY_KEY, history);
  emit();
}

export function deleteScan(id: string) {
  history = history.filter((h) => h.report.id !== id);
  write(HISTORY_KEY, history);
  emit();
}

export function clearHistory() {
  history = [];
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch {
    /* ignore */
  }
  emit();
}

export function updateSettings(patch: Partial<Settings>) {
  settings = { ...settings, ...patch };
  if (!settings.saveFullText) {
    // Turning the option off also removes any full text saved earlier.
    history = history.map(({ messageText: _drop, ...rest }) => rest);
    write(HISTORY_KEY, history);
  }
  write(SETTINGS_KEY, settings);
  emit();
}

/* ---------------- onboarding flags (per device) ---------------- */
const FLAGS_KEY = "custodi.flags.v1";
export interface Flags {
  visitedHelp?: boolean;
  visitedExtension?: boolean;
  onboardingDismissed?: boolean;
  introSeen?: boolean;
}
let flags: Flags = read<Flags>(FLAGS_KEY, {});
export function setFlag(patch: Flags) {
  flags = { ...flags, ...patch };
  write(FLAGS_KEY, flags);
  emit();
}
export function resetFlags() {
  flags = {};
  write(FLAGS_KEY, flags);
  emit();
}
export const useFlags = () => useSyncExternalStore(subscribe, () => flags, () => flags);
export const getFlags = () => flags;

export const useHistory = () => useSyncExternalStore(subscribe, () => history, () => history);
export const useSettings = () => useSyncExternalStore(subscribe, () => settings, () => settings);
export const getSettings = () => settings;
