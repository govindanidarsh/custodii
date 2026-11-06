import type { CheckResult, CheckStatus } from "@custodi/core";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, ChevronDown, CircleSlash, Minus, TriangleAlert } from "lucide-react";
import { useState } from "react";

export const STATUS_META: Record<CheckStatus, { label: string; cls: string; Icon: typeof Check }> = {
  passed: { label: "Passed", cls: "text-low bg-low-soft", Icon: Check },
  warning: { label: "Warning", cls: "text-medium bg-medium-soft", Icon: TriangleAlert },
  unavailable: { label: "Unavailable", cls: "text-muted bg-surface-2", Icon: CircleSlash },
  skipped: { label: "Skipped", cls: "text-muted bg-surface-2", Icon: Minus },
};

function StatusIcon({ c }: { c: CheckResult }) {
  const strong = c.status === "warning" && c.severity === "strong";
  const m = STATUS_META[c.status];
  return (
    <span className={`flex h-7 w-7 flex-none items-center justify-center rounded-full ${strong ? "bg-high-soft text-high" : m.cls}`}>
      <m.Icon className="h-3.5 w-3.5" strokeWidth={2.5} />
    </span>
  );
}

export function CheckRow({ c, index, defaultOpen = false }: { c: CheckResult; index: number; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const reduce = useReducedMotion();
  const strong = c.status === "warning" && c.severity === "strong";
  return (
    <motion.li
      layout={!reduce}
      initial={reduce ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="relative"
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="grid w-full grid-cols-[1.75rem_auto_1fr_auto] items-center gap-3 rounded-xl px-2 py-2.5 text-left hover:bg-surface-2"
      >
        <StatusIcon c={c} />
        <span className="font-mono text-[11px] text-muted">{String(index + 1).padStart(2, "0")}</span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium text-ink">{c.name}</span>
          {!open && c.status === "warning" && c.evidence.length > 0 && <span className="block truncate text-xs text-muted">{c.evidence[c.evidence.length - 1]}</span>}
        </span>
        <span className="flex items-center gap-2">
          <span className={`rounded-md px-1.5 py-0.5 font-mono text-[11px] font-semibold tracking-wider uppercase ${strong ? "bg-high-soft text-high" : STATUS_META[c.status].cls}`}>
            {strong ? "Strong" : STATUS_META[c.status].label}
          </span>
          <span className="hidden w-14 text-right font-mono text-[11px] text-muted sm:inline">{c.durationMs < 0.01 ? "<0.01" : c.durationMs.toFixed(2)} ms</span>
          <ChevronDown className={`h-4 w-4 text-muted transition-transform ${open ? "rotate-180" : ""}`} />
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="ml-[2.6rem] space-y-3 border-l border-line pt-1 pb-4 pl-4 text-sm">
              <p className="leading-relaxed text-ink-2">{c.explanation}</p>
              {c.evidence.length > 0 && (
                <ul className="space-y-1">
                  {c.evidence.map((e, i) => (
                    <li key={i} className="rounded-lg bg-surface-2 px-2.5 py-1.5 font-mono text-xs break-words text-ink">
                      {e}
                    </li>
                  ))}
                </ul>
              )}
              <p className="text-ink">
                <span className="t-eyebrow mr-2 text-accent">Do</span>
                {c.recommendation}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.li>
  );
}

export function ChecksSummary({ checks }: { checks: CheckResult[] }) {
  const n = (s: CheckStatus) => checks.filter((c) => c.status === s).length;
  return (
    <p className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px] text-muted">
      <span className="text-low">{n("passed")} passed</span>
      <span className="text-medium">{n("warning")} warning</span>
      <span>{n("unavailable")} unavailable</span>
      <span>{n("skipped")} skipped</span>
      <span>{checks.reduce((s, c) => s + c.durationMs, 0).toFixed(2)} ms total</span>
    </p>
  );
}

export default function ChecksList({ checks }: { checks: CheckResult[] }) {
  return (
    <ol className="space-y-0.5">
      {checks.map((c, i) => (
        <CheckRow key={c.id} c={c} index={i} />
      ))}
    </ol>
  );
}
