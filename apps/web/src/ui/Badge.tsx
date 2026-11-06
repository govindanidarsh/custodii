import type { RiskLevel, SiteStatus } from "@custodi/core";

export const RISK: Record<RiskLevel, { label: string; verdict: string; text: string; soft: string; dot: string; bar: string }> = {
  high: { label: "High", verdict: "Suspicious", text: "text-high", soft: "bg-high-soft", dot: "bg-high", bar: "bg-high" },
  medium: { label: "Medium", verdict: "Caution", text: "text-medium", soft: "bg-medium-soft", dot: "bg-medium", bar: "bg-medium" },
  low: { label: "Low", verdict: "Low risk", text: "text-low", soft: "bg-low-soft", dot: "bg-low", bar: "bg-low" },
};

export function RiskBadge({ level, size = "md", withVerdict = false }: { level: RiskLevel; size?: "sm" | "md"; withVerdict?: boolean }) {
  const r = RISK[level];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-medium ${r.soft} ${r.text} ${size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm"}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${r.dot}`} aria-hidden />
      {r.label} risk{withVerdict && level !== "low" ? ` · ${r.verdict}` : ""}
    </span>
  );
}

const STATUS: Record<SiteStatus, { label: string; cls: string }> = {
  verified: { label: "Verified · your trusted list", cls: "bg-low-soft text-low" },
  suspicious: { label: "Suspicious", cls: "bg-high-soft text-high" },
  unknown: { label: "Unknown · not verified", cls: "bg-surface-2 text-ink-2" },
};

export function StatusBadge({ status }: { status: SiteStatus }) {
  const s = STATUS[status];
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-sm font-medium ${s.cls}`}>{s.label}</span>;
}

export function Tag({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "accent" | "lime" }) {
  const cls = tone === "accent" ? "bg-accent-soft text-accent" : tone === "lime" ? "bg-lime-soft text-lime" : "bg-surface-2 text-muted";
  return <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 font-mono text-[0.7rem] font-medium uppercase tracking-wider ${cls}`}>{children}</span>;
}
