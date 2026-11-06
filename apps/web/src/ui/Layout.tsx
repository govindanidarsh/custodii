import { motion, useReducedMotion } from "framer-motion";

export function Container({ children, className = "", wide = false }: { children: React.ReactNode; className?: string; wide?: boolean }) {
  return <div className={`mx-auto w-full ${wide ? "max-w-7xl" : "max-w-6xl"} px-4 sm:px-6 lg:px-8 ${className}`}>{children}</div>;
}

/** Page title block used on every app page. One heading level, no decorative icon. */
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <header className="flex flex-col gap-5 border-b border-line pb-8 md:flex-row md:items-end md:justify-between">
      <div className="max-w-2xl">
        <p className="t-eyebrow text-accent">{eyebrow}</p>
        <h1 className="t-h1 mt-3 text-ink">{title}</h1>
        {description && <p className="t-body-lg mt-3 text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}

export function SectionTitle({ title, action, hint }: { title: string; action?: React.ReactNode; hint?: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3">
      <div>
        <h2 className="t-h3 text-ink">{title}</h2>
        {hint && <p className="mt-0.5 text-sm text-muted">{hint}</p>}
      </div>
      {action}
    </div>
  );
}

export function Reveal({ children, delay = 0, className, y = 24 }: { children: React.ReactNode; delay?: number; className?: string; y?: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function EmptyState({ art, title, children, actions }: { art: React.ReactNode; title: string; children: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <div className="mb-6 w-44 text-ink">{art}</div>
      <h3 className="t-h3">{title}</h3>
      <div className="mt-2 max-w-md text-sm leading-relaxed text-muted">{children}</div>
      {actions && <div className="mt-6 flex flex-wrap justify-center gap-2">{actions}</div>}
    </div>
  );
}
