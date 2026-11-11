import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type KeyboardEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useShops } from "@/lib/shop-store";
import { PageHeader, EmptyState, StatCard } from "@/components/page-parts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
  Tags,
  Plus,
  Trash2,
  Edit,
  Sparkles,
  Check,
  X,
  FolderTree,
  Search,
  ChevronDown,
  ChevronRight,
  PackageOpen,
  FolderPlus,
  Layers,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { fmtNumber } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/categories")({
  head: () => ({ meta: [{ title: "Catégories — BoutikBF" }] }),
  component: CategoriesPage,
});

type Category = {
  id: string;
  name: string;
  description: string | null;
  keywords: string[] | null;
  sort_order: number;
  is_auto_generated: boolean;
  parent_id: string | null;
  product_count?: number;
};

const emptyDraft = (): Category => ({
  id: "",
  name: "",
  description: "",
  keywords: [],
  sort_order: 0,
  is_auto_generated: false,
  parent_id: null,
});

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof (error as { message: unknown }).message === "string"
  ) {
    return (error as { message: string }).message;
  }
  try {
    return JSON.stringify(error) || "Erreur inconnue";
  } catch {
    return "Erreur inconnue";
  }
};

const SHOP_TYPES = [
  { value: "general", label: "Général" },
  { value: "epicerie", label: "Épicerie / Alimentation" },
  { value: "vetements", label: "Vêtements / Mode" },
  { value: "quincaillerie", label: "Quincaillerie" },
  { value: "pharmacie", label: "Pharmacie / Santé" },
  { value: "restaurant", label: "Restaurant / Food" },
  { value: "cosmetique", label: "Cosmétique / Beauté" },
  { value: "electronique", label: "Électronique" },
];

function CategoriesPage() {
  const { current } = useShops();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [shopType, setShopType] = useState<string>(current?.shop_type || "general");
  const [generating, setGenerating] = useState(false);

  // recherche + arbre
  const [q, setQ] = useState("");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  // formulaire en dialog
  const [formOpen, setFormOpen] = useState(false);
  const [draft, setDraft] = useState<Category>(emptyDraft());
  const [isNew, setIsNew] = useState(true);
  const [kwInput, setKwInput] = useState("");

  // produits sans catégorie
  const [uncategorized, setUncategorized] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    if (current?.id) {
      setShopType(current.shop_type || "general");
      loadCategories();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id]);

  const loadCategories = async () => {
    if (!current?.id) return;
    setLoading(true);
    const [{ data }, { data: products }] = await Promise.all([
      supabase
        .from("categories")
        .select("id, name, description, keywords, sort_order, is_auto_generated, parent_id")
        .eq("shop_id", current.id)
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true }),
      supabase.from("products").select("category_id").eq("shop_id", current.id),
    ]);

    const cats = (data ?? []) as Category[];
    const counts: Record<string, number> = {};
    let uncategorizedCount = 0;
    (products ?? []).forEach((p: { category_id: string | null }) => {
      if (p.category_id) counts[p.category_id] = (counts[p.category_id] || 0) + 1;
      else uncategorizedCount++;
    });
    setCategories(cats.map((c) => ({ ...c, product_count: counts[c.id] || 0 })));

    // noms des produits sans catégorie (max 50 affichés)
    if (uncategorizedCount > 0) {
      const { data: uncat } = await supabase
        .from("products")
        .select("id,name")
        .eq("shop_id", current.id)
        .is("category_id", null)
        .limit(50);
      setUncategorized((uncat ?? []) as { id: string; name: string }[]);
    } else {
      setUncategorized([]);
    }
    setLoading(false);
  };

  const topLevel = useMemo(
    () => categories.filter((c) => !c.parent_id || !categories.some((x) => x.id === c.parent_id)),
    [categories],
  );
  const childrenOf = (id: string) => categories.filter((c) => c.parent_id === id);

  const matchesQuery = (c: Category) => {
    const t = q.trim().toLowerCase();
    if (!t) return true;
    return (
      c.name.toLowerCase().includes(t) ||
      (c.description ?? "").toLowerCase().includes(t) ||
      (c.keywords ?? []).some((k) => k.toLowerCase().includes(t))
    );
  };

  const openNew = (parentId?: string) => {
    setIsNew(true);
    setDraft({ ...emptyDraft(), parent_id: parentId ?? null });
    setKwInput("");
    setFormOpen(true);
  };
  const openEdit = (c: Category) => {
    setIsNew(false);
    setDraft({ ...c });
    setKwInput("");
    setFormOpen(true);
  };

  // chips de mots-clés
  const addKeyword = () => {
    const v = kwInput.trim().toLowerCase().replace(/,+$/, "");
    if (!v) return;
    if (!draft.keywords?.includes(v)) {
      setDraft({ ...draft, keywords: [...(draft.keywords ?? []), v] });
    }
    setKwInput("");
  };
  const onKwKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addKeyword();
    } else if (e.key === "Backspace" && !kwInput && (draft.keywords ?? []).length > 0) {
      setDraft({ ...draft, keywords: draft.keywords!.slice(0, -1) });
    }
  };

  const saveCategory = async () => {
    if (!current?.id || !draft.name.trim()) return;
    setProcessing(true);
    try {
      const payload = {
        name: draft.name.trim(),
        description: draft.description?.trim() || null,
        keywords: draft.keywords ?? [],
        sort_order: draft.sort_order || 0,
        parent_id: draft.parent_id || null,
      };
      if (!isNew) {
        const { error } = await supabase.from("categories").update(payload).eq("id", draft.id);
        if (error) throw error;
        toast.success("Catégorie mise à jour");
      } else {
        const { error } = await supabase.from("categories").insert({
          shop_id: current.id,
          ...payload,
          is_auto_generated: false,
        });
        if (error) throw error;
        toast.success("Catégorie créée");
      }
      setFormOpen(false);
      loadCategories();
    } catch (e: unknown) {
      toast.error(getErrorMessage(e));
    } finally {
      setProcessing(false);
    }
  };

  const deleteCategory = async (cat: Category) => {
    const kids = childrenOf(cat.id);
    const affected =
      (cat.product_count ?? 0) + kids.reduce((a, k) => a + (k.product_count ?? 0), 0);
    const msg =
      affected > 0
        ? `Supprimer « ${cat.name} » ?${kids.length ? ` ${kids.length} sous-catégorie(s) seront aussi supprimées.` : ""}\n${affected} produit(s) resteront mais deviendront sans catégorie.`
        : `Supprimer « ${cat.name} » ?`;
    if (!confirm(msg)) return;
    const { error } = await supabase.from("categories").delete().eq("id", cat.id);
    if (error) toast.error(error.message);
    else {
      toast.success("Catégorie supprimée");
      loadCategories();
    }
  };

  const assignProduct = async (productId: string, categoryId: string) => {
    const { error } = await supabase
      .from("products")
      .update({ category_id: categoryId || null })
      .eq("id", productId);
    if (error) return toast.error(error.message);
    setUncategorized((u) => u.filter((x) => x.id !== productId));
    loadCategories();
  };

  const generateCategories = async () => {
    if (!current?.id) return;
    setGenerating(true);
    try {
      const { error: shopError } = await supabase
        .from("shops")
        .update({ shop_type: shopType })
        .eq("id", current.id);
      if (shopError) throw shopError;
      const { error } = await supabase.rpc("generate_default_categories", {
        p_shop_id: current.id,
      });
      if (error) throw error;
      toast.success("Catégories générées selon le type de boutique");
      loadCategories();
    } catch (e: unknown) {
      toast.error(getErrorMessage(e));
    } finally {
      setGenerating(false);
    }
  };

  const classifyProducts = async () => {
    if (!current?.id) return;
    setProcessing(true);
    try {
      const { error } = await supabase.rpc("auto_classify_shop_products", {
        p_shop_id: current.id,
      });
      if (error) throw error;
      toast.success("Produits classés automatiquement (via mots-clés)");
      loadCategories();
    } catch (e: unknown) {
      toast.error(getErrorMessage(e));
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div>
        <PageHeader title="Catégories" description="Arborescence : catégories et sous-catégories" />
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  const subCount = categories.length - topLevel.length;
  const totalProducts = categories.reduce((a, c) => a + (c.product_count ?? 0), 0);

  return (
    <div>
      <PageHeader
        title="Catégories"
        description="Arborescence : catégories et sous-catégories"
        actions={
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => openNew()} className="gap-1.5">
              <FolderPlus className="h-4 w-4" /> Nouvelle catégorie
            </Button>
            <Button
              onClick={classifyProducts}
              disabled={processing || categories.length === 0}
              variant="outline"
              className="gap-1.5"
            >
              <Tags className="h-4 w-4" />
              {processing ? "Classification…" : "Classer les produits"}
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Catégories principales"
          value={fmtNumber(topLevel.length)}
          icon={FolderTree}
        />
        <StatCard label="Sous-catégories" value={fmtNumber(subCount)} icon={Layers} />
        <StatCard
          label="Produits classés"
          value={`${fmtNumber(totalProducts)}${uncategorized.length ? ` · ${uncategorized.length} sans catégorie` : ""}`}
          icon={Tags}
          tone={uncategorized.length > 0 ? "warning" : "success"}
        />
      </div>

      {/* Générateur par type de boutique (compact) */}
      <Card className="mt-4 shadow-soft">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-1.5">
            <Label>Type de boutique</Label>
            <Select value={shopType} onValueChange={setShopType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SHOP_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Remplit automatiquement une base de catégories adaptées à ton métier (avec mots-clés
              de classification). Rien n'est supprimé si tu génères plusieurs fois.
            </p>
          </div>
          <Button onClick={generateCategories} disabled={generating} className="gap-1.5 shrink-0">
            <Sparkles className="h-4 w-4" />
            {generating ? "Génération…" : "Générer les catégories"}
          </Button>
        </CardContent>
      </Card>

      {/* Recherche */}
      {categories.length > 0 && (
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9 max-w-md"
            placeholder="Rechercher une catégorie ou un mot-clé…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      )}

      {/* Arborescence */}
      {categories.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            icon={Tags}
            title="Aucune catégorie"
            description="Générez des catégories selon votre type de boutique ou créez-en manuellement."
          />
        </div>
      ) : (
        <div className="mt-4 space-y-2.5">
          {topLevel.map((parent) => {
            const kids = childrenOf(parent.id).filter(matchesQuery);
            const parentMatch = matchesQuery(parent);
            if (!parentMatch && kids.length === 0) return null;
            const isCollapsed = collapsed[parent.id] && kids.length > 0;
            return (
              <div key={parent.id} className="space-y-2">
                <CategoryCard
                  cat={parent}
                  isParent={kids.length > 0}
                  collapsed={!!collapsed[parent.id]}
                  onToggle={() => setCollapsed((c) => ({ ...c, [parent.id]: !c[parent.id] }))}
                  onEdit={() => openEdit(parent)}
                  onDelete={() => deleteCategory(parent)}
                  onAddSub={() => openNew(parent.id)}
                />
                {kids.length > 0 && !isCollapsed && (
                  <div className="ml-4 space-y-2 border-l-2 border-primary/20 pl-4">
                    {kids.map((sub) => (
                      <CategoryCard
                        key={sub.id}
                        cat={sub}
                        isChild
                        onEdit={() => openEdit(sub)}
                        onDelete={() => deleteCategory(sub)}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Produits sans catégorie */}
      {uncategorized.length > 0 && (
        <Card className="mt-6 border-warning/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <PackageOpen className="h-4 w-4 text-warning" />
              Produits sans catégorie ({uncategorized.length}
              {uncategorized.length >= 50 ? "+" : ""})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-3 text-xs text-muted-foreground">
              Attribue une catégorie à chaque produit (ou utilise « Classer les produits » en haut
              pour la classification automatique par mots-clés).
            </p>
            <div className="max-h-72 space-y-1.5 overflow-y-auto">
              {uncategorized.map((p) => (
                <div
                  key={p.id}
                  className="flex flex-wrap items-center gap-2 rounded-lg border border-border p-2"
                >
                  <span className="min-w-0 flex-1 truncate text-sm">{p.name}</span>
                  <Select onValueChange={(v) => assignProduct(p.id, v)}>
                    <SelectTrigger className="h-9 w-[220px]">
                      <SelectValue placeholder="Classer dans…" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.parent_id
                            ? `${categories.find((x) => x.id === c.parent_id)?.name ?? ""} · ${c.name}`
                            : c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Formulaire en dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden sm:max-w-lg">
          <DialogHeader className="shrink-0 px-6 pb-2 pt-6">
            <DialogTitle className="font-display">
              {isNew ? "Nouvelle catégorie" : "Modifier la catégorie"}
            </DialogTitle>
            <DialogDescription>
              {draft.parent_id
                ? `Sous-catégorie de « ${categories.find((c) => c.id === draft.parent_id)?.name ?? ""} »`
                : "Les mots-clés servent à classer automatiquement les produits."}
            </DialogDescription>
          </DialogHeader>
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-3">
            <div className="space-y-1.5">
              <Label>Nom *</Label>
              <Input
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                placeholder="Ex : Boissons"
                className="h-10"
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label>Catégorie parente</Label>
              <Select
                value={draft.parent_id || "none"}
                onValueChange={(v) => setDraft({ ...draft, parent_id: v === "none" ? null : v })}
              >
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucune (catégorie principale)</SelectItem>
                  {categories
                    .filter((c) => c.id !== draft.id && !c.parent_id)
                    .map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea
                rows={2}
                value={draft.description || ""}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                placeholder="À quoi sert cette catégorie ?"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Mots-clés de classification</Label>
              <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-border p-2">
                {(draft.keywords ?? []).map((k) => (
                  <Badge key={k} variant="secondary" className="gap-1 pr-1 text-xs">
                    {k}
                    <button
                      type="button"
                      className="grid h-4 w-4 place-items-center rounded-full hover:bg-destructive/20"
                      onClick={() =>
                        setDraft({
                          ...draft,
                          keywords: (draft.keywords ?? []).filter((x) => x !== k),
                        })
                      }
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                <input
                  value={kwInput}
                  onChange={(e) => setKwInput(e.target.value)}
                  onKeyDown={onKwKeyDown}
                  onBlur={addKeyword}
                  placeholder={
                    (draft.keywords ?? []).length === 0
                      ? "coca, jus, eau… (Entrée pour valider)"
                      : "…"
                  }
                  className="min-w-[120px] flex-1 bg-transparent text-sm outline-none"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Entrée ou virgule pour ajouter · Retour arrière pour retirer le dernier.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label>Ordre d'affichage</Label>
              <Input
                type="number"
                value={draft.sort_order || 0}
                onChange={(e) => setDraft({ ...draft, sort_order: parseInt(e.target.value) || 0 })}
                className="h-10 w-32"
              />
            </div>
          </div>
          <DialogFooter className="m-0 shrink-0 border-t border-border px-6 py-4">
            <Button variant="ghost" onClick={() => setFormOpen(false)}>
              Annuler
            </Button>
            <Button onClick={saveCategory} disabled={processing || !draft.name.trim()}>
              <Check className="mr-1.5 h-4 w-4" />
              {isNew ? "Créer" : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ---------- carte de catégorie (parent repliable ou enfant) ---------- */

function CategoryCard({
  cat,
  onEdit,
  onDelete,
  onAddSub,
  isParent,
  isChild,
  collapsed,
  onToggle,
}: {
  cat: Category;
  onEdit: () => void;
  onDelete: () => void;
  onAddSub?: () => void;
  isParent?: boolean;
  isChild?: boolean;
  collapsed?: boolean;
  onToggle?: () => void;
}) {
  const count = cat.product_count ?? 0;
  return (
    <Card className={`shadow-soft ${isChild ? "" : ""}`}>
      <CardContent className="p-3">
        <div className="flex items-center gap-2">
          {isParent ? (
            <button
              type="button"
              onClick={onToggle}
              className="grid h-7 w-7 shrink-0 place-items-center rounded-lg hover:bg-secondary"
              title={collapsed ? "Déplier" : "Replier"}
            >
              {collapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
          ) : (
            <span className="grid h-7 w-7 shrink-0 place-items-center text-muted-foreground">
              <Tags className="h-3.5 w-3.5" />
            </span>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3
                className={`truncate font-medium ${isChild ? "text-sm" : "text-sm font-semibold"}`}
              >
                {cat.name}
              </h3>
              {cat.is_auto_generated && (
                <Badge variant="secondary" className="text-[10px] shrink-0">
                  Auto
                </Badge>
              )}
              <Badge
                variant="outline"
                className={`text-[10px] shrink-0 ${count === 0 ? "text-muted-foreground" : ""}`}
              >
                {count} produit{count !== 1 ? "s" : ""}
              </Badge>
            </div>
            {cat.description && (
              <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{cat.description}</p>
            )}
            {cat.keywords && cat.keywords.length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-1">
                {cat.keywords.slice(0, 6).map((k) => (
                  <Badge key={k} variant="secondary" className="text-[10px] font-normal">
                    {k}
                  </Badge>
                ))}
                {cat.keywords.length > 6 && (
                  <Badge variant="secondary" className="text-[10px] font-normal">
                    +{cat.keywords.length - 6}
                  </Badge>
                )}
              </div>
            )}
          </div>

          <div className="flex shrink-0 gap-1">
            {onAddSub && (
              <Button
                size="sm"
                variant="ghost"
                className="h-8 gap-1 text-xs"
                onClick={onAddSub}
                title="Ajouter une sous-catégorie"
              >
                <Plus className="h-3.5 w-3.5" /> Sous-catégorie
              </Button>
            )}
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onEdit}>
              <Edit className="h-3.5 w-3.5" />
            </Button>
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onDelete}>
              <Trash2 className="h-3.5 w-3.5 text-destructive" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
