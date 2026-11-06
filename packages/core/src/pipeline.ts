/**
 * CUSTODI message analysis pipeline.
 *
 * A deterministic, ordered list of checks. Each stage runs only its own rules and returns a CheckResult
 * with the exact evidence it found. `createMessagePipeline` lets a UI run the stages one at a time and show
 * each result the moment it really completes; `analyzeMessage` simply runs them all.
 */
import { checkFrom, now, quote, REPUTATION_CHECK } from "./checks";
import {
  applyMessageContext,
  callToContinueFinding,
  informalChannelFinding,
  HEADLINE,
  linkAnalysis,
  MAX_MESSAGE_LENGTH,
  NEXT_STEP,
  nextStepsFor,
  PERSONAL_SENDER,
  ruleFindings,
  SUMMARY,
  extractUrls,
  type InspectedLink,
} from "./message";
import { JOB_CONTEXT, scoreFindings } from "./scoring";
import type { AnalyzeOptions, Channel, CheckResult, ConfidenceLevel, Finding, IndicatorType, MessageContext, MessageInput, MessageReport, SenderVerification } from "./types";
import { isTrustedHost } from "./url";
import { urlFindings } from "./url";
import { ENGINE_VERSION, makeId, sortFindings, UNCERTAINTY_NOTE, VERDICT, VERIFY_ADVICE } from "./util";

interface Ctx {
  text: string;
  channel: Channel;
  sender?: string;
  senderDomain?: string;
  context: MessageContext;
  opts: AnalyzeOptions;
  findings: Finding[];
  links: InspectedLink[];
  urlCount: number;
}

interface Stage {
  id: string;
  name: string;
  run: (ctx: Ctx) => CheckResult;
}

const rec = (f: Finding) => NEXT_STEP[f.type];
const ORG_CLAIM = /\b(?:hr|team|company|pvt|ltd|limited|technologies|bank|careers?|kyc|department|official|support|customer care)\b/i;
const ANSWER = { yes: "Yes", no: "No", unsure: "Not sure" } as const;

function contextFinding(type: IndicatorType, title: string, detail: string, explanation: string): Finding {
  return { id: makeId("f"), type, severity: "supporting", source: "sender", title, explanation, evidence: [], detail };
}
const IMPERSONATION_TYPES: IndicatorType[] = ["lookalike_domain", "punycode_host", "brand_in_unrelated_domain", "imitates_trusted_domain", "credentials_in_url"];

function rulesStage(id: string, name: string, types: IndicatorType[], looksFor: string, extra?: (ctx: Ctx) => Finding[]): Stage {
  return {
    id,
    name,
    run: (ctx) => {
      const found = applyMessageContext(ctx.text, [...ruleFindings(ctx.text, "message", types), ...(extra?.(ctx) ?? [])]);
      ctx.findings.push(...found);
      return checkFrom(id, name, found, { looksFor, warnRec: rec });
    },
  };
}

export const MESSAGE_STAGES: Stage[] = [
  {
    id: "parse",
    name: "Message received & parsed",
    run: (ctx) => {
      const lines = ctx.text.split(/\n/).length;
      ctx.urlCount = extractUrls(ctx.text).length;
      const short = ctx.text.trim().length < 40;
      return {
        id: "parse",
        name: "Message received & parsed",
        status: short ? "warning" : "passed",
        severity: short ? "info" : "none",
        evidence: [
          `${ctx.text.length.toLocaleString()} characters · ${lines} line${lines > 1 ? "s" : ""}`,
          `Channel: ${ctx.channel}`,
          ctx.sender ? `Sender given: ${ctx.sender}` : "No sender given",
          `${ctx.urlCount} web address${ctx.urlCount === 1 ? "" : "es"} found in the text`,
        ],
        findingIds: [],
        explanation: short
          ? "The message is very short, so few checks have anything to work with. Paste the full message for a better result."
          : "The text was read as plain, untrusted data. Nothing in it is executed, opened or sent anywhere.",
        recommendation: short ? "Paste the complete message, including greeting and signature." : "Continue to the checks below.",
        durationMs: 0,
      };
    },
  },
  rulesStage(
    "credentials",
    "OTP, password & PIN requests",
    ["otp_request", "credential_request", "bank_or_upi_request"],
    "requests to share OTPs, passwords, UPI PINs, card details, collect requests or QR-to-receive tricks (English and Hinglish), ignoring warnings like “never share your OTP”",
  ),
  rulesStage("payment", "Payment & registration fees", ["upfront_payment"], "demands to pay a fee, deposit or charge (amounts, named fees, “pay to confirm your seat”), ignoring stipends and salaries"),
  rulesStage("urgency", "Artificial urgency & threats", ["urgency", "account_threat"], "short deadlines, “limited seats”, “offer will be cancelled”, “account will be blocked”, legal threats and “last chance” pressure"),
  rulesStage(
    "manipulation",
    "Secrecy & manipulation",
    ["secrecy", "too_good_to_be_true", "guaranteed_selection", "off_platform_contact", "prompt_injection", "identity_change"],
    "requests to keep it secret or not to call and check, “new number” identity claims, too-good-to-be-true offers, moves to Telegram, “call this number to complete” and hidden instructions aimed at AI tools",
    (ctx) => {
      const c = callToContinueFinding(ctx.text, "message");
      return c ? [c] : [];
    },
  ),
  rulesStage(
    "apps",
    "Apps, remote access & documents",
    ["unsafe_download", "remote_access", "personal_documents", "financial_details_request"],
    "APK or app installs, remote-access tools (AnyDesk, QuickSupport…), requests for ID documents or bank-account details by message (official portals excluded), and whether such details must be sent over an informal channel",
    (ctx) => {
      const fin = applyMessageContext(ctx.text, ruleFindings(ctx.text, "message", ["financial_details_request"]));
      const f = informalChannelFinding(ctx.text, fin);
      return f ? [f] : [];
    },
  ),
  {
    id: "sender",
    name: "Sender indicators",
    run: (ctx) => {
      const found = ruleFindings(ctx.text, "message", ["unverified_sender"]);
      if (ctx.sender && PERSONAL_SENDER.test(ctx.sender) && found.length === 0) {
        found.push({
          id: makeId("f"),
          type: "unverified_sender",
          severity: "supporting",
          source: "sender",
          title: "Sent from a personal email address",
          explanation:
            "The sender uses a free personal email. Official hiring normally comes from the company's own domain or your placement cell. Not proof of fraud — but unverified.",
          evidence: [],
          detail: `Sender: ${ctx.sender}`,
        });
      }
      // A personal email is only a warning when the message claims to speak for an organisation or a job.
      const claimsOrg = JOB_CONTEXT.test(ctx.text) || ORG_CLAIM.test(ctx.text);
      for (const f of found) if (!claimsOrg) f.severity = "info";
      ctx.findings.push(...found);
      if (!ctx.sender && found.length === 0)
        return checkFrom("sender", "Sender indicators", [], {
          status: "unavailable",
          looksFor: "No sender address was given and none appears in the text, so this check couldn't run. Add the sender above to include it.",
          passedRec: "Add the sender's email or number to check it.",
        });
      return checkFrom("sender", "Sender indicators", found, {
        looksFor: "free personal email addresses (Gmail, Outlook, Yahoo…) used for official hiring. CUSTODI cannot confirm who owns any address",
        facts: ctx.sender ? [`Sender: ${ctx.sender}`] : [],
        warnRec: rec,
      });
    },
  },
  {
    id: "context",
    name: "Your answers (context)",
    run: (ctx) => {
      const c = ctx.context;
      const answered = [c.expected, c.recognised, c.askedTo?.length ? "x" : undefined].filter(Boolean).length;
      if (!answered)
        return checkFrom("context", "Your answers (context)", [], {
          status: "unavailable",
          looksFor: "You skipped the optional questions, so CUSTODI judged the text alone. Answering them can raise confidence.",
          passedRec: "Optionally answer: were you expecting it, do you know the sender, and what does it ask you to do?",
        });
      const found: Finding[] = [];
      const facts: string[] = [];
      if (c.expected) facts.push(`Expecting this message: ${ANSWER[c.expected]}`);
      if (c.recognised) facts.push(`Recognise the sender: ${ANSWER[c.recognised]}`);
      if (c.askedTo?.length) facts.push(`Asked to: ${c.askedTo.join(", ")}`);
      if (c.expected === "no" || c.recognised === "no")
        found.push(
          contextFinding(
            "context_unexpected",
            "Unexpected contact",
            c.recognised === "no" ? "You don't recognise the sender" : "You weren't expecting this message",
            "Unexpected messages deserve extra care — but an unknown sender alone is never treated as proof of a scam.",
          ),
        );
      if (c.askedTo?.includes("pay"))
        found.push(contextFinding("context_reported_payment", "You said it asks you to pay or transfer money", "Reported by you", "Any request for money needs independent verification before you act."));
      if (c.askedTo?.includes("share"))
        found.push(contextFinding("context_reported_sensitive", "You said it asks for an OTP or personal information", "Reported by you", "Genuine organisations never need your OTP, PIN or password from a message."));
      if (c.askedTo?.includes("link"))
        found.push(contextFinding("context_reported_link", "You said it asks you to click a link or install an app", "Reported by you", "Reach the organisation by typing its official address yourself instead."));
      if (c.recognised === "yes") facts.push("Familiar sender noted — not proof: accounts and numbers can be hijacked, so serious requests still count fully");
      ctx.findings.push(...found);
      return checkFrom("context", "Your answers (context)", found, {
        looksFor: "warning signs in your answers. They add to the score but never cancel a warning found in the text",
        facts,
        warnRec: rec,
      });
    },
  },
  {
    id: "links",
    name: "Link extraction & structure",
    run: (ctx) => {
      if (ctx.urlCount === 0)
        return checkFrom("links", "Link extraction & structure", [], { status: "skipped", looksFor: "The message contains no web addresses, so there was nothing to inspect." });
      const { findings, links } = linkAnalysis(ctx.text, ctx.opts, "message");
      ctx.links = links;
      ctx.findings.push(...findings);
      return checkFrom("links", "Link extraction & structure", findings.filter((f) => f.type === "suspicious_link"), {
        looksFor: `tricks in ${links.length} address${links.length === 1 ? "" : "es"}: raw IP hosts, shorteners, risky endings, @ tricks, unencrypted links. Links were read as text and never opened`,
        facts: links.map((l) => `Inspected (not opened): ${l.span.text}`),
        warnRec: () => NEXT_STEP.suspicious_link,
      });
    },
  },
  {
    id: "impersonation",
    name: "Look-alike & impersonation",
    run: (ctx) => {
      const own: Finding[] = [];
      // The sender's domain gets the same look-alike checks as a link.
      if (ctx.senderDomain) {
        const hits = urlFindings(ctx.senderDomain, ctx.opts).findings.filter((f) => IMPERSONATION_TYPES.includes(f.type) && f.severity !== "info");
        for (const h of hits) own.push({ ...h, id: makeId("f"), source: "sender", evidence: [], detail: `Sender domain: ${ctx.senderDomain}` });
      }
      ctx.findings.push(...own);
      if (!ctx.senderDomain && ctx.links.length === 0)
        return checkFrom("impersonation", "Look-alike & impersonation", [], { status: "skipped", looksFor: "No links and no sender domain to compare, so there was nothing to check." });
      // Link-based impersonation findings were produced by linkAnalysis in the previous stage.
      const fromLinks = ctx.findings.filter((f) => f.source === "message" && IMPERSONATION_TYPES.includes(f.type));
      return checkFrom("impersonation", "Look-alike & impersonation", [...fromLinks, ...own], {
        looksFor: "look-alike spellings (g00gle, inf0sys), encoded characters, well-known names (including “bank”) inside unrelated domains and your trusted domains used as disguises — in links and the sender's domain",
        warnRec: () => "Don't trust the name you see. Go to the organisation's site by typing its address yourself.",
      });
    },
  },
  { id: "reputation", name: "Threat intelligence & reputation", run: () => REPUTATION_CHECK() },
  {
    id: "risk",
    name: "Risk calculation",
    run: (ctx) => {
      const r = scoreFindings(ctx.findings, ctx.text);
      return {
        id: "risk",
        name: "Risk calculation",
        status: "passed",
        severity: "none",
        evidence: [
          ...(r.contributions.length ? r.contributions.map((c) => `+${c.points}  ${c.label}`) : ["No warning indicators — 0 points"]),
          `Score ${r.score}/100 (capped at 100; each category counts once)`,
          "Bands: 0–19 Low · 20–49 Medium · 50–100 High",
          ...(r.critical.active ? [`Critical override → High: ${r.critical.reasons.join("; ")}`] : []),
        ],
        findingIds: [],
        explanation: "Transparent, hand-set weights calibrated on CUSTODI's fictional test cases — not a probability of fraud.",
        recommendation: "See the assessment below.",
        durationMs: 0,
      };
    },
  },
  {
    id: "report",
    name: "Assessment & recommendations",
    run: (ctx) => {
      const level = scoreFindings(ctx.findings, ctx.text).riskLevel;
      const steps = nextStepsFor(level, sortFindings(ctx.findings));
      return {
        id: "report",
        name: "Assessment & recommendations",
        status: "passed",
        severity: "none",
        evidence: [`Verdict: ${VERDICT[level].label}`, ...steps.map((s, i) => `${i + 1}. ${s}`)],
        findingIds: [],
        explanation: VERDICT[level].description,
        recommendation: VERIFY_ADVICE,
        durationMs: 0,
      };
    },
  },
];

export interface MessagePipeline {
  stages: { id: string; name: string }[];
  /** Runs the next stage for real and returns its result, or null when finished. */
  next(): CheckResult | null;
  readonly done: boolean;
  /** Findings produced so far (for progressive highlighting). */
  readonly findings: Finding[];
  /** Runs any remaining stages and returns the full report. */
  result(): MessageReport;
}

export function createMessagePipeline(input: MessageInput, opts: AnalyzeOptions = {}): MessagePipeline {
  const sender = input.sender?.trim() || undefined;
  const ctx: Ctx = {
    text: (input.text ?? "").slice(0, MAX_MESSAGE_LENGTH),
    channel: input.channel ?? "other",
    sender,
    senderDomain: sender?.includes("@") ? sender.split("@").pop()?.toLowerCase() : undefined,
    context: input.context ?? {},
    opts,
    findings: [],
    links: [],
    urlCount: 0,
  };
  const checks: CheckResult[] = [];
  let i = 0;

  const next = () => {
    const stage = MESSAGE_STAGES[i];
    if (!stage) return null;
    const t0 = now();
    const res = stage.run(ctx);
    res.durationMs = now() - t0;
    checks.push(res);
    i++;
    return res;
  };

  return {
    stages: MESSAGE_STAGES.map(({ id, name }) => ({ id, name })),
    next,
    get done() {
      return i >= MESSAGE_STAGES.length;
    },
    get findings() {
      return ctx.findings;
    },
    result() {
      while (next());
      const sorted = sortFindings(ctx.findings);
      const scored = scoreFindings(sorted, ctx.text);
      const riskLevel = scored.riskLevel;
      return {
        kind: "message",
        id: makeId("msg"),
        score: scored.score,
        verdict: VERDICT[riskLevel],
        contributions: scored.contributions,
        critical: scored.critical,
        confidence: confidenceOf(ctx),
        senderVerification: senderVerificationOf(ctx),
        context: ctx.context,
        checks,
        analyzedAt: (opts.now ?? new Date()).toISOString(),
        engineVersion: ENGINE_VERSION,
        channel: ctx.channel,
        sender,
        textLength: ctx.text.length,
        riskLevel,
        headline: HEADLINE[riskLevel],
        summary: SUMMARY[riskLevel],
        findings: sorted,
        nextSteps: nextStepsFor(riskLevel, sorted),
        verifyAdvice: VERIFY_ADVICE,
        uncertaintyNote: UNCERTAINTY_NOTE,
      };
    },
  };
}

function confidenceOf(ctx: Ctx): { level: ConfidenceLevel; reasons: string[] } {
  let pts = 0;
  const reasons: string[] = [];
  const len = ctx.text.trim().length;
  if (len >= 120) pts += 1;
  else if (len >= 40) {
    pts += 0.5;
    reasons.push("Message is fairly short");
  } else reasons.push("Message is very short");
  if (ctx.sender) pts += 1;
  else reasons.push("No sender given");
  if (ctx.channel !== "other") pts += 0.5;
  const c = ctx.context;
  const answered = [c.expected, c.recognised, c.askedTo?.length ? 1 : undefined].filter(Boolean).length;
  if (answered >= 2) pts += 1;
  else if (answered === 1) pts += 0.5;
  else reasons.push("Optional questions skipped");
  if (!reasons.length) reasons.push("Full message, sender and your answers were available");
  return { level: pts >= 3 ? "high" : pts >= 1.5 ? "medium" : "low", reasons };
}

function senderVerificationOf(ctx: Ctx): { status: SenderVerification; explanation: string } {
  if (!ctx.sender) return { status: "unknown", explanation: "No sender was given, so it couldn't be checked." };
  if (ctx.senderDomain && isTrustedHost(ctx.senderDomain, ctx.opts.trustedDomains))
    return { status: "verified", explanation: `${ctx.senderDomain} is on your trusted list. That's your list — an address can still be spoofed or hacked.` };
  return {
    status: "unverified",
    explanation: ctx.senderDomain
      ? "CUSTODI can't confirm who owns this address. Only domains on your trusted list are marked verified."
      : "Phone numbers can't be verified by CUSTODI. A saved or familiar number is not proof of who is writing.",
  };
}

export function analyzeMessage(input: MessageInput, opts: AnalyzeOptions = {}): MessageReport {
  return createMessagePipeline(input, opts).result();
}

export { quote };
