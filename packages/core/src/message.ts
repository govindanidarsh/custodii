/**
 * Message analysis: rules that look for the warning signs behind placement and internship scams.
 * Every finding quotes the exact text that triggered it, so students can see the evidence.
 *
 * The rules are deliberately transparent (no hidden scoring) and include common Hinglish phrasings.
 */
import type { AnalyzeOptions, EvidenceSpan, Finding, IndicatorType, RiskLevel, Severity } from "./types";
import { urlFindings } from "./url";
import { findSpans, makeId } from "./util";

export const MAX_MESSAGE_LENGTH = 10_000;

interface Rule {
  type: IndicatorType;
  severity: Severity;
  title: string;
  explanation: string;
  patterns: RegExp[];
  /** Ignore a match when the text right before it negates it ("never share your OTP"). */
  negatable?: boolean;
  /** Ignore a match whose text matches this (e.g. a stipend amount is not a fee). */
  exclude?: RegExp;
  /** Also look this many characters AFTER the match for the exclusion (e.g. "… on the official portal"). */
  excludeAhead?: number;
}

/** Words that, directly before or inside a match, turn a demand into a warning ("do not share the OTP"). */
const NEGATION_BEFORE =
  /(?:\bdo not|\bdon['’]t|\bdont|\bnever|\bnot|\bno|\bwithout|\bfree of|\bnahi|\bnahin|\bmat|\bkabhi bhi)\s+(?:(?:share|send|tell|give|enter|type|disclose|reveal|your|the|this|that|any|an?|otp|otps|pin|pins|upi|password|passwords|cvv|card|details|code|codes|or|and|with|anyone|bank|atm|cvc|password|passwords|mpin|card|number)[\s,/]+){0,10}$/i;
const NEGATION_INSIDE = /\b(?:mat|never|do not|don['’]t|nahi|nahin)\b/i;

const VERB_SHARE = String.raw`(?:share|send|provide|forward|enter|tell|give|submit|type|read out|reply with|bhej(?:o|do|dein|dena)?|batao|bata do|de do|dijiye|share karo|share kare(?:n)?)`;
const AMOUNT = String.raw`(?:(?:₹|rs\.?|inr)\s?\d[\d,]*(?:\.\d+)?|\d[\d,]*\s?(?:rupees|rs\b|inr\b|\/-))`;
const NAMED_FEE = String.raw`(?:registration|training|verification|security|processing|onboarding|joining|kit|laptop|certificate|document|id card|refundable|caution|interview|application|slot booking)\s(?:fees?|charges?|deposit|amount)`;

export const MESSAGE_RULES: Rule[] = [
  {
    type: "otp_request",
    severity: "strong",
    title: "Asks for an OTP or verification code",
    explanation:
      "No recruiter or placement process ever needs your OTP. An OTP lets someone log in to your accounts, approve payments or take over your WhatsApp.",
    patterns: [
      new RegExp(String.raw`${VERB_SHARE}[^.\n]{0,40}\b(?:otp|o\.t\.p|one[- ]time (?:password|code)|verification code|security code|\d[- ]digit code)\b`, "i"),
      new RegExp(String.raw`\b(?:otp|verification code)\b[^.\n]{0,30}\b(?:bhej(?:o|do|dein|dena)?|share|send|batao|bata do|forward|de do|dijiye|reply)\b`, "i"),
    ],
    negatable: true,
  },
  {
    type: "credential_request",
    severity: "strong",
    title: "Asks for a password or login details",
    explanation: "No genuine hiring process asks for your password. Sharing it gives a stranger full access to your account.",
    patterns: [
      new RegExp(String.raw`${VERB_SHARE}[^.\n]{0,35}\b(?:password|passcode|login (?:details|credentials|id and password)|credentials|net ?banking (?:password|login|id))\b`, "i"),
      /\b(?:verify|confirm|update)\b[^.\n]{0,25}\b(?:email|account|portal)\b[^.\n]{0,20}\bpassword\b/i,
    ],
    negatable: true,
  },
  {
    type: "bank_or_upi_request",
    severity: "strong",
    title: "Asks for a UPI PIN, card or bank secret",
    explanation:
      "Salaries and stipends are paid to you without your PIN, CVV or banking password. Entering a UPI PIN always sends money out of your account — never in.",
    patterns: [
      /\b(?:upi pin|upi mpin|m-?pin|atm pin|card pin|cvv|cvc|(?<!(?:pan|aadhaa?r|id|admit|college) )card number|debit card details|credit card details|card expiry|bank password|internet banking password)\b/i,
      /\b(?:enter|approve|accept)\b[^.\n]{0,30}\b(?:collect request|payment request)\b[^.\n]{0,30}\b(?:receive|get|credit)\b/i,
      // "Scan this QR code to receive your bonus" — scanning a UPI QR always SENDS money.
      /\bscan\b[^.\n]{0,20}\bqr(?: code)?\b[^.\n]{0,50}\b(?:receive|get|claim|credit(?:ed)?|refund)\b/i,
    ],
    negatable: true,
  },
  {
    type: "upfront_payment",
    severity: "strong",
    title: "Asks you to pay money",
    explanation:
      "Legitimate employers and internships do not charge students to apply, verify documents, book an interview or confirm an offer. 'Refundable' deposits are almost never refunded.",
    patterns: [
      new RegExp(String.raw`\b(?:pay(?:ment)?|deposit|fees?|charges?|jama|transfer)\b[^.\n]{0,40}${AMOUNT}`, "i"),
      new RegExp(String.raw`${AMOUNT}[^.\n]{0,40}\b(?:fees?|pay(?:ment)?|deposit|jama|charges?|transfer)\b`, "i"),
      new RegExp(String.raw`\b${NAMED_FEE}\b`, "i"),
      new RegExp(String.raw`\b(?:need|send me|lend me|transfer me|give me|pay me|bhej do|chahiye)\b[^.\n]{0,15}${AMOUNT}|${AMOUNT}[^.\n]{0,10}\b(?:chahiye|bhej do)\b`, "i"),
      /\bpay\b[^.\n]{0,30}\bto (?:confirm|book|secure|reserve|block|activate)\b[^.\n]{0,20}\b(?:seat|slot|offer|selection|internship|joining)\b/i,
    ],
    negatable: true,
    exclude: /\b(?:stipend|salary|ctc|lpa|per month|per annum|credited|reimburs\w*|we will pay|you will (?:be paid|receive)|semester|tuition|hostel|mess|library|we (?:can|will|shall) (?:transfer|send|credit|pay)|(?:transfer|credit|send) (?:you|your))\b/i,
  },
  {
    type: "unsafe_download",
    severity: "strong",
    title: "Asks you to install an app or open a file",
    explanation:
      "Apps sent through messages can read your SMS (including OTPs), see your screen and steal data. Only install apps from official stores, and only if your placement cell confirms it.",
    patterns: [
      /\b[\w-]+\.(?:apk|exe|scr|bat|msi|cmd|jar)\b/i,
      /\b(?:install|download)\b[^.\n]{0,15}\b(?:this|the|our|attached|given)\b[^.\n]{0,15}\b(?:app|application|apk|software|file)\b/i,
    ],
  },
  {
    type: "remote_access",
    severity: "strong",
    title: "Asks for remote access to your device",
    explanation:
      "Screen-sharing and remote-control apps let a stranger see your OTPs and banking apps and control your phone or laptop. Recruiters never need this.",
    patterns: [/\b(?:anydesk|any desk|teamviewer|team viewer|quicksupport|quick support|rustdesk|airdroid|remote access app)\b/i],
  },
  {
    type: "urgency",
    severity: "supporting",
    title: "Pressure to act quickly",
    explanation:
      "Short deadlines and threats ('your offer will be cancelled') are used to stop you from checking with anyone. Real offers give you time to verify.",
    patterns: [
      /\bwithin (?:the next )?(?:\d+\s?(?:minutes?|mins?)|(?:[1-9]|1[0-2])\s?(?:hours?|hrs?))\b/i,
      /\b(?:reply|respond|pay|confirm|act|complete|submit|share|send|click)\b[^.\n]{0,15}\b(?:immediately|right now|asap|urgently|turant|abhi ke abhi)\b/i,
      /\bexpires? (?:today|tonight|in \d+)|\blast chance\b|\baaj hi\b|\bturant\b|\bfinal (?:notice|warning)\b/i,
      /\b(?:offer|selection|seat|candidature|internship|application)\b[^.\n]{0,25}\b(?:will|shall) be (?:cancell?ed|revoked|withdrawn|rejected|forfeited)\b/i,
      /\blose (?:the|your) (?:offer|seat|selection|slot|internship)\b|\b(?:cancel|radd) ho (?:jayega|jayegi|jaayega|jaayegi)\b/i,
      /\burgent(?:ly)?\s+(?:need|require)\b|\b(?:transfer|pay|send)\b[^.\n]{0,12}\bnow\b|\b(?:limited|only \d+) seats?\b|\bseats? (?:are )?limited\b|\bhurry\b/i,
    ],
  },
  {
    type: "account_threat",
    severity: "supporting",
    title: "Threatens to block, close or punish",
    explanation:
      "Threats that your account will be blocked, your offer cancelled for good or that legal action will follow are designed to scare you into acting before you check.",
    patterns: [
      /\b(?:account|card|sim|number|profile|upi|kyc|wallet)\b[^.\n]{0,25}\b(?:will be|has been|is being|is going to be|gets?)\s+(?:blocked|suspended|closed|deactivated|frozen|terminated|disabled|locked)\b/i,
      /\bto avoid (?:suspension|blocking|deactivation|closure|penalty|legal action)\b/i,
      /\blegal action\b|\bblack-?listed\b|\bpolice complaint\b|\barrest warrant\b/i,
    ],
    negatable: true,
  },
  {
    type: "identity_change",
    severity: "supporting",
    title: "Claims to be someone you know, from a new number",
    explanation:
      "“I lost my phone, this is my new number” is how impersonators start. You can't tell from the message who is really writing.",
    patterns: [/\b(?:new number|my new (?:number|phone|whatsapp)|lost my phone|changed my number|phone (?:is )?(?:broken|lost|stolen)|naya number)\b/i],
  },
  {
    type: "secrecy",
    severity: "supporting",
    title: "Secrecy or discourages verification",
    explanation:
      "Being told not to tell your placement cell, parents or friends — or not to call to check — is a red flag. Scammers stop you from verifying independently.",
    patterns: [
      /\b(?:do not|don['’]t|dont|never)\s+(?:tell|inform|share this with|discuss (?:this )?with|contact|involve)\b[^.\n]{0,30}\b(?:placement|college|tpo|anyone|parents|faculty|friends|others)\b/i,
      /\b(?:placement cell ko|placement wale ko|college ko|tpo ko|ghar pe|ghar par)\b[^.\n]{0,15}\bmat\b[^.\n]{0,10}\b(?:batana|batao|bolna)\b/i,
      /\bkeep (?:this|it) (?:confidential|secret|private) from\b/i,
      // Discouraging independent verification: "don't call", "can't take calls", "don't contact the bank".
      /\b(?:don['’]t|do not|dont|please don['’]t)\s+(?:call|phone|ring|video call)(?:\s+me)?\b|\b(?:can['’]t|cannot|unable to)\s+(?:talk|take (?:a |your )?calls?|answer calls?)\b|\bmicrophone (?:is not|isn['’]t|not) working\b/i,
    ],
  },
  {
    type: "unverified_sender",
    severity: "supporting",
    title: "Uses a personal email address",
    explanation:
      "Official hiring normally comes from the company's own domain or your placement cell. A free personal email is not proof of fraud, but it means the sender is unverified.",
    patterns: [/\b[\w.+-]+@(?:gmail|yahoo|ymail|outlook|hotmail|rediffmail|proton|protonmail|aol|zoho)\.(?:com|in|me|co\.in)\b/i],
  },
  {
    type: "off_platform_contact",
    severity: "supporting",
    title: "Moves you to Telegram or a personal chat",
    explanation:
      "Scammers move conversations to Telegram or personal numbers where there is no company record. Keep official hiring on official channels.",
    patterns: [
      /\b(?:join|contact|message|ping|text|dm|add|connect)\b[^.\n]{0,30}\btelegram\b|\btelegram\b[^.\n]{0,25}\b(?:group|channel|id|handle|@\w+)/i,
      /\b(?:contact|message|whatsapp|call)\b[^.\n]{0,20}\b(?:hr|manager|recruiter)\b[^.\n]{0,15}\bpersonal(?:ly)?\b/i,
    ],
  },
  {
    type: "guaranteed_selection",
    severity: "supporting",
    title: "Promises a job without any assessment",
    explanation:
      "Genuine employers select people through applications, tests or interviews — none can guarantee a job in advance. “Guaranteed placement” and “no interview required” are how placement scams collect registrations, and a fee or bank-detail request usually follows.",
    patterns: [
      /\b(?:no|without(?: any)?) (?:interview|test|selection process)\b[^.\n]{0,40}\b(?:selected|selection|job|offer|joining|required|needed)\b|\bdirect (?:selection|joining|offer)\b/i,
      /\bguaranteed (?:job|placement|selection|offer|internship)\b|\b100% (?:job|placement|selection)\b/i,
    ],
  },
  {
    type: "financial_details_request",
    severity: "supporting",
    title: "Asks for bank-account details by message",
    explanation:
      "Employers do need your account number and IFSC for salary — but only after you've accepted an offer, and through an official onboarding or payroll portal. An unprompted request to send them by message or email is how account details end up used for fraud or money mule schemes.",
    patterns: [
      new RegExp(String.raw`(?:${VERB_SHARE}|\b(?:whats ?app|e-?mail|text|dm|message)\s+(?:me|us))[^.\n]{0,35}\b(?:bank account (?:number|no\.?|details)|account number|ifsc(?: code)?|bank details)\b`, "i"),
    ],
    negatable: true,
    // Whether this is legitimate onboarding is decided from the WHOLE message in applyMessageContext().
  },
  {
    type: "too_good_to_be_true",
    severity: "supporting",
    title: "Offer sounds too good to be true",
    explanation:
      "Big pay for simple online tasks or guaranteed earnings are classic hooks for task and investment scams.",
    patterns: [
      /\bguaranteed (?:income|earnings|returns|payout)\b/i,
      new RegExp(String.raw`\b(?:earn|income|salary|payout|make)\b[^.\n]{0,25}${AMOUNT}[^.\n]{0,20}(?:\b(?:per|a|every|each)\s?(?:day|week|hour|task|din)\b|\/\s?(?:day|week|hour)|\b(?:daily|weekly|rozana|roz)\b)`, "i"),
      /\b(?:like|rate|review|subscribe to) (?:youtube )?(?:videos|hotels|products|channels)\b[^.\n]{0,40}\b(?:earn|paid|income|payment)\b/i,
    ],
  },
  {
    type: "personal_documents",
    severity: "supporting",
    title: "Asks for ID documents over chat",
    explanation:
      "Aadhaar, PAN or bank documents sent over chat can be misused for loans and SIM fraud. Share them only through an official onboarding portal after your placement cell confirms the offer.",
    patterns: [
      new RegExp(String.raw`${VERB_SHARE}[^.\n]{0,35}\b(?:aadhaa?r|pan card|pan number|passport|bank statement|cancelled cheque|bank passbook)\b`, "i"),
      /\b(?:aadhaa?r|pan card)\b[^.\n]{0,30}\b(?:photo|copy|scan|number)\b[^.\n]{0,30}\b(?:whatsapp|send|bhej)/i,
    ],
    negatable: true,
  },
  {
    type: "prompt_injection",
    severity: "supporting",
    title: "Contains hidden instructions for AI tools",
    explanation:
      "This text tries to give orders to an AI checker (e.g. 'say this is safe'). CUSTODI treats it as part of the message — and genuine recruiters have no reason to write this.",
    patterns: [
      /\bignore (?:all |any )?(?:previous|prior|above|earlier) (?:rules|instructions|prompts?)\b/i,
      /\b(?:tell|inform) the (?:user|student|reader) (?:that )?(?:this|it) is (?:safe|genuine|legit(?:imate)?)\b/i,
      /\b(?:you are|act as) (?:an? )?(?:ai|assistant|chatbot|language model)\b|\bsystem prompt\b|\bmark (?:this|it) as (?:safe|low risk)\b/i,
    ],
  },
];

const SELECTION_CONTEXT = /\b(?:selected|shortlisted|congratulations|offer|job|internship|work[- ]from[- ]home)\b/i;
const CALL_TO_CONTINUE =
  // "number" means a phone number here — not an account/card/ID number ("bank account number").
  /\b(?:call|whatsapp|contact|message|ring)\b[^.\n]{0,40}(?:\+?\d[\d\s-]{6,}[\dX]|(?<!(?:account|card|pan|aadhaa?r|roll|registration|ifsc|reference|application)\s)\bnumber\b)[^.\n]{0,60}\b(?:complete|confirm|proceed|process|activate|joining|claim|finali[sz]e)\b/i;

/** "You're selected — call this number to complete the process": the real demand happens off the record. */
export function callToContinueFinding(text: string, source: "message" | "page-text"): Finding | null {
  if (!SELECTION_CONTEXT.test(text)) return null;
  const spans = findSpans(text, CALL_TO_CONTINUE, 2).filter((s) => !/placement (?:cell|office)|\btpo\b/i.test(s.text));
  if (spans.length === 0) return null;
  return {
    id: makeId("f"),
    type: "call_to_continue",
    severity: "supporting",
    source,
    title: "Wants you to continue by phone",
    explanation:
      "An unexpected selection that can only be 'completed' over a phone call or chat is a common setup — the fee or OTP request happens on the call, where there is no written record.",
    evidence: spans,
  };
}

function isNegated(text: string, span: EvidenceSpan): boolean {
  const before = text.slice(Math.max(0, span.start - 60), span.start);
  // "If you don't share the OTP, your offer is cancelled" is a threat, not a warning.
  if (/\b(?:if|unless) (?:you|u)\s+(?:do not|don['’]t|dont|fail to)\b[^.\n]*$/i.test(before)) return false;
  return NEGATION_BEFORE.test(before) || NEGATION_INSIDE.test(span.text);
}

/** Matches web addresses written in a message (with or without http). Emails are excluded. */
const URL_IN_TEXT =
  /(?<![@\w.-])(?:(?:https?:\/\/|www\.)[^\s<>"'`)\]]+|(?:[a-z0-9-]+\.)+(?:com|in|net|org|xyz|top|online|site|info|click|ly|gy|io|co|me|live|app|link|shop|icu|buzz|cfd|sbs|test|example|cc|tk|ml|ga|gq|work|support)\b(?:\/[^\s<>"'`)\]]*)?)/gi;

export function extractUrls(text: string): EvidenceSpan[] {
  return findSpans(text, URL_IN_TEXT, 10);
}

/** Runs the message rules (optionally only some indicator types) and returns findings with exact evidence. */
export function ruleFindings(text: string, source: "message" | "page-text", types?: IndicatorType[]): Finding[] {
  const findings: Finding[] = [];
  for (const rule of MESSAGE_RULES) {
    if (types && !types.includes(rule.type)) continue;
    const spans: EvidenceSpan[] = [];
    for (const pattern of rule.patterns) {
      for (const span of findSpans(text, pattern, 3)) {
        if (rule.negatable && isNegated(text, span)) continue;
        // Exclusions look at the phrase and the words just before it ("semester tuition fee of ₹45,000").
        if (rule.exclude && rule.exclude.test(text.slice(Math.max(0, span.start - 40), span.end + (rule.excludeAhead ?? 0)))) continue;
        if (!spans.some((s) => s.start < span.end && span.start < s.end)) spans.push(span);
      }
    }
    if (spans.length > 0) {
      findings.push({
        id: makeId("f"),
        type: rule.type,
        severity: rule.severity,
        source,
        title: rule.title,
        explanation: rule.explanation,
        evidence: spans.sort((a, b) => a.start - b.start).slice(0, 4),
      });
    }
  }
  return findings;
}

const IMPERSONATION: IndicatorType[] = ["lookalike_domain", "punycode_host", "brand_in_unrelated_domain", "imitates_trusted_domain"];

export interface InspectedLink {
  span: EvidenceSpan;
  /** Structural findings for this one address (from the URL analyzer). */
  urlFindings: Finding[];
  findingId?: string;
}

/** Extracts every web address in the text and inspects its structure. Nothing is ever opened. */
export function linkAnalysis(text: string, opts: AnalyzeOptions, source: "message" | "page-text"): { findings: Finding[]; links: InspectedLink[] } {
  const out: Finding[] = [];
  const links: InspectedLink[] = [];
  for (const span of extractUrls(text)) {
    // Skip things like "file.apk" that the download rule already covers.
    if (/\.(?:apk|exe|scr|bat|msi|jar)$/i.test(span.text)) continue;
    const { findings } = urlFindings(span.text, opts);
    const warnings = findings.filter((f) => f.severity !== "info");
    const link: InspectedLink = { span, urlFindings: findings };
    links.push(link);
    // Impersonation signs (look-alike names, brands in unrelated domains) are scored as impersonation;
    // the remaining structural tricks are scored once as a suspicious link — no double counting.
    const imperson = warnings.filter((f) => IMPERSONATION.includes(f.type));
    for (const f of imperson) out.push({ ...f, id: makeId("f"), source, evidence: [span] });
    const structural = warnings.filter((f) => !IMPERSONATION.includes(f.type));
    if (structural.length === 0) continue;
    const strong = structural.some((f) => f.severity === "strong");
    const f: Finding = {
      id: makeId("f"),
      type: "suspicious_link",
      severity: strong ? "strong" : "supporting",
      source,
      title: strong ? "Dangerous-looking link" : "Suspicious link",
      explanation: `${structural.map((w) => w.title).join(". ")}. CUSTODI never opens links — find the organisation's site yourself instead.`,
      evidence: [span],
    };
    link.findingId = f.id;
    out.push(f);
  }
  return { findings: out, links };
}

/* ---------------- whole-message context (applied after the rules) ---------------- */

/** Bank details directed to an official system rather than sent back by message. */
export const OFFICIAL_CHANNEL =
  /\b(?:official|employee|secure|company|payroll|hr|onboarding|staff)\b[\w\s-]{0,40}?\b(?:portal|system|section|platform|app)\b/i;
/** The message asks for details to be sent back through the message channel itself. */
export const BY_MESSAGE =
  /\b(?:reply(?: back)? with|reply to this|send (?:it|them|us|me|the details|your details)|whats ?app (?:me|us|it|them|your)|on whats ?app|by (?:e-?mail|whatsapp|sms|message)|e-?mail (?:us|me|it|them)|text (?:us|me)|dm (?:us|me)|(?:on|to) this number)\b/i;
/** The recipient has already accepted an offer (normal onboarding stage). */
export const ACCEPTED_OFFER =
  /\b(?:accept(?:ed|ance|ing)?|signed)\b[^.\n]{0,40}\boffer\b|\boffer\b[^.\n]{0,20}\baccept(?:ed|ance)\b|\bafter (?:you )?(?:accept|join)/i;
/** Security-awareness framing — the message is warning about scams, often quoting one. */
const AWARENESS =
  /\b(?:scammers?|fraudsters?|beware|be careful|be alert|fake (?:messages?|offers?|calls?|recruiters?)|such (?:messages?|calls?|offers?)|phishing|report (?:it|them|such)|do not respond|don['’]t respond)\b/i;
/** A real OTP being delivered: the code itself plus a do-not-share warning. */
const OTP_DELIVERY = /\b\d{4,8}\b[^.\n]{0,25}\b(?:is your|otp|code)\b|\b(?:otp|code)\b[^.\n]{0,15}\b\d{4,8}\b/i;
const DONT_SHARE = /\b(?:do not|don['’]t|never)\s+(?:share|disclose|tell)\b/i;

function insideQuotes(text: string, start: number, end: number): boolean {
  const before = text.slice(Math.max(0, start - 160), start);
  const after = text.slice(end, end + 160);
  const open = Math.max(before.lastIndexOf("“"), before.lastIndexOf('"'), before.lastIndexOf("‘"));
  if (open < 0) return false;
  const closedBetween = /[”"’]/.test(before.slice(open + 1));
  return !closedBetween && /[”"’]/.test(after);
}

const note = (f: Finding, why: string): Finding => ({ ...f, severity: "info", detail: why });

/**
 * Adjusts rule findings using context that only the whole message can provide. Every adjustment downgrades a
 * finding to an "info" note with the reason — nothing is silently deleted, and nothing is ever raised here.
 */
export function applyMessageContext(text: string, findings: Finding[]): Finding[] {
  const awareness = AWARENESS.test(text);
  const otpDelivery = OTP_DELIVERY.test(text) && DONT_SHARE.test(text);
  return findings.map((f) => {
    if (f.severity === "info") return f;
    // 1. Scam wording quoted inside a security warning ("Students received “share the OTP…”. Do not respond.")
    if (awareness && f.evidence.length && f.evidence.every((e) => insideQuotes(text, e.start, e.end)))
      return note(f, "Quoted as an example inside a security warning — not a request to you");
    // 2. A genuine OTP SMS ("Enter OTP 482913 on the portal… never share it") is a delivery, not a request to share.
    if (f.type === "otp_request" && otpDelivery && f.evidence.every((e) => /^\s*(?:enter|type)\b/i.test(e.text)))
      return note(f, "Looks like an OTP delivered to you for your own login, with a do-not-share warning");
    // 3. Bank details directed to an official portal/payroll system and not requested back by message.
    if (f.type === "financial_details_request" && OFFICIAL_CHANNEL.test(text) && !BY_MESSAGE.test(text))
      return note(f, "Directed to an official portal or payroll system, not sent by message — normal post-offer onboarding");
    return f;
  });
}

/** Reply route is an informal messaging channel (WhatsApp, SMS, Telegram, DM) rather than an official system. */
export const INFORMAL_CHANNEL =
  /\b(?:reply|respond|send|share|text|message|dm)\b[^.\n]{0,30}\b(?:whats ?app|sms|text message|telegram|dm)\b|\bwhats ?app (?:me|us|it|them)\b|\bon (?:whats ?app|telegram)\b/gi;

/**
 * A bank-detail request whose reply route is an informal messaging channel. Added only when the request itself
 * is a warning (official-portal onboarding is already a note) — so it describes the channel, never invents a request.
 */
export function informalChannelFinding(text: string, findings: Finding[]): Finding | null {
  if (!findings.some((f) => f.type === "financial_details_request" && f.severity !== "info")) return null;
  const spans = findSpans(text, INFORMAL_CHANNEL, 2);
  if (!spans.length) return null;
  return {
    id: makeId("f"),
    type: "informal_channel_financial",
    severity: "supporting",
    source: "message",
    title: "Requests sensitive financial information through an informal messaging channel",
    explanation:
      "Bank details are being collected over WhatsApp, SMS or a direct message instead of an official HR or payroll system. Genuine employers don't collect account numbers this way — and anything sent there can be forwarded or misused with no record.",
    evidence: spans,
  };
}

/** Shared by message and page analysis. */
export function textFindings(text: string, opts: AnalyzeOptions = {}, source: "message" | "page-text" = "message"): Finding[] {
  const call = callToContinueFinding(text, source);
  return [...applyMessageContext(text, ruleFindings(text, source)), ...linkAnalysis(text, opts, source).findings, ...(call ? [call] : [])];
}

export const PERSONAL_SENDER = /@(?:gmail|yahoo|ymail|outlook|hotmail|rediffmail|proton|protonmail|aol|zoho)\.(?:com|in|me|co\.in)$/i;

export const NEXT_STEP: Partial<Record<IndicatorType, string>> = {
  otp_request: "Do not share any OTP or code. If you already did, change your passwords and call your bank's official number now.",
  credential_request: "Do not share your password. If you already did, change it immediately and turn on two-step verification.",
  bank_or_upi_request: "Never enter or share a UPI PIN, CVV or card details. A PIN is only needed to send money, never to receive it.",
  upfront_payment: "Do not pay anything. Genuine offers never need a fee from you.",
  unsafe_download: "Do not install the app or open the file. Delete the message.",
  remote_access: "Do not install any screen-sharing or remote-access app for a recruiter.",
  suspicious_link: "Do not open the link. Find the company's official careers page yourself.",
  secrecy: "Tell your placement cell about this message — being asked to keep it secret is a reason to share it.",
  personal_documents: "Don't send ID documents over chat. Wait until the offer is confirmed through official channels.",
  off_platform_contact: "Keep hiring conversations on official email or your college portal, not Telegram or personal chats.",
  call_to_continue: "Don't call the number in the message. Contact the company through your placement cell instead.",
  account_threat: "Don't use links or numbers in the message. Contact the organisation through its official app, website or helpline.",
  guaranteed_selection: "Treat any guaranteed job as unverified. Don't register, pay or share documents — ask your placement cell.",
  informal_channel_financial: "Don't reply with bank details on WhatsApp or SMS. Contact the employer through your placement cell or their official HR system.",
  financial_details_request: "Don't send bank details by message. Share them only through an official onboarding or payroll portal after you've accepted a verified offer.",
  identity_change: "Contact this person on the number you already have saved before you send anything.",
  context_reported_payment: "Don't pay until you've verified the request through a channel you already trust.",
  context_reported_sensitive: "Never share an OTP, PIN, password or ID details because a message asked you to.",
  unverified_sender: "Check the sender's address against the company's official website before replying.",
};

export const HEADLINE: Record<RiskLevel, string> = {
  high: "High risk",
  medium: "Medium risk — verify first",
  low: "Low risk — no major red flags",
};

export const SUMMARY: Record<RiskLevel, string> = {
  high: "This message has strong warning signs commonly seen in placement and internship scams. Do not share secrets, pay money or install anything.",
  medium: "This message has warning signs. It may still be genuine, but you need to verify the sender and the opportunity before you act.",
  low: "No obvious warning indicators detected. This does not guarantee the message is safe.",
};

export function nextStepsFor(level: RiskLevel, findings: Finding[]): string[] {
  const steps: string[] = [];
  for (const f of findings) {
    const s = NEXT_STEP[f.type];
    if (s && !steps.includes(s)) steps.push(s);
  }
  if (level === "high") steps.push("Report it to your placement cell so other students can be warned.");
  if (level === "medium") steps.push("Do not reply with any personal details until your placement cell confirms the opportunity.");
  if (level === "low") steps.push("Still never share OTPs, PINs or passwords, and confirm important offers with your placement cell.");
  return steps.slice(0, 3);
}

/** Soft warning so students can remove a real OTP / card number before pasting (never blocks). */
export function detectSensitiveData(text: string): string[] {
  const warnings: string[] = [];
  if (/\b\d{4,8}\b[^.\n]{0,30}\b(?:is your|otp|code)\b|\b(?:otp|code)\b[^.\n]{0,15}\b\d{4,8}\b/i.test(text))
    warnings.push("This text seems to contain a real OTP or code. You can replace it with XXXX — CUSTODI doesn't need it.");
  if (/\b(?:\d[ -]?){13,19}\b/.test(text))
    warnings.push("This text seems to contain a card or account number. Consider replacing it with XXXX before scanning.");
  return warnings;
}
