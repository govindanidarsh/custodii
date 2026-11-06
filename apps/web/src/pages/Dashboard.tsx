import type { Report, RiskLevel } from "@custodi/core";
import { AnimatePresence, motion } from "framer-motion";
import { FileDown, Globe, MessageSquareText, PanelTop, Search, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import GettingStarted from "../components/GettingStarted";
import ReportView from "../components/ReportView";
import { downloadText, stamp } from "../lib/download";
import { clearHistory, deleteScan, useHistory, useSettings, type HistoryEntry } from "../lib/store";
import { ArtEmptyScans } from "../ui/Art";
import { RiskBadge, Tag } from "../ui/Badge";
import { Button, ButtonLink } from "../ui/Button";
import { BarList, DistributionBar, Stat, TrendChart, type DayBucket } from "../ui/Charts";
import { InfoTip, Notice, useToast } from "../ui/Feedback";
import { Input, Select } from "../ui/Field";
import { Container, EmptyState, PageHeader, SectionTitle } from "../ui/Layout";

const KIND = { message: { label: "Message", Icon: MessageSquareText }, url: { label: "Website", Icon: Globe }, page: { label: "Page", Icon: PanelTop } };

export function subjectOf(r: Report): string {
  if (r.kind === "message") return `${{ email: "Email", sms: "SMS", whatsapp: "WhatsApp", other: "Message" }[r.channel]}${r.sender ? ` from ${r.sender}` : ""}`;
  if (r.kind === "url") return r.hostname ?? r.input;
  return r.hostname ?? r.url;
}

function lastDays(history: HistoryEntry[], n = 14): DayBucket[] {
  const days: DayBucket[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    days.push({ label: d.toLocaleDateString(undefined, { day: "numeric", month: "short" }).replace(" ", " "), date: d.toDateString(), high: 0, medium: 0, low: 0 });
  }
  for (const h of history) {
    const key = new Date(h.report.analyzedAt).toDateString();
    const b = days.find((d) => d.date === key);
    if (b) b[h.report.riskLevel] += 1;
  }
  return days;
}

function toCsv(history: HistoryEntry[]) {
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const rows = [["date", "type", "subject", "risk", "verdict", "score", "site_status", "warning_signs", "origin"]];
  for (const h of history) {
    const r = h.report;
    rows.push([
      r.analyzedAt,
      r.kind,
      subjectOf(r),
      r.riskLevel,
      r.verdict?.label ?? "",
      String(r.score ?? ""),
      "status" in r ? r.status : "",
      r.findings.filter((f) => f.severity !== "info").map((f) => f.title).join("; "),
      h.origin,
    ]);
  }
  return rows.map((row) => row.map(esc).join(",")).join("\n");
}

function ConfirmClear({ count, onClose }: { count: number; onClose: () => void }) {
  const toast = useToast();
  const btn = useRef<HTMLButtonElement>(null);
  useEffect(() => btn.current?.focus(), []);
  return (
    <motion.div className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/40 p-4 sm:items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="clear-title"
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.key === "Escape" && onClose()}
        className="panel w-full max-w-md p-6 shadow-card"
      >
        <h2 id="clear-title" className="t-h3">
          Delete all {count} scans?
        </h2>
        <p className="mt-2 text-sm text-muted">This removes your scan history and reports from this browser. It can't be undone. Export first if you want a copy.</p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            ref={btn}
            variant="danger"
            onClick={() => {
              clearHistory();
              toast("History cleared");
              onClose();
            }}
          >
            <Trash2 className="h-4 w-4" /> Delete everything
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function ReportDrawer({ entry, onClose }: { entry: HistoryEntry; onClose: () => void }) {
  const toast = useToast();
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  const r = entry.report;
  return (
    <motion.div className="fixed inset-0 z-50 flex justify-end bg-ink/40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.aside
        role="dialog"
        aria-modal="true"
        aria-label="Scan report"
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 32, stiffness: 280 }}
        onClick={(e) => e.stopPropagation()}
        className="h-full w-full max-w-2xl overflow-y-auto border-l border-line bg-bg"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-line bg-bg/95 px-5 py-4 backdrop-blur">
          <div className="min-w-0">
            <p className="t-eyebrow text-muted">{new Date(r.analyzedAt).toLocaleString()}</p>
            <h2 className="truncate font-medium text-ink">{subjectOf(r)}</h2>
          </div>
          <button ref={closeRef} aria-label="Close report" onClick={onClose} className="rounded-full p-2 hover:bg-surface-2">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-4 p-5">
          {r.kind !== "message" && <p className="break-all rounded-xl bg-surface-2 p-3 font-mono text-xs text-ink-2">{r.kind === "url" ? r.input : r.url}</p>}
          {r.kind === "message" && !entry.messageText && (
            <Notice tone="info">The full message wasn't saved (privacy default). The quoted evidence below was kept. You can change this in Settings.</Notice>
          )}
          <ReportView report={r} messageText={entry.messageText} />
          <Button
            variant="danger"
            size="sm"
            onClick={() => {
              deleteScan(r.id);
              toast("Scan deleted");
              onClose();
            }}
          >
            <Trash2 className="h-4 w-4" /> Delete this scan
          </Button>
        </div>
      </motion.aside>
    </motion.div>
  );
}

export default function Dashboard() {
  const history = useHistory();
  const settings = useSettings();
  const navigate = useNavigate();
  const toast = useToast();
  const [selected, setSelected] = useState<HistoryEntry | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [q, setQ] = useState("");
  const [risk, setRisk] = useState<RiskLevel | "all">("all");
  const [kind, setKind] = useState<Report["kind"] | "all">("all");

  const counts = useMemo(() => {
    const c: Record<RiskLevel, number> = { high: 0, medium: 0, low: 0 };
    history.forEach((h) => (c[h.report.riskLevel] += 1));
    return c;
  }, [history]);
  const days = useMemo(() => lastDays(history), [history]);
  const week = useMemo(() => history.filter((h) => Date.now() - new Date(h.report.analyzedAt).getTime() < 7 * 864e5).length, [history]);
  const categories = useMemo(() => {
    const m = new Map<string, { n: number; strong: boolean }>();
    history.forEach((h) =>
      h.report.findings
        .filter((f) => f.severity !== "info")
        .forEach((f) => {
          const cur = m.get(f.title) ?? { n: 0, strong: false };
          m.set(f.title, { n: cur.n + 1, strong: cur.strong || f.severity === "strong" });
        }),
    );
    return Array.from(m.entries())
      .sort((a, b) => b[1].n - a[1].n)
      .slice(0, 6)
      .map(([label, v]) => ({ label, value: v.n, tone: v.strong ? ("high" as const) : ("medium" as const) }));
  }, [history]);
  const samples = history.filter((h) => h.origin === "sample").length;

  const list = history.filter(
    (h) =>
      (risk === "all" || h.report.riskLevel === risk) &&
      (kind === "all" || h.report.kind === kind) &&
      (!q.trim() || `${subjectOf(h.report)} ${h.report.findings.map((f) => f.title).join(" ")}`.toLowerCase().includes(q.trim().toLowerCase())),
  );

  const actions = (
    <>
      <Button
        variant="secondary"
        size="sm"
        disabled={!history.length}
        onClick={() => {
          downloadText(`custodi-history-${stamp()}.json`, JSON.stringify({ exportedAt: new Date().toISOString(), scans: history }, null, 2), "application/json");
          toast("Exported JSON");
        }}
      >
        <FileDown className="h-4 w-4" /> JSON
      </Button>
      <Button
        variant="secondary"
        size="sm"
        disabled={!history.length}
        onClick={() => {
          downloadText(`custodi-history-${stamp()}.csv`, toCsv(history), "text/csv");
          toast("Exported CSV");
        }}
      >
        <FileDown className="h-4 w-4" /> CSV
      </Button>
      <Button variant="danger" size="sm" disabled={!history.length} onClick={() => setConfirm(true)}>
        <Trash2 className="h-4 w-4" /> Clear history
      </Button>
    </>
  );

  return (
    <Container wide className="pt-10 md:pt-14">
      <PageHeader
        eyebrow="Dashboard"
        title="Your scan activity"
        description="Every number here comes from scans you ran on this device. Nothing is invented and nothing is uploaded."
        actions={actions}
      />

      {!settings.keepHistory && (
        <div className="mt-6">
          <Notice tone="warning">History saving is off, so new scans won't appear here. Turn it on in Settings.</Notice>
        </div>
      )}

      {history.length === 0 ? (
        <div className="mt-8 space-y-6">
          <div className="panel">
            <EmptyState
              art={<ArtEmptyScans />}
              title="Nothing scanned yet"
              actions={
                <>
                  <ButtonLink to="/scan">Scan a message</ButtonLink>
                  <ButtonLink to="/website" variant="secondary">
                    Check a link
                  </ButtonLink>
                </>
              }
            >
              Your dashboard fills up as you scan. Not sure where to start? Open the scanner and tap one of the fictional samples — it's labelled as a sample
              here so it never looks like a real threat.
            </EmptyState>
          </div>
          <GettingStarted />
        </div>
      ) : (
        <div className="mt-8 space-y-6">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat label="Total scans" value={history.length} sub={`${week} in the last 7 days`} />
            <Stat label="Suspicious" value={counts.high} tone="high" sub="High risk" />
            <Stat label="Caution" value={counts.medium} tone="medium" sub="Medium risk" />
            <Stat label="Low risk" value={counts.low} tone="low" sub="No red flags found" />
          </div>
          {samples > 0 && (
            <p className="text-xs text-muted">
              {samples} of these scan{samples > 1 ? "s were" : " was"} run on CUSTODI's fictional samples and {samples > 1 ? "are" : "is"} tagged <Tag>sample</Tag> below.
            </p>
          )}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.6fr_1fr]">
            <section className="panel p-5 sm:p-6">
              <SectionTitle title="Risk trend" hint="Scans per day · last 14 days" />
              <TrendChart days={days} />
            </section>
            <section className="panel p-5 sm:p-6">
              <SectionTitle title="Risk distribution" hint={`${history.length} scans in total`} />
              <DistributionBar counts={counts} />
            </section>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.6fr]">
            <section className="panel p-5 sm:p-6">
              <SectionTitle
                title="Detected threat categories"
                hint={
                  <span className="inline-flex items-center gap-1">
                    How often each warning sign appeared
                    <InfoTip>Red bars include at least one strong sign (e.g. OTP or fee request). Amber bars are warning signs only.</InfoTip>
                  </span>
                }
              />
              <BarList items={categories} empty="No warning signs found in your scans so far." />
            </section>

            <section className="panel p-5 sm:p-6">
              <SectionTitle title="Recent activity" />
              <ol className="relative space-y-4 border-l border-line pl-5">
                {history.slice(0, 6).map((h) => {
                  const top = h.report.findings.find((f) => f.severity !== "info");
                  return (
                    <li key={h.report.id} className="relative">
                      <span className={`absolute top-1.5 -left-[25px] h-2.5 w-2.5 rounded-full ring-4 ring-surface ${h.report.riskLevel === "high" ? "bg-high" : h.report.riskLevel === "medium" ? "bg-medium" : "bg-low"}`} />
                      <button onClick={() => setSelected(h)} className="block w-full text-left">
                        <p className="text-sm text-ink hover:text-accent">
                          <b className="font-medium">{h.report.verdict?.label ?? h.report.headline}</b> · {subjectOf(h.report)}
                        </p>
                        <p className="text-xs text-muted">
                          {new Date(h.report.analyzedAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
                          {top ? ` · ${top.title}` : ""}
                        </p>
                      </button>
                    </li>
                  );
                })}
              </ol>
            </section>
          </div>

          <section className="panel overflow-hidden">
            <div className="flex flex-col gap-3 border-b border-line p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <h2 className="t-h3">Scan history</h2>
              <div className="flex flex-wrap gap-2">
                <div className="relative">
                  <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted" />
                  <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" aria-label="Search scans" className="h-9 w-40 pl-9 text-sm" />
                </div>
                <Select value={risk} onChange={(e) => setRisk(e.target.value as RiskLevel | "all")} aria-label="Filter by risk" className="h-9 w-auto text-sm">
                  <option value="all">All risks</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </Select>
                <Select value={kind} onChange={(e) => setKind(e.target.value as Report["kind"] | "all")} aria-label="Filter by type" className="h-9 w-auto text-sm">
                  <option value="all">All types</option>
                  <option value="message">Messages</option>
                  <option value="url">Websites</option>
                </Select>
              </div>
            </div>
            <ul className="divide-y divide-line">
              {list.slice(0, 100).map((h) => {
                const { Icon, label } = KIND[h.report.kind];
                const signs = h.report.findings.filter((f) => f.severity !== "info");
                return (
                  <li key={h.report.id}>
                    <button onClick={() => setSelected(h)} className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-4 px-5 py-4 text-left hover:bg-surface-2 sm:px-6">
                      <Icon className="h-5 w-5 text-muted" aria-label={label} />
                      <span className="min-w-0">
                        <span className="flex items-center gap-2">
                          <span className="truncate text-sm font-medium text-ink">{subjectOf(h.report)}</span>
                          {h.origin === "sample" && <Tag>sample</Tag>}
                          {h.origin === "pwa-share" && <Tag tone="accent">shared</Tag>}
                        </span>
                        <span className="block truncate text-xs text-muted">
                          {new Date(h.report.analyzedAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })} ·{" "}
                          {signs.length ? signs.map((f) => f.title).slice(0, 2).join(" · ") : "No warning signs"}
                        </span>
                      </span>
                      <RiskBadge level={h.report.riskLevel} size="sm" />
                    </button>
                  </li>
                );
              })}
              {list.length === 0 && <li className="p-8 text-center text-sm text-muted">No scans match these filters.</li>}
            </ul>
          </section>
          <p className="text-xs text-muted">
            Want more context? <button className="py-2 text-accent underline underline-offset-2" onClick={() => navigate("/help#risk")}>How CUSTODI decides a risk level</button>
          </p>
        </div>
      )}

      <AnimatePresence>
        {selected && <ReportDrawer entry={selected} onClose={() => setSelected(null)} />}
        {confirm && <ConfirmClear count={history.length} onClose={() => setConfirm(false)} />}
      </AnimatePresence>
    </Container>
  );
}
