/**
 * CUSTODI background service worker — Live Observe.
 *
 * Only does work while a Live Observe session the user started is running. The session is always
 * visible (toolbar badge "ON", timer in the popup and on the CUSTODI website) and can be stopped at once.
 * There is no other monitoring. Page text is analysed in memory and discarded; only results are stored.
 */
import { normaliseTrustedDomains } from "@custodi/core";
import {
  getLive,
  isScannableUrl,
  LIVE_ALARM,
  saveScan,
  scanTab,
  setTabBadge,
  toLiveEvent,
  type LiveState,
  type SessionSummary,
} from "./shared";

const recent = new Map<number, { url: string; at: number }>();
const DURATIONS = [15, 30, 60];

async function liveActive(): Promise<LiveState | null> {
  const live = await getLive();
  if (!live?.active) return null;
  if (Date.now() >= live.endsAt) {
    await stopLive("timer");
    return null;
  }
  return live;
}

const hasSitePermission = () => chrome.permissions.contains({ origins: ["<all_urls>"] });

async function liveScan(tabId: number, url: string | undefined, title: string | undefined) {
  const live = await liveActive();
  if (!live) return;
  if (!isScannableUrl(url)) {
    if (url && !/^(about:blank|chrome:\/\/newtab)/.test(url)) {
      live.skipped += 1;
      await chrome.storage.local.set({ live });
    }
    return;
  }
  if (!(await hasSitePermission())) return;
  const last = recent.get(tabId);
  if (last && last.url === url && Date.now() - last.at < 10_000) return;
  recent.set(tabId, { url, at: Date.now() });

  const report = await scanTab(tabId, url);
  await setTabBadge(tabId, report.riskLevel);
  await saveScan({ report, origin: "live" });
  const fresh = await getLive();
  if (fresh?.active) {
    fresh.events = [toLiveEvent(report, url, title), ...fresh.events].slice(0, 50);
    await chrome.storage.local.set({ live: fresh });
  }
}

async function startLive(minutes: number) {
  const now = Date.now();
  const live: LiveState = { active: true, startedAt: now, endsAt: now + minutes * 60_000, minutes, events: [], skipped: 0 };
  await chrome.storage.local.set({ live });
  await chrome.alarms.create(LIVE_ALARM, { when: live.endsAt });
  await chrome.action.setBadgeText({ text: "ON" });
  await chrome.action.setBadgeBackgroundColor({ color: "#8a6d33" });
  await chrome.action.setBadgeTextColor?.({ color: "#ffffff" });
  await chrome.action.setTitle({ title: `CUSTODI Live Observe — ON for ${minutes} min (click to stop)` });
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  if (tab?.id !== undefined) await liveScan(tab.id, tab.url, tab.title);
}

async function stopLive(endedBy: SessionSummary["endedBy"]) {
  const live = await getLive();
  if (live?.active) {
    const counts = { high: 0, medium: 0, low: 0 };
    live.events.forEach((e) => (counts[e.risk] += 1));
    const summary: SessionSummary = {
      startedAt: live.startedAt,
      endedAt: Math.min(Date.now(), live.endsAt),
      minutes: live.minutes,
      endedBy,
      pagesScanned: live.events.length,
      skipped: live.skipped,
      counts,
      events: live.events,
    };
    await chrome.storage.local.set({ live: { ...live, active: false }, lastSession: summary });
  }
  await chrome.alarms.clear(LIVE_ALARM);
  await chrome.action.setBadgeText({ text: "" });
  await chrome.action.setTitle({ title: "CUSTODI" });
  recent.clear();
  // Give back the "read sites" permission that was only needed for Live Observe.
  try {
    await chrome.permissions.remove({ origins: ["<all_urls>"] });
  } catch {
    /* already removed */
  }
}

async function status() {
  const { lastSession } = await chrome.storage.local.get("lastSession");
  return { live: await liveActive(), lastSession: lastSession ?? null, version: chrome.runtime.getManifest().version };
}

// ---------- messages from the popup ----------
chrome.runtime.onMessage.addListener((msg: { type?: string; minutes?: number }, sender, sendResponse) => {
  if (sender.id !== chrome.runtime.id) return false;
  if (msg?.type === "live:start") {
    const minutes = DURATIONS.includes(Number(msg.minutes)) ? Number(msg.minutes) : 30;
    startLive(minutes).then(
      () => sendResponse({ ok: true }),
      (e) => sendResponse({ ok: false, error: String(e) }),
    );
    return true;
  }
  if (msg?.type === "live:stop") {
    stopLive("user").then(() => sendResponse({ ok: true }));
    return true;
  }
  return false;
});

// ---------- messages from the CUSTODI website (localhost only, see externally_connectable) ----------
// The website can see status, stop a session and sync trusted domains. It can NOT start a session:
// starting needs your click inside the extension, because only then can Chrome ask for permission.
chrome.runtime.onMessageExternal.addListener((msg: { type?: string; domains?: unknown }, sender, sendResponse) => {
  const origin = sender.origin ?? "";
  if (!/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return false;
  if (msg?.type === "custodi:status") {
    status().then((s) => sendResponse({ ok: true, ...s }));
    return true;
  }
  if (msg?.type === "live:stop") {
    stopLive("user").then(async () => sendResponse({ ok: true, ...(await status()) }));
    return true;
  }
  if (msg?.type === "settings:trustedDomains" && Array.isArray(msg.domains)) {
    const domains = normaliseTrustedDomains(msg.domains.filter((d): d is string => typeof d === "string").slice(0, 200));
    chrome.storage.local.set({ trustedDomains: domains }).then(() => sendResponse({ ok: true, count: domains.length }));
    return true;
  }
  return false;
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === LIVE_ALARM) void stopLive("timer");
});

chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  try {
    const tab = await chrome.tabs.get(tabId);
    await liveScan(tabId, tab.url, tab.title);
  } catch {
    /* tab closed */
  }
});

chrome.tabs.onUpdated.addListener((tabId, info, tab) => {
  if (info.status === "complete" && tab.active) void liveScan(tabId, tab.url, tab.title);
});

chrome.tabs.onRemoved.addListener((tabId) => recent.delete(tabId));

// After a browser restart, make sure an expired session doesn't still look "ON".
chrome.runtime.onStartup.addListener(() => void liveActive());
chrome.runtime.onInstalled.addListener((details) => {
  void liveActive();
  if (details.reason === "install") void chrome.tabs.create({ url: chrome.runtime.getURL("welcome.html") });
});
