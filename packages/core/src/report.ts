import type { EvidenceSpan, Finding, Report, RiskLevel, Severity } from "./types";

export interface Segment {
  text: string;
  /** Highest severity among findings covering this segment, if any. */
  severity?: Severity;
  findingIds: string[];
}

/** Split text into plain and highlighted segments for rendering evidence (as text, never HTML). */
export function buildSegments(text: string, findings: Finding[]): Segment[] {
  const marks: { span: EvidenceSpan; f: Finding }[] = [];
  for (const f of findings) {
    if (f.source !== "message" && f.source !== "page-text") continue;
    for (const span of f.evidence) {
      if (text.slice(span.start, span.end) === span.text) marks.push({ span, f });
    }
  }
  if (marks.length === 0) return [{ text, findingIds: [] }];

  const points = new Set<number>([0, text.length]);
  for (const m of marks) {
    points.add(m.span.start);
    points.add(m.span.end);
  }
  const sorted = Array.from(points).sort((a, b) => a - b);
  const rank: Record<Severity, number> = { strong: 0, supporting: 1, info: 2 };
  const segments: Segment[] = [];
  for (let i = 0; i < sorted.length - 1; i++) {
    const start = sorted[i]!;
    const end = sorted[i + 1]!;
    if (end <= start) continue;
    const covering = marks.filter((m) => m.span.start <= start && m.span.end >= end);
    const severity = covering.length
      ? covering.map((c) => c.f.severity).sort((a, b) => rank[a] - rank[b])[0]
      : undefined;
    const prev = segments[segments.length - 1];
    const ids = Array.from(new Set(covering.map((c) => c.f.id)));
    if (prev && !severity && !prev.severity) prev.text += text.slice(start, end);
    else segments.push({ text: text.slice(start, end), severity, findingIds: ids });
  }
  return segments;
}

export interface CheckRow {
  id: string;
  icon: string;
  label: string;
  outcome: string;
  tone: "strong" | "warning" | "passed" | "neutral";
  explanation: string;
  evidence: string[];
  recommendation: string;
}

const CHECK_ICON = { passed: "✓", warning: "!", unavailable: "⊘", skipped: "–" } as const;
const CHECK_OUTCOME = { passed: "Passed", warning: "Warning", unavailable: "Unavailable", skipped: "Skipped" } as const;

/**
 * Display model for a report's checks, shared by the extension popup (and testable without a DOM).
 * Every field has a fallback, so a row can never render blank even if a check is malformed or from an old scan.
 */
export function checkRows(r: Report): CheckRow[] {
  return (r.checks ?? []).map((c, i) => {
    const status = c && c.status in CHECK_ICON ? c.status : "unavailable";
    const strong = status === "warning" && c?.severity === "strong";
    return {
      id: c?.id || `check-${i + 1}`,
      icon: CHECK_ICON[status],
      label: c?.name?.trim() || `Check ${i + 1}`,
      outcome: strong ? "Strong warning" : CHECK_OUTCOME[status],
      tone: strong ? "strong" : status === "warning" ? "warning" : status === "passed" ? "passed" : "neutral",
      explanation: c?.explanation?.trim() || "No further detail was recorded for this check.",
      evidence: Array.isArray(c?.evidence) ? c.evidence.filter((e) => typeof e === "string" && e.trim()) : [],
      recommendation: c?.recommendation?.trim() || "",
    };
  });
}

export const RISK_LABEL: Record<RiskLevel, string> = { low: "Low risk", medium: "Medium risk", high: "High risk" };

function subject(r: Report): string {
  if (r.kind === "message") return `Message (${r.channel}${r.sender ? `, sender ${r.sender}` : ""})`;
  if (r.kind === "url") return `Web address: ${r.input}`;
  return `Web page: ${r.url}`;
}

/** Plain-text incident report a student can copy into an email to their placement cell. */
export function formatIncidentReport(r: Report, opts: { messageText?: string } = {}): string {
  const lines: string[] = [];
  lines.push("CUSTODI — Suspicious message / website report");
  lines.push("=".repeat(44));
  lines.push(`Date checked: ${new Date(r.analyzedAt).toLocaleString()}`);
  lines.push(`What was checked: ${subject(r)}`);
  lines.push(`Result: ${RISK_LABEL[r.riskLevel]}${"status" in r ? ` · Site status: ${r.status}` : ""}`);
  lines.push("");
  lines.push(r.summary);
  lines.push("");
  const warnings = r.findings.filter((f) => f.severity !== "info");
  if (warnings.length) {
    lines.push("Warning signs found:");
    warnings.forEach((f, i) => {
      lines.push(`${i + 1}. [${f.severity}] ${f.title}`);
      for (const e of f.evidence) lines.push(`   Evidence: "${e.text}"`);
      if (f.detail) lines.push(`   ${f.detail}`);
    });
  } else {
    lines.push("No warning signs were found by CUSTODI's rules.");
  }
  lines.push("");
  lines.push("Recommended next steps:");
  r.nextSteps.forEach((s) => lines.push(`- ${s}`));
  lines.push(`- ${r.verifyAdvice}`);
  if (opts.messageText) {
    lines.push("");
    lines.push("Original message (as pasted by the student):");
    lines.push("-".repeat(44));
    lines.push(opts.messageText);
    lines.push("-".repeat(44));
  }
  lines.push("");
  lines.push(r.uncertaintyNote);
  lines.push(`Engine: ${r.engineVersion} · Report ID: ${r.id}`);
  return lines.join("\n");
}
