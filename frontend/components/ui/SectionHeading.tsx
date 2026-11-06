import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface SectionHeadingProps {
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
  align?: "left" | "center";
  className?: string;
  id?: string;
}

export function SectionHeading({ eyebrow, title, description, align = "left", className, id }: SectionHeadingProps) {
  return (
    <div className={cn("max-w-2xl", align === "center" && "mx-auto text-center", className)}>
      <p className="mb-3 inline-flex items-center gap-2 text-[13px] font-semibold tracking-wide text-brand-600 uppercase">
        <span aria-hidden className="h-px w-5 bg-gradient-to-r from-brand-500 to-violet-500" />
        {eyebrow}
      </p>
      <h2 id={id} className="font-display text-3xl font-semibold tracking-tight text-ink text-balance sm:text-[2.5rem] sm:leading-[1.1]">
        {title}
      </h2>
      {description && <p className="mt-4 text-[17px] leading-relaxed text-muted text-pretty">{description}</p>}
    </div>
  );
}
