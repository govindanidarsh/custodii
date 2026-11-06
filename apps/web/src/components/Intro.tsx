/**
 * CUSTODI brand introduction (~9 s) built around the OFFICIAL emblem artwork (no video file exists;
 * this is live CSS/canvas/GSAP animation of the supplied image — the artwork itself is never redrawn).
 *  0.0–1.2  dark navy scene, drifting particles
 *  0.9–2.0  a controlled beam of light rises behind the centre
 *  1.6–3.8  the emblem emerges from darkness and its silver/blue details are revealed top → bottom
 *  3.6–4.6  a single light pass across the metal
 *  4.8–6.3  CUSTODI wordmark
 *  6.4–7.9  tagline
 *  8.3–9.2  dissolves into the homepage
 * Plays automatically on a first visit; Skip (button / Esc) anytime. A safety timer always finishes it,
 * so a failure can never leave a blank screen. prefers-reduced-motion → a still title card.
 */
import gsap from "gsap";
import { Component, useEffect, useLayoutEffect, useRef, useState } from "react";
import { EMBLEM_SRC, EMBLEM_SRCSET } from "../ui/Art";

export class IntroBoundary extends Component<{ onError: () => void; children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

/** Lightweight 2D particle field (no WebGL). Fewer particles on small screens. */
function Particles({ run }: { run: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const resize = () => {
      c.width = c.clientWidth * dpr;
      c.height = c.clientHeight * dpr;
    };
    resize();
    window.addEventListener("resize", resize);
    const n = window.innerWidth < 640 ? 40 : 90;
    const ps = Array.from({ length: n }, () => ({ x: Math.random(), y: Math.random(), r: Math.random() * 1.4 + 0.3, v: Math.random() * 0.00025 + 0.00008, a: Math.random() * 0.5 + 0.15 }));
    let raf = 0;
    const draw = () => {
      ctx.clearRect(0, 0, c.width, c.height);
      for (const p of ps) {
        if (run) {
          p.y -= p.v;
          if (p.y < -0.02) p.y = 1.02;
        }
        ctx.beginPath();
        ctx.fillStyle = `rgba(170, 196, 235, ${p.a})`;
        ctx.arc(p.x * c.width, p.y * c.height, p.r * dpr, 0, Math.PI * 2);
        ctx.fill();
      }
      if (run) raf = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [run]);
  return <canvas ref={ref} className="i-particles absolute inset-0 h-full w-full" aria-hidden />;
}

/** Code-based fallback animation (used if the MP4 can't load or autoplay is blocked). */
function IntroAnimation({ onDone, reduced }: { onDone: () => void; reduced: boolean }) {
  const root = useRef<HTMLDivElement>(null);
  const done = useRef(false);

  const finish = () => {
    if (done.current) return;
    done.current = true;
    onDone();
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && finish();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    const safety = setTimeout(finish, reduced ? 6000 : 11500);
    return () => {
      window.removeEventListener("keydown", onKey);
      clearTimeout(safety);
      document.body.style.overflow = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useLayoutEffect(() => {
    if (!root.current || reduced) return;
    const ctx = gsap.context(() => {
      const reveal = { p: -20 };
      const em = root.current!.querySelector<HTMLElement>(".i-emblem");
      const tl = gsap.timeline({ onComplete: finish });
      tl.fromTo(".i-particles", { opacity: 0 }, { opacity: 1, duration: 1.4 }, 0);
      tl.fromTo(".i-beam", { opacity: 0, scaleY: 0.4 }, { opacity: 1, scaleY: 1, duration: 1.4, ease: "power2.out" }, 0.9);
      // emblem emerges from darkness, details revealed top → bottom
      tl.fromTo(".i-emblem", { opacity: 0, scale: 0.92, filter: "brightness(0.15) blur(6px)" }, { opacity: 1, scale: 1, filter: "brightness(1) blur(0px)", duration: 2.2, ease: "power2.out" }, 1.6);
      tl.to(
        reveal,
        {
          p: 115,
          duration: 2.2,
          ease: "power1.inOut",
          onUpdate: () => {
            const m = `linear-gradient(180deg, #000 ${reveal.p}%, rgba(0,0,0,.25) ${reveal.p + 18}%)`;
            em?.style.setProperty("-webkit-mask-image", m);
            em?.style.setProperty("mask-image", m);
          },
        },
        1.6,
      );
      // Clear the reveal's filter/mask layers once done so no compositing box lingers around the emblem.
      tl.add(() => {
        em?.style.removeProperty("-webkit-mask-image");
        em?.style.removeProperty("mask-image");
        if (em) em.style.filter = "none";
      }, 3.85);
      tl.fromTo(".i-pass", { backgroundPosition: "130% 0" }, { backgroundPosition: "-30% 0", duration: 1.1, ease: "power2.inOut" }, 3.6);
      tl.to(".i-beam", { opacity: 0.45, duration: 1.2 }, 4.2);
      tl.to(".i-emblem-wrap", { y: "-2vh", scale: 0.94, duration: 1.2, ease: "power3.inOut" }, 4.5);
      // wordmark + tagline
      tl.fromTo(".i-word", { opacity: 0, letterSpacing: "0.85em", filter: "blur(10px)" }, { opacity: 1, letterSpacing: "0.3em", filter: "blur(0px)", duration: 1.5, ease: "power3.out" }, 4.8);
      tl.fromTo(".i-rule", { scaleX: 0 }, { scaleX: 1, duration: 0.9, ease: "power2.inOut" }, 5.8);
      tl.fromTo(".i-tag", { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.8, stagger: 0.35, ease: "power2.out" }, 6.4);
      // dissolve into the site
      tl.to(".i-stage", { opacity: 0, y: -20, duration: 0.8, ease: "power2.in" }, 8.3);
      tl.to(root.current, { opacity: 0, duration: 0.6 }, 8.6);
    }, root);
    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced]);

  const shown = reduced ? 1 : 0;
  return (
    <div
      ref={root}
      role="dialog"
      aria-modal="true"
      aria-label="CUSTODI introduction"
      className="fixed inset-0 z-[100] overflow-hidden bg-[radial-gradient(ellipse_at_50%_42%,#132646_0%,#0a1529_45%,#050a15_100%)] text-[#eef2f7]"
    >
      <Particles run={!reduced} />
      <div
        className="i-beam pointer-events-none absolute top-0 left-1/2 h-full w-[min(70vw,560px)] -translate-x-1/2 origin-bottom bg-[radial-gradient(ellipse_at_50%_45%,rgba(120,160,225,.22),transparent_62%)]"
        style={{ opacity: reduced ? 0.6 : 0 }}
      />

      <div className="i-stage relative flex h-full flex-col items-center justify-center px-6 text-center">
        <div className="i-emblem-wrap relative" style={{ height: "min(40svh, 72vw * 1.27, 340px)", aspectRatio: "262 / 334" }}>
          <div className="i-emblem relative h-full w-full" style={{ opacity: shown }}>
            <img src={EMBLEM_SRC} srcSet={EMBLEM_SRCSET} sizes="(min-width: 640px) 270px, 60vw" alt="CUSTODI emblem" className="h-full w-full object-contain" />
            <span
              className="i-pass pointer-events-none absolute inset-0"
              style={{
                background: "linear-gradient(105deg, transparent 38%, rgba(255,255,255,.6) 50%, transparent 62%)",
                backgroundSize: "260% 100%",
                backgroundPosition: "130% 0",
                WebkitMask: `url(${EMBLEM_SRC}) center / contain no-repeat`,
                mask: `url(${EMBLEM_SRC}) center / contain no-repeat`,
                mixBlendMode: "overlay",
              }}
            />
          </div>
        </div>
        <p className="i-word wordmark mt-[min(5svh,40px)] text-[clamp(2rem,9vw,4.2rem)]" style={{ paddingLeft: "0.3em", opacity: shown }}>
          CUSTODI
        </p>
        <span className="i-rule mt-5 block h-px w-20 origin-center bg-[#9fb4d4]/60" />
        <p className="i-tag mt-5 max-w-[22rem] font-display text-[clamp(1.15rem,4.6vw,1.6rem)] leading-snug text-white/90" style={{ opacity: shown }}>
          Think before you trust.
        </p>
        <p className="i-tag max-w-[22rem] font-display text-[clamp(1.15rem,4.6vw,1.6rem)] leading-snug text-white/55 italic" style={{ opacity: shown }}>
          Verify before you act.
        </p>
        {reduced && (
          <button onClick={finish} className="mt-8 min-h-11 rounded-full bg-[#5b8fd6] px-6 py-3 font-medium text-[#06101f]">
            Enter CUSTODI
          </button>
        )}
      </div>

      <button
        onClick={finish}
        className="absolute top-[max(1rem,env(safe-area-inset-top))] right-4 min-h-11 rounded-full border border-white/25 bg-black/20 px-4 text-sm text-white/85 backdrop-blur hover:bg-white/10 sm:top-auto sm:right-8 sm:bottom-8"
      >
        Skip intro <span className="ml-1 hidden font-mono text-xs text-white/45 sm:inline">Esc</span>
      </button>
    </div>
  );
}

/**
 * Real MP4 intro (apps/web/public/assets/custodi-intro-*.mp4, rendered by scripts/render-intro.swift + ffmpeg).
 * Muted, inline autoplay; portrait cut on tall screens. Falls back to the code animation if the file fails,
 * autoplay is refused or playback doesn't start within 4 s. Reduced motion → the still poster.
 */
export default function Intro({ onDone, reduced }: { onDone: () => void; reduced: boolean }) {
  const [fallback, setFallback] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const video = useRef<HTMLVideoElement>(null);
  const done = useRef(false);
  const portrait = typeof window !== "undefined" && window.innerHeight > window.innerWidth;
  const src = portrait ? "/assets/custodi-intro-portrait.mp4" : "/assets/custodi-intro-1080p.mp4";
  const poster = portrait ? "/assets/custodi-intro-poster-portrait.jpg" : "/assets/custodi-intro-poster.jpg";

  const finish = () => {
    if (done.current) return;
    done.current = true;
    setLeaving(true);
    setTimeout(onDone, 420); // short dissolve into the homepage
  };

  useEffect(() => {
    if (reduced || fallback) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && finish();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    const v = video.current;
    let started = false;
    const markStarted = () => (started = true);
    v?.addEventListener("playing", markStarted);
    if (v) {
      // React doesn't reliably reflect `muted` as an attribute; browsers only allow autoplay for muted media.
      v.muted = true;
      v.defaultMuted = true;
      v.setAttribute("muted", "");
      v.play().catch((err: unknown) => {
        if ((err as DOMException)?.name === "AbortError") return; // superseded by a newer play() (dev double-mount)
        console.warn("[CUSTODI intro] video autoplay refused, using animation:", (err as Error)?.name);
        setFallback(true);
      });
    }
    const stall = setTimeout(() => {
      if (!started) {
        console.warn("[CUSTODI intro] video did not start within 4 s, using animation");
        setFallback(true);
      }
    }, 4000);
    const safety = setTimeout(finish, 12000);
    return () => {
      window.removeEventListener("keydown", onKey);
      v?.removeEventListener("playing", markStarted);
      clearTimeout(stall);
      clearTimeout(safety);
      document.body.style.overflow = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced, fallback]);

  if (reduced || fallback) return <IntroAnimation onDone={onDone} reduced={reduced} />;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="CUSTODI introduction"
      className={`fixed inset-0 z-[100] bg-[#0a1222] transition-opacity duration-400 ${leaving ? "opacity-0" : "opacity-100"}`}
    >
      <video
        ref={video}
        className="h-full w-full object-cover"
        src={src}
        poster={poster}
        muted
        playsInline
        autoPlay
        preload="auto"
        disablePictureInPicture
        onEnded={finish}
        onError={() => {
          console.warn("[CUSTODI intro] video failed to load, using animation");
          setFallback(true);
        }}
        aria-label="CUSTODI brand introduction video"
      />
      <button
        onClick={finish}
        className="absolute top-[max(1rem,env(safe-area-inset-top))] right-4 min-h-11 rounded-full border border-white/25 bg-black/30 px-4 text-sm text-white/85 backdrop-blur hover:bg-white/10 sm:top-auto sm:right-8 sm:bottom-8"
      >
        Skip intro <span className="ml-1 hidden font-mono text-xs text-white/45 sm:inline">Esc</span>
      </button>
    </div>
  );
}
