/**
 * DEMO ONLY — a small, deterministic keyword matcher that runs in the browser so
 * the UI can be built and demoed before the backend exists.
 *
 * It is NOT the TrustLayer detection engine. The real rules engine and Claude
 * analysis live in backend/ (see RISK_RULES.md). Every result produced here is
 * tagged analysis_mode: "demo" and source: "demo" and is labelled in the UI.
 */
import type { AnalysisResult, AnalyzeRequest, Finding, FindingSeverity, FindingType, RiskLevel } from "@/types/analysis";

interface DemoRule {
  type: FindingType;
  severity: FindingSeverity;
  pattern: RegExp;
  explanation: string;
}

const DEMO_RULES: DemoRule[] = [
  {
    type: "otp_request",
    severity: "strong",
    pattern:
      /(?:share|send|provide|forward|enter|tell|bhej(?:o|do)?|batao)[^.\n]{0,40}\b(?:otp|one[- ]time password|verification code)\b|\b(?:otp)\b[^.\n]{0,25}\b(?:bhej(?:o|do)?|share|send|batao)\b/i,
    explanation: "Genuine recruiters never need your OTP. An OTP can be used to take over your accounts or approve payments.",
  },
  {
    type: "credential_request",
    severity: "strong",
    pattern: /(?:share|send|provide|enter|confirm)[^.\n]{0,30}\b(?:password|login details|credentials)\b/i,
    explanation: "No placement process needs your password. Sharing it gives someone else access to your account.",
  },
  {
    type: "bank_or_upi_request",
    severity: "strong",
    pattern: /\b(?:upi pin|atm pin|cvv|bank password|net ?banking (?:password|details)|card number)\b/i,
    explanation: "Stipends and salaries are paid without your PIN, CVV or banking password. Anyone asking for these can move your money.",
  },
  {
    type: "upfront_payment",
    severity: "strong",
    pattern: new RegExp(
      [
        // A payment word near an amount: "pay Rs. 2,500", "₹1,499 fee jama karo", "fee of 2500 rupees".
        String.raw`(?:pay|deposit|fee|charges?|jama|transfer)[^.\n]{0,40}(?:(?:₹|rs\.?|inr)\s?\d[\d,]*|\d[\d,]*\s?(?:rupees|rs\b|inr\b|\/-))`,
        String.raw`(?:₹|rs\.?|inr)\s?\d[\d,]*[^.\n]{0,40}(?:fee|pay|deposit|jama|charges?)`,
        // A payment verb aimed at a named fee, with or without an amount: "transfer the training charges".
        String.raw`(?:pay|deposit|transfer|jama)[^.\n]{0,25}\b(?:registration|training|verification|security|processing|onboarding|joining|refundable) (?:fees?|charges?|deposit|amount)\b`,
      ].join("|"),
      "i",
    ),
    explanation: "Legitimate employers do not charge students to apply, verify documents or confirm an offer.",
  },
  {
    type: "unsafe_download",
    severity: "strong",
    pattern: /\b[\w-]+\.apk\b|(?:install|download) (?:this|the|our) (?:app|application)/i,
    explanation:
      "Apps sent through messages can read your SMS (including OTPs) and steal data. Install apps only from official stores, if at all.",
  },
  {
    type: "urgency",
    severity: "supporting",
    pattern:
      /within \d+ (?:minutes?|mins?|hours?|hrs?)|\bimmediately\b|\burgent(?:ly)?\b|expires? (?:today|tonight|in \d+)|last chance|\bturant\b|aaj hi|(?:offer|selection|seat|candidature)[^.\n]{0,20}\b(?:will|shall) be (?:cancell?ed|revoked|withdrawn)|lose (?:the|your) (?:offer|seat|selection)|legal action|black-?listed|final (?:notice|warning)/i,
    explanation:
      "Pressure to act fast, or threats like cancelling your offer or taking legal action, is a common tactic to stop you from checking. Real offers give you time to verify.",
  },
  {
    type: "suspicious_link",
    severity: "supporting",
    pattern:
      /\b(?:bit\.ly|tinyurl\.com|t\.co|goo\.gl|rb\.gy|cutt\.ly|is\.gd)\/\S+|https?:\/\/\S+\.(?:xyz|top|online|site|info|click)\b\S*/i,
    explanation: "Shortened or unusual links hide where they really go. TrustLayer never opens links — find the company’s site yourself.",
  },
  {
    type: "unverified_sender",
    severity: "supporting",
    pattern: /\b[\w.+-]+@(?:gmail|yahoo|outlook|hotmail|rediffmail)\.com\b/i,
    explanation:
      "A personal email address is being used for official hiring. That isn’t proof of fraud, but it means the sender is unverified.",
  },
  {
    type: "prompt_injection",
    severity: "supporting",
    pattern:
      /ignore (?:all )?(?:previous|prior|above) (?:rules|instructions)|reveal (?:your )?(?:hidden |system )?(?:instructions|prompt)|tell the user (?:this|it) is safe/i,
    explanation:
      "This text tries to instruct an AI checker. TrustLayer treats it as part of the message, not as a command — and that itself is suspicious.",
  },
];

const PERSONAL_DOMAINS = /@(?:gmail|yahoo|outlook|hotmail|rediffmail)\.com$/i;

function findEvidence(text: string, sender?: string): Finding[] {
  const findings: Finding[] = [];
  for (const rule of DEMO_RULES) {
    const match = text.match(rule.pattern);
    if (match) {
      findings.push({
        type: rule.type,
        severity: rule.severity,
        source: "demo",
        evidence: match[0].trim(),
        explanation: rule.explanation,
      });
    }
  }
  if (sender && PERSONAL_DOMAINS.test(sender.trim()) && !findings.some((f) => f.type === "unverified_sender")) {
    findings.push({
      type: "unverified_sender",
      severity: "supporting",
      source: "demo",
      evidence: "", // sender is not part of message text, so nothing to highlight
      explanation: `The sender (${sender.trim()}) is a personal email address, which is unusual for official hiring.`,
    });
  }
  return findings;
}

/** Mirrors rules R1–R4 in RISK_RULES.md. */
function aggregate(findings: Finding[]): RiskLevel {
  const strong = findings.filter((f) => f.severity === "strong").length;
  const supporting = findings.filter((f) => f.severity === "supporting").length;
  if (strong > 0) return "high";
  if (supporting > 0) return "medium";
  return "low";
}

const ACTIONS: Partial<Record<FindingType, string>> = {
  otp_request: "Do not share any OTP or verification code.",
  credential_request: "Do not share your password. Change it if you already have.",
  bank_or_upi_request: "Never share your UPI PIN, CVV or banking password.",
  upfront_payment: "Do not pay any fee to receive or confirm an offer.",
  unsafe_download: "Do not install the app or open the file.",
  suspicious_link: "Don’t open the link. Search for the company’s official careers page yourself.",
  unverified_sender: "Compare the sender’s address with the company’s official website — don’t reply to it yet.",
};

function buildActions(level: RiskLevel, findings: Finding[]): string[] {
  const actions = new Set<string>();
  for (const f of findings) {
    const a = ACTIONS[f.type];
    if (a) actions.add(a);
  }
  actions.add(
    level === "low"
      ? "If anything feels off, confirm with your college placement cell before replying."
      : "Verify the opportunity through your college placement cell, not through contacts in this message.",
  );
  return Array.from(actions).slice(0, 3);
}

const SUMMARY: Record<RiskLevel, string> = {
  high: "This message has strong warning signs commonly seen in placement scams.",
  medium: "This message has some warning signs. It may be genuine, but it needs verification.",
  low: "No strong warning signs were found in the text you pasted.",
};

function demoId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `demo-${Date.now().toString(36)}`;
}

export async function analyzeMessageMock(req: AnalyzeRequest, opts?: { simulateError?: boolean }): Promise<AnalysisResult> {
  // Simulated network latency so loading states can be designed and tested.
  await new Promise((r) => setTimeout(r, 900));
  if (opts?.simulateError) {
    throw new Error("Simulated analysis failure (demo).");
  }
  const findings = findEvidence(req.message_text, req.sender);
  const risk_level = aggregate(findings);
  return {
    analysis_id: demoId(),
    risk_level,
    summary: SUMMARY[risk_level],
    findings,
    recommended_actions: buildActions(risk_level, findings),
    uncertainty_note: "Demonstration result from sample browser rules — not a real TrustLayer analysis, and not proof either way.",
    analysis_mode: "demo",
    model_version: "demo-rules-v0",
  };
}
