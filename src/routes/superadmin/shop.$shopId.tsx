import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Fragment, useMemo, useState, type ReactNode } from "react";
import { ArrowLeft, Loader2, MessageCircle, RefreshCw, Search, Settings2 } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  adminRpc,
  MOVEMENT_LABELS,
  PAYMENT_LABELS,
  PLAN_LABELS,
  ROLE_LABELS,
  trialDaysLeft,
  whatsappLink,
  type ShopDetail,
} from "@/lib/superadmin";
import { fmtDate, fmtMoney, fmtNumber } from "@/lib/format";

export const Route = createFileRoute("/superadmin/shop/$shopId")({ component: ShopPage });

/* ---------- utilitaires ---------- */

const dateTime = (d: string | null | undefined) =>
  d
    ? new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short" }).format(
        new Date(d),
      )
    : "—";
const num = (n: number | null | undefined) => Number(n ?? 0).toLocaleString("fr-FR");
const shortDay = (d: string) => `${d.slice(8, 10)}/${d.slice(5, 7)}`;
const compact = (v: number) =>
  v >= 1_000_000
    ? `${(v / 1_000_000).toFixed(1)} M`
    : v >= 1000
      ? `${Math.round(v / 1000)} k`
      : `${v}`;
const pay = (m: string) => PAYMENT_LABELS[m] ?? m;
const PIE_COLORS = [
  "oklch(0.58 0.16 155)",
  "oklch(0.68 0.17 55)",
  "oklch(0.6 0.22 27)",
  "oklch(0.55 0.1 250)",
];
const tooltipStyle = {
  background: "var(--color-card)",
  border: "1px solid var(--color-border)",
  borderRadius: 12,
  fontSize: 12,
};

function Panel({
  title,
  children,
  className = "",
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={`shadow-soft ${className}`}>
      <CardHeader className="pb-2">
        <CardTitle className="font-display text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border/60 py-2 text-sm last:border-0">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className="break-words text-right font-medium">{value ?? "—"}</dd>
    </div>
  );
}

function Mini({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "bad" | "warn" | "good";
}) {
  const color =
    tone === "bad"
      ? "text-destructive"
      : tone === "warn"
        ? "text-warning"
        : tone === "good"
          ? "text-success"
          : "";
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`mt-1 font-display text-xl font-bold ${color}`}>{value}</div>
      {sub && <div className="mt-0.5 text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return <p className="py-10 text-center text-sm text-muted-foreground">{children}</p>;
}

function Limit({ shown, total }: { shown: number; total: number }) {
  if (shown >= total) return null;
  return (
    <p className="mt-3 text-center text-xs text-muted-foreground">
      {num(shown)} affichés sur {num(total)} (les plus récents ou les premiers par ordre
      alphabétique).
    </p>
  );
}

function Filter({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative mb-3 max-w-sm">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-9"
      />
    </div>
  );
}

const match = (q: string, ...vals: (string | null | undefined)[]) => {
  const t = q.trim().toLowerCase();
  return !t || vals.some((v) => v?.toLowerCase().includes(t));
};

function fieldValue(k: string, v: unknown): string {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "boolean") return v ? "Oui" : "Non";
  if (Array.isArray(v)) return v.length ? v.join(", ") : "—";
  if (k.endsWith("_at") && typeof v === "string") return dateTime(v);
  return String(v);
}

const FIELD_LABELS: Record<string, string> = {
  id: "Identifiant",
  owner_id: "Identifiant du propriétaire",
  name: "Nom",
  slug: "Adresse (slug)",
  logo_url: "Logo",
  currency: "Devise",
  country: "Pays",
  address: "Adresse",
  phone: "Téléphone",
  email: "Email",
  plan: "Formule",
  shop_type: "Type de commerce",
  shop_keywords: "Mots-clés",
  trial_ends_at: "Fin d'essai",
  is_suspended: "Suspendue",
  created_at: "Créée le",
  updated_at: "Modifiée le",
};

/* ---------- onglets ---------- */

function Summary({ d }: { d: ShopDetail }) {
  const { shop, owner, money: m, margin, stock, counts } = d;
  const trialLeft = trialDaysLeft(shop);
  const chart = d.series.map((x) => ({ ...x, label: shortDay(x.day) }));
  return (
    <div className="space-y-5">
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Propriétaire">
          <dl>
            <Row label="Nom" value={owner?.full_name} />
            <Row label="Email" value={owner?.email} />
            <Row label="Téléphone" value={owner?.phone} />
            <Row label="Inscrit le" value={owner ? dateTime(owner.created_at) : "—"} />
            <Row label="Dernière connexion" value={dateTime(owner?.last_sign_in_at)} />
            <Row
              label="Compte"
              value={
                owner?.banned_until && new Date(owner.banned_until) > new Date()
                  ? "Bloqué"
                  : "Actif"
              }
            />
          </dl>
        </Panel>
        <Panel title="Boutique">
          <dl>
            <Row label="Adresse (slug)" value={shop.slug} />
            <Row label="Type de commerce" value={shop.shop_type} />
            <Row label="Pays / devise" value={`${shop.country ?? "—"} · ${shop.currency ?? "—"}`} />
            <Row label="Téléphone" value={shop.phone} />
            <Row label="Email" value={shop.email} />
            <Row label="Adresse" value={shop.address} />
            <Row label="Créée le" value={dateTime(shop.created_at)} />
          </dl>
        </Panel>
        <Panel title="Abonnement et suivi">
          <dl>
            <Row label="Formule" value={PLAN_LABELS[shop.plan] ?? shop.plan} />
            {shop.plan === "essentiel" && (
              <Row
                label="Essai"
                value={trialLeft > 0 ? `${trialLeft} jour(s) restant(s)` : "Terminé"}
              />
            )}
            <Row label="Statut" value={shop.is_suspended ? "Suspendue" : "Active"} />
            <Row label="Première vente" value={dateTime(m.first_sale)} />
            <Row label="Dernière vente" value={dateTime(m.last_sale)} />
            <Row label="Notes admin" value={d.notes} />
          </dl>
        </Panel>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Mini
          label="Ventes aujourd'hui"
          value={fmtMoney(m.volume_today)}
          sub={`${num(m.sales_today)} vente(s)`}
        />
        <Mini
          label="7 derniers jours"
          value={fmtMoney(m.volume_7d)}
          sub={`${num(m.sales_7d)} vente(s)`}
        />
        <Mini
          label="30 derniers jours"
          value={fmtMoney(m.volume_30d)}
          sub={`${num(m.sales_30d)} vente(s)`}
        />
        <Mini
          label="Depuis le début"
          value={fmtMoney(m.volume_all)}
          sub={`${num(m.sales_all)} vente(s)`}
          tone="good"
        />
        <Mini label="Panier moyen (30 j)" value={fmtMoney(m.avg_basket_30d)} />
        <Mini
          label="Marge estimée (30 j)"
          value={fmtMoney(margin.margin_30d)}
          sub="selon les prix d'achat saisis"
        />
        <Mini label="Marge estimée (total)" value={fmtMoney(margin.margin_all)} />
        <Mini
          label="Remises / taxes / annulées"
          value={fmtMoney(m.discount_all)}
          sub={`taxes ${fmtMoney(m.tax_all)} · ${num(m.cancelled)} annulée(s)`}
        />
        <Mini
          label="Produits"
          value={num(stock.products_total)}
          sub={`${num(stock.products_active)} actifs · ${num(counts.categories)} catégories`}
        />
        <Mini
          label="Ruptures de stock"
          value={num(stock.out_of_stock)}
          tone={stock.out_of_stock > 0 ? "bad" : undefined}
        />
        <Mini
          label="Stock bas"
          value={num(stock.low_stock)}
          tone={stock.low_stock > 0 ? "warn" : undefined}
        />
        <Mini
          label="Valeur du stock"
          value={fmtMoney(stock.stock_cost_value)}
          sub={`à la vente : ${fmtMoney(stock.stock_retail_value)}`}
        />
        <Mini
          label="Clients"
          value={num(counts.customers)}
          sub={`${num(counts.loyalty_points)} points fidélité`}
        />
        <Mini label="Crédits clients" value={fmtMoney(counts.customers_credit)} />
        <Mini
          label="Fournisseurs"
          value={num(counts.suppliers)}
          sub={`solde ${fmtMoney(counts.suppliers_balance)}`}
        />
        <Mini
          label="Équipe"
          value={`${num(counts.members)} + ${num(counts.employees)}`}
          sub="comptes + employés de caisse"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Ventes des 30 derniers jours" className="lg:col-span-2">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chart}>
                <defs>
                  <linearGradient id="shop-vol" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.58 0.16 155)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="oklch(0.58 0.16 155)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.06} />
                <XAxis
                  dataKey="label"
                  stroke="currentColor"
                  fontSize={10}
                  opacity={0.6}
                  minTickGap={24}
                />
                <YAxis
                  stroke="currentColor"
                  fontSize={10}
                  opacity={0.6}
                  tickFormatter={compact}
                  width={44}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(v: number) => [fmtMoney(v), "Volume"]}
                  labelFormatter={(l) => `Le ${l}`}
                />
                <Area
                  type="monotone"
                  dataKey="volume"
                  stroke="oklch(0.58 0.16 155)"
                  strokeWidth={2}
                  fill="url(#shop-vol)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Moyens de paiement">
          {d.by_payment.length === 0 ? (
            <Empty>Aucune vente.</Empty>
          ) : (
            <>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={d.by_payment.map((x) => ({ ...x, name: pay(x.method) }))}
                      dataKey="volume"
                      nameKey="name"
                      innerRadius={38}
                      outerRadius={64}
                      paddingAngle={3}
                    >
                      {d.by_payment.map((x, i) => (
                        <Cell key={x.method} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => fmtMoney(v)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="mt-2 space-y-1.5 text-sm">
                {d.by_payment.map((x, i) => (
                  <li key={x.method} className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                      />
                      {pay(x.method)}
                    </span>
                    <span className="text-muted-foreground">
                      {num(x.sales)} ·{" "}
                      <strong className="text-foreground">{fmtMoney(x.volume)}</strong>
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Produits les plus vendus (30 j)">
          {d.top_products.length === 0 ? (
            <Empty>Aucune vente sur 30 jours.</Empty>
          ) : (
            <ul className="divide-y divide-border text-sm">
              {d.top_products.map((p, i) => (
                <li key={p.name} className="flex items-center justify-between gap-3 py-2">
                  <span className="truncate">
                    <span className="mr-2 text-muted-foreground">{i + 1}.</span>
                    {p.name}
                  </span>
                  <span className="shrink-0 text-muted-foreground">
                    {num(p.qty)} vendu(s) ·{" "}
                    <strong className="text-foreground">{fmtMoney(p.revenue)}</strong>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title="Ventes par vendeur">
          {d.by_seller.length === 0 ? (
            <Empty>Aucune vente.</Empty>
          ) : (
            <ul className="divide-y divide-border text-sm">
              {d.by_seller.map((s) => (
                <li key={s.name} className="flex items-center justify-between gap-3 py-2">
                  <span className="truncate">{s.name}</span>
                  <span className="shrink-0 text-muted-foreground">
                    {num(s.sales)} ·{" "}
                    <strong className="text-foreground">{fmtMoney(s.volume)}</strong>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <Panel title="Toutes les informations enregistrées sur la boutique">
        <dl className="grid gap-x-8 sm:grid-cols-2">
          {Object.entries(shop).map(([k, v]) => (
            <Row
              key={k}
              label={FIELD_LABELS[k] ?? k}
              value={<span className="font-mono text-xs">{fieldValue(k, v)}</span>}
            />
          ))}
        </dl>
      </Panel>
    </div>
  );
}

function SalesTab({ d }: { d: ShopDetail }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const rows = useMemo(
    () =>
      d.sales.filter((s) =>
        match(q, s.reference, s.customer, s.seller, pay(s.payment_method), s.status),
      ),
    [d.sales, q],
  );
  if (d.sales.length === 0) return <Empty>Aucune vente enregistrée.</Empty>;
  return (
    <>
      <Filter value={q} onChange={setQ} placeholder="Référence, client, vendeur, paiement…" />
      <div className="overflow-x-auto rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Référence</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Vendeur</TableHead>
              <TableHead>Paiement</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((s) => (
              <Fragment key={s.id}>
                <TableRow
                  className="cursor-pointer"
                  onClick={() => setOpen(open === s.id ? null : s.id)}
                >
                  <TableCell className="whitespace-nowrap">{dateTime(s.created_at)}</TableCell>
                  <TableCell className="font-mono text-xs">
                    {s.reference ?? s.id.slice(0, 8)}
                  </TableCell>
                  <TableCell>{s.customer ?? "—"}</TableCell>
                  <TableCell>{s.seller ?? "—"}</TableCell>
                  <TableCell>{pay(s.payment_method)}</TableCell>
                  <TableCell>
                    <Badge variant={s.status === "completed" ? "secondary" : "destructive"}>
                      {s.status === "completed" ? "Terminée" : s.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-semibold tabular-nums">
                    {fmtMoney(s.total)}
                  </TableCell>
                </TableRow>
                {open === s.id && (
                  <TableRow className="bg-muted/40">
                    <TableCell colSpan={7}>
                      <ul className="space-y-1 text-sm">
                        {s.items.map((it, i) => (
                          <li key={i} className="flex justify-between gap-3">
                            <span>
                              {num(it.quantity)} × {it.name}{" "}
                              <span className="text-muted-foreground">
                                ({fmtMoney(it.unit_price)})
                              </span>
                            </span>
                            <span className="tabular-nums">{fmtMoney(it.total)}</span>
                          </li>
                        ))}
                      </ul>
                      <p className="mt-2 text-xs text-muted-foreground">
                        Sous-total {fmtMoney(s.subtotal)} · Remise {fmtMoney(s.discount)} · Taxe{" "}
                        {fmtMoney(s.tax)}
                      </p>
                    </TableCell>
                  </TableRow>
                )}
              </Fragment>
            ))}
          </TableBody>
        </Table>
      </div>
      <Limit shown={d.sales.length} total={d.money.sales_all + d.money.cancelled} />
    </>
  );
}

function ProductsTab({ d }: { d: ShopDetail }) {
  const [q, setQ] = useState("");
  const [f, setF] = useState<"all" | "out" | "low" | "off">("all");
  const rows = useMemo(
    () =>
      d.products.filter((p) => {
        if (f === "out" && !(p.is_active && p.stock <= 0)) return false;
        if (f === "low" && !(p.is_active && p.stock > 0 && p.stock <= (p.stock_min ?? 0)))
          return false;
        if (f === "off" && p.is_active) return false;
        return match(q, p.name, p.sku, p.barcode, p.brand, p.category);
      }),
    [d.products, q, f],
  );
  if (d.products.length === 0) return <Empty>Aucun produit.</Empty>;
  const chips: [typeof f, string][] = [
    ["all", "Tous"],
    ["out", "Ruptures"],
    ["low", "Stock bas"],
    ["off", "Désactivés"],
  ];
  return (
    <>
      {d.categories.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {d.categories.map((c) => (
            <Badge key={c.id} variant="outline">
              {c.name} · {c.products}
            </Badge>
          ))}
        </div>
      )}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="relative min-w-60 flex-1 sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Nom, SKU, code-barres, marque…"
            className="pl-9"
          />
        </div>
        {chips.map(([k, label]) => (
          <Button
            key={k}
            size="sm"
            variant={f === k ? "default" : "outline"}
            onClick={() => setF(k)}
          >
            {label}
          </Button>
        ))}
      </div>
      <div className="overflow-x-auto rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produit</TableHead>
              <TableHead>Catégorie</TableHead>
              <TableHead>Code</TableHead>
              <TableHead className="text-right">Prix d'achat</TableHead>
              <TableHead className="text-right">Prix de vente</TableHead>
              <TableHead className="text-right">Stock</TableHead>
              <TableHead>État</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((p) => {
              const out = p.stock <= 0;
              const low = !out && p.stock <= (p.stock_min ?? 0);
              return (
                <TableRow key={p.id}>
                  <TableCell>
                    <div className="font-medium">{p.name}</div>
                    {p.brand && <div className="text-xs text-muted-foreground">{p.brand}</div>}
                  </TableCell>
                  <TableCell>{p.category ?? "—"}</TableCell>
                  <TableCell className="font-mono text-xs">{p.barcode ?? p.sku ?? "—"}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {fmtMoney(p.cost_price)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {fmtMoney(p.sale_price)}
                    {p.promo_price ? (
                      <div className="text-xs text-success">promo {fmtMoney(p.promo_price)}</div>
                    ) : null}
                  </TableCell>
                  <TableCell
                    className={`text-right font-semibold tabular-nums ${out ? "text-destructive" : low ? "text-warning" : ""}`}
                  >
                    {num(p.stock)} {p.unit ?? ""}
                    {p.stock_min ? (
                      <div className="text-xs font-normal text-muted-foreground">
                        min {num(p.stock_min)}
                      </div>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    {p.is_active ? (
                      <Badge variant="secondary">Actif</Badge>
                    ) : (
                      <Badge variant="outline">Désactivé</Badge>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      {rows.length === 0 && <Empty>Aucun produit ne correspond.</Empty>}
      <Limit shown={d.products.length} total={d.stock.products_total} />
    </>
  );
}

function CustomersTab({ d }: { d: ShopDetail }) {
  const [q, setQ] = useState("");
  const rows = useMemo(
    () => d.customers.filter((c) => match(q, c.name, c.phone, c.email, c.address)),
    [d.customers, q],
  );
  if (d.customers.length === 0) return <Empty>Aucun client enregistré.</Empty>;
  return (
    <>
      <Filter value={q} onChange={setQ} placeholder="Nom, téléphone, email…" />
      <div className="overflow-x-auto rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead className="text-right">Achats</TableHead>
              <TableHead className="text-right">Dépensé</TableHead>
              <TableHead className="text-right">Points</TableHead>
              <TableHead className="text-right">Crédit</TableHead>
              <TableHead>Inscrit le</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((c) => (
              <TableRow key={c.id}>
                <TableCell>
                  <div className="font-medium">{c.name}</div>
                  {c.notes && (
                    <div className="max-w-xs truncate text-xs text-muted-foreground">{c.notes}</div>
                  )}
                </TableCell>
                <TableCell className="text-sm">
                  <div>{c.phone ?? "—"}</div>
                  <div className="text-xs text-muted-foreground">{c.email ?? c.address ?? ""}</div>
                </TableCell>
                <TableCell className="text-right tabular-nums">{num(c.purchases)}</TableCell>
                <TableCell className="text-right tabular-nums">{fmtMoney(c.spent)}</TableCell>
                <TableCell className="text-right tabular-nums">{num(c.loyalty_points)}</TableCell>
                <TableCell
                  className={`text-right tabular-nums ${c.credit_balance > 0 ? "text-warning" : ""}`}
                >
                  {fmtMoney(c.credit_balance)}
                </TableCell>
                <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                  {fmtDate(c.created_at)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <Limit shown={d.customers.length} total={d.counts.customers} />
    </>
  );
}

function SuppliersTab({ d }: { d: ShopDetail }) {
  if (d.suppliers.length === 0) return <Empty>Aucun fournisseur.</Empty>;
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fournisseur</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead className="text-right">Solde</TableHead>
            <TableHead>Notes</TableHead>
            <TableHead>Ajouté le</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {d.suppliers.map((s) => (
            <TableRow key={s.id}>
              <TableCell className="font-medium">{s.name}</TableCell>
              <TableCell className="text-sm">
                <div>{s.phone ?? "—"}</div>
                <div className="text-xs text-muted-foreground">{s.email ?? s.address ?? ""}</div>
              </TableCell>
              <TableCell className="text-right tabular-nums">{fmtMoney(s.balance)}</TableCell>
              <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                {s.notes ?? "—"}
              </TableCell>
              <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                {fmtDate(s.created_at)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function TeamTab({ d }: { d: ShopDetail }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-2 font-display text-base font-bold">Comptes avec accès à la boutique</h3>
        <div className="overflow-x-auto rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead>Dernière connexion</TableHead>
                <TableHead>Depuis le</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {d.members.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium">{m.full_name ?? "—"}</TableCell>
                  <TableCell>{m.email ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{ROLE_LABELS[m.role] ?? m.role}</Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm">
                    {dateTime(m.last_sign_in_at)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                    {fmtDate(m.created_at)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
      <div>
        <h3 className="mb-2 font-display text-base font-bold">Employés de caisse</h3>
        {d.employees.length === 0 ? (
          <Empty>Aucun employé de caisse.</Empty>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead>Téléphone</TableHead>
                  <TableHead>État</TableHead>
                  <TableHead className="text-right">Ventes</TableHead>
                  <TableHead className="text-right">Volume</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {d.employees.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="font-medium">{e.name}</TableCell>
                    <TableCell>{ROLE_LABELS[e.role] ?? e.role}</TableCell>
                    <TableCell>{e.phone ?? "—"}</TableCell>
                    <TableCell>
                      {e.is_active ? (
                        <Badge variant="secondary">Actif</Badge>
                      ) : (
                        <Badge variant="outline">Inactif</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{num(e.sales)}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmtMoney(e.volume)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        <p className="mt-2 text-xs text-muted-foreground">
          Les codes PIN des employés ne sont jamais affichés.
        </p>
      </div>
    </div>
  );
}

function MovementsTab({ d }: { d: ShopDetail }) {
  if (d.movements.length === 0) return <Empty>Aucun mouvement de stock.</Empty>;
  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Produit</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Quantité</TableHead>
              <TableHead>Motif</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {d.movements.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="whitespace-nowrap">{dateTime(m.created_at)}</TableCell>
                <TableCell className="font-medium">{m.product ?? "Produit supprimé"}</TableCell>
                <TableCell>{MOVEMENT_LABELS[m.type] ?? m.type}</TableCell>
                <TableCell className="text-right tabular-nums">{num(m.quantity)}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{m.reason ?? "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <Limit shown={d.movements.length} total={d.counts.movements} />
    </>
  );
}

function MessagesTab({ d }: { d: ShopDetail }) {
  if (d.messages.length === 0) return <Empty>Aucun message d'employé.</Empty>;
  return (
    <>
      <ul className="space-y-3">
        {d.messages.map((m) => (
          <li key={m.id} className="rounded-xl border border-border bg-card p-3 text-sm">
            <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
              <span>
                <strong className="text-foreground">{m.employee_name}</strong> ·{" "}
                {ROLE_LABELS[m.employee_role] ?? m.employee_role}
              </span>
              <span>{dateTime(m.created_at)}</span>
            </div>
            <p className="mt-1.5 whitespace-pre-wrap">{m.message}</p>
          </li>
        ))}
      </ul>
      <Limit shown={d.messages.length} total={d.counts.messages} />
    </>
  );
}

function ImportsTab({ d }: { d: ShopDetail }) {
  if (d.imports.length === 0) return <Empty>Aucun fichier importé.</Empty>;
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fichier</TableHead>
            <TableHead className="text-right">Colonnes</TableHead>
            <TableHead className="text-right">Lignes</TableHead>
            <TableHead>Colonne catégorie</TableHead>
            <TableHead>Importé le</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {d.imports.map((i) => (
            <TableRow key={i.id}>
              <TableCell className="font-medium">{i.file_name}</TableCell>
              <TableCell className="text-right tabular-nums">{num(i.columns_count)}</TableCell>
              <TableCell className="text-right tabular-nums">{num(i.rows_count)}</TableCell>
              <TableCell>{i.category_column ?? "—"}</TableCell>
              <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                {dateTime(i.created_at)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

const ACTION_LABELS: Record<string, string> = {
  set_plan: "Changement de formule",
  extend_trial: "Prolongation d'essai",
  suspend_shop: "Boutique suspendue",
  unsuspend_shop: "Boutique réactivée",
  delete_shop: "Boutique supprimée",
};

function AuditTab({ d }: { d: ShopDetail }) {
  if (d.audit.length === 0)
    return <Empty>Aucune action d'administration sur cette boutique.</Empty>;
  return (
    <ul className="divide-y divide-border rounded-xl border border-border text-sm">
      {d.audit.map((a) => (
        <li key={a.id} className="flex flex-wrap items-start justify-between gap-2 p-3">
          <div>
            <div className="font-semibold">{ACTION_LABELS[a.action] ?? a.action}</div>
            {a.details && (
              <div className="font-mono text-xs text-muted-foreground">
                {JSON.stringify(a.details)}
              </div>
            )}
          </div>
          <div className="text-right text-xs text-muted-foreground">
            <div>{dateTime(a.created_at)}</div>
            <div>{a.admin_email ?? "—"}</div>
          </div>
        </li>
      ))}
    </ul>
  );
}

/* ---------- page ---------- */

function ShopPage() {
  const { shopId } = Route.useParams();
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["sa-shop", shopId],
    queryFn: () => adminRpc<ShopDetail>("admin_shop_detail", { p_shop_id: shopId }),
  });

  if (isLoading)
    return <Loader2 className="mx-auto mt-20 h-6 w-6 animate-spin text-muted-foreground" />;
  if (error || !data)
    return (
      <div className="mx-auto mt-10 max-w-lg rounded-2xl border border-destructive/30 bg-destructive/5 p-5 text-center text-sm">
        <p className="font-semibold text-destructive">
          {(error as Error)?.message ?? "Boutique introuvable."}
        </p>
        <p className="mt-2 text-muted-foreground">
          Si le message parle d'une fonction introuvable, exécute le fichier{" "}
          <code className="rounded bg-muted px-1">supabase/APPLIQUER_FICHE_BOUTIQUE_ADMIN.sql</code>{" "}
          dans le SQL Editor de Supabase.
        </p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/superadmin/shops">Retour aux boutiques</Link>
        </Button>
      </div>
    );

  const { shop, owner } = data;
  const wa = whatsappLink(
    owner?.phone ?? shop.phone,
    `Bonjour, c'est BoutikBF. Je vous contacte au sujet de votre boutique ${shop.name}.`,
  );
  const trialLeft = trialDaysLeft(shop);

  return (
    <>
      <div className="mb-6">
        <Link
          to="/superadmin/shops"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Toutes les boutiques
        </Link>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold sm:text-3xl">{shop.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge>{PLAN_LABELS[shop.plan] ?? shop.plan}</Badge>
              {shop.plan === "essentiel" && (
                <Badge variant={trialLeft > 0 ? "secondary" : "destructive"}>
                  {trialLeft > 0 ? `Essai : ${trialLeft} j restants` : "Essai terminé"}
                </Badge>
              )}
              {shop.is_suspended && <Badge variant="destructive">Suspendue</Badge>}
              <span className="text-sm text-muted-foreground">
                {owner?.full_name ?? "—"} · {owner?.email ?? "—"}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={`mr-1.5 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />{" "}
              Actualiser
            </Button>
            {wa && (
              <Button asChild variant="outline" size="sm">
                <a href={wa} target="_blank" rel="noreferrer">
                  <MessageCircle className="mr-1.5 h-4 w-4 text-success" /> WhatsApp
                </a>
              </Button>
            )}
            <Button asChild size="sm">
              <Link to="/superadmin/shops" search={{ manage: shop.id }}>
                <Settings2 className="mr-1.5 h-4 w-4" /> Gérer la boutique
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="resume">
        <TabsList className="mb-4 h-auto w-full flex-wrap justify-start gap-1">
          <TabsTrigger value="resume">Résumé</TabsTrigger>
          <TabsTrigger value="ventes">Ventes ({num(data.money.sales_all)})</TabsTrigger>
          <TabsTrigger value="produits">Produits ({num(data.stock.products_total)})</TabsTrigger>
          <TabsTrigger value="clients">Clients ({num(data.counts.customers)})</TabsTrigger>
          <TabsTrigger value="fournisseurs">
            Fournisseurs ({num(data.counts.suppliers)})
          </TabsTrigger>
          <TabsTrigger value="equipe">
            Équipe ({num(data.counts.members + data.counts.employees)})
          </TabsTrigger>
          <TabsTrigger value="mouvements">Mouvements ({num(data.counts.movements)})</TabsTrigger>
          <TabsTrigger value="messages">Messages ({num(data.counts.messages)})</TabsTrigger>
          <TabsTrigger value="imports">Imports ({num(data.counts.imports)})</TabsTrigger>
          <TabsTrigger value="journal">Journal admin ({num(data.audit.length)})</TabsTrigger>
        </TabsList>
        <TabsContent value="resume">
          <Summary d={data} />
        </TabsContent>
        <TabsContent value="ventes">
          <SalesTab d={data} />
        </TabsContent>
        <TabsContent value="produits">
          <ProductsTab d={data} />
        </TabsContent>
        <TabsContent value="clients">
          <CustomersTab d={data} />
        </TabsContent>
        <TabsContent value="fournisseurs">
          <SuppliersTab d={data} />
        </TabsContent>
        <TabsContent value="equipe">
          <TeamTab d={data} />
        </TabsContent>
        <TabsContent value="mouvements">
          <MovementsTab d={data} />
        </TabsContent>
        <TabsContent value="messages">
          <MessagesTab d={data} />
        </TabsContent>
        <TabsContent value="imports">
          <ImportsTab d={data} />
        </TabsContent>
        <TabsContent value="journal">
          <AuditTab d={data} />
        </TabsContent>
      </Tabs>
    </>
  );
}
