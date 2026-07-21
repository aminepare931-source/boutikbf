import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { translations, type Language } from "@/lib/translations";
import {
  ShoppingCart,
  Package,
  Users,
  BarChart3,
  Wallet,
  Shield,
  Zap,
  Globe,
  ArrowRight,
  Check,
  Star,
  Plus,
  Minus,
  Smartphone,
  CheckCircle,
  HelpCircle,
  TrendingUp,
  Receipt,
  Building2,
  SmartphoneCharging,
  MessageSquare,
  Sparkles,
  Lock,
  ArrowUpRight,
  Tablet,
  Sun,
  Moon,
} from "lucide-react";

// Asset imports
import heroShop from "@/assets/hero-shop.jpg";
import featurePos from "@/assets/feature-pos.jpg";
import featureAnalytics from "@/assets/feature-analytics.jpg";
import featureMobile from "@/assets/feature-mobile.jpg";
import logo from "@/assets/logo.png";

export const Route = createFileRoute("/")({
  component: Landing,
});

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
}

const PRODUCTS_CATALOG: Product[] = [
  { id: "1", name: "Riz Bagré (5kg)", price: 3500, category: "Alimentation" },
  { id: "2", name: "Huile SN CITEC (1L)", price: 1200, category: "Alimentation" },
  { id: "3", name: "Ciment Dangote CPJ45 (Sac)", price: 5500, category: "Quincaillerie" },
  { id: "4", name: "Fer de 10 (U)", price: 3200, category: "Quincaillerie" },
  { id: "5", name: "Savon Kobi (Lot de 4)", price: 1000, category: "Entretien" },
  { id: "6", name: "Sucre SOSUCO (1kg)", price: 850, category: "Alimentation" },
];

export default function Landing() {
  // Localization state
  const [lang, setLang] = useState<Language>("fr");

  // Theme state (system-saved)
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  // Mouse position for interactive mesh/grid background with RAF throttle
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const mouseRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = {
        x: e.clientX / window.innerWidth - 0.5,
        y: e.clientY / window.innerHeight - 0.5,
      };

      if (!rafRef.current) {
        rafRef.current = requestAnimationFrame(() => {
          setMousePos(mouseRef.current);
          rafRef.current = null;
        });
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

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

  // Helper selectors for language flags
  const getFlagLabel = (l: Language) => {
    switch (l) {
      case "fr":
        return "FR";
      case "en":
        return "EN";
      case "mo":
        return "MO";
      case "di":
        return "DI";
    }
  };

  // Simulator Cart management
  const handleAddToCart = (product: Product) => {
    setCart((prev) => ({
      ...prev,
      [product.id]: (prev[product.id] || 0) + 1,
    }));
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

  return (
    <div
      className={`min-h-screen relative overflow-x-hidden transition-colors duration-500 font-sans ${
        isDark ? "bg-neutral-950 text-neutral-100" : "bg-neutral-50 text-neutral-900"
      }`}
    >
      {/* Flag ribbon representation (Burkina Faso red/gold/green theme banner) */}
      <div className="h-1 bg-gradient-to-r from-[#ef2b2d] via-[#fcd116] to-[#009e49] w-full fixed top-0 left-0 z-50 shadow" />

      {/* Dynamic ambient backgrounds & decorative glowing elements */}
      {/* Interactive spotlight layer with motion */}
      <motion.div
        className="absolute inset-0 pointer-events-none z-0"
        animate={{
          background: isDark
            ? `radial-gradient(850px circle at calc(50% + ${mousePos.x * 380}px) calc(50% + ${mousePos.y * 380}px), rgba(16, 185, 129, 0.08), rgba(239, 43, 45, 0.03) 35%, rgba(252, 209, 22, 0.02) 70%, transparent 100%)`
            : `radial-gradient(850px circle at calc(50% + ${mousePos.x * 380}px) calc(50% + ${mousePos.y * 380}px), rgba(16, 185, 129, 0.05), rgba(239, 43, 45, 0.02) 35%, rgba(252, 209, 22, 0.01) 70%, transparent 100%)`,
        }}
        transition={{ type: "spring", stiffness: 120, damping: 30, mass: 0.1 }}
      />

      {/* Interactive Main Grid Lines */}
      <motion.div
        className={`absolute inset-0 bg-[size:50px_50px] pointer-events-none z-0 transition-opacity duration-500 ${
          isDark
            ? "opacity-15 bg-[linear-gradient(to_right,#10b98108_1px,transparent_1px),linear-gradient(to_bottom,#10b98108_1px,transparent_1px)]"
            : "opacity-45 bg-[linear-gradient(to_right,#e2e8f0a0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0a0_1px,transparent_1px)]"
        }`}
        animate={{
          x: mousePos.x * 16,
          y: mousePos.y * 16,
        }}
        transition={{ type: "spring", stiffness: 75, damping: 20, mass: 0.6 }}
      />

      {/* Interactive Accent Dot Mesh */}
      <motion.div
        className="absolute inset-0 bg-[size:20px_20px] pointer-events-none z-0 transition-opacity duration-500 opacity-20"
        style={{
          backgroundImage: isDark
            ? "radial-gradient(#ffffff0a 1px, transparent 1px)"
            : "radial-gradient(#0f172a08 1px, transparent 1px)",
        }}
        animate={{
          x: mousePos.x * -10,
          y: mousePos.y * -10,
        }}
        transition={{ type: "spring", stiffness: 60, damping: 22, mass: 0.8 }}
      />

      {/* Warm and local ambient color glow circles (Burkina Faso red/gold/green theme) */}
      <motion.div
        className="absolute top-[5%] left-[-15%] w-[70vw] h-[70vw] rounded-full blur-[140px] pointer-events-none z-0"
        animate={{
          x: mousePos.x * -40,
          y: mousePos.y * -40,
          scale: 1 + Math.abs(mousePos.x) * 0.08,
          backgroundColor: isDark ? "rgba(16, 185, 129, 0.11)" : "rgba(16, 185, 129, 0.13)",
        }}
        transition={{ type: "spring", stiffness: 50, damping: 18, mass: 1 }}
      />
      <motion.div
        className="absolute top-[35%] right-[-15%] w-[60vw] h-[60vw] rounded-full blur-[140px] pointer-events-none z-0"
        animate={{
          x: mousePos.x * 50,
          y: mousePos.y * 50,
          scale: 1 + Math.abs(mousePos.y) * 0.08,
          backgroundColor: isDark ? "rgba(252, 209, 22, 0.07)" : "rgba(252, 209, 22, 0.11)",
        }}
        style={{
          // Fallback if yellow/gold name differs
          backgroundColor: isDark ? "rgba(252, 209, 22, 0.07)" : "rgba(252, 209, 22, 0.11)",
        }}
        transition={{ type: "spring", stiffness: 45, damping: 16, mass: 1.2 }}
      />
      <motion.div
        className="absolute bottom-[10%] left-[-5%] w-[55vw] h-[55vw] rounded-full blur-[140px] pointer-events-none z-0"
        animate={{
          x: mousePos.x * -25,
          y: mousePos.y * 35,
          backgroundColor: isDark ? "rgba(239, 43, 45, 0.07)" : "rgba(239, 43, 45, 0.07)",
        }}
        transition={{ type: "spring", stiffness: 55, damping: 20, mass: 0.9 }}
      />

      {/* Header / Navbar */}
      <header
        className={`sticky top-2.5 z-40 border backdrop-blur-lg mx-4 my-3 rounded-2xl max-w-7xl lg:mx-auto transition-all duration-300 shadow-md ${
          isDark
            ? "border-neutral-800/80 bg-neutral-950/80 shadow-black/40"
            : "border-neutral-200 bg-white/80 shadow-neutral-200/30"
        }`}
      >
        <div className="mx-auto flex items-center justify-between px-4 sm:px-6 py-3">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <img
              src={logo}
              alt="BoutikBF Logo"
              className="h-8.5 w-auto object-contain group-hover:scale-105 transition-transform"
            />
            <span
              className={`font-display text-lg sm:text-xl font-extrabold tracking-tight bg-gradient-to-r bg-clip-text text-transparent ${
                isDark
                  ? "from-neutral-50 via-neutral-100 to-neutral-400"
                  : "from-neutral-900 via-neutral-800 to-neutral-600"
              }`}
            >
              Boutik<span className="text-emerald-500">BF</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-bold uppercase tracking-wider">
            <a
              href="#features"
              className={`transition-colors ${
                isDark
                  ? "text-neutral-400 hover:text-emerald-400"
                  : "text-neutral-600 hover:text-emerald-600"
              }`}
            >
              {t.navFeatures}
            </a>
            <a
              href="#products"
              className={`transition-colors ${
                isDark
                  ? "text-neutral-400 hover:text-emerald-400"
                  : "text-neutral-600 hover:text-emerald-600"
              }`}
            >
              {t.navSoftware}
            </a>
            <a
              href="#simulator"
              className={`transition-colors ${
                isDark
                  ? "text-neutral-400 hover:text-emerald-400"
                  : "text-neutral-600 hover:text-emerald-600"
              }`}
            >
              {t.navDemo}
            </a>
            <a
              href="#pricing"
              className={`transition-colors ${
                isDark
                  ? "text-neutral-400 hover:text-emerald-400"
                  : "text-neutral-600 hover:text-emerald-600"
              }`}
            >
              {t.navPricing}
            </a>
            <a
              href="#faq"
              className={`transition-colors ${
                isDark
                  ? "text-neutral-400 hover:text-emerald-400"
                  : "text-neutral-600 hover:text-emerald-600"
              }`}
            >
              {t.navFaq}
            </a>
          </nav>

          {/* Right section widgets: Language switcher, Theme toggle & Authentication Links */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Interactive Language Dropdown */}
            <div className="relative inline-block">
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value as Language)}
                className={`text-[11px] font-black tracking-wider rounded-xl py-1.5 pl-2.5 pr-6 border appearance-none cursor-pointer focus:outline-none focus:ring-1 transition-all ${
                  isDark
                    ? "bg-neutral-900 border-neutral-800 text-neutral-300 focus:ring-emerald-500/50"
                    : "bg-white border-neutral-200 text-neutral-700 focus:ring-emerald-500/50 shadow-sm"
                }`}
                style={{
                  backgroundImage: `url("data:image/svg+xml;utf8,<svg fill='none' stroke='${
                    isDark ? "currentColor" : "%234b5563"
                  }' stroke-width='2' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'><path stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'></path></svg>")`,
                  backgroundPosition: "right 8px center",
                  backgroundSize: "10px",
                  backgroundRepeat: "no-repeat",
                }}
              >
                <option value="fr">🇫🇷 FR</option>
                <option value="en">🇬🇧 EN</option>
                <option value="mo">🇧🇫 MO</option>
                <option value="di">🇧🇫 DI</option>
              </select>
            </div>

            {/* Theme Switcher Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(isDark ? "light" : "dark")}
              className={`rounded-xl h-8.5 w-8.5 transition-all ${
                isDark
                  ? "text-neutral-400 hover:text-amber-400 hover:bg-neutral-900"
                  : "text-neutral-500 hover:text-blue-600 hover:bg-neutral-100"
              }`}
              title={isDark ? "Mode Jour" : "Mode Nuit"}
            >
              {isDark ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
            </Button>

            {/* Login Button */}
            <Link to="/auth">
              <Button
                variant="ghost"
                className={`text-xs font-bold uppercase tracking-wider px-3.5 h-8.5 rounded-xl transition-colors ${
                  isDark
                    ? "text-neutral-300 hover:text-neutral-50 hover:bg-neutral-900"
                    : "text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100"
                }`}
              >
                {t.login}
              </Button>
            </Link>

            {/* Free Trial CTA */}
            <Link to="/auth" className="hidden sm:inline-block">
              <Button className="text-xs font-extrabold uppercase tracking-wider bg-emerald-600 hover:bg-emerald-500 text-white px-4 h-8.5 rounded-xl shadow-md transition-all duration-300">
                {t.freeTrial}
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section
        className={`relative pt-10 pb-20 md:py-32 border-b transition-colors duration-300 ${
          isDark ? "border-neutral-900" : "border-neutral-200"
        }`}
      >
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-12 lg:grid-cols-12 items-center">
            {/* Left Column: Brand description & action plans */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <div
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-bold transition-colors ${
                  isDark
                    ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-400"
                    : "border-emerald-500/30 bg-emerald-500/10 text-emerald-700"
                }`}
              >
                <Sparkles className="h-3.5 w-3.5 animate-pulse text-emerald-500" />
                <span>{t.badge}</span>
              </div>

              <h1
                className={`font-display text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.05] transition-colors ${
                  isDark ? "text-neutral-50" : "text-neutral-900"
                }`}
              >
                {t.heroTitlePre}
                <span className="bg-gradient-to-r from-emerald-400 via-emerald-500 to-amber-400 bg-clip-text text-transparent">
                  {t.heroTitleHighlight}
                </span>
              </h1>

              <p
                className={`text-base sm:text-lg leading-relaxed max-w-2xl transition-colors ${
                  isDark ? "text-neutral-400" : "text-neutral-600"
                }`}
              >
                {t.heroDesc}
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
                <Link to="/auth" className="w-full sm:w-auto">
                  <Button className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-8 py-6 rounded-xl shadow-lg hover:shadow-emerald-500/10 transition-all duration-300 flex items-center justify-center gap-2 text-sm">
                    <span>{t.btnTryFree}</span>
                    <ArrowRight className="h-4.5 w-4.5" />
                  </Button>
                </Link>

                <a href="#simulator" className="w-full sm:w-auto">
                  <Button
                    variant="outline"
                    className={`w-full sm:w-auto px-8 py-6 text-sm font-bold rounded-xl border transition-colors ${
                      isDark
                        ? "border-neutral-800 text-neutral-200 hover:bg-neutral-900 hover:text-white"
                        : "border-neutral-300 text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900"
                    }`}
                  >
                    {t.btnTestSim}
                  </Button>
                </a>
              </div>

              {/* Trust Indicators */}
              <div
                className={`grid grid-cols-3 gap-4 sm:gap-6 pt-8 mt-8 border-t transition-colors ${
                  isDark ? "border-neutral-900" : "border-neutral-200"
                }`}
              >
                <div>
                  <div
                    className={`text-2xl font-black ${isDark ? "text-neutral-100" : "text-neutral-900"}`}
                  >
                    500+
                  </div>
                  <p className="text-[10px] sm:text-xs text-neutral-500 font-bold uppercase tracking-wider mt-1">
                    {t.activeBoutiques}
                  </p>
                </div>
                <div>
                  <div
                    className={`text-2xl font-black ${isDark ? "text-neutral-100" : "text-neutral-900"}`}
                  >
                    HORS-LIGNE
                  </div>
                  <p className="text-[10px] sm:text-xs text-neutral-500 font-bold uppercase tracking-wider mt-1">
                    {t.worksOffline}
                  </p>
                </div>
                <div>
                  <div
                    className={`text-2xl font-black ${isDark ? "text-neutral-100" : "text-neutral-900"}`}
                  >
                    SYSCOHADA
                  </div>
                  <p className="text-[10px] sm:text-xs text-neutral-500 font-bold uppercase tracking-wider mt-1">
                    {t.compliant}
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column: Premium Photography Frame Layout */}
            <div className="lg:col-span-5 relative w-full flex justify-center items-center">
              {/* Backglow shadow effect */}
              <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/20 to-amber-500/10 rounded-3xl blur-2xl transform rotate-2 pointer-events-none scale-105" />

              {/* High-quality hardware display block wrapping the real storefront photo */}
              <div
                className={`relative border p-3.5 shadow-2xl rounded-3xl max-w-full overflow-hidden transition-colors duration-300 ${
                  isDark ? "bg-neutral-900 border-neutral-800" : "bg-white border-neutral-200"
                }`}
              >
                {/* Header browser-like bar */}
                <div
                  className={`flex gap-1.5 pb-2.5 px-1 border-b ${
                    isDark ? "border-neutral-800" : "border-neutral-100"
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                  <span className="ml-auto text-[9px] font-mono font-bold text-neutral-500 tracking-wider">
                    BOUTIKBF-LIVE-SYSTEM
                  </span>
                </div>

                {/* Picture element */}
                <div className="relative rounded-2xl overflow-hidden aspect-[4/3] group">
                  <img
                    src={heroShop}
                    alt="Boutique moderne au Burkina Faso gérée avec BoutikBF"
                    className="w-full h-full object-cover brightness-95 group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/20 to-transparent" />

                  {/* Floating caption overlay */}
                  <div
                    className={`absolute bottom-3 left-3 right-3 backdrop-blur-md border p-3 rounded-xl flex items-center justify-between shadow-lg transition-all ${
                      isDark
                        ? "bg-neutral-950/80 border-neutral-800"
                        : "bg-white/90 border-neutral-200"
                    }`}
                  >
                    <div>
                      <div className="text-[9px] uppercase font-bold tracking-widest text-emerald-500">
                        SYSTEM STATUS: ACTIVE
                      </div>
                      <div
                        className={`text-xs font-bold mt-0.5 ${isDark ? "text-white" : "text-neutral-900"}`}
                      >
                        Alimentation Ouaga 2000
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-[9px] font-bold text-emerald-500 tracking-wider font-mono">
                        LIVE
                      </span>
                    </div>
                  </div>
                </div>

                {/* Floating widgets */}
                <div
                  className={`absolute top-8 -left-6 border p-3 rounded-2xl shadow-xl flex items-center gap-2.5 hover:translate-y-[-2px] transition-all max-w-[190px] ${
                    isDark
                      ? "bg-neutral-950 border-neutral-800 text-white"
                      : "bg-white border-neutral-200 text-neutral-900"
                  }`}
                >
                  <div className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold text-xs shrink-0">
                    OM
                  </div>
                  <div>
                    <div className="text-[8px] uppercase font-extrabold text-neutral-500">
                      Orange Money
                    </div>
                    <div className="text-xs font-black">+45 000 F</div>
                  </div>
                </div>

                <div
                  className={`absolute -bottom-3 -right-3 border p-3 rounded-2xl shadow-xl flex items-center gap-2.5 hover:translate-y-[-2px] transition-all ${
                    isDark
                      ? "bg-neutral-950 border-neutral-800 text-white"
                      : "bg-white border-neutral-200 text-neutral-900"
                  }`}
                >
                  <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-[8px] uppercase font-extrabold text-neutral-500">
                      Marge Mensuelle
                    </div>
                    <div className="text-xs font-black text-emerald-500">+28.4%</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Corporate Features Bento Grid */}
      <section
        id="features"
        className={`py-24 border-b relative ${
          isDark ? "border-neutral-900 bg-neutral-950" : "border-neutral-200 bg-white"
        }`}
      >
        <div
          className={`absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-neutral-800 to-transparent ${
            isDark ? "via-neutral-800" : "via-neutral-200"
          }`}
        />

        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2
              className={`font-display text-3xl sm:text-5xl font-black tracking-tight leading-tight transition-colors ${
                isDark ? "text-white" : "text-neutral-900"
              }`}
            >
              {t.featuresTitle}
            </h2>
            <p
              className={`mt-4 text-sm sm:text-base max-w-xl mx-auto leading-relaxed transition-colors ${
                isDark ? "text-neutral-400" : "text-neutral-600"
              }`}
            >
              {t.featuresSub}
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1 */}
            <div
              className={`border rounded-3xl p-8 transition-all duration-300 shadow-lg group hover:-translate-y-1 ${
                isDark
                  ? "border-neutral-800/80 bg-neutral-900/40 hover:bg-neutral-900/70 hover:border-neutral-700/60"
                  : "border-neutral-200 bg-stone-50 hover:bg-stone-100/50 hover:border-neutral-300 hover:shadow-xl"
              }`}
            >
              <div className="h-11 w-11 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <ShoppingCart className="h-5.5 w-5.5" />
              </div>
              <h3
                className={`text-lg font-bold tracking-wide ${isDark ? "text-white" : "text-neutral-900"}`}
              >
                {t.posTitle}
              </h3>
              <p
                className={`mt-3 text-sm leading-relaxed ${isDark ? "text-neutral-400" : "text-neutral-600"}`}
              >
                {t.posDesc}
              </p>
              <div
                className={`mt-6 pt-4 border-t flex items-center justify-between text-xs font-bold ${
                  isDark
                    ? "border-neutral-800/80 text-neutral-500"
                    : "border-neutral-200 text-neutral-400"
                }`}
              >
                <span>{t.posFooter}</span>
                <span className="text-emerald-500 uppercase tracking-widest text-[9px]">POS</span>
              </div>
            </div>

            {/* Feature 2 */}
            <div
              className={`border rounded-3xl p-8 transition-all duration-300 shadow-lg group hover:-translate-y-1 ${
                isDark
                  ? "border-neutral-800/80 bg-neutral-900/40 hover:bg-neutral-900/70 hover:border-neutral-700/60"
                  : "border-neutral-200 bg-stone-50 hover:bg-stone-100/50 hover:border-neutral-300 hover:shadow-xl"
              }`}
            >
              <div className="h-11 w-11 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Package className="h-5.5 w-5.5" />
              </div>
              <h3
                className={`text-lg font-bold tracking-wide ${isDark ? "text-white" : "text-neutral-900"}`}
              >
                {t.stockTitle}
              </h3>
              <p
                className={`mt-3 text-sm leading-relaxed ${isDark ? "text-neutral-400" : "text-neutral-600"}`}
              >
                {t.stockDesc}
              </p>
              <div
                className={`mt-6 pt-4 border-t flex items-center justify-between text-xs font-bold ${
                  isDark
                    ? "border-neutral-800/80 text-neutral-500"
                    : "border-neutral-200 text-neutral-400"
                }`}
              >
                <span>{t.stockFooter}</span>
                <span className="text-amber-500 uppercase tracking-widest text-[9px]">STOCKS</span>
              </div>
            </div>

            {/* Feature 3 */}
            <div
              className={`border rounded-3xl p-8 transition-all duration-300 shadow-lg group hover:-translate-y-1 ${
                isDark
                  ? "border-neutral-800/80 bg-neutral-900/40 hover:bg-neutral-900/70 hover:border-neutral-700/60"
                  : "border-neutral-200 bg-stone-50 hover:bg-stone-100/50 hover:border-neutral-300 hover:shadow-xl"
              }`}
            >
              <div className="h-11 w-11 rounded-2xl bg-red-500/10 text-[#ef2b2d] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <SmartphoneCharging className="h-5.5 w-5.5" />
              </div>
              <h3
                className={`text-lg font-bold tracking-wide ${isDark ? "text-white" : "text-neutral-900"}`}
              >
                {t.mobileMoneyTitle}
              </h3>
              <p
                className={`mt-3 text-sm leading-relaxed ${isDark ? "text-neutral-400" : "text-neutral-600"}`}
              >
                {t.mobileMoneyDesc}
              </p>
              <div
                className={`mt-6 pt-4 border-t flex items-center justify-between text-xs font-bold ${
                  isDark
                    ? "border-neutral-800/80 text-neutral-500"
                    : "border-neutral-200 text-neutral-400"
                }`}
              >
                <span>{t.mobileMoneyFooter}</span>
                <span className="text-[#ef2b2d] uppercase tracking-widest text-[9px]">PAY</span>
              </div>
            </div>

            {/* Feature 4 */}
            <div
              className={`border rounded-3xl p-8 transition-all duration-300 shadow-lg group hover:-translate-y-1 ${
                isDark
                  ? "border-neutral-800/80 bg-neutral-900/40 hover:bg-neutral-900/70 hover:border-neutral-700/60"
                  : "border-neutral-200 bg-stone-50 hover:bg-stone-100/50 hover:border-neutral-300 hover:shadow-xl"
              }`}
            >
              <div className="h-11 w-11 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Users className="h-5.5 w-5.5" />
              </div>
              <h3
                className={`text-lg font-bold tracking-wide ${isDark ? "text-white" : "text-neutral-900"}`}
              >
                {t.crmTitle}
              </h3>
              <p
                className={`mt-3 text-sm leading-relaxed ${isDark ? "text-neutral-400" : "text-neutral-600"}`}
              >
                {t.crmDesc}
              </p>
              <div
                className={`mt-6 pt-4 border-t flex items-center justify-between text-xs font-bold ${
                  isDark
                    ? "border-neutral-800/80 text-neutral-500"
                    : "border-neutral-200 text-neutral-400"
                }`}
              >
                <span>{t.crmFooter}</span>
                <span className="text-blue-500 uppercase tracking-widest text-[9px]">CRM</span>
              </div>
            </div>

            {/* Feature 5 */}
            <div
              className={`border rounded-3xl p-8 transition-all duration-300 shadow-lg group hover:-translate-y-1 ${
                isDark
                  ? "border-neutral-800/80 bg-neutral-900/40 hover:bg-neutral-900/70 hover:border-neutral-700/60"
                  : "border-neutral-200 bg-stone-50 hover:bg-stone-100/50 hover:border-neutral-300 hover:shadow-xl"
              }`}
            >
              <div className="h-11 w-11 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Wallet className="h-5.5 w-5.5" />
              </div>
              <h3
                className={`text-lg font-bold tracking-wide ${isDark ? "text-white" : "text-neutral-900"}`}
              >
                {t.accountingTitle}
              </h3>
              <p
                className={`mt-3 text-sm leading-relaxed ${isDark ? "text-neutral-400" : "text-neutral-600"}`}
              >
                {t.accountingDesc}
              </p>
              <div
                className={`mt-6 pt-4 border-t flex items-center justify-between text-xs font-bold ${
                  isDark
                    ? "border-neutral-800/80 text-neutral-500"
                    : "border-neutral-200 text-neutral-400"
                }`}
              >
                <span>{t.accountingFooter}</span>
                <span className="text-purple-500 uppercase tracking-widest text-[9px]">COMPTA</span>
              </div>
            </div>

            {/* Feature 6 */}
            <div
              className={`border rounded-3xl p-8 transition-all duration-300 shadow-lg group hover:-translate-y-1 ${
                isDark
                  ? "border-neutral-800/80 bg-neutral-900/40 hover:bg-neutral-900/70 hover:border-neutral-700/60"
                  : "border-neutral-200 bg-stone-50 hover:bg-stone-100/50 hover:border-neutral-300 hover:shadow-xl"
              }`}
            >
              <div className="h-11 w-11 rounded-2xl bg-neutral-500/10 text-neutral-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Shield className="h-5.5 w-5.5" />
              </div>
              <h3
                className={`text-lg font-bold tracking-wide ${isDark ? "text-white" : "text-neutral-900"}`}
              >
                {t.securityTitle}
              </h3>
              <p
                className={`mt-3 text-sm leading-relaxed ${isDark ? "text-neutral-400" : "text-neutral-600"}`}
              >
                {t.securityDesc}
              </p>
              <div
                className={`mt-6 pt-4 border-t flex items-center justify-between text-xs font-bold ${
                  isDark
                    ? "border-neutral-800/80 text-neutral-500"
                    : "border-neutral-200 text-neutral-400"
                }`}
              >
                <span>{t.securityFooter}</span>
                <span className="text-neutral-400 uppercase tracking-widest text-[9px]">
                  SECURITY
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product Showcase Sections (THE SOFTWARE IN ACTION WITH REAL PHOTOS) */}
      <section
        id="products"
        className={`py-24 border-b relative ${
          isDark ? "bg-neutral-900/10 border-neutral-900" : "bg-neutral-50/50 border-neutral-200"
        }`}
      >
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2
              className={`font-display text-3xl sm:text-5xl font-black ${isDark ? "text-white" : "text-neutral-900"}`}
            >
              {t.showcaseTitle}
            </h2>
            <p
              className={`mt-4 text-sm sm:text-base ${isDark ? "text-neutral-400" : "text-neutral-600"}`}
            >
              {t.showcaseSub}
            </p>
          </div>

          <div className="space-y-32">
            {/* Showcase 1: POS & Selling */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-6 space-y-6 text-left">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-bold uppercase tracking-wider">
                  {t.showcase1Tag}
                </div>
                <h3
                  className={`text-2xl sm:text-4xl font-extrabold tracking-tight ${isDark ? "text-white" : "text-neutral-900"}`}
                >
                  {t.showcase1Title}
                </h3>
                <p
                  className={`text-sm leading-relaxed ${isDark ? "text-neutral-400" : "text-neutral-600"}`}
                >
                  {t.showcase1Desc}
                </p>

                <ul className="space-y-3 pt-2 text-xs font-semibold">
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
                    <span>{t.showcase1F1}</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
                    <span>{t.showcase1F2}</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
                    <span>{t.showcase1F3}</span>
                  </li>
                </ul>
              </div>

              <div className="lg:col-span-6">
                <div
                  className={`border p-3 rounded-2xl shadow-xl overflow-hidden transition-colors duration-300 ${
                    isDark ? "bg-neutral-900 border-neutral-800" : "bg-white border-neutral-200"
                  }`}
                >
                  <img
                    src={featurePos}
                    alt="Interface de caisse rapide tactile BoutikBF"
                    className="w-full h-auto rounded-xl object-cover aspect-[4/3] brightness-95"
                  />
                  <div className="p-3 text-left border-t border-neutral-800/10 mt-3">
                    <span className="text-[10px] font-mono uppercase font-black text-neutral-500 tracking-wider">
                      Module Caisse Tactile — Version iPad/Tablette
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Showcase 2: Inventory & Mobile App */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-6 lg:order-2 space-y-6 text-left">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-bold uppercase tracking-wider">
                  {t.showcase2Tag}
                </div>
                <h3
                  className={`text-2xl sm:text-4xl font-extrabold tracking-tight ${isDark ? "text-white" : "text-neutral-900"}`}
                >
                  {t.showcase2Title}
                </h3>
                <p
                  className={`text-sm leading-relaxed ${isDark ? "text-neutral-400" : "text-neutral-600"}`}
                >
                  {t.showcase2Desc}
                </p>

                <ul className="space-y-3 pt-2 text-xs font-semibold">
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4.5 w-4.5 text-amber-500 shrink-0" />
                    <span>{t.showcase2F1}</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4.5 w-4.5 text-amber-500 shrink-0" />
                    <span>{t.showcase2F2}</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4.5 w-4.5 text-amber-500 shrink-0" />
                    <span>{t.showcase2F3}</span>
                  </li>
                </ul>
              </div>

              <div className="lg:col-span-6 lg:order-1">
                <div
                  className={`border p-3 rounded-2xl shadow-xl overflow-hidden transition-colors duration-300 ${
                    isDark ? "bg-neutral-900 border-neutral-800" : "bg-white border-neutral-200"
                  }`}
                >
                  <img
                    src={featureMobile}
                    alt="Application smartphone pour inventaire de stock BoutikBF"
                    className="w-full h-auto rounded-xl object-cover aspect-[4/3] brightness-95"
                  />
                  <div className="p-3 text-left border-t border-neutral-800/10 mt-3">
                    <span className="text-[10px] font-mono uppercase font-black text-neutral-500 tracking-wider">
                      Module Mobile — Code-barres par caméra mobile
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Showcase 3: Reports & Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-6 space-y-6 text-left">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-500 text-xs font-bold uppercase tracking-wider">
                  {t.showcase3Tag}
                </div>
                <h3
                  className={`text-2xl sm:text-4xl font-extrabold tracking-tight ${isDark ? "text-white" : "text-neutral-900"}`}
                >
                  {t.showcase3Title}
                </h3>
                <p
                  className={`text-sm leading-relaxed ${isDark ? "text-neutral-400" : "text-neutral-600"}`}
                >
                  {t.showcase3Desc}
                </p>

                <ul className="space-y-3 pt-2 text-xs font-semibold">
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4.5 w-4.5 text-purple-500 shrink-0" />
                    <span>{t.showcase3F1}</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4.5 w-4.5 text-purple-500 shrink-0" />
                    <span>{t.showcase3F2}</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4.5 w-4.5 text-purple-500 shrink-0" />
                    <span>{t.showcase3F3}</span>
                  </li>
                </ul>
              </div>

              <div className="lg:col-span-6">
                <div
                  className={`border p-3 rounded-2xl shadow-xl overflow-hidden transition-colors duration-300 ${
                    isDark ? "bg-neutral-900 border-neutral-800" : "bg-white border-neutral-200"
                  }`}
                >
                  <img
                    src={featureAnalytics}
                    alt="Tableau de bord financier comptable BoutikBF"
                    className="w-full h-auto rounded-xl object-cover aspect-[4/3] brightness-95"
                  />
                  <div className="p-3 text-left border-t border-neutral-800/10 mt-3">
                    <span className="text-[10px] font-mono uppercase font-black text-neutral-500 tracking-wider">
                      Module Rapports — Graphique chiffre d'affaires & profits
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Sandbox POS Simulator */}
      <section
        id="simulator"
        className={`py-24 border-b relative ${
          isDark ? "bg-neutral-950 border-neutral-900" : "bg-neutral-50 border-neutral-200"
        }`}
      >
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-bold uppercase tracking-widest mb-4">
              SANDBOX SIMULATOR
            </div>
            <h2
              className={`font-display text-3xl sm:text-5xl font-black ${isDark ? "text-white" : "text-neutral-900"}`}
            >
              {t.simulatorTitle}
            </h2>
            <p
              className={`mt-3 text-sm sm:text-base ${isDark ? "text-neutral-400" : "text-neutral-600"}`}
            >
              {t.simulatorSub}
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-12 max-w-6xl mx-auto items-start">
            {/* Catalog list */}
            <div className="lg:col-span-7">
              <div
                className={`border rounded-2xl overflow-hidden transition-colors duration-300 ${
                  isDark
                    ? "bg-neutral-900/50 border-neutral-800/80"
                    : "bg-white border-neutral-200 shadow-lg"
                }`}
              >
                <div
                  className={`px-6 py-4 border-b flex justify-between items-center ${
                    isDark ? "border-neutral-800/80" : "border-neutral-100"
                  }`}
                >
                  <span
                    className={`text-xs font-bold uppercase tracking-wider ${isDark ? "text-neutral-400" : "text-neutral-500"}`}
                  >
                    {t.simulatorCatalog}
                  </span>
                  <span className="text-[9px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                    6 ARTICLES
                  </span>
                </div>

                <div className="p-4 sm:p-6 grid gap-4 sm:grid-cols-2">
                  {PRODUCTS_CATALOG.map((item) => {
                    const quantity = cart[item.id] || 0;
                    return (
                      <div
                        key={item.id}
                        onClick={() => handleAddToCart(item)}
                        className={`border rounded-xl p-4 cursor-pointer text-left transition-all duration-300 flex items-center justify-between ${
                          isDark
                            ? "border-neutral-800 bg-neutral-900/20 hover:bg-neutral-900 hover:border-neutral-700/80"
                            : "border-neutral-200 bg-neutral-50/50 hover:bg-neutral-100/50 shadow-sm"
                        }`}
                      >
                        <div>
                          <span
                            className={`text-[9px] uppercase font-bold tracking-widest ${
                              item.category === "Alimentation"
                                ? "text-emerald-500"
                                : item.category === "Quincaillerie"
                                  ? "text-amber-500"
                                  : "text-purple-500"
                            }`}
                          >
                            {item.category}
                          </span>
                          <h4
                            className={`text-sm font-bold mt-1 ${isDark ? "text-neutral-100" : "text-neutral-900"}`}
                          >
                            {item.name}
                          </h4>
                          <span
                            className={`text-xs font-mono font-bold mt-1 block ${isDark ? "text-neutral-400" : "text-neutral-600"}`}
                          >
                            {item.price.toLocaleString("fr-FR")} F CFA
                          </span>
                        </div>

                        {quantity > 0 ? (
                          <div className="h-8.5 w-8.5 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                            +{quantity}
                          </div>
                        ) : (
                          <div
                            className={`h-8.5 w-8.5 rounded-lg flex items-center justify-center transition-colors ${
                              isDark
                                ? "bg-neutral-950 text-neutral-400 hover:text-white"
                                : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200"
                            }`}
                          >
                            <Plus className="h-4 w-4" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Cart and payment receipt */}
            <div className="lg:col-span-5">
              <div
                className={`border rounded-2xl p-6 text-left transition-colors duration-300 ${
                  isDark
                    ? "bg-neutral-900 border-neutral-800"
                    : "bg-white border-neutral-200 shadow-xl"
                }`}
              >
                <div className="flex justify-between items-center mb-6">
                  <h3
                    className={`text-sm font-bold uppercase tracking-wider ${isDark ? "text-neutral-200" : "text-neutral-700"}`}
                  >
                    {t.simulatorCart}
                  </h3>
                  {Object.keys(cart).length > 0 && (
                    <button
                      onClick={handleClearCart}
                      className="text-[10px] font-bold text-red-500 hover:underline"
                    >
                      Vider
                    </button>
                  )}
                </div>

                {/* Empty Cart */}
                {Object.keys(cart).length === 0 ? (
                  <div className="py-12 text-center">
                    <ShoppingCart className="h-10 w-10 text-neutral-500 mx-auto mb-4 stroke-1" />
                    <p
                      className={`text-xs leading-relaxed max-w-xs mx-auto ${isDark ? "text-neutral-500" : "text-neutral-400"}`}
                    >
                      {t.simulatorEmptyCart}
                    </p>
                  </div>
                ) : !posSuccess ? (
                  /* Active Basket view */
                  <div className="space-y-6">
                    <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                      {Object.entries(cart).map(([id, qty]) => {
                        const item = PRODUCTS_CATALOG.find((p) => p.id === id);
                        if (!item) return null;
                        return (
                          <div
                            key={id}
                            className={`flex items-center justify-between p-3 rounded-xl border ${
                              isDark
                                ? "bg-neutral-950/60 border-neutral-800"
                                : "bg-neutral-50 border-neutral-100"
                            }`}
                          >
                            <div className="text-left">
                              <h4
                                className={`text-xs font-bold ${isDark ? "text-white" : "text-neutral-900"}`}
                              >
                                {item.name}
                              </h4>
                              <span className="text-[10px] text-neutral-500 font-semibold font-mono">
                                {qty} x {item.price} F CFA
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleRemoveOne(id)}
                                className={`h-6.5 w-6.5 rounded-md flex items-center justify-center transition-all ${
                                  isDark
                                    ? "bg-neutral-900 text-neutral-400 hover:text-white"
                                    : "bg-neutral-200/60 text-neutral-600 hover:bg-neutral-200"
                                }`}
                              >
                                <Minus className="h-3 w-3" />
                              </button>
                              <span className="text-xs font-black min-w-[15px] text-center">
                                {qty}
                              </span>
                              <button
                                onClick={() => handleAddToCart(item)}
                                className={`h-6.5 w-6.5 rounded-md flex items-center justify-center transition-all ${
                                  isDark
                                    ? "bg-neutral-900 text-neutral-400 hover:text-white"
                                    : "bg-neutral-200/60 text-neutral-600 hover:bg-neutral-200"
                                }`}
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Pricing total */}
                    <div
                      className={`border-t pt-4 ${isDark ? "border-neutral-800" : "border-neutral-100"}`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                          {t.simulatorTotal}
                        </span>
                        <span
                          className={`text-xl font-black font-mono ${isDark ? "text-emerald-400" : "text-emerald-700"}`}
                        >
                          {getCartTotal().toLocaleString("fr-FR")} F CFA
                        </span>
                      </div>
                    </div>

                    {/* Payment choices */}
                    <div className="space-y-3">
                      <span className="text-[9px] uppercase font-extrabold text-neutral-500 tracking-wider">
                        Moyen de règlement
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { id: "orange", label: "Orange Money" },
                          { id: "moov", label: "Moov Money" },
                          { id: "wave", label: "Wave" },
                          { id: "cash", label: "Espèces" },
                        ].map((m) => (
                          <button
                            key={m.id}
                            onClick={() =>
                              setPaymentMethod(m.id as "orange" | "moov" | "wave" | "cash")
                            }
                            className={`border px-3 py-2.5 rounded-xl text-xs font-bold uppercase transition-all ${
                              paymentMethod === m.id
                                ? "border-emerald-500 bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500"
                                : isDark
                                  ? "border-neutral-800 bg-neutral-950/60 text-neutral-400 hover:border-neutral-700"
                                  : "border-neutral-200 bg-neutral-50 text-neutral-600 hover:bg-neutral-100 shadow-sm"
                            }`}
                          >
                            {m.label}
                          </button>
                        ))}
                      </div>

                      <Button
                        onClick={handleValidateSale}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-5 rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-emerald-600/10"
                      >
                        {t.simulatorPayBtn}
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* Print Receipt Success state */
                  <div className="space-y-6">
                    <div className="text-center space-y-2">
                      <div className="h-12 w-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto border border-emerald-500/20">
                        <CheckCircle className="h-6 w-6" />
                      </div>
                      <h4
                        className={`text-base font-black ${isDark ? "text-white" : "text-neutral-900"}`}
                      >
                        {t.simulatorReceiptTitle}
                      </h4>
                      <p className={`text-xs ${isDark ? "text-neutral-400" : "text-neutral-500"}`}>
                        {t.simulatorReceiptDesc}
                      </p>
                    </div>

                    {/* Paper thermal receipt style render */}
                    <div className="bg-white text-neutral-900 border border-neutral-300 p-5 rounded-xl shadow-md font-mono text-[10px] space-y-3.5 relative overflow-hidden">
                      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 to-amber-500" />

                      <div className="text-center font-bold border-b border-dashed border-neutral-300 pb-3">
                        <div className="text-xs uppercase font-black">BOUTIKBF POS</div>
                        <div>BOUTIQUE PILOTE - OUAGA</div>
                        <div className="font-normal mt-1">TEL: +226 25 30 00 00</div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span>Reçu N°:</span>
                          <span className="font-bold">{posReceiptNo}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Date:</span>
                          <span>{new Date().toLocaleDateString("fr-FR")}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Règlement:</span>
                          <span className="font-bold uppercase">{paymentMethod}</span>
                        </div>
                      </div>

                      <div className="border-t border-b border-dashed border-neutral-300 py-2.5 my-2 space-y-1.5">
                        {Object.entries(cart).map(([id, qty]) => {
                          const item = PRODUCTS_CATALOG.find((p) => p.id === id);
                          if (!item) return null;
                          return (
                            <div key={id} className="flex justify-between">
                              <span>
                                {item.name} (x{qty})
                              </span>
                              <span>{(item.price * qty).toLocaleString("fr-FR")} F CFA</span>
                            </div>
                          );
                        })}
                      </div>

                      <div className="flex justify-between text-xs font-black pt-1">
                        <span>NET A PAYER:</span>
                        <span>{getCartTotal().toLocaleString("fr-FR")} F CFA</span>
                      </div>

                      <div className="text-center text-[9px] text-neutral-500 font-sans border-t border-dashed border-neutral-300 pt-3">
                        Merci de votre visite à bientôt !<br />
                        BoutikBF — Logiciel de caisse professionnel
                      </div>
                    </div>

                    <Button
                      onClick={handleClearCart}
                      className={`w-full font-bold py-4 rounded-xl text-xs uppercase tracking-wider ${
                        isDark
                          ? "bg-neutral-800 hover:bg-neutral-700 text-white"
                          : "bg-neutral-100 hover:bg-neutral-200 text-neutral-800"
                      }`}
                    >
                      {t.simulatorReceiptNewSale}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Plans */}
      <section
        id="pricing"
        className={`py-24 border-b relative ${
          isDark ? "bg-neutral-900/10 border-neutral-900" : "bg-white border-neutral-200"
        }`}
      >
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2
              className={`font-display text-3xl sm:text-5xl font-black tracking-tight leading-tight transition-colors ${
                isDark ? "text-white" : "text-neutral-900"
              }`}
            >
              {t.pricingTitle}
            </h2>
            <p
              className={`mt-4 text-sm sm:text-base ${isDark ? "text-neutral-400" : "text-neutral-600"}`}
            >
              {t.pricingSub}
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto items-stretch">
            {/* Plan 1 */}
            <div
              className={`border rounded-3xl p-8 flex flex-col justify-between transition-all duration-300 shadow-md hover:-translate-y-1 ${
                isDark
                  ? "border-neutral-800/80 bg-neutral-900/30 hover:border-neutral-700/60"
                  : "border-neutral-200 bg-stone-50 hover:border-neutral-300 hover:shadow-xl"
              }`}
            >
              <div>
                <div
                  className={`text-xs font-black uppercase tracking-widest ${isDark ? "text-neutral-500" : "text-neutral-400"}`}
                >
                  {t.plan1Name}
                </div>
                <div className="mt-4 flex items-baseline">
                  <span
                    className={`text-4xl font-black tracking-tight ${isDark ? "text-white" : "text-neutral-900"}`}
                  >
                    {t.plan1Price}
                  </span>
                  <span
                    className={`text-[10px] font-bold tracking-wider uppercase ml-2 ${isDark ? "text-neutral-500" : "text-neutral-400"}`}
                  >
                    {t.plan1Period}
                  </span>
                </div>
                <p
                  className={`mt-4 text-xs sm:text-sm leading-relaxed ${isDark ? "text-neutral-400" : "text-neutral-600"}`}
                >
                  {t.plan1Desc}
                </p>

                <ul
                  className={`mt-6 space-y-3 border-t pt-6 text-xs font-bold ${
                    isDark
                      ? "border-neutral-800/60 text-neutral-400"
                      : "border-neutral-200 text-neutral-600"
                  }`}
                >
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>{t.plan1F1}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>{t.plan1F2}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>{t.plan1F3}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>{t.plan1F4}</span>
                  </li>
                </ul>
              </div>

              <Link to="/auth" className="mt-8">
                <Button
                  variant="outline"
                  className={`w-full py-5 font-bold rounded-xl transition-all ${
                    isDark
                      ? "bg-neutral-950 border-neutral-800 text-neutral-200 hover:bg-neutral-800 hover:text-white"
                      : "bg-white border-neutral-300 text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 shadow-sm"
                  }`}
                >
                  Démarrer
                </Button>
              </Link>
            </div>

            {/* Plan 2 */}
            <div
              className={`border-2 rounded-3xl p-8 flex flex-col justify-between transition-all duration-300 relative hover:-translate-y-1 ${
                isDark
                  ? "border-emerald-500 bg-neutral-900 shadow-xl shadow-emerald-950/25"
                  : "border-emerald-500 bg-white shadow-xl shadow-emerald-500/10"
              }`}
            >
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-[9px] font-black px-4.5 py-1 rounded-full uppercase tracking-widest shadow-md">
                Recommandé
              </div>

              <div>
                <div className="text-xs font-black text-emerald-500 uppercase tracking-widest mt-1.5">
                  {t.plan2Name}
                </div>
                <div className="mt-4 flex items-baseline">
                  <span
                    className={`text-4xl font-black tracking-tight ${isDark ? "text-white" : "text-neutral-900"}`}
                  >
                    {t.plan2Price}
                  </span>
                  <span
                    className={`text-[10px] font-bold tracking-wider uppercase ml-2 ${isDark ? "text-neutral-400" : "text-neutral-500"}`}
                  >
                    {t.plan2Period}
                  </span>
                </div>
                <p
                  className={`mt-4 text-xs sm:text-sm leading-relaxed ${isDark ? "text-neutral-300" : "text-neutral-600"}`}
                >
                  {t.plan2Desc}
                </p>

                <ul
                  className={`mt-6 space-y-3 border-t pt-6 text-xs font-bold ${
                    isDark
                      ? "border-neutral-800/60 text-neutral-200"
                      : "border-neutral-200 text-neutral-700"
                  }`}
                >
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>{t.plan2F1}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>{t.plan2F2}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>{t.plan2F3}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>{t.plan2F4}</span>
                  </li>
                </ul>
              </div>

              <Link to="/auth" className="mt-8">
                <Button className="w-full py-5 font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-600/10">
                  Souscrire Pro
                </Button>
              </Link>
            </div>

            {/* Plan 3 */}
            <div
              className={`border rounded-3xl p-8 flex flex-col justify-between transition-all duration-300 shadow-md hover:-translate-y-1 ${
                isDark
                  ? "border-neutral-800/80 bg-neutral-900/30 hover:border-neutral-700/60"
                  : "border-neutral-200 bg-stone-50 hover:border-neutral-300 hover:shadow-xl"
              }`}
            >
              <div>
                <div
                  className={`text-xs font-black uppercase tracking-widest ${isDark ? "text-neutral-500" : "text-neutral-400"}`}
                >
                  {t.plan3Name}
                </div>
                <div className="mt-4 flex items-baseline">
                  <span
                    className={`text-4xl font-black tracking-tight ${isDark ? "text-white" : "text-neutral-900"}`}
                  >
                    {t.plan3Price}
                  </span>
                </div>
                <p
                  className={`mt-4 text-xs sm:text-sm leading-relaxed ${isDark ? "text-neutral-400" : "text-neutral-600"}`}
                >
                  {t.plan3Desc}
                </p>

                <ul
                  className={`mt-6 space-y-3 border-t pt-6 text-xs font-bold ${
                    isDark
                      ? "border-neutral-800/60 text-neutral-400"
                      : "border-neutral-200 text-neutral-600"
                  }`}
                >
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>{t.plan3F1}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>{t.plan3F2}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>{t.plan3F3}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>{t.plan3F4}</span>
                  </li>
                </ul>
              </div>

              <Link to="/auth" className="mt-8">
                <Button
                  variant="outline"
                  className={`w-full py-5 font-bold rounded-xl transition-all ${
                    isDark
                      ? "bg-neutral-950 border-neutral-800 text-neutral-200 hover:bg-neutral-800 hover:text-white"
                      : "bg-white border-neutral-300 text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 shadow-sm"
                  }`}
                >
                  Nous contacter
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section
        id="testimonials"
        className={`py-24 border-b relative ${
          isDark ? "border-neutral-900 bg-neutral-950" : "border-neutral-200 bg-white"
        }`}
      >
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2
              className={`font-display text-3xl sm:text-5xl font-black tracking-tight ${isDark ? "text-white" : "text-neutral-900"}`}
            >
              {t.testimonialTitle}
            </h2>
            <p
              className={`mt-4 text-sm sm:text-base ${isDark ? "text-neutral-400" : "text-neutral-600"}`}
            >
              {t.testimonialSub}
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
            {/* Testimonial 1 */}
            <div
              className={`border rounded-2xl p-6 text-left flex flex-col justify-between shadow-md ${
                isDark ? "border-neutral-800 bg-neutral-900/20" : "bg-stone-50 border-neutral-200"
              }`}
            >
              <p
                className={`text-sm leading-relaxed italic ${isDark ? "text-neutral-400" : "text-neutral-600"}`}
              >
                &ldquo;{t.test1Quote}&rdquo;
              </p>
              <div
                className={`mt-6 pt-4 border-t flex items-center gap-3 ${isDark ? "border-neutral-800/80" : "border-neutral-200"}`}
              >
                <div className="h-9 w-9 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold text-xs shrink-0 border border-emerald-500/20">
                  MS
                </div>
                <div>
                  <div
                    className={`text-xs font-bold ${isDark ? "text-white" : "text-neutral-900"}`}
                  >
                    {t.test1Author}
                  </div>
                  <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider mt-0.5">
                    {t.test1Role}
                  </div>
                </div>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div
              className={`border rounded-2xl p-6 text-left flex flex-col justify-between shadow-md ${
                isDark ? "border-neutral-800 bg-neutral-900/20" : "bg-stone-50 border-neutral-200"
              }`}
            >
              <p
                className={`text-sm leading-relaxed italic ${isDark ? "text-neutral-400" : "text-neutral-600"}`}
              >
                &ldquo;{t.test2Quote}&rdquo;
              </p>
              <div
                className={`mt-6 pt-4 border-t flex items-center gap-3 ${isDark ? "border-neutral-800/80" : "border-neutral-200"}`}
              >
                <div className="h-9 w-9 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold text-xs shrink-0 border border-amber-500/20">
                  IK
                </div>
                <div>
                  <div
                    className={`text-xs font-bold ${isDark ? "text-white" : "text-neutral-900"}`}
                  >
                    {t.test2Author}
                  </div>
                  <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider mt-0.5">
                    {t.test2Role}
                  </div>
                </div>
              </div>
            </div>

            {/* Testimonial 3 */}
            <div
              className={`border rounded-2xl p-6 text-left flex flex-col justify-between shadow-md ${
                isDark ? "border-neutral-800 bg-neutral-900/20" : "bg-stone-50 border-neutral-200"
              }`}
            >
              <p
                className={`text-sm leading-relaxed italic ${isDark ? "text-neutral-400" : "text-neutral-600"}`}
              >
                &ldquo;{t.test3Quote}&rdquo;
              </p>
              <div
                className={`mt-6 pt-4 border-t flex items-center gap-3 ${isDark ? "border-neutral-800/80" : "border-neutral-200"}`}
              >
                <div className="h-9 w-9 rounded-full bg-purple-500/10 text-purple-500 flex items-center justify-center font-bold text-xs shrink-0 border border-purple-500/20">
                  FO
                </div>
                <div>
                  <div
                    className={`text-xs font-bold ${isDark ? "text-white" : "text-neutral-900"}`}
                  >
                    {t.test3Author}
                  </div>
                  <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider mt-0.5">
                    {t.test3Role}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Accordion */}
      <section
        id="faq"
        className={`py-24 border-b relative ${
          isDark ? "border-neutral-900 bg-neutral-950" : "border-neutral-200 bg-stone-50"
        }`}
      >
        <div className="mx-auto max-w-4xl px-6">
          <div className="text-center mb-16">
            <h2
              className={`font-display text-3xl font-black transition-colors ${isDark ? "text-white" : "text-neutral-900"}`}
            >
              {t.faqTitleSection}
            </h2>
            <p className={`mt-4 text-sm ${isDark ? "text-neutral-400" : "text-neutral-600"}`}>
              {t.faqSubSection}
            </p>
          </div>

          <div className="space-y-4 max-w-3xl mx-auto">
            {/* FAQ 1 */}
            <div
              className={`border rounded-2xl p-6 text-left transition-colors duration-300 ${
                isDark
                  ? "border-neutral-800 bg-neutral-900/20"
                  : "bg-white border-neutral-200 shadow-md"
              }`}
            >
              <h3
                className={`font-bold text-sm sm:text-base flex items-center gap-2.5 ${isDark ? "text-white" : "text-neutral-900"}`}
              >
                <HelpCircle className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
                {t.faqQ1}
              </h3>
              <p
                className={`mt-3 text-xs sm:text-sm leading-relaxed pl-7 ${isDark ? "text-neutral-400" : "text-neutral-600"}`}
              >
                {t.faqA1}
              </p>
            </div>

            {/* FAQ 2 */}
            <div
              className={`border rounded-2xl p-6 text-left transition-colors duration-300 ${
                isDark
                  ? "border-neutral-800 bg-neutral-900/20"
                  : "bg-white border-neutral-200 shadow-md"
              }`}
            >
              <h3
                className={`font-bold text-sm sm:text-base flex items-center gap-2.5 ${isDark ? "text-white" : "text-neutral-900"}`}
              >
                <HelpCircle className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
                {t.faqQ2}
              </h3>
              <p
                className={`mt-3 text-xs sm:text-sm leading-relaxed pl-7 ${isDark ? "text-neutral-400" : "text-neutral-600"}`}
              >
                {t.faqA2}
              </p>
            </div>

            {/* FAQ 3 */}
            <div
              className={`border rounded-2xl p-6 text-left transition-colors duration-300 ${
                isDark
                  ? "border-neutral-800 bg-neutral-900/20"
                  : "bg-white border-neutral-200 shadow-md"
              }`}
            >
              <h3
                className={`font-bold text-sm sm:text-base flex items-center gap-2.5 ${isDark ? "text-white" : "text-neutral-900"}`}
              >
                <HelpCircle className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
                {t.faqQ3}
              </h3>
              <p
                className={`mt-3 text-xs sm:text-sm leading-relaxed pl-7 ${isDark ? "text-neutral-400" : "text-neutral-600"}`}
              >
                {t.faqA3}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        className={`border-t py-16 relative transition-colors duration-300 ${
          isDark ? "border-neutral-900 bg-neutral-950" : "border-neutral-200 bg-white"
        }`}
      >
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-xs font-bold text-neutral-500">
            <div className="flex items-center gap-2 text-left">
              <Building2 className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
              <span>
                © {new Date().getFullYear()} {t.footerCopyright}
              </span>
            </div>
            <div className="flex gap-6 uppercase tracking-wider">
              <Link to="/auth" className="hover:text-emerald-500 transition-colors">
                {t.login}
              </Link>
              <a href="#features" className="hover:text-emerald-500 transition-colors">
                {t.navFeatures}
              </a>
              <a href="#pricing" className="hover:text-emerald-500 transition-colors">
                {t.navPricing}
              </a>
            </div>
          </div>
          <div
            className={`mt-8 text-center text-xs font-bold border-t pt-8 ${
              isDark
                ? "text-neutral-600 border-neutral-900/80"
                : "text-neutral-400 border-neutral-100"
            }`}
          >
            {t.footerSlogan}
          </div>
        </div>
      </footer>
    </div>
  );
}
