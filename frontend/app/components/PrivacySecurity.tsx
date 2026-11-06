import { Container } from "@/components/ui/Container";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Reveal } from "@/components/ui/Reveal";
import { LIMITATION_STATEMENT } from "@/lib/constants";

const PROMISES: { icon: IconName; title: string; body: string }[] = [
  {
    icon: "eye-off",
    title: "Messages aren’t stored",
    body: "Your text is analysed and discarded. Logs keep only technical details like time and risk level — never the message.",
  },
  {
    icon: "lock",
    title: "We never ask for secrets",
    body: "TrustLayer will never ask for your OTP, password, PIN or bank details. If something claiming to be us does, it isn’t.",
  },
  {
    icon: "link-off",
    title: "Links are never opened",
    body: "We read links as text only. Nothing in your message is clicked, downloaded or visited.",
  },
  {
    icon: "server",
    title: "Keys stay on the server",
    body: "AI provider keys live only on our backend. Your browser talks to our API, never to the AI provider directly.",
  },
];

export function PrivacySecurity() {
  return (
    <section id="privacy" aria-labelledby="privacy-heading" className="py-20 sm:py-28">
      <Container>
        <div className="overflow-hidden rounded-[2rem] bg-ink text-white">
          <div className="grid gap-12 p-7 sm:p-12 lg:grid-cols-[0.9fr_1.1fr] lg:p-14">
            <Reveal>
              <p className="mb-3 inline-flex items-center gap-2 text-[13px] font-semibold tracking-wide text-brand-200 uppercase">
                <span aria-hidden className="h-px w-5 bg-gradient-to-r from-brand-200 to-violet-500" />
                Privacy &amp; security
              </p>
              <h2
                id="privacy-heading"
                className="font-display text-3xl font-semibold tracking-tight text-balance sm:text-[2.5rem] sm:leading-[1.1]"
              >
                A safety tool should be safe to use.
              </h2>
              <p className="mt-4 text-[17px] leading-relaxed text-white/70">
                When the full service is live, pasted text is sent to an AI provider for analysis and is not kept by TrustLayer. Remove
                personal details before pasting.
              </p>
              <p className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-5 text-sm leading-relaxed text-white/75">
                <span className="mb-1 block font-semibold text-white">Limitations</span>
                {LIMITATION_STATEMENT}
              </p>
            </Reveal>
            <ul className="grid gap-4 sm:grid-cols-2">
              {PROMISES.map((p, i) => (
                <Reveal as="li" key={p.title} delay={i * 70} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-brand-200">
                    <Icon name={p.icon} className="h-[18px] w-[18px]" />
                  </span>
                  <p className="mt-4 font-semibold">{p.title}</p>
                  <p className="mt-2 text-sm leading-relaxed text-white/65">{p.body}</p>
                </Reveal>
              ))}
            </ul>
          </div>
        </div>
      </Container>
    </section>
  );
}
