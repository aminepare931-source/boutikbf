import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/page-parts";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useShops } from "@/lib/shop-store";
import { toast } from "sonner";
import { User, UserCog, Calendar, Activity } from "lucide-react";

export const Route = createFileRoute("/employee/team")({
  head: () => ({ meta: [{ title: "Mon équipe — BoutikBF" }] }),
  component: EmployeeTeam,
});

type Employee = {
  id: string;
  name: string;
  phone: string;
  role: string;
  pin: string;
  created_at: string;
  is_active: boolean;
};

const ROLE_LABELS: Record<string, string> = {
  caissier: "Caissier / Vendeur",
  gerant: "Gérant de boutique",
  comptable: "Comptable",
  magasinier: "Magasinier / Stock",
  commercial: "Commercial / Vendeur terrain",
  superviseur: "Superviseur",
};

const ROLE_BADGES: Record<string, "default" | "secondary" | "outline"> = {
  caissier: "outline",
  gerant: "default",
  comptable: "secondary",
  magasinier: "outline",
  commercial: "outline",
  superviseur: "default",
};

function EmployeeTeam() {
  const { current } = useShops();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!current?.id) return;
    setLoading(true);
    supabase
      .from("employees" as any)
      .select("*")
      .eq("shop_id", current.id)
      .order("created_at", { ascending: false })
      .then(({ data, error }: any) => {
        if (error) toast.error("Erreur chargement équipe");
        else setEmployees((data ?? []) as Employee[]);
        setLoading(false);
      });
  }, [current?.id]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

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
        title="Mon équipe"
        description="Liste des membres de l'équipe"
      />

      {employees.length === 0 ? (
        <Card className="shadow-soft">
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            <UserCog className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
            Aucun membre dans l'équipe pour le moment
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {employees.map((emp) => (
            <Card key={emp.id} className="shadow-soft hover:border-primary/50 transition">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-primary text-primary-foreground">
                    <User className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{emp.name}</div>
                    <Badge variant={ROLE_BADGES[emp.role] || "outline"} className="text-[10px]">
                      {ROLE_LABELS[emp.role] || emp.role}
                    </Badge>
                  </div>
                  {!emp.is_active && (
                    <Badge variant="outline" className="text-destructive border-destructive text-[10px]">
                      Inactif
                    </Badge>
                  )}
                </div>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Activity className="h-3 w-3" />
                    {emp.phone || "Téléphone non renseigné"}
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    Membre depuis {formatDate(emp.created_at)}
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