/**
 * URL analysis. Works on the URL *string only* — CUSTODI never fetches or opens the address.
 */
import type { AnalyzeOptions, CheckResult, EvidenceSpan, Finding, IndicatorType, Severity, SiteStatus, UrlReport } from "./types";
import { byTypes, checkFrom, now, REPUTATION_CHECK } from "./checks";
import { ENGINE_VERSION, UNCERTAINTY_NOTE, VERIFY_ADVICE, aggregateRisk, riskScore, VERDICT, makeId, sortFindings } from "./util";

const SHORTENERS = new Set([
  "bit.ly", "tinyurl.com", "t.co", "goo.gl", "rb.gy", "cutt.ly", "is.gd", "ow.ly", "buff.ly", "shorturl.at",
  "tiny.cc", "rebrand.ly", "t.ly", "s.id", "v.gd", "shorte.st", "bit.do", "lnkd.in", "wa.link",
]);

/** TLDs that are cheap to register and frequently abused. Not proof — a supporting sign only. */
const RISKY_TLDS = new Set([
  "xyz", "top", "click", "online", "site", "info", "live", "buzz", "rest", "icu", "cfd", "sbs", "shop",
  "work", "loan", "win", "bid", "monster", "quest", "cyou", "zip", "mov", "support", "link",
]);

const MULTI_PART_SUFFIXES = new Set([
  "co.in", "ac.in", "edu.in", "gov.in", "org.in", "net.in", "res.in", "nic.in", "firm.in", "gen.in", "ind.in",
  "co.uk", "ac.uk", "org.uk", "gov.uk", "com.au", "edu.au", "co.jp", "com.sg", "com.br",
]);

/**
 * Names commonly impersonated in Indian placement scams. Used ONLY to flag that a hostname
 * *mentions* a well-known name. CUSTODI never claims to know any organisation's official domain.
 */
const WATCHED_NAMES = [
  "google", "microsoft", "amazon", "infosys", "wipro", "accenture", "deloitte", "cognizant", "capgemini",
  "linkedin", "naukri", "internshala", "indeed", "paytm", "phonepe", "flipkart", "hdfc", "icici", "axis",
  "sbi", "tcs", "hcl", "techmahindra", "ibm", "oracle", "unstop", "bank", "npci", "uidai", "irctc", "incometax", "epfo",
];

const SENSITIVE_URL_WORDS =
  /(?:login|log-in|signin|sign-in|verify|verification|kyc|otp|password|wallet|payment|pay-?now|refund|bonus|reward|claim|offer-?letter|unlock|update-?account|secure-?account)/gi;

export interface ParsedUrl {
  url: URL;
  hostname: string;
  registrableDomain: string;
  labels: string[];
}

function addScheme(raw: string): string {
  if (/^[a-z][a-z0-9+.-]*:/i.test(raw) && !/^[^/]+\.[a-z]{2,}:\d+/i.test(raw)) return raw;
  return `https://${raw}`;
}

export function registrableDomain(hostname: string): string {
  const labels = hostname.split(".").filter(Boolean);
  if (labels.length <= 2) return labels.join(".");
  const lastTwo = labels.slice(-2).join(".");
  if (MULTI_PART_SUFFIXES.has(lastTwo)) return labels.slice(-3).join(".");
  return lastTwo;
}

export function parseUrl(raw: string): ParsedUrl | null {
  const trimmed = raw.trim();
  if (!trimmed || /\s/.test(trimmed)) return null;
  try {
    const url = new URL(addScheme(trimmed));
    const hostname = url.hostname.toLowerCase().replace(/\.$/, "");
    if (!hostname) return null;
    return { url, hostname, registrableDomain: registrableDomain(hostname), labels: hostname.split(".") };
  } catch {
    return null;
  }
}

export function normaliseTrustedDomains(list: string[] | undefined): string[] {
  if (!list) return [];
  return list
    .map((d) => d.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/^\*\./, "").replace(/^www\./, ""))
    .filter((d) => /^[a-z0-9.-]+\.[a-z0-9-]{2,}$/.test(d));
}

export function isTrustedHost(hostname: string, trusted: string[] | undefined): boolean {
  const host = hostname.toLowerCase().replace(/^www\./, "");
  return normaliseTrustedDomains(trusted).some((d) => host === d || host.endsWith(`.${d}`));
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  const dp = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = dp[0]!;
    dp[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = dp[j]!;
      dp[j] = Math.min(dp[j]! + 1, dp[j - 1]! + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return dp[b.length]!;
}

const LEET: Record<string, string> = { "0": "o", "1": "l", "3": "e", "4": "a", "5": "s", "7": "t", "@": "a" };
function deLeet(s: string): string {
  return s.replace(/[013457@]/g, (c) => LEET[c] ?? c).replace(/rn/g, "m").replace(/vv/g, "w");
}

function spanOf(input: string, needle: string): EvidenceSpan[] {
  if (!needle) return [];
  const idx = input.toLowerCase().indexOf(needle.toLowerCase());
  if (idx < 0) return [];
  return [{ text: input.slice(idx, idx + needle.length), start: idx, end: idx + needle.length }];
}

interface Draft {
  type: IndicatorType;
  severity: Severity;
  title: string;
  explanation: string;
  evidence: EvidenceSpan[];
  detail?: string;
}

/** Structural URL checks. Exported so message and page analysis can reuse them. */
export function urlFindings(input: string, opts: AnalyzeOptions = {}): { parsed: ParsedUrl | null; findings: Finding[] } {
  const raw = input.trim();
  const drafts: Draft[] = [];
  const scheme = /^\s*(javascript|data|vbscript|file):/i.exec(raw);
  if (scheme) {
    const proto = `${scheme[1]!.toLowerCase()}:`;
    return {
      parsed: null,
      findings: [
        {
          id: makeId("f"),
          type: "dangerous_scheme",
          severity: "strong",
          source: "url",
          title: "Not a normal web link",
          explanation: `This link uses "${proto}" which can run code or hide content instead of opening a website. Real recruiters never send links like this.`,
          evidence: spanOf(raw, scheme[1]!),
        },
      ],
    };
  }

  const parsed = parseUrl(raw);

  if (!parsed) {
    return {
      parsed: null,
      findings: [
        {
          id: makeId("f"),
          type: "invalid_url",
          severity: "info",
          source: "url",
          title: "Not a readable web address",
          explanation: "CUSTODI could not read this as a web address, so it cannot check it. Paste the full link as text.",
          evidence: [],
        },
      ],
    };
  }

  const { url, hostname, labels } = parsed;
  const reg = parsed.registrableDomain;
  const protocol = url.protocol;
  const trusted = isTrustedHost(hostname, opts.trustedDomains);

  // A trusted domain buried inside a different site's address, e.g. northwind.example.offer-desk.test
  if (!trusted) {
    const imitated = normaliseTrustedDomains(opts.trustedDomains).find((d) => hostname.includes(d));
    if (imitated) {
      drafts.push({
        type: "imitates_trusted_domain",
        severity: "supporting",
        title: `Contains your trusted domain "${imitated}" but is a different site`,
        explanation: `The real owner of this address is "${reg}", not "${imitated}". Putting a trusted name at the start of a longer address is a common disguise.`,
        evidence: spanOf(raw, imitated),
      });
    }
  }

  if (url.username || url.password || /^[^/]*@/.test(raw.replace(/^[a-z]+:\/\//i, ""))) {
    drafts.push({
      type: "credentials_in_url",
      severity: "strong",
      title: "Hidden destination trick (@ in the address)",
      explanation:
        "Everything before an @ in a web address is ignored by the browser. Scammers use this to make a link look like a trusted site while it goes somewhere else.",
      evidence: spanOf(raw, "@"),
    });
  }

  const isIPv4 = /^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname);
  const isIPv6 = hostname.startsWith("[");
  if (isIPv4 || isIPv6) {
    drafts.push({
      type: "ip_address_host",
      severity: "strong",
      title: "Uses a raw IP address instead of a name",
      explanation: "Real companies use named websites. A bare number address hides who runs the site.",
      evidence: spanOf(raw, hostname),
    });
  }

  if (labels.some((l) => l.startsWith("xn--"))) {
    drafts.push({
      type: "punycode_host",
      severity: "strong",
      title: "Look-alike characters in the address",
      explanation:
        "This address contains special encoded characters (it starts with \"xn--\"). They are often used to imitate a familiar name with letters from other alphabets.",
      evidence: spanOf(raw, labels.find((l) => l.startsWith("xn--")) ?? ""),
    });
  }

  if (!isIPv4 && !isIPv6) {
    const tld = labels[labels.length - 1] ?? "";
    if (SHORTENERS.has(hostname.replace(/^www\./, ""))) {
      drafts.push({
        type: "url_shortener",
        severity: "supporting",
        title: "Shortened link hides the destination",
        explanation: "Link shorteners hide where you will really end up. Don't open it — find the company's site yourself.",
        evidence: spanOf(raw, hostname),
      });
    } else if (RISKY_TLDS.has(tld)) {
      drafts.push({
        type: "risky_tld",
        severity: "supporting",
        title: `Unusual domain ending ".${tld}"`,
        explanation: `".${tld}" addresses are cheap and often used for short-lived scam sites. Many are harmless, but treat this one with care.`,
        evidence: spanOf(raw, `.${tld}`),
      });
    }

    // Look-alike / impersonation checks on the registrable name (e.g. "g00gle-careers" in g00gle-careers.top).
    const regLabel = reg.split(".")[0] ?? "";
    const tokens = hostname.split(/[.-]/).filter((t) => t.length >= 3);
    let lookalikeFlagged = false;
    for (const token of tokens) {
      if (WATCHED_NAMES.includes(token)) continue;
      const cleaned = deLeet(token);
      const match = WATCHED_NAMES.find(
        (n) => (cleaned === n && token !== n) || (n.length >= 5 && token.length >= 5 && levenshtein(cleaned, n) === 1),
      );
      if (match) {
        drafts.push({
          type: "lookalike_domain",
          severity: "strong",
          title: `Looks like "${match}" but is spelled differently`,
          explanation: `"${token}" imitates the name "${match}" with swapped or altered letters. This is a classic trick to make a fake site look familiar.`,
          evidence: spanOf(raw, token),
        });
        lookalikeFlagged = true;
        break;
      }
    }
    if (!lookalikeFlagged && !trusted) {
      const mentioned = WATCHED_NAMES.find((n) => tokens.includes(n) || (n.length >= 5 && hostname.includes(n)));
      if (mentioned && regLabel !== mentioned) {
        drafts.push({
          type: "brand_in_unrelated_domain",
          severity: "supporting",
          title: `Mentions "${mentioned}" inside a different domain`,
          explanation: `The address contains "${mentioned}", but the site actually belongs to "${reg}". Anyone can put a famous name in their address. CUSTODI cannot confirm this site is connected to ${mentioned}.`,
          evidence: spanOf(raw, mentioned),
        });
      }
    }

    const hyphens = (regLabel.match(/-/g) ?? []).length;
    if (labels.length >= 5 || hyphens >= 2 || hostname.length > 40) {
      drafts.push({
        type: "complex_hostname",
        severity: "supporting",
        title: "Unusually long or complicated address",
        explanation:
          "Long addresses with many dots or dashes are often built to bury a familiar name in the middle. Check the part just before the ending (the real owner).",
        evidence: spanOf(raw, hostname),
        detail: `Real owner (registrable domain): ${reg}`,
      });
    }
  }

  const sensitive = Array.from(new Set((`${hostname}${url.pathname}`.match(SENSITIVE_URL_WORDS) ?? []).map((w) => w.toLowerCase())));
  if (sensitive.length > 0 && !trusted) {
    // Normal login pages exist everywhere. These words only add risk when the address already looks wrong
    // (or the connection is unencrypted); otherwise they are shown as a note to avoid alert fatigue.
    const otherWarnings = drafts.some((d) => d.severity !== "info") || protocol === "http:";
    drafts.push({
      type: "sensitive_keywords_in_url",
      severity: otherWarnings ? "supporting" : "info",
      title: "Address is about logins, payments or verification",
      explanation: `The address contains words like "${sensitive.slice(0, 3).join('", "')}". Pages that ask you to log in, verify or pay should only be reached by typing the official address yourself.`,
      evidence: spanOf(raw, sensitive[0]!),
    });
  }

  // Query parameters that hide a redirect to another site or carry secrets.
  const params = Array.from(url.searchParams.entries());
  const redirect = params.find(([k, v]) => /^(?:redirect|redirect_uri|url|next|return|returnurl|goto|continue|dest|destination|target|r|u)$/i.test(k) && /^(?:https?:)?\/\//i.test(v));
  const secret = params.find(([k]) => /^(?:otp|pin|mpin|password|pwd|pass|cvv|card|token|session|aadhaa?r)$/i.test(k));
  if (redirect || secret) {
    drafts.push({
      type: "suspicious_parameters",
      severity: "supporting",
      title: redirect ? "Hidden redirect to another site in the link" : "Link carries sensitive data in its parameters",
      explanation: redirect
        ? "The address contains a second web address that you may be forwarded to. Scammers use this to bounce you from a trusted-looking site to a fake one."
        : "Passwords, OTPs, PINs or tokens should never travel inside a link — anyone who sees the link can read them.",
      evidence: spanOf(raw, `${(redirect ?? secret)![0]}=`),
      detail: redirect ? `Forwards to: ${redirect[1].slice(0, 80)}` : `Parameter: ${secret![0]}`,
    });
  }

  if (protocol === "http:") {
    drafts.push({
      type: "insecure_connection",
      severity: "supporting",
      title: "Connection is not encrypted (http)",
      explanation: "Anything you type on this page can be read in transit. Never enter passwords, OTPs or personal details here.",
      evidence: spanOf(raw, "http:"),
    });
  } else if (protocol === "https:") {
    drafts.push({
      type: "https_is_not_proof",
      severity: "info",
      title: "HTTPS is not proof of a genuine site",
      explanation: "The padlock only means the connection is encrypted. Scam sites get free HTTPS certificates too.",
      evidence: [],
    });
  }

  if (trusted) {
    drafts.push({
      type: "trusted_domain",
      severity: "info",
      title: "On your trusted list",
      explanation: `${reg} is on the trusted list you (or your placement cell) set up in CUSTODI. This is your own list, not an outside verification.`,
      evidence: [],
    });
  }

  return {
    parsed,
    findings: drafts.map((d) => ({ id: makeId("f"), source: "url" as const, ...d })),
  };
}

export function siteStatus(findings: Finding[], trusted: boolean): SiteStatus {
  const hasStrong = findings.some((f) => f.severity === "strong");
  const hasSupporting = findings.some((f) => f.severity === "supporting");
  if (trusted && !hasStrong) return "verified";
  if (hasStrong || hasSupporting) return "suspicious";
  return "unknown";
}

const URL_NEXT_STEPS: Partial<Record<IndicatorType, string>> = {
  ip_address_host: "Do not open this link or enter any details on it.",
  punycode_host: "Do not open this link. Type the organisation's address yourself instead.",
  lookalike_domain: "Do not open this link. It imitates a familiar name.",
  credentials_in_url: "Do not open this link — its real destination is hidden.",
  dangerous_scheme: "Do not open or paste this link anywhere.",
  url_shortener: "Don't open the short link. Find the company's careers page yourself.",
  insecure_connection: "Never type passwords, OTPs or card details on an http page.",
  sensitive_keywords_in_url: "Don't log in or pay through a link you were sent. Go to the official site yourself.",
};

/** Structured checks for a web address. Each corresponds to a group of rules in urlFindings(). */
export function urlChecks(parsed: ParsedUrl | null, findings: Finding[], opts: AnalyzeOptions, durationMs: number): CheckResult[] {
  const trustedList = normaliseTrustedDomains(opts.trustedDomains);
  const dangerous = byTypes(findings, ["dangerous_scheme"]);
  const skip = (id: string, name: string) => checkFrom(id, name, [], { status: "skipped", looksFor: "The address couldn't be read, so this check didn't apply." });
  const checks: CheckResult[] = [
    checkFrom("parse", "Address parsing", [...dangerous, ...byTypes(findings, ["invalid_url"])], {
      status: !parsed && !dangerous.length ? "warning" : undefined,
      looksFor: parsed ? "a readable web address" : "Couldn't read this as a web address — paste the full link as text.",
      facts: parsed ? [`Host: ${parsed.hostname}`, `Real owner (registrable domain): ${parsed.registrableDomain}`, `Path: ${parsed.url.pathname}`] : [],
      passedRec: "The address was read as text only. It was not opened.",
    }),
  ];
  if (!parsed) {
    for (const [id, name] of [["hidden", "Hidden destination tricks"], ["host", "Host type"], ["lookalike", "Look-alike & impersonation"], ["domain", "Domain patterns"], ["connection", "Connection (HTTPS)"], ["trusted", "Your trusted list"]] as const)
      checks.push(skip(id, name));
  } else {
    checks.push(
      checkFrom("hidden", "Hidden destination tricks", byTypes(findings, ["credentials_in_url"]), { looksFor: "an @ in the address, which makes the browser ignore everything before it" }),
      checkFrom("host", "Host type", byTypes(findings, ["ip_address_host", "punycode_host"]), { looksFor: "raw IP addresses and encoded (xn--) look-alike characters instead of a normal name" }),
      checkFrom("lookalike", "Look-alike & impersonation", byTypes(findings, ["lookalike_domain", "brand_in_unrelated_domain", "imitates_trusted_domain"]), {
        looksFor: "spellings that imitate well-known names (g00gle, wipr0), famous names inside unrelated domains and your trusted domains used as disguises",
      }),
      checkFrom("domain", "Domain patterns", byTypes(findings, ["url_shortener", "risky_tld", "complex_hostname", "sensitive_keywords_in_url", "suspicious_parameters"]), {
        looksFor: "link shorteners, cheap high-abuse endings (.xyz, .top…), long hyphenated hosts, hidden redirects or secrets in parameters, and login/payment words used alongside other tricks",
      }),
    );
    const http = parsed.url.protocol === "http:";
    const https = parsed.url.protocol === "https:";
    checks.push({
      ...checkFrom("connection", "Connection (HTTPS)", byTypes(findings, ["insecure_connection"]), {
        status: http ? "warning" : https ? "passed" : "skipped",
        looksFor: https ? "whether the connection is encrypted" : "Not an http(s) address.",
      }),
      evidence: [https ? "Encrypted (HTTPS)" : http ? "Not encrypted (HTTP)" : parsed.url.protocol],
      explanation: https
        ? "The connection is encrypted. That only protects data in transit — scam sites get HTTPS for free, so this says nothing about who runs the site."
        : http
          ? "Anything typed on this page can be read in transit."
          : "This isn't an ordinary web connection.",
    });
    const trusted = isTrustedHost(parsed.hostname, opts.trustedDomains);
    checks.push({
      id: "trusted",
      name: "Your trusted list",
      status: trusted ? "passed" : "unavailable",
      severity: "none",
      evidence: [trustedList.length ? `${trustedList.length} trusted domain${trustedList.length > 1 ? "s" : ""} configured` : "No trusted domains configured", trusted ? `${parsed.registrableDomain} is on your list` : `${parsed.registrableDomain} is not on your list`],
      findingIds: [],
      explanation: trusted
        ? "This domain is on the list you (or your placement cell) set up — your list, not an outside verification."
        : "Ownership can't be verified: the domain isn't on your trusted list and CUSTODI never guesses official domains.",
      recommendation: trusted ? "Still never share OTPs, PINs or passwords." : "Add domains you've confirmed (e.g. from your placement cell) in Settings → Trusted domains.",
      durationMs: 0,
    });
  }
  checks.push(REPUTATION_CHECK());
  const strong = findings.filter((f) => f.severity === "strong").length;
  const types = new Set(findings.filter((f) => f.severity === "supporting").map((f) => f.type)).size;
  checks.push({
    id: "risk",
    name: "Risk calculation",
    status: "passed",
    severity: "none",
    evidence: [`${strong} strong sign${strong === 1 ? "" : "s"} × 45 + ${types} warning type${types === 1 ? "" : "s"} × 15 = ${riskScore(findings)}/100`],
    findingIds: [],
    explanation: "A transparent count of what the checks found — not a probability.",
    recommendation: "See the assessment.",
    durationMs,
  });
  return checks;
}

export function analyzeUrl(input: string, opts: AnalyzeOptions = {}): UrlReport {
  const t0 = now();
  const { parsed, findings } = urlFindings(input, opts);
  const elapsed = now() - t0;
  const trusted = parsed ? isTrustedHost(parsed.hostname, opts.trustedDomains) : false;
  const sorted = sortFindings(findings);
  const status: SiteStatus = parsed ? siteStatus(sorted, trusted) : sorted.some((f) => f.severity === "strong") ? "suspicious" : "unknown";
  // Being on the trusted list never lowers a warning found in the address itself.
  const riskLevel = aggregateRisk(sorted);

  const steps = new Set<string>();
  for (const f of sorted) {
    const s = URL_NEXT_STEPS[f.type];
    if (s) steps.add(s);
  }
  if (status === "verified") steps.add("This domain is on your trusted list. Still never share OTPs, PINs or passwords with anyone who contacts you.");
  if (status === "unknown" && parsed) steps.add("No obvious warning signs in the address, but CUSTODI cannot confirm who owns this site. Reach it by typing the official address yourself.");
  if (!parsed && status === "unknown") steps.add("Copy the full link (starting with http) as text and try again. Do not open it to check.");

  const headline =
    status === "verified"
      ? "On your trusted list"
      : status === "suspicious"
        ? riskLevel === "high"
          ? "High risk address"
          : "Suspicious address"
        : "Unknown — not verified";

  const summary =
    status === "verified"
      ? `The domain ${parsed?.registrableDomain} matches your trusted list and no strong warning signs were found in the address.`
      : status === "suspicious"
        ? `CUSTODI found ${sorted.filter((f) => f.severity !== "info").length} warning sign(s) in this address.`
        : parsed
          ? "CUSTODI found no warning signs in the address itself. That does not make it genuine — it means there is not enough evidence either way."
          : "This could not be read as a web address.";

  return {
    kind: "url",
    id: makeId("url"),
    score: riskScore(sorted),
    verdict: VERDICT[riskLevel],
    checks: urlChecks(parsed, sorted, opts, elapsed),
    analyzedAt: (opts.now ?? new Date()).toISOString(),
    engineVersion: ENGINE_VERSION,
    input: input.trim(),
    normalizedUrl: parsed?.url.href,
    hostname: parsed?.hostname,
    registrableDomain: parsed?.registrableDomain,
    protocol: parsed?.url.protocol,
    status,
    riskLevel,
    headline,
    summary,
    findings: sorted,
    nextSteps: Array.from(steps).slice(0, 3),
    verifyAdvice: VERIFY_ADVICE,
    uncertaintyNote: UNCERTAINTY_NOTE,
  };
}
