import { CheckCircle2, CircleSlash, MousePointerClick, Square } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { useExtension, type LiveEventDTO, type SessionSummaryDTO } from "../lib/extension";
import { ArtLive } from "../ui/Art";
import { RiskBadge } from "../ui/Badge";
import { Button, ButtonLink } from "../ui/Button";
import { Notice, useToast } from "../ui/Feedback";
import { Container, PageHeader } from "../ui/Layout";

const fmt = (ms: number) => {
  const s = Math.max(0, Math.round(ms / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
};
const time = (t: number) => new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

function EventList({ events }: { events: LiveEventDTO[] }) {
  if (!events.length) return <p className="text-sm text-muted">No pages checked yet. Switch to a tab or load a page in Chrome.</p>;
  return (
    <ol className="divide-y divide-line">
      {events.map((e) => (
        <li key={`${e.at}-${e.host}`} className="py-4">
          <div className="flex flex-wrap items-center gap-2">
            <RiskBadge level={e.risk} size="sm" />
            <span className="font-mono text-sm break-all text-ink">
              {e.host}
              <span className="text-muted">{e.path !== "/" ? e.path : ""}</span>
            </span>
            <span className="ml-auto font-mono text-xs text-muted">{time(e.at)}</span>
          </div>
          {e.findings.length > 0 ? (
            <ul className="mt-2 space-y-1 text-sm text-ink-2">
              {e.findings.map((f) => (
                <li key={f.title}>
                  <span className={f.severity === "strong" ? "text-high" : "text-medium"}>●</span> {f.title}
                  {f.evidence && <q className={`ml-1 px-1 font-mono text-xs ${f.severity === "strong" ? "mark-strong" : "mark-supporting"}`}>{f.evidence}</q>}
                  {f.detail && !f.evidence && <span className="ml-1 font-mono text-xs text-muted">{f.detail}</span>}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 text-sm text-muted">No warning signs on this page. That doesn't prove the site is genuine.</p>
          )}
          {e.action && e.risk !== "low" && <p className="mt-2 text-sm font-medium text-accent">→ {e.action}</p>}
        </li>
      ))}
    </ol>
  );
}

function Summary({ s }: { s: SessionSummaryDTO }) {
  const risky = s.events.filter((e) => e.risk !== "low");
  return (
    <section className="panel p-5 sm:p-6">
      <p className="t-eyebrow text-muted">Last session summary</p>
      <p className="mt-2 text-sm text-ink-2">
        {new Date(s.startedAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })} · {Math.max(1, Math.round((s.endedAt - s.startedAt) / 60000))} of{" "}
        {s.minutes} min · {s.endedBy === "user" ? "stopped by you" : "ended when the timer ran out"}
      </p>
      <dl className="mt-5 grid grid-cols-4 gap-3">
        {[
          ["Pages", s.pagesScanned, "text-ink"],
          ["High", s.counts.high, "text-high"],
          ["Medium", s.counts.medium, "text-medium"],
          ["Low", s.counts.low, "text-low"],
        ].map(([l, v, c]) => (
          <div key={l as string}>
            <dt className="text-xs text-muted">{l}</dt>
            <dd className={`font-display text-4xl leading-none ${c}`}>{v}</dd>
          </div>
        ))}
      </dl>
      {s.skipped > 0 && <p className="mt-3 text-xs text-muted">{s.skipped} page(s) couldn't be checked (Chrome settings pages or the Web Store).</p>}
      <div className="mt-5 border-t border-line pt-2">
        {risky.length ? (
          <>
            <p className="mt-3 text-sm font-medium text-ink">Pages that need attention</p>
            <EventList events={risky} />
          </>
        ) : (
          <p className="mt-3 text-sm text-muted">No page in this session showed warning signs.</p>
        )}
      </div>
    </section>
  );
}

function Status() {
  const { state, stop } = useExtension(2000);
  const toast = useToast();
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (state.kind === "checking") return <div className="panel p-6 text-sm text-muted">Looking for the CUSTODI extension…</div>;

  if (state.kind === "unsupported")
    return (
      <div className="panel p-6">
        <p className="t-h3">Live Observe needs desktop Chrome</p>
        <p className="mt-2 text-sm text-muted">
          It's part of the CUSTODI Chrome extension, which runs on desktop Chrome, Edge or Brave. Phones don't support extensions — on mobile, use the{" "}
          <Link to="/scan" className="text-accent underline">
            message scanner
          </Link>{" "}
          and{" "}
          <Link to="/website" className="text-accent underline">
            website check
          </Link>{" "}
          instead.
        </p>
      </div>
    );

  if (state.kind === "not-connected")
    return (
      <div className="panel p-6">
        <p className="t-h3">Extension not detected</p>
        <p className="mt-2 text-sm text-muted">
          Install the CUSTODI extension to use Live Observe. If it's installed, make sure you opened this page at <span className="font-mono">localhost</span> —
          the extension only talks to CUSTODI running on your own computer — then reload.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <ButtonLink to="/extension">Install the extension</ButtonLink>
          <Button variant="secondary" onClick={() => window.location.reload()}>
            Check again
          </Button>
        </div>
      </div>
    );

  const live = state.live?.active ? state.live : null;
  if (live) {
    const left = live.endsAt - now;
    return (
      <div className="space-y-6">
        <section className="overflow-hidden rounded-[var(--radius-card)] border border-lime/40 bg-lime-soft">
          <div className="flex flex-wrap items-center gap-6 p-6">
            <div>
              <p className="flex items-center gap-2 font-mono text-xs font-semibold tracking-widest text-lime uppercase">
                <span className="animate-live h-2.5 w-2.5 rounded-full bg-lime" /> Live Observe is ON
              </p>
              <p className="mt-2 font-display text-7xl leading-none text-ink tabular-nums" aria-label={`${fmt(left)} remaining`}>
                {fmt(left)}
              </p>
              <p className="mt-2 text-sm text-ink-2">
                {live.minutes}-minute session · started {time(live.startedAt)} · {live.events.length} page{live.events.length === 1 ? "" : "s"} checked
              </p>
            </div>
            <Button
              variant="danger"
              size="lg"
              className="ml-auto bg-surface"
              onClick={async () => {
                await stop();
                toast("Live Observe stopped");
              }}
            >
              <Square className="h-4 w-4 fill-current" /> Stop now
            </Button>
          </div>
        </section>
        <section className="panel p-5 sm:p-6">
          <h2 className="t-h3">Pages checked this session</h2>
          <p className="mt-1 text-sm text-muted">Newest first. Updates every 2 seconds.</p>
          <div className="mt-2">
            <EventList events={live.events} />
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="panel p-6">
        <p className="flex items-center gap-2 text-sm font-medium text-low">
          <CheckCircle2 className="h-4 w-4" /> Extension connected (v{state.version})
        </p>
        <p className="t-h3 mt-3">Live Observe is off</p>
        <p className="mt-1 text-sm text-muted">Start a session from the extension. This page will show the timer, results and a Stop button while it runs.</p>
        <ol className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {["Click the CUSTODI icon in Chrome's toolbar", "Open the Live Observe tab and pick 15, 30 or 60 minutes", "Press Start and allow the permission Chrome asks for"].map((s, i) => (
            <li key={s} className="rounded-xl bg-surface-2 p-4 text-sm text-ink-2">
              <span className="font-mono text-xs text-accent">0{i + 1}</span>
              <p className="mt-1">{s}</p>
            </li>
          ))}
        </ol>
        <p className="mt-4 flex items-start gap-2 text-xs text-muted">
          <MousePointerClick className="mt-0.5 h-3.5 w-3.5 flex-none" /> Why not a Start button here? Chrome only lets an extension ask for permission after you click
          inside the extension itself. A website can't — and shouldn't — switch monitoring on for you.
        </p>
      </section>
      {state.lastSession && <Summary s={state.lastSession} />}
    </div>
  );
}

export default function Live() {
  return (
    <Container wide className="pt-10 md:pt-14">
      <PageHeader
        eyebrow="Live Observe · Chrome extension"
        title="Protection you switch on — and off."
        description="A timed session in Chrome. While it runs, CUSTODI checks the tab you're looking at and flags risky pages with evidence and a next step. When it ends, you get a summary."
        actions={
          <ButtonLink to="/extension" variant="secondary">
            Extension guide
          </ButtonLink>
        }
      />

      <div className="mt-8 grid grid-cols-1 items-start gap-8 lg:grid-cols-[1.25fr_1fr]">
        <Status />

        <aside className="space-y-4 lg:sticky lg:top-24">
          <div className="panel p-5">
            <div className="mx-auto w-40">
              <ArtLive />
            </div>
            <h2 className="t-h3 mt-4">What it can see</h2>
            <ul className="mt-3 space-y-2 text-sm text-ink-2">
              {[
                "Only the Chrome tab you're currently viewing",
                "That page's address, visible text and which kinds of sensitive fields it has",
                "Only while a session you started is running — with a visible timer and ON badge",
              ].map((t) => (
                <li key={t} className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none text-low" /> {t}
                </li>
              ))}
            </ul>
            <h2 className="t-h3 mt-6">What it can't see</h2>
            <ul className="mt-3 space-y-2 text-sm text-ink-2">
              {[
                "WhatsApp, SMS, email apps or anything outside Chrome",
                "What you type, your passwords or other tabs in the background",
                "Anything after the timer ends or you press Stop",
              ].map((t) => (
                <li key={t} className="flex gap-2">
                  <CircleSlash className="mt-0.5 h-4 w-4 flex-none text-high" /> {t}
                </li>
              ))}
            </ul>
          </div>
          <Notice tone="info">
            Results are stored in the extension on your computer — page text is analysed and thrown away. Chrome's "read sites" permission is handed back when
            the session stops.
          </Notice>
        </aside>
      </div>
    </Container>
  );
}
