import {
  CATEGORY_LABEL,
  computeMetrics,
  ENGINE_VERSION,
  runTestCase,
  TEST_CASES,
  type CaseCategory,
  type RiskLevel,
  type TestCase,
  type TestResult,
} from "@custodi/core";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, ChevronDown, CircleDashed, Play, RotateCcw, XCircle } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import ReportView from "../components/ReportView";
import { RiskBadge, Tag } from "../ui/Badge";
import { Button } from "../ui/Button";
import { InfoTip, Notice } from "../ui/Feedback";
import { Select } from "../ui/Field";
import { Container, PageHeader } from "../ui/Layout";

const pct = (n: number | null) => (n === null ? "—" : `${(n * 100).toFixed(1)}%`);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function Matrix({ tp, tn, fp, fn }: { tp: number; tn: number; fp: number; fn: number }) {
  const cell = (n: number, label: string, desc: string, bad = false) => (
    <div className={`rounded-xl p-4 ${bad ? (n ? "bg-high-soft" : "bg-surface-2") : "bg-low-soft"}`}>
      <p className={`font-display text-4xl leading-none ${bad && n ? "text-high" : "text-ink"}`}>{n}</p>
      <p className="mt-2 font-mono text-[11px] font-semibold tracking-wider text-ink uppercase">{label}</p>
      <p className="text-xs text-muted">{desc}</p>
    </div>
  );
  return (
    <div>
      <div className="grid grid-cols-[auto_1fr_1fr] gap-2 text-xs">
        <span />
        <p className="pb-1 text-center text-muted">CUSTODI warned</p>
        <p className="pb-1 text-center text-muted">CUSTODI didn't warn</p>
        <p className="flex items-center pr-2 text-right text-muted [writing-mode:vertical-rl] rotate-180 sm:[writing-mode:horizontal-tb] sm:rotate-0">Should warn</p>
        {cell(tp, "True positive", "Risky, caught")}
        {cell(fn, "False negative", "Risky, missed", true)}
        <p className="flex items-center pr-2 text-right text-muted [writing-mode:vertical-rl] rotate-180 sm:[writing-mode:horizontal-tb] sm:rotate-0">Shouldn't warn</p>
        {cell(fp, "False positive", "Harmless, flagged", true)}
        {cell(tn, "True negative", "Harmless, calm")}
      </div>
    </div>
  );
}

function CaseInput({ c }: { c: TestCase }) {
  const text =
    c.kind === "message"
      ? `Channel: ${c.channel}\nSender: ${c.sender ?? "(not given)"}${
          c.context ? `\nContext: expected=${c.context.expected ?? "-"}, recognised=${c.context.recognised ?? "-"}, asked to=${c.context.askedTo?.join("/") ?? "-"}` : "\nContext: (questions skipped)"
        }\n\n${c.text}`
      : c.kind === "url"
        ? `${c.url}${c.trustedDomains ? `\n\nTrusted list for this case: ${c.trustedDomains.join(", ")}` : "\n\nTrusted list for this case: (empty)"}`
        : `URL: ${c.signals.url}\nTitle: ${c.signals.title}\nText: ${c.signals.text}\nFields: ${Object.entries(c.signals.fields)
            .filter(([, v]) => v)
            .map(([k, v]) => `${k}×${v}`)
            .join(", ") || "none"}${c.trustedDomains ? `\nTrusted list: ${c.trustedDomains.join(", ")}` : ""}`;
  return <pre className="max-h-72 overflow-auto rounded-xl bg-surface-2 p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap break-words text-ink-2">{text}</pre>;
}

function Row({ c, r, running, onRun }: { c: TestCase; r?: TestResult; running: boolean; onRun: () => void }) {
  const [open, setOpen] = useState(false);
  const expectedStatus = "expectedStatus" in c ? c.expectedStatus : undefined;
  return (
    <li className="border-t border-line first:border-t-0">
      <div className="grid grid-cols-[1fr_auto] items-start gap-3 px-4 py-4 sm:grid-cols-[3.2rem_1fr_9rem_9rem_7rem_auto] sm:items-center sm:px-5">
        <span className="hidden font-mono text-xs text-muted sm:block">{c.id}</span>
        <div className="min-w-0">
          <p className="font-medium text-ink">
            <span className="mr-2 font-mono text-xs text-muted sm:hidden">{c.id}</span>
            {c.title}
          </p>
          <p className="text-xs text-muted">
            {CATEGORY_LABEL[c.category]} · {c.purpose}
          </p>
          {r && <p className={`mt-1.5 text-xs leading-relaxed ${r.passed ? "text-ink-2" : "text-high"}`}>{r.reason}</p>}
          <div className="mt-2 flex flex-wrap items-center gap-2 sm:hidden">
            <span className="text-xs text-muted">Expected</span>
            <RiskBadge level={c.expectedRisk} size="sm" />
            {r && (
              <>
                <span className="text-xs text-muted">Got</span>
                <RiskBadge level={r.actualRisk} size="sm" />
              </>
            )}
          </div>
        </div>
        <div className="hidden sm:block">
          <RiskBadge level={c.expectedRisk} size="sm" />
          {expectedStatus && <p className="mt-1 text-xs text-muted">site: {expectedStatus}</p>}
        </div>
        <div className="hidden sm:block">
          {r ? (
            <>
              <RiskBadge level={r.actualRisk} size="sm" />
              {r.actualStatus && <p className="mt-1 text-xs text-muted">site: {r.actualStatus}</p>}
            </>
          ) : (
            <span className="text-xs text-muted">—</span>
          )}
        </div>
        <div className="col-start-2 row-start-1 flex flex-col items-end gap-1 sm:col-start-auto sm:row-start-auto sm:items-start">
          {running ? (
            <span className="inline-flex items-center gap-1 text-sm text-muted">
              <CircleDashed className="h-4 w-4 animate-spin" /> Running
            </span>
          ) : r ? (
            <span className={`inline-flex items-center gap-1 text-sm font-medium ${r.passed ? "text-low" : "text-high"}`}>
              {r.passed ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
              {r.passed ? "Pass" : "Fail"}
              <span className="ml-1 font-mono text-[11px] font-normal text-muted">{r.outcome}</span>
            </span>
          ) : (
            <span className="text-sm text-muted">Not run</span>
          )}
          {c.knownLimitation && <Tag>known limit</Tag>}
        </div>
        <div className="col-span-2 flex gap-1 sm:col-span-1">
          <Button variant="secondary" size="sm" onClick={onRun} disabled={running} aria-label={`Run test ${c.id}`}>
            <Play className="h-3.5 w-3.5" /> Run
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label={`Details for ${c.id}`}>
            <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
          </Button>
        </div>
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="grid grid-cols-1 gap-5 border-t border-dashed border-line bg-bg px-4 py-5 sm:px-5 lg:grid-cols-2">
              <div>
                <p className="t-eyebrow mb-2 text-muted">Input · fictional</p>
                <CaseInput c={c} />
                {c.knownLimitation && (
                  <div className="mt-3">
                    <Notice tone="warning" title="Known limitation">
                      {c.knownLimitation}
                    </Notice>
                  </div>
                )}
              </div>
              <div>
                <p className="t-eyebrow mb-2 text-muted">Analyzer output</p>
                {r ? (
                  <ReportView report={r.report} messageText={c.kind === "message" ? c.text : undefined} compact />
                ) : (
                  <div className="rounded-xl border border-dashed border-line p-6 text-center text-sm text-muted">
                    Not run yet.{" "}
                    <button className="text-accent underline underline-offset-2" onClick={onRun}>
                      Run this test
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
}

export default function Lab() {
  const [results, setResults] = useState<Map<string, TestResult>>(new Map());
  const [running, setRunning] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [lastRun, setLastRun] = useState<Date | null>(null);
  const [category, setCategory] = useState<CaseCategory | "all">("all");
  const [riskF, setRiskF] = useState<RiskLevel | "all">("all");
  const [state, setState] = useState<"all" | "pass" | "fail" | "not-run">("all");
  const cancel = useRef(false);

  const runOne = (c: TestCase) => {
    const r = runTestCase(c); // real analyzer call
    setResults((m) => new Map(m).set(c.id, r));
    setLastRun(new Date());
    return r;
  };

  async function runAll() {
    setBusy(true);
    cancel.current = false;
    setResults(new Map());
    for (const c of TEST_CASES) {
      if (cancel.current) break;
      setRunning(new Set([c.id]));
      runOne(c);
      await sleep(18); // only so you can watch progress — the analyzer itself takes well under a millisecond
    }
    setRunning(new Set());
    setBusy(false);
  }

  function reset() {
    cancel.current = true;
    setResults(new Map());
    setRunning(new Set());
    setBusy(false);
    setLastRun(null);
  }

  const done = Array.from(results.values());
  const m = computeMetrics(done, done.reduce((s, r) => s + r.durationMs, 0));
  const categories = useMemo(() => Array.from(new Set(TEST_CASES.map((c) => c.category))), []);

  const visible = TEST_CASES.filter((c) => {
    const r = results.get(c.id);
    if (category !== "all" && c.category !== category) return false;
    if (riskF !== "all" && c.expectedRisk !== riskF) return false;
    if (state === "pass" && !r?.passed) return false;
    if (state === "fail" && (!r || r.passed)) return false;
    if (state === "not-run" && r) return false;
    return true;
  });

  const legit = TEST_CASES.filter((c) => c.category === "legitimate").length;

  return (
    <Container wide className="pt-10 md:pt-14">
      <PageHeader
        eyebrow="Test Lab"
        title="Check CUSTODI's work yourself"
        description={`${TEST_CASES.length} fictional cases — placement scams, ${legit} genuine college and job messages, website addresses and page scans — run through the same engine (${ENGINE_VERSION}) the scanner and extension use.`}
        actions={
          <>
            <Button onClick={runAll} disabled={busy}>
              <Play className="h-4 w-4" /> {busy ? `Running ${done.length}/${TEST_CASES.length}…` : "Run all tests"}
            </Button>
            <Button variant="secondary" onClick={reset} disabled={!done.length && !busy}>
              <RotateCcw className="h-4 w-4" /> Reset
            </Button>
          </>
        }
      />

      <div className="mt-6">
        <Notice tone="warning" title="Read these numbers honestly">
          We wrote these cases to exercise CUSTODI's rules. Results show the engine behaves as designed on them — they are not a measure of real-world accuracy.
          Every result below is computed live; failures, if any, are shown with their reason.
        </Notice>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.1fr]">
        <section className="panel p-5 sm:p-6" aria-live="polite">
          <h2 className="t-h3">Results</h2>
          {done.length === 0 ? (
            <p className="mt-3 text-sm text-muted">No tests have run yet. Press “Run all tests”, or run any single case below. Accuracy is only shown once results exist.</p>
          ) : (
            <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-5">
              <div>
                <dt className="text-xs text-muted">Passed</dt>
                <dd className="mt-1 font-display text-5xl leading-none">
                  {m.passed}
                  <span className="text-2xl text-muted">/{m.total}</span>
                </dd>
                <dd className="mt-1 text-xs text-muted">{m.total < TEST_CASES.length ? `${m.total} of ${TEST_CASES.length} cases run` : "all cases run"}</dd>
              </div>
              <div>
                <dt className="flex items-center gap-1 text-xs text-muted">
                  Detection accuracy
                  <InfoTip>(TP + TN) ÷ cases run. Counts whether CUSTODI warned when it should and stayed calm when it should — on these fictional cases only.</InfoTip>
                </dt>
                <dd className="mt-1 font-display text-5xl leading-none">{pct(m.detectionAccuracy)}</dd>
                <dd className="mt-1 text-xs text-muted">exact band match {pct(m.exactMatchRate)}</dd>
              </div>
              <div>
                <dt className="flex items-center gap-1 text-xs text-muted">
                  False-positive rate <InfoTip>FP ÷ (FP + TN): harmless messages wrongly flagged. High values cause alert fatigue.</InfoTip>
                </dt>
                <dd className={`mt-1 font-mono text-xl ${m.falsePositives ? "text-high" : "text-ink"}`}>
                  {pct(m.falsePositiveRate)} <span className="text-sm text-muted">({m.falsePositives})</span>
                </dd>
              </div>
              <div>
                <dt className="flex items-center gap-1 text-xs text-muted">
                  False-negative rate <InfoTip>FN ÷ (FN + TP): risky messages CUSTODI missed.</InfoTip>
                </dt>
                <dd className={`mt-1 font-mono text-xl ${m.falseNegatives ? "text-high" : "text-ink"}`}>
                  {pct(m.falseNegativeRate)} <span className="text-sm text-muted">({m.falseNegatives})</span>
                </dd>
              </div>
              <div>
                <dt className="flex items-center gap-1 text-xs text-muted">
                  Precision <InfoTip>TP ÷ (TP + FP): of everything CUSTODI flagged, how much should have been flagged.</InfoTip>
                </dt>
                <dd className="mt-1 font-mono text-xl">{pct(m.precision)}</dd>
              </div>
              <div>
                <dt className="flex items-center gap-1 text-xs text-muted">
                  Recall <InfoTip>TP ÷ (TP + FN): of everything risky, how much CUSTODI caught.</InfoTip>
                </dt>
                <dd className="mt-1 font-mono text-xl">{pct(m.recall)}</dd>
              </div>
              <div className="col-span-2 text-xs text-muted">
                Analyzer time: {m.durationMs.toFixed(2)} ms total{lastRun ? ` · last run ${lastRun.toLocaleTimeString()}` : ""}
              </div>
            </dl>
          )}
        </section>
        <section className="panel p-5 sm:p-6">
          <h2 className="t-h3 mb-4">Confusion matrix</h2>
          <Matrix tp={m.truePositives} tn={m.trueNegatives} fp={m.falsePositives} fn={m.falseNegatives} />
          <p className="mt-3 text-xs text-muted">"Should warn" = expected Medium/High, or a Suspicious website.</p>
        </section>
      </div>

      <section className="panel mt-6 overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <h2 className="t-h3">
            Cases <span className="font-mono text-sm font-normal text-muted">{visible.length}</span>
          </h2>
          <div className="flex flex-wrap gap-2">
            <Select value={category} onChange={(e) => setCategory(e.target.value as CaseCategory | "all")} aria-label="Filter by category" className="h-9 w-auto text-sm">
              <option value="all">All categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_LABEL[c]}
                </option>
              ))}
            </Select>
            <Select value={riskF} onChange={(e) => setRiskF(e.target.value as RiskLevel | "all")} aria-label="Filter by expected risk" className="h-9 w-auto text-sm">
              <option value="all">Any expected risk</option>
              <option value="high">Expected High</option>
              <option value="medium">Expected Medium</option>
              <option value="low">Expected Low</option>
            </Select>
            <Select value={state} onChange={(e) => setState(e.target.value as typeof state)} aria-label="Filter by result" className="h-9 w-auto text-sm">
              <option value="all">Any result</option>
              <option value="pass">Passed</option>
              <option value="fail">Failed</option>
              <option value="not-run">Not run</option>
            </Select>
          </div>
        </div>
        <div className="hidden grid-cols-[3.2rem_1fr_9rem_9rem_7rem_auto] gap-3 border-b border-line px-5 py-2 text-[11px] font-medium tracking-wider text-muted uppercase sm:grid">
          <span>ID</span>
          <span>Case · why it passed or failed</span>
          <span>Expected</span>
          <span>Actual</span>
          <span>Result</span>
          <span className="w-[6.5rem]" />
        </div>
        <ul>
          {visible.map((c) => (
            <Row key={c.id} c={c} r={results.get(c.id)} running={running.has(c.id)} onRun={() => runOne(c)} />
          ))}
          {visible.length === 0 && <li className="p-8 text-center text-sm text-muted">No cases match these filters.</li>}
        </ul>
      </section>
    </Container>
  );
}
