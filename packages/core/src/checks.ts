import type { CheckResult, CheckStatus, Finding, IndicatorType, Severity } from "./types";

export const now = () => (typeof performance !== "undefined" ? performance.now() : Date.now());

const RANK: Record<Severity, number> = { strong: 0, supporting: 1, info: 2 };

export function quote(f: Finding): string[] {
  if (f.evidence.length) return f.evidence.slice(0, 3).map((e) => `“${e.text}” — ${f.title}`);
  return [f.detail ? `${f.title} (${f.detail})` : f.title];
}

/**
 * Builds a check from the findings it produced. Info-level findings never turn a check into a warning.
 */
export function checkFrom(
  id: string,
  name: string,
  findings: Finding[],
  o: { looksFor: string; passedRec?: string; status?: CheckStatus; facts?: string[]; durationMs?: number; warnRec?: (f: Finding) => string | undefined },
): CheckResult {
  const warnings = findings.filter((f) => f.severity !== "info");
  const status: CheckStatus = o.status ?? (warnings.length ? "warning" : "passed");
  const top = [...warnings].sort((a, b) => RANK[a.severity] - RANK[b.severity])[0];
  return {
    id,
    name,
    status,
    severity: top ? top.severity : "none",
    evidence: [...(o.facts ?? []), ...warnings.flatMap(quote)],
    findingIds: findings.map((f) => f.id),
    explanation:
      status === "warning" && top
        ? `${warnings.length} sign${warnings.length > 1 ? "s" : ""} found. ${top.explanation}`
        : status === "passed"
          ? `Looked for ${o.looksFor}. Nothing found — that is not proof the message is genuine.`
          : o.looksFor,
    recommendation:
      status === "warning" && top
        ? (o.warnRec?.(top) ?? "Treat this as a warning sign and verify before acting.")
        : (o.passedRec ?? "Nothing to act on from this check alone."),
    durationMs: o.durationMs ?? 0,
  };
}

export const byTypes = (findings: Finding[], types: IndicatorType[]) => findings.filter((f) => types.includes(f.type));

export const REPUTATION_CHECK = (durationMs = 0): CheckResult => ({
  id: "reputation",
  name: "Threat intelligence & reputation",
  status: "unavailable",
  severity: "none",
  evidence: ["No reputation database or sender-verification service is connected"],
  findingIds: [],
  explanation:
    "CUSTODI runs entirely on your device and does not look up blocklists, domain age or sender authenticity. It never pretends it did.",
  recommendation: "Verify the organisation through your placement cell or its official website that you find yourself.",
  durationMs,
});
