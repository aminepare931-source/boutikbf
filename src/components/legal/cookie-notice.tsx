import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

const KEY = "boutikbf-cookie-notice";

/** Bandeau d'information (BoutikBF n'utilise que du stockage strictement nécessaire). */
export function CookieNotice() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(KEY)) setShow(true);
    } catch {
      // stockage indisponible : on n'affiche rien
    }
  }, []);

  if (!show) return null;

  const close = () => {
    try {
      localStorage.setItem(KEY, "1");
    } catch {
      // ignoré
    }
    setShow(false);
  };

  return (
    <div
      role="dialog"
      aria-label="Information sur les cookies"
      className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-xl rounded-2xl border border-border bg-background/95 p-4 shadow-xl backdrop-blur"
    >
      <p className="text-xs leading-relaxed text-muted-foreground">
        BoutikBF n&apos;utilise{" "}
        <strong className="text-foreground">aucun cookie publicitaire ni de suivi</strong>. Seul le
        stockage nécessaire au fonctionnement (connexion, préférences) est utilisé.{" "}
        <Link to="/cookies" className="font-semibold text-primary underline">
          En savoir plus
        </Link>
      </p>
      <div className="mt-3 flex justify-end">
        <button
          onClick={close}
          className="rounded-lg bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90"
        >
          J&apos;ai compris
        </button>
      </div>
    </div>
  );
}
