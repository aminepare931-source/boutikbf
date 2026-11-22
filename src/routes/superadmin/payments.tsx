import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-parts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { adminRpc, PLAN_LABELS } from "@/lib/superadmin";
import { confirmPayment } from "@/lib/payments/client";
import { fmtMoney } from "@/lib/format";

export const Route = createFileRoute("/superadmin/payments")({ component: PaymentsPage });

type Intent = {
  id: string;
  ref: string;
  provider_ref: string | null;
  status: string;
  amount: number;
  fees: number | null;
  net_amount: number | null;
  plan: string;
  period: string;
  method: string | null;
  environment: string | null;
  failure_reason: string | null;
  created_at: string;
  paid_at: string | null;
  shop_name: string;
  shop_id: string;
};

const STATUS: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  created: { label: "Créé", variant: "outline" },
  pending: { label: "En attente", variant: "outline" },
  processing: { label: "En cours", variant: "secondary" },
  paid: { label: "Payé", variant: "default" },
  failed: { label: "Échoué", variant: "destructive" },
  cancelled: { label: "Annulé", variant: "destructive" },
  expired: { label: "Expiré", variant: "destructive" },
  refunded: { label: "Remboursé", variant: "secondary" },
};

const when = (d: string | null) =>
  d
    ? new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short" }).format(
        new Date(d),
      )
    : "—";

function PaymentsPage() {
  const qc = useQueryClient();
  const [checking, setChecking] = useState<string | null>(null);
  const { data, isLoading, error } = useQuery({
    queryKey: ["sa-payments"],
    queryFn: () => adminRpc<Intent[]>("admin_list_payment_intents", { p_limit: 100 }),
  });

  const recheck = async (ref: string) => {
    setChecking(ref);
    const res = await confirmPayment(ref);
    setChecking(null);
    if (!res)
      toast.error(
        "Vérification impossible (paiement en ligne non configuré ou GeniusPay injoignable).",
      );
    else
      toast.success(
        res.activated
          ? "Paiement confirmé, formule activée"
          : `Statut chez GeniusPay : ${res.status}`,
      );
    void qc.invalidateQueries({ queryKey: ["sa-payments"] });
  };

  const rows = data ?? [];
  const paid = rows.filter((r) => r.status === "paid" && r.environment === "live");
  const gross = paid.reduce((s, r) => s + Number(r.amount), 0);
  const fees = paid.reduce((s, r) => s + Number(r.fees ?? 0), 0);

  return (
    <>
      <PageHeader
        title="Paiements en ligne"
        description="Abonnements payés par Orange Money ou Moov Money via GeniusPay."
      />
      {isLoading && (
        <Loader2 className="mx-auto mt-10 h-6 w-6 animate-spin text-muted-foreground" />
      )}
      {error && (
        <p className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {(error as Error).message}. Si la fonction est introuvable, exécute le fichier
          APPLIQUER_PAIEMENTS_EN_LIGNE.sql dans le SQL Editor de Supabase.
        </p>
      )}
      {data && (
        <>
          <div className="mb-4 grid gap-3 sm:grid-cols-3">
            <Card className="shadow-soft">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Encaissé (réel)</p>
                <p className="mt-1 font-display text-xl font-bold">{fmtMoney(gross)}</p>
              </CardContent>
            </Card>
            <Card className="shadow-soft">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Frais GeniusPay</p>
                <p className="mt-1 font-display text-xl font-bold">{fmtMoney(fees)}</p>
              </CardContent>
            </Card>
            <Card className="shadow-soft">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Net pour BoutikBF</p>
                <p className="mt-1 font-display text-xl font-bold text-success">
                  {fmtMoney(gross - fees)}
                </p>
              </CardContent>
            </Card>
          </div>

          {rows.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Aucun paiement en ligne pour le moment.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Boutique</TableHead>
                    <TableHead>Formule</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                    <TableHead className="text-right">Frais</TableHead>
                    <TableHead>Moyen</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => {
                    const st = STATUS[r.status] ?? { label: r.status, variant: "outline" as const };
                    const open =
                      ["created", "pending", "processing"].includes(r.status) && !!r.provider_ref;
                    return (
                      <TableRow key={r.id}>
                        <TableCell className="whitespace-nowrap text-sm">
                          {when(r.created_at)}
                        </TableCell>
                        <TableCell>
                          <Link
                            to="/superadmin/shop/$shopId"
                            params={{ shopId: r.shop_id }}
                            className="font-medium text-primary hover:underline"
                          >
                            {r.shop_name}
                          </Link>
                          <div className="font-mono text-[10px] text-muted-foreground">
                            {r.provider_ref ?? r.ref}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {PLAN_LABELS[r.plan] ?? r.plan} ·{" "}
                          {r.period === "year" ? "1 an" : "1 mois"}
                        </TableCell>
                        <TableCell className="text-right font-semibold tabular-nums">
                          {fmtMoney(Number(r.amount))}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-muted-foreground">
                          {r.fees != null ? fmtMoney(Number(r.fees)) : "—"}
                        </TableCell>
                        <TableCell className="text-sm">
                          {r.method?.replace("_", " ") ?? "—"}
                          {r.environment && r.environment !== "live" && (
                            <Badge variant="outline" className="ml-1.5">
                              test
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={st.variant}>{st.label}</Badge>
                          {r.failure_reason && (
                            <div className="mt-0.5 text-[10px] text-muted-foreground">
                              {r.failure_reason}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {open && (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={checking === r.ref}
                              onClick={() => void recheck(r.ref)}
                            >
                              <RefreshCw
                                className={`mr-1.5 h-3.5 w-3.5 ${checking === r.ref ? "animate-spin" : ""}`}
                              />
                              Vérifier
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </>
      )}
    </>
  );
}
