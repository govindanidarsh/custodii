/**
 * CUSTODI risk scoring — one deterministic, explainable engine for every message channel.
 *
 * score = sum of category weights for each category that has at least one warning-level finding
 *         (+ documented context modifiers), capped at 100.
 * Each category counts ONCE, however many phrases trigger it, so one behaviour can't inflate the score.
 * Levels: 0–19 Low · 20–49 Medium · 50–100 High.
 * Critical overrides (direct OTP/PIN/password requests, remote-access tools or sideloaded app files) force High
 * and show a critical warning whatever the numeric score.
 *
 * These weights are hand-set and calibrated only against CUSTODI's fictional Test Lab cases.
 * They are NOT statistically validated probabilities.
 */
import { ACCEPTED_OFFER, BY_MESSAGE } from "./message";
import type { Finding, IndicatorType, RiskLevel } from "./types";

export interface ScoringCategory {
  id: string;
  label: string;
  points: number;
  types: IndicatorType[];
}

export interface ScoringConfig {
  thresholds: { medium: number; high: number };
  categories: ScoringCategory[];
  /** Added when a payment demand appears in a job/internship/recruitment context. */
  jobFeeBonus: number;
  /** Added when bank details are requested back by message and no offer has been accepted. */
  unsolicitedBankBonus: number;
}

export const DEFAULT_SCORING: ScoringConfig = {
  thresholds: { medium: 20, high: 50 },
  jobFeeBonus: 20,
  unsolicitedBankBonus: 30,
  categories: [
    { id: "credential", label: "Direct OTP / PIN / password request", points: 35, types: ["otp_request", "credential_request", "bank_or_upi_request"] },
    { id: "payment", label: "Payment, deposit or fee demand", points: 30, types: ["upfront_payment", "context_reported_payment"] },
    { id: "app", label: "Suspicious app install or remote access", points: 30, types: ["unsafe_download", "remote_access"] },
    {
      id: "impersonation",
      label: "Sender impersonation / domain mismatch",
      points: 20,
      types: ["unverified_sender", "identity_change", "lookalike_domain", "brand_in_unrelated_domain", "punycode_host", "imitates_trusted_domain"],
    },
    { id: "threat", label: "Account closure or serious threat", points: 15, types: ["account_threat"] },
    { id: "secrecy", label: "Secrecy or discouraging verification", points: 15, types: ["secrecy"] },
    { id: "url", label: "Suspicious or disguised URL", points: 15, types: ["suspicious_link", "context_reported_link"] },
    { id: "urgency", label: "Artificial urgency / countdown", points: 10, types: ["urgency"] },
    { id: "reward", label: "Unrealistic reward or earnings promise", points: 10, types: ["too_good_to_be_true"] },
    { id: "unexpected", label: "Unexpected contact", points: 5, types: ["context_unexpected"] },
    // Additional categories (not in the original weight table) — documented in CUSTODI.md.
    { id: "documents", label: "ID documents requested over chat", points: 20, types: ["personal_documents"] },
    { id: "selection", label: "Job promised without any assessment", points: 20, types: ["guaranteed_selection"] },
    { id: "financial", label: "Unexpected request for bank-account details", points: 20, types: ["financial_details_request"] },
    { id: "sensitive", label: "You reported a request for OTP / personal info", points: 20, types: ["context_reported_sensitive"] },
    { id: "ai", label: "Hidden instructions aimed at AI checkers", points: 20, types: ["prompt_injection"] },
    {
      id: "off_record",
      label: "Moves you off the record (Telegram, phone call or informal messaging)",
      points: 20,
      types: ["off_platform_contact", "call_to_continue", "informal_channel_financial"],
    },
  ],
};

export const JOB_CONTEXT =
  /\b(?:selected|selection|shortlisted|congratulations|offer|job|internship|intern|placement|recruit\w*|hiring|interview|joining|onboarding|work[- ]from[- ]home|part[- ]time)\b/i;

export interface ScoreContribution {
  id: string;
  label: string;
  points: number;
  findingIds: string[];
}

export interface ScoreResult {
  score: number;
  riskLevel: RiskLevel;
  contributions: ScoreContribution[];
  critical: { active: boolean; reasons: string[] };
}

const SIDELOAD = /\.(?:apk|exe|scr|bat|msi|cmd|jar)\b/i;

export function scoreFindings(findings: Finding[], text: string, config: ScoringConfig = DEFAULT_SCORING): ScoreResult {
  const warnings = findings.filter((f) => f.severity !== "info");
  const contributions: ScoreContribution[] = [];
  for (const cat of config.categories) {
    const hits = warnings.filter((f) => cat.types.includes(f.type));
    if (hits.length) contributions.push({ id: cat.id, label: cat.label, points: cat.points, findingIds: hits.map((h) => h.id) });
  }
  const payment = contributions.find((c) => c.id === "payment");
  if (payment && JOB_CONTEXT.test(text))
    contributions.push({ id: "job_fee", label: "Fee demanded in a job / internship context", points: config.jobFeeBonus, findingIds: payment.findingIds });

  // Bank details requested back by message, with no accepted offer: the classic mule/fraud setup → Suspicious.
  const financial = contributions.find((c) => c.id === "financial");
  if (financial && BY_MESSAGE.test(text) && !ACCEPTED_OFFER.test(text))
    contributions.push({ id: "unsolicited_bank", label: "Bank details requested by message before any accepted offer", points: config.unsolicitedBankBonus, findingIds: financial.findingIds });

  const reasons: string[] = [];
  if (warnings.some((f) => f.type === "otp_request" || f.type === "credential_request" || f.type === "bank_or_upi_request"))
    reasons.push("Directly asks for an OTP, PIN, password or card/bank secret");
  if (warnings.some((f) => f.type === "remote_access")) reasons.push("Asks you to install remote-access software");
  if (warnings.some((f) => f.type === "unsafe_download" && f.evidence.some((e) => SIDELOAD.test(e.text)))) reasons.push("Asks you to install an app file sent outside an app store");

  const score = Math.min(100, contributions.reduce((s, c) => s + c.points, 0));
  const critical = reasons.length > 0;
  const riskLevel: RiskLevel = critical || score >= config.thresholds.high ? "high" : score >= config.thresholds.medium ? "medium" : "low";
  return { score, riskLevel, contributions, critical: { active: critical, reasons } };
}
