import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useShops } from "@/lib/shop-store";
import { PageHeader, StatCard } from "@/components/page-parts";
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
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Warehouse,
  Package,
  AlertTriangle,
  ArrowUpDown,
  ArrowRightLeft,
  Truck,
  ClipboardList,
  Plus,
  X,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { fmtDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/stock")({
  head: () => ({ meta: [{ title: "Stock — BoutikBF" }] }),
  component: StockPage,
});

type P = {
  id: string;
  name: string;
  stock: number;
  stock_min: number | null;
  unit: string;
  sku: string | null;
};

type StockCount = {
  id: string;
  status: string;
  lines: { product_id: string; name: string; counted: number; stock_before: number }[];
  note: string | null;
  created_at: string;
};

function StockPage() {
  const { current, shops } = useShops();
  const [items, setItems] = useState<P[]>([]);
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string>("");
  const [type, setType] = useState<"in" | "out" | "adjust">("in");
  const [qty, setQty] = useState(0);
  const [reason, setReason] = useState("");

  // nouveaux chantiers
  const [transferOpen, setTransferOpen] = useState(false);
  const [receiveOpen, setReceiveOpen] = useState(false);
  const [countOpen, setCountOpen] = useState(false);
  const [counts, setCounts] = useState<StockCount[]>([]);

  const load = async () => {
    if (!current) return;
    const { data } = await supabase
      .from("products")
      .select("id,name,stock,stock_min,unit,sku")
      .eq("shop_id", current.id)
      .order("stock", { ascending: true });
    setItems((data ?? []) as P[]);
  };
  const loadCounts = async () => {
    if (!current) return;
    const { data } = await supabase
      .from("stock_counts")
      .select("*")
      .eq("shop_id", current.id)
      .order("created_at", { ascending: false })
      .limit(10);
    setCounts((data ?? []) as unknown as StockCount[]);
  };
  useEffect(() => {
    load();
    loadCounts();
  }, [current?.id]);

  const submit = async () => {
    if (!current || !selectedId || qty <= 0) return;
    const p = items.find((i) => i.id === selectedId);
    if (!p) return;
    const newStock = type === "in" ? p.stock + qty : type === "out" ? p.stock - qty : qty;
    const { data: userData } = await supabase.auth.getUser();
    await supabase.from("products").update({ stock: newStock }).eq("id", selectedId);
    await supabase.from("stock_movements").insert({
      shop_id: current.id,
      product_id: selectedId,
      type,
      quantity: type === "adjust" ? qty - p.stock : qty,
      reason,
      created_by: userData.user?.id,
    });
    toast.success("Mouvement enregistré");
    setOpen(false);
    setQty(0);
    setReason("");
    load();
  };

  const applyCount = async (id: string) => {
    const { error } = await (
      supabase as never as {
        rpc: (
          fn: string,
          args: Record<string, unknown>,
        ) => Promise<{ error: { message: string } | null }>;
      }
    ).rpc("apply_stock_count", { p_count_id: id });
    if (error) return toast.error(error.message);
    toast.success("Écarts d'inventaire appliqués");
    load();
    loadCounts();
  };

  const lowStock = items.filter((p) => p.stock < (p.stock_min ?? 5));
  const outStock = items.filter((p) => p.stock <= 0);
  const otherShops = shops.filter((s) => s.id !== current?.id);

  return (
    <div>
      <PageHeader
        title="Gestion du stock"
        description="Suivi, entrées, sorties, transferts, réceptions et inventaires"
        actions={
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setOpen(true)} className="bg-gradient-primary shadow-elegant">
              <ArrowUpDown className="mr-2 h-4 w-4" />
              Mouvement
            </Button>
            <Button
              variant="outline"
              onClick={() => setTransferOpen(true)}
              disabled={otherShops.length === 0}
              title={otherShops.length === 0 ? "Ajoutez une deuxième boutique pour transférer" : ""}
            >
              <ArrowRightLeft className="mr-2 h-4 w-4" />
              Transfert
            </Button>
            <Button variant="outline" onClick={() => setReceiveOpen(true)}>
              <Truck className="mr-2 h-4 w-4" />
              Réception
            </Button>
            <Button variant="outline" onClick={() => setCountOpen(true)}>
              <ClipboardList className="mr-2 h-4 w-4" />
              Inventaire
            </Button>
          </div>
        }
      />
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Produits en stock" value={String(items.length)} icon={Package} />
        <StatCard
          label="Stock faible"
          value={String(lowStock.length)}
          icon={AlertTriangle}
          tone="warning"
        />
        <StatCard
          label="Rupture"
          value={String(outStock.length)}
          icon={AlertTriangle}
          tone="destructive"
        />
      </div>

      <Card className="mt-6 shadow-soft">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[150px]">Produit</TableHead>
                  <TableHead className="hidden sm:table-cell">SKU</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead className="text-right hidden sm:table-cell">Seuil min</TableHead>
                  <TableHead className="hidden md:table-cell">Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="text-muted-foreground hidden sm:table-cell">
                      {p.sku ?? "—"}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {p.stock} {p.unit}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground hidden sm:table-cell">
                      {p.stock_min ?? 0}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {p.stock <= 0 ? (
                        <Badge variant="destructive">Rupture</Badge>
                      ) : p.stock < (p.stock_min ?? 5) ? (
                        <Badge className="bg-warning text-warning-foreground">Faible</Badge>
                      ) : (
                        <Badge variant="secondary">OK</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {items.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="py-16 text-center text-sm text-muted-foreground"
                    >
                      Aucun produit en stock.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Inventaires en cours / passés */}
      {counts.length > 0 && (
        <Card className="mt-6">
          <CardContent className="p-4">
            <h3 className="mb-3 font-display font-semibold">Inventaires</h3>
            <div className="space-y-2">
              {counts.map((c) => {
                const gaps = c.lines.filter((l) => l.counted !== l.stock_before).length;
                return (
                  <div
                    key={c.id}
                    className="flex flex-wrap items-center gap-2 rounded-xl border border-border p-3 text-sm"
                  >
                    <span className="font-medium">
                      {fmtDate(c.created_at)}
                      {c.note ? ` · ${c.note}` : ""}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {c.lines.length} ligne(s) · {gaps} écart(s)
                    </span>
                    {c.status === "draft" ? (
                      <Button size="sm" variant="outline" onClick={() => applyCount(c.id)}>
                        <Check className="mr-1 h-4 w-4" /> Appliquer les écarts
                      </Button>
                    ) : (
                      <Badge variant="secondary">Appliqué</Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mouvement simple */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Nouveau mouvement de stock</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label>Produit</Label>
              <Select value={selectedId} onValueChange={setSelectedId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir…" />
                </SelectTrigger>
                <SelectContent>
                  {items.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} — {p.stock} {p.unit}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={(v: "in" | "out" | "adjust") => setType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in">Entrée</SelectItem>
                  <SelectItem value="out">Sortie</SelectItem>
                  <SelectItem value="adjust">Ajustement (nouvelle valeur)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Quantité</Label>
              <Input type="number" value={qty} onChange={(e) => setQty(+e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Motif</Label>
              <Input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ex : réception fournisseur…"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button onClick={submit} className="bg-gradient-primary shadow-elegant">
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <TransferDialog
        open={transferOpen}
        onOpenChange={setTransferOpen}
        items={items}
        otherShops={otherShops}
        onDone={load}
      />
      <ReceiveDialog
        open={receiveOpen}
        onOpenChange={setReceiveOpen}
        items={items}
        shopId={current?.id}
        onDone={load}
      />
      <CountDialog
        open={countOpen}
        onOpenChange={setCountOpen}
        items={items}
        shopId={current?.id}
        onDone={() => {
          load();
          loadCounts();
        }}
      />
    </div>
  );
}

/* ---------- Transfert entre mes boutiques ---------- */

function TransferDialog({
  open,
  onOpenChange,
  items,
  otherShops,
  onDone,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  items: P[];
  otherShops: { id: string; name: string }[];
  onDone: () => void;
}) {
  const { current } = useShops();
  const [productId, setProductId] = useState("");
  const [toShop, setToShop] = useState("");
  const [qty, setQty] = useState(0);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!current || !productId || !toShop || qty <= 0) return;
    setBusy(true);
    const { error } = await (
      supabase as never as {
        rpc: (
          fn: string,
          args: Record<string, unknown>,
        ) => Promise<{ error: { message: string } | null }>;
      }
    ).rpc("transfer_stock", {
      p_from_shop: current.id,
      p_to_shop: toShop,
      p_product_id: productId,
      p_qty: qty,
      p_note: note || null,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Transfert effectué");
    onOpenChange(false);
    setProductId("");
    setQty(0);
    setNote("");
    onDone();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display">Transférer vers une autre boutique</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="space-y-2">
            <Label>Produit</Label>
            <Select value={productId} onValueChange={setProductId}>
              <SelectTrigger>
                <SelectValue placeholder="Choisir…" />
              </SelectTrigger>
              <SelectContent>
                {items
                  .filter((p) => p.stock > 0)
                  .map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} — {p.stock} {p.unit}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Vers la boutique</Label>
            <Select value={toShop} onValueChange={setToShop}>
              <SelectTrigger>
                <SelectValue placeholder="Choisir…" />
              </SelectTrigger>
              <SelectContent>
                {otherShops.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Le produit correspondant est retrouvé automatiquement (code-barres, référence ou nom)
              ; sinon il est créé dans la boutique de destination.
            </p>
          </div>
          <div className="space-y-2">
            <Label>Quantité</Label>
            <Input type="number" min="0" value={qty} onChange={(e) => setQty(+e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Note (optionnelle)</Label>
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ex : réappro N'Ba"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            onClick={submit}
            disabled={!productId || !toShop || qty <= 0 || busy}
            className="bg-gradient-primary shadow-elegant"
          >
            <ArrowRightLeft className="mr-2 h-4 w-4" /> Transférer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------- Réception fournisseur ---------- */

type ReceiveLine = { product_id: string; quantity: number; unit_cost: string };

function ReceiveDialog({
  open,
  onOpenChange,
  items,
  shopId,
  onDone,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  items: P[];
  shopId?: string;
  onDone: () => void;
}) {
  const [suppliers, setSuppliers] = useState<{ id: string; name: string }[]>([]);
  const [supplierId, setSupplierId] = useState("");
  const [lines, setLines] = useState<ReceiveLine[]>([
    { product_id: "", quantity: 0, unit_cost: "" },
  ]);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open || !shopId) return;
    supabase
      .from("suppliers")
      .select("id,name")
      .eq("shop_id", shopId)
      .order("name")
      .then(({ data }) => setSuppliers((data ?? []) as { id: string; name: string }[]));
  }, [open, shopId]);

  const setLine = (idx: number, patch: Partial<ReceiveLine>) =>
    setLines((ls) => ls.map((l, i) => (i === idx ? { ...l, ...patch } : l)));

  const validLines = lines.filter((l) => l.product_id && l.quantity > 0);
  const total = validLines.reduce((a, l) => a + l.quantity * (Number(l.unit_cost) || 0), 0);

  const submit = async () => {
    if (!shopId || validLines.length === 0) return;
    setBusy(true);
    const { error } = await (
      supabase as never as {
        rpc: (
          fn: string,
          args: Record<string, unknown>,
        ) => Promise<{ error: { message: string } | null }>;
      }
    ).rpc("receive_purchase", {
      p_shop_id: shopId,
      p_supplier_id: supplierId || null,
      p_lines: validLines.map((l) => ({
        product_id: l.product_id,
        quantity: l.quantity,
        unit_cost: l.unit_cost ? Number(l.unit_cost) : null,
      })),
      p_note: note || null,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(`Réception enregistrée · stock + coût moyen mis à jour`);
    onOpenChange(false);
    setLines([{ product_id: "", quantity: 0, unit_cost: "" }]);
    setNote("");
    onDone();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display">Réception marchandise fournisseur</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Fournisseur</Label>
              <Select value={supplierId} onValueChange={setSupplierId}>
                <SelectTrigger>
                  <SelectValue placeholder={suppliers.length ? "Choisir…" : "Aucun fournisseur"} />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Note (optionnelle)</Label>
              <Input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="BL n° 4487…"
              />
            </div>
          </div>

          <div className="space-y-2">
            {lines.map((l, idx) => (
              <div key={idx} className="flex flex-wrap items-center gap-2">
                <div className="min-w-[180px] flex-1">
                  <Select
                    value={l.product_id}
                    onValueChange={(v) => setLine(idx, { product_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Produit…" />
                    </SelectTrigger>
                    <SelectContent>
                      {items.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Input
                  type="number"
                  min="0"
                  className="w-24"
                  placeholder="Qté"
                  value={l.quantity || ""}
                  onChange={(e) => setLine(idx, { quantity: +e.target.value })}
                />
                <Input
                  type="number"
                  min="0"
                  className="w-32"
                  placeholder="Prix achat"
                  value={l.unit_cost}
                  onChange={(e) => setLine(idx, { unit_cost: e.target.value })}
                />
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() =>
                    setLines((ls) => (ls.length > 1 ? ls.filter((_, i) => i !== idx) : ls))
                  }
                >
                  <X className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                setLines((ls) => [...ls, { product_id: "", quantity: 0, unit_cost: "" }])
              }
            >
              <Plus className="mr-1 h-4 w-4" /> Ajouter une ligne
            </Button>
          </div>

          {total > 0 && (
            <p className="text-sm text-muted-foreground">
              Total achat : <b className="text-foreground">{total.toLocaleString("fr-FR")} F</b> —
              le prix d'achat du produit est recalculé en coût moyen pondéré.
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            onClick={submit}
            disabled={validLines.length === 0 || busy}
            className="bg-gradient-primary shadow-elegant"
          >
            <Truck className="mr-2 h-4 w-4" /> Enregistrer la réception
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------- Inventaire physique ---------- */

function CountDialog({
  open,
  onOpenChange,
  items,
  shopId,
  onDone,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  items: P[];
  shopId?: string;
  onDone: () => void;
}) {
  const [q, setQ] = useState("");
  const [counted, setCounted] = useState<Record<string, string>>({});
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setCounted({});
      setNote("");
      setQ("");
    }
  }, [open]);

  const shown = items.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()));
  const gaps = Object.entries(counted).filter(([id, v]) => {
    const p = items.find((x) => x.id === id);
    return p && Number(v) !== p.stock;
  });

  const save = async () => {
    if (!shopId || gaps.length === 0) return;
    setBusy(true);
    const lines = gaps.map(([id, v]) => {
      const p = items.find((x) => x.id === id)!;
      return { product_id: id, name: p.name, counted: Number(v), stock_before: p.stock };
    });
    const { error } = await supabase
      .from("stock_counts")
      .insert({ shop_id: shopId, lines, note: note || null });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Inventaire enregistré en brouillon — appliquez-le quand prêt");
    onOpenChange(false);
    onDone();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">Inventaire physique</DialogTitle>
        </DialogHeader>
        <p className="text-xs text-muted-foreground">
          Comptez vos articles et saisissez la quantité réelle. L'écart sera appliqué au stock avec
          un mouvement tracé (rien n'est modifié avant l'application).
        </p>
        <div className="flex flex-wrap gap-2">
          <Input
            className="min-w-[200px] flex-1"
            placeholder="Filtrer un produit…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <Input
            className="min-w-[180px] flex-1"
            placeholder="Note (ex : inventaire mensuel)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
        <div className="max-h-[45vh] space-y-1.5 overflow-y-auto rounded-xl border border-border p-3">
          {shown.map((p) => {
            const val = counted[p.id];
            const gap = val !== undefined && Number(val) !== p.stock;
            return (
              <div key={p.id} className="flex items-center gap-2 text-sm">
                <span className="min-w-0 flex-1 truncate">{p.name}</span>
                <span className="w-20 text-right text-xs text-muted-foreground">
                  système : {p.stock}
                </span>
                <Input
                  type="number"
                  min="0"
                  className="w-24"
                  placeholder="Compté"
                  value={val ?? ""}
                  onChange={(e) => setCounted((c) => ({ ...c, [p.id]: e.target.value }))}
                />
                {gap && <Badge className="bg-warning text-warning-foreground">écart</Badge>}
              </div>
            );
          })}
          {shown.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">Aucun produit.</p>
          )}
        </div>
        <DialogFooter className="items-center">
          <span className="mr-auto text-xs text-muted-foreground">
            {gaps.length} écart(s) détecté(s)
          </span>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            onClick={save}
            disabled={gaps.length === 0 || busy}
            className="bg-gradient-primary"
          >
            <ClipboardList className="mr-2 h-4 w-4" /> Enregistrer l'inventaire
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
