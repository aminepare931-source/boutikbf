import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowLeft,
  Ban,
  CheckCircle2,
  Layers,
  Loader2,
  MessageCircle,
  Package,
  ShoppingCart,
  Store,
  Trash2,
  TrendingDown,
  TrendingUp,
  Minus,
  Users,
  Wallet,
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  adminRpc,
  PLAN_LABELS,
  trialDaysLeft,
  whatsappLink,
  type ShopDetails,
} from "@/lib/superadmin";
import { fmtDate, fmtMoney, fmtNumber } from "@/lib/format";

export const Route = createFileRoute("/superadmin/shops/$shopId")({
  component: ShopDetailsPage,
});

const PAYMENT_LABELS: Record<string, string> = {
  cash: "Espèces",
  mobile: "Mobile Money",
  card: "Carte",
};

const tooltipStyle = {
  background: "var(--color-card)",
  border: "1px solid var(--color-border)",
  borderRadius: 12,
  fontSize: 12,
  boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
};

const shortDay = (d: string) => `${d.slice(8, 10)}/${d.slice(5, 7)}`;

function trend(now: number, prev: number) {
  if (prev === 0)
    return now > 0
      ? { label: "nouveau", dir: "up" as const }
      : { label: "—", dir: "flat" as const };
  const p = Math.round(((now - prev) / prev) * 100);
  return {
    label: `${p > 0 ? "+" : ""}${p} %`,
    dir: p > 0 ? ("up" as const) : p < 0 ? ("down" as const) : ("flat" as const),
  };
}

function Stat({
  label,
  value,
  sub,
  cmp,
  icon: Icon,
  tone = "primary",
}: {
  label: string;
  value: string;
  sub?: string;
  cmp?: { now: number; prev: number };
  icon: typeof Wallet;
  tone?: "primary" | "success" | "warning" | "destructive";
}) {
  const toneMap = {
    primary: "from-primary/20 to-primary/5 text-primary",
    success: "from-success/20 to-success/5 text-success",
    warning: "from-warning/20 to-warning/5 text-warning",
    destructive: "from-destructive/20 to-destructive/5 text-destructive",
  };
  const t = cmp ? trend(cmp.now, cmp.prev) : null;
  const TrendIcon = t?.dir === "up" ? TrendingUp : t?.dir === "down" ? TrendingDown : Minus;
  const trendColor =
    t?.dir === "up"
      ? "text-success"
      : t?.dir === "down"
        ? "text-destructive"
        : "text-muted-foreground";
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-soft">
      <div
        className={`absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br ${toneMap[tone]} opacity-70 blur-2xl`}
      />
      <div className="relative">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{label}</span>
          <Icon className={`h-4 w-4 ${toneMap[tone].split(" ").pop()}`} />
        </div>
        <div className="mt-3 font-display text-2xl font-bold sm:text-3xl">{value}</div>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 text-xs">
          {t && (
            <span className={`inline-flex items-center gap-1 font-semibold ${trendColor}`}>
              <TrendIcon className="h-3.5 w-3.5" />
              {t.label}
            </span>
          )}
          {sub && <span className="text-muted-foreground">{sub}</span>}
        </div>
      </div>
    </div>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="mt-8">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-lg font-bold">{title}</h2>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value ?? "—"}</span>
    </div>
  );
}

function ShopDetailsPage() {
  const { shopId } = Route.useParams();
  const qc = useQueryClient();
  const [notes, setNotes] = useState<string | null>(null);
  const [confirmName, setConfirmName] = useState("");

  const {
    data: d,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["sa-shop", shopId],
    queryFn: () => adminRpc<ShopDetails>("admin_shop_details", { p_shop_id: shopId }),
  });

  const run = useMutation({
    mutationFn: async ({ fn, args }: { fn: string; args: Record<string, unknown> }) => {
      await adminRpc(fn, args);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sa-shop", shopId] });
      qc.invalidateQueries({ queryKey: ["sa-shops"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: () => adminRpc("admin_delete_shop", { p_shop_id: shopId }),
    onSuccess: () => {
      toast.success("Boutique supprimée");
      qc.invalidateQueries({ queryKey: ["sa-shops"] });
      window.location.href = "/superadmin/shops";
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading)
    return <Loader2 className="mx-auto mt-16 h-6 w-6 animate-spin text-muted-foreground" />;
  if (error || !d)
    return (
      <div className="py-10 text-center">
        <p className="text-sm text-destructive">
          {(error as Error | null)?.message ?? "Boutique introuvable."}
        </p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/superadmin/shops">
            <ArrowLeft className="mr-1.5 h-4 w-4" /> Retour aux boutiques
          </Link>
        </Button>
      </div>
    );

  const notesValue = notes ?? d.shop.admin_notes ?? "";
  const waLink = whatsappLink(
    d.shop.phone ?? d.owner.phone,
    `Bonjour ${d.shop.owner_name ?? d.owner.full_name ?? ""}, petit message concernant votre boutique BoutikBF « ${d.shop.name} » :`,
  );
  const trialLeft = trialDaysLeft(d.shop);

  return (
    <div className="pb-10">
      {/* ===== En-tête ===== */}
      <div className="flex flex-wrap items-center gap-3">
        <Button asChild variant="outline" size="sm">
          <Link to="/superadmin/shops">
            <ArrowLeft className="mr-1.5 h-4 w-4" /> Boutiques
          </Link>
        </Button>
        <h1 className="font-display text-2xl font-bold">{d.shop.name}</h1>
        {d.shop.is_suspended ? (
          <Badge variant="destructive">Suspendue</Badge>
        ) : d.shop.plan === "essentiel" ? (
          trialLeft <= 0 ? (
            <Badge variant="destructive">Essai expiré</Badge>
          ) : (
            <Badge variant="secondary">Essai · {trialLeft} j</Badge>
          )
        ) : (
          <Badge>{PLAN_LABELS[d.shop.plan] ?? d.shop.plan}</Badge>
        )}
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Slug : <code className="rounded bg-secondary px-1.5 py-0.5">{d.shop.slug}</code> · créée le{" "}
        {fmtDate(d.shop.created_at)}
      </p>

      {/* ===== Performance ===== */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label={`Volume · ${d.days} j`}
          value={fmtMoney(Number(d.sales.v_p))}
          cmp={{ now: Number(d.sales.v_p), prev: Number(d.sales.v_prev) }}
          sub="vs période précédente"
          icon={Wallet}
          tone="success"
        />
        <Stat
          label={`Ventes · ${d.days} j`}
          value={fmtNumber(d.sales.n_p)}
          cmp={{ now: d.sales.n_p, prev: d.sales.n_prev }}
          icon={ShoppingCart}
        />
        <Stat
          label="Panier moyen"
          value={fmtMoney(Number(d.sales.avg_basket_p ?? 0))}
          sub={`toute période : ${fmtMoney(Number(d.sales.avg_basket_all ?? 0))}`}
          icon={TrendingUp}
          tone="primary"
        />
        <Stat
          label="Dernière vente"
          value={d.sales.last_sale ? fmtDate(d.sales.last_sale) : "Jamais"}
          sub={`total vie : ${fmtMoney(Number(d.sales.v_all))} · ${fmtNumber(d.sales.n_all)} ventes`}
          icon={Store}
          tone={
            d.sales.last_sale &&
            Date.now() - new Date(d.sales.last_sale).getTime() > 14 * 86_400_000
              ? "warning"
              : "primary"
          }
        />
      </div>

      <Section title={`Ventes quotidiennes · ${d.days} derniers jours`}>
        <Card>
          <CardContent className="pt-6">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={d.series}>
                  <defs>
                    <linearGradient id="fillVolume" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.35} />
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
                    tick={{ fontSize: 11 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    width={70}
                    tickFormatter={(v) => `${Math.round(Number(v) / 1000)}k`}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    labelFormatter={(l) => shortDay(String(l))}
                    formatter={(value: number | string, name: string) =>
                      name === "volume"
                        ? [fmtMoney(Number(value)), "Volume"]
                        : [fmtNumber(Number(value)), "Ventes"]
                    }
                  />
                  <Area
                    type="monotone"
                    dataKey="volume"
                    stroke="var(--color-primary)"
                    fill="url(#fillVolume)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </Section>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Section title="Top produits (toute période)">
          <Card>
            <CardContent className="pt-6">
              {d.top_products.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucune vente terminée.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produit</TableHead>
                      <TableHead className="text-right">Qté</TableHead>
                      <TableHead className="text-right">Revenu</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {d.top_products.map((p, i) => (
                      <TableRow key={i}>
                        <TableCell className="max-w-[220px] truncate">{p.name}</TableCell>
                        <TableCell className="text-right">{fmtNumber(Number(p.qty))}</TableCell>
                        <TableCell className="text-right font-medium">
                          {fmtMoney(Number(p.revenue))}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </Section>

        <Section title={`Paiements · ${d.days} j`}>
          <Card>
            <CardContent className="space-y-3 pt-6">
              {d.payments.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucun paiement sur la période.</p>
              ) : (
                d.payments.map((p) => {
                  const pct = d.sales.n_p ? Math.round((p.n / d.sales.n_p) * 100) : 0;
                  return (
                    <div key={p.method}>
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{PAYMENT_LABELS[p.method] ?? p.method}</span>
                        <span className="text-muted-foreground">
                          {fmtNumber(p.n)} ventes · {pct} % · {fmtMoney(Number(p.volume))}
                        </span>
                      </div>
                      <div className="mt-1 h-2 rounded-full bg-secondary">
                        <div className="h-2 rounded-full bg-primary" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })
              )}
              <div className="border-t border-border pt-3">
                <InfoRow
                  label={`Meilleurs clients · ${d.days} j`}
                  value={
                    d.top_customers.length === 0 ? (
                      "—"
                    ) : (
                      <span className="text-right">
                        {d.top_customers
                          .map((c) => `${c.name} (${fmtMoney(Number(c.volume))})`)
                          .join(", ")}
                      </span>
                    )
                  }
                />
              </div>
            </CardContent>
          </Card>
        </Section>
      </div>

      {/* ===== Caractéristiques ===== */}
      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Store className="h-4 w-4 text-primary" /> Boutique
            </CardTitle>
          </CardHeader>
          <CardContent>
            <InfoRow label="Formule" value={PLAN_LABELS[d.shop.plan] ?? d.shop.plan} />
            <InfoRow
              label="Essai jusqu'au"
              value={d.shop.plan === "essentiel" ? fmtDate(d.shop.trial_end) : "—"}
            />
            <InfoRow label="Téléphone" value={d.shop.phone} />
            <InfoRow label="Email" value={d.shop.email} />
            <InfoRow label="Adresse" value={d.shop.address} />
            <InfoRow
              label="Pays / devise"
              value={`${d.shop.country ?? "—"} · ${d.shop.currency}`}
            />
            <InfoRow label="Statut" value={d.shop.is_suspended ? "Suspendue" : "Active"} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4 text-primary" /> Propriétaire & équipe
            </CardTitle>
          </CardHeader>
          <CardContent>
            <InfoRow label="Nom" value={d.owner.full_name ?? d.shop.owner_name} />
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
            {d.owner.banned_until && (
              <InfoRow
                label="Banni jusqu'au"
                value={<span className="text-destructive">{fmtDate(d.owner.banned_until)}</span>}
              />
            )}
            <div className="mt-3 border-t border-border pt-3 text-sm">
              <div className="mb-1 font-medium">
                Membres ({d.members.length}) · Employés de caisse ({d.employees.length})
              </div>
              {d.members.map((m, i) => (
                <div key={i} className="flex justify-between text-xs text-muted-foreground">
                  <span>{m.name ?? "—"}</span>
                  <span>{m.role}</span>
                </div>
              ))}
              {d.employees.map((e, i) => (
                <div key={`e${i}`} className="flex justify-between text-xs text-muted-foreground">
                  <span>{e.name}</span>
                  <span>
                    {e.role}
                    {e.is_active ? "" : " (inactif)"}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Package className="h-4 w-4 text-primary" /> Catalogue & stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            <InfoRow label="Catégories" value={fmtNumber(d.catalog.categories)} />
            <InfoRow
              label="Produits"
              value={`${fmtNumber(d.catalog.products)} (${fmtNumber(d.catalog.active)} actifs)`}
            />
            <InfoRow label="Avec code-barres" value={fmtNumber(d.catalog.with_barcode)} />
            <InfoRow label="Unités en stock" value={fmtNumber(Number(d.catalog.stock_units))} />
            <InfoRow
              label="Valeur du stock (achat)"
              value={fmtMoney(Number(d.catalog.stock_value))}
            />
            <InfoRow label="Clients enregistrés" value={fmtNumber(d.customers.count)} />
            {d.customers.with_credit > 0 && (
              <InfoRow
                label="Créances clients"
                value={
                  <span className="text-warning">
                    {fmtMoney(Number(d.customers.credit_total))} ({d.customers.with_credit}{" "}
                    client(s))
                  </span>
                }
              />
            )}
            {(d.catalog.out_of_stock > 0 || d.catalog.low_stock > 0) && (
              <div className="mt-3 rounded-xl border border-warning/30 bg-warning/5 p-3 text-xs">
                <div className="mb-1 flex items-center gap-1.5 font-semibold text-warning">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  {d.catalog.out_of_stock} rupture(s), {d.catalog.low_stock} stock(s) bas
                </div>
                {d.stock_alerts.slice(0, 6).map((s, i) => (
                  <div key={i} className="flex justify-between">
                    <span className="truncate pr-2">{s.name}</span>
                    <span className={s.state === "rupture" ? "text-destructive" : "text-warning"}>
                      {fmtNumber(Number(s.stock))} {s.unit ?? ""}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ===== Dernières ventes ===== */}
      <Section
        title="Dernières ventes"
        hint={`${fmtNumber(d.sales.n_all)} ventes au total${d.sales.n_cancelled ? ` · ${d.sales.n_cancelled} annulée(s)` : ""}`}
      >
        <Card>
          <CardContent className="pt-6">
            {d.recent_sales.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune vente pour le moment.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Mode</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {d.recent_sales.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="text-sm">{fmtDate(s.created_at)}</TableCell>
                      <TableCell className="text-sm">{s.customer ?? "—"}</TableCell>
                      <TableCell className="text-sm">
                        {PAYMENT_LABELS[s.payment_method] ?? s.payment_method}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={s.status === "completed" ? "secondary" : "destructive"}
                          className="text-xs"
                        >
                          {s.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {fmtMoney(Number(s.total))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </Section>

      {/* ===== Gestion ===== */}
      <Section
        title="Gestion de la boutique"
        hint="Les actions sont enregistrées dans le journal d'admin."
      >
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Layers className="h-4 w-4 text-primary" /> Abonnement
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <section className="space-y-2">
                <Label>Formule (après paiement reçu)</Label>
                <Select
                  value={d.shop.plan}
                  onValueChange={(v) =>
                    run.mutate(
                      { fn: "admin_set_shop_plan", args: { p_shop_id: shopId, p_plan: v } },
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

              {d.shop.plan === "essentiel" && (
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
                            { fn: "admin_extend_trial", args: { p_shop_id: shopId, p_days: days } },
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
                  variant={d.shop.is_suspended ? "default" : "outline"}
                  size="sm"
                  disabled={run.isPending}
                  onClick={() =>
                    run.mutate(
                      {
                        fn: "admin_set_shop_suspended",
                        args: { p_shop_id: shopId, p_suspended: !d.shop.is_suspended },
                      },
                      {
                        onSuccess: () =>
                          toast.success(
                            d.shop.is_suspended ? "Boutique réactivée" : "Boutique suspendue",
                          ),
                      },
                    )
                  }
                >
                  {d.shop.is_suspended ? (
                    <CheckCircle2 className="mr-1.5 h-4 w-4" />
                  ) : (
                    <Ban className="mr-1.5 h-4 w-4" />
                  )}
                  {d.shop.is_suspended ? "Réactiver" : "Suspendre"}
                </Button>
                {waLink && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={waLink} target="_blank" rel="noreferrer">
                      <MessageCircle className="mr-1.5 h-4 w-4 text-success" /> WhatsApp
                    </a>
                  </Button>
                )}
              </section>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MessageCircle className="h-4 w-4 text-primary" /> Notes privées & journal
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                rows={3}
                value={notesValue}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex : a payé 5 000 F le 03/10 par Orange Money"
              />
              <Button
                size="sm"
                variant="secondary"
                disabled={run.isPending || notesValue === (d.shop.admin_notes ?? "")}
                onClick={() =>
                  run.mutate(
                    {
                      fn: "admin_set_shop_notes",
                      args: { p_shop_id: shopId, p_notes: notesValue },
                    },
                    { onSuccess: () => toast.success("Notes enregistrées") },
                  )
                }
              >
                Enregistrer la note
              </Button>
              <div className="mt-2 max-h-52 overflow-y-auto rounded-xl border border-border p-3 text-xs">
                {d.audit.length === 0 ? (
                  <p className="text-muted-foreground">Aucune action d'admin sur cette boutique.</p>
                ) : (
                  d.audit.map((a, i) => (
                    <div
                      key={i}
                      className="flex justify-between gap-2 border-b border-border/50 py-1 last:border-0"
                    >
                      <span>
                        <span className="font-medium">{a.action}</span>
                        {a.admin ? ` — ${a.admin}` : ""}
                      </span>
                      <span className="shrink-0 text-muted-foreground">
                        {fmtDate(a.created_at)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6 border-destructive/30">
          <CardHeader>
            <CardTitle className="text-base text-destructive">Zone dangereuse</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-2 text-xs text-muted-foreground">
              Supprime la boutique et toutes ses données (produits, ventes, clients…). Irréversible.
              Tape son nom pour confirmer.
            </p>
            <div className="flex gap-2">
              <Input
                value={confirmName}
                onChange={(e) => setConfirmName(e.target.value)}
                placeholder={d.shop.name}
              />
              <Button
                variant="destructive"
                disabled={confirmName !== d.shop.name || remove.isPending}
                onClick={() => remove.mutate()}
              >
                <Trash2 className="mr-1.5 h-4 w-4" /> Supprimer
              </Button>
            </div>
          </CardContent>
        </Card>
      </Section>
    </div>
  );
}
