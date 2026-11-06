/**
 * CUSTODI shared types. Used by the web app, the PWA and the Chrome extension.
 */

export type RiskLevel = "low" | "medium" | "high";

/**
 * strong     – on its own makes a message high risk (e.g. OTP request, fee demand).
 * supporting – a warning sign that needs verification (e.g. urgency, personal email).
 * info       – context shown to the user, never raises risk (e.g. "HTTPS is not proof").
 */
export type Severity = "strong" | "supporting" | "info";

export type Channel = "email" | "sms" | "whatsapp" | "other";

export type IndicatorType =
  | "otp_request"
  | "credential_request"
  | "bank_or_upi_request"
  | "upfront_payment"
  | "unsafe_download"
  | "remote_access"
  | "urgency"
  | "secrecy"
  | "unverified_sender"
  | "suspicious_link"
  | "off_platform_contact"
  | "too_good_to_be_true"
  | "personal_documents"
  | "prompt_injection"
  | "call_to_continue"
  | "account_threat"
  | "identity_change"
  | "guaranteed_selection"
  | "financial_details_request"
  | "informal_channel_financial"
  // From the user's optional answers
  | "context_unexpected"
  | "context_reported_payment"
  | "context_reported_sensitive"
  | "context_reported_link"
  // URL / website indicators
  | "ip_address_host"
  | "punycode_host"
  | "lookalike_domain"
  | "brand_in_unrelated_domain"
  | "url_shortener"
  | "risky_tld"
  | "credentials_in_url"
  | "dangerous_scheme"
  | "insecure_connection"
  | "sensitive_keywords_in_url"
  | "complex_hostname"
  | "suspicious_parameters"
  | "https_is_not_proof"
  | "trusted_domain"
  | "imitates_trusted_domain"
  | "invalid_url"
  // Page form indicators
  | "sensitive_field_request";

/** Where in the analysed text the evidence sits. `text` is always an exact substring. */
export interface EvidenceSpan {
  text: string;
  start: number;
  end: number;
}

export type FindingSource = "message" | "sender" | "url" | "page-text" | "page-form";

export interface Finding {
  id: string;
  type: IndicatorType;
  severity: Severity;
  source: FindingSource;
  title: string;
  /** Plain-language explanation for a student. */
  explanation: string;
  /** Exact quotes. May be empty when the signal is structural (e.g. sender field or form fields). */
  evidence: EvidenceSpan[];
  /** Extra detail, e.g. "3 OTP fields" or the sender address. */
  detail?: string;
}

export type Answer = "yes" | "no" | "unsure";
export type AskedTo = "pay" | "share" | "link" | "reply" | "other" | "nothing";

/** Optional answers the user can give. Kept on the device; never verified against anything. */
export interface MessageContext {
  expected?: Answer;
  recognised?: Answer;
  askedTo?: AskedTo[];
}

export interface MessageInput {
  text: string;
  channel?: Channel;
  sender?: string;
  context?: MessageContext;
}

export interface ScoreContributionDTO {
  id: string;
  label: string;
  points: number;
  findingIds: string[];
}

export type ConfidenceLevel = "low" | "medium" | "high";
export type SenderVerification = "verified" | "unverified" | "unknown";

export interface AnalyzeOptions {
  /** Domains the user or their placement cell has marked as trusted. Nothing is trusted by default. */
  trustedDomains?: string[];
  /** Override the clock (tests). */
  now?: Date;
}

/**
 * passed      – the check ran and found nothing to worry about (never means "safe").
 * warning     – the check ran and found evidence.
 * unavailable – CUSTODI cannot perform this check (e.g. no sender given, no reputation data).
 * skipped     – the check didn't apply (e.g. no links in the message).
 */
export type CheckStatus = "passed" | "warning" | "unavailable" | "skipped";

/** One step of the analysis pipeline. Every check shown in the UI is one of these — none are decorative. */
export interface CheckResult {
  id: string;
  name: string;
  status: CheckStatus;
  severity: Severity | "none";
  /** Exact quotes or concrete facts the check produced. */
  evidence: string[];
  findingIds: string[];
  explanation: string;
  recommendation: string;
  /** Real measured time for this check, in milliseconds. */
  durationMs: number;
}

/** How CUSTODI words a result for students. Never "safe". */
export interface Verdict {
  /** "Suspicious" | "Unverified" | "Low risk" */
  label: string;
  description: string;
}

interface BaseReport {
  id: string;
  /**
   * Transparent rule score 0–100: 45 per strong sign + 15 per different warning sign (capped).
   * It mirrors the risk band (≥45 = High). It is NOT a probability.
   */
  score: number;
  verdict: Verdict;
  /** Ordered analysis checks. Optional only so scans saved by older versions still load. */
  checks?: CheckResult[];
  analyzedAt: string;
  engineVersion: string;
  riskLevel: RiskLevel;
  headline: string;
  summary: string;
  findings: Finding[];
  nextSteps: string[];
  verifyAdvice: string;
  uncertaintyNote: string;
}

export interface MessageReport extends BaseReport {
  kind: "message";
  /** Points each indicator category added to the score. */
  contributions?: ScoreContributionDTO[];
  critical?: { active: boolean; reasons: string[] };
  /** How much useful evidence was available — independent of risk. */
  confidence?: { level: ConfidenceLevel; reasons: string[] };
  senderVerification?: { status: SenderVerification; explanation: string };
  context?: MessageContext;
  channel: Channel;
  sender?: string;
  textLength: number;
}

/**
 * verified   – the hostname is on the user's own trusted list and no strong warning sign was found.
 * suspicious – at least one warning sign was found.
 * unknown    – no warning sign found, but CUSTODI cannot confirm who owns the site.
 */
export type SiteStatus = "verified" | "suspicious" | "unknown";

export interface UrlReport extends BaseReport {
  kind: "url";
  input: string;
  normalizedUrl?: string;
  hostname?: string;
  registrableDomain?: string;
  protocol?: string;
  status: SiteStatus;
}

export interface PageFieldCounts {
  password: number;
  otp: number;
  card: number;
  cvv: number;
  upiPin: number;
  govId: number;
  bankAccount: number;
}

/** Collected from a page only after the user asks for a scan. */
export interface PageSignals {
  url: string;
  title?: string;
  text?: string;
  fields: PageFieldCounts;
  /** Hostnames that the page's forms submit to. */
  formActionHosts?: string[];
}

export interface PageReport extends BaseReport {
  kind: "page";
  url: string;
  title?: string;
  hostname?: string;
  status: SiteStatus;
  /** Length of the page text that was analysed (after truncation). */
  analysedTextLength: number;
}

export type Report = MessageReport | UrlReport | PageReport;
