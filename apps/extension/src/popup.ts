import { analyzeMessage, checkRows, formatIncidentReport, type Channel, type Report } from "@custodi/core";
import {
  getLive,
  getTrustedDomains,
  isScannableUrl,
  saveScan,
  scanTab,
  setTabBadge,
  type LiveEvent,
  type LiveState,
  type SessionSummary,
  type StoredScan,
} from "./shared";

const $ = <T extends HTMLElement = HTMLElement>(sel: string) => document.querySelector(sel) as T;

/** Tiny DOM helper. All content goes through textContent — nothing is ever rendered as HTML. */
function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, text?: string, children: Node[] = []) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined) n.textContent = text;
  children.forEach((c) => n.appendChild(c));
  return n;
}

const RISK_TEXT = { high: "High risk", medium: "Medium risk", low: "Low risk" } as const;
const time = (t: number) => new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

function renderReport(target: HTMLElement, report: Report, messageText?: string) {
  target.replaceChildren();
  const status = "status" in report ? ` · site ${report.status}` : "";
  target.append(
    el("div", `verdict v-${report.riskLevel}`, undefined, [
      el("strong", undefined, `${report.verdict.label} — ${RISK_TEXT[report.riskLevel]}`),
      el("span", "meta", `Risk score ${report.score}/100${status}${report.kind === "message" && report.critical?.active ? " · CRITICAL" : ""}`),
    ]),
    el("p", "summary", report.verdict.description),
  );
  if (report.kind === "page" && report.hostname) target.append(el("p", "mono muted", report.hostname));

  const warnings = report.findings.filter((f) => f.severity !== "info");
  if (warnings.length) {
    const ul = el("ul", "findings");
    for (const f of warnings.slice(0, 6)) {
      const li = el("li", `sev-${f.severity}`, undefined, [el("b", undefined, f.title)]);
      for (const e of f.evidence.slice(0, 2)) li.append(el("q", undefined, e.text));
      if (f.detail) li.append(el("small", "mono", f.detail));
      li.append(el("p", undefined, f.explanation));
      ul.append(li);
    }
    target.append(ul);
  }
  const steps = el("ol", "steps");
  for (const s of report.nextSteps) steps.append(el("li", undefined, s));
  target.append(el("p", "label", "What to do next"), steps, el("p", "verify", report.verifyAdvice));

  const rows = checkRows(report);
  if (rows.length) {
    const list = el("ul", "checks");
    for (const row of rows) {
      const dot = row.tone === "strong" ? "dot-high" : row.tone === "warning" ? "dot-medium" : row.tone === "passed" ? "dot-low" : "dot-none";
      const body = el("div", "check-body", undefined, [el("p", undefined, row.explanation)]);
      for (const e of row.evidence.slice(0, 4)) body.append(el("p", "mono check-evidence", e));
      if (row.recommendation) body.append(el("p", "check-do", `→ ${row.recommendation}`));
      list.append(
        el("li", undefined, undefined, [
          el("details", undefined, undefined, [
            el("summary", "ev-head", undefined, [el("span", `dot ${dot}`), el("span", "trunc", `${row.icon} ${row.label}`), el("span", `check-outcome tone-${row.tone}`, row.outcome)]),
            body,
          ]),
        ]),
      );
    }
    target.append(el("details", "checks-wrap", undefined, [el("summary", "label", `Checks performed (${rows.length}) — tap a check for details`), list]));
  }

  const copy = el("button", "btn btn-ghost", "Copy incident report");
  copy.addEventListener("click", async () => {
    await navigator.clipboard.writeText(formatIncidentReport(report, { messageText }));
    copy.textContent = "Copied ✓";
    setTimeout(() => (copy.textContent = "Copy incident report"), 1500);
  });
  target.append(copy);
}

// ---------- tabs ----------
function selectTab(name: string) {
  document.querySelectorAll<HTMLButtonElement>("[data-tab]").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.tab === name)));
  document.querySelectorAll<HTMLElement>("[data-panel]").forEach((p) => (p.hidden = p.dataset.panel !== name));
  if (name === "history") void renderHistory();
}
document.querySelectorAll<HTMLButtonElement>("[data-tab]").forEach((btn) => btn.addEventListener("click", () => selectTab(btn.dataset.tab!)));

// ---------- scan this page ----------
$("#scan-page").addEventListener("click", async () => {
  const out = $("#page-result");
  const btn = $<HTMLButtonElement>("#scan-page");
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id || !isScannableUrl(tab.url)) {
    out.replaceChildren(el("p", "error", "This page can't be scanned. Chrome doesn't let extensions read its own pages (chrome://…, new tab, Web Store). Open a normal website and try again."));
    return;
  }
  btn.disabled = true;
  btn.textContent = "Scanning…";
  try {
    const report = await scanTab(tab.id, tab.url);
    await setTabBadge(tab.id, report.riskLevel);
    await saveScan({ report, origin: "page" });
    renderReport(out, report);
  } finally {
    btn.disabled = false;
    btn.textContent = "Scan this page";
  }
});

// ---------- message ----------
$("#scan-msg").addEventListener("click", async () => {
  const text = $<HTMLTextAreaElement>("#msg").value.trim();
  const out = $("#msg-result");
  if (text.length < 10) {
    out.replaceChildren(el("p", "error", "Paste a little more of the message so CUSTODI has something to check."));
    return;
  }
  const channel = $<HTMLSelectElement>("#channel").value as Channel;
  const report = analyzeMessage({ text, channel }, { trustedDomains: await getTrustedDomains() });
  await saveScan({ report, origin: "message" });
  renderReport(out, report, text);
});

// ---------- Live Observe ----------
let minutes = 30;
document.querySelectorAll<HTMLButtonElement>(".seg [data-min]").forEach((b) =>
  b.addEventListener("click", () => {
    minutes = Number(b.dataset.min);
    document.querySelectorAll<HTMLButtonElement>(".seg [data-min]").forEach((x) => x.setAttribute("aria-checked", String(x === b)));
  }),
);

let timer: number | undefined;
const fmt = (ms: number) => {
  const s = Math.max(0, Math.round(ms / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
};

function eventItem(e: LiveEvent) {
  const head = el("summary", "ev-head", undefined, [
    el("span", `dot dot-${e.risk}`),
    el("span", "trunc mono", `${e.host}${e.path && e.path !== "/" ? e.path : ""}`),
    el("span", "muted", `${RISK_TEXT[e.risk]} · ${time(e.at)}`),
  ]);
  const body = el("div", "ev-body");
  if (e.findings.length === 0) body.append(el("p", "muted", "No warning signs on this page. That doesn't prove the site is genuine."));
  for (const f of e.findings)
    body.append(el("p", undefined, `${f.severity === "strong" ? "●" : "○"} ${f.title}${f.evidence ? ` — “${f.evidence}”` : f.detail ? ` — ${f.detail}` : ""}`));
  if (e.action) body.append(el("p", "act", `→ ${e.action}`));
  const d = el("details", undefined, undefined, [head, body]);
  if (e.risk !== "low") d.open = true;
  return el("li", undefined, undefined, [d]);
}

function renderSummary(s: SessionSummary | null, live: LiveState | null) {
  const wrap = $("#live-summary");
  wrap.hidden = !s || !!live;
  if (!s || live) return;
  const body = $("#summary-body");
  const mins = Math.max(1, Math.round((s.endedAt - s.startedAt) / 60000));
  body.replaceChildren(
    el("p", "muted", `${time(s.startedAt)}–${time(s.endedAt)} · ${mins} min · ${s.endedBy === "user" ? "stopped by you" : "timer ended"}`),
    el("div", "stats", undefined, [
      el("div", undefined, undefined, [el("b", undefined, String(s.pagesScanned)), el("span", undefined, "pages")]),
      el("div", undefined, undefined, [el("b", undefined, String(s.counts.high)), el("span", undefined, "high")]),
      el("div", undefined, undefined, [el("b", undefined, String(s.counts.medium)), el("span", undefined, "medium")]),
      el("div", undefined, undefined, [el("b", undefined, String(s.counts.low)), el("span", undefined, "low")]),
    ]),
  );
  if (s.skipped) body.append(el("p", "tiny", `${s.skipped} page(s) couldn't be checked (browser or Web Store pages).`));
  const risky = s.events.filter((e) => e.risk !== "low");
  if (risky.length) {
    const ul = el("ul", "events");
    risky.forEach((e) => ul.append(eventItem(e)));
    body.append(el("p", "label", "Pages that need attention"), ul);
  } else if (s.pagesScanned) {
    body.append(el("p", "tiny", "No page in this session showed warning signs."));
  }
}

async function renderLive() {
  const live = await getLive();
  const { lastSession } = (await chrome.storage.local.get("lastSession")) as { lastSession?: SessionSummary };
  const on = !!live?.active && live.endsAt > Date.now();
  $("#live-off").hidden = on;
  $("#live-on").hidden = !on;
  const chip = $("#status-chip");
  chip.className = `chip ${on ? "chip-on" : "chip-off"}`;
  if (timer) clearInterval(timer);
  renderSummary(lastSession ?? null, on ? live : null);
  if (on && live) {
    const tick = () => {
      const left = live.endsAt - Date.now();
      $("#live-timer").textContent = fmt(left);
      chip.textContent = `Live Observe ON · ${fmt(left)}`;
      if (left <= 0) void renderLive();
    };
    tick();
    timer = window.setInterval(tick, 1000);
    const ul = $("#live-events");
    ul.replaceChildren();
    if (!live.events.length) ul.append(el("li", "muted", "Nothing checked yet. Switch to a tab or load a page."));
    live.events.forEach((e) => ul.append(eventItem(e)));
  } else {
    chip.textContent = "Live Observe off";
  }
}

$("#live-start").addEventListener("click", async () => {
  const err = $("#live-error");
  err.hidden = true;
  // Must be requested from your click. Without it Live Observe can't read the pages you visit.
  const granted = await chrome.permissions.request({ origins: ["<all_urls>"] });
  if (!granted) {
    err.textContent = "Live Observe needs that permission to check pages during the session. Nothing was started. You can still use “This page” without it.";
    err.hidden = false;
    return;
  }
  await chrome.runtime.sendMessage({ type: "live:start", minutes });
  await renderLive();
});

$("#live-stop").addEventListener("click", async () => {
  await chrome.runtime.sendMessage({ type: "live:stop" });
  await renderLive();
});

chrome.storage.onChanged.addListener((changes) => {
  if (changes.live || changes.lastSession) void renderLive();
});

// ---------- history ----------
async function renderHistory() {
  const { history = [] } = (await chrome.storage.local.get("history")) as { history?: StoredScan[] };
  const ul = $("#history");
  ul.replaceChildren();
  if (!history.length) ul.append(el("li", "muted", "No scans yet. Try “Scan this page”."));
  for (const h of history.slice(0, 40)) {
    const r = h.report;
    const label = r.kind === "message" ? "Message" : r.kind === "url" ? (r.hostname ?? r.input) : (r.hostname ?? r.url);
    ul.append(
      el("li", "ev-head", undefined, [
        el("span", `dot dot-${r.riskLevel}`),
        el("span", "trunc mono", label),
        el("span", "muted", `${h.origin} · ${new Date(r.analyzedAt).toLocaleDateString()}`),
      ]),
    );
  }
}

$("#export").addEventListener("click", async () => {
  const { history = [], lastSession = null } = await chrome.storage.local.get(["history", "lastSession"]);
  const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), history, lastSession }, null, 2)], { type: "application/json" });
  const a = el("a");
  a.href = URL.createObjectURL(blob);
  a.download = `custodi-extension-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
});

$("#clear").addEventListener("click", async () => {
  if (!confirm("Delete all CUSTODI scan history and the last session summary stored in this browser?")) return;
  await chrome.storage.local.remove(["history", "lastSession"]);
  await renderHistory();
  await renderLive();
});

// ---------- first-open intro (once; replayable from the footer) ----------
function playIntro() {
  const intro = $("#intro");
  intro.hidden = false;
  // restart CSS animations
  intro.querySelectorAll<HTMLElement>("*").forEach((n) => {
    n.style.animation = "none";
    void n.offsetWidth;
    n.style.animation = "";
  });
  intro.style.animation = "none";
  void intro.offsetWidth;
  intro.style.animation = "";
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const end = () => {
    intro.hidden = true;
    void chrome.storage.local.set({ introSeen: true });
  };
  const t = window.setTimeout(end, reduced ? 1200 : 2500);
  $("#intro-skip").onclick = () => {
    clearTimeout(t);
    end();
  };
}
$("#replay-intro").addEventListener("click", playIntro);

void (async () => {
  const { introSeen } = await chrome.storage.local.get("introSeen");
  if (!introSeen) playIntro();
  await renderLive();
  const live = await getLive();
  if (live?.active && live.endsAt > Date.now()) selectTab("live");
})();
