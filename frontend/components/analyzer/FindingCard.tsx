import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";
import type { Finding, FindingType } from "@/types/analysis";

export const FINDING_LABELS: Record<FindingType, string> = {
  otp_request: "Asks for an OTP",
  credential_request: "Asks for a password",
  upfront_payment: "Asks for money upfront",
  bank_or_upi_request: "Asks for bank or UPI details",
  unsafe_download: "Asks you to install an app",
  urgency: "Pressure to act fast",
  unverified_sender: "Unverified sender",
  suspicious_link: "Suspicious link",
  prompt_injection: "Tries to instruct the checker",
  other: "Other warning sign",
};

export function FindingCard({ finding }: { finding: Finding }) {
  const strong = finding.severity === "strong";
  return (
    <li className="rounded-2xl border border-line bg-white p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={cn(
            "inline-flex h-7 w-7 items-center justify-center rounded-lg",
            strong ? "bg-risk-high-bg text-risk-high" : "bg-risk-medium-bg text-risk-medium",
          )}
        >
          <Icon name="alert" className="h-4 w-4" />
        </span>
        <p className="font-semibold text-ink">{FINDING_LABELS[finding.type]}</p>
        <span className={cn("ml-auto text-xs font-medium", strong ? "text-risk-high" : "text-risk-medium")}>
          {strong ? "Strong signal" : "Supporting signal"}
        </span>
      </div>
      {finding.evidence && (
        <blockquote className="mt-3 rounded-lg border-l-2 border-violet-500 bg-violet-50 px-3 py-2 font-mono text-[13px] leading-relaxed text-ink">
          “{finding.evidence}”
        </blockquote>
      )}
      <p className="mt-2.5 text-sm leading-relaxed text-ink-soft">{finding.explanation}</p>
    </li>
  );
}
