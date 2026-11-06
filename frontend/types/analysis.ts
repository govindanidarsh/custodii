/**
 * Shared analysis types. These mirror API_CONTRACT.md (POST /api/v1/analyze).
 * If the contract changes, update API_CONTRACT.md first, then this file.
 */

export type Channel = "email" | "sms" | "whatsapp" | "other";

export type RiskLevel = "low" | "medium" | "high";

export type FindingType =
  | "otp_request"
  | "credential_request"
  | "upfront_payment"
  | "bank_or_upi_request"
  | "unsafe_download"
  | "urgency"
  | "unverified_sender"
  | "suspicious_link"
  | "prompt_injection"
  | "other";

export type FindingSeverity = "strong" | "supporting";

/** Where a finding came from. "demo" = the local mock used before the backend exists. */
export type FindingSource = "rules" | "model" | "demo";

/** "demo" results are generated in the browser and are not real analysis. */
export type AnalysisMode = "full" | "rules_only" | "demo";

export interface AnalyzeRequest {
  message_text: string;
  channel: Channel;
  sender?: string;
  locale: "en";
}

export interface Finding {
  type: FindingType;
  severity: FindingSeverity;
  source: FindingSource;
  /** Exact substring of the submitted message. */
  evidence: string;
  explanation: string;
}

export interface AnalysisResult {
  analysis_id: string;
  risk_level: RiskLevel;
  summary: string;
  findings: Finding[];
  recommended_actions: string[];
  uncertainty_note: string;
  analysis_mode: AnalysisMode;
  model_version: string;
}
