import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useShops } from "@/lib/shop-store";
import { PageHeader, StatCard } from "@/components/page-parts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
};

function ReportsPage() {
  const { current } = useShops();
  const [range, setRange] = useState<Range>("30");
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
          .select("id,name,sku,sale_price,cost_price,stock,stock_min,unit,is_active")
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
  }, [current?.id, fromDate]);

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
                Tout va bien, aucun produit en rupture 👌
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

      <p className="mt-6 text-xs text-muted-foreground">
        💡 Astuce : tous les boutons « Télécharger » créent un fichier Excel que vous pouvez envoyer
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
        .select("id,total,payment_method,amount_paid,change_due,payments,cashier_id")
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
    const k = s.cashier_id ? (names[s.cashier_id] ?? "Caissier") : "Propriétaire";
    const e = byCashier.get(k) ?? { n: 0, total: 0 };
    e.n++;
    e.total += Number(s.total);
    byCashier.set(k, e);
  }

  const print = () => {
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Rapport de caisse ${day}</title>
<style>body{font-family:sans-serif;max-width:640px;margin:20px auto;color:#111}h1{font-size:18px}table{width:100%;border-collapse:collapse;margin:12px 0}td,th{padding:6px 4px;border-bottom:1px solid #ddd;text-align:left;font-size:14px}td.r,th.r{text-align:right}.tot{font-weight:700;border-top:2px solid #111}.noprint{margin-bottom:12px}@media print{.noprint{display:none}}</style>
</head><body>
<div class="noprint"><button onclick="window.print()" style="background:#ce1126;color:#fff;border:0;padding:8px 14px;border-radius:6px;font-weight:600;cursor:pointer">🖨️ Imprimer</button></div>
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
                    {diff === 0 ? "Caisse juste ✅" : "À vérifier avant fermeture"}
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
