import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Search, Settings2, Trash2, Ban, CheckCircle2, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-parts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { adminRpc, PLAN_LABELS, trialDaysLeft, type AdminShop } from "@/lib/superadmin";
import { fmtDate, fmtMoney, fmtNumber } from "@/lib/format";

export const Route = createFileRoute("/superadmin/shops")({ component: ShopsPage });

function planBadge(s: AdminShop) {
  if (s.is_suspended) return <Badge variant="destructive">Suspendue</Badge>;
  if (s.plan === "essentiel") {
    const d = trialDaysLeft(s);
    if (d <= 0) return <Badge variant="destructive">Essai expiré</Badge>;
    return <Badge variant="secondary">Essai · {d} j</Badge>;
  }
  return <Badge>{PLAN_LABELS[s.plan] ?? s.plan}</Badge>;
}

function ShopsPage() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [selected, setSelected] = useState<AdminShop | null>(null);

  const {
    data: shops = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["sa-shops"],
    queryFn: () => adminRpc<AdminShop[]>("admin_list_shops"),
  });

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    return shops.filter((s) => {
      if (planFilter === "expired") {
        if (!(s.plan === "essentiel" && trialDaysLeft(s) <= 0)) return false;
      } else if (planFilter === "suspended") {
        if (!s.is_suspended) return false;
      } else if (planFilter !== "all" && s.plan !== planFilter) return false;
      if (!t) return true;
      return [s.name, s.slug, s.owner_email, s.owner_name, s.phone].some((v) =>
        v?.toLowerCase().includes(t),
      );
    });
  }, [shops, q, planFilter]);

  const refresh = () => qc.invalidateQueries({ queryKey: ["sa-shops"] });

  return (
    <>
      <PageHeader
        title="Boutiques"
        description={`${shops.length} boutique(s) sur la plateforme.`}
      />
      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative min-w-[240px] flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Nom, email, téléphone…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <Select value={planFilter} onValueChange={setPlanFilter}>
          <SelectTrigger className="w-[220px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les formules</SelectItem>
            <SelectItem value="essentiel">Essai gratuit</SelectItem>
            <SelectItem value="expired">Essais expirés</SelectItem>
            <SelectItem value="essentiel_paid">Essentiel payé</SelectItem>
            <SelectItem value="pro">Pro</SelectItem>
            <SelectItem value="sur-mesure">Sur mesure</SelectItem>
            <SelectItem value="suspended">Suspendues</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <Loader2 className="mx-auto mt-16 h-6 w-6 animate-spin text-muted-foreground" />
      ) : error ? (
        <p className="text-sm text-destructive">{(error as Error).message}</p>
      ) : (
        <Card className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Boutique</TableHead>
                <TableHead>Propriétaire</TableHead>
                <TableHead>Formule</TableHead>
                <TableHead className="text-right">Produits</TableHead>
                <TableHead className="text-right">Ventes</TableHead>
                <TableHead>Dernière vente</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((s) => (
                <TableRow key={s.id} className="cursor-pointer" onClick={() => setSelected(s)}>
                  <TableCell>
                    <div className="font-medium">{s.name}</div>
                    <div className="text-xs text-muted-foreground">
                      Créée le {fmtDate(s.created_at)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>{s.owner_name ?? "—"}</div>
                    <div className="text-xs text-muted-foreground">{s.owner_email}</div>
                  </TableCell>
                  <TableCell>{planBadge(s)}</TableCell>
                  <TableCell className="text-right">{fmtNumber(s.products_count)}</TableCell>
                  <TableCell className="text-right">
                    {fmtNumber(s.sales_count)}
                    <div className="text-xs text-muted-foreground">
                      {fmtMoney(Number(s.sales_total))}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {s.last_sale_at ? fmtDate(s.last_sale_at) : "Jamais"}
                  </TableCell>
                  <TableCell>
                    <Settings2 className="h-4 w-4 text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="py-10 text-center text-sm text-muted-foreground"
                  >
                    Aucune boutique.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      {selected && (
        <ShopDialog
          key={selected.id}
          shop={shops.find((s) => s.id === selected.id) ?? selected}
          onClose={() => setSelected(null)}
          onChanged={refresh}
        />
      )}
    </>
  );
}

function ShopDialog({
  shop,
  onClose,
  onChanged,
}: {
  shop: AdminShop;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [notes, setNotes] = useState(shop.admin_notes ?? "");
  const [confirmName, setConfirmName] = useState("");

  const run = useMutation({
    mutationFn: async ({
      fn,
      args,
      ok,
    }: {
      fn: string;
      args: Record<string, unknown>;
      ok: string;
    }) => {
      await adminRpc(fn, args);
      return ok;
    },
    onSuccess: (ok) => {
      toast.success(ok);
      onChanged();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const act = (fn: string, args: Record<string, unknown>, ok: string) =>
    run.mutate({ fn, args: { p_shop_id: shop.id, ...args }, ok });

  const remove = useMutation({
    mutationFn: () => adminRpc("admin_delete_shop", { p_shop_id: shop.id }),
    onSuccess: () => {
      toast.success("Boutique supprimée");
      onChanged();
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const phone = (shop.phone ?? "").replace(/\D/g, "");

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {shop.name} {planBadge(shop)}
          </DialogTitle>
          <DialogDescription>
            {shop.owner_email} · {shop.members_count} membre(s) · {fmtNumber(shop.products_count)}{" "}
            produits
          </DialogDescription>
        </DialogHeader>

        <section className="space-y-2">
          <Label>Formule (après paiement reçu)</Label>
          <Select
            value={shop.plan}
            onValueChange={(v) => act("admin_set_shop_plan", { p_plan: v }, "Formule mise à jour")}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(PLAN_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </section>

        {shop.plan === "essentiel" && (
          <section className="space-y-2">
            <Label>
              Prolonger l'essai{" "}
              <span className="font-normal text-muted-foreground">
                ({trialDaysLeft(shop) > 0 ? `${trialDaysLeft(shop)} j restants` : "expiré"})
              </span>
            </Label>
            <div className="flex gap-2">
              {[7, 15, 30].map((d) => (
                <Button
                  key={d}
                  variant="outline"
                  size="sm"
                  disabled={run.isPending}
                  onClick={() =>
                    act("admin_extend_trial", { p_days: d }, `Essai prolongé de ${d} jours`)
                  }
                >
                  +{d} jours
                </Button>
              ))}
            </div>
          </section>
        )}

        <section className="flex flex-wrap gap-2">
          <Button
            variant={shop.is_suspended ? "default" : "outline"}
            size="sm"
            disabled={run.isPending}
            onClick={() =>
              act(
                "admin_set_shop_suspended",
                { p_suspended: !shop.is_suspended },
                shop.is_suspended ? "Boutique réactivée" : "Boutique suspendue",
              )
            }
          >
            {shop.is_suspended ? (
              <CheckCircle2 className="mr-1.5 h-4 w-4" />
            ) : (
              <Ban className="mr-1.5 h-4 w-4" />
            )}
            {shop.is_suspended ? "Réactiver" : "Suspendre"}
          </Button>
          {phone && (
            <Button variant="outline" size="sm" asChild>
              <a href={`https://wa.me/${phone}`} target="_blank" rel="noreferrer">
                <MessageCircle className="mr-1.5 h-4 w-4" /> WhatsApp
              </a>
            </Button>
          )}
        </section>

        <section className="space-y-2">
          <Label>Notes privées</Label>
          <Textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ex : a payé 5 000 F le 03/10 par Orange Money"
          />
          <Button
            size="sm"
            variant="secondary"
            disabled={run.isPending || notes === (shop.admin_notes ?? "")}
            onClick={() => act("admin_set_shop_notes", { p_notes: notes }, "Notes enregistrées")}
          >
            Enregistrer la note
          </Button>
        </section>

        <section className="space-y-2 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
          <Label className="text-destructive">Zone dangereuse</Label>
          <p className="text-xs text-muted-foreground">
            Supprime la boutique et toutes ses données (produits, ventes, clients…). Irréversible.
            Tape son nom pour confirmer.
          </p>
          <div className="flex gap-2">
            <Input
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              placeholder={shop.name}
            />
            <Button
              variant="destructive"
              disabled={confirmName !== shop.name || remove.isPending}
              onClick={() => remove.mutate()}
            >
              <Trash2 className="mr-1.5 h-4 w-4" /> Supprimer
            </Button>
          </div>
        </section>
      </DialogContent>
    </Dialog>
  );
}
