import { Copy } from "lucide-react";
import { copyText } from "../lib/download";
import { Button } from "../ui/Button";
import { BarList } from "../ui/Charts";
import { useToast } from "../ui/Feedback";
import { Container, PageHeader } from "../ui/Layout";

/**
 * FICTIONAL DEMO. "Demo Institute of Technology" does not exist. Every number below is invented to
 * show what a placement-cell view could look like. It is never mixed with real scans.
 */
const DEMO = {
  reports: 47,
  high: 19,
  medium: 16,
  low: 12,
  patterns: [
    { label: "Registration / training fee", value: 14, tone: "high" as const },
    { label: "Personal Gmail posing as HR", value: 12, tone: "medium" as const },
    { label: "OTP to 'confirm selection'", value: 9, tone: "high" as const },
    { label: "Telegram task job", value: 7, tone: "medium" as const },
    { label: "APK / remote-access app", value: 5, tone: "high" as const },
  ],
};

const ADVISORY = `Placement Cell Advisory

Students are receiving fake internship/placement messages asking for a "registration fee" or an OTP to "confirm selection".

• No genuine company or the placement cell will ever ask for an OTP, UPI PIN, password or any fee.
• Do not install apps (.apk) or screen-sharing tools sent by "HR".
• Got an offer outside the placement portal? Forward it to the placement cell before replying.

Check suspicious messages with CUSTODI and verify every offer with us.`;

export default function College() {
  const toast = useToast();
  return (
    <Container wide className="pt-10 md:pt-14">
      <div role="note" className="mb-8 rounded-2xl border-2 border-dashed border-medium bg-medium-soft px-5 py-4 text-sm text-ink">
        <p className="font-mono text-xs font-semibold tracking-widest text-medium uppercase">Fictional demo mode</p>
        <p className="mt-1">
          “Demo Institute of Technology” does not exist. Every number on this page is invented for illustration and is never mixed with your real scans.
        </p>
      </div>
      <PageHeader
        eyebrow="For placement cells"
        title="One clear warning beats a hundred ignored ones"
        description="A placement cell could see which scam patterns reach its students — as anonymous counts, never students' messages — and send one specific advisory instead of generic 'beware of fraud' posts."
      />

      <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ["Student reports", DEMO.reports, "text-ink"],
          ["Suspicious", DEMO.high, "text-high"],
          ["Caution", DEMO.medium, "text-medium"],
          ["Low risk", DEMO.low, "text-low"],
        ].map(([l, v, c]) => (
          <div key={l as string} className="panel border-dashed p-5">
            <p className="t-eyebrow text-muted">{l} · demo</p>
            <p className={`mt-3 font-display text-5xl leading-none ${c}`}>{v}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="panel p-6">
          <h2 className="t-h3">Top scam patterns this week (fictional)</h2>
          <div className="mt-5">
            <BarList items={DEMO.patterns} empty="" />
          </div>
        </section>
        <section className="panel p-6">
          <h2 className="t-h3">Advisory template — real and copyable</h2>
          <p className="mt-1 text-sm text-muted">Specific, actionable, short. Designed against alert fatigue.</p>
          <pre className="mt-4 max-h-80 overflow-auto rounded-xl bg-surface-2 p-4 text-sm whitespace-pre-wrap text-ink-2">{ADVISORY}</pre>
          <Button variant="secondary" size="sm" className="mt-3" onClick={async () => toast((await copyText(ADVISORY)) ? "Advisory copied" : "Couldn't copy", "success")}>
            <Copy className="h-4 w-4" /> Copy advisory
          </Button>
        </section>
      </div>

      <section className="mt-16">
        <h2 className="t-h2">Who CUSTODI serves</h2>
        <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-3">
          {[
            ["Students & individuals", "Free scanner, PWA and extension. On-device, no account.", "Free core product."],
            ["Colleges & placement cells", "Trusted recruiter-domain lists, advisory templates, anonymous pattern view, student onboarding sessions.", "Planned: annual institutional licence."],
            ["Small organisations", "The same engine for staff: payment-change scams, fake vendor links, credential-phishing pages.", "Planned: per-seat plan."],
          ].map(([t, d, m]) => (
            <div key={t} className="border-t-2 border-ink pt-4">
              <p className="font-medium">{t}</p>
              <p className="mt-2 text-sm text-ink-2">{d}</p>
              <p className="mt-3 text-xs text-muted">{m} Pricing not yet set.</p>
            </div>
          ))}
        </div>
      </section>
    </Container>
  );
}
