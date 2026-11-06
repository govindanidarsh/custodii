/**
 * Live analysis view. Runs the real @custodi/core pipeline one stage at a time; each check appears
 * only after it has actually finished. The short pause between stages exists so a person can follow
 * along — the analysis itself is complete when a row appears. "Show result now" skips the pacing.
 */
import { buildSegments, createMessagePipeline, type AnalyzeOptions, type CheckResult, type MessageInput, type MessageReport } from "@custodi/core";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { FastForward } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { CheckRow, ChecksSummary } from "./Checks";
import ReportView from "./ReportView";

const PACE_MS = 140;

export default function AnalysisRun({ input, opts, onDone }: { input: MessageInput; opts: AnalyzeOptions; onDone: (r: MessageReport) => void }) {
  const reduce = useReducedMotion();
  const [checks, setChecks] = useState<CheckResult[]>([]);
  const [findingsSoFar, setFindingsSoFar] = useState<MessageReport["findings"]>([]);
  const [report, setReport] = useState<MessageReport | null>(null);
  const [names, setNames] = useState<string[]>([]);
  const total = names.length;
  const skip = useRef(false);

  useEffect(() => {
    let cancelled = false;
    setChecks([]);
    setFindingsSoFar([]);
    setReport(null);
    const p = createMessagePipeline(input, opts);
    setNames(p.stages.map((x) => x.name));
    (async () => {
      while (!p.done && !cancelled) {
        const c = p.next(); // real work happens here
        if (!c || cancelled) break;
        setChecks((prev) => [...prev, c]);
        setFindingsSoFar([...p.findings]);
        if (!reduce && !skip.current) await new Promise((r) => setTimeout(r, PACE_MS));
      }
      if (cancelled) return;
      const r = p.result();
      setReport(r);
      onDone(r);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const running = !report;
  const current = !running ? null : checks.length < total ? checks.length : null;
  const segs = buildSegments(input.text, findingsSoFar);

  return (
    <div className="space-y-5">
      <AnimatePresence>{report && <ReportView key="report" report={report} messageText={input.text} hideEvidence hideChecks />}</AnimatePresence>

      <section className="panel overflow-hidden" aria-label="Analysis steps" aria-busy={running}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
          <div>
            <p className="t-eyebrow text-accent">{running ? "Analysing" : "How CUSTODI reached this"}</p>
            <p className="mt-1 text-sm text-ink">
              {checks.length} of {total} checks complete
            </p>
          </div>
          {running ? (
            <button
              type="button"
              onClick={() => (skip.current = true)}
              className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs text-ink-2 hover:border-ink"
            >
              <FastForward className="h-3.5 w-3.5" /> Show result now
            </button>
          ) : (
            <ChecksSummary checks={checks} />
          )}
        </div>
        <div className="h-0.5 bg-surface-2">
          <motion.div className="h-full bg-accent" animate={{ width: `${total ? (checks.length / total) * 100 : 0}%` }} transition={{ duration: 0.2 }} />
        </div>

        <div className="grid gap-0 lg:grid-cols-1">
          <div className="border-b border-line px-5 py-4">
            <p className="t-eyebrow mb-2 text-muted">Message · evidence highlighted as each check finds it</p>
            <p className="max-h-56 overflow-auto text-[0.9rem] leading-relaxed whitespace-pre-wrap break-words text-ink">
              {segs.map((s, i) =>
                s.severity ? (
                  <motion.mark key={`${i}-${s.text}`} initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} className={`mark-${s.severity} px-0.5`}>
                    {s.text}
                  </motion.mark>
                ) : (
                  <span key={i}>{s.text}</span>
                ),
              )}
            </p>
          </div>
          <ol className="space-y-0.5 px-3 py-3">
            {checks.map((c, i) => (
              <CheckRow key={c.id} c={c} index={i} defaultOpen={!running ? false : c.status === "warning"} />
            ))}
            {current !== null && (
              <li className="grid grid-cols-[1.75rem_auto_1fr] items-center gap-3 px-2 py-2.5" aria-live="polite">
                <span className="flex h-7 w-7 items-center justify-center">
                  <span className="h-2 w-2 rounded-full bg-accent motion-safe:animate-pulse" />
                </span>
                <span className="font-mono text-[11px] text-muted">{String(current + 1).padStart(2, "0")}</span>
                <span className="text-sm text-muted">Next: {names[current]}</span>
              </li>
            )}
          </ol>
        </div>
      </section>
    </div>
  );
}
