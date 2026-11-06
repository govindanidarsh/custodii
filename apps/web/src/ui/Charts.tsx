import type { RiskLevel } from "@custodi/core";
import { motion, useReducedMotion } from "framer-motion";
import { useState } from "react";
import { RISK } from "./Badge";

const LEVELS: RiskLevel[] = ["high", "medium", "low"];

/** Horizontal 100% bar for the risk distribution, with a legend. */
export function DistributionBar({ counts }: { counts: Record<RiskLevel, number> }) {
  const total = LEVELS.reduce((s, l) => s + counts[l], 0);
  const reduce = useReducedMotion();
  return (
    <div>
      <div
        className="flex h-3 overflow-hidden rounded-full bg-surface-2"
        role="img"
        aria-label={`Risk distribution: ${counts.high} high, ${counts.medium} medium, ${counts.low} low`}
      >
        {LEVELS.map((l) =>
          counts[l] ? (
            <motion.div
              key={l}
              className={`${RISK[l].bar} h-full [&+&]:ml-0.5`}
              initial={reduce ? false : { width: 0 }}
              animate={{ width: `${(counts[l] / total) * 100}%` }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            />
          ) : null,
        )}
      </div>
      <dl className="mt-4 grid grid-cols-3 gap-3">
        {LEVELS.map((l) => (
          <div key={l}>
            <dt className="flex items-center gap-1.5 text-xs text-muted">
              <span className={`h-2 w-2 rounded-full ${RISK[l].dot}`} /> {RISK[l].label}
            </dt>
            <dd className="mt-1 font-mono text-lg text-ink">
              {counts[l]}
              <span className="ml-1 text-xs text-muted">{total ? Math.round((counts[l] / total) * 100) : 0}%</span>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export interface DayBucket {
  label: string;
  date: string;
  high: number;
  medium: number;
  low: number;
}

/** Stacked daily columns (SVG). Shows real counts per day; hover/focus a column for numbers. */
export function TrendChart({ days }: { days: DayBucket[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...days.map((d) => d.high + d.medium + d.low));
  const W = 560;
  const H = 150;
  const gap = 6;
  const bw = (W - gap * (days.length - 1)) / days.length;
  const active = hover !== null ? days[hover] : null;
  return (
    <div>
      <div className="mb-2 h-5 text-xs text-muted" aria-live="polite">
        {active ? (
          <span>
            <b className="text-ink">{active.date}</b> · {active.high} high · {active.medium} medium · {active.low} low
          </span>
        ) : (
          "Hover or tab through the columns for daily numbers"
        )}
      </div>
      <svg viewBox={`0 0 ${W} ${H + 22}`} className="w-full" role="img" aria-label="Scans per day for the last 14 days, split by risk level">
        {[0.5, 1].map((f) => (
          <line key={f} x1="0" x2={W} y1={H - H * f} y2={H - H * f} stroke="var(--line)" strokeDasharray="2 4" />
        ))}
        <line x1="0" x2={W} y1={H} y2={H} stroke="var(--line-strong)" />
        {days.map((d, i) => {
          const x = i * (bw + gap);
          let y = H;
          const parts = (["low", "medium", "high"] as RiskLevel[]).map((l) => {
            const h = (d[l] / max) * (H - 8);
            y -= h;
            return h > 0 ? <rect key={l} x={x} y={y} width={bw} height={h} rx={Math.min(3, bw / 4)} fill={`var(--${l})`} opacity={hover === null || hover === i ? 1 : 0.35} /> : null;
          });
          return (
            <g
              key={d.date}
              tabIndex={0}
              role="img"
              aria-label={`${d.date}: ${d.high} high, ${d.medium} medium, ${d.low} low`}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(null)}
              className="outline-none"
            >
              <rect x={x} y={0} width={bw} height={H} fill="transparent" />
              {parts}
              {(i % 2 === 0 || days.length <= 7) && (
                <text x={x + bw / 2} y={H + 15} textAnchor="middle" fontSize="11" fill="var(--muted)" fontFamily="var(--font-mono)">
                  {d.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/** Ranked horizontal bars (e.g. threat categories). */
export function BarList({ items, empty }: { items: { label: string; value: number; tone?: "high" | "medium" | "accent" }[]; empty: string }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  if (!items.length) return <p className="text-sm text-muted">{empty}</p>;
  return (
    <ul className="space-y-3">
      {items.map((i) => (
        <li key={i.label}>
          <div className="flex justify-between gap-3 text-sm">
            <span className="text-ink-2">{i.label}</span>
            <span className="font-mono text-muted">{i.value}</span>
          </div>
          <div className="mt-1.5 h-1.5 rounded-full bg-surface-2">
            <div className={`h-full rounded-full ${i.tone === "high" ? "bg-high" : i.tone === "medium" ? "bg-medium" : "bg-accent"}`} style={{ width: `${(i.value / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Small number tile. */
export function Stat({ label, value, sub, tone }: { label: string; value: React.ReactNode; sub?: React.ReactNode; tone?: RiskLevel }) {
  return (
    <div className="panel p-5">
      <p className="t-eyebrow text-muted">{label}</p>
      <p className={`mt-3 font-display text-5xl leading-none ${tone ? RISK[tone].text : "text-ink"}`}>{value}</p>
      {sub && <p className="mt-2 text-xs text-muted">{sub}</p>}
    </div>
  );
}
