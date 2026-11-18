import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { dismissInstallBanner, isInstallBannerDismissed, useInstall } from "@/lib/install";

/**
 * Invitation à installer l'application, affichée en haut des pages (patron et employés).
 * Elle disparaît si l'app est déjà installée, ou pendant 14 jours après « Plus tard ».
 */
export function InstallBanner() {
  const { canPrompt, platform, standalone, install } = useInstall();
  const [hidden, setHidden] = useState(true);

  useEffect(() => setHidden(isInstallBannerDismissed()), []);

  if (standalone || hidden) return null;
  // Sur ordinateur sans proposition du navigateur, rien à montrer
  if (!canPrompt && platform !== "ios") return null;

  const close = () => {
    dismissInstallBanner();
    setHidden(true);
  };

  return (
    <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-3 text-sm">
      <Download className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
      <p className="min-w-0 flex-1">
        <strong className="font-semibold">Installez BoutikBF sur cet appareil.</strong> Elle
        s&apos;ouvre comme une vraie application, en plein écran, et la caisse continue même si le
        réseau coupe.
      </p>
      {canPrompt ? (
        <Button size="sm" onClick={() => void install()}>
          Installer
        </Button>
      ) : (
        <Button asChild size="sm">
          <Link to="/installer">Comment faire</Link>
        </Button>
      )}
      <button
        type="button"
        onClick={close}
        aria-label="Plus tard"
        className="rounded-full p-1.5 text-muted-foreground hover:bg-muted"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
