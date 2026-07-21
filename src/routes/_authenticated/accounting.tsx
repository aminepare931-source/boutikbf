import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useShops } from "@/lib/shop-store";
import { PageHeader, StatCard, EmptyState } from "@/components/page-parts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import {
  TrendingUp,
  TrendingDown,
  FileText,
  Download,
  HelpCircle,
  Wallet,
  ShoppingBag,
} from "lucide-react";
import { fmtMoney, fmtDate, fmtNumber } from "@/lib/format";
import { downloadCsv } from "@/lib/export-csv";

export const Route = createFileRoute("/_authenticated/accounting")({
  head: () => ({ meta: [{ title: "Argent qui entre & sort — BoutikBF" }] }),
  component: AccountingPage,
});

type Range = "30" | "90" | "180" | "365";

type Sale = {
  id: string;
  reference: string | null;
  total: number;
  tax: number;
  discount: number;
  payment_method: string;
  created_at: string;
};
type Movement = {
  id: string;
  product_id: string | null;
  type: string;
  quantity: number;
  reason: string | null;
  created_at: string;
};
type ProductLite = { id: string; name: string; cost_price: number };

function AccountingPage() {
  const { current } = useShops();
  const [range, setRange] = useState<Range>("30");
  const [sales, setSales] = useState<Sale[]>([]);
  const [items, setItems] = useState<
    { sale_id: string; product_id: string | null; quantity: number; total: number }[]
  >([]);
  const [movs, setMovs] = useState<Movement[]>([]);
  const [products, setProducts] = useState<ProductLite[]>([]);

  const fromDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - Number(range));
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
  }, [range]);

  useEffect(() => {
    if (!current) return;
    (async () => {
      const [s, m, p] = await Promise.all([
        supabase
          .from("sales")
          .select("id,reference,total,tax,discount,payment_method,created_at")
          .eq("shop_id", current.id)
          .gte("created_at", fromDate)
          .order("created_at", { ascending: false }),
        supabase
          .from("stock_movements")
          .select("id,product_id,type,quantity,reason,created_at")
          .eq("shop_id", current.id)
          .gte("created_at", fromDate)
          .order("created_at", { ascending: false }),
        supabase.from("products").select("id,name,cost_price").eq("shop_id", current.id),
      ]);
      const saleRows = (s.data ?? []) as Sale[];
      setSales(saleRows);
      setMovs((m.data ?? []) as Movement[]);
      setProducts((p.data ?? []) as ProductLite[]);
      if (saleRows.length > 0) {
        const { data: it } = await supabase
          .from("sale_items")
          .select("sale_id,product_id,quantity,total")
          .in(
            "sale_id",
            saleRows.map((r) => r.id),
          );
        setItems(it ?? []);
      } else {
        setItems([]);
      }
    })();
  }, [current?.id, fromDate]);

  const cur = current?.currency ?? "XOF";
  const costMap = new Map(products.map((p) => [p.id, Number(p.cost_price)] as const));
  const nameMap = new Map(products.map((p) => [p.id, p.name] as const));

  const encaisse = sales.reduce((a, s) => a + Number(s.total), 0);
  const coutMarchandises = items.reduce((a, i) => {
    const c = i.product_id ? (costMap.get(i.product_id) ?? 0) : 0;
    return a + c * Number(i.quantity);
  }, 0);
  const depenses = movs
    .filter((m) => m.type === "in")
    .reduce((a, m) => {
      const c = m.product_id ? (costMap.get(m.product_id) ?? 0) : 0;
      return a + c * Number(m.quantity);
    }, 0);
  const benefice = encaisse - coutMarchandises;

  type Entry = { date: string; libelle: string; entree: number; sortie: number };
  const entries: Entry[] = [];
  sales.forEach((s) =>
    entries.push({
      date: s.created_at,
      libelle: `Vente ${s.reference ?? s.id.slice(0, 8)} — payé en ${labelPay(s.payment_method)}`,
      entree: Number(s.total),
      sortie: 0,
    }),
  );
  movs.forEach((m) => {
    const name = m.product_id ? (nameMap.get(m.product_id) ?? "Produit") : "Produit";
    const cost = m.product_id ? (costMap.get(m.product_id) ?? 0) : 0;
    if (m.type === "in")
      entries.push({
        date: m.created_at,
        libelle: `Achat chez fournisseur — ${name} (${fmtNumber(Number(m.quantity))} unités)${m.reason ? " · " + m.reason : ""}`,
        entree: 0,
        sortie: cost * Number(m.quantity),
      });
  });
  entries.sort((a, b) => b.date.localeCompare(a.date));

  const exportJournal = () =>
    downloadCsv(
      `argent-entre-sort-${range}j.csv`,
      entries.map((e) => ({
        date: new Date(e.date).toLocaleString("fr-FR"),
        operation: e.libelle,
        argent_recu: e.entree || "",
        argent_depense: e.sortie || "",
      })),
    );
  const exportSummary = () =>
    downloadCsv(`resume-${range}j.csv`, [
      { poste: "Argent encaissé (ventes)", montant: encaisse },
      { poste: "Coût des produits vendus", montant: coutMarchandises },
      { poste: "Bénéfice avant charges", montant: benefice },
      { poste: "Argent dépensé chez fournisseurs", montant: depenses },
    ]);

  return (
    <div>
      <PageHeader
        title="Argent qui entre & qui sort"
        description="Suivez ce que vous gagnez et ce que vous dépensez, sans jargon comptable."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Select value={range} onValueChange={(v) => setRange(v as Range)}>
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 derniers jours</SelectItem>
                <SelectItem value="90">3 derniers mois</SelectItem>
                <SelectItem value="180">6 derniers mois</SelectItem>
                <SelectItem value="365">Cette année</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={exportSummary}>
              <Download className="mr-2 h-4 w-4" />
              Résumé
            </Button>
            <Button variant="outline" onClick={exportJournal}>
              <Download className="mr-2 h-4 w-4" />
              Tout le détail
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          label="Argent encaissé"
          value={fmtMoney(encaisse, cur)}
          icon={TrendingUp}
          tone="success"
        />
        <StatCard
          label="Coût des produits vendus"
          value={fmtMoney(coutMarchandises, cur)}
          icon={ShoppingBag}
          tone="destructive"
        />
        <StatCard
          label="Bénéfice estimé"
          value={fmtMoney(benefice, cur)}
          icon={Wallet}
          tone="warning"
        />
        <StatCard
          label="Dépensé en achats"
          value={fmtMoney(depenses, cur)}
          icon={TrendingDown}
          tone="primary"
        />
      </div>

      <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm">
        <p className="flex items-start gap-2">
          <HelpCircle className="mt-0.5 h-4 w-4 flex-none text-primary" />
          <span className="text-foreground/80">
            <b>En clair :</b> vous avez encaissé{" "}
            <b className="text-success">{fmtMoney(encaisse, cur)}</b>. Les produits vendus vous
            avaient coûté <b>{fmtMoney(coutMarchandises, cur)}</b> chez le fournisseur. Donc votre
            bénéfice avant loyer, transport et salaires est de{" "}
            <b className="text-warning">{fmtMoney(benefice, cur)}</b>.
          </span>
        </p>
      </div>

      <Card className="mt-6 shadow-soft">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="font-display flex items-center gap-2">
            <FileText className="h-4 w-4" /> Toutes les opérations
          </CardTitle>
          <span className="text-xs text-muted-foreground">{entries.length} opération(s)</span>
        </CardHeader>
        <CardContent className="p-0">
          {entries.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="Rien encore"
              description="Enregistrez une vente à la caisse ou une entrée de stock : elles apparaîtront ici automatiquement."
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[120px]">Date</TableHead>
                    <TableHead>Ce qui s'est passé</TableHead>
                    <TableHead className="text-right hidden sm:table-cell">Argent reçu</TableHead>
                    <TableHead className="text-right hidden sm:table-cell">
                      Argent dépensé
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.slice(0, 200).map((e, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="whitespace-nowrap text-xs">{fmtDate(e.date)}</TableCell>
                      <TableCell>{e.libelle}</TableCell>
                      <TableCell className="text-right font-mono text-success hidden sm:table-cell">
                        {e.entree ? "+ " + fmtMoney(e.entree, cur) : "—"}
                      </TableCell>
                      <TableCell className="text-right font-mono text-destructive hidden sm:table-cell">
                        {e.sortie ? "− " + fmtMoney(e.sortie, cur) : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function labelPay(m: string) {
  return (
    (
      { cash: "espèces", mobile: "Mobile Money", card: "carte", credit: "à crédit" } as Record<
        string,
        string
      >
    )[m] ?? m
  );
}
