import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useShops } from "@/lib/shop-store";
import { PageHeader, StatCard } from "@/components/page-parts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Download,
  TrendingUp,
  Package,
  Wallet,
  Loader2,
  AlertTriangle,
  Lightbulb,
  Printer,
  Clock,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { fmtMoney, fmtNumber, fmtDate } from "@/lib/format";
import { downloadCsv } from "@/lib/export-csv";

export const Route = createFileRoute("/_authenticated/reports")({
  head: () => ({ meta: [{ title: "Mes chiffres — BoutikBF" }] }),
  component: ReportsPage,
});

type Range = "7" | "30" | "90" | "365";
const RANGE_LABEL: Record<Range, string> = {
  "7": "7 derniers jours",
  "30": "30 derniers jours",
  "90": "3 derniers mois",
  "365": "cette année",
};

type Sale = {
  id: string;
  reference: string | null;
  total: number;
  subtotal: number;
  tax: number;
  discount: number;
  payment_method: string;
  created_at: string;
  cashier_id: string | null;
  customer_id: string | null;
};
type SaleItem = {
  sale_id: string;
  product_id: string | null;
  name: string;
  quantity: number;
  unit_price: number;
  total: number;
};
type Product = {
  id: string;
  name: string;
  sku: string | null;
  sale_price: number;
  cost_price: number;
  stock: number;
  stock_min: number;
  unit: string;
  is_active: boolean;
  expiry_date?: string | null;
};

function ReportsPage() {
  const { current } = useShops();
  const [range, setRange] = useState<Range>("30");
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const [sales, setSales] = useState<Sale[]>([]);
  const [items, setItems] = useState<SaleItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const fromDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - Number(range));
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
  }, [range]);

  useEffect(() => {
    if (!current) return;
    setLoading(true);
    (async () => {
      const [s, p] = await Promise.all([
        supabase
          .from("sales")
          .select("*")
          .eq("shop_id", current.id)
          .gte("created_at", fromDate)
          .order("created_at", { ascending: false }),
        supabase
          .from("products")
          .select("id,name,sku,sale_price,cost_price,stock,stock_min,unit,is_active,expiry_date")
          .eq("shop_id", current.id),
      ]);
      const saleRows = (s.data ?? []) as Sale[];
      setSales(saleRows);
      setProducts((p.data ?? []) as Product[]);
      if (saleRows.length > 0) {
        const { data: it } = await supabase
          .from("sale_items")
          .select("*")
          .in(
            "sale_id",
            saleRows.map((r) => r.id),
          );
        setItems((it ?? []) as SaleItem[]);
      } else {
        setItems([]);
      }
      setLoading(false);
    })();
  }, [current?.id, fromDate, refreshKey]);

  const cur = current?.currency ?? "XOF";

  const totalRevenue = sales.reduce((a, s) => a + Number(s.total), 0);
  const nbSales = sales.length;
  const avgTicket = nbSales > 0 ? totalRevenue / nbSales : 0;
  const productCost = new Map(products.map((p) => [p.id, Number(p.cost_price)] as const));
  const margin = items.reduce((a, i) => {
    const cost = i.product_id ? (productCost.get(i.product_id) ?? 0) : 0;
    return a + (Number(i.unit_price) - cost) * Number(i.quantity);
  }, 0);

  const paymentAgg = new Map<string, number>();
  sales.forEach((s) =>
    paymentAgg.set(s.payment_method, (paymentAgg.get(s.payment_method) ?? 0) + Number(s.total)),
  );
  const payLabels: Record<string, string> = {
    cash: "Espèces",
    mobile: "Mobile Money",
    card: "Carte",
    credit: "À crédit",
  };

  const productAgg = new Map<string, { name: string; qty: number; revenue: number }>();
  items.forEach((i) => {
    const key = i.product_id ?? i.name;
    const c = productAgg.get(key) ?? { name: i.name, qty: 0, revenue: 0 };
    c.qty += Number(i.quantity);
    c.revenue += Number(i.total);
    productAgg.set(key, c);
  });
  const topProducts = [...productAgg.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 10);

  const lowStock = products.filter((p) => p.is_active && p.stock <= (p.stock_min || 5));
  const stockValue = products.reduce((a, p) => a + Number(p.sale_price) * Number(p.stock), 0);

  const dailyAgg = new Map<string, { revenue: number; count: number }>();
  sales.forEach((s) => {
    const d = new Date(s.created_at).toISOString().slice(0, 10);
    const c = dailyAgg.get(d) ?? { revenue: 0, count: 0 };
    c.revenue += Number(s.total);
    c.count += 1;
    dailyAgg.set(d, c);
  });
  const daily = [...dailyAgg.entries()].sort((a, b) => b[0].localeCompare(a[0])).slice(0, 30);
  const bestDay = daily.slice().sort((a, b) => b[1].revenue - a[1].revenue)[0];

  const exportSalesCsv = () =>
    downloadCsv(
      `ventes-${range}j.csv`,
      sales.map((s) => ({
        reference: s.reference ?? s.id,
        date: new Date(s.created_at).toLocaleString("fr-FR"),
        paiement: payLabels[s.payment_method] ?? s.payment_method,
        total_encaisse: Number(s.total),
      })),
    );
  const exportStockCsv = () =>
    downloadCsv(
      `stock.csv`,
      products.map((p) => ({
        produit: p.name,
        code: p.sku ?? "",
        en_stock: Number(p.stock),
        unite: p.unit,
        prix_achat: Number(p.cost_price),
        prix_vente: Number(p.sale_price),
        valeur_en_stock: Number(p.stock) * Number(p.sale_price),
      })),
    );
  const exportTopProductsCsv = () =>
    downloadCsv(
      `meilleurs-produits-${range}j.csv`,
      topProducts.map((t) => ({
        produit: t.name,
        quantite_vendue: t.qty,
        total_encaisse: t.revenue,
      })),
    );

  return (
    <div>
      <PageHeader
        title="Mes chiffres"
        description="Voyez comment marche votre boutique en un coup d'œil. Cliquez sur « Télécharger » pour ouvrir dans Excel."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Select value={range} onValueChange={(v) => setRange(v as Range)}>
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 derniers jours</SelectItem>
                <SelectItem value="30">30 derniers jours</SelectItem>
                <SelectItem value="90">3 derniers mois</SelectItem>
                <SelectItem value="365">Cette année</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={exportSalesCsv}>
              <Download className="mr-2 h-4 w-4" />
              Télécharger mes ventes
            </Button>
          </div>
        }
      />

      {loading && (
        <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Un instant…
        </div>
      )}

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <StatCard
          label={`Total encaissé (${RANGE_LABEL[range]})`}
          value={fmtMoney(totalRevenue, cur)}
          icon={TrendingUp}
          tone="success"
        />
        <StatCard
          label="Nombre de ventes"
          value={fmtNumber(nbSales)}
          icon={TrendingUp}
          tone="primary"
        />
        <StatCard label="Panier moyen d'un client" value={fmtMoney(avgTicket, cur)} icon={Wallet} />
        <StatCard
          label="Bénéfice estimé"
          value={fmtMoney(margin, cur)}
          icon={Wallet}
          tone="warning"
        />
      </div>

      {bestDay && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-success/30 bg-success/5 p-4 text-sm">
          <Lightbulb className="mt-0.5 h-5 w-5 flex-none text-success" />
          <div>
            <b className="text-foreground">Votre meilleur jour :</b> le {fmtDate(bestDay[0])} vous
            avez encaissé <b className="text-success">{fmtMoney(bestDay[1].revenue, cur)}</b> sur{" "}
            {bestDay[1].count} vente(s). Essayez de refaire les mêmes actions ce jour-là !
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> Combien j'ai vendu chaque jour
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {daily.length === 0 ? (
              <p className="p-8 text-center text-sm text-muted-foreground">
                Aucune vente pour l'instant. Ouvrez la caisse et enregistrez votre première vente !
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Jour</TableHead>
                    <TableHead className="text-right">Ventes</TableHead>
                    <TableHead className="text-right">Encaissé</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {daily.map(([d, v]) => (
                    <TableRow key={d}>
                      <TableCell>{fmtDate(d)}</TableCell>
                      <TableCell className="text-right font-mono">{v.count}</TableCell>
                      <TableCell className="text-right font-mono font-semibold text-primary">
                        {fmtMoney(v.revenue, cur)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <Wallet className="h-4 w-4" /> Comment mes clients paient
            </CardTitle>
          </CardHeader>
          <CardContent>
            {paymentAgg.size === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">
                Pas encore de paiement enregistré.
              </p>
            ) : (
              <div className="space-y-3">
                {[...paymentAgg.entries()]
                  .sort((a, b) => b[1] - a[1])
                  .map(([m, v]) => {
                    const pct = totalRevenue > 0 ? (v / totalRevenue) * 100 : 0;
                    return (
                      <div key={m}>
                        <div className="mb-1 flex items-center justify-between text-sm">
                          <span>{payLabels[m] ?? m}</span>
                          <span className="font-mono font-semibold">
                            {fmtMoney(v, cur)}{" "}
                            <span className="text-muted-foreground text-xs">
                              ({pct.toFixed(0)}%)
                            </span>
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full bg-gradient-primary"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-display flex items-center gap-2">
              <Package className="h-4 w-4" /> Ce qui se vend le mieux
            </CardTitle>
            <Button size="sm" variant="outline" onClick={exportTopProductsCsv}>
              <Download className="mr-1.5 h-3.5 w-3.5" />
              Excel
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {topProducts.length === 0 ? (
              <p className="p-8 text-center text-sm text-muted-foreground">
                Aucun produit vendu pour l'instant.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produit</TableHead>
                    <TableHead className="text-right">Vendus</TableHead>
                    <TableHead className="text-right">Encaissé</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topProducts.map((t) => (
                    <TableRow key={t.name}>
                      <TableCell className="font-medium">{t.name}</TableCell>
                      <TableCell className="text-right font-mono">{fmtNumber(t.qty)}</TableCell>
                      <TableCell className="text-right font-mono font-semibold text-primary">
                        {fmtMoney(t.revenue, cur)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-display flex items-center gap-2">
              <Package className="h-4 w-4" /> Mon stock en boutique
            </CardTitle>
            <Button size="sm" variant="outline" onClick={exportStockCsv}>
              <Download className="mr-1.5 h-3.5 w-3.5" />
              Excel
            </Button>
          </CardHeader>
          <CardContent>
            <div className="mb-4 rounded-lg border border-border p-3">
              <div className="text-xs text-muted-foreground">
                Valeur de tout ce que vous avez en boutique
              </div>
              <div className="mt-1 font-display text-2xl font-bold text-primary">
                {fmtMoney(stockValue, cur)}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                Si vous vendiez tout au prix affiché.
              </div>
            </div>
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
              <AlertTriangle className="h-4 w-4 text-warning" /> À racheter bientôt (
              {lowStock.length})
            </div>
            {lowStock.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Tout va bien, aucun produit en rupture
              </p>
            ) : (
              <ul className="max-h-56 space-y-1 overflow-auto text-sm">
                {lowStock.map((p) => (
                  <li
                    key={p.id}
                    className="flex justify-between border-b border-dashed border-border py-1"
                  >
                    <span>{p.name}</span>
                    <span className="font-mono text-warning">
                      Il reste {fmtNumber(Number(p.stock))} {p.unit}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <ZReport currency={cur} />

      <AiAdvisor
        products={products}
        items={items}
        sales={sales}
        currency={cur}
        shopId={current?.id}
        onChanged={() => setRefreshKey((k) => k + 1)}
      />

      <TimeHeatmap sales={sales} currency={cur} />

      <p className="mt-6 text-xs text-muted-foreground">
        Astuce : tous les boutons « Télécharger » créent un fichier Excel que vous pouvez envoyer
        à votre comptable ou ouvrir sur votre téléphone.
      </p>
    </div>
  );
}

/* ---------- Z de caisse (rapport de fermeture journalier) ---------- */

type ZSale = {
  id: string;
  total: number;
  payment_method: string;
  amount_paid: number | null;
  change_due: number;
  payments: { method: string; amount: number }[] | null;
  cashier_id: string | null;
  employee_id: string | null;
  employees?: { name: string } | null;
};

const Z_METHOD_LABEL: Record<string, string> = {
  cash: "Espèces",
  mobile: "Mobile Money",
  card: "Carte bancaire",
  credit: "Crédit",
  mixed: "Mixte",
};

function ZReport({ currency }: { currency: string }) {
  const { current } = useShops();
  const [day, setDay] = useState(() => new Date().toISOString().slice(0, 10));
  const [float, setFloat] = useState("0");
  const [counted, setCounted] = useState("");
  const [sales, setSales] = useState<ZSale[] | null>(null);
  const [names, setNames] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!current) return;
    setSales(null);
    (async () => {
      const start = new Date(`${day}T00:00:00`);
      const end = new Date(start.getTime() + 86_400_000);
      const { data } = await supabase
        .from("sales")
        .select(
          "id,total,payment_method,amount_paid,change_due,payments,cashier_id,employee_id,employees(name)",
        )
        .eq("shop_id", current.id)
        .eq("status", "completed")
        .gte("created_at", start.toISOString())
        .lt("created_at", end.toISOString());
      const rows = (data ?? []) as ZSale[];
      setSales(rows);
      const cashierIds = [...new Set(rows.map((r) => r.cashier_id).filter(Boolean) as string[])];
      if (cashierIds.length > 0) {
        const { data: prof } = await supabase
          .from("profiles")
          .select("id,full_name")
          .in("id", cashierIds);
        setNames(
          Object.fromEntries(
            (prof ?? []).map((p) => [p.id as string, (p.full_name ?? "Caissier") as string]),
          ),
        );
      }
    })();
  }, [current?.id, day]);

  if (!current) return null;

  const rows = sales ?? [];
  const byMethod = new Map<
    string,
    { n: number; total: number; cashPart: number; change: number }
  >();
  for (const s of rows) {
    const key = s.payment_method;
    const e = byMethod.get(key) ?? { n: 0, total: 0, cashPart: 0, change: 0 };
    e.n++;
    e.total += Number(s.total);
    if (key === "cash") {
      const paid = Number(s.amount_paid ?? s.total);
      e.cashPart += paid; // encaissé physiquement
      e.change += Number(s.change_due ?? 0);
    } else if (key === "mixed" && Array.isArray(s.payments)) {
      for (const p of s.payments) {
        const sub = byMethod.get(p.method) ?? { n: 0, total: 0, cashPart: 0, change: 0 };
        if (p.method === "cash") sub.cashPart += Number(p.amount);
        else sub.total += Number(p.amount);
        byMethod.set(p.method, sub);
      }
    } else {
      e.cashPart += 0;
    }
    byMethod.set(key, e);
  }

  const floatNum = Number(float || 0);
  const expectedCash =
    floatNum +
    rows.reduce((a, s) => {
      if (s.payment_method === "cash")
        return a + Number(s.amount_paid ?? s.total) - Number(s.change_due ?? 0);
      if (s.payment_method === "mixed" && Array.isArray(s.payments))
        return (
          a +
          s.payments.filter((p) => p.method === "cash").reduce((x, p) => x + Number(p.amount), 0)
        );
      return a;
    }, 0);
  const countedNum = counted === "" ? null : Number(counted);
  const diff = countedNum === null ? null : countedNum - expectedCash;

  const byCashier = new Map<string, { n: number; total: number }>();
  for (const s of rows) {
    const k = s.cashier_id
      ? (names[s.cashier_id] ?? "Caissier")
      : (s.employees?.name ?? "Propriétaire");
    const e = byCashier.get(k) ?? { n: 0, total: 0 };
    e.n++;
    e.total += Number(s.total);
    byCashier.set(k, e);
  }

  const print = () => {
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Rapport de caisse ${day}</title>
<style>body{font-family:sans-serif;max-width:640px;margin:20px auto;color:#111}h1{font-size:18px}table{width:100%;border-collapse:collapse;margin:12px 0}td,th{padding:6px 4px;border-bottom:1px solid #ddd;text-align:left;font-size:14px}td.r,th.r{text-align:right}.tot{font-weight:700;border-top:2px solid #111}.noprint{margin-bottom:12px}@media print{.noprint{display:none}}</style>
</head><body>
<div class="noprint"><button onclick="window.print()" style="background:#ce1126;color:#fff;border:0;padding:8px 14px;border-radius:6px;font-weight:600;cursor:pointer">Imprimer</button></div>
<h1>${current.name} — Rapport de caisse (Z)</h1>
<p>Journée du <b>${day}</b> · ${rows.length} vente(s) · ${fmtNumber(rows.reduce((a, s) => a + Number(s.total), 0))} ${currency}</p>
<table><tr><th>Mode</th><th class="r">Ventes</th><th class="r">Montant</th></tr>
${[...byMethod.entries()]
  .map(
    ([m, e]) =>
      `<tr><td>${Z_METHOD_LABEL[m] ?? m}</td><td class="r">${e.n}</td><td class="r">${fmtMoney(e.total, currency)}</td></tr>`,
  )
  .join("")}</table>
<table>
<tr><td>Fond de caisse ouvert</td><td class="r">${fmtMoney(floatNum, currency)}</td></tr>
<tr><td>Espèces attendues en caisse</td><td class="r tot">${fmtMoney(expectedCash, currency)}</td></tr>
${
  countedNum !== null
    ? `<tr><td>Espèces comptées</td><td class="r">${fmtMoney(countedNum, currency)}</td></tr>
<tr><td class="tot">Écart</td><td class="r tot" style="color:${diff && diff < 0 ? "#c00" : "#080"}">${fmtMoney(diff ?? 0, currency)}</td></tr>`
    : ""
}
</table>
<table><tr><th>Caissier</th><th class="r">Ventes</th><th class="r">Total</th></tr>
${[...byCashier.entries()]
  .map(
    ([n, e]) =>
      `<tr><td>${n}</td><td class="r">${e.n}</td><td class="r">${fmtMoney(e.total, currency)}</td></tr>`,
  )
  .join("")}</table>
</body></html>`;
    const w = window.open("", "_blank", "width=520,height=720");
    if (!w) return toast?.error?.("Autorisez les pop-ups") ?? alert("Autorisez les pop-ups");
    w.document.open();
    w.document.write(html);
    w.document.close();
  };

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Wallet className="h-4 w-4 text-primary" />
          Rapport de caisse du jour (Z)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <Label>Journée</Label>
            <Input
              type="date"
              value={day}
              onChange={(e) => setDay(e.target.value)}
              className="w-44"
            />
          </div>
          <div className="space-y-1">
            <Label>Fond de caisse (départ)</Label>
            <Input
              type="number"
              value={float}
              onChange={(e) => setFloat(e.target.value)}
              className="w-40"
            />
          </div>
          <div className="space-y-1">
            <Label>Espèces comptées (fermeture)</Label>
            <Input
              type="number"
              value={counted}
              onChange={(e) => setCounted(e.target.value)}
              placeholder="À compteur en fin de journée"
              className="w-52"
            />
          </div>
          <Button variant="outline" onClick={print} disabled={sales === null}>
            <Printer className="mr-2 h-4 w-4" /> Imprimer le Z
          </Button>
        </div>

        {sales === null ? (
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-border p-4">
                <h4 className="mb-2 text-sm font-semibold">Par mode de paiement</h4>
                {byMethod.size === 0 ? (
                  <p className="text-xs text-muted-foreground">Aucune vente ce jour.</p>
                ) : (
                  <Table>
                    <TableBody>
                      {[...byMethod.entries()].map(([m, e]) => (
                        <TableRow key={m}>
                          <TableCell className="py-1.5 text-xs">{Z_METHOD_LABEL[m] ?? m}</TableCell>
                          <TableCell className="py-1.5 text-xs text-muted-foreground">
                            {e.n} vente(s)
                          </TableCell>
                          <TableCell className="py-1.5 text-right text-xs font-medium">
                            {fmtMoney(e.total, currency)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
              <div className="rounded-xl border border-border p-4">
                <h4 className="mb-2 text-sm font-semibold">Par caissier</h4>
                <Table>
                  <TableBody>
                    {[...byCashier.entries()].map(([n, e]) => (
                      <TableRow key={n}>
                        <TableCell className="py-1.5 text-xs">{n}</TableCell>
                        <TableCell className="py-1.5 text-xs text-muted-foreground">
                          {e.n} vente(s)
                        </TableCell>
                        <TableCell className="py-1.5 text-right text-xs font-medium">
                          {fmtMoney(e.total, currency)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-4 rounded-xl border border-primary/30 bg-primary/5 p-4">
              <div>
                <div className="text-xs text-muted-foreground">Espèces attendues en caisse</div>
                <div className="font-display text-2xl font-bold">
                  {fmtMoney(expectedCash, currency)}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  fond {fmtMoney(floatNum, currency)} + espèces vendues − monnaie rendue
                </div>
              </div>
              {countedNum !== null && diff !== null && (
                <div className="ml-auto text-right">
                  <div className="text-xs text-muted-foreground">Écart de comptage</div>
                  <div
                    className={`font-display text-2xl font-bold ${diff < 0 ? "text-destructive" : diff > 0 ? "text-warning" : "text-success"}`}
                  >
                    {diff > 0 ? "+" : ""}
                    {fmtMoney(diff, currency)}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {diff === 0 ? "Caisse juste" : "À vérifier avant fermeture"}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

/* ---------- Assistant IA : conseils statistiques 100 % locaux ---------- */

type Advice = {
  key: string;
  kind: "prix" | "dormant" | "perime" | "hebo";
  title: string;
  detail: string;
  action?: { label: string; run: () => Promise<void> };
};

function round50(n: number) {
  return Math.max(50, Math.round(n / 50) * 50);
}

function AiAdvisor({
  products,
  items,
  sales,
  currency,
  shopId,
  onChanged,
}: {
  products: Product[];
  items: SaleItem[];
  sales: Sale[];
  currency: string;
  shopId?: string;
  onChanged: () => void;
}) {
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [custs, setCusts] = useState<
    { id: string; name: string; phone: string | null; birthdate: string | null }[]
  >([]);

  useEffect(() => {
    if (!shopId) return;
    supabase
      .from("customers")
      .select("id,name,phone,birthdate")
      .eq("shop_id", shopId)
      .not("birthdate", "is", null)
      .then(({ data }) => setCusts((data ?? []) as typeof custs));
  }, [shopId]);

  const advice = useMemo<Advice[]>(() => {
    if (!shopId) return [];
    const list: Advice[] = [];
    const now = Date.now();
    const weekAgo = now - 7 * 86_400_000;
    const twoWeekAgo = now - 14 * 86_400_000;

    // 1. Résumé hebdomadaire
    const thisWeek = sales.filter((s) => new Date(s.created_at).getTime() >= weekAgo);
    const lastWeek = sales.filter((s) => {
      const t = new Date(s.created_at).getTime();
      return t >= twoWeekAgo && t < weekAgo;
    });
    const rev = (arr: Sale[]) => arr.reduce((a, s) => a + Number(s.total), 0);
    const tw = rev(thisWeek);
    const lw = rev(lastWeek);
    const delta = lw === 0 ? (tw > 0 ? 100 : 0) : Math.round(((tw - lw) / lw) * 100);
    const soldIds = new Map<string, number>();
    const saleIdsThisWeek = new Set(thisWeek.map((s) => s.id));
    items.forEach((i) => {
      if (saleIdsThisWeek.has(i.sale_id) && i.product_id)
        soldIds.set(i.product_id, (soldIds.get(i.product_id) ?? 0) + Number(i.quantity));
    });
    const top = [...soldIds.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
    list.push({
      key: "hebo",
      kind: "hebo",
      title: `Cette semaine : ${fmtMoney(tw, currency)} (${thisWeek.length} ventes)`,
      detail:
        (lw > 0 || tw > 0 ? `${delta >= 0 ? "+" : ""}${delta} % vs semaine dernière. ` : "") +
        (top.length
          ? "Top : " +
            top
              .map(([id, q]) => `${products.find((p) => p.id === id)?.name ?? "?"} (×${q})`)
              .join(", ")
          : "Aucune vente cette semaine."),
    });

    // 2. Marges faibles → suggestion de prix
    products
      .filter((p) => p.is_active && p.cost_price > 0 && p.sale_price > 0)
      .filter((p) => (p.sale_price - p.cost_price) / p.sale_price < 0.1)
      .slice(0, 4)
      .forEach((p) => {
        const suggested = round50(p.cost_price * 1.25);
        if (suggested <= p.sale_price) return;
        list.push({
          key: `prix-${p.id}`,
          kind: "prix",
          title: `« ${p.name} » : marge trop faible`,
          detail: `Tu vends ${fmtMoney(p.sale_price, currency)} un produit qui coûte ${fmtMoney(p.cost_price, currency)} (${Math.round(((p.sale_price - p.cost_price) / p.sale_price) * 100)} % de marge). Prix conseillé : ${fmtMoney(suggested, currency)} (+${Math.round(((suggested - p.sale_price) / p.sale_price) * 100)} %).`,
          action: {
            label: `Passer à ${fmtMoney(suggested, currency)}`,
            run: async () => {
              const { error } = await supabase
                .from("products")
                .update({ sale_price: suggested })
                .eq("id", p.id);
              if (error) throw error;
              onChanged();
            },
          },
        });
      });

    // 3. Stocks dormants (aucune vente sur la période chargée) → promo
    const soldEver = new Set(items.map((i) => i.product_id).filter(Boolean) as string[]);
    products
      .filter((p) => p.is_active && p.stock > 0 && !soldEver.has(p.id))
      .slice(0, 3)
      .forEach((p) => {
        const promo = round50(p.sale_price * 0.85);
        const end = new Date(now + 14 * 86_400_000).toISOString().slice(0, 10);
        list.push({
          key: `dormant-${p.id}`,
          kind: "dormant",
          title: `« ${p.name} » ne se vend pas`,
          detail: `${p.stock} ${p.unit} en stock sans aucune vente sur la période. Suggestion : promo de liquidation à ${fmtMoney(promo, currency)} pendant 14 jours.`,
          action: {
            label: "Mettre en promo -15 %",
            run: async () => {
              const { error } = await supabase
                .from("products")
                .update({
                  promo_price: promo,
                  promo_start: new Date().toISOString().slice(0, 10),
                  promo_end: end,
                })
                .eq("id", p.id);
              if (error) throw error;
              onChanged();
            },
          },
        });
      });

    // 4. Prévision des ventes 7 jours (moyenne mobile, tendance)
    const dayKey = (d: Date) => d.toISOString().slice(0, 10);
    const revByDay = new Map<string, number>();
    sales.forEach((s) => {
      const k = dayKey(new Date(s.created_at));
      revByDay.set(k, (revByDay.get(k) ?? 0) + Number(s.total));
    });
    const days = (n: number) => {
      const arr: number[] = [];
      for (let i = 1; i <= n; i++) {
        const d = new Date(now - i * 86_400_000);
        arr.push(revByDay.get(dayKey(d)) ?? 0);
      }
      return arr;
    };
    const last7 = days(7);
    const prev7 = days(14).slice(7);
    const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);
    const s7 = sum(last7);
    const sp7 = sum(prev7);
    if (s7 > 0 || sp7 > 0) {
      const trendPct = sp7 === 0 ? 0 : Math.round(((s7 - sp7) / sp7) * 100);
      const forecast =
        Math.round(
          (s7 *
            (trendPct >= 0
              ? 1 + Math.min(trendPct, 40) / 200
              : 1 + Math.max(trendPct, -40) / 200)) /
            100,
        ) * 100;
      list.push({
        key: "prevision",
        kind: "hebo",
        title: `Prévision 7 jours : ≈ ${fmtMoney(forecast, currency)}`,
        detail: `Semaine écoulée : ${fmtMoney(s7, currency)} (${trendPct >= 0 ? "+" : ""}${trendPct} % vs précédente). ${
          trendPct < -15
            ? "Baisse marquée — pense à une promo ou à vérifier la concurrence."
            : trendPct > 15
              ? "Forte croissance — anticipe le réappro sur tes meilleures ventes."
              : "Tendance stable."
        }`,
      });
    }

    // 5. Anniversaires dans les 7 prochains jours
    const bday = custs
      .map((c) => {
        if (!c.birthdate) return null;
        const b = new Date(c.birthdate);
        const thisYear = new Date(now);
        let next = new Date(thisYear.getFullYear(), b.getMonth(), b.getDate());
        if (next.getTime() < new Date(thisYear.toDateString()).getTime())
          next = new Date(thisYear.getFullYear() + 1, b.getMonth(), b.getDate());
        const dd = Math.ceil((next.getTime() - thisYear.getTime()) / 86_400_000);
        return dd <= 7 ? { c, dd, date: next } : null;
      })
      .filter(Boolean) as { c: (typeof custs)[number]; dd: number; date: Date }[];
    bday.slice(0, 3).forEach(({ c, dd, date }) => {
      list.push({
        key: `bday-${c.id}`,
        kind: "hebo",
        title: `Anniversaire : ${c.name} ${dd === 0 ? "c'est aujourd'hui !" : `dans ${dd} j`}`,
        detail: `Souhaite-lui un bon anniversaire par WhatsApp — ça fidélise plus qu'une promo.`,
        action: {
          label: "Message d'anniversaire",
          run: async () => {
            const msg = `Bonjour ${c.name}, joyeux anniversaire de la part de ${"ta boutique"} ! Un petit geste de fidélité t'attend`;
            const digits = (c.phone ?? "").replace(/\D/g, "");
            const full = digits.length === 8 ? `226${digits}` : digits;
            window.open(
              full
                ? `https://wa.me/${full}?text=${encodeURIComponent(msg)}`
                : `https://wa.me/?text=${encodeURIComponent(msg)}`,
              "_blank",
            );
          },
        },
      });
      void date;
    });

    // 6. Péremption proche → promo immédiate
    products
      .filter((p) => p.expiry_date && p.stock > 0)
      .filter((p) => {
        const d = Math.ceil((new Date(p.expiry_date!).getTime() - now) / 86_400_000);
        return d <= 30;
      })
      .slice(0, 3)
      .forEach((p) => {
        const promo = round50(p.sale_price * 0.7);
        const d = Math.ceil((new Date(p.expiry_date!).getTime() - now) / 86_400_000);
        list.push({
          key: `perime-${p.id}`,
          kind: "perime",
          title: `« ${p.name} » périme ${d < 0 ? `déjà (${d} j)` : `dans ${d} j`}`,
          detail: `Il reste ${p.stock} ${p.unit}. Vise une promo forte (${fmtMoney(promo, currency)}) pour tout écouler avant la date.`,
          action: {
            label: "Promo -30 %",
            run: async () => {
              const { error } = await supabase
                .from("products")
                .update({
                  promo_price: promo,
                  promo_start: new Date().toISOString().slice(0, 10),
                  promo_end: p.expiry_date,
                })
                .eq("id", p.id);
              if (error) throw error;
              onChanged();
            },
          },
        });
      });

    return list;
  }, [products, items, sales, shopId, currency, onChanged, custs]);

  const apply = async (a: Advice) => {
    if (!a.action) return;
    setBusyKey(a.key);
    try {
      await a.action.run();
      toast.success("Conseil appliqué");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusyKey(null);
    }
  };

  const iconFor = (k: Advice["kind"]) =>
    k === "hebo" ? (
      <TrendingUp className="h-4 w-4 shrink-0 text-primary" />
    ) : k === "prix" ? (
      <Wallet className="h-4 w-4 shrink-0 text-warning" />
    ) : k === "dormant" ? (
      <Package className="h-4 w-4 shrink-0 text-muted-foreground" />
    ) : (
      <AlertTriangle className="h-4 w-4 shrink-0 text-destructive" />
    );

  return (
    <Card className="mt-8 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Lightbulb className="h-4 w-4 text-primary" />
          Assistant IA — conseils personnalisés
          <Badge variant="secondary" className="ml-1 text-[10px]">
            hors-ligne, sans abonnement
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {advice.map((a) => (
          <div
            key={a.key}
            className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-3"
          >
            {iconFor(a.kind)}
            <div className="min-w-[200px] flex-1">
              <div className="text-sm font-semibold">{a.title}</div>
              <div className="text-xs text-muted-foreground">{a.detail}</div>
            </div>
            {a.action && (
              <Button
                size="sm"
                variant="outline"
                disabled={busyKey === a.key}
                onClick={() => apply(a)}
              >
                {busyKey === a.key ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
                {a.action.label}
              </Button>
            )}
          </div>
        ))}
        {advice.length === 0 && (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Pas encore assez de données pour des conseils — enregistre des ventes et l'assistant
            analysera tout ça.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

/* ---------- Répartition des ventes par heure ---------- */

function TimeHeatmap({ sales, currency }: { sales: Sale[]; currency: string }) {
  const { byHour, max } = useMemo(() => {
    const h = new Array(24).fill(0) as number[];
    sales.forEach((s) => (h[new Date(s.created_at).getHours()] += Number(s.total)));
    return { byHour: h, max: Math.max(...h, 1) };
  }, [sales]);

  const peak = byHour.indexOf(Math.max(...byHour));
  const quietIdx = (() => {
    const active = byHour.map((v, i) => [v, i] as const).filter(([v]) => v > 0);
    if (active.length < 3) return -1;
    const sorted = [...active].sort((a, b) => a[0] - b[0]);
    return sorted[0][1];
  })();

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Clock className="h-4 w-4 text-primary" />
          Répartition des ventes par heure
        </CardTitle>
      </CardHeader>
      <CardContent>
        {sales.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Pas encore de ventes sur la période.
          </p>
        ) : (
          <>
            <div className="flex h-32 items-end gap-1">
              {byHour.map((v, h) => (
                <div key={h} className="flex flex-1 flex-col items-center gap-1">
                  <div
                    className={`w-full rounded-t ${h === peak ? "bg-primary" : "bg-primary/25"}`}
                    style={{ height: `${Math.max(2, (v / max) * 100)}%` }}
                    title={`${h}h — ${fmtMoney(v, currency)}`}
                  />
                  {h % 3 === 0 && <span className="text-[9px] text-muted-foreground">{h}h</span>}
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Pic à <b>{peak} h</b>
              {quietIdx >= 0 && (
                <>
                  {" "}
                  · heure la plus calme : <b>{quietIdx} h</b>
                </>
              )}{" "}
              — planifie tes ruptures, livraires fournisseurs et promos creuses en fonction.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
