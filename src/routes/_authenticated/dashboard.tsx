import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useShops } from "@/lib/shop-store";
import { PageHeader, StatCard } from "@/components/page-parts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, ShoppingCart, Package, Users, TrendingUp, AlertTriangle, Sparkles, Star } from "lucide-react";
import { fmtMoney } from "@/lib/format";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Tableau de bord — BoutikBF" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { current } = useShops();
  const [stats, setStats] = useState({
    sales: 0,
    salesCount: 0,
    products: 0,
    customers: 0,
    lowStock: 0,
  });
  const [series, setSeries] = useState<{ day: string; total: number }[]>([]);
  const [paymentData, setPaymentData] = useState<{ name: string; value: number }[]>([]);
  const [topProducts, setTopProducts] = useState<{ n: string; v: number }[]>([]);
  const COLORS = ["oklch(0.62 0.14 160)", "oklch(0.68 0.17 55)", "oklch(0.6 0.13 200)"];

  useEffect(() => {
    if (!current) return;
    (async () => {
      const since = new Date();
      since.setDate(since.getDate() - 30);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const [salesRes, prodRes, custRes, lowRes, payRes, topRes] = await Promise.all([
        supabase
          .from("sales")
          .select("total, created_at")
          .eq("shop_id", current.id)
          .gte("created_at", since.toISOString()),
        supabase
          .from("products")
          .select("id", { count: "exact", head: true })
          .eq("shop_id", current.id),
        supabase
          .from("customers")
          .select("id", { count: "exact", head: true })
          .eq("shop_id", current.id),
        supabase
          .from("products")
          .select("id", { count: "exact", head: true })
          .eq("shop_id", current.id)
          .lt("stock", 5),
        supabase
          .from("sales")
          .select("payment_method, total")
          .eq("shop_id", current.id)
          .gte("created_at", since.toISOString()),
        supabase
          .from("sale_items")
          .select("name, quantity")
          .eq("shop_id" as any, current.id)
          .gte("created_at", weekAgo.toISOString())
          .order("quantity", { ascending: false })
          .limit(6),
      ]);
      const sales = (salesRes.data ?? []) as { total: number; created_at: string }[];
      const total = sales.reduce((a, s) => a + Number(s.total), 0);
      // group by day
      const byDay = new Map<string, number>();
      for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        byDay.set(d.toISOString().slice(0, 10), 0);
      }
      sales.forEach((s) => {
        const k = s.created_at.slice(0, 10);
        if (byDay.has(k)) byDay.set(k, (byDay.get(k) ?? 0) + Number(s.total));
      });
      setSeries(Array.from(byDay.entries()).map(([day, total]) => ({ day: day.slice(5), total })));
      setStats({
        sales: total,
        salesCount: sales.length,
        products: prodRes.count ?? 0,
        customers: custRes.count ?? 0,
        lowStock: lowRes.count ?? 0,
      });
      // Modes de paiement
      const payments = (payRes.data ?? []) as { payment_method: string; total: number }[];
      const payAgg = new Map<string, number>();
      payments.forEach((p) =>
        payAgg.set(p.payment_method, (payAgg.get(p.payment_method) || 0) + Number(p.total)),
      );
      const payLabels: Record<string, string> = {
        cash: "Espèces",
        mobile: "Mobile Money",
        card: "Carte",
      };
      setPaymentData(
        Array.from(payAgg.entries()).map(([k, v]) => ({
          name: payLabels[k] || k,
          value: Math.round(v),
        })),
      );
      // Top produits
      const topItems = (topRes.data ?? []) as { name: string; quantity: number }[];
      const topAgg = new Map<string, number>();
      topItems.forEach((i) => topAgg.set(i.name, (topAgg.get(i.name) || 0) + i.quantity));
      setTopProducts(
        Array.from(topAgg.entries())
          .slice(0, 6)
          .map(([n, v]) => ({ n, v })),
      );
    })();
  }, [current?.id]);

  const cur = current?.currency ?? "XOF";

  return (
    <div className="space-y-6">
      {/* Welcome & Overview Header Card */}
      {current && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-950 via-slate-900 to-amber-950 border border-emerald-500/10 p-6 md:p-8 text-white shadow-lg">
          <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="absolute right-20 bottom-0 h-40 w-40 rounded-full bg-amber-500/10 blur-3xl" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full w-max">
                <Sparkles className="h-3 w-3" />
                Commerce Actif
              </div>
              <h1 className="text-2xl md:text-3xl font-black font-display leading-tight">
                Bienvenue dans <span className="bg-gradient-to-r from-emerald-400 to-amber-400 bg-clip-text text-transparent">{current.name}</span>
              </h1>
              <p className="text-slate-300 text-xs md:text-sm max-w-xl">
                Suivez vos performances commerciales, gérez votre inventaire et visualisez vos chiffres d&apos;affaires en temps réel.
              </p>
            </div>
            <div className="hidden lg:flex items-center gap-4 bg-white/5 border border-white/10 backdrop-blur-md p-4 rounded-xl">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Chiffre d&apos;Affaires</span>
                <span className="font-display font-black text-lg text-emerald-400">{fmtMoney(stats.sales, cur)}</span>
              </div>
              <div className="h-8 w-px bg-white/10" />
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Ventes Effectuées</span>
                <span className="font-display font-black text-lg text-amber-400">{stats.salesCount}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <PageHeader
        title="Tableau de bord"
        description={
          current ? `Aperçu analytique global — 30 derniers jours` : "Sélectionnez une boutique"
        }
      />

      {/* Main Stats Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Chiffre d'affaires"
          value={fmtMoney(stats.sales, cur)}
          delta="+12% vs mois dernier"
          icon={Wallet}
        />
        <StatCard
          label="Ventes"
          value={String(stats.salesCount)}
          delta="+8%"
          icon={ShoppingCart}
          tone="success"
        />
        <StatCard label="Produits" value={String(stats.products)} icon={Package} tone="warning" />
        <StatCard
          label="Clients"
          value={String(stats.customers)}
          delta="+3 nouveaux"
          icon={Users}
          tone="primary"
        />
      </div>

      {/* Sales Evolution Area Chart and Payment Pie Chart */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="shadow-soft lg:col-span-2 border-border/80">
          <CardHeader className="pb-2">
            <CardTitle className="font-display flex items-center gap-2 text-base md:text-lg">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
              Évolution des ventes
            </CardTitle>
          </CardHeader>
          <CardContent className="h-68 md:h-76 pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series}>
                <defs>
                  <linearGradient id="gp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.68 0.17 55)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="oklch(0.68 0.17 55)" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.06} />
                <XAxis dataKey="day" stroke="currentColor" fontSize={10} opacity={0.6} />
                <YAxis stroke="currentColor" fontSize={10} opacity={0.6} />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 12,
                    fontSize: 12,
                    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="oklch(0.68 0.17 55)"
                  strokeWidth={2}
                  fill="url(#gp)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-soft border-border/80">
          <CardHeader>
            <CardTitle className="font-display text-base md:text-lg flex items-center gap-2">
              <Star className="h-5 w-5 text-amber-500 fill-amber-500/20" />
              Modes de paiement
            </CardTitle>
          </CardHeader>
          <CardContent className="h-68 md:h-76 flex flex-col justify-between">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentData}
                    innerRadius={50}
                    outerRadius={75}
                    dataKey="value"
                    paddingAngle={4}
                  >
                    {paymentData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Products and Stock Alerts */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="shadow-soft lg:col-span-2 border-border/80">
          <CardHeader>
            <CardTitle className="font-display text-base md:text-lg">
              Top produits de la semaine
            </CardTitle>
          </CardHeader>
          <CardContent className="h-60 md:h-68 pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProducts.length > 0 ? topProducts : [{ n: "Aucune vente", v: 0 }]}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.06} />
                <XAxis dataKey="n" stroke="currentColor" fontSize={10} opacity={0.6} />
                <YAxis stroke="currentColor" fontSize={10} opacity={0.6} />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 12,
                    fontSize: 12,
                    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                  }}
                />
                <Bar dataKey="v" fill="oklch(0.62 0.14 160)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-soft border-red-500/20 bg-gradient-to-b from-transparent to-red-500/5">
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2 text-destructive text-base md:text-lg">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Alertes de Stock
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center pt-6 pb-8">
            <div className="text-center space-y-2">
              <div className="font-display text-5xl md:text-6xl font-black text-red-500 animate-pulse">
                {stats.lowStock}
              </div>
              <p className="text-xs md:text-sm text-muted-foreground/90 font-medium">
                produits sous le seuil critique de stock
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

