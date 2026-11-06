import { forwardRef } from "react";

const control =
  "w-full rounded-xl border border-line bg-surface px-3.5 text-ink placeholder:text-muted/70 transition-colors focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/15";

export function Label({ htmlFor, children, hint }: { htmlFor?: string; children: React.ReactNode; hint?: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 flex items-baseline justify-between gap-2 text-sm font-medium text-ink">
      <span>{children}</span>
      {hint && <span className="text-xs font-normal text-muted">{hint}</span>}
    </label>
  );
}

export const TextArea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(function TextArea({ className = "", ...rest }, ref) {
  return <textarea ref={ref} className={`${control} resize-y py-3 text-[0.95rem] leading-relaxed ${className}`} {...rest} />;
});

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(function Input({ className = "", ...rest }, ref) {
  return <input ref={ref} className={`${control} h-11 ${className}`} {...rest} />;
});

export function Select({ className = "", children, ...rest }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={`${control} h-11 appearance-none bg-[length:12px] bg-[right_0.9rem_center] bg-no-repeat pr-9 ${className}`} style={{ backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 8'><path d='M1 1l5 5 5-5' stroke='%23888' stroke-width='1.6' fill='none'/></svg>\")" }} {...rest}>
      {children}
    </select>
  );
}

/** Accessible segmented control (radio group). */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
  size = "md",
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: React.ReactNode }[];
  label: string;
  size?: "sm" | "md";
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex flex-wrap gap-1 rounded-full border border-line bg-surface-2 p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={`rounded-full font-medium transition-colors ${size === "sm" ? "px-3 py-1 text-xs" : "px-4 py-1.5 text-sm"} ${
            value === o.value ? "bg-surface text-ink shadow-card" : "text-muted hover:text-ink"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
