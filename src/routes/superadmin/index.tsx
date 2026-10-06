import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Store,
  Users,
  ShoppingCart,
  Wallet,
  AlertTriangle,
  Clock,
  Ban,
  Package,
} from "lucide-react";
import { PageHeader, StatCard } from "@/components/page-parts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { adminRpc } from "@/lib/superadmin";
import { fmtMoney, fmtNumber } from "@/lib/format";

export const Route = createFileRoute("/superadmin/")({ component: Overview });

type Overview = Record<string, number>;

function Overview() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["sa-overview"],
    queryFn: () => adminRpc<Overview>("admin_overview"),
  });

  if (isLoading)
    return <Loader2 className="mx-auto mt-20 h-6 w-6 animate-spin text-muted-foreground" />;
  if (error || !data)
    return (
      <p className="mt-10 text-center text-sm text-destructive">
        {(error as Error)?.message ?? "Erreur"} — la migration SQL a-t-elle été exécutée ?
      </p>
    );

  return (
    <>
      <PageHeader
        title="Vue d'ensemble"
        description="Toute la plateforme BoutikBF en un coup d'œil."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Boutiques"
          value={fmtNumber(data.shops)}
          delta={`+${data.shops_7d} cette semaine`}
          icon={Store}
        />
        <StatCard
          label="Utilisateurs"
          value={fmtNumber(data.users)}
          delta={`+${data.users_7d} cette semaine`}
          icon={Users}
        />
        <StatCard
          label="Ventes enregistrées"
          value={fmtNumber(data.sales)}
          icon={ShoppingCart}
          tone="success"
        />
        <StatCard
          label="Volume de ventes"
          value={fmtMoney(Number(data.sales_total))}
          icon={Wallet}
          tone="success"
        />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Essais expirés"
          value={fmtNumber(data.trials_expired)}
          icon={AlertTriangle}
          tone="destructive"
        />
        <StatCard
          label="Essais finissant sous 3 jours"
          value={fmtNumber(data.trials_ending_3d)}
          icon={Clock}
          tone="warning"
        />
        <StatCard
          label="Boutiques suspendues"
          value={fmtNumber(data.suspended)}
          icon={Ban}
          tone="destructive"
        />
        <StatCard label="Produits au total" value={fmtNumber(data.products)} icon={Package} />
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="font-display text-lg">Répartition des formules</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-4">
          {[
            ["Essai gratuit", data.plan_essentiel],
            ["Essentiel payé", data.plan_essentiel_paid],
            ["Pro", data.plan_pro],
            ["Sur mesure", data.plan_sur_mesure],
          ].map(([label, n]) => (
            <div key={label as string} className="rounded-xl border border-border p-4">
              <div className="text-xs text-muted-foreground">{label}</div>
              <div className="mt-1 font-display text-2xl font-bold">{fmtNumber(n as number)}</div>
            </div>
          ))}
        </CardContent>
      </Card>

      <p className="mt-6 text-sm text-muted-foreground">
        Un client a payé par transfert ? Va dans{" "}
        <Link to="/superadmin/shops" className="font-medium text-primary underline">
          Boutiques
        </Link>{" "}
        et change sa formule en un clic.
      </p>
    </>
  );
}
