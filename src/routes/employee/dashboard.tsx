import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, StatCard } from "@/components/page-parts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, ShoppingCart, Package, Users, TrendingUp, AlertTriangle } from "lucide-react";
import { fmtMoney } from "@/lib/format";
import { useShops } from "@/lib/shop-store";

export const Route = createFileRoute("/employee/dashboard")({
  head: () => ({ meta: [{ title: "Tableau de bord — BoutikBF" }] }),
  component: EmployeeDashboard,
});

function EmployeeDashboard() {
  const { current } = useShops();
  const [stats, setStats] = useState({
    sales: 0,
    salesCount: 0,
    products: 0,
    customers: 0,
    lowStock: 0,
  });
  const [series, setSeries] = useState<{ day: string; total: number }[]>([]);

  useEffect(() => {
    if (!current?.id) return;
    (async () => {
      const since = new Date();
      since.setDate(since.getDate() - 30);
      const [salesRes, prodRes, custRes, lowRes] = await Promise.all([
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
      ]);
      const sales = (salesRes.data ?? []) as { total: number; created_at: string }[];
      const total = sales.reduce((a, s) => a + Number(s.total), 0);
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
    })();
  }, [current?.id]);

  const cur = current?.currency ?? "XOF";

  return (
    <div>
      <PageHeader
        title="Tableau de bord"
        description={
          current?.name
            ? `Aperçu de ${current.name} — 30 derniers jours`
            : "Sélectionnez une boutique"
        }
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="shadow-soft lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2 text-base md:text-lg">
              <TrendingUp className="h-4 w-4 text-primary" />
              Évolution des ventes
            </CardTitle>
          </CardHeader>
          <CardContent className="h-64 md:h-72">
            {series.length > 0 ? (
              <div className="flex h-full items-end gap-1">
                {series.map((s) => {
                  const max = Math.max(...series.map((x) => x.total), 1);
                  const h = (s.total / max) * 100;
                  return (
                    <div
                      key={s.day}
                      className="flex-1 flex flex-col items-center gap-1 group relative"
                    >
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
                Aucune vente sur les 30 derniers jours
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-soft border-warning/40">
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2 text-base md:text-lg">
              <AlertTriangle className="h-4 w-4 text-warning" />
              Alertes stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="font-display text-4xl md:text-5xl font-bold text-warning">
                {stats.lowStock}
              </div>
              <p className="mt-2 text-xs md:text-sm text-muted-foreground">
                produits sous le seuil critique
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
