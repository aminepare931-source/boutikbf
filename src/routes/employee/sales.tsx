import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, EmptyState } from "@/components/page-parts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ShoppingCart, Search, Receipt } from "lucide-react";
import { fmtMoney } from "@/lib/format";
import { useShops } from "@/lib/shop-store";

export const Route = createFileRoute("/employee/sales")({
  head: () => ({ meta: [{ title: "Ventes — BoutikBF" }] }),
  component: EmployeeSales,
});

type Sale = {
  id: string;
  total: number;
  payment_method: string;
  status: string;
  created_at: string;
  reference: string | null;
};

function EmployeeSales() {
  const { current } = useShops();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!current?.id) return;
    loadSales();
  }, [current?.id]);

  const loadSales = async () => {
    if (!current?.id) return;
    setLoading(true);
    const { data } = await supabase
      .from("sales")
      .select("id, total, payment_method, status, created_at, reference")
      .eq("shop_id", current.id)
      .order("created_at", { ascending: false })
      .limit(50);

    setSales((data ?? []) as Sale[]);
    setLoading(false);
  };

  const filtered = sales.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      s.reference?.toLowerCase().includes(q) ||
      s.payment_method.toLowerCase().includes(q) ||
      s.id.toLowerCase().includes(q)
    );
  });

  const cur = current?.currency ?? "XOF";

  const paymentLabel: Record<string, string> = {
    cash: "Espèces",
    mobile: "Mobile Money",
    card: "Carte",
  };

  const statusLabel: Record<string, string> = {
    completed: "Terminée",
    pending: "En attente",
    cancelled: "Annulée",
  };

  const statusVariant: Record<string, "default" | "secondary" | "destructive"> = {
    completed: "default",
    pending: "secondary",
    cancelled: "destructive",
  };

  return (
    <div>
      <PageHeader title="Ventes" description="Historique des ventes" />

      <Card className="shadow-soft mb-4">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par référence, moyen de paiement..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={ShoppingCart}
          title="Aucune vente"
          description={search ? "Aucun résultat pour votre recherche" : "Aucune vente enregistrée"}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((sale) => (
            <Card key={sale.id} className="shadow-soft">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Receipt className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium text-sm">
                        {sale.reference || `#${sale.id.slice(0, 8)}`}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(sale.created_at).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{fmtMoney(sale.total, cur)}</div>
                    <div className="flex items-center gap-2 mt-1 justify-end">
                      <Badge variant="outline" className="text-xs">
                        {paymentLabel[sale.payment_method] || sale.payment_method}
                      </Badge>
                      <Badge
                        variant={statusVariant[sale.status] || "secondary"}
                        className="text-xs"
                      >
                        {statusLabel[sale.status] || sale.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
