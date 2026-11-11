import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useShops, resolveLogoUrl } from "@/lib/shop-store";
import { PageHeader, EmptyState, StatCard } from "@/components/page-parts";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ShoppingCart,
  Printer,
  FileText,
  Search,
  ChevronDown,
  Download,
  Wallet,
  Receipt,
  Ban,
  Loader2,
  User,
} from "lucide-react";
import { fmtMoney, fmtDate, fmtNumber } from "@/lib/format";
import { openReceipt } from "@/lib/receipt";
import { downloadCsv } from "@/lib/export-csv";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/sales")({
  head: () => ({ meta: [{ title: "Ventes — BoutikBF" }] }),
  component: SalesPage,
});

type Sale = {
  id: string;
  reference: string | null;
  created_at: string;
  payment_method: string;
  status: string;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  amount_paid: number | null;
  change_due: number;
  payments: { method: string; amount: number }[] | null;
  cashier_id: string | null;
  employee_id: string | null;
  customer_id: string | null;
  customers: { name: string } | null;
  employees: { name: string } | null;
};
type SaleItem = { name: string; quantity: number; unit_price: number; total: number };

const labelPay: Record<string, string> = {
  cash: "Espèces",
  mobile: "Mobile Money",
  card: "Carte",
  credit: "Crédit",
  mixed: "Mixte",
};
const labelStatus: Record<string, string> = {
  completed: "Terminée",
  pending: "En attente",
  voided: "Annulée",
  refunded: "Remboursée",
};

const PAGE = 50;

function SalesPage() {
  const { current } = useShops();
  const [sales, setSales] = useState<Sale[]>([]);
  const [cashiers, setCashiers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // filtres
  const [q, setQ] = useState("");
  const [method, setMethod] = useState("all");
  const [status, setStatus] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  // détail + annulation
  const [detail, setDetail] = useState<{ sale: Sale; items: SaleItem[] } | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [voiding, setVoiding] = useState(false);

  const load = async (reset = true) => {
    if (!current) return;
    if (reset) setLoading(true);
    else setLoadingMore(true);
    const base = supabase
      .from("sales")
      .select(
        "id,reference,created_at,payment_method,status,subtotal,tax,discount,total,amount_paid,change_due,payments,cashier_id,employee_id,customer_id,customers(name),employees(name)",
      )
      .eq("shop_id", current.id);

    const fromD = from ? new Date(`${from}T00:00:00`) : null;
    const toD = to ? new Date(`${to}T23:59:59.999`) : null;
    let query = base.order("created_at", { ascending: false });
    if (fromD) query = query.gte("created_at", fromD.toISOString());
    if (toD) query = query.lte("created_at", toD.toISOString());

    const offset = reset ? 0 : sales.length;
    const { data, error } = await query.range(offset, offset + PAGE - 1);
    if (error) toast.error(error.message);

    const rows = (data ?? []) as Sale[];
    setSales((prev) => (reset ? rows : [...prev, ...rows]));
    setHasMore(rows.length === PAGE);

    // noms des caissiers (profiles)
    const ids = [...new Set(rows.map((r) => r.cashier_id).filter(Boolean) as string[])];
    const missing = ids.filter((id) => !cashiers[id]);
    if (missing.length > 0) {
      const { data: prof } = await supabase
        .from("profiles")
        .select("id,full_name")
        .in("id", missing);
      setCashiers((c) => ({
        ...c,
        ...Object.fromEntries((prof ?? []).map((p) => [p.id as string, p.full_name ?? "—"])),
      }));
    }
    setLoading(false);
    setLoadingMore(false);
  };

  useEffect(() => {
    load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id, from, to]);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    return sales.filter((s) => {
      if (method !== "all" && s.payment_method !== method) return false;
      if (status !== "all" && s.status !== status) return false;
      if (!t) return true;
      return (
        (s.reference ?? "").toLowerCase().includes(t) ||
        (s.customers?.name ?? "").toLowerCase().includes(t) ||
        (s.cashier_id ? (cashiers[s.cashier_id] ?? "").toLowerCase().includes(t) : false)
      );
    });
  }, [sales, q, method, status, cashiers]);

  const stats = useMemo(() => {
    const done = filtered.filter((s) => s.status === "completed");
    const total = done.reduce((a, s) => a + Number(s.total), 0);
    return {
      count: done.length,
      total,
      avg: done.length ? total / done.length : 0,
      cash: done
        .filter((s) => s.payment_method === "cash")
        .reduce((a, s) => a + Number(s.total), 0),
      mobile: done
        .filter((s) => s.payment_method === "mobile")
        .reduce((a, s) => a + Number(s.total), 0),
    };
  }, [filtered]);

  const openDetail = async (s: Sale) => {
    setDetail({ sale: s, items: [] });
    setDetailLoading(true);
    const { data } = await supabase
      .from("sale_items")
      .select("name,quantity,unit_price,total")
      .eq("sale_id", s.id);
    setDetail({ sale: s, items: (data ?? []) as SaleItem[] });
    setDetailLoading(false);
  };

  const printDoc = async (s: Sale, mode: "receipt" | "invoice") => {
    if (!current) return;
    const { data: items } = await supabase
      .from("sale_items")
      .select("name,quantity,unit_price,total")
      .eq("sale_id", s.id);
    const logoUrl = await resolveLogoUrl(current.logo_url);
    openReceipt({
      mode,
      shop: {
        name: current.name,
        address: current.address,
        phone: current.phone,
        email: current.email,
        logoUrl,
        currency: current.currency,
      },
      sale: {
        reference: s.reference ?? s.id,
        created_at: s.created_at,
        payment_method: s.payment_method,
        subtotal: Number(s.subtotal),
        tax: Number(s.tax),
        discount: Number(s.discount),
        total: Number(s.total),
        paid: s.amount_paid ? fmtMoney(Number(s.amount_paid), current.currency) : undefined,
        change: Number(s.change_due ?? 0),
      },
      items: (items ?? []) as SaleItem[],
      customer: s.customers?.name ? { name: s.customers.name } : null,
    });
  };

  const cancelSale = async (s: Sale) => {
    if (!current) return;
    if (!confirm(`Annuler la vente ${s.reference ?? ""} et réintégrer le stock ?`)) return;
    setVoiding(true);
    const { error } = await supabase.from("sales").update({ status: "voided" }).eq("id", s.id);
    if (error) {
      toast.error(error.message);
      setVoiding(false);
      return;
    }
    const { data: items } = await supabase
      .from("sale_items")
      .select("product_id,quantity")
      .eq("sale_id", s.id);
    for (const it of items ?? []) {
      if (!it.product_id) continue;
      await (
        supabase as never as {
          rpc: (fn: string, args: Record<string, unknown>) => Promise<{ error: unknown }>;
        }
      ).rpc("adjust_stock", { p_product_id: it.product_id, p_delta: it.quantity });
      await supabase.from("stock_movements").insert({
        shop_id: current.id,
        product_id: it.product_id,
        type: "in",
        quantity: it.quantity,
        reason: "Annulation " + (s.reference ?? ""),
      });
    }
    toast.success("Vente annulée, stock réintégré");
    setVoiding(false);
    setDetail(null);
    load(true);
  };

  const exportCsv = () => {
    if (filtered.length === 0) return toast.error("Aucune vente à exporter");
    downloadCsv(
      `ventes-${new Date().toISOString().slice(0, 10)}.csv`,
      filtered.map((s) => ({
        reference: s.reference ?? "",
        date: new Date(s.created_at).toLocaleString("fr-FR"),
        client: s.customers?.name ?? "",
        caissier: s.cashier_id
          ? (cashiers[s.cashier_id] ?? "")
          : (s.employees?.name ?? "Propriétaire"),
        paiement: labelPay[s.payment_method] ?? s.payment_method,
        statut: labelStatus[s.status] ?? s.status,
        sous_total: Number(s.subtotal),
        remise: Number(s.discount),
        tva: Number(s.tax),
        total: Number(s.total),
      })),
    );
    toast.success(`${filtered.length} ventes exportées`);
  };

  const resetFilters = () => {
    setQ("");
    setMethod("all");
    setStatus("all");
    setFrom("");
    setTo("");
  };

  return (
    <div>
      <PageHeader
        title="Ventes"
        description="Historique complet, détail des tickets, reçus et factures"
        actions={
          <Button variant="outline" onClick={exportCsv}>
            <Download className="mr-2 h-4 w-4" /> Exporter (CSV)
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Ventes affichées" value={fmtNumber(stats.count)} icon={ShoppingCart} />
        <StatCard
          label="Chiffre d'affaires"
          value={fmtMoney(stats.total, current?.currency)}
          icon={Wallet}
          tone="success"
        />
        <StatCard
          label="Panier moyen"
          value={fmtMoney(stats.avg, current?.currency)}
          icon={Receipt}
        />
        <StatCard
          label="Dont espèces"
          value={fmtMoney(stats.cash, current?.currency)}
          delta={
            stats.mobile > 0 ? `Mobile : ${fmtMoney(stats.mobile, current?.currency)}` : undefined
          }
          icon={Wallet}
          tone="warning"
        />
      </div>

      {/* Filtres */}
      <Card className="mt-4 shadow-soft">
        <CardContent className="p-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Référence, client, caissier…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Du</Label>
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Au</Label>
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Paiement</Label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="cash">Espèces</SelectItem>
                  <SelectItem value="mobile">Mobile Money</SelectItem>
                  <SelectItem value="card">Carte</SelectItem>
                  <SelectItem value="mixed">Mixte</SelectItem>
                  <SelectItem value="credit">Crédit</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <div className="flex gap-1.5">
              {["all", "completed", "voided"].map((st) => (
                <Button
                  key={st}
                  size="sm"
                  variant={status === st ? "default" : "outline"}
                  onClick={() => setStatus(st)}
                >
                  {st === "all" ? "Tous statuts" : (labelStatus[st] ?? st)}
                </Button>
              ))}
            </div>
            {(q || method !== "all" || status !== "all" || from || to) && (
              <Button size="sm" variant="ghost" onClick={resetFilters}>
                Réinitialiser
              </Button>
            )}
            <span className="ml-auto text-xs text-muted-foreground">
              {filtered.length} vente(s) affichée(s)
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Tableau */}
      <Card className="mt-4 shadow-soft">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={ShoppingCart}
              title="Aucune vente"
              description={
                sales.length > 0
                  ? "Aucune vente ne correspond aux filtres."
                  : "Les ventes réalisées à la caisse apparaîtront ici."
              }
            />
          ) : (
            <div className="overflow-x-auto rounded-lg border border-slate-300">
              <Table className="[&_th]:border-r [&_th]:border-r-slate-600 [&_td]:border-r [&_td]:border-r-slate-200 [&_th:last-child]:border-r-0 [&_td:last-child]:border-r-0 [&_td]:px-4 [&_td]:py-3">
                <TableHeader>
                  <TableRow className="bg-slate-800 hover:bg-slate-800">
                    <TableHead className="min-w-[110px] text-white font-bold">Référence</TableHead>
                    <TableHead className="min-w-[150px] text-white font-bold">Date</TableHead>
                    <TableHead className="min-w-[130px] text-white font-bold">Client</TableHead>
                    <TableHead className="hidden md:table-cell min-w-[120px] text-white font-bold">
                      Caissier
                    </TableHead>
                    <TableHead className="min-w-[110px] text-white font-bold">Paiement</TableHead>
                    <TableHead className="min-w-[100px] text-white font-bold">Statut</TableHead>
                    <TableHead className="text-right min-w-[110px] text-white font-bold">
                      Total
                    </TableHead>
                    <TableHead className="w-[120px] text-white font-bold">Documents</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((s) => (
                    <TableRow
                      key={s.id}
                      className="cursor-pointer hover:bg-slate-50"
                      onClick={() => openDetail(s)}
                    >
                      <TableCell className="font-mono text-xs font-medium">{s.reference}</TableCell>
                      <TableCell className="text-sm">{fmtDate(s.created_at)}</TableCell>
                      <TableCell className="text-sm">
                        {s.customers?.name ?? <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm">
                        {s.cashier_id
                          ? (cashiers[s.cashier_id] ?? "—")
                          : (s.employees?.name ?? "Propriétaire")}
                      </TableCell>
                      <TableCell className="text-sm">
                        {labelPay[s.payment_method] ?? s.payment_method}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            s.status === "completed"
                              ? "default"
                              : s.status === "voided"
                                ? "destructive"
                                : "secondary"
                          }
                          className={
                            s.status === "completed"
                              ? "bg-green-100 text-green-800 hover:bg-green-200"
                              : ""
                          }
                        >
                          {labelStatus[s.status] ?? s.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono font-semibold text-primary">
                        {fmtMoney(s.total, current?.currency)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            title="Reçu"
                            onClick={() => printDoc(s, "receipt")}
                          >
                            <Printer className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            title="Facture"
                            onClick={() => printDoc(s, "invoice")}
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          {!loading && hasMore && filtered.length > 0 && (
            <div className="flex justify-center border-t border-border p-3">
              <Button
                variant="outline"
                size="sm"
                disabled={loadingMore}
                onClick={() => load(false)}
              >
                {loadingMore ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ChevronDown className="mr-2 h-4 w-4" />
                )}
                Charger plus
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Détail vente */}
      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          {detail && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display">
                  Vente {detail.sale.reference ?? ""}
                </DialogTitle>
                <DialogDescription>
                  {fmtDate(detail.sale.created_at)} ·{" "}
                  {labelPay[detail.sale.payment_method] ?? detail.sale.payment_method} ·{" "}
                  {labelStatus[detail.sale.status] ?? detail.sale.status}
                </DialogDescription>
              </DialogHeader>
              {detailLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-4 w-4" />
                    {detail.sale.customers?.name ?? "Client comptoir"}
                    <span className="mx-1">·</span>
                    {detail.sale.cashier_id
                      ? (cashiers[detail.sale.cashier_id] ?? "Caissier")
                      : (detail.sale.employees?.name ?? "Propriétaire")}
                  </div>

                  <div className="divide-y divide-border rounded-xl border border-border">
                    {detail.items.map((i, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 text-sm">
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-medium">{i.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {fmtNumber(Number(i.quantity))} ×{" "}
                            {fmtMoney(Number(i.unit_price), current?.currency)}
                          </div>
                        </div>
                        <div className="font-mono text-sm font-semibold">
                          {fmtMoney(Number(i.total), current?.currency)}
                        </div>
                      </div>
                    ))}
                    {detail.items.length === 0 && (
                      <p className="p-4 text-center text-sm text-muted-foreground">
                        Aucun article détaillé.
                      </p>
                    )}
                  </div>

                  <div className="space-y-1 rounded-xl bg-secondary/40 p-3 text-sm">
                    <Row
                      label="Sous-total"
                      value={fmtMoney(Number(detail.sale.subtotal), current?.currency)}
                    />
                    {Number(detail.sale.discount) > 0 && (
                      <Row
                        label="Remise"
                        value={"- " + fmtMoney(Number(detail.sale.discount), current?.currency)}
                      />
                    )}
                    {Number(detail.sale.tax) > 0 && (
                      <Row
                        label="TVA"
                        value={fmtMoney(Number(detail.sale.tax), current?.currency)}
                      />
                    )}
                    {detail.sale.payments && detail.sale.payments.length > 0 && (
                      <div className="border-t border-border pt-1">
                        {detail.sale.payments.map((p, i) => (
                          <Row
                            key={i}
                            label={labelPay[p.method] ?? p.method}
                            value={fmtMoney(Number(p.amount), current?.currency)}
                          />
                        ))}
                      </div>
                    )}
                    {Number(detail.sale.change_due) > 0 && (
                      <Row
                        label="Monnaie rendue"
                        value={fmtMoney(Number(detail.sale.change_due), current?.currency)}
                      />
                    )}
                    <div className="flex items-center justify-between border-t border-border pt-2">
                      <span className="font-semibold">Total</span>
                      <span className="font-display text-lg font-bold text-primary">
                        {fmtMoney(Number(detail.sale.total), current?.currency)}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => printDoc(detail.sale, "receipt")}
                    >
                      <Printer className="mr-1.5 h-4 w-4" /> Reçu
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => printDoc(detail.sale, "invoice")}
                    >
                      <FileText className="mr-1.5 h-4 w-4" /> Facture
                    </Button>
                    {detail.sale.status === "completed" && (
                      <Button
                        variant="destructive"
                        size="sm"
                        className="ml-auto"
                        disabled={voiding}
                        onClick={() => cancelSale(detail.sale)}
                      >
                        {voiding ? (
                          <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                        ) : (
                          <Ban className="mr-1.5 h-4 w-4" />
                        )}
                        Annuler la vente
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
