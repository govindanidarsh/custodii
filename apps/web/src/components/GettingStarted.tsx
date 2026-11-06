import { Check, X } from "lucide-react";
import { Link } from "react-router";
import { setFlag, useFlags, useHistory } from "../lib/store";

/** Guided onboarding. Each step is ticked by something the user actually did — nothing is faked. */
export default function GettingStarted() {
  const history = useHistory();
  const flags = useFlags();
  if (flags.onboardingDismissed) return null;
  const steps = [
    { done: history.some((h) => h.report.kind === "message"), label: "Scan a message", hint: "Paste one or pick a sample", to: "/scan" },
    { done: history.some((h) => h.report.kind === "url"), label: "Check a website link", hint: "See who really owns an address", to: "/website" },
    { done: !!flags.visitedHelp, label: "Learn what the risk levels mean", hint: "2-minute read", to: "/help#risk" },
    { done: !!flags.visitedExtension, label: "Set up the Chrome extension", hint: "Scan pages + Live Observe", to: "/extension" },
  ];
  const doneCount = steps.filter((s) => s.done).length;
  if (doneCount === steps.length) return null;
  return (
    <section aria-label="Getting started" className="panel relative p-5">
      <button
        type="button"
        onClick={() => setFlag({ onboardingDismissed: true })}
        aria-label="Hide getting started"
        className="absolute top-2 right-2 rounded-full p-2.5 text-muted hover:bg-surface-2 hover:text-ink"
      >
        <X className="h-4 w-4" />
      </button>
      <div className="flex items-baseline gap-3">
        <p className="t-eyebrow text-accent">Getting started</p>
        <p className="font-mono text-xs text-muted">
          {doneCount}/{steps.length}
        </p>
      </div>
      <div className="mt-3 h-1 rounded-full bg-surface-2">
        <div className="h-full rounded-full bg-lime transition-[width] duration-500" style={{ width: `${(doneCount / steps.length) * 100}%` }} />
      </div>
      <ol className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((s, i) => (
          <li key={s.label}>
            <Link to={s.to} className="group flex h-full items-start gap-3 rounded-xl p-2 hover:bg-surface-2">
              <span
                className={`mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full border text-[11px] font-semibold ${
                  s.done ? "border-lime bg-lime text-bg" : "border-line-strong text-muted"
                }`}
              >
                {s.done ? <Check className="h-3 w-3" /> : i + 1}
              </span>
              <span>
                <span className={`block text-sm font-medium ${s.done ? "text-muted line-through" : "text-ink group-hover:text-accent"}`}>{s.label}</span>
                <span className="block text-xs text-muted">{s.hint}</span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
