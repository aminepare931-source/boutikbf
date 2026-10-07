import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import logo from "@/assets/logo.png";
import { LEGAL } from "@/lib/legal";

export const LEGAL_LINKS = [
  { to: "/a-propos", label: "À propos" },
  { to: "/conditions", label: "Conditions d'utilisation" },
  { to: "/confidentialite", label: "Confidentialité" },
  { to: "/cookies", label: "Cookies" },
  { to: "/mentions-legales", label: "Mentions légales" },
  { to: "/contact", label: "Contact" },
] as const;

/** Liens vers les pages légales, à placer dans un pied de page. */
export function LegalLinks({ className = "" }: { className?: string }) {
  return (
    <nav
      aria-label="Informations légales"
      className={`flex flex-wrap gap-x-5 gap-y-2 ${className}`}
    >
      {LEGAL_LINKS.map((l) => (
        <Link key={l.to} to={l.to} className="hover:text-emerald-500 transition-colors">
          {l.label}
        </Link>
      ))}
    </nav>
  );
}

export function LegalLayout({
  title,
  intro,
  children,
}: {
  title: string;
  intro?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-4">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt={LEGAL.appName} className="h-8 w-auto" />
          </Link>
          <Link to="/" className="text-sm font-medium text-muted-foreground hover:text-foreground">
            ← Retour à l&apos;accueil
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-10">
        <h1 className="font-display text-3xl font-black tracking-tight md:text-4xl">{title}</h1>
        <p className="mt-2 text-xs text-muted-foreground">
          Dernière mise à jour : {LEGAL.lastUpdate}
        </p>
        {intro && <p className="mt-6 text-base leading-relaxed text-muted-foreground">{intro}</p>}
        <div className="mt-8 space-y-8">{children}</div>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-3xl px-5 py-8 text-xs font-semibold text-muted-foreground">
          <LegalLinks />
          <p className="mt-4 font-normal">
            © {new Date().getFullYear()} {LEGAL.appName}. Tous droits réservés.
          </p>
        </div>
      </footer>
    </div>
  );
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-xl font-bold tracking-tight">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}

export function UL({ children }: { children: ReactNode }) {
  return <ul className="list-disc space-y-1.5 pl-5">{children}</ul>;
}

export function Strong({ children }: { children: ReactNode }) {
  return <strong className="font-semibold text-foreground">{children}</strong>;
}
