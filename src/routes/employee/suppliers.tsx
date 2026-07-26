import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/page-parts";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useShops } from "@/lib/shop-store";
import { toast } from "sonner";
import { Search, Truck, Phone, MapPin } from "lucide-react";

export const Route = createFileRoute("/employee/suppliers")({
  head: () => ({ meta: [{ title: "Fournisseurs — BoutikBF" }] }),
  component: EmployeeSuppliers,
});

type Supplier = {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  created_at: string;
};

function EmployeeSuppliers() {
  const { current } = useShops();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  useEffect(() => {
    if (!current?.id) return;
    setLoading(true);
    supabase
      .from("suppliers")
      .select("id, name, phone, address, created_at")
      .eq("shop_id", current.id)
      .order("name", { ascending: true })
      .then(({ data, error }) => {
        if (error) toast.error("Erreur chargement fournisseurs");
        else setSuppliers((data ?? []) as Supplier[]);
        setLoading(false);
      });
  }, [current?.id]);

  const filtered = suppliers.filter((s) => {
    const search = q.toLowerCase();
    return (
      s.name.toLowerCase().includes(search) ||
      (s.phone ?? "").toLowerCase().includes(search)
    );
  });

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
        title="Fournisseurs"
        description="Liste des fournisseurs"
      />

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher un fournisseur..."
          className="pl-9"
        />
      </div>

      {filtered.length === 0 ? (
        <Card className="shadow-soft">
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            <Truck className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
            {q ? "Aucun fournisseur trouvé" : "Aucun fournisseur enregistré"}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((s) => (
            <Card key={s.id} className="shadow-soft hover:border-primary/50 transition">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-amber-500/10 text-amber-600">
                    <Truck className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{s.name}</div>
                  </div>
                </div>
                <div className="space-y-1 text-xs text-muted-foreground">
                  {s.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-3 w-3" />
                      {s.phone}
                    </div>
                  )}
                  {s.address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3 w-3" />
                      {s.address}
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