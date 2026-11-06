import { RiskBadge } from "@/components/analyzer/RiskBadge";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Icon } from "@/components/ui/Icon";

/** Static product preview — illustrates the result format, not a live analysis. */
function HeroPreview() {
  return (
    <div className="relative" aria-hidden>
      <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-to-br from-brand-100 via-white to-violet-100 blur-2xl" />
      <div className="rounded-3xl border border-line bg-white/90 p-5 shadow-lift backdrop-blur sm:p-6">
        <div className="flex items-center gap-2 text-xs text-muted">
          <Icon name="message" className="h-3.5 w-3.5" />
          WhatsApp · unknown number
          <span className="ml-auto rounded-full bg-canvas px-2 py-0.5 font-medium">Example</span>
        </div>
        <p className="mt-3 rounded-2xl rounded-tl-md bg-canvas p-4 text-[14px] leading-relaxed text-ink-soft">
          Congratulations! You are selected for the Data Analyst internship.{" "}
          <mark className="rounded bg-violet-100 px-0.5 text-ink underline decoration-violet-500 decoration-2 underline-offset-2">
            Pay ₹999 for document verification
          </mark>{" "}
          and{" "}
          <mark className="rounded bg-violet-100 px-0.5 text-ink underline decoration-violet-500 decoration-2 underline-offset-2">
            reply within 15 minutes
          </mark>{" "}
          to keep your seat.
        </p>

        <div className="mt-5 flex items-center justify-between">
          <RiskBadge level="high" />
          <span className="text-xs text-muted">2 warning signs</span>
        </div>
        <ul className="mt-4 space-y-2.5">
          <li className="flex items-start gap-3 rounded-xl border border-line p-3">
            <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-risk-high" />
            <span className="text-sm">
              <span className="font-semibold text-ink">Asks for money upfront.</span>{" "}
              <span className="text-ink-soft">Real employers don’t charge to confirm an offer.</span>
            </span>
          </li>
          <li className="flex items-start gap-3 rounded-xl border border-line p-3">
            <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-risk-medium" />
            <span className="text-sm">
              <span className="font-semibold text-ink">Pressure to act fast.</span>{" "}
              <span className="text-ink-soft">Urgency stops you from checking.</span>
            </span>
          </li>
        </ul>
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-ink px-3.5 py-3 text-sm text-white">
          <Icon name="shield" className="h-4 w-4 shrink-0 text-brand-200" />
          Don’t pay. Verify with your placement cell.
        </div>
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden">
      <div
        aria-hidden
        className="bg-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_75%)]"
      />
      <Container className="relative grid items-center gap-14 pt-14 pb-20 sm:pt-20 lg:grid-cols-[1.1fr_1fr] lg:gap-16 lg:pt-24 lg:pb-28">
        <div className="animate-fade-up">
          <p className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-3 py-1 text-[13px] font-medium text-ink-soft shadow-card">
            <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-brand-500 to-violet-500" />
            For students facing placement season
          </p>
          <h1 className="mt-6 font-display text-[2.6rem] leading-[1.04] font-semibold tracking-[-0.035em] text-ink text-balance sm:text-6xl lg:text-[4.1rem]">
            Don’t trust blindly.{" "}
            <span className="bg-gradient-to-r from-brand-600 to-violet-600 bg-clip-text text-transparent">Verify intelligently.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted text-pretty">
            TrustLayer AI checks suspicious placement, internship and recruiter messages. It shows you the exact phrases that look risky,
            explains why, and tells you the safe next step — without crying wolf on genuine offers.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="#analyze" size="lg">
              Check a message <Icon name="arrow-right" className="h-4 w-4" />
            </ButtonLink>
            <ButtonLink href="#how-it-works" size="lg" variant="secondary">
              See how it works
            </ButtonLink>
          </div>
          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-soft">
            {["No sign-up", "Messages not stored", "Never asks for OTPs"].map((t) => (
              <li key={t} className="flex items-center gap-1.5">
                <Icon name="check" className="h-4 w-4 text-brand-600" />
                {t}
              </li>
            ))}
          </ul>
        </div>
        <div className="animate-fade-up [animation-delay:120ms]">
          <HeroPreview />
        </div>
      </Container>
    </section>
  );
}
