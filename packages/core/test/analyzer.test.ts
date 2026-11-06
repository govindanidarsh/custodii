import { describe, expect, it } from "vitest";
import {
  TEST_CASES,
  analyzeMessage,
  analyzePage,
  analyzeUrl,
  createMessagePipeline,
  buildSegments,
  checkRows,
  detectSensitiveData,
  EMPTY_FIELDS,
  formatIncidentReport,
  runTestSuite,
} from "../src";

describe("Test Lab cases", () => {
  it("has at least 15 controlled cases", () => {
    expect(TEST_CASES.length).toBeGreaterThanOrEqual(44);
    expect(new Set(TEST_CASES.map((c) => c.id)).size).toBe(TEST_CASES.length);
    expect(TEST_CASES.filter((c) => c.category === "legitimate").length).toBeGreaterThanOrEqual(10);
  });

  for (const c of TEST_CASES) {
    const label = `${c.id} ${c.title}`;
    if (c.knownLimitation) {
      it.fails(`${label} (documented limitation)`, () => {
        const { results } = runTestSuite([c]);
        expect(results[0]!.passed).toBe(true);
      });
    } else {
      it(label, () => {
        const { results } = runTestSuite([c]);
        const r = results[0]!;
        expect({ risk: r.actualRisk, status: r.actualStatus }).toEqual({ risk: r.expectedRisk, status: r.expectedStatus });
      });
    }
  }

  it("computes false-positive and false-negative counts from real results", () => {
    const { metrics } = runTestSuite();
    expect(metrics.total).toBe(TEST_CASES.length);
    expect(metrics.truePositives + metrics.trueNegatives + metrics.falsePositives + metrics.falseNegatives).toBe(metrics.total);
    expect(metrics.precision).toBeCloseTo(metrics.truePositives / (metrics.truePositives + metrics.falsePositives));
    expect(metrics.detectionAccuracy).toBeCloseTo((metrics.truePositives + metrics.trueNegatives) / metrics.total);
  });
});

describe("message analysis", () => {
  it("quotes evidence that is an exact substring of the message", () => {
    const text = "Please share the OTP you receive to confirm your selection.";
    const r = analyzeMessage({ text });
    const otp = r.findings.find((f) => f.type === "otp_request");
    expect(otp).toBeDefined();
    for (const e of otp!.evidence) expect(text.slice(e.start, e.end)).toBe(e.text);
  });

  it("never calls a message safe", () => {
    const r = analyzeMessage({ text: "See you at the interview tomorrow at 10." });
    expect(r.riskLevel).toBe("low");
    expect(`${r.headline} ${r.summary} ${r.verdict.description}`.toLowerCase()).not.toMatch(/(?<!guarantee the message )\bis safe\b|100% safe|definitely safe|confirmed genuine/);
    expect(r.verdict.description).toMatch(/does not guarantee the message is safe/);
  });

  it("always recommends verifying through the placement cell", () => {
    const r = analyzeMessage({ text: "Pay ₹999 registration fee now" });
    expect(r.verifyAdvice).toMatch(/placement cell/);
  });

  it("detects Hinglish OTP requests but not Hinglish warnings", () => {
    expect(analyzeMessage({ text: "Selection confirm karne ke liye OTP bhej do" }).riskLevel).toBe("high");
    expect(analyzeMessage({ text: "OTP kisi ko mat batao, yeh aapki safety ke liye hai" }).riskLevel).toBe("low");
  });

  it("treats conditional threats as requests, not warnings", () => {
    expect(analyzeMessage({ text: "If you do not share your OTP today, your offer will be cancelled." }).riskLevel).toBe("high");
  });

  it("flags personal-email senders as supporting evidence only", () => {
    const r = analyzeMessage({ text: "Interview with our HR team on Monday at 11 AM.", sender: "recruiter.demo@gmail.com" });
    expect(r.riskLevel).toBe("medium");
    expect(r.findings[0]!.evidence).toEqual([]);
  });

  it("does not treat stipend amounts as fees", () => {
    expect(analyzeMessage({ text: "Your stipend of ₹15,000 per month will be credited on the 5th." }).riskLevel).toBe("low");
  });

  it("warns softly when a real OTP seems to be pasted", () => {
    expect(detectSensitiveData("482913 is your OTP for login")).toHaveLength(1);
    expect(detectSensitiveData("Interview at 10 AM")).toHaveLength(0);
  });
});

describe("URL analysis", () => {
  it("never treats HTTPS as proof", () => {
    const r = analyzeUrl("https://unknown-site.example/");
    expect(r.status).toBe("unknown");
    expect(r.findings.some((f) => f.type === "https_is_not_proof")).toBe(true);
  });

  it("only verifies domains on the user's own list (and their subdomains)", () => {
    expect(analyzeUrl("https://jobs.acme.example", { trustedDomains: ["acme.example"] }).status).toBe("verified");
    expect(analyzeUrl("https://acme.example.evil.test", { trustedDomains: ["acme.example"] }).status).not.toBe("verified");
  });

  it("detects the @ trick", () => {
    const r = analyzeUrl("https://careers.acme.example@203.0.113.9/login");
    expect(r.riskLevel).toBe("high");
    expect(r.findings.some((f) => f.type === "credentials_in_url")).toBe(true);
  });

  it("flags javascript: and data: links (regression)", () => {
    expect(analyzeUrl("javascript:alert(1)").status).toBe("suspicious");
    expect(analyzeUrl("data:text/html,hi").riskLevel).toBe("high");
  });

  it("handles unreadable input without throwing", () => {
    const r = analyzeUrl("not a url at all");
    expect(r.status).toBe("unknown");
    expect(r.findings[0]!.type).toBe("invalid_url");
  });
});

describe("score and verdict", () => {
  it("keeps message scores consistent with the 20/50 bands (critical overrides force High)", () => {
    for (const c of TEST_CASES.filter((t) => t.kind === "message")) {
      const r = runTestSuite([c]).results[0]!.report;
      if (r.kind !== "message") continue;
      const expected = r.critical?.active || r.score >= 50 ? "high" : r.score >= 20 ? "medium" : "low";
      expect(r.riskLevel).toBe(expected);
      expect(r.verdict.label.toLowerCase()).not.toContain("safe");
      expect(r.score).toBeLessThanOrEqual(100);
    }
  });

  it("counts each category once and never lets a familiar sender cancel an OTP warning", () => {
    const twice = analyzeMessage({ text: "Share the OTP now. Send the OTP again. Tell me the verification code." });
    expect(twice.contributions!.filter((c) => c.id === "credential")).toHaveLength(1);
    const familiar = analyzeMessage({ text: "Please share the OTP you got.", context: { recognised: "yes", expected: "yes" } });
    expect(familiar.riskLevel).toBe("high");
    expect(familiar.critical!.active).toBe(true);
  });

  it("never makes an unknown sender alone High", () => {
    const r = analyzeMessage({ text: "Hi, are you coming to the workshop on Saturday?", sender: "+91 90000 0XXXX", context: { expected: "no", recognised: "no" } });
    expect(r.riskLevel).toBe("low");
    expect(r.senderVerification!.status).toBe("unverified");
  });

  it("separates risk, confidence and sender verification", () => {
    const bare = analyzeMessage({ text: "Interview on Monday." });
    expect(bare.confidence!.level).toBe("low");
    expect(bare.senderVerification!.status).toBe("unknown");
    const rich = analyzeMessage(
      { text: "Dear Candidate, thank you for applying. We would like to invite you for an online interview on Monday at 11 AM. Please reply to confirm.", channel: "email", sender: "hr@northwind.example", context: { expected: "yes", recognised: "yes" } },
      { trustedDomains: ["northwind.example"] },
    );
    expect(rich.confidence!.level).toBe("high");
    expect(rich.senderVerification!.status).toBe("verified");
    expect(rich.riskLevel).toBe("low");
  });

  it("explains every result", () => {
    for (const r of runTestSuite().results) expect(r.reason).toMatch(/^Expected (Low|Medium|High), got (Low|Medium|High)/);
  });
});

describe("analysis pipeline", () => {
  it("runs every stage in order and reports real statuses", () => {
    const p = createMessagePipeline({ text: "HR team: pay ₹999 registration fee and share the OTP at bit.ly/x1demo", sender: "hr.demo@gmail.com" });
    const seen: string[] = [];
    let c;
    while ((c = p.next())) seen.push(`${c.id}:${c.status}`);
    expect(seen).toEqual([
      "parse:passed",
      "credentials:warning",
      "payment:warning",
      "urgency:passed",
      "manipulation:passed",
      "apps:passed",
      "sender:warning",
      "context:unavailable",
      "links:warning",
      "impersonation:passed",
      "reputation:unavailable",
      "risk:passed",
      "report:passed",
    ]);
    expect(p.result().riskLevel).toBe("high");
  });

  it("marks checks unavailable or skipped instead of pretending they ran", () => {
    const r = analyzeMessage({ text: "Your interview is on Monday at 11 AM in room 204. Please bring your college ID." });
    const s = Object.fromEntries(r.checks!.map((c) => [c.id, c.status]));
    expect(s).toMatchObject({ sender: "unavailable", links: "skipped", impersonation: "skipped", reputation: "unavailable" });
  });

  it("checks the sender's domain for look-alikes", () => {
    const r = analyzeMessage({ text: "Your onboarding documents are ready for review next week.", sender: "hr@infosys-careers-desk.example" });
    expect(r.checks!.find((c) => c.id === "impersonation")!.status).toBe("warning");
  });

  it("produces the same findings whether run step by step or all at once", () => {
    for (const c of TEST_CASES.filter((t) => t.kind === "message")) {
      const p = createMessagePipeline({ text: c.text, channel: c.channel, sender: c.sender });
      while (p.next());
      expect(p.result().riskLevel).toBe(analyzeMessage({ text: c.text, channel: c.channel, sender: c.sender }).riskLevel);
    }
  });

  it("gives websites structured checks with HTTPS separate from trust", () => {
    const r = analyzeUrl("https://careers.northwind.example/jobs");
    const s = Object.fromEntries(r.checks!.map((c) => [c.id, c.status]));
    expect(s).toMatchObject({ connection: "passed", trusted: "unavailable", reputation: "unavailable" });
  });
});

describe("whole-message context (regressions from real Chrome testing)", () => {
  const T4 =
    "Following your acceptance of the offer, please log in to our official employee onboarding portal using the careers website you independently verified. You will be asked to submit your bank account details and IFSC code through the secure payroll section to enable monthly salary transfers.";

  it("treats bank details sent to an official payroll portal as normal onboarding, wherever the portal is mentioned", () => {
    const r = analyzeMessage({ text: T4, channel: "email" });
    expect(r.riskLevel).toBe("low");
    expect(r.score).toBe(0);
    const note = r.findings.find((f) => f.type === "financial_details_request");
    expect(note?.severity).toBe("info"); // kept as an explained note, not silently dropped
  });

  it("still warns when the same details are requested back by message", () => {
    expect(analyzeMessage({ text: "You are selected! Reply with your bank account number and IFSC to receive your stipend." }).riskLevel).toBe("high");
    expect(analyzeMessage({ text: "Now that you have accepted our offer, please email us your bank account number and IFSC." }).riskLevel).toBe("medium");
    expect(analyzeMessage({ text: "Please share your bank account details." }).riskLevel).toBe("medium");
  });

  it("does not let an official-portal mention excuse a by-message request", () => {
    const r = analyzeMessage({ text: "Log in to the official employee portal later. For now, WhatsApp me your bank account number and IFSC." });
    expect(r.riskLevel).toBe("high");
  });

  it("separates warnings, quoted examples and OTP deliveries from real OTP requests", () => {
    expect(analyzeMessage({ text: "Never share your OTP, UPI PIN, CVV or bank password with anyone." }).riskLevel).toBe("low");
    expect(analyzeMessage({ text: "Students are receiving fake messages saying “share the OTP to confirm your selection”. Do not respond to such messages." }).riskLevel).toBe("low");
    expect(analyzeMessage({ text: "Enter OTP 482913 on the Demo College Portal to log in. Never share this OTP with anyone." }).riskLevel).toBe("low");
    expect(analyzeMessage({ text: "Please share the OTP you received with our recruiter to confirm your slot." }).critical?.active).toBe(true);
  });

  it("does not read money paid TO you as a fee", () => {
    const r = analyzeMessage({ text: "Selected candidates: we will transfer your joining amount after onboarding." });
    expect(r.contributions?.some((c) => c.id === "payment")).toBe(false);
  });
});

describe("regressions from real Chrome negative-control test", () => {
  const MSG =
    "Congratulations! Your offer has been approved. Reply to this WhatsApp message with your bank account number and IFSC code immediately so we can complete your payroll registration.";

  it("keeps the High score but explains the WhatsApp reply route accurately (no 'continue by phone')", () => {
    const r = analyzeMessage({ text: MSG, channel: "whatsapp" });
    expect(r.riskLevel).toBe("high");
    expect(r.score).toBe(70);
    const titles = r.findings.map((f) => f.title);
    expect(titles).toContain("Requests sensitive financial information through an informal messaging channel");
    expect(titles).not.toContain("Wants you to continue by phone");
    expect(r.findings.some((f) => f.type === "call_to_continue")).toBe(false);
  });

  it("does not read an account number as a phone number, but still catches real phone lures", () => {
    expect(analyzeMessage({ text: "You are selected. Message us your bank account number to complete onboarding." }).findings.some((f) => f.type === "call_to_continue")).toBe(false);
    expect(analyzeMessage({ text: "You have been selected for a job. Call our HR at 90000 0XXXX to complete the process." }).findings.some((f) => f.type === "call_to_continue")).toBe(true);
  });

  it("gives every check row a label, outcome and explanation (extension popup model)", () => {
    const rows = checkRows(analyzeMessage({ text: MSG, channel: "whatsapp" }));
    expect(rows).toHaveLength(13);
    for (const row of rows) {
      expect(row.label.trim()).not.toBe("");
      expect(row.outcome.trim()).not.toBe("");
      expect(row.explanation.trim()).not.toBe("");
      expect(row.icon).toMatch(/[✓!⊘–]/);
    }
    expect(rows.find((r) => r.id === "apps")?.outcome).toBe("Warning");
  });

  it("never renders a blank row even for malformed or old saved checks", () => {
    const r = analyzeMessage({ text: MSG });
    const broken = { ...r, checks: [{} as never, { id: "x", name: "", status: "weird" } as never] };
    const rows = checkRows(broken);
    expect(rows.map((x) => x.label)).toEqual(["Check 1", "Check 2"]);
    expect(rows.every((x) => x.outcome && x.explanation)).toBe(true);
  });
});

describe("page analysis", () => {
  it("flags a UPI PIN field as high risk anywhere", () => {
    const r = analyzePage({ url: "https://pay.demo.example", text: "", fields: { ...EMPTY_FIELDS, upiPin: 1 } });
    expect(r.riskLevel).toBe("high");
  });
});

describe("helpers", () => {
  it("builds highlight segments that reassemble the original text", () => {
    const text = "Hi! Share the OTP within 10 minutes or lose your offer.";
    const r = analyzeMessage({ text });
    const segs = buildSegments(text, r.findings);
    expect(segs.map((s) => s.text).join("")).toBe(text);
    expect(segs.some((s) => s.severity === "strong")).toBe(true);
  });

  it("formats an incident report without the raw message unless asked", () => {
    const text = "Pay ₹2,000 training fee today";
    const r = analyzeMessage({ text });
    expect(formatIncidentReport(r)).not.toContain("Original message");
    expect(formatIncidentReport(r, { messageText: text })).toContain(text);
  });
});
