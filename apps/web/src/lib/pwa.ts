import { useSyncExternalStore } from "react";

/** Captures Chrome's install prompt so Settings can offer a real "Install app" button when (and only when) it's available. */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

let deferred: BeforeInstallPromptEvent | null = null;
let installed = typeof window !== "undefined" && window.matchMedia?.("(display-mode: standalone)").matches;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferred = e as BeforeInstallPromptEvent;
    emit();
  });
  window.addEventListener("appinstalled", () => {
    installed = true;
    deferred = null;
    emit();
  });
}

export async function promptInstall(): Promise<boolean> {
  if (!deferred) return false;
  await deferred.prompt();
  const { outcome } = await deferred.userChoice;
  deferred = null;
  emit();
  return outcome === "accepted";
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
export const usePwa = () =>
  useSyncExternalStore(
    subscribe,
    () => (installed ? "installed" : deferred ? "available" : "unavailable"),
    () => "unavailable" as const,
  );

export const isIOS = () => /iPhone|iPad|iPod/.test(navigator.userAgent);
