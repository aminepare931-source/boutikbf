import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useShops } from "@/lib/shop-store";
import { PageHeader, EmptyState, StatCard } from "@/components/page-parts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Truck,
  Plus,
  Trash2,
  Pencil,
  ArrowRight,
  ArrowLeft,
  Check,
  Phone,
  Search,
  Download,
  MessageCircle,
  Wallet,
} from "lucide-react";
import { useMemo } from "react";
import { fmtMoney, fmtNumber } from "@/lib/format";
import { downloadCsv } from "@/lib/export-csv";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/suppliers")({
  head: () => ({ meta: [{ title: "Mes fournisseurs — BoutikBF" }] }),
  component: SuppliersPage,
});

type S = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address?: string | null;
  balance: number;
};

const empty = { name: "", phone: "", email: "", address: "" };

function SuppliersPage() {
  const { current } = useShops();
  const [items, setItems] = useState<S[]>([]);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [editing, setEditing] = useState<S | null>(null);
  const [form, setForm] = useState(empty);

  const load = async () => {
    if (!current) return;
    const { data } = await supabase
      .from("suppliers")
      .select("*")
      .eq("shop_id", current.id)
      .order("created_at", { ascending: false });
    setItems((data ?? []) as S[]);
  };
  useEffect(() => {
    load();
  }, [current?.id]);

  const openNew = () => {
    setEditing(null);
    setForm(empty);
    setStep(1);
    setOpen(true);
  };
  const openEdit = (s: S) => {
    setEditing(s);
    setForm({ name: s.name, phone: s.phone ?? "", email: s.email ?? "", address: s.address ?? "" });
    setStep(1);
    setOpen(true);
  };

  const save = async () => {
    if (!current || !form.name.trim()) return;
    const p = { ...form, shop_id: current.id };
    const { error } = editing
      ? await supabase.from("suppliers").update(p).eq("id", editing.id)
      : await supabase.from("suppliers").insert(p);
    if (error) return toast.error(error.message);
    toast.success(editing ? "Fournisseur modifié" : "Fournisseur ajouté ✅");
    setOpen(false);
    load();
  };

  const totalDette = items.reduce((a, s) => a + Number(s.balance), 0);
  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return items;
    return items.filter(
      (s) =>
        s.name.toLowerCase().includes(t) ||
        (s.phone ?? "").includes(t) ||
        (s.email ?? "").toLowerCase().includes(t),
    );
  }, [items, q]);

  const exportCsv = () => {
    if (filtered.length === 0) return toast.error("Aucun fournisseur à exporter");
    downloadCsv(
      `fournisseurs-${new Date().toISOString().slice(0, 10)}.csv`,
      filtered.map((s) => ({
        nom: s.name,
        telephone: s.phone ?? "",
        email: s.email ?? "",
        adresse: s.address ?? "",
        dette: Number(s.balance),
      })),
    );
    toast.success(`${filtered.length} fournisseurs exportés`);
  };

  return (
    <div>
      <PageHeader
        title="Mes fournisseurs"
        description="Les personnes ou boutiques chez qui vous achetez votre marchandise."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={exportCsv}>
              <Download className="mr-2 h-4 w-4" /> Exporter
            </Button>
            <Button className="bg-gradient-primary shadow-elegant" onClick={openNew}>
              <Plus className="mr-2 h-4 w-4" />
              Ajouter un fournisseur
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Fournisseurs" value={fmtNumber(items.length)} icon={Truck} />
        <StatCard
          label="Ce que je dois"
          value={fmtMoney(totalDette, current?.currency)}
          icon={Wallet}
          tone={totalDette > 0 ? "warning" : "success"}
          delta={totalDette === 0 ? "aucune dette 🎉" : undefined}
        />
        <StatCard
          label="Fournisseurs crédités"
          value={fmtNumber(items.filter((s) => Number(s.balance) > 0).length)}
          icon={Wallet}
        />
      </div>

      {items.length > 0 && totalDette > 0 && (
        <div className="mb-4 rounded-lg border border-warning/30 bg-warning/5 p-3 text-sm">
          💰 Vous devez au total <b>{fmtMoney(totalDette, current?.currency)}</b> à vos
          fournisseurs.
        </div>
      )}

      <Card className="shadow-soft mt-4">
        <CardContent className="p-0">
          <div className="border-b border-border p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Rechercher un fournisseur (nom, téléphone, email)…"
                className="pl-9"
              />
            </div>
          </div>
          {items.length === 0 ? (
            <EmptyState
              icon={Truck}
              title="Aucun fournisseur pour l'instant"
              description="Ajoutez les personnes chez qui vous achetez vos produits pour bien gérer vos achats."
              action={
                <Button className="bg-gradient-primary" onClick={openNew}>
                  <Plus className="mr-2 h-4 w-4" />
                  Ajouter mon premier fournisseur
                </Button>
              }
            />
          ) : (
            <div className="overflow-x-auto rounded-lg border border-slate-300">
              <Table className="[&_th]:border-r [&_th]:border-r-slate-600 [&_td]:border-r [&_td]:border-r-slate-200 [&_th:last-child]:border-r-0 [&_td:last-child]:border-r-0 [&_td]:px-4 [&_td]:py-3">
                <TableHeader>
                  <TableRow className="bg-slate-800 hover:bg-slate-800">
                    <TableHead className="min-w-[150px] text-white font-bold">
                      Fournisseur
                    </TableHead>
                    <TableHead className="hidden sm:table-cell text-white font-bold">
                      Téléphone
                    </TableHead>
                    <TableHead className="text-right hidden sm:table-cell text-white font-bold">
                      Ce que je lui dois
                    </TableHead>
                    <TableHead className="w-[110px] text-white font-bold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell>
                        <div className="font-medium">{s.name}</div>
                        {s.email && <div className="text-xs text-muted-foreground">{s.email}</div>}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {s.phone ? (
                          <a
                            href={`tel:${s.phone}`}
                            className="inline-flex items-center gap-1.5 text-primary hover:underline"
                          >
                            <Phone className="h-3.5 w-3.5" />
                            {s.phone}
                          </a>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell
                        className={`text-right font-mono hidden sm:table-cell ${Number(s.balance) > 0 ? "text-warning font-semibold" : "text-muted-foreground"}`}
                      >
                        {Number(s.balance) > 0 ? fmtMoney(s.balance, current?.currency) : "Rien"}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          {Number(s.balance) > 0 && s.phone && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              title="Contacter ce fournisseur"
                              onClick={() => {
                                const digits = (s.phone ?? "").replace(/\D/g, "");
                                const full = digits.length === 8 ? `226${digits}` : digits;
                                window.open(
                                  full
                                    ? `https://wa.me/${full}?text=${encodeURIComponent(`Bonjour ${s.name}, je souhaite faire un réapprovisionnement — ${current?.name ?? ""}`)}`
                                    : `https://wa.me/?text=${encodeURIComponent(`Bonjour ${s.name}…`)}`,
                                  "_blank",
                                );
                              }}
                            >
                              <MessageCircle className="h-4 w-4 text-success" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openEdit(s)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={async () => {
                              if (confirm(`Supprimer ${s.name} ?`)) {
                                await supabase.from("suppliers").delete().eq("id", s.id);
                                load();
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="py-10 text-center text-sm text-muted-foreground"
                      >
                        Aucun fournisseur ne correspond à « {q} ».
                      </TableCell>
                    </TableRow>
                  )}
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
              {editing ? "Modifier le fournisseur" : `Nouveau fournisseur — étape ${step} sur 3`}
            </DialogTitle>
          </DialogHeader>

          {!editing && (
            <div className="mb-4 flex gap-1.5">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`h-1.5 flex-1 rounded-full ${s <= step ? "bg-gradient-primary" : "bg-muted"}`}
                />
              ))}
            </div>
          )}

          {(editing || step === 1) && (
            <div className="space-y-4">
              {!editing && (
                <p className="text-sm text-muted-foreground">Comment s'appelle ce fournisseur ?</p>
              )}
              <div className="space-y-2">
                <Label>Nom du fournisseur *</Label>
                <Input
                  placeholder="Ex : Boutique Sankara Gros"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  autoFocus
                />
              </div>
              {editing && (
                <>
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
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Adresse</Label>
                    <Textarea
                      rows={2}
                      value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                    />
                  </div>
                </>
              )}
              {!editing && (
                <div className="flex justify-end pt-2">
                  <Button disabled={!form.name.trim()} onClick={() => setStep(2)}>
                    Continuer <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          )}

          {!editing && step === 2 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Comment le contacter ? (facultatif mais très utile)
              </p>
              <div className="space-y-2">
                <Label>Téléphone</Label>
                <Input
                  placeholder="Ex : +226 70 00 00 00"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  placeholder="fournisseur@exemple.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div className="flex justify-between pt-2">
                <Button variant="ghost" onClick={() => setStep(1)}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Retour
                </Button>
                <Button onClick={() => setStep(3)}>
                  Continuer <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {!editing && step === 3 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Où se trouve-t-il ? (pour retrouver facilement)
              </p>
              <div className="space-y-2">
                <Label>Adresse ou quartier</Label>
                <Textarea
                  rows={2}
                  placeholder="Ex : Marché de Rood-Woko, secteur 4, Ouagadougou"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                />
              </div>
              <div className="flex justify-between pt-2">
                <Button variant="ghost" onClick={() => setStep(2)}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Retour
                </Button>
                <Button onClick={save} className="bg-gradient-primary">
                  <Check className="mr-2 h-4 w-4" />
                  Enregistrer
                </Button>
              </div>
            </div>
          )}

          {editing && (
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Annuler
              </Button>
              <Button onClick={save} className="bg-gradient-primary">
                Enregistrer
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
