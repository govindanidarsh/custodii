import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Info, TriangleAlert, X } from "lucide-react";
import { createContext, useCallback, useContext, useId, useState } from "react";

/* ---------------------------------------------------------------- Tooltip */
export function InfoTip({ children, label = "More information" }: { children: React.ReactNode; label?: string }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <span className="relative inline-flex align-middle" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        type="button"
        aria-label={label}
        aria-describedby={open ? id : undefined}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={() => setOpen((o) => !o)}
        className="-m-1.5 inline-flex h-8 w-8 items-center justify-center rounded-full text-muted hover:text-ink"
      >
        <Info className="h-3.5 w-3.5" />
      </button>
      {open && (
        <span
          role="tooltip"
          id={id}
          className="absolute bottom-full left-1/2 z-50 mb-2 w-64 -translate-x-1/2 rounded-xl bg-ink px-3 py-2 text-left text-xs font-normal normal-case leading-relaxed tracking-normal text-bg shadow-card"
        >
          {children}
        </span>
      )}
    </span>
  );
}

/* ---------------------------------------------------------------- Toasts */
type Tone = "success" | "info" | "warning";
interface Toast {
  id: number;
  text: string;
  tone: Tone;
}
const ToastCtx = createContext<(text: string, tone?: Tone) => void>(() => undefined);
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((text: string, tone: Tone = "success") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t.slice(-2), { id, text, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);
  const Icon = { success: CheckCircle2, info: Info, warning: TriangleAlert };
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-20 z-[60] flex flex-col items-center gap-2 px-4 md:bottom-6">
        <AnimatePresence>
          {toasts.map((t) => {
            const I = Icon[t.tone];
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8 }}
                className="pointer-events-auto flex items-center gap-2.5 rounded-full bg-ink py-2 pr-2 pl-4 text-sm text-bg shadow-card"
              >
                <I className={`h-4 w-4 ${t.tone === "warning" ? "text-medium" : t.tone === "success" ? "text-lime-bright" : ""}`} />
                {t.text}
                <button aria-label="Dismiss" onClick={() => setToasts((x) => x.filter((y) => y.id !== t.id))} className="rounded-full p-1 opacity-60 hover:opacity-100">
                  <X className="h-3.5 w-3.5" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  );
}

/* ---------------------------------------------------------------- Notice */
export function Notice({ tone = "info", title, children }: { tone?: "info" | "warning" | "danger" | "success"; title?: string; children: React.ReactNode }) {
  const cls = {
    info: "bg-accent-soft text-ink border-accent/20",
    warning: "bg-medium-soft text-ink border-medium/25",
    danger: "bg-high-soft text-ink border-high/25",
    success: "bg-low-soft text-ink border-low/25",
  }[tone];
  return (
    <div role={tone === "danger" ? "alert" : "note"} className={`rounded-2xl border px-4 py-3 text-sm leading-relaxed ${cls}`}>
      {title && <p className="mb-0.5 font-semibold">{title}</p>}
      {children}
    </div>
  );
}
