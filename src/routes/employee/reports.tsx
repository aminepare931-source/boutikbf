import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, StatCard } from "@/components/page-parts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useShops } from "@/lib/shop-store";
import { fmtMoney } from "@/lib/format";
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Users,
  Calendar,
  ArrowUp,
  ArrowDown,
  Wallet,
  Package,
} from "lucide-react";

export const Route = createFileRoute("/employee/reports")({
  head: () => ({ meta: [{ title: "Rapports — BoutikBF" }] }),
  component: EmployeeReports,
});

function EmployeeReports() {
  const { current } = useShops();
  const [period, setPeriod] = useState<"7" | "30" | "90">("30");
  const [stats, setStats] = useState({
    revenue: 0,
    salesCount: 0,
    avgBasket: 0,
    topProduct: { name: "", count: 0 },
    bestDay: { day: "", total: 0 },
    paymentMethods: {} as Record<string, number>,
    dailySeries: [] as { day: string; total: number }[],
    customers: 0,
    products: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!current?.id) return;
    setLoading(true);
    (async () => {
      const since = new Date();
      since.setDate(since.getDate() - Number(period));
      const sinceStr = since.toISOString();

      // Ventes
      const { data: sales } = await supabase
        .from("sales")
        .select("total, created_at, payment_method")
        .eq("shop_id", current.id)
        .gte("created_at", sinceStr);

      // Produits vendus
      const { data: saleItems } = await supabase
        .from("sale_items")
        .select("product_name, quantity")
        .eq("shop_id", current.id)
        .gte("created_at", sinceStr);

      // Clients
      const { count: customers } = await supabase
        .from("customers")
        .select("id", { count: "exact", head: true })
        .eq("shop_id", current.id);

      // Produits
      const { count: products } = await supabase
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("shop_id", current.id);

      const salesData = (sales ?? []) as { total: number; created_at: string; payment_method: string }[];
      const itemsData = (saleItems ?? []) as { product_name: string; quantity: number }[];

      const totalRevenue = salesData.reduce((a, s) => a + Number(s.total), 0);
      const totalSales = salesData.length;

      // Top produit
      const productCount: Record<string, number> = {};
      itemsData.forEach((item) => {
        productCount[item.product_name] = (productCount[item.product_name] || 0) + (item.quantity || 1);
      });
      const topProduct = Object.entries(productCount).sort((a, b) => b[1] - a[1])[0] || { 0: "—", 1: 0 };

      // Méthodes de paiement
      const methods: Record<string, number> = {};
      salesData.forEach((s) => {
        methods[s.payment_method] = (methods[s.payment_method] || 0) + 1;
      });

      // Série quotidienne
      const byDay = new Map<string, number>();
      const days = Number(period);
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        byDay.set(d.toISOString().slice(0, 10), 0);
      }
      salesData.forEach((s) => {
        const k = s.created_at.slice(0, 10);
        if (byDay.has(k)) byDay.set(k, (byDay.get(k) ?? 0) + Number(s.total));
      });

      // Meilleur jour
      let bestDay = { day: "", total: 0 };
      byDay.forEach((total, day) => {
        if (total > bestDay.total) bestDay = { day, total };
      });

      setStats({
        revenue: totalRevenue,
        salesCount: totalSales,
        avgBasket: totalSales > 0 ? Math.round(totalRevenue / totalSales) : 0,
        topProduct: { name: topProduct[0], count: topProduct[1] },
        bestDay,
        paymentMethods: methods,
        dailySeries: Array.from(byDay.entries()).map(([day, total]) => ({ day: day.slice(5), total })),
        customers: customers ?? 0,
        products: products ?? 0,
      });
      setLoading(false);
    })();
  }, [current?.id, period]);

  const cur = current?.currency ?? "XOF";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Rapports"
        description="Statistiques et analyses de votre activité"
        actions={
          <div className="flex gap-1">
            {(["7", "30", "90"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                  period === p
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                }`}
              >
                {p === "7" ? "7 jours" : p === "30" ? "30 jours" : "90 jours"}
              </button>
            ))}
          </div>
        }
      />

      {/* Stats principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Chiffre d'affaires"
          value={fmtMoney(stats.revenue, cur)}
          icon={DollarSign}
        />
        <StatCard
          label="Ventes"
          value={String(stats.salesCount)}
          icon={ShoppingCart}
          tone="success"
        />
        <StatCard
          label="Panier moyen"
          value={fmtMoney(stats.avgBasket, cur)}
          icon={TrendingUp}
          tone="warning"
        />
        <StatCard
          label="Clients"
          value={String(stats.customers)}
          icon={Users}
          tone="primary"
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {/* Graphique */}
        <Card className="shadow-soft lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-primary" />
              Évolution des ventes
            </CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            {stats.dailySeries.length > 0 ? (
              <div className="flex h-full items-end gap-1">
                {stats.dailySeries.map((s) => {
                  const max = Math.max(...stats.dailySeries.map((x) => x.total), 1);
                  const h = (s.total / max) * 100;
                  return (
                    <div key={s.day} className="flex-1 flex flex-col items-center gap-1 group relative">
                      <div className="absolute bottom-full mb-1 hidden group-hover:block bg-popover text-popover-foreground text-xs px-2 py-1 rounded shadow whitespace-nowrap z-10">
                        {fmtMoney(s.total, cur)}
                      </div>
                      <div
                        className="w-full rounded-t bg-primary/60 hover:bg-primary transition-colors"
                        style={{ height: `${Math.max(h, 1)}%` }}
                      />
                      <span className="text-[10px] text-muted-foreground rotate-45 origin-left whitespace-nowrap">
                        {s.day}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Aucune donnée pour cette période
              </div>
            )}
          </CardContent>
        </Card>

        {/* Meilleur jour & Top produit */}
        <div className="space-y-4">
          <Card className="shadow-soft border-emerald-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="font-display flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-emerald-500" />
                Meilleur jour
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats.bestDay.total > 0 ? (
                <>
                  <div className="text-2xl font-bold text-emerald-600">
                    {fmtMoney(stats.bestDay.total, cur)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(stats.bestDay.day).toLocaleDateString("fr-FR", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })}
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Aucune donnée</p>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-soft border-amber-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="font-display flex items-center gap-2 text-sm">
                <Package className="h-4 w-4 text-amber-500" />
                Top produit
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats.topProduct.name !== "—" ? (
                <>
                  <div className="font-bold text-foreground truncate">
                    {stats.topProduct.name}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.topProduct.count} vendu(s)
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Aucune vente</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Méthodes de paiement */}
      {Object.keys(stats.paymentMethods).length > 0 && (
        <Card className="mt-4 shadow-soft">
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2 text-base">
              <Wallet className="h-4 w-4 text-primary" />
              Méthodes de paiement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-3">
              {Object.entries(stats.paymentMethods).map(([method, count]) => {
                const total = stats.salesCount;
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                  <div key={method} className="rounded-lg border border-border p-4 text-center">
                    <div className="text-2xl font-bold text-foreground">{pct}%</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {method === "cash" ? "💵 Espèces" : method === "mobile" ? "📱 Mobile Money" : "💳 Carte"}
                    </div>
                    <div className="text-xs text-muted-foreground">{count} transaction(s)</div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}