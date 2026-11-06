/**
 * Website analysis: combines the URL checks, the page's visible text and the kinds of
 * sensitive input fields on the page. Signals are collected only after the user asks for a scan.
 */
import { byTypes, checkFrom, REPUTATION_CHECK } from "./checks";
import { nextStepsFor, textFindings } from "./message";
import type { AnalyzeOptions, Finding, PageFieldCounts, PageReport, PageSignals, SiteStatus } from "./types";
import { isTrustedHost, siteStatus, urlFindings } from "./url";
import { ENGINE_VERSION, UNCERTAINTY_NOTE, VERIFY_ADVICE, aggregateRisk, riskScore, VERDICT, makeId, sortFindings } from "./util";

export const MAX_PAGE_TEXT = 20_000;

const PLACEMENT_CONTEXT =
  /\b(?:offer letter|internship|placement|recruit(?:er|ment)|hiring|shortlisted|selected|selection|joining|stipend|onboarding|campus drive|job offer)\b/i;

export const EMPTY_FIELDS: PageFieldCounts = { password: 0, otp: 0, card: 0, cvv: 0, upiPin: 0, govId: 0, bankAccount: 0 };

const FIELD_LABEL: Record<keyof PageFieldCounts, string> = {
  password: "password",
  otp: "OTP / verification code",
  card: "card number",
  cvv: "CVV",
  upiPin: "UPI PIN",
  govId: "Aadhaar / PAN / passport",
  bankAccount: "bank account",
};

function fieldFindings(fields: PageFieldCounts, ctx: { placement: boolean; urlRisky: boolean; http: boolean }): Finding[] {
  const out: Finding[] = [];
  const present = (Object.keys(fields) as (keyof PageFieldCounts)[]).filter((k) => fields[k] > 0);
  if (present.length === 0) return out;
  const names = present.map((k) => FIELD_LABEL[k]).join(", ");
  const financial = present.filter((k) => k === "otp" || k === "card" || k === "cvv" || k === "upiPin" || k === "bankAccount");

  if (fields.upiPin > 0) {
    out.push({
      id: makeId("f"),
      type: "sensitive_field_request",
      severity: "strong",
      source: "page-form",
      title: "Page asks for your UPI PIN",
      explanation: "A UPI PIN is only ever entered inside your own UPI app to send money. A web page asking for it is a scam.",
      evidence: [],
      detail: `Fields found: ${names}`,
    });
    return out;
  }

  if ((ctx.placement && financial.length > 0) || (ctx.http && (fields.password > 0 || financial.length > 0))) {
    out.push({
      id: makeId("f"),
      type: "sensitive_field_request",
      severity: "strong",
      source: "page-form",
      title: ctx.http ? "Asks for secrets over an unencrypted page" : "Job or internship page asks for payment or OTP details",
      explanation: ctx.http
        ? "This page asks for sensitive details but the connection is not encrypted. Never type secrets here."
        : "Placement and internship pages have no reason to ask for OTPs, card or bank details. This pattern is typical of scam sites.",
      evidence: [],
      detail: `Fields found: ${names}`,
    });
  } else if (ctx.urlRisky || (ctx.placement && fields.govId > 0)) {
    out.push({
      id: makeId("f"),
      type: "sensitive_field_request",
      severity: "supporting",
      title: "Asks for sensitive details on an unverified site",
      source: "page-form",
      explanation: "This page wants sensitive information and its address already shows warning signs. Only enter details on sites you reached by typing the official address yourself.",
      evidence: [],
      detail: `Fields found: ${names}`,
    });
  } else {
    out.push({
      id: makeId("f"),
      type: "sensitive_field_request",
      severity: "info",
      source: "page-form",
      title: "Page has sensitive input fields",
      explanation: "This page asks for sensitive details. That is normal for real login or payment pages — make sure you opened this site yourself and didn't arrive through a link in a message.",
      evidence: [],
      detail: `Fields found: ${names}`,
    });
  }
  return out;
}

export function analyzePage(signals: PageSignals, opts: AnalyzeOptions = {}): PageReport {
  const { parsed, findings: urlF } = urlFindings(signals.url, opts);
  const text = (signals.text ?? "").slice(0, MAX_PAGE_TEXT);
  const trusted = parsed ? isTrustedHost(parsed.hostname, opts.trustedDomains) : false;
  const placement = PLACEMENT_CONTEXT.test(text) || PLACEMENT_CONTEXT.test(signals.title ?? "");
  // Ordinary web pages are full of "today only" and email addresses. Outside a job/internship context
  // only strong text signs count; weaker ones are kept as notes so Live Observe doesn't cry wolf.
  const textF = textFindings(text, opts, "page-text")
    .filter((f) => f.type !== "unverified_sender")
    .map((f) => (f.severity === "supporting" && !placement ? { ...f, severity: "info" as const } : f));
  const urlRisky = urlF.some((f) => f.severity !== "info");
  const fields = { ...EMPTY_FIELDS, ...signals.fields };
  const formF = fieldFindings(fields, {
    placement,
    urlRisky,
    http: parsed?.url.protocol === "http:",
  });

  const offsite = (signals.formActionHosts ?? []).filter((h) => parsed && h && h !== parsed.hostname && !isTrustedHost(h, opts.trustedDomains));
  if (offsite.length > 0 && (fields.password > 0 || fields.otp > 0 || fields.card > 0)) {
    formF.push({
      id: makeId("f"),
      type: "sensitive_field_request",
      severity: "supporting",
      source: "page-form",
      title: "Form sends your details to a different website",
      explanation: "The form on this page submits to another domain. That can be normal for payment providers, but it is also how credential-stealing pages work.",
      evidence: [],
      detail: `Submits to: ${Array.from(new Set(offsite)).slice(0, 3).join(", ")}`,
    });
  }

  const findings = sortFindings([...urlF, ...textF, ...formF]);
  const riskLevel = aggregateRisk(findings);
  const status: SiteStatus = parsed ? siteStatus(findings, trusted) : "unknown";

  const steps = nextStepsFor(riskLevel, findings);
  if (findings.some((f) => f.type === "sensitive_field_request" && f.severity !== "info"))
    steps.unshift("Do not type any OTP, PIN, password or card details on this page.");

  return {
    kind: "page",
    id: makeId("page"),
    score: riskScore(findings),
    verdict: VERDICT[riskLevel],
    checks: [
      checkFrom("address", "Page address", urlF, { looksFor: "IP hosts, look-alike names, shorteners, risky endings and unencrypted connections in this page's address" }),
      checkFrom("text", "Visible page text", textF, {
        looksFor: placement
          ? "OTP/PIN/password requests, fees, app installs, pressure and other scam wording on this job/internship page"
          : "strong scam wording (OTP/PIN requests, fees, app installs). Weaker signs are only notes on pages without job or internship context",
        facts: [`${text.length.toLocaleString()} characters analysed · job/internship context ${placement ? "detected" : "not detected"}`],
      }),
      checkFrom("fields", "Sensitive form fields", byTypes(formF, ["sensitive_field_request"]), {
        looksFor: "fields asking for passwords, OTPs, card/CVV, UPI PIN, ID or bank numbers (field types only — typed values are never read)",
        facts: [`Fields found: ${Object.entries(fields).filter(([, v]) => v > 0).map(([k, v]) => `${k}×${v}`).join(", ") || "none"}`],
      }),
      REPUTATION_CHECK(),
    ],
    analyzedAt: (opts.now ?? new Date()).toISOString(),
    engineVersion: ENGINE_VERSION,
    url: signals.url,
    title: signals.title,
    hostname: parsed?.hostname,
    status,
    riskLevel,
    headline:
      status === "verified" ? "On your trusted list" : status === "suspicious" ? (riskLevel === "high" ? "High risk page" : "Suspicious page") : "Unknown — not verified",
    summary:
      status === "verified"
        ? "This site is on your trusted list and CUSTODI found no strong warning signs on the page."
        : status === "suspicious"
          ? `CUSTODI found ${findings.filter((f) => f.severity !== "info").length} warning sign(s) on this page.`
          : "No warning signs found on this page. CUSTODI cannot confirm who runs the site, so treat it as unverified.",
    findings,
    nextSteps: Array.from(new Set(steps)).slice(0, 3),
    verifyAdvice: VERIFY_ADVICE,
    uncertaintyNote: UNCERTAINTY_NOTE,
    analysedTextLength: text.length,
  };
}
