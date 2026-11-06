import { Container } from "@/components/ui/Container";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";

const FEATURES: { icon: IconName; title: string; body: string }[] = [
  { icon: "quote", title: "Evidence, not verdicts", body: "Every warning quotes the exact words from your message that triggered it." },
  {
    icon: "scale",
    title: "Honest about uncertainty",
    body: "Three clear risk levels. No fake “94% scam” scores, and no false comfort on low-risk results.",
  },
  {
    icon: "shield",
    title: "Safe next steps",
    body: "Specific actions that keep your money and accounts safe, pointing to official channels only.",
  },
  {
    icon: "message",
    title: "Built for how you’re contacted",
    body: "Email, SMS and WhatsApp — including Hinglish messages that most tools miss.",
  },
  {
    icon: "check",
    title: "Calm on genuine offers",
    body: "Ordinary interview invites aren’t flagged as scams. Restraint is part of the design.",
  },
  { icon: "sparkles", title: "Learn the patterns", body: "Plain-language explanations help you recognise the next scam on your own." },
];

export function Features() {
  return (
    <section id="features" aria-labelledby="features-heading" className="border-y border-line bg-white py-20 sm:py-28">
      <Container>
        <Reveal>
          <SectionHeading id="features-heading" eyebrow="Features" title="Designed to inform you, not frighten you." />
        </Reveal>
        <ul className="mt-12 grid gap-px overflow-hidden rounded-3xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <Reveal as="li" key={f.title} delay={(i % 3) * 70} className="bg-white p-6 sm:p-7">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <Icon name={f.icon} className="h-5 w-5" />
              </span>
              <p className="mt-5 font-semibold text-ink">{f.title}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted">{f.body}</p>
            </Reveal>
          ))}
        </ul>
      </Container>
    </section>
  );
}
