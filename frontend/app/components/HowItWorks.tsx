import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";

const STEPS = [
  {
    n: "01",
    title: "Paste the message",
    body: "Copy the email, SMS or WhatsApp text and choose where it came from. Remove your own personal details first.",
  },
  {
    n: "02",
    title: "Two layers check it",
    body: "Fixed safety rules catch clear danger signs like OTP or fee requests. An AI layer reads the context and explains it in plain language.",
  },
  {
    n: "03",
    title: "See the evidence",
    body: "You get a Low, Medium or High risk level with the exact phrases highlighted — so you can see why, not just what.",
  },
  {
    n: "04",
    title: "Take the safe next step",
    body: "Clear actions like “don’t share the OTP” and “confirm through your placement cell”. Unclear cases say “needs verification”, never “confirmed fraud”.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" aria-labelledby="how-heading" className="py-20 sm:py-28">
      <Container>
        <Reveal>
          <SectionHeading
            id="how-heading"
            eyebrow="How it works"
            title="Explain before you trust."
            description="Most tools stop at “phishing” or “safe”. TrustLayer shows its working, so you learn the pattern for next time."
            align="center"
          />
        </Reveal>
        <div className="relative mt-14">
          <div
            aria-hidden
            className="absolute top-7 right-[12%] left-[12%] hidden h-px bg-gradient-to-r from-brand-200 via-violet-100 to-brand-200 lg:block"
          />
          <ol className="relative grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <Reveal as="li" key={s.n} delay={i * 80} className="relative rounded-2xl border border-line bg-white p-6 shadow-card">
                <span className="relative inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-violet-500 font-display text-sm font-semibold text-white">
                  {s.n}
                </span>
                <p className="mt-5 font-display text-lg font-semibold text-ink">{s.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted">{s.body}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </Container>
    </section>
  );
}
