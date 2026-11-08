import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { translations, type Language } from "@/lib/translations";
import { LegalLinks } from "@/components/legal/legal-layout";
import { CookieNotice } from "@/components/legal/cookie-notice";
import {
  ShoppingCart,
  Package,
  Users,
  BarChart3,
  CreditCard,
  Shield,
  ShieldCheck,
  ArrowRight,
  Check,
  Star,
  Plus,
  Minus,
  Smartphone,
  CheckCircle2,
  Play,
  Sun,
  Moon,
  Menu,
  X,
  ChevronDown,
  Store,
  WifiOff,
  Rocket,
  Crown,
  Globe,
} from "lucide-react";

// Asset imports
import heroShop from "@/assets/hero-shop.jpg";
import featurePos from "@/assets/feature-pos.jpg";
import featureAnalytics from "@/assets/feature-analytics.jpg";
import featureMobile from "@/assets/feature-mobile.jpg";

export const Route = createFileRoute("/")({
  component: Landing,
});

interface Product {
  id: string;
  emoji: string;
  name: string;
  price: number;
}

const PRODUCTS_CATALOG: Product[] = [
  { id: "1", emoji: "🍚", name: "Riz Bagré 5 kg", price: 3500 },
  { id: "2", emoji: "🧴", name: "Huile 1 L", price: 1200 },
  { id: "3", emoji: "🧱", name: "Ciment Dangote", price: 5000 },
  { id: "4", emoji: "🧼", name: "Savon", price: 200 },
  { id: "5", emoji: "🍬", name: "Sucre 1 kg", price: 850 },
  { id: "6", emoji: "🥛", name: "Lait en poudre", price: 2500 },
];

const PAYMENTS = [
  { id: "orange", label: "Orange Money", className: "bg-orange-500 text-white" },
  { id: "moov", label: "Moov Money", className: "bg-blue-600 text-white" },
  { id: "wave", label: "Wave", className: "bg-sky-100 text-sky-700" },
  { id: "cash", label: "Espèces", className: "bg-neutral-100 text-neutral-700" },
] as const;

export default function Landing() {
  // Localization state
  const [lang, setLang] = useState<Language>("fr");

  // Mobile navigation menu
  const [menuOpen, setMenuOpen] = useState(false);

  // Theme state (system-saved)
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  // FAQ accordion
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  // Interactive POS Simulator states
  const [cart, setCart] = useState<{ [key: string]: number }>({});
  const [paymentMethod, setPaymentMethod] = useState<"orange" | "moov" | "wave" | "cash">("orange");
  const [posSuccess, setPosSuccess] = useState(false);
  const [posReceiptNo, setPosReceiptNo] = useState("");

  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("boutikbf-theme") : null;
    if (saved === "light" || saved === "dark") {
      setTheme(saved);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("boutikbf-theme", theme);
    }
  }, [theme]);

  const isDark = theme === "dark";
  const t = translations[lang];

  // Simulator Cart management
  const handleAddToCart = (product: Product) => {
    setCart((prev) => ({
      ...prev,
      [product.id]: (prev[product.id] || 0) + 1,
    }));
    setPosSuccess(false);
  };

  const handleRemoveOne = (productId: string) => {
    setCart((prev) => {
      const copy = { ...prev };
      if (!copy[productId]) return prev;
      if (copy[productId] <= 1) {
        delete copy[productId];
      } else {
        copy[productId] -= 1;
      }
      return copy;
    });
  };

  const handleClearCart = () => {
    setCart({});
    setPosSuccess(false);
    setPosReceiptNo("");
  };

  const getCartTotal = () => {
    return Object.entries(cart).reduce((total, [id, qty]) => {
      const p = PRODUCTS_CATALOG.find((item) => item.id === id);
      return total + (p ? p.price * qty : 0);
    }, 0);
  };

  const handleValidateSale = () => {
    if (Object.keys(cart).length === 0) return;
    setPosReceiptNo(`TX-${Math.floor(100000 + Math.random() * 900000)}`);
    setPosSuccess(true);
  };

  // Receipt data: demo ticket when no sale validated, live ticket otherwise
  const receiptItems =
    posSuccess
      ? Object.entries(cart)
          .map(([id, qty]) => {
            const p = PRODUCTS_CATALOG.find((item) => item.id === id);
            return p ? { name: p.name, price: p.price, qty } : null;
          })
          .filter((i): i is { name: string; price: number; qty: number } => i !== null)
      : [
          { name: "Riz Bagré 5 kg", price: 3500, qty: 1 },
          { name: "Huile 1 L", price: 1200, qty: 1 },
        ];
  const receiptTotal = receiptItems.reduce((sum, i) => sum + i.price * i.qty, 0);
  const receiptNo = posSuccess ? posReceiptNo : "TX-000124";
  const receiptDate = posSuccess
    ? new Date().toLocaleDateString("fr-FR") + " " + new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
    : "07/10/2025 16:30";

  const featureCards = [
    { icon: ShoppingCart, color: "emerald", title: t.posTitle, desc: t.posDesc },
    { icon: Package, color: "amber", title: t.stockTitle, desc: t.stockDesc },
    { icon: CreditCard, color: "blue", title: t.mobileMoneyTitle, desc: t.mobileMoneyDesc },
    { icon: Users, color: "purple", title: t.crmTitle, desc: t.crmDesc },
    { icon: BarChart3, color: "orange", title: t.accountingTitle, desc: t.accountingDesc },
    { icon: Shield, color: "red", title: t.securityTitle, desc: t.securityDesc },
  ] as const;

  const featureColorMap: Record<string, string> = {
    emerald: "bg-emerald-500/10 text-emerald-400",
    amber: "bg-amber-500/10 text-amber-400",
    blue: "bg-blue-500/10 text-blue-400",
    purple: "bg-purple-500/10 text-purple-400",
    orange: "bg-orange-500/10 text-orange-400",
    red: "bg-red-500/10 text-red-400",
  };

  const solutionCards = [
    { img: featurePos, title: t.showcase1Title, desc: t.showcase1Desc },
    { img: featureMobile, title: t.showcase2Title, desc: t.showcase2Desc },
    { img: featureAnalytics, title: t.showcase3Title, desc: t.showcase3Desc },
  ];

  return (
    <div
      className={`min-h-screen relative transition-colors duration-500 font-sans ${
        isDark ? "bg-neutral-950 text-neutral-100" : "bg-neutral-50 text-neutral-900"
      }`}
    >
      {/* Burkina Faso flag ribbon */}
      <div className="h-1 bg-gradient-to-r from-[#ef2b2d] via-[#fcd116] to-[#009e49] w-full" />

      {/* Header */}
      <header
        className={`sticky top-0 z-40 backdrop-blur border-b transition-colors ${
          isDark
            ? "bg-neutral-950/90 border-neutral-900"
            : "bg-white/90 border-neutral-200"
        }`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <span className="h-9 w-9 rounded-xl bg-gradient-to-b from-emerald-400 to-emerald-600 flex items-center justify-center shadow-md shadow-emerald-500/20">
              <Store className="h-5 w-5 text-white" />
            </span>
            <span className="text-xl font-extrabold tracking-tight text-white">
              Boutik<span className="text-emerald-400">BF</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-7 text-sm font-medium">
            <a href="#features" className="flex items-center gap-1 text-neutral-300 hover:text-emerald-400 transition-colors">
              {t.navFeatures}
              <ChevronDown className="h-3.5 w-3.5 text-neutral-500" />
            </a>
            <a href="#software" className="flex items-center gap-1 text-neutral-300 hover:text-emerald-400 transition-colors">
              {t.navSoftware}
              <ChevronDown className="h-3.5 w-3.5 text-neutral-500" />
            </a>
            <a href="#simulator" className="text-neutral-300 hover:text-emerald-400 transition-colors">
              {t.navDemo}
            </a>
            <a href="#pricing" className="text-neutral-300 hover:text-emerald-400 transition-colors">
              {t.navPricing}
            </a>
            <a href="#faq" className="text-neutral-300 hover:text-emerald-400 transition-colors">
              {t.navFaq}
            </a>
          </nav>

          {/* Right widgets */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Language selector */}
            <div className="relative hidden sm:block">
              <Globe className="h-3.5 w-3.5 text-emerald-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value as Language)}
                aria-label="Langue"
                className={`appearance-none cursor-pointer rounded-full border py-1.5 pl-8 pr-7 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500/50 ${
                  isDark
                    ? "bg-neutral-900 border-neutral-800 text-neutral-200"
                    : "bg-white border-neutral-200 text-neutral-800"
                }`}
                style={{
                  backgroundImage: `url("data:image/svg+xml;utf8,<svg fill='none' stroke='gray' stroke-width='2' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'><path stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'></path></svg>")`,
                  backgroundPosition: "right 7px center",
                  backgroundSize: "9px",
                  backgroundRepeat: "no-repeat",
                }}
              >
                <option value="fr">🇫🇷 FR</option>
                <option value="en">🇬🇧 EN</option>
                <option value="mo">🇧🇫 MO</option>
                <option value="di">🇧🇫 DI</option>
              </select>
            </div>

            {/* Theme segmented switch */}
            <div
              className={`hidden sm:flex items-center rounded-full border p-1 ${
                isDark ? "bg-neutral-900 border-neutral-800" : "bg-neutral-100 border-neutral-200"
              }`}
            >
              <button
                type="button"
                onClick={() => setTheme("light")}
                aria-label="Mode jour"
                className={`h-7 w-7 rounded-full flex items-center justify-center transition-colors ${
                  !isDark
                    ? "bg-emerald-500 text-white"
                    : isDark
                      ? "text-neutral-500 hover:text-neutral-300"
                      : "text-neutral-400"
                }`}
              >
                <Sun className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setTheme("dark")}
                aria-label="Mode nuit"
                className={`h-7 w-7 rounded-full flex items-center justify-center transition-colors ${
                  isDark
                    ? "bg-emerald-500 text-white"
                    : "text-neutral-400 hover:text-neutral-600"
                }`}
              >
                <Moon className="h-4 w-4" />
              </button>
            </div>

            {/* Login */}
            <Button
              asChild
              className={`hidden md:inline-flex rounded-full text-sm font-semibold px-5 h-9 ${
                isDark
                  ? "bg-white text-neutral-900 hover:bg-neutral-200"
                  : "bg-neutral-900 text-white hover:bg-neutral-800"
              }`}
            >
              <Link to="/auth">{t.login}</Link>
            </Button>

            {/* Free trial CTA */}
            <Button
              asChild
              className="hidden sm:inline-flex rounded-full bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-semibold px-5 h-9"
            >
              <Link to="/auth">{t.freeTrial}</Link>
            </Button>

            {/* Mobile menu toggle */}
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              aria-expanded={menuOpen}
              aria-label="Menu"
              className={`lg:hidden rounded-full h-9 w-9 flex items-center justify-center border transition-colors ${
                isDark
                  ? "border-neutral-800 text-neutral-300 hover:bg-neutral-900"
                  : "border-neutral-200 text-neutral-700 hover:bg-neutral-100"
              }`}
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile navigation panel */}
        {menuOpen && (
          <nav
            className={`lg:hidden border-t px-4 py-3 flex flex-col divide-y ${
              isDark
                ? "border-neutral-900 divide-neutral-900"
                : "border-neutral-200 divide-neutral-100"
            }`}
          >
            {[
              { href: "#features", label: t.navFeatures },
              { href: "#software", label: t.navSoftware },
              { href: "#simulator", label: t.navDemo },
              { href: "#pricing", label: t.navPricing },
              { href: "#faq", label: t.navFaq },
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className={`py-3 text-sm font-medium transition-colors ${
                  isDark
                    ? "text-neutral-300 hover:text-emerald-400"
                    : "text-neutral-700 hover:text-emerald-600"
                }`}
              >
                {item.label}
              </a>
            ))}
            <div className="pt-3 flex gap-2">
              <Button
                asChild
                className={`flex-1 rounded-full text-sm font-semibold h-10 ${
                  isDark
                    ? "bg-white text-neutral-900 hover:bg-neutral-200"
                    : "bg-neutral-900 text-white hover:bg-neutral-800"
                }`}
              >
                <Link to="/auth" onClick={() => setMenuOpen(false)}>
                  {t.login}
                </Link>
              </Button>
              <Button
                asChild
                className="flex-1 rounded-full bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-semibold h-10"
              >
                <Link to="/auth" onClick={() => setMenuOpen(false)}>
                  {t.freeTrial}
                </Link>
              </Button>
            </div>
          </nav>
        )}
      </header>

      {/* Hero */}
      <section className="relative py-14 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            {/* Left */}
            <div className="space-y-6 text-left">
              <span className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1 text-xs font-bold uppercase tracking-wide text-emerald-400">
                {t.badge}
              </span>

              <h1 className="text-4xl sm:text-5xl lg:text-[3.4rem] font-extrabold tracking-tight leading-[1.08] text-white">
                {t.heroTitlePre}
                <span className="text-emerald-400">{t.heroTitleHighlight}</span>
              </h1>

              <p className="text-sm sm:text-base leading-relaxed max-w-md text-neutral-400">
                {t.heroDesc}
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <Button
                  asChild
                  className="w-full sm:w-auto rounded-full bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-semibold px-6 h-11 flex items-center justify-center gap-2"
                >
                  <Link to="/auth">
                    {t.btnTryFree}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  className={`w-full sm:w-auto rounded-full text-sm font-semibold px-6 h-11 flex items-center justify-center gap-2 ${
                    isDark
                      ? "bg-white text-neutral-900 hover:bg-neutral-200"
                      : "bg-neutral-900 text-white hover:bg-neutral-800"
                  }`}
                >
                  <a href="#simulator">
                    <Play className="h-4 w-4 fill-current" />
                    {t.btnTestSim}
                  </a>
                </Button>
              </div>

              {/* Trust indicators */}
              <div className="flex flex-wrap items-center gap-x-5 gap-y-3 pt-6">
                {[
                  { icon: Store, label: `500+ ${t.activeBoutiques}` },
                  { icon: WifiOff, label: t.worksOffline },
                  { icon: ShieldCheck, label: t.compliant },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <span className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                      <item.icon className="h-4 w-4" />
                    </span>
                    <span className="text-sm font-medium text-neutral-300">{item.label}</span>
                    {i < 2 && <span className="hidden sm:block h-6 w-px bg-neutral-800 ml-3" />}
                  </div>
                ))}
              </div>
            </div>

            {/* Right: POS terminal visual */}
            <div className="relative w-full">
              {/* Burkina badge */}
              <div className="absolute -top-4 right-3 z-20 bg-white text-neutral-900 rounded-2xl shadow-lg px-3.5 py-2 flex items-center gap-2">
                <span className="text-lg leading-none">🇧🇫</span>
                <span className="text-[10px] font-bold leading-tight">
                  Conçu pour
                  <br />
                  le Burkina Faso
                </span>
              </div>

              <div className="relative aspect-[4/3] rounded-3xl overflow-hidden border border-neutral-800">
                {/* Blurred shop photo backdrop */}
                <img
                  src={heroShop}
                  alt="Boutique moderne au Burkina Faso"
                  className="absolute inset-0 h-full w-full object-cover blur-[3px] brightness-[0.35] scale-110"
                />

                {/* POS terminal mockup */}
                <div className="absolute inset-0 flex items-center justify-center p-6 sm:p-10">
                  <div className="w-full max-w-md">
                    {/* Screen */}
                    <div className="rounded-2xl border border-neutral-700 bg-neutral-950 p-2 shadow-2xl">
                      <div className="rounded-xl overflow-hidden bg-neutral-900">
                        {/* Screen top bar */}
                        <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-800">
                          <div className="flex items-center gap-1.5">
                            <span className="h-3.5 w-3.5 rounded bg-emerald-500 flex items-center justify-center">
                              <Store className="h-2 w-2 text-white" />
                            </span>
                            <span className="text-[10px] font-bold text-white">BoutikBF</span>
                          </div>
                          <span className="text-[10px] text-neutral-500 font-mono">Ticket #7</span>
                        </div>

                        {/* Product tiles */}
                        <div className="grid grid-cols-4 gap-1.5 p-2.5">
                          {["🍚", "🧴", "🧱", "🧼", "🥛", "🍬", "🛒", "📻"].map((e, i) => (
                            <div
                              key={i}
                              className="aspect-square rounded-md bg-neutral-800 flex items-center justify-center text-lg"
                            >
                              {e}
                            </div>
                          ))}
                        </div>

                        {/* Screen footer */}
                        <div className="flex items-center justify-between px-3 py-2.5 border-t border-neutral-800">
                          <span className="text-xs font-bold text-white">Total : 7 500 F</span>
                          <span className="rounded-md bg-emerald-500 px-3 py-1 text-[10px] font-bold text-white">
                            Payer
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Terminal stand */}
                    <div className="mx-auto h-4 w-16 bg-neutral-800 rounded-b-lg" />
                    <div className="mx-auto h-1.5 w-28 bg-neutral-700 rounded-full" />
                  </div>
                </div>

                {/* Receipt paper */}
                <div className="absolute right-6 bottom-8 sm:right-10 w-32 rotate-3 rounded-lg bg-white p-3 shadow-2xl font-mono text-[9px] text-neutral-800">
                  <div className="text-center font-bold text-[10px]">BoutikBF</div>
                  <div className="text-center text-[8px]">Ticket de vente</div>
                  <div className="my-1.5 border-t border-dashed border-neutral-300" />
                  <div>Riz Bagré 5g 3 500 F</div>
                  <div>Huile 1 L 1 200 F</div>
                  <div>Sucre 1 kg 850 F</div>
                  <div>Savon 200 F</div>
                  <div className="my-1.5 border-t border-dashed border-neutral-300" />
                  <div className="flex justify-between font-bold">
                    <span>Total</span>
                    <span>5 750 F</span>
                  </div>
                  <div className="mt-1.5 text-center">Merci !</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature cards row */}
      <section id="features" className="py-10 md:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {featureCards.map((card) => (
              <div
                key={card.title}
                className={`rounded-2xl border p-5 text-center transition-colors ${
                  isDark
                    ? "bg-neutral-900 border-neutral-800/80"
                    : "bg-white border-neutral-200 shadow-sm"
                }`}
              >
                <span
                  className={`mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${featureColorMap[card.color]}`}
                >
                  <card.icon className="h-5 w-5" />
                </span>
                <h3 className="text-sm font-semibold text-white leading-snug">{card.title}</h3>
                <p className="mt-1 text-xs text-neutral-500">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Solution section */}
      <section id="software" className="py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-10 lg:grid-cols-12 items-center">
            {/* Left text */}
            <div className="lg:col-span-4 space-y-6 text-left">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-emerald-400">
                <span className="h-0.5 w-6 bg-emerald-500 rounded-full" />
                Une solution complète
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-snug text-white">
                Tout ce dont vous avez besoin pour{" "}
                <span className="text-emerald-400">bien gérer</span> votre commerce
              </h2>
              <ul className="space-y-3">
                {[
                  "Gestion de caisse et ventes",
                  "Suivi du stock et des produits",
                  "Rapports et analyses",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-sm text-neutral-300">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Button
                asChild
                className="rounded-full bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-semibold px-6 h-11 mt-2"
              >
                <Link to="/auth">
                  Découvrir toutes les fonctionnalités
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>

            {/* Right: photo cards */}
            <div className="lg:col-span-8">
              <div className="grid gap-4 sm:grid-cols-3">
                {solutionCards.map((card) => (
                  <div
                    key={card.title}
                    className={`rounded-2xl overflow-hidden border ${
                      isDark
                        ? "bg-neutral-900 border-neutral-800"
                        : "bg-white border-neutral-200 shadow-sm"
                    }`}
                  >
                    <img
                      src={card.img}
                      alt={card.title}
                      className="h-44 w-full object-cover"
                      loading="lazy"
                    />
                    <div className="p-4">
                      <h4 className="text-sm font-semibold text-white">{card.title}</h4>
                      <p className="mt-1.5 text-xs text-neutral-500">{card.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Simulator */}
      <section id="simulator" className="py-10 md:py-16">
        <div className="mx-auto max-w-[88rem] px-4 sm:px-6">
          <div
            className={`rounded-3xl border p-6 md:p-8 ${
              isDark
                ? "bg-neutral-900/50 border-neutral-800"
                : "bg-white border-neutral-200 shadow-sm"
            }`}
          >
            <div className="grid gap-6 xl:grid-cols-12 items-start">
              {/* Text panel */}
              <div className="xl:col-span-3 space-y-4">
                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-emerald-400">
                  <span className="h-0.5 w-6 bg-emerald-500 rounded-full" />
                  Simulateur de caisse
                </div>
                <h2 className="text-3xl font-extrabold tracking-tight text-white">
                  {t.simulatorTitle}
                </h2>
                <p className="text-sm text-neutral-400">{t.simulatorSub}</p>
              </div>

              {/* Catalog */}
              <div className="xl:col-span-4">
                <div className="grid grid-cols-2 gap-3">
                  {PRODUCTS_CATALOG.map((item) => {
                    const qty = cart[item.id] || 0;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleAddToCart(item)}
                        className="relative rounded-xl bg-white p-3 text-center shadow-sm ring-emerald-500 hover:ring-2 transition-all cursor-pointer"
                      >
                        {qty > 0 && (
                          <span className="absolute top-1.5 right-1.5 rounded-full bg-emerald-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                            +{qty}
                          </span>
                        )}
                        <div className="text-3xl">{item.emoji}</div>
                        <h4 className="mt-1 text-xs font-bold text-neutral-900">{item.name}</h4>
                        <span className="mt-0.5 block font-mono text-xs text-neutral-500">
                          {item.price.toLocaleString("fr-FR")} F
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Cart */}
              <div className="xl:col-span-3">
                <div
                  className={`rounded-2xl border p-4 ${
                    isDark
                      ? "bg-neutral-950/80 border-neutral-800"
                      : "bg-neutral-100 border-neutral-200"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-neutral-300">
                      {t.simulatorCart} ({Object.values(cart).reduce((a, b) => a + b, 0)}{" "}
                      articles)
                    </span>
                    {Object.keys(cart).length > 0 && (
                      <button
                        type="button"
                        onClick={handleClearCart}
                        className="text-[10px] font-bold text-red-400 hover:underline"
                      >
                        Tout vider
                      </button>
                    )}
                  </div>

                  {Object.keys(cart).length === 0 ? (
                    <p className="py-8 text-center text-xs text-neutral-500">
                      {t.simulatorEmptyCart}
                    </p>
                  ) : (
                    <div className="mt-3 space-y-2">
                      {Object.entries(cart).map(([id, qty]) => {
                        const item = PRODUCTS_CATALOG.find((p) => p.id === id);
                        if (!item) return null;
                        return (
                          <div
                            key={id}
                            className="flex items-center justify-between rounded-lg bg-white p-2"
                          >
                            <div className="text-left">
                              <h4 className="text-[11px] font-bold text-neutral-900">
                                {item.name}
                              </h4>
                              <span className="font-mono text-[10px] text-neutral-500">
                                {item.price.toLocaleString("fr-FR")} F
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleRemoveOne(id)}
                                aria-label="Retirer"
                                className="h-5 w-5 rounded bg-neutral-200 flex items-center justify-center text-neutral-900 hover:bg-neutral-300 transition-colors"
                              >
                                <Minus className="h-2.5 w-2.5" />
                              </button>
                              <span className="min-w-[14px] text-center text-[11px] font-bold text-neutral-900">
                                {qty}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleAddToCart(item)}
                                aria-label="Ajouter"
                                className="h-5 w-5 rounded bg-neutral-200 flex items-center justify-center text-neutral-900 hover:bg-neutral-300 transition-colors"
                              >
                                <Plus className="h-2.5 w-2.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="mt-4 flex items-center justify-between border-t border-neutral-800 pt-3">
                    <span className="text-xs font-semibold text-neutral-400">{t.simulatorTotal} :</span>
                    <span className="text-lg font-extrabold text-white">
                      {getCartTotal().toLocaleString("fr-FR")} F
                    </span>
                  </div>

                  <div className="mt-3 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                      Paiement :
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      {PAYMENTS.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setPaymentMethod(m.id)}
                          className={`rounded-lg px-2.5 py-2 text-[10px] font-bold transition-all ${m.className} ${
                            paymentMethod === m.id
                              ? "ring-2 ring-emerald-400 ring-offset-1 ring-offset-transparent"
                              : "opacity-80 hover:opacity-100"
                          }`}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                    <Button
                      onClick={handleValidateSale}
                      className="w-full rounded-full bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-semibold h-10"
                    >
                      {t.simulatorPayBtn}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Receipt */}
              <div className="xl:col-span-2">
                {posSuccess && (
                  <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {t.simulatorReceiptTitle}
                  </p>
                )}
                <div
                  className={`rounded-xl bg-white p-4 font-mono text-[10px] text-neutral-800 shadow-xl ${
                    posSuccess ? "" : "rotate-1 opacity-95"
                  }`}
                >
                  <div className="text-center">
                    <div className="text-xs font-bold">BoutikBF</div>
                    <div className="text-[9px] text-neutral-500">Ticket de vente</div>
                  </div>
                  <div className="my-2 border-t border-dashed border-neutral-300" />
                  <div className="flex justify-between">
                    <span>N°</span>
                    <span className="font-bold">{receiptNo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Date</span>
                    <span>{receiptDate}</span>
                  </div>
                  <div className="my-2 border-t border-dashed border-neutral-300" />
                  {receiptItems.map((item, i) => (
                    <div key={i} className="flex justify-between gap-2 py-0.5">
                      <span className="truncate">
                        {item.name} ×{item.qty}
                      </span>
                      <span>{(item.price * item.qty).toLocaleString("fr-FR")} F</span>
                    </div>
                  ))}
                  <div className="mt-2 border-t border-dashed border-neutral-300 pt-2">
                    <div className="flex justify-between text-xs font-bold">
                      <span>Total :</span>
                      <span>{receiptTotal.toLocaleString("fr-FR")} F</span>
                    </div>
                  </div>
                  <div className="mt-2 text-center text-[9px] text-neutral-500">Merci !</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-5 lg:grid-cols-12 items-stretch">
            {/* Text */}
            <div className="lg:col-span-3 space-y-4">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-emerald-400">
                <span className="h-0.5 w-6 bg-emerald-500 rounded-full" />
                Nos tarifs
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight leading-snug text-white">
                {t.pricingTitle}
              </h2>
              <p className="text-sm text-neutral-400">{t.pricingSub}</p>
            </div>

            {/* Starter */}
            <div
              className={`lg:col-span-2 rounded-3xl border p-5 flex flex-col ${
                isDark
                  ? "bg-neutral-900/60 border-neutral-800"
                  : "bg-white border-neutral-200 shadow-sm"
              }`}
            >
              <div className="flex items-center gap-2">
                <Rocket className="h-5 w-5 text-blue-400" />
                <span className="text-sm font-bold text-white">{t.plan1Name}</span>
              </div>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-2xl font-extrabold text-white">{t.plan1Price}</span>
                <span className="text-[10px] font-semibold text-neutral-500">{t.plan1Period}</span>
              </div>
              <ul className="mt-4 space-y-2 text-xs text-neutral-300">
                {[t.plan1F1, t.plan1F2, t.plan1F3].map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <Check className="h-4 w-4 shrink-0 text-emerald-400" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                asChild
                variant="outline"
                className={`mt-auto w-full rounded-full text-xs font-semibold h-9 border ${
                  isDark
                    ? "border-neutral-700 bg-transparent text-white hover:bg-neutral-800"
                    : "border-neutral-300 bg-transparent text-neutral-900 hover:bg-neutral-100"
                }`}
              >
                <Link to="/auth">Choisir ce plan</Link>
              </Button>
            </div>

            {/* Pro (highlighted) */}
            <div className="relative lg:col-span-2 rounded-3xl border-2 border-emerald-500 bg-neutral-900/60 dark:bg-neutral-900/60 p-5 flex flex-col shadow-lg shadow-emerald-500/10"
              style={isDark ? undefined : { backgroundColor: "rgba(16,185,129,0.03)" }}
            >
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-emerald-500 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                Recommandé
              </span>
              <div className="flex items-center gap-2 mt-1">
                <Star className="h-5 w-5 text-amber-400 fill-current" />
                <span className="text-sm font-bold text-white">{t.plan2Name}</span>
              </div>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-2xl font-extrabold text-white">{t.plan2Price}</span>
                <span className="text-[10px] font-semibold text-neutral-500">{t.plan2Period}</span>
              </div>
              <ul className="mt-4 space-y-2 text-xs text-neutral-200">
                {[t.plan2F1, t.plan2F2, t.plan2F3].map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <Check className="h-4 w-4 shrink-0 text-emerald-400" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                asChild
                className="mt-auto w-full rounded-full bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-semibold h-9"
              >
                <Link to="/auth">Choisir ce plan</Link>
              </Button>
            </div>

            {/* Entreprise */}
            <div
              className={`lg:col-span-2 rounded-3xl border p-5 flex flex-col ${
                isDark
                  ? "bg-neutral-900/60 border-neutral-800"
                  : "bg-white border-neutral-200 shadow-sm"
              }`}
            >
              <div className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-amber-400" />
                <span className="text-sm font-bold text-white">{t.plan3Name}</span>
              </div>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-2xl font-extrabold text-white">{t.plan3Price}</span>
                <span className="text-[10px] font-semibold text-neutral-500">{t.plan3Period}</span>
              </div>
              <ul className="mt-4 space-y-2 text-xs text-neutral-300">
                {[t.plan3F1, t.plan3F2, t.plan3F3].map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <Check className="h-4 w-4 shrink-0 text-emerald-400" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                asChild
                variant="outline"
                className={`mt-auto w-full rounded-full text-xs font-semibold h-9 border ${
                  isDark
                    ? "border-neutral-700 bg-transparent text-white hover:bg-neutral-800"
                    : "border-neutral-300 bg-transparent text-neutral-900 hover:bg-neutral-100"
                }`}
              >
                <Link to="/auth">Choisir ce plan</Link>
              </Button>
            </div>

            {/* Merchant photo */}
            <div className="lg:col-span-3 rounded-3xl overflow-hidden relative min-h-[220px]">
              <img
                src={featureMobile}
                alt="Commerçant heureux utilisant BoutikBF"
                className="absolute inset-0 h-full w-full object-cover"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-8 lg:grid-cols-12">
            <div className="lg:col-span-3 space-y-4">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-emerald-400">
                <span className="h-0.5 w-6 bg-emerald-500 rounded-full" />
                Témoignages
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight text-white">
                {t.testimonialTitle}
              </h2>
            </div>

            <div className="lg:col-span-9">
              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  { q: t.test1Quote, a: t.test1Author, r: t.test1Role, init: "AT", color: "bg-emerald-500/10 text-emerald-400" },
                  { q: t.test2Quote, a: t.test2Author, r: t.test2Role, init: "MS", color: "bg-blue-500/10 text-blue-400" },
                  { q: t.test3Quote, a: t.test3Author, r: t.test3Role, init: "MK", color: "bg-purple-500/10 text-purple-400" },
                ].map((item) => (
                  <div
                    key={item.a}
                    className={`rounded-2xl border p-5 flex flex-col ${
                      isDark
                        ? "bg-neutral-900/60 border-neutral-800"
                        : "bg-white border-neutral-200 shadow-sm"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold border border-neutral-800 ${item.color}`}
                      >
                        {item.init}
                      </span>
                      <div>
                        <div className="text-xs font-bold text-white">{item.a}</div>
                        <div className="text-[10px] text-neutral-500 uppercase tracking-wide">
                          {item.r}
                        </div>
                      </div>
                    </div>
                    <p className="mt-4 flex-1 text-sm leading-relaxed text-neutral-300">
                      « {item.q} »
                    </p>
                    <div className="mt-4 flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className="h-4 w-4 text-amber-400 fill-current" />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="pb-16 md:pb-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-8 lg:grid-cols-12">
            {/* Accordion */}
            <div className="lg:col-span-8 space-y-3">
              {[1, 2, 3].map((n) => {
                const isOpen = faqOpen === n;
                return (
                  <div key={n}>
                    <button
                      type="button"
                      onClick={() => setFaqOpen(isOpen ? null : n)}
                      aria-expanded={isOpen}
                      className={`w-full flex items-center justify-between rounded-2xl border px-5 py-4 text-left text-sm font-semibold text-white transition-colors ${
                        isDark
                          ? "bg-neutral-900/60 border-neutral-800 hover:border-neutral-700"
                          : "bg-white border-neutral-200 hover:border-neutral-300"
                      }`}
                    >
                      {n === 1 ? t.faqQ1 : n === 2 ? t.faqQ2 : t.faqQ3}
                      <Plus
                        className={`h-4 w-4 shrink-0 text-neutral-400 transition-transform ${
                          isOpen ? "rotate-45" : ""
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div
                        className={`rounded-b-2xl border border-t-0 px-5 pb-4 -mt-1 pt-4 text-xs sm:text-sm leading-relaxed text-neutral-400 ${
                          isDark
                            ? "bg-neutral-950/70 border-neutral-800"
                            : "bg-neutral-50 border-neutral-200"
                        }`}
                      >
                        {n === 1 ? t.faqA1 : n === 2 ? t.faqA2 : t.faqA3}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Heading */}
            <div className="lg:col-span-4 space-y-3 lg:text-left">
              <h2 className="text-3xl font-extrabold tracking-tight text-white">
                {t.faqTitleSection}
              </h2>
              <p className="text-sm text-neutral-400">{t.faqSubSection}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={`border-t ${isDark ? "border-neutral-900" : "border-neutral-200"}`}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
            {/* Logo + slogan */}
            <div className="flex items-center gap-2.5">
              <span className="h-7 w-7 rounded-lg bg-gradient-to-b from-emerald-400 to-emerald-600 flex items-center justify-center">
                <Store className="h-4 w-4 text-white" />
              </span>
              <span className="text-sm font-extrabold text-white">
                Boutik<span className="text-emerald-400">BF</span>
              </span>
              <span className="text-neutral-500 ml-2">{t.footerSlogan}</span>
            </div>

            {/* Legal links */}
            <LegalLinks className={`justify-center text-xs ${isDark ? "text-neutral-500" : "text-neutral-400"}`} />

            {/* Copyright + flag */}
            <div className="flex items-center gap-2 text-neutral-500">
              <span>
                © {new Date().getFullYear()} BoutikBF. {t.footerCopyright}
              </span>
              <span className="text-sm">🇧🇫</span>
            </div>
          </div>
        </div>
      </footer>

      <CookieNotice />
    </div>
  );
}
