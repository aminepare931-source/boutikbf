import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  Check,
  Download,
  MonitorSmartphone,
  Smartphone,
  WifiOff,
  Users,
} from "lucide-react";
import logo from "@/assets/logo-trim.png";
import { detectPlatform, useInstall, wasInstalled, type Platform } from "@/lib/install";

export const Route = createFileRoute("/installer")({
  head: () => ({
    meta: [
      { title: "Installer BoutikBF sur votre téléphone" },
      {
        name: "description",
        content:
          "Installez BoutikBF sur Android, iPhone ou ordinateur en moins d'une minute, sans magasin d'applications.",
      },
    ],
  }),
  component: InstallerPage,
});

const GUIDES: {
  id: Platform;
  title: string;
  where: string;
  steps: string[];
}[] = [
  {
    id: "android",
    title: "Téléphone Android",
    where: "avec Chrome",
    steps: [
      "Ouvrez BoutikBF dans Chrome.",
      "Touchez le menu : les trois points en haut à droite.",
      "Choisissez « Installer l'application » (ou « Ajouter à l'écran d'accueil »).",
      "Confirmez. L'icône BoutikBF apparaît sur votre écran d'accueil.",
    ],
  },
  {
    id: "ios",
    title: "iPhone et iPad",
    where: "avec Safari uniquement",
    steps: [
      "Ouvrez BoutikBF dans Safari. Cela ne marche pas depuis Chrome ni depuis WhatsApp.",
      "Touchez le bouton Partager : le carré avec une flèche vers le haut.",
      "Faites défiler et touchez « Sur l'écran d'accueil ».",
      "Touchez « Ajouter ». L'icône BoutikBF apparaît sur votre écran d'accueil.",
    ],
  },
  {
    id: "desktop",
    title: "Ordinateur",
    where: "avec Chrome ou Edge",
    steps: [
      "Ouvrez BoutikBF dans Chrome ou Edge.",
      "Cliquez sur l'icône d'installation à droite de la barre d'adresse : un écran avec une flèche.",
      "Cliquez sur « Installer ». BoutikBF s'ouvre dans sa propre fenêtre.",
    ],
  },
];

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof WifiOff;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-bk-ink/5 bg-white p-6 shadow-[0_8px_28px_rgba(10,59,37,0.07)]">
      <h2 className="flex items-center gap-2.5 font-jakarta text-lg font-extrabold text-bk-ink">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-bk-mint text-bk">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        {title}
      </h2>
      <div className="mt-3 space-y-2 text-[15px] leading-relaxed text-bk-ink/80">{children}</div>
    </section>
  );
}

function InstallerPage() {
  const { canPrompt, standalone, install } = useInstall();
  // La plateforme n'est connue que dans le navigateur : on évite un écart à l'affichage serveur
  const [platform, setPlatform] = useState<Platform | null>(null);
  const [done, setDone] = useState(false);
  useEffect(() => {
    setPlatform(detectPlatform());
    setDone(wasInstalled());
  }, []);

  const ordered = [...GUIDES].sort((a, b) => (a.id === platform ? -1 : b.id === platform ? 1 : 0));

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-bk-mint/50 font-sans text-bk-ink">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-5 py-5">
        <Link to="/" aria-label="BoutikBF, accueil">
          <img src={logo} alt="BoutikBF" width={880} height={441} className="h-12 w-auto" />
        </Link>
        <Link to="/auth" className="text-sm font-semibold text-bk hover:underline">
          Se connecter
        </Link>
      </header>

      <main className="mx-auto max-w-3xl space-y-5 px-5 pb-16">
        <div className="pt-2">
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-sm text-bk-ink/60 hover:text-bk-ink"
          >
            <ArrowLeft className="h-4 w-4" /> Retour à l&apos;accueil
          </Link>
          <h1 className="mt-3 font-jakarta text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
            Installer BoutikBF sur votre téléphone
          </h1>
          <p className="mt-3 max-w-xl text-bk-ink/75">
            Pas besoin de magasin d&apos;applications. BoutikBF s&apos;ouvre en plein écran comme
            une vraie application, avec son icône, et la caisse continue même quand le réseau coupe.
          </p>
        </div>

        {standalone || done ? (
          <div className="flex items-center gap-3 rounded-2xl bg-bk-mint p-4 font-semibold text-bk">
            <Check className="h-5 w-5 shrink-0" aria-hidden="true" />
            <span>BoutikBF est déjà installée sur cet appareil.</span>
            <Link to="/start" className="ml-auto underline underline-offset-4">
              Ouvrir
            </Link>
          </div>
        ) : canPrompt ? (
          <button
            type="button"
            onClick={() => void install()}
            className="inline-flex items-center gap-2 rounded-full bg-bk px-7 py-3.5 text-base font-bold text-white shadow-lg shadow-bk/25 transition hover:bg-bk-dark"
          >
            <Download className="h-5 w-5" aria-hidden="true" />
            Installer maintenant
          </button>
        ) : null}

        <div className="space-y-4">
          {ordered.map((g) => (
            <section
              key={g.id}
              className={`rounded-3xl border bg-white p-6 shadow-[0_8px_28px_rgba(10,59,37,0.07)] ${
                g.id === platform ? "border-bk" : "border-bk-ink/5"
              }`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-jakarta text-lg font-extrabold">{g.title}</h2>
                <span className="text-sm text-bk-ink/60">{g.where}</span>
                {g.id === platform && (
                  <span className="rounded-full bg-bk px-3 py-0.5 text-xs font-bold text-white">
                    Votre appareil
                  </span>
                )}
              </div>
              <ol className="mt-4 space-y-3">
                {g.steps.map((step, i) => (
                  <li key={step} className="flex items-start gap-3 text-[15px] leading-relaxed">
                    <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-bk-mint text-xs font-bold text-bk">
                      {i + 1}
                    </span>
                    <span className="text-bk-ink/85">{step}</span>
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>

        <Section icon={Users} title="Pour vos employés de caisse">
          <p>
            Chaque employé installe l&apos;application de la même façon sur son téléphone. Il se
            connecte ensuite avec son nom, son code PIN et le code de la boutique.
          </p>
          <p>
            Le patron copie le lien de connexion de l&apos;équipe depuis la page Employés, et
            l&apos;envoie par WhatsApp.
          </p>
        </Section>

        <Section icon={WifiOff} title="Quand le réseau coupe">
          <p>
            Continuez à encaisser : les ventes sont gardées sur l&apos;appareil et envoyées
            automatiquement dès que la connexion revient.
          </p>
          <p>
            Ouvrez la caisse au moins une fois avec du réseau avant de compter dessus hors
            connexion.
          </p>
        </Section>

        <Section icon={Smartphone} title="Mise à jour automatique">
          <p>
            Il n&apos;y a rien à télécharger de nouveau : l&apos;application se met à jour toute
            seule quand vous l&apos;ouvrez avec du réseau.
          </p>
        </Section>

        <div className="flex items-center gap-3 rounded-2xl bg-white p-4 text-sm text-bk-ink/70 shadow-sm">
          <MonitorSmartphone className="h-5 w-5 shrink-0 text-bk" aria-hidden="true" />
          <p>
            Un problème pour installer ?{" "}
            <Link to="/contact" className="font-semibold text-bk underline underline-offset-4">
              Écrivez-nous
            </Link>
            , nous vous guidons.
          </p>
        </div>
      </main>
    </div>
  );
}
