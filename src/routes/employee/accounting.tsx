import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, StatCard } from "@/components/page-parts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wallet, TrendingUp, TrendingDown, DollarSign, Receipt, ShoppingCart } from "lucide-react";
import { fmtMoney } from "@/lib/format";
import { useShops } from "@/lib/shop-store";

export const Route = createFileRoute("/employee/accounting")({
  head: () => ({ meta: [{ title: "Comptabilité — BoutikBF" }] }),
  component: EmployeeAccounting,
});

function EmployeeAccounting() {
  const { current } = useShops();
  const [stats, setStats] = useState({
    revenue: 0,
    salesCount: 0,
    expenses: 0,
    profit: 0,
    cashSales: 0,
    mobileSales: 0,
    cardSales: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!current?.id) return;
    loadAccounting();
  }, [current?.id]);

  const loadAccounting = async () => {
    if (!current?.id) return;
    setLoading(true);
    try {
      const since = new Date();
      since.setDate(since.getDate() - 30);

      // Ventes des 30 derniers jours
      const { data: sales } = await supabase
        .from("sales")
        .select("total, payment_method")
        .eq("shop_id", current.id)
        .gte("created_at", since.toISOString());

      const salesList = (sales ?? []) as { total: number; payment_method: string }[];
      const revenue = salesList.reduce((sum, s) => sum + Number(s.total), 0);
      const salesCount = salesList.length;

      // Par méthode de paiement
      const cashSales = salesList
        .filter((s) => s.payment_method === "cash")
        .reduce((sum, s) => sum + Number(s.total), 0);
      const mobileSales = salesList
        .filter((s) => s.payment_method === "mobile")
        .reduce((sum, s) => sum + Number(s.total), 0);
      const cardSales = salesList
        .filter((s) => s.payment_method === "card")
        .reduce((sum, s) => sum + Number(s.total), 0);

      // Coût des produits vendus (approximatif via le prix d'achat)
      const { data: products } = await supabase
        .from("products")
        .select("cost_price")
        .eq("shop_id", current.id);

      const productList = (products ?? []) as { cost_price: number }[];
      const totalCost = productList.reduce((sum, p) => sum + Number(p.cost_price || 0), 0);

      // Dépenses (mouvements de stock "in" avec raison "achat")
      const { data: stockMovements } = await supabase
        .from("stock_movements")
        .select("quantity, reason")
        .eq("shop_id", current.id)
        .eq("type", "in")
        .gte("created_at", since.toISOString());

      const movements = (stockMovements ?? []) as { quantity: number; reason: string }[];
      const expenses = movements.reduce((sum, m) => sum + Number(m.quantity || 0), 0);

      setStats({
        revenue,
        salesCount,
        expenses,
        profit: revenue - expenses,
        cashSales,
        mobileSales,
        cardSales,
      });
    } catch (error) {
      console.error("Erreur chargement comptabilité:", error);
    }
    setLoading(false);
  };

  const cur = current?.currency ?? "XOF";

  if (loading) {
    return (
      <div>
        <PageHeader title="Comptabilité" description="Argent qui entre et sort" />
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Comptabilité" description="Argent qui entre et sort — 30 derniers jours" />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Chiffre d'affaires"
          value={fmtMoney(stats.revenue, cur)}
          icon={Wallet}
          tone="primary"
        />
        <StatCard
          label="Ventes"
          value={String(stats.salesCount)}
          icon={ShoppingCart}
          tone="success"
        />
        <StatCard
          label="Dépenses"
          value={fmtMoney(stats.expenses, cur)}
          icon={TrendingDown}
          tone="warning"
        />
        <StatCard
          label="Bénéfice"
          value={fmtMoney(stats.profit, cur)}
          icon={TrendingUp}
          tone={stats.profit >= 0 ? "success" : "destructive"}
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {/* Répartition par méthode de paiement */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2 text-base">
              <DollarSign className="h-4 w-4 text-primary" />
              Répartition par moyen de paiement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/20">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-primary" />
                  <span className="text-sm font-medium">Espèces</span>
                </div>
                <div className="text-right">
                  <div className="font-bold">{fmtMoney(stats.cashSales, cur)}</div>
                  <div className="text-xs text-muted-foreground">
                    {stats.revenue > 0
                      ? `${Math.round((stats.cashSales / stats.revenue) * 100)}%`
                      : "0%"}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-success/5 border border-success/20">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-success" />
                  <span className="text-sm font-medium">Mobile Money</span>
                </div>
                <div className="text-right">
                  <div className="font-bold">{fmtMoney(stats.mobileSales, cur)}</div>
                  <div className="text-xs text-muted-foreground">
                    {stats.revenue > 0
                      ? `${Math.round((stats.mobileSales / stats.revenue) * 100)}%`
                      : "0%"}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-warning/5 border border-warning/20">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-warning" />
                  <span className="text-sm font-medium">Carte</span>
                </div>
                <div className="text-right">
                  <div className="font-bold">{fmtMoney(stats.cardSales, cur)}</div>
                  <div className="text-xs text-muted-foreground">
                    {stats.revenue > 0
                      ? `${Math.round((stats.cardSales / stats.revenue) * 100)}%`
                      : "0%"}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Résumé financier */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2 text-base">
              <Receipt className="h-4 w-4 text-primary" />
              Résumé financier
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                <span className="text-sm">Chiffre d'affaires brut</span>
                <span className="font-bold text-success">{fmtMoney(stats.revenue, cur)}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                <span className="text-sm">Dépenses totales</span>
                <span className="font-bold text-destructive">{fmtMoney(stats.expenses, cur)}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/50">
                <span className="text-sm font-medium">Bénéfice net</span>
                <span
                  className={`font-bold text-lg ${
                    stats.profit >= 0 ? "text-success" : "text-destructive"
                  }`}
                >
                  {fmtMoney(stats.profit, cur)}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                <span className="text-sm">Marge bénéficiaire</span>
                <Badge variant={stats.profit >= 0 ? "default" : "destructive"}>
                  {stats.revenue > 0
                    ? `${Math.round((stats.profit / stats.revenue) * 100)}%`
                    : "0%"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
