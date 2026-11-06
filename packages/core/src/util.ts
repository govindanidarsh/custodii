import type { EvidenceSpan, Finding, RiskLevel } from "./types";

export const ENGINE_VERSION = "custodi-core-0.2.0";

let counter = 0;
export function makeId(prefix = "scan"): string {
  const c = (globalThis as { crypto?: Crypto }).crypto;
  if (c && typeof c.randomUUID === "function") return `${prefix}_${c.randomUUID()}`;
  counter += 1;
  return `${prefix}_${Date.now().toString(36)}_${counter.toString(36)}`;
}

/** All matches of a regex as evidence spans (regex is cloned with the global flag). */
export function findSpans(text: string, pattern: RegExp, limit = 5): EvidenceSpan[] {
  const flags = pattern.flags.includes("g") ? pattern.flags : pattern.flags + "g";
  const re = new RegExp(pattern.source, flags);
  const spans: EvidenceSpan[] = [];
  for (const m of text.matchAll(re)) {
    if (m.index === undefined || m[0].length === 0) continue;
    // Trim surrounding whitespace / trailing punctuation while keeping exact offsets.
    let start = m.index;
    let end = m.index + m[0].length;
    while (start < end && /\s/.test(text[start]!)) start++;
    while (end > start && /[\s.,;:!?)]/.test(text[end - 1]!)) end--;
    if (end > start) spans.push({ text: text.slice(start, end), start, end });
    if (spans.length >= limit) break;
  }
  return spans;
}

/** Strong → high. Three or more different supporting signs → high. Any supporting → medium. */
export function aggregateRisk(findings: Finding[]): RiskLevel {
  const strong = findings.filter((f) => f.severity === "strong").length;
  const supportingTypes = new Set(findings.filter((f) => f.severity === "supporting").map((f) => f.type));
  if (strong > 0) return "high";
  if (supportingTypes.size >= 3) return "high";
  if (supportingTypes.size > 0) return "medium";
  return "low";
}

export function riskScore(findings: Finding[]): number {
  const strong = findings.filter((f) => f.severity === "strong").length;
  const supportingTypes = new Set(findings.filter((f) => f.severity === "supporting").map((f) => f.type)).size;
  return Math.min(100, strong * 45 + supportingTypes * 15);
}

export const VERDICT: Record<RiskLevel, { label: string; description: string }> = {
  high: { label: "Suspicious", description: "Strong warning signs. Treat as a likely scam until your placement cell confirms otherwise." },
  medium: { label: "Caution", description: "Some warning indicators. It may be genuine, but verify it independently before you act." },
  low: { label: "Low risk", description: "No obvious warning indicators detected. This does not guarantee the message is safe." },
};

export const VERIFY_ADVICE =
  "If this looks like a real offer, verify it through your college placement cell or the company's official careers page that you find yourself — never through phone numbers, emails or links inside the message.";

export const UNCERTAINTY_NOTE =
  "CUSTODI gives automated warning signs, not proof. A low result does not mean a message is genuine, and a high result is not a legal finding of fraud.";

export const SEVERITY_ORDER = { strong: 0, supporting: 1, info: 2 } as const;

export function sortFindings(findings: Finding[]): Finding[] {
  return [...findings].sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
}
