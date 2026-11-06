import { buildSegments, formatIncidentReport, type Finding, type Report } from "@custodi/core";
import { motion, useReducedMotion } from "framer-motion";
import { Check, Copy, Download, Share2 } from "lucide-react";
import { useState } from "react";
import { copyText, downloadText, stamp } from "../lib/download";
import { RISK, RiskBadge, Tag } from "../ui/Badge";
import { Button } from "../ui/Button";
import { InfoTip, useToast } from "../ui/Feedback";
import ChecksList, { ChecksSummary } from "./Checks";

const SITE_WORD = { verified: "Verified", suspicious: "Suspicious", unknown: "Unknown" } as const;
const SITE_DESC = {
  verified: "This domain is on your own trusted list and the address shows no strong tricks. Still never share OTPs, PINs or passwords.",
  suspicious: "The address shows tricks commonly used by fake sites. Don't open it or enter details.",
  unknown: "No tricks found in the address, but CUSTODI can't confirm who runs the site. Treat it as unverified.",
} as const;

const SEV_LABEL = { strong: "Strong sign", supporting: "Warning sign", info: "Note" } as const;

export function ScoreMeter({ score, level, kind = "message" }: { score: number; level: Report["riskLevel"]; kind?: Report["kind"] }) {
  const message = kind === "message";
  return (
    <div>
      <div className="flex items-center justify-between text-xs text-muted">
        <span className="flex items-center gap-1">
          Risk score
          <InfoTip label="How is the risk score calculated?">
            {message
              ? "Fixed points per kind of warning, each counted once: OTP/PIN/password +35, fee or payment +30, app/remote access +30, impersonation +20, threat +15, secrecy +15, disguised link +15, urgency +10, unrealistic reward +10, unexpected contact +5. 20+ is Medium, 50+ is High. Hand-set weights — not a probability."
              : "Website rules: 45 per strong sign plus 15 per different warning sign (max 100). Strong signs make an address High. A transparent count — not a probability."}
          </InfoTip>
        </span>
        <span className="font-mono text-ink">{score}/100</span>
      </div>
      <div className="relative mt-1.5 h-1.5 rounded-full bg-surface-2">
        <div className={`absolute inset-y-0 left-0 rounded-full ${RISK[level].bar}`} style={{ width: `${Math.max(score, 2)}%` }} />
        {(message ? [20, 50] : [45]).map((m) => (
          <span key={m} className="absolute -top-1 h-3.5 w-px bg-ink/40" style={{ left: `${m}%` }} aria-hidden />
        ))}
      </div>
    </div>
  );
}

const SENDER_STYLE = { verified: "text-low", unverified: "text-medium", unknown: "text-muted" } as const;
const CONF_LABEL = { low: "Low", medium: "Medium", high: "High" } as const;

/** Risk, confidence and sender verification shown side by side — never merged into one number. */
function MessageFacts({ report }: { report: Extract<Report, { kind: "message" }> }) {
  const checks = report.checks ?? [];
  const ran = checks.filter((c) => c.status === "passed" || c.status === "warning").length;
  return (
    <div className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-4">
      <div className="bg-surface p-3">
        <p className="text-[11px] text-muted">Risk score</p>
        <p className={`font-mono text-lg ${RISK[report.riskLevel].text}`}>
          {report.score}
          <span className="text-xs text-muted">/100 · {RISK[report.riskLevel].label}</span>
        </p>
      </div>
      <div className="bg-surface p-3">
        <p className="flex items-center gap-1 text-[11px] text-muted">
          Confidence
          <InfoTip label="What is confidence?">How much useful evidence CUSTODI had — message length, sender, your answers. It is not the chance of a scam. {report.confidence?.reasons.join(". ")}.</InfoTip>
        </p>
        <p className="font-mono text-lg text-ink">{report.confidence ? CONF_LABEL[report.confidence.level] : "—"}</p>
      </div>
      <div className="bg-surface p-3">
        <p className="flex items-center gap-1 text-[11px] text-muted">
          Sender
          <InfoTip label="Sender verification">{report.senderVerification?.explanation ?? "Not recorded for this scan."}</InfoTip>
        </p>
        <p className={`font-mono text-lg capitalize ${report.senderVerification ? SENDER_STYLE[report.senderVerification.status] : "text-muted"}`}>
          {report.senderVerification?.status ?? "—"}
        </p>
      </div>
      <div className="bg-surface p-3">
        <p className="text-[11px] text-muted">Checks run</p>
        <p className="font-mono text-lg text-ink">
          {ran}
          <span className="text-xs text-muted">/{checks.length || "—"} · {checks.length - ran} n/a</span>
        </p>
      </div>
    </div>
  );
}

function Breakdown({ report }: { report: Extract<Report, { kind: "message" }> }) {
  const c = report.contributions ?? [];
  if (!c.length) return null;
  return (
    <section>
      <h3 className="t-eyebrow mb-2 text-muted">Score breakdown · each kind of warning counted once</h3>
      <ul className="divide-y divide-line rounded-xl border border-line">
        {c.map((x) => (
          <li key={x.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
            <span className="text-ink-2">{x.label}</span>
            <span className="font-mono text-ink">+{x.points}</span>
          </li>
        ))}
        <li className="flex items-center justify-between gap-3 bg-surface-2 px-4 py-2.5 text-sm font-medium">
          <span>Total (capped at 100)</span>
          <span className="font-mono">{report.score}</span>
        </li>
      </ul>
    </section>
  );
}

function FindingRow({ f, n }: { f: Finding; n: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.li
      initial={reduce ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.04 * n }}
      className="grid grid-cols-[1.75rem_1fr] gap-3 border-t border-line py-4 first:border-t-0"
    >
      <span
        className={`mt-0.5 flex h-6 w-6 items-center justify-center rounded-full font-mono text-[11px] font-semibold ${
          f.severity === "strong" ? "bg-high-soft text-high" : f.severity === "supporting" ? "bg-medium-soft text-medium" : "bg-surface-2 text-muted"
        }`}
      >
        {n + 1}
      </span>
      <div className="min-w-0">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 font-medium text-ink">
          {f.title}
          <Tag>{SEV_LABEL[f.severity]}</Tag>
        </p>
        {f.evidence.length > 0 && (
          <p className="mt-2 flex flex-wrap gap-1.5">
            {f.evidence.map((e) => (
              <q key={`${e.start}-${e.end}`} className={`max-w-full break-words px-1 font-mono text-[0.8rem] ${f.severity === "info" ? "mark-info" : `mark-${f.severity}`}`}>
                {e.text}
              </q>
            ))}
          </p>
        )}
        {f.detail && <p className="mt-2 break-words font-mono text-xs text-muted">{f.detail}</p>}
        <p className="mt-2 text-sm leading-relaxed text-ink-2">{f.explanation}</p>
      </div>
    </motion.li>
  );
}

/** Evidence highlighted inside the original text. Plain text only — links are never made clickable. */
export function HighlightedText({ text, report }: { text: string; report: Report }) {
  const segs = buildSegments(text, report.findings);
  return (
    <p className="max-h-80 overflow-auto whitespace-pre-wrap break-words rounded-2xl bg-surface-2 p-4 text-[0.95rem] leading-relaxed text-ink">
      {segs.map((s, i) =>
        s.severity ? (
          <mark key={i} className={`mark-${s.severity} px-0.5`}>
            {s.text}
          </mark>
        ) : (
          <span key={i}>{s.text}</span>
        ),
      )}
    </p>
  );
}

export function ReportActions({ report, messageText }: { report: Report; messageText?: string }) {
  const toast = useToast();
  const [copied, setCopied] = useState(false);
  const text = formatIncidentReport(report, { messageText });
  const canShare = typeof navigator !== "undefined" && typeof navigator.share === "function";
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="secondary"
        size="sm"
        onClick={async () => {
          if (await copyText(text)) {
            setCopied(true);
            toast("Incident report copied — paste it into an email to your placement cell");
            setTimeout(() => setCopied(false), 1800);
          } else toast("Couldn't access the clipboard. Use Download instead.", "warning");
        }}
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} Copy report
      </Button>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => {
          downloadText(`custodi-report-${stamp()}.txt`, text);
          toast("Report downloaded");
        }}
      >
        <Download className="h-4 w-4" /> Download
      </Button>
      {canShare && (
        <Button variant="secondary" size="sm" onClick={() => navigator.share({ title: "CUSTODI report", text }).catch(() => undefined)}>
          <Share2 className="h-4 w-4" /> Share
        </Button>
      )}
    </div>
  );
}

export default function ReportView({
  report,
  messageText,
  compact = false,
  hideEvidence = false,
  hideChecks = false,
  checksOpen = false,
}: {
  report: Report;
  messageText?: string;
  compact?: boolean;
  hideEvidence?: boolean;
  hideChecks?: boolean;
  checksOpen?: boolean;
}) {
  const [showChecks, setShowChecks] = useState(checksOpen);
  const reduce = useReducedMotion();
  const r = RISK[report.riskLevel];
  const warnings = report.findings.filter((f) => f.severity !== "info");
  const notes = report.findings.filter((f) => f.severity === "info");

  return (
    <motion.article
      initial={reduce ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      aria-live="polite"
      className="panel overflow-hidden"
    >
      {/* Verdict */}
      <div className={`${r.soft} px-5 pt-5 pb-5 sm:px-6`}>
        <div className="flex flex-wrap items-center gap-2">
          <RiskBadge level={report.riskLevel} />
          {"status" in report && <span className="text-xs text-muted">Website status</span>}
        </div>
        {"status" in report ? (
          <>
            <p className={`mt-4 font-display text-5xl leading-none ${report.status === "verified" ? "text-low" : report.status === "suspicious" ? r.text : "text-ink"}`}>
              {SITE_WORD[report.status]}
            </p>
            <p className="mt-3 max-w-prose text-[0.95rem] leading-relaxed text-ink">{SITE_DESC[report.status]}</p>
          </>
        ) : (
          <>
            <p className={`mt-4 font-display text-5xl leading-none ${r.text}`}>{report.verdict.label}</p>
            <p className="mt-3 max-w-prose text-[0.95rem] leading-relaxed text-ink">{report.verdict.description}</p>
          </>
        )}
        {report.kind === "message" && report.critical?.active && (
          <p role="alert" className="mt-4 rounded-xl border-2 border-high bg-surface px-4 py-3 text-sm text-ink">
            <b className="mr-1 font-mono text-xs tracking-widest text-high uppercase">Critical</b> {report.critical.reasons.join(". ")}. Do not do this — whatever
            the message says.
          </p>
        )}
        <div className="mt-5 max-w-sm">
          <ScoreMeter score={report.score} level={report.riskLevel} kind={report.kind} />
        </div>
        {report.kind === "message" && !compact && <MessageFacts report={report} />}
      </div>

      <div className="space-y-7 px-5 py-6 sm:px-6">
        {report.kind === "message" && messageText && !compact && !hideEvidence && (
          <section>
            <h3 className="t-eyebrow mb-3 text-muted">Evidence in your message</h3>
            <HighlightedText text={messageText} report={report} />
          </section>
        )}

        <section>
          <h3 className="t-eyebrow mb-1 text-muted">
            {warnings.length ? `Why it looks ${report.riskLevel === "high" ? "suspicious" : "unverified"} · ${warnings.length} sign${warnings.length > 1 ? "s" : ""}` : "What CUSTODI checked"}
          </h3>
          {warnings.length ? (
            <ol>{(compact ? warnings.slice(0, 3) : warnings).map((f, i) => <FindingRow key={f.id} f={f} n={i} />)}</ol>
          ) : (
            <p className="mt-2 text-sm leading-relaxed text-ink-2">
              None of CUSTODI's {report.kind === "message" ? "message" : "address"} rules matched. That means the usual scam signs (OTP, fee, PIN, app install,
              pressure, odd links) aren't present — not that it's guaranteed genuine.
            </p>
          )}
        </section>

        {report.kind === "message" && !compact && <Breakdown report={report} />}

        <section className="rounded-2xl border border-line p-5">
          <h3 className="t-eyebrow text-accent">What to do next</h3>
          <ol className="mt-3 space-y-3">
            {report.nextSteps.map((step, i) => (
              <li key={step} className="grid grid-cols-[1.5rem_1fr] gap-2 text-[0.95rem] leading-snug text-ink">
                <span className="font-mono text-sm text-accent">{i + 1}.</span>
                {step}
              </li>
            ))}
          </ol>
          <p className="mt-4 border-t border-line pt-4 text-sm leading-relaxed text-ink-2">
            <strong className="text-ink">Real offer? Verify it with your placement cell.</strong> Use contacts you already know — never phone numbers, emails or
            links inside the message.
          </p>
        </section>

        {!hideChecks && report.checks && report.checks.length > 0 && (
          <section>
            <button
              type="button"
              onClick={() => setShowChecks((v) => !v)}
              aria-expanded={showChecks}
              className="flex w-full items-center justify-between gap-3 rounded-xl border border-line px-4 py-3 text-left hover:border-ink/40"
            >
              <span>
                <span className="block text-sm font-medium text-ink">Checks performed ({report.checks.length})</span>
                <ChecksSummary checks={report.checks} />
              </span>
              <span className="text-xs text-accent">{showChecks ? "Hide" : "Show"}</span>
            </button>
            {showChecks && (
              <div className="mt-2">
                <ChecksList checks={report.checks} />
              </div>
            )}
          </section>
        )}

        {!compact && notes.length > 0 && (
          <section>
            <h3 className="t-eyebrow mb-1 text-muted">Notes</h3>
            <ol>
              {notes.map((f, i) => (
                <FindingRow key={f.id} f={f} n={warnings.length + i} />
              ))}
            </ol>
          </section>
        )}

        {!compact && (
          <div className="flex flex-col gap-4 border-t border-line pt-5">
            <ReportActions report={report} messageText={messageText} />
            <p className="text-xs leading-relaxed text-muted">{report.uncertaintyNote}</p>
          </div>
        )}
      </div>
    </motion.article>
  );
}
