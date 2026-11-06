import { analyzeMessage, analyzeUrl, buildSegments, DEFAULT_SCORING, MESSAGE_STAGES, runTestSuite, SAMPLE_MESSAGES, TEST_CASES, type MessageCase } from "@custodi/core";
import { motion, useReducedMotion } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight, CheckCircle2, CircleSlash, ScanLine } from "lucide-react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router";
import { Anatomy, ConnectionAndTrust } from "../components/WebsiteChecker";
import { useHistory } from "../lib/store";
import { Emblem } from "../ui/Art";
import { RiskBadge, Tag } from "../ui/Badge";
import { ButtonLink } from "../ui/Button";
import { Container, Reveal } from "../ui/Layout";

gsap.registerPlugin(ScrollTrigger);

function useInView<T extends Element>(margin = "200px") {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(true);
  useEffect(() => {
    if (!ref.current) return;
    const io = new IntersectionObserver(([e]) => setInView(!!e?.isIntersecting), { rootMargin: margin });
    io.observe(ref.current);
    return () => io.disconnect();
  }, [margin]);
  return [ref, inView] as const;
}

function Eyebrow({ n, children, light = false }: { n: string; children: React.ReactNode; light?: boolean }) {
  return (
    <p className={`t-eyebrow flex items-center gap-3 ${light ? "text-[#8bb0ff]" : "text-accent"}`}>
      <span className={light ? "text-white/50" : "text-muted"}>{n}</span>
      <span className="h-px w-8 bg-current" />
      {children}
    </p>
  );
}

/* ================================================================ HERO */
function Hero() {
  const reduce = !!useReducedMotion();
  const wrap = useRef<HTMLElement>(null);
  const tilt = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!wrap.current || reduce) return;
    const ctx = gsap.context(() => {
      gsap.to(".hero-emblem", { yPercent: 18, scale: 0.86, opacity: 0.35, ease: "none", scrollTrigger: { trigger: wrap.current, start: "top top", end: "bottom top", scrub: 0.6 } });
      gsap.to(".hero-copy", { y: -80, opacity: 0.2, ease: "none", scrollTrigger: { trigger: wrap.current, start: "top top", end: "bottom top", scrub: true } });
    }, wrap);
    return () => ctx.revert();
  }, [reduce, wrap]);

  return (
    <section ref={wrap} className="relative overflow-hidden">
      <div className="dot-grid pointer-events-none absolute inset-0 opacity-60 [mask-image:radial-gradient(ellipse_at_70%_40%,black,transparent_70%)]" />
      <Container wide className="relative grid grid-cols-1 min-h-[calc(100svh-4rem)] items-center gap-6 pt-6 pb-16 lg:grid-cols-[1.05fr_1fr] lg:pt-0">
        <div className="hero-copy order-2 lg:order-1">
          <p className="t-eyebrow text-accent">Your personal digital bodyguard</p>
          <h1 className="mt-5 font-display text-[clamp(2.9rem,6.4vw,5.6rem)] leading-[0.95] tracking-[-0.02em] text-ink">
            Think before you trust.
            <span className="mt-2 block text-[0.62em] text-muted italic">Verify before you act.</span>
          </h1>
          <p className="t-body-lg mt-6 max-w-lg text-ink-2">
            Fake offers, OTP traps and look-alike links are built to look trustworthy. CUSTODI reads them the way a security analyst would — and shows you the
            exact evidence, on your device, before you act.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <ButtonLink to="/scan" size="lg">
              <ScanLine className="h-5 w-5" /> Scan a message
            </ButtonLink>
            <ButtonLink to="/website" size="lg" variant="secondary">
              Check a website
            </ButtonLink>
          </div>
          <dl className="mt-10 grid max-w-lg grid-cols-3 border-t border-line pt-5">
            {[
              [String(MESSAGE_STAGES.length), "checks on every message"],
              [String(TEST_CASES.length), "open test cases"],
              ["0", "messages uploaded"],
            ].map(([n, l]) => (
              <div key={l}>
                <dt className="font-display text-3xl text-ink">{n}</dt>
                <dd className="mt-1 text-xs leading-snug text-muted">{l}</dd>
              </div>
            ))}
          </dl>
          <a href="#story" className="mt-6 inline-block py-2 text-sm text-ink-2 underline decoration-line-strong underline-offset-4 hover:text-accent">
            See how it works ↓
          </a>
        </div>


        <div
          className="relative order-1 flex h-[34svh] min-h-[220px] items-center justify-center lg:order-2 lg:h-[min(70svh,460px)]"
          onPointerMove={(e) => {
            if (reduce || !tilt.current) return;
            const r = e.currentTarget.getBoundingClientRect();
            const x = (e.clientX - r.left) / r.width - 0.5;
            const y = (e.clientY - r.top) / r.height - 0.5;
            tilt.current.style.transform = `perspective(900px) rotateY(${x * 14}deg) rotateX(${-y * 12}deg)`;
          }}
          onPointerLeave={() => tilt.current && (tilt.current.style.transform = "")}
        >
          <div className="pointer-events-none absolute top-1/2 left-1/2 aspect-square h-[92%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,color-mix(in_srgb,var(--accent)_22%,transparent),transparent_62%)]" />
          <div className="hero-emblem relative h-full w-full">
            <div ref={tilt} className="h-full w-full transition-transform duration-300 ease-out [transform-style:preserve-3d]">
              <Emblem className="h-full w-full drop-shadow-[0_30px_60px_rgba(4,10,24,0.55)]" sheen={!reduce} alt="CUSTODI emblem" sizes="(min-width: 1024px) 380px, 60vw" />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

/* ================================================================ SCENE 1 — hidden threats */
const FRAGS = [
  ["Pay ₹999 for document verification", 0.6, "12%", "8%"],
  ["Share the OTP to confirm", 1.2, "70%", "18%"],
  ["bit.ly/offer-letter", 0.9, "6%", "72%"],
  ["Install HRConnect.apk", 1.5, "76%", "66%"],
  ["Reply within 15 minutes", 0.4, "40%", "86%"],
  ["Don't tell the placement cell", 1.1, "52%", "4%"],
  ["Enter your UPI PIN to receive stipend", 0.7, "24%", "40%"],
] as const;

function Threats() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  useLayoutEffect(() => {
    if (reduce || !ref.current) return;
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>(".frag").forEach((el) => {
        const d = Number(el.dataset.depth);
        gsap.fromTo(el, { y: 120 * d }, { y: -160 * d, ease: "none", scrollTrigger: { trigger: ref.current, start: "top bottom", end: "bottom top", scrub: true } });
      });
    }, ref);
    return () => ctx.revert();
  }, [reduce]);
  return (
    <section id="story" ref={ref} className="grain relative scroll-mt-16 overflow-hidden bg-[#0a0e1a] py-32 text-[#eef0f5] sm:py-44">
      <div aria-hidden className="absolute inset-0">
        {FRAGS.map(([t, d, x, y]) => (
          <span
            key={t}
            data-depth={d}
            className="frag absolute rounded-full border border-white/12 bg-white/[0.04] px-3 py-1.5 font-mono text-[11px] whitespace-nowrap text-white/45 sm:text-xs"
            style={{ left: x, top: y, filter: `blur(${(1.5 - d) * 1.2}px)` }}
          >
            {t}
          </span>
        ))}
      </div>
      <Container className="relative">
        <Reveal>
          <Eyebrow n="01" light>
            The problem
          </Eyebrow>
          <h2 className="t-h1 mt-5 max-w-4xl">The digital world is full of hidden threats.</h2>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="mt-8 max-w-2xl text-lg leading-relaxed text-white/70">
            A fake offer looks exactly like a real one — same logo, same polite tone. The difference hides in a few words: a fee, a code, a deadline, a link. Students
            are told to “be careful”, then flooded with warnings until they stop reading them.
          </p>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white">CUSTODI's answer: point at the exact words, explain them, and say what to do.</p>
        </Reveal>
      </Container>
    </section>
  );
}

/* ================================================================ SCENE 2 — an email arrives (pinned on desktop) */
const EMAIL = TEST_CASES.find((c) => c.id === "M01") as MessageCase;
function EmailScene() {
  const reduce = useReducedMotion();
  const wrap = useRef<HTMLDivElement>(null);
  const report = useMemo(() => analyzeMessage({ text: EMAIL.text, channel: EMAIL.channel, sender: EMAIL.sender }), []);
  const checks = report.checks ?? [];
  const [shown, setShown] = useState(reduce ? checks.length : 0);

  useLayoutEffect(() => {
    if (reduce || !wrap.current) return;
    if (!window.matchMedia("(min-width: 1024px)").matches) {
      setShown(checks.length);
      return;
    }
    const st = ScrollTrigger.create({
      trigger: wrap.current,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (s) => setShown(Math.min(checks.length, Math.round(s.progress * (checks.length + 1)))),
    });
    return () => st.kill();
  }, [reduce, checks.length]);

  const revealedIds = new Set(checks.slice(0, shown).flatMap((c) => c.findingIds));
  const visible = report.findings.filter((f) => revealedIds.has(f.id));
  const segs = buildSegments(EMAIL.text, visible);
  const done = shown >= checks.length;

  return (
    <div ref={wrap} className="relative lg:h-[320vh]">
      <section className="lg:sticky lg:top-0 lg:flex lg:h-[100svh] lg:items-center">
        <Container wide className="grid grid-cols-1 gap-10 py-24 lg:grid-cols-[0.85fr_1.15fr] lg:py-0">
          <div className="min-w-0">
            <Eyebrow n="02">A suspicious email arrives</Eyebrow>
            <h2 className="t-h2 mt-5">Twelve real checks. Scroll to run them.</h2>
            <ol className="mt-6 space-y-0.5">
              {checks.map((c, i) => {
                const on = i < shown;
                const warn = c.status === "warning";
                return (
                  <li key={c.id} className={`flex items-center gap-3 rounded-lg px-2 py-1.5 text-sm transition-colors duration-300 ${on ? "text-ink" : "text-muted/60"}`}>
                    <span
                      className={`flex h-5 w-5 flex-none items-center justify-center rounded-full font-mono text-[10px] font-bold transition-colors ${
                        !on ? "border border-line" : warn ? (c.severity === "strong" ? "bg-high text-white" : "bg-medium text-white") : c.status === "passed" ? "bg-low text-white" : "bg-line-strong text-ink"
                      }`}
                    >
                      {on ? (warn ? "!" : c.status === "passed" ? "✓" : "–") : ""}
                    </span>
                    <span className="flex-1 truncate">{c.name}</span>
                    {on && <span className="font-mono text-[11px] tracking-wider text-muted uppercase">{c.status}</span>}
                  </li>
                );
              })}
            </ol>
            <p className="mt-4 text-xs text-muted">Fictional sample · the list above is the analyzer's actual output, not a script.</p>
          </div>

          <div className="panel relative min-w-0 overflow-hidden shadow-card">
            <div className="flex items-center justify-between border-b border-line px-5 py-3 text-xs text-muted">
              <span className="truncate">
                From <span className="font-mono text-ink-2">{EMAIL.sender}</span>
              </span>
              <span className="font-mono">{shown}/{checks.length} checks</span>
            </div>
            <div className="h-0.5 bg-surface-2">
              <div className="h-full bg-accent transition-[width] duration-300" style={{ width: `${(shown / Math.max(1, checks.length)) * 100}%` }} />
            </div>
            <div className="px-5 py-5">
              <p className="font-medium text-ink">Congratulations — confirm your selection</p>
              <p className="mt-3 text-[0.95rem] leading-relaxed whitespace-pre-wrap text-ink-2">
                {segs.map((s, i) =>
                  s.severity ? (
                    <motion.mark key={`${i}-${s.text}`} initial={{ opacity: 0.3 }} animate={{ opacity: 1 }} className={`mark-${s.severity} px-0.5`}>
                      {s.text}
                    </motion.mark>
                  ) : (
                    <span key={i}>{s.text}</span>
                  ),
                )}
              </p>
            </div>
            <motion.div initial={false} animate={{ height: visible.length ? "auto" : 0, opacity: visible.length ? 1 : 0 }} className="overflow-hidden border-t border-line bg-surface-2">
              <ul className="space-y-2 px-5 py-4 text-sm">
                {visible.map((f) => (
                  <li key={f.id} className="flex gap-2">
                    <span className={f.severity === "strong" ? "text-high" : "text-medium"}>●</span>
                    <span>
                      <b className="font-medium text-ink">{f.title}.</b> <span className="text-ink-2">{f.explanation.split(". ")[0]}.</span>
                    </span>
                  </li>
                ))}
              </ul>
            </motion.div>
            <motion.div
              initial={false}
              animate={{ opacity: done ? 1 : 0, scale: done ? 1 : 1.4, rotate: done ? -6 : -14 }}
              transition={{ type: "spring", stiffness: 260, damping: 18 }}
              className="pointer-events-none absolute top-16 right-5 rounded-lg border-2 border-high bg-surface/85 px-3 py-1.5 font-mono text-sm font-bold tracking-widest text-high uppercase"
            >
              {report.verdict.label} · {report.score}/100
            </motion.div>
            <motion.div initial={false} animate={{ height: done ? "auto" : 0, opacity: done ? 1 : 0 }} className="overflow-hidden">
              <p className="border-t border-line px-5 py-4 text-sm font-medium text-accent">→ {report.nextSteps[0]}</p>
            </motion.div>
          </div>
        </Container>
      </section>
    </div>
  );
}

/* ================================================================ SCENE 3 — try the scanner */
function TryScanner() {
  const samples = SAMPLE_MESSAGES.filter((s) => ["M02", "M05", "M09", "M13"].includes(s.id));
  const [text, setText] = useState(samples[0]!.text);
  const [active, setActive] = useState(samples[0]!.id);
  const report = useMemo(() => analyzeMessage({ text }), [text]);
  const warnings = report.findings.filter((f) => f.severity !== "info");

  return (
    <section className="py-28 sm:py-36">
      <Container wide>
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[0.8fr_1.2fr]">
          <Reveal>
            <Eyebrow n="04">Message scanning</Eyebrow>
            <h2 className="t-h2 mt-5">Edit the message. Watch the verdict change.</h2>
            <p className="t-body-lg mt-5 text-ink-2">
              This is the real CUSTODI analyzer, running live in your browser. Delete “₹1,499” and the fee warning disappears. Type “share the OTP” and it turns red. No
              vague warnings — just evidence.
            </p>
            <ul className="mt-8 space-y-3 text-sm text-ink-2">
              <li className="flex items-start gap-3">
                <span className="mark-strong px-1.5 font-mono text-xs">strong</span> OTP, PIN, password or card request · any fee · app install · remote access
              </li>
              <li className="flex items-start gap-3">
                <span className="mark-supporting px-1.5 font-mono text-xs">warning</span> pressure · secrecy · personal email · odd links · too good to be true
              </li>
            </ul>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="panel overflow-hidden shadow-card">
              <div className="flex flex-wrap items-center gap-1.5 border-b border-line p-3" role="group" aria-label="Fictional samples">
                {samples.map((s) => (
                  <button
                    key={s.id}
                    aria-pressed={active === s.id}
                    onClick={() => {
                      setText(s.text);
                      setActive(s.id);
                    }}
                    className={`rounded-full min-h-10 px-3 py-1.5 text-xs sm:min-h-0 transition-colors ${active === s.id ? "bg-ink text-bg" : "text-muted hover:bg-surface-2 hover:text-ink"}`}
                  >
                    {s.label}
                  </button>
                ))}
                <span className="ml-auto">
                  <Tag>fictional</Tag>
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2">
                <div className="border-b border-line p-4 md:border-r md:border-b-0">
                  <label htmlFor="try" className="t-eyebrow text-muted">
                    Edit me
                  </label>
                  <textarea
                    id="try"
                    value={text}
                    onChange={(e) => {
                      setText(e.target.value);
                      setActive("");
                    }}
                    rows={8}
                    className="mt-2 w-full resize-none rounded-xl bg-surface-2 p-3 text-sm leading-relaxed text-ink focus:ring-2 focus:ring-accent/30 focus:outline-none"
                  />
                </div>
                <div className="p-4" aria-live="polite">
                  <div className="flex items-center gap-2">
                    <RiskBadge level={report.riskLevel} />
                    <span className="font-mono text-xs text-muted">score {report.score}/100</span>
                  </div>
                  <p className={`mt-3 font-display text-4xl leading-none ${report.riskLevel === "high" ? "text-high" : report.riskLevel === "medium" ? "text-medium" : "text-low"}`}>
                    {report.verdict.label}
                  </p>
                  <ul className="mt-4 space-y-2 text-sm">
                    {warnings.slice(0, 4).map((f) => (
                      <li key={f.id} className="flex gap-2 text-ink-2">
                        <span className={f.severity === "strong" ? "text-high" : "text-medium"}>●</span>
                        <span>
                          {f.title}
                          {f.evidence[0] && <q className={`ml-1 font-mono text-xs mark-${f.severity}`}>{f.evidence[0].text}</q>}
                        </span>
                      </li>
                    ))}
                    {warnings.length === 0 && <li className="text-ink-2">No red flags found — still not a guarantee. Verify real offers with your placement cell.</li>}
                  </ul>
                  <p className="mt-4 border-t border-line pt-3 text-sm font-medium text-accent">→ {report.nextSteps[0]}</p>
                </div>
              </div>
            </div>
            <div className="mt-4">
              <ButtonLink to="/scan" variant="secondary">
                Open the full scanner <ArrowRight className="h-4 w-4" />
              </ButtonLink>
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}

/* ================================================================ SCENE 4 — website verification */
const URLS = [
  { label: "Look-alike", url: "https://g00gle-careers.top/apply" },
  { label: "@ trick", url: "https://careers.northwind.example@203.0.113.9/login" },
  { label: "Short link", url: "https://bit.ly/3offerDemo" },
  { label: "Ordinary", url: "https://www.demo-college.example/placements" },
];
function WebsiteScene() {
  const [url, setUrl] = useState(URLS[0]!.url);
  const r = useMemo(() => analyzeUrl(url), [url]);
  const signs = r.findings.filter((f) => f.severity !== "info");
  return (
    <section className="border-y border-line bg-surface py-28 sm:py-36">
      <Container wide>
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[0.8fr_1.2fr]">
          <Reveal>
            <Eyebrow n="05">Website verification</Eyebrow>
            <h2 className="t-h2 mt-5">A padlock is not a promise.</h2>
            <p className="t-body-lg mt-5 text-ink-2">
              CUSTODI reads a link without opening it, shows who really owns it, and keeps “is it encrypted?” apart from “is it genuine?”. It only says <b>Verified</b>{" "}
              for domains on your own trusted list — never a guess.
            </p>
            <div className="mt-8 flex flex-wrap gap-1.5" role="group" aria-label="Fictional links">
              {URLS.map((u) => (
                <button
                  key={u.url}
                  aria-pressed={url === u.url}
                  onClick={() => setUrl(u.url)}
                  className={`rounded-full border min-h-10 px-3 py-1.5 text-xs sm:min-h-0 transition-colors ${url === u.url ? "border-ink bg-ink text-bg" : "border-line text-ink-2 hover:border-ink"}`}
                >
                  {u.label}
                </button>
              ))}
            </div>
            <ButtonLink to="/website" variant="secondary" className="mt-6">
              Check your own link <ArrowRight className="h-4 w-4" />
            </ButtonLink>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="space-y-3">
              <Anatomy r={r} />
              <ConnectionAndTrust r={r} />
              <div className="panel p-5">
                <div className="flex items-center gap-2">
                  <RiskBadge level={r.riskLevel} />
                  <span className="text-sm text-muted">
                    {signs.length} warning sign{signs.length === 1 ? "" : "s"}
                  </span>
                </div>
                <ul className="mt-3 space-y-1.5 text-sm text-ink-2">
                  {signs.map((f) => (
                    <li key={f.id}>
                      <span className={f.severity === "strong" ? "text-high" : "text-medium"}>●</span> {f.title}
                    </li>
                  ))}
                  {r.status === "unknown" && <li>No tricks found. CUSTODI still can't confirm the owner — so it says Unknown, not Safe.</li>}
                </ul>
              </div>
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}

/* ================================================================ SCENE 5 — extension & Live Observe */
function ExtensionScene() {
  const reduce = useReducedMotion();
  const [secs, setSecs] = useState(30 * 60);
  const [ref, inView] = useInView<HTMLDivElement>("0px");
  useEffect(() => {
    if (reduce || !inView) return;
    const id = setInterval(() => setSecs((s) => (s <= 1 ? 30 * 60 : s - 1)), 1000);
    return () => clearInterval(id);
  }, [reduce, inView]);
  const mm = `${String(Math.floor(secs / 60)).padStart(2, "0")}:${String(secs % 60).padStart(2, "0")}`;
  return (
    <section className="py-28 sm:py-36">
      <Container wide>
        <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-[1.1fr_0.9fr]">
          <Reveal>
            <div ref={ref} className="panel overflow-hidden shadow-card">
              <div className="flex items-center gap-2 border-b border-line bg-surface-2 px-4 py-2.5">
                <span className="flex gap-1.5">
                  <i className="h-2.5 w-2.5 rounded-full bg-line-strong" />
                  <i className="h-2.5 w-2.5 rounded-full bg-line-strong" />
                  <i className="h-2.5 w-2.5 rounded-full bg-line-strong" />
                </span>
                <span className="ml-3 flex-1 truncate rounded-md bg-surface px-3 py-1 font-mono text-[11px] text-muted">intern-confirm-demo.example/verify</span>
                <span className="relative">
                  <Emblem className="h-6 w-6" />
                  <span className="absolute -top-1.5 -right-2 rounded bg-high px-1 font-mono text-[10px] font-bold text-white">!</span>
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_15rem]">
                <div className="space-y-3 p-6">
                  <div className="h-3 w-2/3 rounded bg-surface-2" />
                  <div className="h-3 w-full rounded bg-surface-2" />
                  <div className="h-3 w-5/6 rounded bg-surface-2" />
                  <div className="mt-6 rounded-xl border border-line p-4">
                    <p className="text-xs text-muted">Enter the OTP sent to your phone to confirm joining</p>
                    <div className="mt-2 h-9 rounded-lg border border-high/50 bg-high-soft" />
                  </div>
                </div>
                <div className="border-t border-line bg-bg p-4 sm:border-t-0 sm:border-l">
                  <p className="flex items-center gap-1.5 font-mono text-[11px] font-semibold tracking-widest text-lime uppercase">
                    <span className="animate-live h-2 w-2 rounded-full bg-lime" /> Live Observe on
                  </p>
                  <p className="mt-1 font-display text-5xl tabular-nums">{mm}</p>
                  <div className="mt-3 rounded-lg bg-high-soft p-2.5 text-xs">
                    <p className="font-semibold text-high">High risk · this page</p>
                    <p className="mt-1 text-ink-2">Job page asks for an OTP</p>
                    <p className="mt-1 font-medium text-accent">→ Don't type any code here.</p>
                  </div>
                  <div className="mt-3 h-8 rounded-lg border border-high/40 text-center text-xs leading-8 font-semibold text-high">Stop now</div>
                </div>
              </div>
              <p className="border-t border-line px-4 py-2 text-center text-[11px] text-muted">Illustration of the extension popup — not a live session</p>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <Eyebrow n="06">Chrome extension</Eyebrow>
            <h2 className="t-h2 mt-5">Live Observe: on when you say, off when you say.</h2>
            <p className="t-body-lg mt-5 text-ink-2">
              Choose 15, 30 or 60 minutes. While the timer runs, CUSTODI checks the tab you're viewing and badges risky pages. Stop it any time — then read the session
              summary.
            </p>
            <ul className="mt-6 space-y-2 text-sm text-ink-2">
              <li className="flex gap-2">
                <CheckCircle2 className="h-4 w-4 flex-none text-low" /> Current Chrome tab only, visible timer, one-click stop
              </li>
              <li className="flex gap-2">
                <CircleSlash className="h-4 w-4 flex-none text-high" /> No secret monitoring. Can't see WhatsApp, SMS or other apps.
              </li>
            </ul>
            <div className="mt-8 flex flex-wrap gap-2">
              <ButtonLink to="/extension">Install the extension</ButtonLink>
              <ButtonLink to="/live" variant="secondary">
                How Live Observe works
              </ButtonLink>
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}

/* ================================================================ SCENE 6 — dashboard & test lab */
/* ================================================================ HOW IT DECIDES (real engine data) */
function Indicators() {
  const cats = DEFAULT_SCORING.categories;
  const max = Math.max(...cats.map((c) => c.points));
  const { medium, high } = DEFAULT_SCORING.thresholds;
  return (
    <section className="py-28 sm:py-36">
      <Container wide>
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[0.75fr_1.25fr]">
          <Reveal>
            <Eyebrow n="03">How CUSTODI decides</Eyebrow>
            <h2 className="t-h2 mt-5">No black box. Every point is accounted for.</h2>
            <p className="t-body-lg mt-5 text-ink-2">
              Each kind of warning adds a fixed number of points — counted once, however often it appears. Direct requests for an OTP, PIN or password, or for
              remote-access software, are critical and always High.
            </p>
            <div className="mt-10" aria-label={`Risk bands: Low below ${medium}, Medium ${medium} to ${high - 1}, High ${high} and above`}>
              <div className="flex h-2 overflow-hidden rounded-full">
                <span className="bg-low" style={{ width: `${medium}%` }} />
                <span className="bg-medium" style={{ width: `${high - medium}%` }} />
                <span className="flex-1 bg-high" />
              </div>
              <div className="mt-2 flex justify-between font-mono text-[11px] text-muted">
                <span>0 · Low</span>
                <span style={{ marginLeft: `${medium - 8}%` }}>{medium} · Medium</span>
                <span>{high}–100 · High</span>
              </div>
            </div>
            <p className="mt-6 text-xs text-muted">Hand-set weights, calibrated on fictional test cases. Not a probability of fraud.</p>
          </Reveal>
          <Reveal delay={0.1}>
            <ol className="border-t border-line">
              {cats.map((c, i) => (
                <li key={c.id} className="grid grid-cols-[2rem_1fr_3.5rem] items-center gap-3 border-b border-line py-3 sm:grid-cols-[2rem_1fr_10rem_3.5rem]">
                  <span className="font-mono text-[11px] text-muted">{String(i + 1).padStart(2, "0")}</span>
                  <span className="text-sm text-ink">{c.label}</span>
                  <span className="hidden h-1 rounded-full bg-surface-2 sm:block">
                    <span className={`block h-full rounded-full ${c.points >= 30 ? "bg-high" : c.points >= 15 ? "bg-medium" : "bg-accent"}`} style={{ width: `${(c.points / max) * 100}%` }} />
                  </span>
                  <span className="text-right font-mono text-sm text-ink">+{c.points}</span>
                </li>
              ))}
            </ol>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}

/* ================================================================ PRIVACY & LIMITS */
function Limits() {
  return (
    <section className="border-t border-line py-28 sm:py-36">
      <Container wide>
        <Reveal>
          <Eyebrow n="08">Privacy & limitations</Eyebrow>
          <h2 className="t-h2 mt-5 max-w-3xl">What CUSTODI does — and what it will never pretend to do.</h2>
        </Reveal>
        <div className="mt-12 grid grid-cols-1 gap-x-16 gap-y-10 md:grid-cols-2">
          {[
            {
              h: "It does",
              tone: "text-low",
              items: [
                "Analyse messages and links entirely on your device — nothing is uploaded",
                "Quote the exact words behind every warning and the points they add",
                "Check the Chrome tab you choose, only on click or during a timed Live Observe session",
                "Keep results (not full messages, by default) in this browser, with export and delete",
              ],
            },
            {
              h: "It cannot",
              tone: "text-high",
              items: [
                "Read your WhatsApp, SMS or email inbox — you paste or share messages yourself",
                "Verify who owns a domain or phone number, unless you add it to your trusted list",
                "See phone calls, images, attachments or voice notes",
                "Guarantee a message is safe — Low risk means no obvious indicators, nothing more",
              ],
            },
          ].map((col) => (
            <Reveal key={col.h}>
              <h3 className={`font-mono text-xs tracking-[0.18em] uppercase ${col.tone}`}>{col.h}</h3>
              <ul className="mt-4 border-t border-line">
                {col.items.map((t) => (
                  <li key={t} className="border-b border-line py-4 text-[0.95rem] leading-relaxed text-ink-2">
                    {t}
                  </li>
                ))}
              </ul>
            </Reveal>
          ))}
        </div>
        <Link to="/help#limits" className="mt-8 inline-block py-2 text-sm text-accent underline underline-offset-4">
          Read the full limitations
        </Link>
      </Container>
    </section>
  );
}

function ProofScene() {
  const suite = useMemo(() => runTestSuite(), []); // real run of every Test Lab case
  const history = useHistory();
  const m = suite.metrics;
  return (
    <section className="border-y border-line bg-surface py-28 sm:py-36">
      <Container wide>
        <Reveal>
          <Eyebrow n="07">Dashboard & Test Lab</Eyebrow>
          <h2 className="t-h2 mt-5 max-w-3xl">Your history in one place. Our homework in the open.</h2>
        </Reveal>
        <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Reveal>
            <div className="h-full rounded-[var(--radius-card)] border border-line bg-bg p-6">
              <p className="t-eyebrow text-muted">Test Lab · just ran in your browser</p>
              <p className="mt-4 font-display text-7xl leading-none">
                {m.passed}
                <span className="text-3xl text-muted">/{m.total}</span>
              </p>
              <p className="mt-2 text-ink-2">fictional cases passed — scams, genuine college and job messages, links and pages.</p>
              <dl className="mt-6 grid grid-cols-3 gap-4 border-t border-line pt-5 text-sm">
                <div>
                  <dt className="text-muted">False positives</dt>
                  <dd className="font-mono text-xl">{m.falsePositives}</dd>
                </div>
                <div>
                  <dt className="text-muted">False negatives</dt>
                  <dd className="font-mono text-xl">{m.falseNegatives}</dd>
                </div>
                <div>
                  <dt className="text-muted">Time</dt>
                  <dd className="font-mono text-xl">{m.durationMs.toFixed(0)} ms</dd>
                </div>
              </dl>
              <p className="mt-4 text-xs text-muted">Our own test cases, not a real-world accuracy claim. The failure is shown and explained.</p>
              <ButtonLink to="/lab" variant="secondary" className="mt-6">
                Run the tests yourself <ArrowRight className="h-4 w-4" />
              </ButtonLink>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="h-full rounded-[var(--radius-card)] border border-line bg-bg p-6">
              <p className="t-eyebrow text-muted">Your dashboard</p>
              {history.length ? (
                <>
                  <p className="mt-4 font-display text-7xl leading-none">{history.length}</p>
                  <p className="mt-2 text-ink-2">scans on this device so far.</p>
                  <div className="mt-6 flex h-3 overflow-hidden rounded-full bg-surface-2">
                    {(["high", "medium", "low"] as const).map((l) => {
                      const n = history.filter((h) => h.report.riskLevel === l).length;
                      return n ? <div key={l} className={`h-full ${l === "high" ? "bg-high" : l === "medium" ? "bg-medium" : "bg-low"}`} style={{ width: `${(n / history.length) * 100}%` }} /> : null;
                    })}
                  </div>
                </>
              ) : (
                <>
                  <p className="mt-4 font-display text-4xl leading-tight">Empty — for now.</p>
                  <p className="mt-2 text-ink-2">Every scan you run lands here with its full report: risk trend, threat categories, evidence and exports. Nothing is invented.</p>
                </>
              )}
              <ul className="mt-6 grid grid-cols-2 gap-2 text-sm text-ink-2">
                {["Risk trend", "Threat categories", "Full reports", "CSV / JSON export"].map((t) => (
                  <li key={t} className="border-t border-line pt-2">
                    {t}
                  </li>
                ))}
              </ul>
              <ButtonLink to="/dashboard" variant="secondary" className="mt-6">
                Open dashboard <ArrowRight className="h-4 w-4" />
              </ButtonLink>
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}

/* ================================================================ FINAL */
function Finale() {
  return (
    <section className="py-32 sm:py-44">
      <Container className="text-center">
        <Reveal>
          <Emblem className="mx-auto h-20 w-20" />
          <p className="t-display mt-8">Think before you trust.</p>
          <p className="t-display text-muted italic">Verify before you act.</p>
          <div className="mt-12 flex flex-wrap justify-center gap-3">
            <ButtonLink to="/scan" size="lg">
              <ScanLine className="h-5 w-5" /> Scan a message
            </ButtonLink>
            <ButtonLink to="/help" variant="secondary" size="lg">
              How CUSTODI works
            </ButtonLink>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}

export default function Home() {
  return (
    <>
      <Hero />
      <Threats />
      <EmailScene />
      <Indicators />
      <TryScanner />
      <WebsiteScene />
      <ExtensionScene />
      <ProofScene />
      <Limits />
      <Finale />
    </>
  );
}
