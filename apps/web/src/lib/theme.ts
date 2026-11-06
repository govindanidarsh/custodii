import { useSyncExternalStore } from "react";

export type ThemePref = "light" | "dark" | "system";
const KEY = "custodi.theme";
const listeners = new Set<() => void>();

function readPref(): ThemePref {
  try {
    const v = localStorage.getItem(KEY) ?? localStorage.getItem("shield.theme");
    return v === "light" || v === "dark" || v === "system" ? v : "system";
  } catch {
    return "system";
  }
}

let pref: ThemePref = typeof window === "undefined" ? "system" : readPref();
const mq = typeof window !== "undefined" ? window.matchMedia("(prefers-color-scheme: dark)") : null;

export function resolvedTheme(p: ThemePref = pref): "light" | "dark" {
  if (p === "system") return mq?.matches ? "dark" : "light";
  return p;
}

function apply() {
  const dark = resolvedTheme() === "dark";
  document.documentElement.classList.toggle("dark", dark);
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", dark ? "#0a0e1a" : "#f6f3ec");
  listeners.forEach((l) => l());
}

export function setTheme(p: ThemePref) {
  pref = p;
  try {
    localStorage.setItem(KEY, p);
  } catch {
    /* ignore */
  }
  apply();
}

mq?.addEventListener("change", () => pref === "system" && apply());

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
export const useThemePref = () => useSyncExternalStore(subscribe, () => pref, () => pref);
export const useResolvedTheme = () => useSyncExternalStore(subscribe, () => resolvedTheme(), () => "light" as const);
