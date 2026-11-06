/**
 * Custom line illustrations for CUSTODI. Drawn with currentColor + design tokens so they work in both themes.
 */

export const EMBLEM_SRC = "/assets/custodi-emblem.png";
/** Natural aspect ratio of the official emblem (width / height). */
export const EMBLEM_RATIO = 262 / 334;

/**
 * The official CUSTODI emblem (supplied artwork, background removed — never redrawn).
 * Always rendered inside a box with object-fit: contain, so it keeps its natural proportions.
 */
/** Lanczos upscales (scripts/render-intro.swift upscale) so large renders stay crisp. */
export const EMBLEM_SRCSET = `${EMBLEM_SRC} 262w, /assets/custodi-emblem@2x.png 524w, /assets/custodi-emblem@3x.png 786w`;

export function Emblem({
  className = "h-7 w-7",
  sheen = false,
  alt = "",
  sizes = "48px",
}: {
  className?: string;
  sheen?: boolean;
  alt?: string;
  /** Rendered width hint so the browser picks the right resolution. */
  sizes?: string;
}) {
  return (
    <span className={`relative inline-block shrink-0 ${className}`}>
      <img src={EMBLEM_SRC} srcSet={EMBLEM_SRCSET} sizes={sizes} alt={alt} className="emblem-img h-full w-full object-contain" draggable={false} decoding="async" />
      {sheen && <span className="emblem-sheen" aria-hidden />}
    </span>
  );
}

/** Kept for existing call sites. */
export const Monogram = ({ className }: { className?: string; tone?: string }) => <Emblem className={className} />;

export function Wordmark({ size = "md" }: { size?: "md" | "lg" }) {
  return (
    <span className="flex items-center gap-2.5">
      <Emblem className={size === "lg" ? "h-11 w-11" : "h-8 w-8"} />
      <span className={`wordmark ${size === "lg" ? "text-3xl" : "text-[1.05rem]"}`}>CUSTODI</span>
    </span>
  );
}

/** Empty inbox with a magnifier — "nothing scanned yet". */
export function ArtEmptyScans() {
  return (
    <svg viewBox="0 0 200 140" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="22" y="34" width="120" height="84" rx="10" fill="var(--surface)" />
      <path d="M22 50h120" />
      <circle cx="32" cy="42" r="2" />
      <circle cx="40" cy="42" r="2" />
      <path d="M36 66h56M36 78h80M36 90h44" stroke="var(--line-strong)" strokeWidth="5" />
      <circle cx="140" cy="88" r="24" fill="var(--bg)" stroke="var(--accent)" strokeWidth="2" />
      <path d="m157 105 18 18" stroke="var(--accent)" strokeWidth="5" />
      <path d="m130 88 7 7 13-14" stroke="var(--lime)" strokeWidth="2.6" />
      <path d="M58 14v10M70 18l-4 8M46 18l4 8" stroke="var(--line-strong)" />
    </svg>
  );
}

/** Message bubble with highlighted words — the scanner idle state. */
export function ArtMessage() {
  return (
    <svg viewBox="0 0 200 140" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M30 22h120a12 12 0 0 1 12 12v52a12 12 0 0 1-12 12H72l-22 18v-18H30a12 12 0 0 1-12-12V34a12 12 0 0 1 12-12z" fill="var(--surface)" />
      <rect x="32" y="40" width="40" height="9" rx="2" fill="var(--high-soft)" stroke="none" />
      <path d="M32 49h40" stroke="var(--high)" strokeWidth="2" />
      <path d="M80 44h62M32 62h50" stroke="var(--line-strong)" strokeWidth="5" />
      <rect x="90" y="57" width="34" height="9" rx="2" fill="var(--medium-soft)" stroke="none" />
      <path d="M90 66h34" stroke="var(--medium)" strokeWidth="2" />
      <path d="M32 78h96" stroke="var(--line-strong)" strokeWidth="5" />
      <path d="M176 30v28c0 14-9 22-20 28-11-6-20-14-20-28V30l20-7z" fill="var(--accent-soft)" stroke="var(--accent)" strokeWidth="2" />
      <path d="m148 52 6 6 11-12" stroke="var(--accent)" strokeWidth="2.4" />
    </svg>
  );
}

/** Address bar split into parts — the website check idle state. */
export function ArtLink() {
  return (
    <svg viewBox="0 0 200 140" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="14" y="44" width="172" height="34" rx="17" fill="var(--surface)" />
      <path d="M32 56v10m-4-6h8" stroke="var(--muted)" />
      <rect x="46" y="55" width="26" height="12" rx="3" fill="var(--surface-2)" stroke="none" />
      <rect x="76" y="55" width="54" height="12" rx="3" fill="var(--accent-soft)" stroke="var(--accent)" />
      <rect x="134" y="55" width="36" height="12" rx="3" fill="var(--surface-2)" stroke="none" />
      <path d="M103 78v20M103 98h-40M103 98h40" stroke="var(--accent)" strokeDasharray="3 4" />
      <rect x="40" y="100" width="46" height="18" rx="4" fill="var(--bg)" />
      <rect x="120" y="100" width="46" height="18" rx="4" fill="var(--bg)" />
      <path d="M48 109h30M128 109h30" stroke="var(--line-strong)" strokeWidth="4" />
      <path d="M70 20h60M84 30h32" stroke="var(--line-strong)" strokeWidth="4" />
    </svg>
  );
}

/** Browser window with ON badge — Live Observe. */
export function ArtLive() {
  return (
    <svg viewBox="0 0 200 140" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="16" y="22" width="168" height="100" rx="10" fill="var(--surface)" />
      <path d="M16 42h168" />
      <rect x="40" y="28" width="100" height="9" rx="4.5" fill="var(--surface-2)" stroke="none" />
      <rect x="150" y="27" width="26" height="11" rx="5.5" fill="var(--lime-bright)" stroke="none" />
      <text x="163" y="35.5" textAnchor="middle" fontSize="7" fontFamily="monospace" fontWeight="700" fill="#17200a" stroke="none">ON</text>
      <path d="M34 60h70M34 72h104M34 84h56" stroke="var(--line-strong)" strokeWidth="5" />
      <circle cx="148" cy="88" r="20" fill="var(--bg)" stroke="var(--accent)" strokeWidth="2" />
      <path d="M148 76v12l8 5" stroke="var(--accent)" strokeWidth="2.2" />
    </svg>
  );
}

/** Test tubes with pass/fail marks — Test Lab. */
export function ArtLab() {
  return (
    <svg viewBox="0 0 200 140" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {[40, 80, 120, 160].map((x, i) => (
        <g key={x}>
          <path d={`M${x - 10} 24v68a10 10 0 0 0 20 0V24`} fill="var(--surface)" />
          <path d={`M${x - 14} 24h28`} />
          <path d={`M${x - 10} ${70 - i * 8}h20v22a10 10 0 0 1-20 0z`} fill={i === 2 ? "var(--high-soft)" : "var(--low-soft)"} stroke="none" />
          {i === 2 ? (
            <path d={`m${x - 5} 112 10 10m0-10-10 10`} stroke="var(--high)" strokeWidth="2.2" />
          ) : (
            <path d={`m${x - 6} 117 4 4 8-9`} stroke="var(--low)" strokeWidth="2.2" />
          )}
        </g>
      ))}
    </svg>
  );
}
