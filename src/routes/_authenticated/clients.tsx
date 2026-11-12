import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useShops } from "@/lib/shop-store";
import { PageHeader, EmptyState, StatCard } from "@/components/page-parts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Users,
  Plus,
  Search,
  Trash2,
  Pencil,
  MessageCircle,
  Download,
  Loader2,
  Wallet,
  Receipt,
  HandCoins,
  Star,
  QrCode,
} from "lucide-react";
import { fmtMoney, fmtDate, fmtNumber } from "@/lib/format";
import { downloadCsv } from "@/lib/export-csv";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/clients")({
  head: () => ({ meta: [{ title: "Clients — BoutikBF" }] }),
  component: ClientsPage,
});

type C = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  birthdate: string | null;
  loyalty_points: number;
  credit_balance: number;
  created_at: string;
};

type CustomerStat = {
  purchases: number;
  spent: number;
  last_purchase: string | null;
};

function waLinkFor(phone: string | null | undefined, message: string): string {
  const digits = (phone ?? "").replace(/\D/g, "");
  const full = digits.length === 8 ? `226${digits}` : digits;
  return full
    ? `https://wa.me/${full}?text=${encodeURIComponent(message)}`
    : `https://wa.me/?text=${encodeURIComponent(message)}`;
}

function ClientsPage() {
  const { current } = useShops();
  const [items, setItems] = useState<C[]>([]);
  const [stats, setStats] = useState<Record<string, CustomerStat>>({});
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [onlyDebtors, setOnlyDebtors] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<C | null>(null);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    birthdate: "",
  });

  // fiche client
  const [detail, setDetail] = useState<C | null>(null);
  const [detailSales, setDetailSales] = useState<
    {
      id: string;
      reference: string | null;
      total: number;
      payment_method: string;
      created_at: string;
    }[]
  >([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [repay, setRepay] = useState("");
  const [repaying, setRepaying] = useState(false);

  const load = async () => {
    if (!current) return;
    setLoading(true);
    const [{ data }, { data: sales }] = await Promise.all([
      supabase
        .from("customers")
        .select("*")
        .eq("shop_id", current.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("sales")
        .select("customer_id,total,created_at")
        .eq("shop_id", current.id)
        .eq("status", "completed")
        .not("customer_id", "is", null),
    ]);
    setItems((data ?? []) as C[]);
    const agg: Record<string, CustomerStat> = {};
    (sales ?? []).forEach(
      (s: { customer_id: string | null; total: number; created_at: string }) => {
        if (!s.customer_id) return;
        const e = agg[s.customer_id] ?? { purchases: 0, spent: 0, last_purchase: null };
        e.purchases++;
        e.spent += Number(s.total);
        if (!e.last_purchase || s.created_at > e.last_purchase) e.last_purchase = s.created_at;
        agg[s.customer_id] = e;
      },
    );
    setStats(agg);
    setLoading(false);
  };
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id]);

  const openNew = () => {
    setEditing(null);
    setForm({ name: "", phone: "", email: "", address: "", birthdate: "" });
    setOpen(true);
  };
  const openEdit = (c: C) => {
    setEditing(c);
    setForm({
      name: c.name,
      phone: c.phone ?? "",
      email: c.email ?? "",
      address: c.address ?? "",
      birthdate: c.birthdate ?? "",
    });
    setOpen(true);
  };
  const save = async () => {
    if (!current || !form.name.trim()) return;
    const p = { ...form, shop_id: current.id };
    const { error } = editing
      ? await supabase.from("customers").update(p).eq("id", editing.id)
      : await supabase.from("customers").insert(p);
    if (error) return toast.error(error.message);
    toast.success("Enregistré");
    setOpen(false);
    load();
  };
  const remove = async (id: string) => {
    if (!confirm("Supprimer ce client ? Son historique de ventes sera conservé.")) return;
    await supabase.from("customers").delete().eq("id", id);
    load();
  };

  const openDetail = async (c: C) => {
    setDetail(c);
    setRepay("");
    setDetailLoading(true);
    const { data } = await supabase
      .from("sales")
      .select("id,reference,total,payment_method,created_at")
      .eq("customer_id", c.id)
      .order("created_at", { ascending: false })
      .limit(10);
    setDetailSales((data ?? []) as typeof detailSales);
    setDetailLoading(false);
  };

  const recordRepayment = async () => {
    if (!detail || !current) return;
    const amount = Number(repay);
    if (!amount || amount <= 0) return toast.error("Montant invalide");
    setRepaying(true);
    const newBal = Math.max(0, Number(detail.credit_balance) - amount);
    const { error } = await supabase
      .from("customers")
      .update({ credit_balance: newBal })
      .eq("id", detail.id);
    setRepaying(false);
    if (error) return toast.error(error.message);
    toast.success(
      newBal === 0
        ? `Créance de ${detail.name} entièrement réglée`
        : `Remboursement enregistré — reste ${fmtMoney(newBal, current.currency)}`,
    );
    setDetail({ ...detail, credit_balance: newBal });
    setRepay("");
    load();
  };

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    return items.filter((c) => {
      if (onlyDebtors && Number(c.credit_balance) <= 0) return false;
      if (!t) return true;
      return (
        c.name.toLowerCase().includes(t) ||
        (c.phone ?? "").includes(t) ||
        (c.email ?? "").toLowerCase().includes(t)
      );
    });
  }, [items, q, onlyDebtors]);

  const debtors = items.filter((c) => Number(c.credit_balance) > 0);
  const totalCredit = debtors.reduce((a, c) => a + Number(c.credit_balance), 0);

  const exportCsv = () => {
    if (filtered.length === 0) return toast.error("Aucun client à exporter");
    downloadCsv(
      `clients-${new Date().toISOString().slice(0, 10)}.csv`,
      filtered.map((c) => ({
        nom: c.name,
        telephone: c.phone ?? "",
        email: c.email ?? "",
        adresse: c.address ?? "",
        achats: stats[c.id]?.purchases ?? 0,
        total_depense: stats[c.id]?.spent ?? 0,
        dernier_achat: stats[c.id]?.last_purchase ? fmtDate(stats[c.id].last_purchase!) : "",
        points_fidelite: c.loyalty_points,
        credit_du: Number(c.credit_balance),
      })),
    );
    toast.success(`${filtered.length} clients exportés`);
  };

  const cur = current?.currency ?? "XOF";

  return (
    <div>
      <PageHeader
        title="Clients"
        description="Fidélité, historique d'achats et créances"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportCsv}>
              <Download className="mr-2 h-4 w-4" /> Exporter
            </Button>
            <Button onClick={openNew} className="bg-gradient-primary shadow-elegant">
              <Plus className="mr-2 h-4 w-4" />
              Nouveau client
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Clients" value={fmtNumber(items.length)} icon={Users} />
        <StatCard
          label="Créances totales"
          value={fmtMoney(totalCredit, cur)}
          delta={debtors.length ? `${debtors.length} client(s) débiteur(s)` : "tout est réglé"}
          icon={Wallet}
          tone={totalCredit > 0 ? "warning" : "success"}
        />
        <StatCard
          label="Clients avec achats"
          value={fmtNumber(Object.keys(stats).length)}
          icon={Receipt}
        />
      </div>

      <Card className="mt-4 shadow-soft">
        <CardContent className="p-0">
          <div className="flex flex-wrap items-center gap-3 border-b border-border p-4">
            <div className="relative min-w-[220px] flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Nom, téléphone, email…"
                className="pl-9"
              />
            </div>
            <Button
              size="sm"
              variant={onlyDebtors ? "default" : "outline"}
              onClick={() => setOnlyDebtors((v) => !v)}
            >
              Débiteurs uniquement ({debtors.length})
            </Button>
            <span className="ml-auto text-xs text-muted-foreground">
              {filtered.length} affiché(s)
            </span>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={Users}
              title="Aucun client"
              description="Ajoutez vos premiers clients pour suivre leurs achats."
              action={
                <Button onClick={openNew} className="bg-gradient-primary">
                  <Plus className="mr-2 h-4 w-4" />
                  Ajouter
                </Button>
              }
            />
          ) : (
            <div className="overflow-x-auto rounded-lg border border-slate-300">
              <Table className="[&_th]:border-r [&_th]:border-r-slate-600 [&_td]:border-r [&_td]:border-r-slate-200 [&_th:last-child]:border-r-0 [&_td:last-child]:border-r-0 [&_td]:px-4 [&_td]:py-3">
                <TableHeader>
                  <TableRow className="bg-slate-800 hover:bg-slate-800">
                    <TableHead className="min-w-[150px] text-white font-bold">Nom</TableHead>
                    <TableHead className="hidden sm:table-cell min-w-[120px] text-white font-bold">
                      Téléphone
                    </TableHead>
                    <TableHead className="hidden lg:table-cell min-w-[150px] text-white font-bold">
                      Email
                    </TableHead>
                    <TableHead className="text-right hidden sm:table-cell text-white font-bold">
                      Achats
                    </TableHead>
                    <TableHead className="text-right hidden md:table-cell text-white font-bold">
                      Total dépensé
                    </TableHead>
                    <TableHead className="text-right hidden md:table-cell text-white font-bold">
                      Fidélité
                    </TableHead>
                    <TableHead className="text-right min-w-[110px] text-white font-bold">
                      Doit
                    </TableHead>
                    <TableHead className="w-[120px] text-white font-bold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((c) => (
                    <TableRow
                      key={c.id}
                      className="cursor-pointer hover:bg-slate-50"
                      onClick={() => openDetail(c)}
                    >
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell className="hidden sm:table-cell text-sm">
                        {c.phone ?? "—"}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                        {c.email ?? "—"}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-right text-sm">
                        {fmtNumber(stats[c.id]?.purchases ?? 0)}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-right font-mono text-sm">
                        {fmtMoney(stats[c.id]?.spent ?? 0, cur)}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-right text-sm">
                        {c.loyalty_points > 0 ? (
                          <span className="inline-flex items-center gap-1 text-warning">
                            <Star className="h-3.5 w-3.5" /> {c.loyalty_points}
                          </span>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {Number(c.credit_balance) > 0 ? (
                          <Badge variant="destructive" className="font-mono">
                            {fmtMoney(c.credit_balance, cur)}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">à jour</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div
                          className="flex justify-end gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            title="Carte fidélité QR"
                            onClick={() =>
                              window.open(
                                `/f/${current?.id}/${c.id}`,
                                "_blank",
                                "width=420,height=760",
                              )
                            }
                          >
                            <QrCode className="h-4 w-4 text-primary" />
                          </Button>
                          {Number(c.credit_balance) > 0 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              title="Relancer par WhatsApp"
                              onClick={() =>
                                window.open(
                                  waLinkFor(
                                    c.phone,
                                    `Bonjour ${c.name}, petit rappel de ${current?.name ?? "BoutikBF"} : il vous reste ${fmtMoney(c.credit_balance, cur)} à régler. Merci`,
                                  ),
                                  "_blank",
                                )
                              }
                            >
                              <MessageCircle className="h-4 w-4 text-success" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openEdit(c)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => remove(c.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Formulaire */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">
              {editing ? "Modifier" : "Nouveau"} client
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label>Nom *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Téléphone (WhatsApp)</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="70 12 34 56"
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Adresse</Label>
              <Input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Date de naissance (optionnelle)</Label>
              <Input
                type="date"
                value={form.birthdate}
                onChange={(e) => setForm({ ...form, birthdate: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                L'assistant IA te rappellera les anniversaires proches pour envoyer un message.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button onClick={save} className="bg-gradient-primary shadow-elegant">
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Fiche client */}
      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          {detail && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display">{detail.name}</DialogTitle>
                <DialogDescription>
                  {[detail.phone, detail.email, detail.address].filter(Boolean).join(" · ") ||
                    "Coordonnées non renseignées"}
                  {detail.birthdate ? ` · ${fmtDate(detail.birthdate)}` : ""}
                  {" · client depuis le "}
                  {fmtDate(detail.created_at)}
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-border p-3 text-center">
                  <div className="text-xs text-muted-foreground">Achats</div>
                  <div className="font-display text-xl font-bold">
                    {fmtNumber(stats[detail.id]?.purchases ?? 0)}
                  </div>
                </div>
                <div className="rounded-xl border border-border p-3 text-center">
                  <div className="text-xs text-muted-foreground">Total dépensé</div>
                  <div className="font-display text-xl font-bold text-primary">
                    {fmtMoney(stats[detail.id]?.spent ?? 0, cur)}
                  </div>
                </div>
                <div className="rounded-xl border border-border p-3 text-center">
                  <div className="text-xs text-muted-foreground">Points fidélité</div>
                  <div className="font-display text-xl font-bold text-warning">
                    {fmtNumber(detail.loyalty_points)}
                  </div>
                </div>
              </div>

              {Number(detail.credit_balance) > 0 && (
                <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-destructive">
                      Doit : {fmtMoney(detail.credit_balance, cur)}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        window.open(
                          waLinkFor(
                            detail.phone,
                            `Bonjour ${detail.name}, rappel de ${current?.name ?? "BoutikBF"} : solde à régler ${fmtMoney(detail.credit_balance, cur)}. Merci`,
                          ),
                          "_blank",
                        )
                      }
                    >
                      <MessageCircle className="mr-1.5 h-4 w-4 text-success" /> Relancer
                    </Button>
                  </div>
                  <div className="mt-2 flex gap-2">
                    <Input
                      type="number"
                      min="0"
                      placeholder="Remboursement reçu…"
                      value={repay}
                      onChange={(e) => setRepay(e.target.value)}
                      className="h-9"
                    />
                    <Button
                      size="sm"
                      variant="secondary"
                      className="shrink-0"
                      disabled={
                        !Number(repay) ||
                        Number(repay) <= 0 ||
                        repaying ||
                        Number(repay) > Number(detail.credit_balance)
                      }
                      onClick={recordRepayment}
                    >
                      <HandCoins className="mr-1.5 h-4 w-4" /> Encaisser
                    </Button>
                  </div>
                  {Number(repay) > Number(detail.credit_balance) && (
                    <p className="mt-1 text-xs text-destructive">
                      Max : {fmtMoney(detail.credit_balance, cur)}
                    </p>
                  )}
                </div>
              )}

              <div>
                <h4 className="mb-2 text-sm font-semibold">10 derniers achats</h4>
                {detailLoading ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : detailSales.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    Aucun achat relié à ce client (les ventes sans client au comptoir ne sont pas
                    comptées ici).
                  </p>
                ) : (
                  <div className="divide-y divide-border rounded-xl border border-border">
                    {detailSales.map((s) => (
                      <div key={s.id} className="flex items-center justify-between p-2.5 text-sm">
                        <div>
                          <div className="font-mono text-xs">{s.reference ?? s.id.slice(0, 8)}</div>
                          <div className="text-xs text-muted-foreground">
                            {fmtDate(s.created_at)}
                          </div>
                        </div>
                        <div className="font-mono font-semibold">{fmtMoney(s.total, cur)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() =>
                    window.open(`/f/${current?.id}/${detail.id}`, "_blank", "width=420,height=760")
                  }
                >
                  <QrCode className="mr-1.5 h-4 w-4" /> Carte fidélité
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    const c = detail;
                    setDetail(null);
                    openEdit(c);
                  }}
                >
                  <Pencil className="mr-1.5 h-4 w-4" /> Modifier
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
