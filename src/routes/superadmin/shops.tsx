import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Loader2,
  Search,
  Settings2,
  Trash2,
  Ban,
  CheckCircle2,
  MessageCircle,
  Plus,
  X,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-parts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  adminRpc,
  PAYMENT_METHOD_LABELS,
  PLAN_LABELS,
  trialDaysLeft,
  type AdminShop,
  type ShopDetails,
  type ShopPayments,
} from "@/lib/superadmin";
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

/* ---------- petits éléments de la fiche ---------- */

const PAYMENT_LABELS: Record<string, string> = {
  cash: "Espèces",
  mobile: "Mobile Money",
  card: "Carte",
};

const shortDay = (d: string) => `${d.slice(8, 10)}/${d.slice(5, 7)}`;

function MiniStat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-lg font-bold leading-tight">{value}</div>
      {sub && <div className="text-[11px] text-muted-foreground">{sub}</div>}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1 text-sm">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value ?? "—"}</span>
    </div>
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
  const qc = useQueryClient();
  const [notes, setNotes] = useState(shop.admin_notes ?? "");
  const [confirmName, setConfirmName] = useState("");

  const { data: d, isLoading } = useQuery({
    queryKey: ["sa-shop", shop.id],
    queryFn: () => adminRpc<ShopDetails>("admin_shop_details", { p_shop_id: shop.id }),
  });

  const run = useMutation({
    mutationFn: async ({ fn, args }: { fn: string; args: Record<string, unknown> }) => {
      await adminRpc(fn, args);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sa-shop", shop.id] });
      onChanged();
    },
    onError: (e: Error) => toast.error(e.message),
  });

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
  const trialLeft = trialDaysLeft(shop);

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {shop.name} {planBadge(shop)}
          </DialogTitle>
          <DialogDescription>
            {shop.owner_email} · {shop.members_count} membre(s) · {fmtNumber(shop.products_count)}{" "}
            produits
          </DialogDescription>
        </DialogHeader>

        {isLoading || !d ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Tabs defaultValue="perf">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="perf">Performance</TabsTrigger>
              <TabsTrigger value="fiche">Boutique & stock</TabsTrigger>
              <TabsTrigger value="pay">Abonnements</TabsTrigger>
              <TabsTrigger value="gestion">Gestion</TabsTrigger>
            </TabsList>

            {/* ===== Performance ===== */}
            <TabsContent value="perf" className="space-y-4">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <MiniStat
                  label={`Volume · ${d.days} j`}
                  value={fmtMoney(Number(d.sales.v_p))}
                  sub={
                    d.sales.v_prev > 0
                      ? `${d.sales.v_p >= d.sales.v_prev ? "+" : ""}${Math.round(((Number(d.sales.v_p) - Number(d.sales.v_prev)) / Number(d.sales.v_prev)) * 100)} % vs 30 j préc.`
                      : d.sales.n_p > 0
                        ? "nouveau"
                        : "aucune vente avant"
                  }
                />
                <MiniStat
                  label={`Ventes · ${d.days} j`}
                  value={fmtNumber(d.sales.n_p)}
                  sub={`total : ${fmtNumber(d.sales.n_all)}`}
                />
                <MiniStat
                  label="Panier moyen"
                  value={fmtMoney(Number(d.sales.avg_basket_p ?? 0))}
                  sub={`vie : ${fmtMoney(Number(d.sales.avg_basket_all ?? 0))}`}
                />
                <MiniStat
                  label="Dernière vente"
                  value={d.sales.last_sale ? fmtDate(d.sales.last_sale) : "Jamais"}
                  sub={
                    d.sales.last_sale &&
                    Date.now() - new Date(d.sales.last_sale).getTime() > 14 * 86_400_000
                      ? "⚠ inactive depuis 14 j"
                      : undefined
                  }
                />
              </div>

              <div className="h-40 rounded-xl border border-border p-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={d.series}>
                    <defs>
                      <linearGradient id="dlgVol" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="var(--color-border)"
                    />
                    <XAxis
                      dataKey="day"
                      tickFormatter={shortDay}
                      tick={{ fontSize: 10 }}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      tick={{ fontSize: 10 }}
                      width={55}
                      tickFormatter={(v) => `${Math.round(Number(v) / 1000)}k`}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "var(--color-card)",
                        border: "1px solid var(--color-border)",
                        borderRadius: 10,
                        fontSize: 12,
                      }}
                      labelFormatter={(l) => shortDay(String(l))}
                      formatter={(value) => [fmtMoney(Number(value)), "Volume"]}
                    />
                    <Area
                      type="monotone"
                      dataKey="volume"
                      stroke="var(--color-primary)"
                      fill="url(#dlgVol)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <h4 className="mb-2 text-sm font-semibold">Top produits</h4>
                  {d.top_products.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Aucune vente terminée.</p>
                  ) : (
                    <div className="space-y-1">
                      {d.top_products.slice(0, 5).map((p, i) => (
                        <div key={i} className="flex justify-between gap-2 text-xs">
                          <span className="truncate">{p.name}</span>
                          <span className="shrink-0 text-muted-foreground">
                            {fmtNumber(Number(p.qty))} × · {fmtMoney(Number(p.revenue))}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="mb-2 text-sm font-semibold">Paiements · {d.days} j</h4>
                  {d.payments.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Aucun paiement sur la période.</p>
                  ) : (
                    <div className="space-y-2">
                      {d.payments.map((p) => {
                        const pct = d.sales.n_p ? Math.round((p.n / d.sales.n_p) * 100) : 0;
                        return (
                          <div key={p.method}>
                            <div className="flex justify-between text-xs">
                              <span>{PAYMENT_LABELS[p.method] ?? p.method}</span>
                              <span className="text-muted-foreground">
                                {pct} % · {fmtMoney(Number(p.volume))}
                              </span>
                            </div>
                            <div className="mt-1 h-1.5 rounded-full bg-secondary">
                              <div
                                className="h-1.5 rounded-full bg-primary"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h4 className="mb-2 text-sm font-semibold">Dernières ventes</h4>
                {d.recent_sales.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Aucune vente.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Mode</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {d.recent_sales.slice(0, 6).map((s) => (
                        <TableRow key={s.id}>
                          <TableCell className="py-1.5 text-xs">{fmtDate(s.created_at)}</TableCell>
                          <TableCell className="py-1.5 text-xs">{s.customer ?? "—"}</TableCell>
                          <TableCell className="py-1.5 text-xs">
                            {PAYMENT_LABELS[s.payment_method] ?? s.payment_method}
                          </TableCell>
                          <TableCell className="py-1.5 text-right text-xs font-medium">
                            {fmtMoney(Number(s.total))}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </TabsContent>

            {/* ===== Boutique & stock ===== */}
            <TabsContent value="fiche" className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Card className="p-4">
                  <h4 className="mb-2 text-sm font-semibold">Boutique</h4>
                  <InfoRow label="Formule" value={PLAN_LABELS[d.shop.plan] ?? d.shop.plan} />
                  {d.shop.plan === "essentiel" && (
                    <InfoRow label="Essai jusqu'au" value={fmtDate(d.shop.trial_end)} />
                  )}
                  <InfoRow label="Téléphone" value={d.shop.phone} />
                  <InfoRow label="Adresse" value={d.shop.address} />
                  <InfoRow
                    label="Pays / devise"
                    value={`${d.shop.country ?? "—"} · ${d.shop.currency}`}
                  />
                  <InfoRow
                    label="Statut"
                    value={
                      d.shop.is_suspended ? (
                        <span className="text-destructive">Suspendue</span>
                      ) : (
                        "Active"
                      )
                    }
                  />
                </Card>

                <Card className="p-4">
                  <h4 className="mb-2 text-sm font-semibold">Propriétaire</h4>
                  <InfoRow label="Nom" value={d.owner.full_name ?? shop.owner_name} />
                  <InfoRow label="Email" value={d.owner.email} />
                  <InfoRow label="Téléphone" value={d.owner.phone} />
                  <InfoRow
                    label="Inscrit le"
                    value={d.owner.created_at ? fmtDate(d.owner.created_at) : "—"}
                  />
                  <InfoRow
                    label="Dernière connexion"
                    value={d.owner.last_sign_in_at ? fmtDate(d.owner.last_sign_in_at) : "Jamais"}
                  />
                </Card>

                <Card className="p-4">
                  <h4 className="mb-2 text-sm font-semibold">Catalogue & stock</h4>
                  <InfoRow label="Catégories" value={fmtNumber(d.catalog.categories)} />
                  <InfoRow
                    label="Produits"
                    value={`${fmtNumber(d.catalog.products)} (${fmtNumber(d.catalog.active)} actifs)`}
                  />
                  <InfoRow
                    label="Valeur du stock"
                    value={fmtMoney(Number(d.catalog.stock_value))}
                  />
                  <InfoRow
                    label="Ruptures"
                    value={
                      d.catalog.out_of_stock > 0 ? (
                        <span className="text-destructive">
                          {fmtNumber(d.catalog.out_of_stock)}
                        </span>
                      ) : (
                        "0"
                      )
                    }
                  />
                  <InfoRow label="Stocks bas" value={fmtNumber(d.catalog.low_stock)} />
                  {d.stock_alerts.length > 0 && (
                    <div className="mt-2 space-y-1 border-t border-border pt-2">
                      {d.stock_alerts.slice(0, 6).map((s, i) => (
                        <div key={i} className="flex justify-between gap-2 text-xs">
                          <span className="truncate">{s.name}</span>
                          <span
                            className={s.state === "rupture" ? "text-destructive" : "text-warning"}
                          >
                            {fmtNumber(Number(s.stock))} {s.unit ?? ""}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>

                <Card className="p-4">
                  <h4 className="mb-2 text-sm font-semibold">Équipe & clients</h4>
                  <InfoRow label="Clients enregistrés" value={fmtNumber(d.customers.count)} />
                  {d.customers.with_credit > 0 && (
                    <InfoRow
                      label="Créances"
                      value={
                        <span className="text-warning">
                          {fmtMoney(Number(d.customers.credit_total))} ({d.customers.with_credit})
                        </span>
                      }
                    />
                  )}
                  <div className="mt-2 border-t border-border pt-2 text-xs text-muted-foreground">
                    <div className="mb-1 font-medium text-foreground">
                      Membres ({d.members.length}) · Employés ({d.employees.length})
                    </div>
                    {d.members.slice(0, 4).map((m, i) => (
                      <div key={i} className="flex justify-between">
                        <span className="truncate">{m.name ?? "—"}</span>
                        <span>{m.role}</span>
                      </div>
                    ))}
                    {d.employees.slice(0, 4).map((e, i) => (
                      <div key={`e${i}`} className="flex justify-between">
                        <span className="truncate">{e.name}</span>
                        <span>
                          {e.role}
                          {e.is_active ? "" : " (inactif)"}
                        </span>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </TabsContent>

            {/* ===== Abonnements & paiements ===== */}
            <TabsContent value="pay">
              <PaymentsTab
                shopId={shop.id}
                currentPlan={shop.plan}
                onChanged={() => {
                  onChanged();
                  qc.invalidateQueries({ queryKey: ["sa-shop", shop.id] });
                }}
              />
            </TabsContent>

            {/* ===== Gestion ===== */}
            <TabsContent value="gestion" className="space-y-5">
              <section className="space-y-2">
                <Label>Formule (après paiement reçu)</Label>
                <Select
                  value={shop.plan}
                  onValueChange={(v) =>
                    run.mutate(
                      { fn: "admin_set_shop_plan", args: { p_shop_id: shop.id, p_plan: v } },
                      { onSuccess: () => toast.success("Formule mise à jour") },
                    )
                  }
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
                      ({trialLeft > 0 ? `${trialLeft} j restants` : "expiré"})
                    </span>
                  </Label>
                  <div className="flex gap-2">
                    {[7, 15, 30].map((days) => (
                      <Button
                        key={days}
                        variant="outline"
                        size="sm"
                        disabled={run.isPending}
                        onClick={() =>
                          run.mutate(
                            {
                              fn: "admin_extend_trial",
                              args: { p_shop_id: shop.id, p_days: days },
                            },
                            { onSuccess: () => toast.success(`Essai prolongé de ${days} jours`) },
                          )
                        }
                      >
                        +{days} jours
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
                    run.mutate(
                      {
                        fn: "admin_set_shop_suspended",
                        args: { p_shop_id: shop.id, p_suspended: !shop.is_suspended },
                      },
                      {
                        onSuccess: () =>
                          toast.success(
                            shop.is_suspended ? "Boutique réactivée" : "Boutique suspendue",
                          ),
                      },
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
                  onClick={() =>
                    run.mutate(
                      { fn: "admin_set_shop_notes", args: { p_shop_id: shop.id, p_notes: notes } },
                      { onSuccess: () => toast.success("Notes enregistrées") },
                    )
                  }
                >
                  Enregistrer la note
                </Button>
              </section>

              {d.audit.length > 0 && (
                <section>
                  <Label className="mb-1 block">Journal admin</Label>
                  <div className="max-h-36 space-y-1 overflow-y-auto rounded-xl border border-border p-3 text-xs text-muted-foreground">
                    {d.audit.map((a, i) => (
                      <div key={i} className="flex justify-between gap-2">
                        <span>
                          {a.action}
                          {a.admin ? ` — ${a.admin}` : ""}
                        </span>
                        <span className="shrink-0">{fmtDate(a.created_at)}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              <section className="space-y-2 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
                <Label className="text-destructive">Zone dangereuse</Label>
                <p className="text-xs text-muted-foreground">
                  Supprime la boutique et toutes ses données (produits, ventes, clients…).
                  Irréversible. Tape son nom pour confirmer.
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
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ---------- Onglet Abonnements & paiements ---------- */

const today = () => new Date().toISOString().slice(0, 10);

function PaymentsTab({
  shopId,
  currentPlan,
  onChanged,
}: {
  shopId: string;
  currentPlan: string;
  onChanged: () => void;
}) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["sa-shop-payments", shopId],
    queryFn: () => adminRpc<ShopPayments>("admin_list_shop_payments", { p_shop_id: shopId }),
  });

  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("orange_money");
  const [plan, setPlan] = useState(currentPlan === "essentiel" ? "essentiel_paid" : currentPlan);
  const [date, setDate] = useState(today());
  const [coversUntil, setCoversUntil] = useState("");
  const [note, setNote] = useState("");

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["sa-shop-payments", shopId] });
    onChanged();
  };

  const add = useMutation({
    mutationFn: () =>
      adminRpc("admin_add_shop_payment", {
        p_shop_id: shopId,
        p_amount: Number(amount),
        p_method: method,
        p_plan: plan || null,
        p_paid_at: new Date(`${date}T12:00:00`).toISOString(),
        p_period_end: coversUntil ? coversUntil : null,
        p_note: note || null,
      }),
    onSuccess: () => {
      toast.success("Paiement enregistré");
      setAmount("");
      setNote("");
      setCoversUntil("");
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: (id: string) => adminRpc("admin_delete_shop_payment", { p_payment_id: id }),
    onSuccess: () => {
      toast.success("Paiement supprimé");
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading || !data)
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );

  const canAdd = Number(amount) > 0;

  return (
    <div className="space-y-4">
      {/* Résumé */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MiniStat label="Total payé" value={fmtMoney(Number(data.summary.total))} />
        <MiniStat
          label="12 derniers mois"
          value={fmtMoney(Number(data.summary.total_12m))}
          sub={`${data.summary.count} paiement(s)`}
        />
        <MiniStat
          label="Dernier paiement"
          value={data.summary.last_paid_at ? fmtDate(data.summary.last_paid_at) : "Jamais"}
        />
        <MiniStat
          label="Formule actuelle"
          value={PLAN_LABELS[currentPlan] ?? currentPlan}
          sub={
            data.summary.last_paid_at &&
            Date.now() - new Date(data.summary.last_paid_at).getTime() > 35 * 86_400_000
              ? "⚠ aucun paiement depuis 1 mois"
              : undefined
          }
        />
      </div>

      {/* Saisie */}
      <div className="rounded-xl border border-border p-4">
        <h4 className="mb-3 text-sm font-semibold">Enregistrer un paiement reçu</h4>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Montant (F CFA)</Label>
            <Input
              type="number"
              min="1"
              step="100"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="5000"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Reçu via</Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PAYMENT_METHOD_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Formule payée</Label>
            <Select value={plan || "none"} onValueChange={(v) => setPlan(v === "none" ? "" : v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— (hors abonnement)</SelectItem>
                {Object.entries(PLAN_LABELS)
                  .filter(([k]) => k !== "essentiel")
                  .map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Date du paiement</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>
              Couvre jusqu'au <span className="font-normal text-muted-foreground">(optionnel)</span>
            </Label>
            <Input
              type="date"
              value={coversUntil}
              onChange={(e) => setCoversUntil(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>
              Note <span className="font-normal text-muted-foreground">(optionnel)</span>
            </Label>
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ex : reçu par Orange Money, réf 4487"
            />
          </div>
        </div>
        <Button
          size="sm"
          className="mt-3"
          disabled={!canAdd || add.isPending}
          onClick={() => add.mutate()}
        >
          <Plus className="mr-1.5 h-4 w-4" /> Enregistrer le paiement
        </Button>
      </div>

      {/* Historique */}
      <div>
        <h4 className="mb-2 text-sm font-semibold">Historique des paiements</h4>
        {data.payments.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            Aucun paiement enregistré pour cette boutique.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Montant</TableHead>
                <TableHead>Formule</TableHead>
                <TableHead>Reçu via</TableHead>
                <TableHead>Couverture</TableHead>
                <TableHead>Note</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.payments.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="py-1.5 text-xs">{fmtDate(p.paid_at)}</TableCell>
                  <TableCell className="py-1.5 text-right text-xs font-semibold">
                    {fmtMoney(Number(p.amount))}
                  </TableCell>
                  <TableCell className="py-1.5 text-xs">
                    {p.plan ? (PLAN_LABELS[p.plan] ?? p.plan) : "—"}
                  </TableCell>
                  <TableCell className="py-1.5 text-xs">
                    {PAYMENT_METHOD_LABELS[p.method] ?? p.method}
                  </TableCell>
                  <TableCell className="py-1.5 text-xs text-muted-foreground">
                    {p.period_end ? `→ ${fmtDate(p.period_end)}` : "—"}
                  </TableCell>
                  <TableCell className="max-w-[160px] truncate py-1.5 text-xs text-muted-foreground">
                    {p.note ?? ""}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      title="Supprimer ce paiement (erreur de saisie)"
                      disabled={del.isPending}
                      onClick={() => del.mutate(p.id)}
                    >
                      <X className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
