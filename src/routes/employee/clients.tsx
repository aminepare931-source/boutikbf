import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, EmptyState } from "@/components/page-parts";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Users, Search, Phone, Mail, MapPin } from "lucide-react";
import { useShops } from "@/lib/shop-store";

export const Route = createFileRoute("/employee/clients")({
  head: () => ({ meta: [{ title: "Clients — BoutikBF" }] }),
  component: EmployeeClients,
});

type Client = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  created_at: string;
};

function EmployeeClients() {
  const { current } = useShops();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!current?.id) return;
    loadClients();
  }, [current?.id]);

  const loadClients = async () => {
    if (!current?.id) return;
    setLoading(true);
    const { data } = await supabase
      .from("customers")
      .select("id, name, phone, email, address, created_at")
      .eq("shop_id", current.id)
      .order("name", { ascending: true });

    setClients((data ?? []) as Client[]);
    setLoading(false);
  };

  const filtered = clients.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.phone?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <PageHeader title="Clients" description="Gestion des clients" />

      <Card className="shadow-soft mb-4">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom, téléphone ou email..."
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
          icon={Users}
          title="Aucun client"
          description={search ? "Aucun résultat pour votre recherche" : "Aucun client enregistré"}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((client) => (
            <Card key={client.id} className="shadow-soft">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm truncate">{client.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      Client depuis{" "}
                      {new Date(client.created_at).toLocaleDateString("fr-FR", {
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>

                <div className="mt-3 space-y-1.5">
                  {client.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="truncate">{client.phone}</span>
                    </div>
                  )}
                  {client.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="truncate">{client.email}</span>
                    </div>
                  )}
                  {client.address && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="truncate">{client.address}</span>
                    </div>
                  )}
                </div>

                {!client.phone && !client.email && !client.address && (
                  <p className="text-xs text-muted-foreground mt-2">Aucun contact renseigné</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
