import { useSyncExternalStore } from "react";

/**
 * Installation de BoutikBF sur le téléphone ou l'ordinateur (application web installable).
 * - Android / Chrome / Edge : le navigateur envoie « beforeinstallprompt », on le garde pour
 *   proposer un vrai bouton « Installer ».
 * - iPhone / iPad (Safari) : pas de bouton possible, on affiche les étapes à suivre.
 * Ce fichier est importé au démarrage de l'app (voir __root.tsx) : l'évènement n'est envoyé
 * qu'une fois, très tôt, il faut l'écouter dès le chargement.
 */

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export const INSTALLED_KEY = "boutikbf-installed";
const DISMISSED_KEY = "boutikbf-install-dismissed";
const DISMISS_DAYS = 14;

let deferred: InstallPromptEvent | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferred = e as InstallPromptEvent;
    notify();
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
    try {
      localStorage.setItem(INSTALLED_KEY, "1");
    } catch {
      /* stockage indisponible */
    }
    notify();
  });
}

export type Platform = "ios" | "android" | "desktop";

export function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "desktop";
  const ua = navigator.userAgent;
  const iPadOs = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  if (/iphone|ipad|ipod/i.test(ua) || iPadOs) return "ios";
  if (/android/i.test(ua)) return "android";
  return "desktop";
}

/** Vrai quand l'app tourne déjà « installée » (fenêtre sans barre d'adresse). */
export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches === true ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function wasInstalled(): boolean {
  try {
    return localStorage.getItem(INSTALLED_KEY) === "1" || isStandalone();
  } catch {
    return isStandalone();
  }
}

export function isInstallBannerDismissed(): boolean {
  try {
    const at = Number(localStorage.getItem(DISMISSED_KEY) ?? 0);
    return !!at && Date.now() - at < DISMISS_DAYS * 86_400_000;
  } catch {
    return false;
  }
}

export function dismissInstallBanner() {
  try {
    localStorage.setItem(DISMISSED_KEY, String(Date.now()));
  } catch {
    /* stockage indisponible */
  }
}

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

/** État d'installation et action « Installer » (réagit dès que le navigateur la propose). */
export function useInstall() {
  const canPrompt = useSyncExternalStore(
    subscribe,
    () => deferred !== null,
    () => false,
  );
  const platform = useSyncExternalStore(subscribe, detectPlatform, () => "desktop" as Platform);
  const standalone = useSyncExternalStore(subscribe, isStandalone, () => false);

  const install = async (): Promise<"accepted" | "dismissed" | "unavailable"> => {
    if (!deferred) return "unavailable";
    const ev = deferred;
    await ev.prompt();
    const choice = await ev.userChoice;
    deferred = null;
    if (choice.outcome === "accepted") {
      try {
        localStorage.setItem(INSTALLED_KEY, "1");
      } catch {
        /* stockage indisponible */
      }
    }
    notify();
    return choice.outcome;
  };

  return { canPrompt, platform, standalone, install };
}
