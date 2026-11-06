"use client";

import { useEffect, useState } from "react";
import { Logo } from "@/components/layout/Logo";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";

const LINKS = [
  { href: "#problem", label: "Why it matters" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#features", label: "Features" },
  { href: "#privacy", label: "Privacy" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-all duration-300",
        scrolled || open ? "border-b border-line bg-white/80 backdrop-blur-xl" : "border-b border-transparent",
      )}
    >
      <Container className="flex h-16 items-center justify-between">
        <a href="#top" aria-label="TrustLayer AI home">
          <Logo />
        </a>

        <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap text-ink-soft transition-colors hover:text-ink"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <span className="hidden sm:block">
            <ButtonLink href="#analyze" size="md">
              Check a message
            </ButtonLink>
          </span>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-ink lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            <Icon name={open ? "x" : "menu"} />
          </button>
        </div>
      </Container>

      {open && (
        <nav id="mobile-nav" aria-label="Mobile" className="border-t border-line bg-white lg:hidden">
          <Container className="flex flex-col py-3">
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-2 py-3 text-[15px] font-medium text-ink-soft hover:text-ink"
              >
                {l.label}
              </a>
            ))}
            <ButtonLink href="#analyze" onClick={() => setOpen(false)} className="mt-2 mb-1">
              Check a message
            </ButtonLink>
          </Container>
        </nav>
      )}
    </header>
  );
}
