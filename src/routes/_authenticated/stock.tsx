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
import { Warehouse, Package, AlertTriangle, ArrowUpDown, Plus } from "lucide-react";
import { toast } from "sonner";

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

function StockPage() {
  const { current } = useShops();
  const [items, setItems] = useState<P[]>([]);
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string>("");
  const [type, setType] = useState<"in" | "out" | "adjust">("in");
  const [qty, setQty] = useState(0);
  const [reason, setReason] = useState("");

  const load = async () => {
    if (!current) return;
    const { data } = await supabase
      .from("products")
      .select("id,name,stock,stock_min,unit,sku")
      .eq("shop_id", current.id)
      .order("stock", { ascending: true });
    setItems((data ?? []) as P[]);
  };
  useEffect(() => {
    load();
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

  const lowStock = items.filter((p) => p.stock < (p.stock_min ?? 5));
  const outStock = items.filter((p) => p.stock <= 0);

  return (
    <div>
      <PageHeader
        title="Gestion du stock"
        description="Suivi, entrées, sorties et alertes"
        actions={
          <Button onClick={() => setOpen(true)} className="bg-gradient-primary shadow-elegant">
            <ArrowUpDown className="mr-2 h-4 w-4" />
            Mouvement
          </Button>
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
    </div>
  );
}
