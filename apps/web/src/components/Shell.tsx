import { AnimatePresence, motion } from "framer-motion";
import { Globe, LayoutGrid, Menu, MessageSquareText, Monitor, Moon, Settings as Cog, Sun, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router";
import { setTheme, useThemePref, type ThemePref } from "../lib/theme";
import { Wordmark } from "../ui/Art";
import { ButtonLink } from "../ui/Button";

export const NAV = [
  { to: "/", label: "Home", end: true },
  { to: "/scan", label: "Scan" },
  { to: "/website", label: "Website Check" },
  { to: "/live", label: "Live Observe" },
  { to: "/dashboard", label: "Dashboard" },
  { to: "/lab", label: "Test Lab" },
  { to: "/help", label: "How It Works" },
  { to: "/settings", label: "Settings" },
];

export function ThemeSwitch({ compact = false }: { compact?: boolean }) {
  const pref = useThemePref();
  const opts: { v: ThemePref; label: string; Icon: typeof Sun }[] = [
    { v: "light", label: "Light", Icon: Sun },
    { v: "dark", label: "Dark", Icon: Moon },
    { v: "system", label: "System", Icon: Monitor },
  ];
  return (
    <div role="radiogroup" aria-label="Colour theme" className="inline-flex rounded-full border border-line bg-surface-2 p-0.5">
      {opts.map(({ v, label, Icon }) => (
        <button
          key={v}
          type="button"
          role="radio"
          aria-checked={pref === v}
          aria-label={`${label} theme`}
          title={`${label} theme`}
          onClick={() => setTheme(v)}
          className={`inline-flex items-center gap-1.5 rounded-full text-xs font-medium transition-colors ${compact ? "h-9 w-9 justify-center" : "min-h-10 px-3 py-1.5"} ${
            pref === v ? "bg-surface text-ink shadow-card" : "text-muted hover:text-ink"
          }`}
        >
          <Icon className="h-3.5 w-3.5" />
          {!compact && label}
        </button>
      ))}
    </div>
  );
}

/** Single-button theme cycle for the desktop header (Light → Dark → System). Full switch lives in Settings. */
function ThemeToggle() {
  const pref = useThemePref();
  const next: Record<ThemePref, ThemePref> = { light: "dark", dark: "system", system: "light" };
  const Icon = pref === "light" ? Sun : pref === "dark" ? Moon : Monitor;
  return (
    <button
      type="button"
      onClick={() => setTheme(next[pref])}
      aria-label={`Theme: ${pref}. Switch to ${next[pref]}`}
      title={`Theme: ${pref} (click for ${next[pref]})`}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-surface-2 hover:text-ink"
    >
      <Icon className="h-4.5 w-4.5" />
    </button>
  );
}

function TopNav({ onMenu, open }: { onMenu: () => void; open: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  const links = NAV.filter((n) => n.to !== "/" && n.to !== "/settings");
  return (
    <header className={`sticky top-0 z-40 transition-colors ${scrolled || open ? "border-b border-line bg-bg/85 backdrop-blur-md" : "border-b border-transparent"}`}>
      <nav aria-label="Main" className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:px-6 lg:px-8">
        <Link to="/" aria-label="CUSTODI home" className="shrink-0">
          <Wordmark />
        </Link>
        <ul className="hidden min-w-0 flex-1 items-center gap-0.5 xl:flex">
          {links.map((l) => (
            <li key={l.to} className="shrink-0">
              <NavLink
                to={l.to}
                className={({ isActive }) =>
                  `relative block rounded-full px-3 py-2 text-sm whitespace-nowrap transition-colors ${isActive ? "text-ink" : "text-muted hover:text-ink"}`
                }
              >
                {({ isActive }) => (
                  <>
                    {l.label}
                    {isActive && <motion.span layoutId="nav-underline" className="absolute inset-x-3 -bottom-[1px] h-0.5 rounded-full bg-accent" />}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
        <div className="ml-auto flex items-center gap-2">
          <div className="hidden xl:block">
            <ThemeToggle />
          </div>
          <NavLink
            to="/settings"
            aria-label="Settings"
            className={({ isActive }) => `hidden h-9 w-9 items-center justify-center rounded-full xl:inline-flex ${isActive ? "bg-surface-2 text-ink" : "text-muted hover:text-ink"}`}
          >
            <Cog className="h-4.5 w-4.5" />
          </NavLink>
          <ButtonLink to="/extension" variant="secondary" size="sm" className="max-sm:hidden">
            Install extension
          </ButtonLink>
          <ButtonLink to="/scan" size="sm" className="max-md:hidden">
            Scan a message
          </ButtonLink>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-ink hover:bg-surface-2 xl:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={onMenu}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>
    </header>
  );
}

function MenuSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-x-0 top-16 bottom-0 z-40 overflow-y-auto border-t border-line bg-bg xl:hidden"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          <ul className="mx-auto max-w-xl px-4 py-4">
            {NAV.map((n, i) => (
              <li key={n.to}>
                <NavLink
                  to={n.to}
                  end={n.end}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-baseline gap-4 border-b border-line py-4 font-display text-3xl ${isActive ? "text-accent" : "text-ink"}`
                  }
                >
                  <span className="font-mono text-xs text-muted">0{i + 1}</span>
                  {n.label}
                </NavLink>
              </li>
            ))}
            <li className="mt-6 flex flex-col gap-3">
              <p className="t-eyebrow text-muted">Theme</p>
              <ThemeSwitch />
              <ButtonLink to="/extension" variant="secondary" onClick={onClose} className="mt-3">
                Install the Chrome extension
              </ButtonLink>
            </li>
          </ul>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Thumb-friendly bottom bar on phones (and in the installed PWA). */
function TabBar({ onMore }: { onMore: () => void }) {
  const items = [
    { to: "/scan", label: "Scan", Icon: MessageSquareText },
    { to: "/website", label: "Website", Icon: Globe },
    { to: "/dashboard", label: "Dashboard", Icon: LayoutGrid },
  ];
  return (
    <nav aria-label="Quick" className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg/95 backdrop-blur md:hidden">
      <ul className="grid grid-cols-4">
        {items.map(({ to, label, Icon }) => (
          <li key={to}>
            <NavLink to={to} className={({ isActive }) => `flex min-h-14 flex-col items-center justify-center gap-1 text-[11px] font-medium ${isActive ? "text-accent" : "text-muted"}`}>
              <Icon className="h-5 w-5" />
              {label}
            </NavLink>
          </li>
        ))}
        <li>
          <button type="button" onClick={onMore} className="flex min-h-14 w-full flex-col items-center justify-center gap-1 text-[11px] font-medium text-muted">
            <Menu className="h-5 w-5" />
            More
          </button>
        </li>
      </ul>
    </nav>
  );
}

export function Footer({ onReplayIntro }: { onReplayIntro: () => void }) {
  return (
    <footer className="mt-28 border-t border-line pb-24 md:pb-0">
      <div className="mx-auto grid grid-cols-1 max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.5fr_1fr_1fr_1fr] lg:px-8">
        <div>
          <Wordmark />
          <p className="mt-4 font-display text-2xl leading-tight text-ink">
            Think before you trust.
            <br />
            <span className="text-muted">Verify before you act.</span>
          </p>
          <p className="mt-4 max-w-sm text-xs leading-relaxed text-muted">
            CUSTODI gives automated warning signs for safety education. It cannot guarantee that a message or website is genuine or fraudulent. Verify
            important opportunities through your placement cell.
          </p>
        </div>
        {[
          { h: "Product", l: [["/scan", "Message scan"], ["/website", "Website check"], ["/live", "Live Observe"], ["/dashboard", "Dashboard"]] },
          { h: "Learn", l: [["/help", "How it works"], ["/extension", "Chrome extension"], ["/lab", "Test Lab"], ["/help#limits", "What CUSTODI can't detect"]] },
          { h: "Trust", l: [["/help#privacy", "Privacy"], ["/college-demo", "College demo (fictional)"], ["/settings", "Settings"]] },
        ].map((col) => (
          <div key={col.h}>
            <p className="t-eyebrow text-muted">{col.h}</p>
            <ul className="mt-3 space-y-2 text-sm">
              {col.l.map(([to, label]) => (
                <li key={to}>
                  <Link to={to!} className="text-ink-2 hover:text-accent">
                    {label}
                  </Link>
                </li>
              ))}
              {col.h === "Trust" && (
                <li>
                  <button type="button" onClick={onReplayIntro} className="text-ink-2 hover:text-accent">
                    Replay intro
                  </button>
                </li>
              )}
            </ul>
          </div>
        ))}
      </div>
      <p className="border-t border-line px-4 py-5 text-center font-mono text-[11px] text-muted">
        CUSTODI prototype · runs on your device · every sample and demo figure is fictional
      </p>
    </footer>
  );
}

export function Shell({ children, onReplayIntro }: { children: React.ReactNode; onReplayIntro: () => void }) {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
  }, [open]);
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[70] focus:rounded-lg focus:bg-ink focus:px-3 focus:py-2 focus:text-bg">
        Skip to content
      </a>
      <TopNav open={open} onMenu={() => setOpen((o) => !o)} />
      <MenuSheet open={open} onClose={() => setOpen(false)} />
      {children}
      <Footer onReplayIntro={onReplayIntro} />
      <TabBar onMore={() => setOpen(true)} />
    </>
  );
}
