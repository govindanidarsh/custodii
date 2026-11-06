import { Container } from "@/components/ui/Container";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";

const TACTICS: { icon: IconName; title: string; quote: string; body: string }[] = [
  {
    icon: "lock",
    title: "They ask for codes",
    quote: "Share the OTP to confirm your selection",
    body: "An OTP lets someone log into your accounts or approve a payment in your name.",
  },
  {
    icon: "scale",
    title: "They ask for money",
    quote: "Pay ₹1,499 for document verification",
    body: "Registration, training or “refundable” fees are the most common placement scam.",
  },
  {
    icon: "alert",
    title: "They rush you",
    quote: "Reply within 15 minutes or lose the offer",
    body: "Deadlines that feel impossible are designed to stop you from checking with anyone.",
  },
  {
    icon: "link-off",
    title: "They borrow trust",
    quote: "HR team, using a personal Gmail and a short link",
    body: "Real company names and logos make fake offers look official at first glance.",
  },
];

export function Problem() {
  return (
    <section id="problem" aria-labelledby="problem-heading" className="border-y border-line bg-white py-20 sm:py-28">
      <Container>
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <Reveal>
            <SectionHeading
              id="problem-heading"
              eyebrow="The problem"
              title="Fake offers look real — especially when you’re hoping for one."
              description="During placement season, students receive offer letters, “HR” emails and WhatsApp messages that borrow real company names. First-time job seekers rarely know what to check, and placement cells usually hear about a scam only after the money is gone."
            />
            <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-ink-soft">
              The hard part isn’t spotting obvious spam. It’s the message that’s <em>almost</em> right — and the genuine offer that happens
              to look odd. TrustLayer is built for both.
            </p>
          </Reveal>

          <ul className="grid gap-4 sm:grid-cols-2">
            {TACTICS.map((t, i) => (
              <Reveal as="li" key={t.title} delay={i * 70} className="rounded-2xl border border-line bg-canvas/60 p-5">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white text-brand-600 shadow-card">
                  <Icon name={t.icon} className="h-[18px] w-[18px]" />
                </span>
                <p className="mt-4 font-semibold text-ink">{t.title}</p>
                <p className="mt-2 font-mono text-[12.5px] leading-snug text-violet-600">“{t.quote}”</p>
                <p className="mt-2 text-sm leading-relaxed text-muted">{t.body}</p>
              </Reveal>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}
