import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost";
type Size = "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-xl font-semibold whitespace-nowrap transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60 select-none";

const variants: Record<Variant, string> = {
  primary:
    "bg-ink text-white shadow-[0_1px_0_rgb(255_255_255/0.12)_inset,0_8px_20px_-8px_rgb(11_19_36/0.5)] hover:bg-[#18223a] active:translate-y-px",
  secondary: "bg-surface text-ink border border-line-strong hover:border-brand-200 hover:bg-brand-50/60 active:translate-y-px",
  ghost: "text-ink-soft hover:text-ink hover:bg-ink/5",
};

const sizes: Record<Size, string> = {
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-[15px]",
};

interface CommonProps {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
  className?: string;
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...rest
}: CommonProps & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={cn(base, variants[variant], sizes[size], className)} {...rest}>
      {children}
    </button>
  );
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  children,
  ...rest
}: CommonProps & AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a className={cn(base, variants[variant], sizes[size], className)} {...rest}>
      {children}
    </a>
  );
}
