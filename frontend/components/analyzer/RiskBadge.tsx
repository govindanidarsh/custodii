import { Icon } from "@/components/ui/Icon";
import { RISK_COPY } from "@/lib/constants";
import { cn } from "@/lib/cn";
import type { RiskLevel } from "@/types/analysis";

const STYLES: Record<RiskLevel, string> = {
  high: "bg-risk-high-bg text-risk-high ring-risk-high/20",
  medium: "bg-risk-medium-bg text-risk-medium ring-risk-medium/20",
  low: "bg-risk-low-bg text-risk-low ring-risk-low/20",
};

/** Risk is always shown as text + icon, never colour alone. */
export function RiskBadge({ level }: { level: RiskLevel }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ring-1 ring-inset", STYLES[level])}>
      <Icon name={level === "low" ? "check" : "alert"} className="h-4 w-4" />
      {RISK_COPY[level].label}
    </span>
  );
}
