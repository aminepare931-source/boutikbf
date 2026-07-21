import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useShops } from "@/lib/shop-store";
import { PageHeader, EmptyState } from "@/components/page-parts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
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
import { Users, Plus, Search, Trash2, Pencil } from "lucide-react";
import { fmtMoney } from "@/lib/format";
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
  loyalty_points: number;
  credit_balance: number;
};

function ClientsPage() {
  const { current } = useShops();
  const [items, setItems] = useState<C[]>([]);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<C | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", email: "", address: "" });

  const load = async () => {
    if (!current) return;
    const { data } = await supabase
      .from("customers")
      .select("*")
      .eq("shop_id", current.id)
      .order("created_at", { ascending: false });
    setItems((data ?? []) as C[]);
  };
  useEffect(() => {
    load();
  }, [current?.id]);

  const openNew = () => {
    setEditing(null);
    setForm({ name: "", phone: "", email: "", address: "" });
    setOpen(true);
  };
  const openEdit = (c: C) => {
    setEditing(c);
    setForm({ name: c.name, phone: c.phone ?? "", email: c.email ?? "", address: "" });
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
    if (!confirm("Supprimer ?")) return;
    await supabase.from("customers").delete().eq("id", id);
    load();
  };

  const filtered = items.filter((c) =>
    (c.name + (c.phone ?? "") + (c.email ?? "")).toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div>
      <PageHeader
        title="Clients"
        description="Base clients, fidélité et crédit"
        actions={
          <Button onClick={openNew} className="bg-gradient-primary shadow-elegant">
            <Plus className="mr-2 h-4 w-4" />
            Nouveau client
          </Button>
        }
      />
      <Card className="shadow-soft">
        <CardContent className="p-0">
          <div className="border-b border-border p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Rechercher…"
                className="pl-9"
              />
            </div>
          </div>
          {filtered.length === 0 ? (
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
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[150px]">Nom</TableHead>
                    <TableHead className="hidden sm:table-cell">Téléphone</TableHead>
                    <TableHead className="hidden md:table-cell">Email</TableHead>
                    <TableHead className="text-right hidden sm:table-cell">Points</TableHead>
                    <TableHead className="text-right">Crédit</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell className="hidden sm:table-cell">{c.phone ?? "—"}</TableCell>
                      <TableCell className="text-muted-foreground hidden md:table-cell">
                        {c.email ?? "—"}
                      </TableCell>
                      <TableCell className="text-right hidden sm:table-cell">
                        {c.loyalty_points}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {fmtMoney(c.credit_balance, current?.currency)}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
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
              <Label>Téléphone</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
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
    </div>
  );
}
