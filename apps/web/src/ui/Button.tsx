import { forwardRef } from "react";
import { Link, type LinkProps } from "react-router";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "lime";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium transition-[background-color,color,border-color,transform,box-shadow] duration-150 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45";

const VARIANT: Record<Variant, string> = {
  primary: "bg-accent text-accent-ink hover:bg-accent-strong shadow-[0_1px_0_rgb(255_255_255/0.15)_inset]",
  secondary: "border border-line-strong bg-surface text-ink hover:border-ink/40",
  ghost: "text-ink-2 hover:bg-surface-2 hover:text-ink",
  danger: "border border-high/40 text-high hover:bg-high-soft",
  lime: "bg-lime-bright text-[#17200a] hover:brightness-95",
};
const SIZE: Record<Size, string> = {
  sm: "h-9 px-3.5 text-sm",
  md: "h-11 px-5 text-[0.95rem]",
  lg: "h-13 px-7 text-base",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", extra = "") {
  return `${base} ${VARIANT[variant]} ${SIZE[size]} ${extra}`;
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size };

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button({ variant = "primary", size = "md", className = "", type = "button", ...rest }, ref) {
  return <button ref={ref} type={type} className={buttonClass(variant, size, className)} {...rest} />;
});

export function ButtonLink({ variant = "primary", size = "md", className = "", ...rest }: LinkProps & { variant?: Variant; size?: Size }) {
  return <Link className={buttonClass(variant, size, className)} {...rest} />;
}
