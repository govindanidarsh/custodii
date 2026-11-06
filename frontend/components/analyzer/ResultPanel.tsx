"use client";

import { useEffect, useRef } from "react";
import { FindingCard } from "@/components/analyzer/FindingCard";
import { RiskBadge } from "@/components/analyzer/RiskBadge";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { RISK_COPY } from "@/lib/constants";
import { cn } from "@/lib/cn";
import { highlightEvidence } from "@/lib/highlight";
import type { AnalysisResult } from "@/types/analysis";

const RISK_ACCENT = {
  high: "from-risk-high/70",
  medium: "from-risk-medium/70",
  low: "from-risk-low/70",
} as const;

export function DemoNotice() {
  return (
    <div
      role="note"
      className="flex items-start gap-2.5 rounded-xl border border-dashed border-violet-500/40 bg-violet-50 px-3.5 py-3 text-[13px] leading-relaxed text-ink-soft"
    >
      <span className="mt-px shrink-0 rounded-md bg-violet-600 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-white">DEMO</span>
      <span>
        <strong className="font-semibold text-ink">Demonstration data.</strong> This result comes from simple sample rules running in your
        browser, not from the TrustLayer AI engine. Use it to preview the experience only.
      </span>
    </div>
  );
}

export function ResultPanel({ result, analysedText }: { result: AnalysisResult; analysedText: string }) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const segments = highlightEvidence(
    analysedText,
    result.findings.map((f) => f.evidence),
  );
  const hasHighlights = segments.some((s) => s.highlighted);

  // Move focus to the result so screen-reader and keyboard users land on it.
  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, [result.analysis_id]);

  return (
    <article
      aria-labelledby="result-heading"
      className="animate-fade-up overflow-hidden rounded-3xl border border-line bg-white shadow-card"
    >
      <div className={cn("h-1 bg-gradient-to-r to-transparent", RISK_ACCENT[result.risk_level])} />
      <div className="space-y-6 p-5 sm:p-7">
        {result.analysis_mode === "demo" && <DemoNotice />}

        <header className="space-y-3">
          <RiskBadge level={result.risk_level} />
          <h3
            id="result-heading"
            ref={headingRef}
            tabIndex={-1}
            className="font-display text-xl font-semibold tracking-tight text-ink focus:outline-none sm:text-2xl"
          >
            {RISK_COPY[result.risk_level].headline}
          </h3>
          <p className="text-[15px] leading-relaxed text-ink-soft">{result.summary}</p>
        </header>

        {hasHighlights && (
          <section aria-label="Your message with highlighted phrases">
            <h4 className="mb-2 text-sm font-semibold text-ink">Where we found it</h4>
            <div className="max-h-56 overflow-auto rounded-2xl border border-line bg-canvas p-4 text-sm leading-relaxed whitespace-pre-wrap text-ink-soft">
              {segments.map((s, i) =>
                s.highlighted ? (
                  <mark
                    key={i}
                    className="rounded bg-violet-100 px-0.5 text-ink underline decoration-violet-500 decoration-2 underline-offset-2"
                  >
                    {s.text}
                  </mark>
                ) : (
                  <span key={i}>{s.text}</span>
                ),
              )}
            </div>
          </section>
        )}

        {result.findings.length > 0 ? (
          <section>
            <h4 className="mb-3 text-sm font-semibold text-ink">
              Warning signs <span className="font-normal text-muted">({result.findings.length})</span>
            </h4>
            <ul className="space-y-3">
              {result.findings.map((f, i) => (
                <FindingCard key={`${f.type}-${i}`} finding={f} />
              ))}
            </ul>
          </section>
        ) : (
          <p className="flex items-start gap-2 rounded-2xl bg-risk-low-bg px-4 py-3 text-sm text-risk-low">
            <Icon name="check" className="mt-0.5 h-4 w-4 shrink-0" />
            Scammers also send normal-looking messages, so still confirm anything important — like fees, joining dates or documents —
            through your placement cell.
          </p>
        )}

        <section className="rounded-2xl bg-ink p-5 text-white">
          <h4 className="flex items-center gap-2 text-sm font-semibold">
            <Icon name="shield" className="h-4 w-4 text-brand-200" />
            Safe next steps
          </h4>
          <ol className="mt-3 space-y-2.5">
            {result.recommended_actions.map((a, i) => (
              <li key={a} className="flex gap-3 text-[15px] leading-relaxed text-white/90">
                <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-semibold">
                  {i + 1}
                </span>
                {a}
              </li>
            ))}
          </ol>
        </section>

        <p className="flex items-start gap-2 text-[13px] leading-relaxed text-muted">
          <Icon name="info" className="mt-0.5 h-4 w-4 shrink-0" />
          {result.uncertainty_note}
        </p>
      </div>
    </article>
  );
}

export function ResultPlaceholder() {
  return (
    <div className="flex h-full min-h-80 flex-col items-center justify-center rounded-3xl border border-dashed border-line-strong bg-white/60 p-8 text-center">
      <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
        <Icon name="shield" className="h-6 w-6" />
      </span>
      <p className="mt-4 font-display text-lg font-semibold text-ink">Your result will appear here</p>
      <p className="mt-1.5 max-w-xs text-sm leading-relaxed text-muted">
        Paste a message or try one of the fictional examples. You’ll see a risk level, the exact phrases that worried us, and what to do
        next.
      </p>
    </div>
  );
}

export function ResultLoading() {
  return (
    <div role="status" aria-live="polite" className="rounded-3xl border border-line bg-white p-7 shadow-card">
      <div className="relative h-1.5 overflow-hidden rounded-full bg-brand-50">
        <div className="absolute inset-y-0 w-1/3 animate-scan rounded-full bg-gradient-to-r from-brand-500 to-violet-500" />
      </div>
      <p className="mt-5 font-display text-lg font-semibold text-ink">Checking the message…</p>
      <p className="mt-1 text-sm text-muted">Looking for requests for codes, money, downloads and pressure tactics.</p>
      <div className="mt-6 space-y-3" aria-hidden>
        {[80, 95, 60].map((w) => (
          <div key={w} className="h-3 animate-pulse rounded-full bg-canvas" style={{ width: `${w}%` }} />
        ))}
      </div>
    </div>
  );
}

export function ResultError({ message, onRetry }: { message: string; onRetry: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  // The submit button is disabled while loading, which drops focus to <body>; bring it back here.
  useEffect(() => {
    ref.current?.focus({ preventScroll: true });
  }, []);
  return (
    <div
      ref={ref}
      tabIndex={-1}
      role="alert"
      className="rounded-3xl border border-risk-high/25 bg-white p-7 shadow-card focus:outline-none"
    >
      <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-risk-high-bg text-risk-high">
        <Icon name="alert" className="h-5 w-5" />
      </span>
      <p className="mt-4 font-display text-lg font-semibold text-ink">Something went wrong</p>
      <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{message}</p>
      <p className="mt-1.5 text-sm leading-relaxed text-muted">Until it works, don’t share codes, passwords or money with the sender.</p>
      <Button variant="secondary" className="mt-5" onClick={onRetry}>
        <Icon name="refresh" className="h-4 w-4" />
        Try again
      </Button>
    </div>
  );
}
