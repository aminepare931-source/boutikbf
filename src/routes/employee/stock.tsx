import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/page-parts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useShops } from "@/lib/shop-store";
import { fmtMoney } from "@/lib/format";
import { toast } from "sonner";
import { Search, Package, AlertTriangle, TrendingUp, TrendingDown, Loader2 } from "lucide-react";

export const Route = createFileRoute("/employee/stock")({
  head: () => ({ meta: [{ title: "Stock — BoutikBF" }] }),
  component: EmployeeStock,
});

type Product = {
  id: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  stock: number;
  sale_price: number;
  unit: string;
  is_active: boolean;
};

function EmployeeStock() {
  const { current } = useShops();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    if (!current?.id) return;
    setLoading(true);
    supabase
      .from("products")
      .select("id, name, sku, barcode, stock, sale_price, unit, is_active")
      .eq("shop_id", current.id)
      .order("stock", { ascending: true })
      .then(({ data, error }) => {
        if (error) toast.error("Erreur chargement stock");
        else setProducts((data ?? []) as Product[]);
        setLoading(false);
      });
  }, [current?.id]);

  const updateStock = async (id: string, delta: number) => {
    setUpdating(id);
    const product = products.find((p) => p.id === id);
    if (!product) return;
    const newStock = Math.max(0, product.stock + delta);
    const { error } = await supabase
      .from("products")
      .update({ stock: newStock })
      .eq("id", id);
    if (error) toast.error("Erreur mise à jour stock");
    else {
      setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, stock: newStock } : p)));
      toast.success(`Stock mis à jour : ${newStock}`);
    }
    setUpdating(null);
  };

  const filtered = products.filter((p) => {
    const s = q.toLowerCase();
    return (
      p.name.toLowerCase().includes(s) ||
      (p.sku ?? "").toLowerCase().includes(s) ||
      (p.barcode ?? "").toLowerCase().includes(s)
    );
  });

  const lowStock = products.filter((p) => p.stock < 5).length;
  const outOfStock = products.filter((p) => p.stock === 0).length;
  const totalItems = products.reduce((a, p) => a + p.stock, 0);

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
        title="Stock"
        description="Gestion des stocks et inventaire"
      />

      {/* Stats */}
      <div className="grid gap-4 mb-6 md:grid-cols-4">
        <Card className="shadow-soft">
          <CardContent className="p-4 text-center">
            <Package className="h-5 w-5 mx-auto mb-1 text-primary" />
            <div className="text-2xl font-bold">{products.length}</div>
            <p className="text-xs text-muted-foreground">Produits</p>
          </CardContent>
        </Card>
        <Card className="shadow-soft border-green-500/20">
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-5 w-5 mx-auto mb-1 text-green-600" />
            <div className="text-2xl font-bold text-green-600">{totalItems}</div>
            <p className="text-xs text-muted-foreground">Articles en stock</p>
          </CardContent>
        </Card>
        <Card className="shadow-soft border-amber-500/20">
          <CardContent className="p-4 text-center">
            <AlertTriangle className="h-5 w-5 mx-auto mb-1 text-amber-600" />
            <div className="text-2xl font-bold text-amber-600">{lowStock}</div>
            <p className="text-xs text-muted-foreground">Stock bas (<5)</p>
          </CardContent>
        </Card>
        <Card className="shadow-soft border-red-500/20">
          <CardContent className="p-4 text-center">
            <TrendingDown className="h-5 w-5 mx-auto mb-1 text-red-600" />
            <div className="text-2xl font-bold text-red-600">{outOfStock}</div>
            <p className="text-xs text-muted-foreground">En rupture</p>
          </CardContent>
        </Card>
      </div>

      {/* Recherche */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher un produit..."
          className="pl-9"
        />
      </div>

      {/* Liste des produits */}
      <Card className="shadow-soft">
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Aucun produit trouvé
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((p) => (
                <div key={p.id} className="flex items-center gap-4 p-4 hover:bg-muted/30 transition">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{p.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {p.sku && <span className="font-mono">{p.sku}</span>}
                      {p.sku && p.barcode && <span> · </span>}
                      {p.barcode && <span className="font-mono">{p.barcode}</span>}
                      <span> · {fmtMoney(p.sale_price, current?.currency)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateStock(p.id, -1)}
                      disabled={updating === p.id || p.stock <= 0}
                    >
                      -
                    </Button>
                    <div className="text-center min-w-[60px]">
                      <div className={`text-lg font-bold ${p.stock < 5 ? "text-red-600" : p.stock < 10 ? "text-amber-600" : "text-green-700"}`}>
                        {p.stock}
                      </div>
                      <div className="text-[10px] text-muted-foreground">{p.unit}</div>
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateStock(p.id, 1)}
                      disabled={updating === p.id}
                    >
                      +
                    </Button>
                  </div>
                  {p.stock === 0 && (
                    <Badge variant="destructive" className="text-[10px]">Rupture</Badge>
                  )}
                  {p.stock > 0 && p.stock < 5 && (
                    <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-600">Stock bas</Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}