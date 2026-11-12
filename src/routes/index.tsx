import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { CookieNotice } from "@/components/legal/cookie-notice";
import { PosSimulator } from "@/components/landing/pos-simulator";
import {
  ArrowLeft,
  ArrowRight,
  Boxes,
  Check,
  ChevronDown,
  Clock,
  Facebook,
  Headphones,
  LineChart,
  Linkedin,
  Menu,
  Play,
  Rocket,
  ShieldCheck,
  ShoppingCart,
  Smartphone,
  Store,
  Users,
  UserCog,
  Wallet,
  X,
  Youtube,
  Zap,
} from "lucide-react";

import logoImg from "@/assets/logo-trim.png";
import heroPhoto from "@/assets/mock/hero.jpg";
import tileVentes from "@/assets/mock/tile-ventes.jpg";
import tileStock from "@/assets/mock/tile-stock.jpg";
import tileRapports from "@/assets/mock/tile-rapports.jpg";
import tileOrange from "@/assets/mock/tile-orange.jpg";
import featuresMan from "@/assets/mock/features-man.jpg";
import pilotezMan from "@/assets/mock/pilotez-man.jpg";
import pilotezDevices from "@/assets/mock/pilotez-devices.jpg";
import mobileMoney from "@/assets/mock/mobile-money.jpg";
import ctaMan from "@/assets/mock/cta-man.jpg";
import ctaPos from "@/assets/mock/cta-pos.jpg";

export const Route = createFileRoute("/")({
  component: Landing,
});

/* ---------- petits éléments partagés ---------- */

const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-full bg-bk px-6 py-3 text-[15px] font-semibold text-white shadow-lg shadow-bk/25 transition hover:bg-bk-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bk";
const btnOutline =
  "inline-flex items-center justify-center gap-2 rounded-full border-2 border-bk/70 bg-white px-6 py-3 text-[15px] font-semibold text-bk transition hover:bg-bk-mint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bk";
const pill =
  "inline-flex items-center gap-2 rounded-full bg-bk-mint px-4 py-1.5 text-sm font-semibold text-bk";
const h2 =
  "font-jakarta text-3xl font-extrabold leading-tight tracking-tight text-bk-ink sm:text-4xl";

function Logo({ light = false }: { light?: boolean }) {
  const img = (
    <img src={logoImg} alt="BoutikBF" width={880} height={441} className="h-12 w-auto sm:h-14" />
  );
  // Sur fond vert foncé, le logo est posé sur une pastille blanche pour rester lisible.
  return light ? <span className="inline-block rounded-2xl bg-white px-4 py-2">{img}</span> : img;
}

function BurkinaFlag({ className = "h-6 w-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 36 24" className={`${className} rounded-[3px] shadow-sm`} aria-hidden="true">
      <rect width="36" height="12" fill="#ef2b2d" />
      <rect y="12" width="36" height="12" fill="#009e49" />
      <path
        d="M18 6.2l1.9 5.2h5.5l-4.4 3.3 1.7 5.3L18 16.8l-4.7 3.2 1.7-5.3-4.4-3.3h5.5z"
        fill="#fcd116"
      />
    </svg>
  );
}

function TikTok({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
    </svg>
  );
}

function Stars() {
  return (
    <span className="flex gap-0.5 text-[#f5b301]" aria-label="5 étoiles sur 5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} viewBox="0 0 20 20" className="h-4 w-4 fill-current" aria-hidden="true">
          <path d="M10 1.5l2.6 5.6 6.1.7-4.5 4.2 1.2 6L10 15l-5.4 3 1.2-6L1.3 7.8l6.1-.7z" />
        </svg>
      ))}
    </span>
  );
}

/* ---------- navigation ---------- */

const FEATURE_LINKS = [
  { label: "Caisse intelligente", href: "#fonctionnalites" },
  { label: "Gestion de stock", href: "#fonctionnalites" },
  { label: "Rapports détaillés", href: "#fonctionnalites" },
  { label: "Paiements Mobile Money", href: "#mobile-money" },
  { label: "Essayer la caisse", href: "#simulateur" },
];

function NavMenu({
  label,
  items,
}: {
  label: string;
  items: { label: string; href?: string; to?: "/a-propos" | "/contact" | "/confidentialite" }[];
}) {
  return (
    <div className="group relative">
      <button
        type="button"
        className="flex items-center gap-1.5 rounded-full px-4 py-2 text-[15px] font-medium text-bk-ink hover:text-bk"
      >
        {label}
        <ChevronDown className="h-4 w-4 transition group-hover:rotate-180 group-focus-within:rotate-180" />
      </button>
      <div className="invisible absolute left-0 top-full z-50 pt-2 opacity-0 transition group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
        <ul className="min-w-56 rounded-2xl border border-bk/10 bg-white p-2 shadow-xl">
          {items.map((it) => (
            <li key={it.label}>
              {it.to ? (
                <Link
                  to={it.to}
                  className="block rounded-xl px-3 py-2 text-sm text-bk-ink hover:bg-bk-mint hover:text-bk"
                >
                  {it.label}
                </Link>
              ) : (
                <a
                  href={it.href}
                  className="block rounded-xl px-3 py-2 text-sm text-bk-ink hover:bg-bk-mint hover:text-bk"
                >
                  {it.label}
                </a>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Header() {
  const [open, setOpen] = useState(false);
  const link = "rounded-full px-4 py-2 text-[15px] font-medium text-bk-ink hover:text-bk";
  return (
    <header className="sticky top-3 z-40 mx-auto w-[calc(100%-1.5rem)] max-w-[1400px] sm:w-[calc(100%-3rem)]">
      <div className="flex items-center justify-between rounded-full bg-white/95 px-4 py-2.5 shadow-[0_8px_30px_rgba(10,59,37,0.10)] backdrop-blur sm:px-6">
        <Link to="/" aria-label="BoutikBF, accueil">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Navigation principale">
          <a
            href="#top"
            className="rounded-full bg-bk-mint px-4 py-2 text-[15px] font-semibold text-bk"
          >
            Accueil
          </a>
          <NavMenu label="Fonctionnalités" items={FEATURE_LINKS} />
          <a href="#logiciel" className={link}>
            Le logiciel
          </a>
          <a href="#tarifs" className={link}>
            Tarifs
          </a>
          <Link to="/contact" className={link}>
            FAQ
          </Link>
          <NavMenu
            label="Ressources"
            items={[
              { label: "À propos", to: "/a-propos" },
              { label: "Contact", to: "/contact" },
              { label: "Confidentialité", to: "/confidentialite" },
            ]}
          />
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <span
            className="flex items-center gap-2 rounded-full border border-bk/10 bg-white px-3 py-1.5 text-sm font-semibold text-bk-ink shadow-sm"
            title="Langue : français"
          >
            <BurkinaFlag className="h-4 w-6" />
            FR
            <ChevronDown className="h-4 w-4 text-bk-ink/60" />
          </span>
          <Link to="/auth" className="px-2 text-[15px] font-medium text-bk-ink hover:text-bk">
            Se connecter
          </Link>
          <Link to="/auth" className={btnPrimary}>
            Essayer gratuitement
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <button
          type="button"
          className="grid h-10 w-10 place-items-center rounded-full bg-bk-mint text-bk lg:hidden"
          aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="mt-2 rounded-3xl bg-white p-4 shadow-xl lg:hidden">
          <nav
            className="flex flex-col gap-1 text-base font-medium text-bk-ink"
            onClick={() => setOpen(false)}
          >
            <a href="#top" className="rounded-xl bg-bk-mint px-4 py-3 text-bk">
              Accueil
            </a>
            <a href="#fonctionnalites" className="rounded-xl px-4 py-3 hover:bg-bk-mint">
              Fonctionnalités
            </a>
            <a href="#logiciel" className="rounded-xl px-4 py-3 hover:bg-bk-mint">
              Le logiciel
            </a>
            <a href="#tarifs" className="rounded-xl px-4 py-3 hover:bg-bk-mint">
              Tarifs
            </a>
            <Link to="/contact" className="rounded-xl px-4 py-3 hover:bg-bk-mint">
              FAQ
            </Link>
            <Link to="/a-propos" className="rounded-xl px-4 py-3 hover:bg-bk-mint">
              Ressources
            </Link>
            <Link to="/auth" className="rounded-xl px-4 py-3 hover:bg-bk-mint">
              Se connecter
            </Link>
            <Link to="/auth" className={`${btnPrimary} mt-2`}>
              Essayer gratuitement
              <ArrowRight className="h-4 w-4" />
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}

/* ---------- sections ---------- */

function Hero() {
  const points = [
    { icon: ShoppingCart, text: "Caisse (POS)\nintelligente" },
    { icon: Boxes, text: "Gestion de\nstock en temps réel" },
    { icon: LineChart, text: "Rapports et\nanalyses détaillées" },
    { icon: Smartphone, text: "Paiements\nMobile Money" },
  ];
  const trust = [
    { icon: null, title: "Conçu au Burkina Faso", text: "pour nos commerçants" },
    { icon: ShieldCheck, title: "Sécurisé et fiable", text: "vos données sont protégées" },
    { icon: Headphones, title: "Assistance locale", text: "réactive et bienveillante" },
  ];
  return (
    <section
      id="top"
      className="relative -mt-[76px] overflow-hidden bg-gradient-to-b from-white via-white to-bk-mint/40 pt-[76px]"
    >
      <div className="mx-auto grid max-w-[1400px] items-center gap-6 px-5 pb-8 pt-12 sm:px-8 lg:grid-cols-[1.02fr_1fr] lg:pt-16">
        <div className="relative z-10">
          <span className="inline-flex items-center gap-2.5 rounded-2xl bg-bk-mint px-4 py-2 text-sm font-semibold text-bk-ink">
            <Rocket className="h-5 w-5 text-bk" />
            Le standard n°1 de gestion de commerces au Burkina
            <BurkinaFlag className="h-4 w-6" />
          </span>
          <h1 className="mt-7 font-jakarta text-[2.6rem] font-extrabold leading-[1.02] tracking-tight text-bk-ink sm:text-6xl xl:text-[4.4rem]">
            Votre boutique.
            <br />
            Votre stock. Vos ventes.
            <br />
            <span className="relative inline-block text-bk">
              Tout sous contrôle.
              <svg
                viewBox="0 0 300 14"
                preserveAspectRatio="none"
                className="absolute -bottom-3 left-[18%] h-3 w-[62%]"
                aria-hidden="true"
              >
                <path
                  d="M2 10c60-9 160-10 296-3"
                  fill="none"
                  stroke="#0b7a42"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          </h1>
          <p className="mt-9 max-w-xl text-lg leading-relaxed text-bk-ink/80">
            BoutikBF est un logiciel de gestion de commerce simple et puissant pour gérer votre
            boutique, suivre vos ventes, contrôler votre stock et développer votre activité au
            Burkina Faso.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link to="/auth" className={`${btnPrimary} px-8 py-4 text-base`}>
              Essayer BoutikBF gratuitement
              <ArrowRight className="h-5 w-5" />
            </Link>
            <a
              href="#simulateur"
              className="group inline-flex items-center gap-3 font-semibold text-bk-ink"
            >
              <span className="grid h-14 w-14 place-items-center rounded-full border border-bk/15 bg-white shadow-md transition group-hover:bg-bk-mint">
                <Play className="h-5 w-5 fill-bk-ink" />
              </span>
              Voir la démo
            </a>
          </div>
          <ul className="mt-9 grid grid-cols-2 gap-y-5 sm:grid-cols-4 sm:gap-y-0">
            {points.map((p, i) => (
              <li
                key={p.text}
                className={`flex items-center gap-3 pr-3 ${i > 0 ? "sm:border-l sm:border-bk-ink/15 sm:pl-4" : ""}`}
              >
                <p.icon className="h-8 w-8 shrink-0 text-bk" strokeWidth={1.6} />
                <span className="whitespace-pre-line text-[13px] font-medium leading-snug text-bk-ink/80">
                  {p.text}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative lg:-mr-8">
          <img
            src={heroPhoto}
            alt="Commerçante souriante devant sa tablette BoutikBF affichant le tableau de bord des ventes"
            width={837}
            height={725}
            className="relative z-0 mx-auto w-full max-w-[760px] lg:max-w-none [mask-image:linear-gradient(to_right,transparent,black_14%)]"
            fetchPriority="high"
          />
        </div>
      </div>

      <div className="mx-auto max-w-[1400px] px-5 pb-10 sm:px-8">
        <div className="grid gap-5 rounded-[2rem] bg-white px-6 py-5 shadow-[0_10px_40px_rgba(10,59,37,0.10)] sm:grid-cols-2 lg:grid-cols-4 lg:gap-0 lg:px-10">
          {trust.map((t) => (
            <div
              key={t.title}
              className="flex items-center gap-4 lg:border-r lg:border-bk-ink/15 lg:px-6 lg:first:pl-0"
            >
              {t.icon ? (
                <t.icon className="h-10 w-10 shrink-0 text-bk" strokeWidth={1.5} />
              ) : (
                <BurkinaFlag className="h-8 w-12 shrink-0" />
              )}
              <p className="text-sm leading-snug text-bk-ink/75">
                <strong className="block text-[15px] font-bold text-bk-ink">{t.title}</strong>
                {t.text}
              </p>
            </div>
          ))}
          <div className="flex flex-col items-center justify-center gap-1 lg:pl-6">
            <span className="flex gap-0.5 text-[#f5b301]">
              {Array.from({ length: 5 }).map((_, i) => (
                <svg
                  key={i}
                  viewBox="0 0 20 20"
                  className="h-6 w-6 fill-current"
                  aria-hidden="true"
                >
                  <path d="M10 1.5l2.6 5.6 6.1.7-4.5 4.2 1.2 6L10 15l-5.4 3 1.2-6L1.3 7.8l6.1-.7z" />
                </svg>
              ))}
            </span>
            <p className="text-sm font-bold text-bk-ink">4.8/5 sur +500 avis</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function PhotoTiles() {
  const tiles = [
    { src: tileVentes, alt: "Vendeur encaissant une cliente : ventes rapides et sécurisées" },
    { src: tileStock, alt: "Employée contrôlant le stock sur tablette : stock toujours à jour" },
    { src: tileRapports, alt: "Rapports clairs et détaillés : +32% de croissance" },
    { src: tileOrange, alt: "Paiement Orange Money réussi sur smartphone" },
  ];
  return (
    <section aria-label="Aperçu en images" className="mx-auto max-w-[1400px] px-5 pb-16 sm:px-8">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {tiles.map((t) => (
          <img
            key={t.src}
            src={t.src}
            alt={t.alt}
            loading="lazy"
            className="aspect-[4/3.3] w-full rounded-3xl object-cover shadow-lg shadow-bk-deep/10"
          />
        ))}
      </div>
    </section>
  );
}

function Features() {
  const items = [
    {
      icon: ShoppingCart,
      tint: "bg-emerald-100 text-bk",
      title: "Caisse intelligente",
      text: "Encaissez vos clients rapidement avec une interface simple et moderne.",
    },
    {
      icon: Boxes,
      tint: "bg-orange-100 text-orange-500",
      title: "Gestion de stock",
      text: "Suivez vos stocks en temps réel et évitez les ruptures.",
    },
    {
      icon: LineChart,
      tint: "bg-violet-100 text-violet-600",
      title: "Rapports détaillés",
      text: "Analysez vos ventes et prenez de meilleures décisions.",
    },
    {
      icon: Users,
      tint: "bg-sky-100 text-sky-600",
      title: "Gestion des clients",
      text: "Connaissez mieux vos clients et fidélisez-les.",
    },
    {
      icon: UserCog,
      tint: "bg-emerald-100 text-bk",
      title: "Gestion des employés",
      text: "Attribuez des rôles et suivez leurs activités.",
    },
    {
      icon: Wallet,
      tint: "bg-amber-100 text-amber-600",
      title: "Paiements Mobile Money",
      text: "Acceptez les paiements Orange Money, Moov et Wave.",
    },
  ];
  return (
    <section
      id="fonctionnalites"
      className="mx-auto grid max-w-[1400px] items-center gap-10 px-5 pb-20 sm:px-8 lg:grid-cols-[1.15fr_0.85fr]"
    >
      <div>
        <div className="text-center lg:text-left">
          <span className={pill}>Nos fonctionnalités</span>
          <h2 className={`${h2} mt-5`}>
            Une solution complète pour
            <br className="hidden sm:block" /> une gestion sans stress
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-bk-ink/75 lg:mx-0">
            Gérez votre commerce plus efficacement avec des outils conçus pour répondre aux besoins
            des commerçants africains.
          </p>
        </div>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((f) => (
            <li
              key={f.title}
              className="rounded-2xl border border-bk-ink/5 bg-white p-5 shadow-[0_8px_28px_rgba(10,59,37,0.07)]"
            >
              <span className={`grid h-11 w-11 place-items-center rounded-xl ${f.tint}`}>
                <f.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-jakarta text-base font-bold text-bk-ink">{f.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-bk-ink/70">{f.text}</p>
            </li>
          ))}
        </ul>
      </div>
      <img
        src={featuresMan}
        alt="Commerçant souriant avec une tablette : vendez plus, gérez mieux, développez-vous"
        loading="lazy"
        className="mx-auto w-full max-w-xl rounded-[2rem] shadow-xl shadow-bk-deep/15"
      />
    </section>
  );
}

function Pilotez() {
  return (
    <section id="logiciel" className="mx-auto max-w-[1400px] px-5 pb-20 sm:px-8">
      <div className="grid items-center gap-8 overflow-hidden rounded-[2.5rem] bg-gradient-to-r from-bk-mint via-white to-bk-mint/60 p-6 sm:p-10 lg:grid-cols-[0.85fr_1.15fr]">
        <img
          src={pilotezMan}
          alt="Commerçant gérant sa boutique sur tablette : +12% de ventes et gain de temps"
          loading="lazy"
          className="w-full rounded-3xl mix-blend-multiply"
        />
        <div className="grid items-center gap-6 md:grid-cols-[0.9fr_1.1fr]">
          <div>
            <span className={pill}>Une gestion plus intelligente</span>
            <h2 className={`${h2} mt-4`}>Pilotez votre commerce où que vous soyez</h2>
            <p className="mt-4 text-bk-ink/75">
              Accédez à votre boutique depuis votre ordinateur, tablette ou smartphone et gardez le
              contrôle partout, tout le temps.
            </p>
            <ul className="mt-5 space-y-2.5 text-[15px] font-medium text-bk-ink">
              {[
                "Interface simple et intuitive",
                "Accessible sur tous vos appareils",
                "Support technique réactif",
              ].map((t) => (
                <li key={t} className="flex items-center gap-2.5">
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-bk text-white">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                  {t}
                </li>
              ))}
            </ul>
            <Link to="/auth" className={`${btnPrimary} mt-6`}>
              Essayer maintenant
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <img
            src={pilotezDevices}
            alt="Tableau de bord BoutikBF sur ordinateur portable et smartphone"
            loading="lazy"
            className="w-full mix-blend-multiply"
          />
        </div>
      </div>
    </section>
  );
}

function MobileMoney() {
  return (
    <section
      id="mobile-money"
      className="mx-auto grid max-w-[1400px] items-center gap-10 px-5 pb-20 sm:px-8 lg:grid-cols-[0.8fr_1.2fr]"
    >
      <div>
        <span className={pill}>Paiements Mobile Money</span>
        <h2 className={`${h2} mt-5`}>Encaissez par Orange Money et Moov en un instant</h2>
        <p className="mt-4 max-w-md text-bk-ink/75">
          Vos clients scannent le QR code au comptoir, le paiement est reçu et votre ticket
          s'imprime. Chaque vente est enregistrée automatiquement.
        </p>
        <ul className="mt-6 space-y-2.5 text-[15px] font-medium text-bk-ink">
          {[
            "Paiement reçu en temps réel",
            "Ventes du jour toujours à jour",
            "Ticket de caisse imprimé",
          ].map((t) => (
            <li key={t} className="flex items-center gap-2.5">
              <span className="grid h-5 w-5 place-items-center rounded-full bg-bk text-white">
                <Check className="h-3 w-3" strokeWidth={3} />
              </span>
              {t}
            </li>
          ))}
        </ul>
      </div>
      <img
        src={mobileMoney}
        alt="Commerçante au comptoir avec son tableau de bord, son imprimante de tickets et un présentoir de paiement Orange Money et MoMo"
        width={1228}
        height={819}
        loading="lazy"
        className="w-full rounded-[2rem] shadow-xl shadow-bk-deep/15"
      />
    </section>
  );
}

function Confiance() {
  const stats = [
    { icon: Store, value: "+5 000", label: "Boutiques actives" },
    { icon: Zap, value: "99,9%", label: "Disponibilité" },
    { icon: Users, value: "98%", label: "Satisfaction client" },
  ];
  return (
    <section className="mx-auto max-w-[1400px] px-5 pb-20 sm:px-8">
      <div className="grid items-stretch gap-5 lg:grid-cols-[1fr_1.55fr_1fr]">
        <div className="rounded-3xl bg-bk-mint p-7">
          <span className="inline-block rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-bk">
            Pourquoi choisir BoutikBF ?
          </span>
          <h2 className={`${h2} mt-5 !text-3xl`}>Une confiance qui se mesure</h2>
          <p className="mt-3 text-sm leading-relaxed text-bk-ink/75">
            Des milliers de commerçants au Burkina Faso nous font déjà confiance pour la gestion de
            leur activité.
          </p>
          <a href="#avis" className={`${btnPrimary} mt-5 !px-4 !py-2 text-sm`}>
            Voir plus de témoignages
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>

        <dl className="grid grid-cols-1 divide-bk-ink/10 rounded-3xl bg-white p-6 shadow-[0_8px_28px_rgba(10,59,37,0.07)] sm:grid-cols-3 sm:divide-x">
          {stats.map((s) => (
            <div
              key={s.label}
              className="flex flex-col items-center justify-center gap-2 px-4 py-4 text-center"
            >
              <span className="grid h-14 w-14 place-items-center rounded-full bg-bk-mint text-bk">
                <s.icon className="h-7 w-7" strokeWidth={1.6} />
              </span>
              <dd className="font-jakarta text-4xl font-extrabold text-bk">{s.value}</dd>
              <dt className="text-sm text-bk-ink/75">{s.label}</dt>
            </div>
          ))}
        </dl>

        <figure className="flex flex-col justify-center rounded-3xl bg-white p-7 shadow-[0_8px_28px_rgba(10,59,37,0.07)]">
          <span className="font-jakarta text-5xl font-extrabold leading-none text-bk">“</span>
          <blockquote className="mt-1 text-[15px] leading-relaxed text-bk-ink/85">
            Depuis que j'utilise BoutikBF, ma gestion est beaucoup plus simple et mes ventes ont
            augmenté.
          </blockquote>
          <figcaption className="mt-5">
            <span className="text-sm">
              <strong className="block font-bold text-bk-ink">Fatimata Ouédraogo</strong>
              <span className="text-bk-ink/65">Propriétaire de boutique</span>
            </span>
          </figcaption>
        </figure>
      </div>
    </section>
  );
}

function Temoignages() {
  const scroller = useRef<HTMLDivElement>(null);
  const items = [
    {
      name: "Assita Traoré",
      role: "Propriétaire de boutique",
      text: "Depuis que j'utilise BoutikBF, ma gestion est beaucoup plus simple et mes ventes ont augmenté !",
    },
    {
      name: "Issa Ouédraogo",
      role: "Gérant de commerce",
      text: "Un logiciel très facile à utiliser. Le support est vraiment réactif. Merci BoutikBF !",
    },
    {
      name: "Fatou Sawadogo",
      role: "Commerçante",
      text: "Enfin une solution adaptée à nos réalités au Burkina. Je recommande vivement !",
    },
  ];
  const scrollBy = (dir: number) =>
    scroller.current?.scrollBy({
      left: dir * (scroller.current.clientWidth * 0.8),
      behavior: "smooth",
    });
  return (
    <section id="avis" className="mx-auto max-w-[1400px] px-5 pb-20 sm:px-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className={h2}>La confiance de nos commerçants</h2>
          <p className="mt-2 text-bk-ink/75">
            Découvrez ce que disent de BoutikBF nos utilisateurs.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => scrollBy(-1)}
            aria-label="Témoignages précédents"
            className="grid h-11 w-11 place-items-center rounded-full border border-bk-ink/15 bg-white shadow-sm hover:bg-bk-mint"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => scrollBy(1)}
            aria-label="Témoignages suivants"
            className="grid h-11 w-11 place-items-center rounded-full border border-bk-ink/15 bg-white shadow-sm hover:bg-bk-mint"
          >
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div
        ref={scroller}
        className="mt-8 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((t) => (
          <figure
            key={t.name}
            className="w-[85%] shrink-0 snap-start rounded-3xl border border-bk-ink/5 bg-white p-6 shadow-[0_8px_28px_rgba(10,59,37,0.07)] sm:w-[46%] lg:w-[calc((100%-2.5rem)/3)]"
          >
            <blockquote className="text-[15px] leading-relaxed text-bk-ink/85">
              « {t.text} »
            </blockquote>
            <figcaption className="mt-4 flex items-end justify-between gap-3">
              <span className="text-sm">
                <strong className="block font-bold text-bk-ink">{t.name}</strong>
                <span className="text-bk-ink/65">{t.role}</span>
              </span>
              <Stars />
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

function Tarifs() {
  const plans = [
    {
      name: "Starter",
      desc: "Parfait pour les petites boutiques",
      price: "0 FCFA",
      unit: "/ mois",
      features: ["Caisse simple", "Gestion de stock", "Rapports de base"],
      cta: "Commencer gratuitement",
      to: "/auth" as const,
    },
    {
      name: "Pro",
      desc: "Idéal pour les boutiques en croissance",
      price: "9 900 FCFA",
      unit: "/ mois",
      features: ["Toutes les fonctionnalités Starter", "Rapports avancés", "Support prioritaire"],
      cta: "Essayer Pro",
      to: "/auth" as const,
      popular: true,
    },
    {
      name: "Entreprise",
      desc: "Pour les grandes structures",
      price: "Sur devis",
      unit: "",
      features: ["Accompagnement dédié", "Fonctionnalités sur mesure"],
      cta: "Nous contacter",
      to: "/contact" as const,
    },
  ];
  return (
    <section
      id="tarifs"
      className="bg-gradient-to-b from-white to-bk-mint/60 px-5 pb-20 pt-4 sm:px-8"
    >
      <div className="mx-auto grid max-w-[1400px] items-center gap-10 lg:grid-cols-[0.7fr_1.3fr]">
        <div>
          <span className={pill}>Des offres adaptées</span>
          <h2 className={`${h2} mt-5`}>Choisissez l'offre qui vous convient</h2>
          <p className="mt-4 max-w-sm text-bk-ink/75">
            Commencez gratuitement et évoluez selon vos besoins.
          </p>
        </div>
        <div className="grid items-end gap-5 pt-6 md:grid-cols-3">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`relative rounded-3xl bg-white p-6 ${
                p.popular
                  ? "border-2 border-bk shadow-[0_18px_50px_rgba(11,122,66,0.22)] md:-translate-y-3 md:pb-8"
                  : "border border-bk-ink/5 shadow-[0_8px_28px_rgba(10,59,37,0.07)]"
              }`}
            >
              {p.popular && (
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-bk px-4 py-1 text-xs font-bold text-white">
                  Plus populaire
                </span>
              )}
              <h3 className="font-jakarta text-xl font-extrabold text-bk-ink">{p.name}</h3>
              <p className="mt-1 text-sm text-bk-ink/65">{p.desc}</p>
              <p className="mt-4 font-jakarta text-3xl font-extrabold text-bk-ink">
                {p.price}
                {p.unit && (
                  <span className="ml-1 text-sm font-medium text-bk-ink/60">{p.unit}</span>
                )}
              </p>
              <ul className="mt-4 space-y-2 text-sm text-bk-ink/80">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-bk" strokeWidth={3} />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                to={p.to}
                className={`${p.popular ? btnPrimary : btnOutline} mt-6 w-full !py-2.5 text-sm`}
              >
                {p.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CallToAction() {
  return (
    <section className="mx-auto max-w-[1400px] px-5 pb-16 pt-16 sm:px-8">
      <div className="grid items-center gap-6 overflow-hidden rounded-[2.5rem] bg-gradient-to-r from-white via-bk-mint/50 to-bk-mint p-6 shadow-[0_10px_40px_rgba(10,59,37,0.08)] sm:p-8 lg:grid-cols-[0.8fr_1.1fr_1fr]">
        <img
          src={ctaMan}
          alt="Commerçant souriant, pouce levé : +28,4% de croissance"
          loading="lazy"
          className="mx-auto hidden w-full max-w-sm mix-blend-multiply sm:block"
        />
        <div>
          <span className={pill}>Prêt à passer à l'action ?</span>
          <h2 className={`${h2} mt-4`}>
            Commencez dès aujourd'hui et transformez votre commerce !
          </h2>
          <p className="mt-4 text-bk-ink/75">
            Rejoignez une communauté grandissante de commerçants qui ont choisi BoutikBF pour gérer
            leur activité sereinement.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-5">
            <Link to="/auth" className={btnPrimary}>
              Essayer gratuitement
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#tarifs"
              className="inline-flex items-center gap-1.5 font-semibold text-bk underline underline-offset-4"
            >
              Voir nos tarifs
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
        <img
          src={ctaPos}
          alt="Caisse tactile BoutikBF avec lecteur de codes-barres et imprimante de tickets"
          loading="lazy"
          className="mx-auto w-full max-w-md mix-blend-multiply"
        />
      </div>
    </section>
  );
}

function Footer() {
  const links = [
    { label: "Accueil", href: "#top" },
    { label: "Fonctionnalités", href: "#fonctionnalites" },
    { label: "Tarifs", href: "#tarifs" },
  ];
  const routeLinks = [
    { label: "FAQ", to: "/contact" as const },
    { label: "À propos", to: "/a-propos" as const },
    { label: "Contact", to: "/contact" as const },
  ];
  const social = [
    { label: "YouTube", icon: <Youtube className="h-4 w-4" /> },
    { label: "Facebook", icon: <Facebook className="h-4 w-4" /> },
    { label: "TikTok", icon: <TikTok /> },
    { label: "LinkedIn", icon: <Linkedin className="h-4 w-4" /> },
  ];
  return (
    <footer className="rounded-t-[2.5rem] bg-bk-deep text-white">
      <div className="mx-auto max-w-[1400px] px-5 py-10 sm:px-8">
        <div className="flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
          <Logo light />
          <nav
            aria-label="Pied de page"
            className="flex flex-wrap gap-x-7 gap-y-3 text-sm font-medium"
          >
            {links.map((l) => (
              <a key={l.label} href={l.href} className="text-white/85 hover:text-white">
                {l.label}
              </a>
            ))}
            {routeLinks.map((l) => (
              <Link key={l.label} to={l.to} className="text-white/85 hover:text-white">
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-4">
            <ul className="flex gap-2.5">
              {social.map((s) => (
                <li key={s.label}>
                  <span
                    title={s.label}
                    className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white"
                  >
                    <span className="sr-only">{s.label}</span>
                    {s.icon}
                  </span>
                </li>
              ))}
            </ul>
            <Link
              to="/auth"
              className="hidden rounded-full bg-bk px-6 py-3 text-[15px] font-semibold text-white ring-1 ring-white/20 hover:bg-bk-dark sm:inline-flex sm:items-center sm:gap-2"
            >
              Essayer gratuitement
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
        <div className="mt-8 flex flex-col gap-3 border-t border-white/15 pt-6 text-sm text-white/75 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} BoutikBF. Tous droits réservés.</p>
          <ul className="flex flex-wrap gap-x-5 gap-y-2">
            <li>
              <Link to="/conditions" className="hover:text-white">
                Conditions d'utilisation
              </Link>
            </li>
            <li>
              <Link to="/confidentialite" className="hover:text-white">
                Confidentialité
              </Link>
            </li>
            <li>
              <Link to="/cookies" className="hover:text-white">
                Cookies
              </Link>
            </li>
            <li>
              <Link to="/mentions-legales" className="hover:text-white">
                Mentions légales
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}

/* ---------- page ---------- */

function Landing() {
  return (
    <div className="min-h-screen scroll-smooth bg-white font-sans text-bk-ink">
      <Header />
      <main>
        <Hero />
        <PhotoTiles />
        <Features />
        <Pilotez />
        <PosSimulator />
        <MobileMoney />
        <Confiance />
        <Temoignages />
        <Tarifs />
        <CallToAction />
      </main>
      <Footer />
      <CookieNotice />
    </div>
  );
}
