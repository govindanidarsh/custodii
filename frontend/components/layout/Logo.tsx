import { cn } from "@/lib/cn";

/** TrustLayer mark: two offset layers with a check — "a layer of trust over a message". */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("h-8 w-8", className)} aria-hidden="true">
      <defs>
        <linearGradient id="tl-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#4f6bff" />
          <stop offset="1" stopColor="#7c5cff" />
        </linearGradient>
      </defs>
      <rect x="2" y="7" width="22" height="20" rx="6" fill="#e0e7ff" />
      <rect x="8" y="3" width="22" height="20" rx="6" fill="url(#tl-grad)" />
      <path d="M13.5 13.2l3.2 3.2 6-6.4" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className="font-display text-[17px] font-semibold tracking-tight text-ink">
        TrustLayer
        <span className="ml-1 rounded-md bg-ink px-1.5 py-0.5 align-[2px] text-[11px] font-bold tracking-wider text-white">AI</span>
      </span>
    </span>
  );
}
