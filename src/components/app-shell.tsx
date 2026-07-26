import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Truck,
  BarChart3,
  Warehouse,
  Wallet,
  Settings,
  LogOut,
  Store,
  Search,
  Sun,
  Moon,
  ChevronDown,
  Plus,
  Bell,
  UserCog,
  Receipt,
  Menu,
  Tags,
  Clock,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
  Check,
  Loader2,
  Lock,
  Phone,
  MessageSquare,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useTheme } from "@/components/theme-provider";
import { useShops } from "@/lib/shop-store";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import logo from "@/assets/logo.png";
import { motion, AnimatePresence } from "motion/react";

const NAV_GROUPS = [
  {
    title: "Vue d'ensemble",
    items: [{ to: "/dashboard", icon: LayoutDashboard, label: "Tableau de bord" }],
  },
  {
    title: "Ventes & Clients",
    items: [
      { to: "/pos", icon: Receipt, label: "Caisse (POS)", accent: true },
      { to: "/sales", icon: ShoppingCart, label: "Ventes" },
      { to: "/clients", icon: Users, label: "Clients" },
    ],
  },
  {
    title: "Stocks & Produits",
    items: [
      { to: "/products", icon: Package, label: "Produits" },
      { to: "/categories", icon: Tags, label: "Catégories" },
      { to: "/stock", icon: Warehouse, label: "Stock" },
      { to: "/suppliers", icon: Truck, label: "Fournisseurs" },
    ],
  },
  {
    title: "Finance & Rapports",
    items: [
      { to: "/accounting", icon: Wallet, label: "Argent entre & sort" },
      { to: "/reports", icon: BarChart3, label: "Mes chiffres" },
    ],
  },
  {
    title: "Administration",
    items: [
      { to: "/employees", icon: UserCog, label: "Mon équipe" },
      { to: "/settings", icon: Settings, label: "Paramètres" },
    ],
  },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { shops, current, setCurrent, loading, reload } = useShops();
  const [openCreate, setOpenCreate] = useState(false);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [user, setUser] = useState<{ email?: string; name?: string } | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const isTrial = !current?.plan || current?.plan === "essentiel";
  const createdAtDate = current?.created_at ? new Date(current.created_at) : null;
  const daysPassed = createdAtDate
    ? Math.floor((new Date().getTime() - createdAtDate.getTime()) / (1000 * 60 * 60 * 24))
    : 0;
  const daysRemaining = Math.max(0, 15 - daysPassed);
  const isExpired = isTrial && daysPassed >= 15;
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedPlanDetails, setSelectedPlanDetails] = useState<{
    id: string;
    name: string;
    price: string;
  } | null>(null);

  const handlePayPlan = (planId: string) => {
    if (!current) return;
    let name = "Formule Essentiel";
    let price = "5 000 F CFA";
    if (planId === "pro") {
      name = "Formule Pro";
      price = "10 000 F CFA";
    } else if (planId === "sur-mesure") {
      name = "Formule Sur Mesure";
      price = "Tarif sur devis";
    }
    setSelectedPlanDetails({
      id: planId,
      name,
      price,
    });
    setPaymentDialogOpen(true);
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const u = data.user;
      setUser({
        email: u?.email,
        name: (u?.user_metadata as unknown as { full_name?: string })?.full_name,
      });
    });
  }, []);

  // Onboarding: auto-open create dialog when user has no shops
  useEffect(() => {
    if (!loading && shops.length === 0) setOpenCreate(true);
  }, [loading, shops.length]);

  // Clock Ticker
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 10000);
    return () => clearInterval(timer);
  }, []);

  const createShop = async () => {
    if (!name.trim()) return;
    setCreating(true);
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;
    const slug =
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") +
      "-" +
      Math.random().toString(36).slice(2, 6);
    const { data, error } = await supabase
      .from("shops")
      .insert({
        name: name.trim(),
        slug,
        owner_id: userData.user.id,
        plan: "essentiel",
      })
      .select()
      .single();
    if (error) {
      setCreating(false);
      toast.error(error.message);
      return;
    }
    // Also add owner as admin member
    await supabase
      .from("shop_members")
      .insert({ shop_id: data.id, user_id: userData.user.id, role: "admin" });
    toast.success("Boutique créée");
    setName("");
    setOpenCreate(false);
    await reload();
    setCurrent(data.id);
    setCreating(false);
  };

  const signOut = async () => {
    localStorage.removeItem("boutikbf-current-shop");
    localStorage.removeItem("boutikbf-shops-cache");
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  const formatHeaderDate = (date: Date) => {
    return date.toLocaleDateString("fr-FR", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  };

  const formatHeaderTime = (date: Date) => {
    return date.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground transition-colors duration-300">
      {/* Mobile menu overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 md:hidden backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar - Desktop */}
      <aside className="hidden w-66 flex-col border-r border-border/70 bg-card/60 backdrop-blur-xl md:flex shrink-0">
        <div className="flex h-16 items-center gap-3 px-5 border-b border-border/50 bg-card/20">
          <div className="bg-primary/10 p-1.5 rounded-xl border border-primary/20 shadow-sm">
            <img
              src={logo}
              alt="BoutikBF"
              className="h-16 w-auto object-contain"
            />
          </div>
          <span className="font-display text-xl font-black tracking-wider bg-gradient-to-r from-emerald-600 via-emerald-500 to-amber-500 bg-clip-text text-transparent">
            Boutik<span className="text-[#fcd116] dark:text-[#fcd116]">BF</span>
          </span>
          <Badge className="ml-auto text-[9px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 py-0.5 px-1.5 font-semibold">
            PRO
          </Badge>
        </div>

        {/* Burkina Flag Divider Line */}
        <div className="bf-flag-bar h-1 w-full" />

        {/* Shop switcher */}
        <div className="p-3.5">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex w-full items-center justify-between gap-2.5 rounded-xl border border-border/80 bg-secondary/30 px-3.5 py-3 text-left transition duration-300 hover:bg-secondary/70 focus:outline-none focus:ring-1 focus:ring-emerald-500/30">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-bold text-foreground">
                    {current?.name ?? "Aucune boutique"}
                  </div>
                  <div className="text-[10px] font-semibold text-muted-foreground/90 uppercase tracking-wider flex items-center gap-1.5 mt-0.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    {current?.currency ?? "F CFA"}
                  </div>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground transition duration-300 group-hover:text-foreground shrink-0" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="w-58 rounded-xl p-1.5 shadow-xl border-border/80"
            >
              <DropdownMenuLabel className="text-xs font-bold text-muted-foreground/80 px-2 py-1.5 uppercase tracking-wider">
                Mes boutiques
              </DropdownMenuLabel>
              {shops.map((s) => (
                <DropdownMenuItem
                  key={s.id}
                  onClick={() => setCurrent(s.id)}
                  className="rounded-lg py-2 px-2.5 cursor-pointer text-sm font-medium flex items-center gap-2 hover:bg-secondary"
                >
                  <Store className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="truncate flex-1">{s.name}</span>
                  {current?.id === s.id && (
                    <Badge
                      variant="secondary"
                      className="ml-auto text-[9px] font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 py-0 px-1.5"
                    >
                      actif
                    </Badge>
                  )}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator className="my-1" />
              <DropdownMenuItem
                onClick={() => setOpenCreate(true)}
                className="rounded-lg py-2 px-2.5 cursor-pointer text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/5 flex items-center gap-2"
              >
                <Plus className="h-4 w-4 shrink-0" /> Nouvelle boutique
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Trial or Paid Subscription Status Card */}
        {current && (
          <div className="px-3.5 mb-2">
            {isTrial ? (
              <div
                className={`p-3 rounded-xl border ${
                  isExpired
                    ? "bg-destructive/10 border-destructive/25 text-destructive"
                    : "bg-amber-500/10 border-amber-500/20 text-amber-800 dark:text-amber-200"
                }`}
              >
                <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest">
                  <Sparkles className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
                  {isExpired ? "Essai Terminé" : "Essai Gratuit Actif"}
                </div>
                <p className="text-[11px] mt-1.5 font-medium leading-normal text-muted-foreground/95">
                  {isExpired ? (
                    "Votre essai de 15 jours a expiré. Veuillez activer une formule."
                  ) : (
                    <>
                      Formule Essentiel : il reste{" "}
                      <strong className="text-amber-600 dark:text-amber-400 font-bold">
                        {daysRemaining} {daysRemaining > 1 ? "jours" : "jour"}
                      </strong>
                      .
                    </>
                  )}
                </p>
              </div>
            ) : (
              <div className="p-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/15 text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
                <div className="text-[10px] font-bold text-muted-foreground truncate uppercase tracking-widest">
                  Formule{" "}
                  <strong className="text-emerald-600 dark:text-emerald-400 font-black">
                    {current.plan === "essentiel_paid" ? "Essentiel" : current.plan}
                  </strong>{" "}
                  active
                </div>
              </div>
            )}
          </div>
        )}

        {/* Categorized Navigation */}
        <nav className="flex-1 space-y-4 overflow-y-auto px-3.5 pb-4 custom-scrollbar">
          {NAV_GROUPS.map((group) => (
            <div key={group.title} className="space-y-1">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 px-3 pt-2 pb-1">
                {group.title}
              </h3>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const active = pathname === item.to;
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 relative ${
                        active
                          ? "bg-primary text-primary-foreground font-semibold shadow-md shadow-primary/10"
                          : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                      }`}
                    >
                      <item.icon
                        className={`h-4.5 w-4.5 transition-transform duration-300 group-hover:scale-110 ${
                          active
                            ? "text-primary-foreground"
                            : "text-muted-foreground/80 group-hover:text-foreground"
                        }`}
                      />
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.accent && !active && (
                        <span className="flex h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                      )}
                      {active && (
                        <ChevronRight className="h-3.5 w-3.5 text-primary-foreground shrink-0 opacity-70" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User profile dropdown at the bottom */}
        <div className="border-t border-border/50 bg-card/10 p-3.5">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition duration-300 hover:bg-secondary/60 group focus:outline-none">
                <div className="relative">
                  <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-amber-500 text-sm font-bold text-white shadow-md shadow-emerald-500/15">
                    {(user?.name ?? user?.email ?? "U").slice(0, 1).toUpperCase()}
                  </div>
                  <span className="absolute bottom-[-2px] right-[-2px] block h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-background animate-pulse" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                    {user?.name ?? "Utilisateur"}
                  </div>
                  <div className="truncate text-[11px] font-medium text-muted-foreground/85 mt-0.5">
                    {user?.email}
                  </div>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-58 rounded-xl p-1.5 shadow-xl border-border/80"
            >
              <DropdownMenuLabel className="flex items-center gap-2 px-2 py-2 text-xs font-semibold text-muted-foreground">
                <ShieldCheck className="h-4 w-4 text-emerald-500" /> Mon Compte
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="my-1" />
              <DropdownMenuItem
                onClick={() => navigate({ to: "/settings" })}
                className="rounded-lg py-2 px-2.5 cursor-pointer text-sm font-medium flex items-center gap-2"
              >
                <Settings className="h-4 w-4 text-muted-foreground" /> Paramètres
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={toggle}
                className="rounded-lg py-2 px-2.5 cursor-pointer text-sm font-medium flex items-center gap-2"
              >
                {theme === "dark" ? (
                  <>
                    <Sun className="h-4 w-4 text-muted-foreground" /> Mode clair
                  </>
                ) : (
                  <>
                    <Moon className="h-4 w-4 text-muted-foreground" /> Mode sombre
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-1" />
              <DropdownMenuItem
                onClick={signOut}
                className="rounded-lg py-2 px-2.5 cursor-pointer text-sm font-semibold text-destructive hover:bg-destructive/10 flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" /> Déconnexion
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 220 }}
            className="fixed inset-y-0 left-0 z-50 w-64 flex flex-col border-r border-border bg-card shadow-2xl md:hidden"
          >
            <div className="flex h-16 items-center gap-3 px-5 border-b border-border/50">
              <div className="bg-primary/10 p-1.5 rounded-xl border border-primary/20">
                <img
                  src={logo}
                  alt="BoutikBF"
                  width={28}
                  height={28}
                  className="h-7 w-7 object-contain"
                />
              </div>
              <span className="font-display text-xl font-black tracking-wider bg-gradient-to-r from-emerald-600 via-emerald-500 to-amber-500 bg-clip-text text-transparent">
                Boutik<span className="text-[#fcd116]">BF</span>
              </span>
            </div>

            <div className="bf-flag-bar h-1 w-full" />

            {/* Shop switcher mobile */}
            <div className="p-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex w-full items-center justify-between gap-2.5 rounded-xl border border-border bg-secondary/40 px-3.5 py-2.5 text-left transition hover:bg-secondary focus:outline-none">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-bold text-foreground">
                        {current?.name ?? "Aucune boutique"}
                      </div>
                      <div className="text-[10px] font-semibold text-muted-foreground/90 uppercase tracking-wider flex items-center gap-1 mt-0.5">
                        <span className="h-1 w-1 bg-emerald-500 rounded-full" />
                        {current?.currency ?? "F CFA"}
                      </div>
                    </div>
                    <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56 rounded-xl">
                  <DropdownMenuLabel className="text-xs uppercase font-bold text-muted-foreground/80">
                    Mes boutiques
                  </DropdownMenuLabel>
                  {shops.map((s) => (
                    <DropdownMenuItem
                      key={s.id}
                      onClick={() => {
                        setCurrent(s.id);
                        setMobileMenuOpen(false);
                      }}
                      className="rounded-lg cursor-pointer"
                    >
                      <Store className="mr-2 h-4 w-4 text-muted-foreground" /> {s.name}
                      {current?.id === s.id && (
                        <Badge
                          variant="secondary"
                          className="ml-auto text-[9px] bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                        >
                          actif
                        </Badge>
                      )}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      setOpenCreate(true);
                      setMobileMenuOpen(false);
                    }}
                    className="rounded-lg cursor-pointer text-emerald-600"
                  >
                    <Plus className="mr-2 h-4 w-4" /> Nouvelle boutique
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Mobile Trial or Paid Subscription Status Card */}
            {current && (
              <div className="px-3 mb-2">
                {isTrial ? (
                  <div
                    className={`p-3 rounded-xl border ${
                      isExpired
                        ? "bg-destructive/10 border-destructive/25 text-destructive"
                        : "bg-amber-500/10 border-amber-500/20 text-amber-800 dark:text-amber-200"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest">
                      <Sparkles className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
                      {isExpired ? "Essai Terminé" : "Essai Gratuit Actif"}
                    </div>
                    <p className="text-[11px] mt-1 font-medium leading-normal text-muted-foreground/95">
                      {isExpired ? (
                        "Votre essai de 15 jours a expiré. Veuillez activer une formule."
                      ) : (
                        <>
                          Formule Essentiel : il reste{" "}
                          <strong className="text-amber-600 dark:text-amber-400 font-bold">
                            {daysRemaining} {daysRemaining > 1 ? "jours" : "jour"}
                          </strong>
                          .
                        </>
                      )}
                    </p>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/15 text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
                    <div className="text-[10px] font-bold text-muted-foreground truncate uppercase tracking-widest">
                      Formule{" "}
                      <strong className="text-emerald-600 dark:text-emerald-400 font-black">
                        {current.plan === "essentiel_paid" ? "Essentiel" : current.plan}
                      </strong>{" "}
                      active
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Mobile Nav Menu */}
            <nav className="flex-1 space-y-4 overflow-y-auto px-3 pb-4">
              {NAV_GROUPS.map((group) => (
                <div key={group.title} className="space-y-1">
                  <h3 className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 px-3 pt-2 pb-0.5">
                    {group.title}
                  </h3>
                  <div className="space-y-0.5">
                    {group.items.map((item) => {
                      const active = pathname === item.to;
                      return (
                        <Link
                          key={item.to}
                          to={item.to}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                            active
                              ? "bg-primary text-primary-foreground font-semibold"
                              : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                          }`}
                        >
                          <item.icon className="h-4.5 w-4.5" />
                          <span className="truncate">{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>

            <div className="border-t border-border p-4 bg-card/50">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex w-full items-center gap-3 rounded-xl p-1.5 text-left focus:outline-none">
                    <div className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-tr from-emerald-600 to-amber-500 text-xs font-bold text-white">
                      {(user?.name ?? user?.email ?? "U").slice(0, 1).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-bold text-foreground">
                        {user?.name ?? "Utilisateur"}
                      </div>
                      <div className="truncate text-[10px] text-muted-foreground mt-0.5">
                        {user?.email}
                      </div>
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-xl">
                  <DropdownMenuItem
                    onClick={() => {
                      navigate({ to: "/settings" });
                      setMobileMenuOpen(false);
                    }}
                    className="rounded-lg"
                  >
                    <Settings className="mr-2 h-4 w-4" /> Paramètres
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      toggle();
                      setMobileMenuOpen(false);
                    }}
                    className="rounded-lg"
                  >
                    {theme === "dark" ? (
                      <Sun className="mr-2 h-4 w-4" />
                    ) : (
                      <Moon className="mr-2 h-4 w-4" />
                    )}
                    Mode {theme === "dark" ? "clair" : "sombre"}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut} className="text-destructive rounded-lg">
                    <LogOut className="mr-2 h-4 w-4" /> Déconnexion
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Container */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/60 bg-background/60 px-4 md:px-6 backdrop-blur-xl">
          {/* Left section: mobile hamburger & search or clock */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden h-9 w-9 border border-border/40 bg-secondary/20 hover:bg-secondary/40 rounded-xl"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>

            {/* Desktop clock / greeting info */}
            <div className="hidden md:flex items-center gap-2.5 text-xs font-semibold text-muted-foreground bg-secondary/30 border border-border/40 px-3.5 py-1.5 rounded-full select-none">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              <Clock className="h-3.5 w-3.5 text-muted-foreground/80 shrink-0" />
              <span className="capitalize">{formatHeaderDate(currentTime)}</span>
              <span className="opacity-40">|</span>
              <span className="font-mono text-foreground font-bold">
                {formatHeaderTime(currentTime)}
              </span>
            </div>

            {/* Micro-search input */}
            <div className="relative max-w-xs xl:max-w-md w-full ml-2 md:ml-0">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher partout..."
                className="pl-9 h-9.5 border-border/80 rounded-xl focus-visible:ring-emerald-500/25 bg-secondary/10 hover:bg-secondary/20 focus-visible:border-emerald-500 transition-all text-xs"
              />
            </div>
          </div>

          {/* Right section: theme, quick actions, and notifications */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Quick Actions Dropdown with flag accent */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="h-9.5 px-3.5 bg-gradient-to-r from-emerald-600 via-emerald-500 to-amber-500 hover:from-emerald-700 hover:via-emerald-600 hover:to-amber-600 text-white font-bold rounded-xl shadow-md transition-all duration-300 flex items-center gap-1.5 cursor-pointer text-xs transform active:scale-95">
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Actions Rapides</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-56 rounded-xl p-1.5 shadow-xl border-border/85 z-[100]"
              >
                <DropdownMenuLabel className="text-[10px] font-bold text-muted-foreground/80 px-2 py-1.5 uppercase tracking-widest flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-amber-500" /> Raccourcis Directs
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="my-1" />
                <DropdownMenuItem
                  onClick={() => navigate({ to: "/pos" })}
                  className="rounded-lg cursor-pointer py-2 px-2.5 font-medium text-sm flex items-center gap-2"
                >
                  <Receipt className="h-4 w-4 text-emerald-500 shrink-0" /> Caisse (POS)
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => navigate({ to: "/products" })}
                  className="rounded-lg cursor-pointer py-2 px-2.5 font-medium text-sm flex items-center gap-2"
                >
                  <Package className="h-4 w-4 text-amber-500 shrink-0" /> Ajouter un produit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => navigate({ to: "/accounting" })}
                  className="rounded-lg cursor-pointer py-2 px-2.5 font-medium text-sm flex items-center gap-2"
                >
                  <Wallet className="h-4 w-4 text-cyan-500 shrink-0" /> Saisir Dépense / Recette
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => navigate({ to: "/clients" })}
                  className="rounded-lg cursor-pointer py-2 px-2.5 font-medium text-sm flex items-center gap-2"
                >
                  <Users className="h-4 w-4 text-purple-500 shrink-0" /> Nouveau client
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Notification bell with pulsing dot */}
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="h-9.5 w-9.5 border border-border/40 bg-secondary/15 hover:bg-secondary/30 rounded-xl"
              >
                <Bell className="h-4.5 w-4.5 text-foreground/85" />
              </Button>
              <span className="absolute top-1.5 right-1.5 block h-2 w-2 rounded-full bg-red-500 border border-background" />
            </div>

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggle}
              className="h-9.5 w-9.5 border border-border/40 bg-secondary/15 hover:bg-secondary/30 rounded-xl hidden sm:flex"
            >
              {theme === "dark" ? (
                <Sun className="h-4.5 w-4.5 text-amber-500 animate-spin-slow" />
              ) : (
                <Moon className="h-4.5 w-4.5 text-slate-700" />
              )}
            </Button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-secondary/5 transition-colors duration-300">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full h-full max-w-7xl mx-auto"
          >
            {isExpired ? (
              <div className="flex flex-col items-center justify-center min-h-[70vh] max-w-4xl mx-auto py-10 px-4 text-center">
                <div className="h-16 w-16 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl flex items-center justify-center shadow-lg animate-bounce mb-6">
                  <Lock className="h-8 w-8 animate-pulse" />
                </div>

                <h1 className="font-display text-2xl md:text-3xl font-black tracking-tight text-foreground">
                  Période d&apos;essai de 15 jours expirée ⌛
                </h1>
                <p className="mt-3 text-sm text-muted-foreground max-w-xl leading-relaxed font-medium">
                  L&apos;accès aux fonctionnalités de{" "}
                  <strong className="text-foreground">{current?.name}</strong> est actuellement
                  bloqué. Pour réactiver votre caisse, catalogue et rapports, souscrivez à l&apos;un
                  de nos abonnements ci-dessous. Vos données existantes sont en sécurité et seront
                  restaurées instantanément.
                </p>

                <div className="mt-10 grid gap-6 md:grid-cols-2 w-full max-w-3xl">
                  {/* Essentiel Card */}
                  <div className="relative overflow-hidden flex flex-col rounded-2xl border border-border bg-card p-6 text-left hover:border-emerald-500/30 hover:shadow-lg transition-all duration-300">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-display text-lg font-black text-foreground">
                          Formule Essentiel
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          La gestion complète de votre commerce de quartier.
                        </p>
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        Populaire
                      </span>
                    </div>

                    <div className="mt-4 flex items-baseline gap-1 border-b border-border pb-4">
                      <span className="font-display text-2xl md:text-3xl font-black text-foreground">
                        5 000 F CFA
                      </span>
                      <span className="text-xs text-muted-foreground">/ mois</span>
                    </div>

                    <ul className="mt-5 space-y-3 flex-1">
                      <li className="flex items-start gap-2 text-xs font-semibold text-foreground/90">
                        <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>Caisse tactile POS intuitive & fluide</span>
                      </li>
                      <li className="flex items-start gap-2 text-xs font-semibold text-foreground/90">
                        <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>Catalogue et stock jusqu&apos;à 150 articles</span>
                      </li>
                      <li className="flex items-start gap-2 text-xs font-semibold text-foreground/90">
                        <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>Alertes automatiques de stock bas</span>
                      </li>
                      <li className="flex items-start gap-2 text-xs font-semibold text-foreground/90">
                        <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>🤖 Assistant de prix & Rapports hebdo IA</span>
                      </li>
                    </ul>

                    <Button
                      onClick={() => handlePayPlan("essentiel")}
                      className="mt-6 w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-black text-xs rounded-xl shadow-md transition-all active:scale-[0.98] cursor-pointer"
                    >
                      Activer la Formule Essentiel (5 000 F)
                    </Button>
                  </div>

                  {/* Pro Card */}
                  <div className="relative overflow-hidden flex flex-col rounded-2xl border-2 border-emerald-500/40 bg-gradient-to-b from-card to-emerald-500/[0.02] p-6 text-left hover:shadow-xl hover:scale-[1.01] transition-all duration-300">
                    <div className="absolute top-0 right-0 bg-emerald-500 text-white font-black text-[9px] uppercase tracking-widest px-3.5 py-1 rounded-bl-xl shadow-sm">
                      Recommandé
                    </div>
                    <div>
                      <h3 className="font-display text-lg font-black text-foreground">
                        Formule Pro
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        La solution complète pour boutiques en pleine croissance.
                      </p>
                    </div>

                    <div className="mt-4 flex items-baseline gap-1 border-b border-border pb-4">
                      <span className="font-display text-2xl md:text-3xl font-black bg-gradient-to-r from-emerald-600 to-amber-500 bg-clip-text text-transparent">
                        10 000 F CFA
                      </span>
                      <span className="text-xs text-muted-foreground">/ mois</span>
                    </div>

                    <ul className="mt-5 space-y-3 flex-1">
                      <li className="flex items-start gap-2 text-xs font-semibold text-foreground/90">
                        <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          Articles & ventes 100% illimités
                        </span>
                      </li>
                      <li className="flex items-start gap-2 text-xs font-semibold text-foreground/90">
                        <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>Multi-boutiques & dépôts (jusqu&apos;à 3)</span>
                      </li>
                      <li className="flex items-start gap-2 text-xs font-semibold text-foreground/90">
                        <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>Gestion d&apos;équipe (10 employés / caissiers)</span>
                      </li>
                      <li className="flex items-start gap-2 text-xs font-semibold text-foreground/90">
                        <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>🤖 IA approvisionnement, marges & Chatbot 24/7</span>
                      </li>
                    </ul>

                    <Button
                      onClick={() => handlePayPlan("pro")}
                      className="mt-6 w-full h-11 bg-gradient-to-r from-emerald-600 to-amber-500 hover:from-emerald-700 hover:to-amber-600 text-white font-black text-xs rounded-xl shadow-md transition-all active:scale-[0.98] cursor-pointer"
                    >
                      Activer la Formule Pro (10 000 F)
                    </Button>
                  </div>
                </div>

                <button
                  onClick={() => handlePayPlan("sur-mesure")}
                  className="mt-8 text-xs text-muted-foreground font-semibold hover:text-primary transition-colors underline underline-offset-4 cursor-pointer"
                >
                  Supermarché, franchise ou grossiste ? Découvrez le plan Sur Mesure (WhatsApp).
                </button>
              </div>
            ) : (
              children
            )}
          </motion.div>
        </main>
      </div>

      {/* Create shop dialog */}
      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent className="rounded-2xl max-w-md border-border/80">
          <DialogHeader>
            <DialogTitle className="font-display text-xl font-bold flex items-center gap-2">
              <Store className="h-5 w-5 text-emerald-500" />
              Créer votre boutique
            </DialogTitle>
            <DialogDescription className="text-sm">
              Donnez un nom accueillant à votre commerce pour configurer votre tableau de bord.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-3">
            <div className="space-y-2">
              <Label
                htmlFor="shopname"
                className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
              >
                Nom du commerce
              </Label>
              <Input
                id="shopname"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex : Alimentation Wassa-Wassa"
                className="h-11 border-border/80 rounded-xl focus-visible:ring-emerald-500/25 focus-visible:border-emerald-500"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            {shops.length > 0 && (
              <Button
                variant="ghost"
                onClick={() => setOpenCreate(false)}
                className="rounded-xl font-medium"
              >
                Annuler
              </Button>
            )}
            <Button
              onClick={createShop}
              disabled={creating || !name.trim()}
              className="bg-gradient-to-r from-emerald-600 to-amber-500 hover:from-emerald-700 hover:to-amber-600 text-white font-bold px-5 py-2 rounded-xl shadow-md transition-all active:scale-[0.98]"
            >
              Créer la boutique
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="rounded-2xl max-w-md border-border bg-card p-6 shadow-soft">
          <DialogHeader className="text-center pb-2">
            <div className="mx-auto h-12 w-12 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mb-3">
              <AlertTriangle className="h-6 w-6 animate-pulse" />
            </div>
            <DialogTitle className="font-display text-xl font-bold tracking-tight text-foreground">
              Paiements en ligne indisponibles 💳
            </DialogTitle>
            <DialogDescription className="text-sm font-medium text-muted-foreground/90 mt-1">
              Les paiements électroniques directs par carte et mobile money sont temporairement
              indisponibles (documents en cours d&apos;examen par les opérateurs).
            </DialogDescription>
          </DialogHeader>

          {selectedPlanDetails && (
            <div className="space-y-4">
              <div className="rounded-xl border border-dashed border-border/80 bg-secondary/30 p-3.5 text-center">
                <div className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                  Formule Sélectionnée
                </div>
                <div className="mt-1 font-display text-lg font-black text-foreground">
                  {selectedPlanDetails.name}
                </div>
                <div className="mt-0.5 text-xl font-black text-amber-600 dark:text-amber-400">
                  {selectedPlanDetails.price === "Sur Mesure"
                    ? "Tarif sur devis"
                    : selectedPlanDetails.price}
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Instructions de Paiement Local
                </h4>
                <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/[0.04] to-orange-500/[0.04] border border-amber-500/10 space-y-3">
                  <div className="flex items-start gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500 text-[10px] font-black text-white">
                      1
                    </span>
                    <p className="text-xs font-semibold text-foreground/95 leading-relaxed">
                      Effectuez le dépôt ou transfert local (Orange Money ou Moov Money) du montant
                      ci-dessus.
                    </p>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500 text-[10px] font-black text-white">
                      2
                    </span>
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-foreground/95">
                        Envoyez au numéro unique suivant :
                      </p>
                      <div className="bg-background border border-border/80 px-3 py-2 rounded-lg font-mono text-sm font-black text-amber-600 dark:text-amber-400 flex items-center justify-between mt-1 select-all select-none group">
                        <span>+226 55 30 08 68</span>
                        <span className="text-[9px] uppercase tracking-wider text-muted-foreground/80 font-sans group-hover:text-primary transition-colors">
                          Copier
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground font-semibold">
                        Destinataire :{" "}
                        <strong className="text-foreground">Service Client BoutikBF</strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500 text-[10px] font-black text-white">
                      3
                    </span>
                    <p className="text-xs font-semibold text-foreground/95 leading-relaxed">
                      Une fois le transfert effectué, cliquez ci-dessous pour contacter le service
                      client afin de faire activer votre compte instantanément.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-2.5 pt-2">
                <Button
                  onClick={() => {
                    const message = encodeURIComponent(
                      `Bonjour BoutikBF, je souhaite souscrire à la ${selectedPlanDetails.name} (${selectedPlanDetails.price}) pour ma boutique "${current?.name}". J'ai effectué le paiement par transfert local sur le +226 55300868.`,
                    );
                    window.open(`https://wa.me/22655300868?text=${message}`, "_blank");
                  }}
                  className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
                >
                  <MessageSquare className="h-4 w-4 fill-white/10" />
                  Contacter sur WhatsApp pour Activer
                </Button>

                <Button
                  variant="outline"
                  onClick={() => {
                    window.open("tel:+22655300868", "_self");
                  }}
                  className="w-full h-11 border-border bg-background hover:bg-secondary/40 font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
                >
                  <Phone className="h-4 w-4" />
                  Appeler le +226 55 30 08 68
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
