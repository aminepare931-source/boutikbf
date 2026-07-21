import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, EmptyState } from "@/components/page-parts";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Package, Search } from "lucide-react";
import { fmtMoney } from "@/lib/format";
import { useShops } from "@/lib/shop-store";

export const Route = createFileRoute("/employee/products")({
  head: () => ({ meta: [{ title: "Produits — BoutikBF" }] }),
  component: EmployeeProducts,
});

type Product = {
  id: string;
  name: string;
  sku: string | null;
  sale_price: number;
  cost_price: number | null;
  stock: number;
  stock_min: number | null;
  unit: string | null;
  is_active: boolean;
};

function EmployeeProducts() {
  const { current } = useShops();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!current?.id) return;
    loadProducts();
  }, [current?.id]);

  const loadProducts = async () => {
    if (!current?.id) return;
    setLoading(true);
    const { data } = await supabase
      .from("products")
      .select("id, name, sku, sale_price, cost_price, stock, stock_min, unit, is_active")
      .eq("shop_id", current.id)
      .order("name", { ascending: true });

    setProducts((data ?? []) as Product[]);
    setLoading(false);
  };

  const filtered = products.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q);
  });

  const cur = current?.currency ?? "XOF";

  return (
    <div>
      <PageHeader title="Produits" description="Catalogue et gestion des produits" />

      <Card className="shadow-soft mb-4">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom ou SKU..."
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
          icon={Package}
          title="Aucun produit"
          description={
            search ? "Aucun résultat pour votre recherche" : "Aucun produit dans le catalogue"
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((product) => (
            <Card key={product.id} className="shadow-soft">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm truncate">{product.name}</h3>
                    {product.sku && (
                      <p className="text-xs text-muted-foreground mt-0.5">SKU: {product.sku}</p>
                    )}
                  </div>
                  <Badge variant={product.is_active ? "default" : "secondary"} className="shrink-0">
                    {product.is_active ? "Actif" : "Inactif"}
                  </Badge>
                </div>

                <div className="mt-3 space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Prix vente</span>
                    <span className="font-semibold">{fmtMoney(product.sale_price, cur)}</span>
                  </div>
                  {product.cost_price != null && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Prix achat</span>
                      <span className="font-semibold">{fmtMoney(product.cost_price, cur)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Stock</span>
                    <Badge
                      variant={
                        product.stock <= 0
                          ? "destructive"
                          : product.stock_min != null && product.stock <= product.stock_min
                            ? "secondary"
                            : "default"
                      }
                    >
                      {product.stock} {product.unit || ""}
                    </Badge>
                  </div>
                  {product.stock_min != null && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Stock min</span>
                      <span>{product.stock_min}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
