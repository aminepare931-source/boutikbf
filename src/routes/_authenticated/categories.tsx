import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useShops } from "@/lib/shop-store";
import { PageHeader, EmptyState } from "@/components/page-parts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tags, Plus, Trash2, Edit, Sparkles, Check, X, FolderTree } from "lucide-react";
import { toast } from "sonner";

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

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof (error as any).message === "string"
  ) {
    return (error as any).message;
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
  const [editing, setEditing] = useState<Category | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [shopType, setShopType] = useState<string>(current?.shop_type || "general");
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (current?.id) {
      setShopType(current.shop_type || "general");
      loadCategories();
    }
  }, [current?.id]);

  const loadCategories = async () => {
    if (!current?.id) return;
    setLoading(true);
    const { data } = await supabase
      .from("categories")
      .select("id, name, description, keywords, sort_order, is_auto_generated, parent_id")
      .eq("shop_id", current.id)
      .order("sort_order", { ascending: true });

    const cats = (data ?? []) as Category[];

    // Compter les produits par catégorie
    const { data: products } = await supabase
      .from("products")
      .select("category_id")
      .eq("shop_id", current.id);

    const counts: Record<string, number> = {};
    (products ?? []).forEach((p: { category_id: string | null }) => {
      if (p.category_id) counts[p.category_id] = (counts[p.category_id] || 0) + 1;
    });

    setCategories(cats.map((c) => ({ ...c, product_count: counts[c.id] || 0 })));
    setLoading(false);
  };

  const saveCategory = async (cat: Category) => {
    if (!current?.id) return;
    setProcessing(true);
    try {
      if (cat.id) {
        const { error } = await supabase
          .from("categories")
          .update({
            name: cat.name,
            description: cat.description,
            keywords: cat.keywords,
            sort_order: cat.sort_order,
          })
          .eq("id", cat.id);
        if (error) throw error;
        toast.success("Catégorie mise à jour");
      } else {
        const { error } = await supabase.from("categories").insert({
          shop_id: current.id,
          name: cat.name,
          description: cat.description,
          keywords: cat.keywords,
          sort_order: cat.sort_order,
          is_auto_generated: false,
        });
        if (error) throw error;
        toast.success("Catégorie créée");
      }
      setShowForm(false);
      setEditing(null);
      loadCategories();
    } catch (e: unknown) {
      console.error("Erreur catégorie:", e);
      toast.error(getErrorMessage(e));
    } finally {
      setProcessing(false);
    }
  };

  const deleteCategory = async (id: string) => {
    if (!confirm("Supprimer cette catégorie ? Les produits resteront sans catégorie.")) return;
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Catégorie supprimée");
      loadCategories();
    }
  };

  const generateCategories = async () => {
    if (!current?.id) return;
    setGenerating(true);
    try {
      // Mettre à jour le type de boutique
      const { error: shopError } = await supabase
        .from("shops")
        .update({ shop_type: shopType })
        .eq("id", current.id);
      if (shopError) throw shopError;

      // Générer les catégories par défaut
      const { error } = await supabase.rpc("generate_default_categories", {
        p_shop_id: current.id,
      });
      if (error) throw error;

      toast.success("Catégories générées selon le type de boutique");
      loadCategories();
    } catch (e: unknown) {
      console.error("Erreur génération catégories:", e);
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
      toast.success("Produits classés automatiquement");
      loadCategories();
    } catch (e: unknown) {
      console.error("Erreur classification produits:", e);
      toast.error(getErrorMessage(e));
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div>
        <PageHeader title="Catégories" description="Gestion des catégories de produits" />
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Catégories" description="Gestion des catégories de produits" />

      {/* Configuration du type de boutique */}
      <Card className="shadow-soft mb-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FolderTree className="h-4 w-4" />
            Type de boutique
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Sélectionnez le type de votre boutique pour générer automatiquement des catégories
            pertinentes.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="text-sm font-medium mb-1.5 block">Type de boutique</label>
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
            </div>
            <Button onClick={generateCategories} disabled={generating} className="gap-1.5">
              <Sparkles className="h-4 w-4" />
              {generating ? "Génération..." : "Générer les catégories"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-wrap gap-2 mb-4">
        <Button
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
          className="gap-1.5"
        >
          <Plus className="h-4 w-4" />
          Nouvelle catégorie
        </Button>
        <Button
          onClick={classifyProducts}
          disabled={processing}
          variant="outline"
          className="gap-1.5"
        >
          <Tags className="h-4 w-4" />
          {processing ? "Classification..." : "Classifier les produits"}
        </Button>
      </div>

      {/* Formulaire d'édition */}
      {showForm && (
        <Card className="shadow-soft mb-4">
          <CardHeader>
            <CardTitle className="text-base">
              {editing?.id ? "Modifier la catégorie" : "Nouvelle catégorie"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Nom</label>
              <Input
                value={editing?.name || ""}
                onChange={(e) => setEditing({ ...editing!, name: e.target.value })}
                placeholder="Nom de la catégorie"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Description</label>
              <Textarea
                value={editing?.description || ""}
                onChange={(e) => setEditing({ ...editing!, description: e.target.value })}
                placeholder="Description de la catégorie"
                rows={2}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Mots-clés (séparés par des virgules)
              </label>
              <Input
                value={(editing?.keywords || []).join(", ")}
                onChange={(e) =>
                  setEditing({
                    ...editing!,
                    keywords: e.target.value
                      .split(",")
                      .map((k) => k.trim())
                      .filter(Boolean),
                  })
                }
                placeholder="riz, pain, lait, boisson"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Ces mots-clés serviront à classer automatiquement les produits dans cette catégorie.
              </p>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Ordre d'affichage</label>
              <Input
                type="number"
                value={editing?.sort_order || 0}
                onChange={(e) =>
                  setEditing({ ...editing!, sort_order: parseInt(e.target.value) || 0 })
                }
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => saveCategory(editing!)}
                disabled={processing || !editing?.name}
                className="gap-1.5"
              >
                <Check className="h-4 w-4" />
                {editing?.id ? "Mettre à jour" : "Créer"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  setEditing(null);
                }}
                className="gap-1.5"
              >
                <X className="h-4 w-4" />
                Annuler
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Liste des catégories */}
      {categories.length === 0 ? (
        <EmptyState
          icon={Tags}
          title="Aucune catégorie"
          description="Générez des catégories selon votre type de boutique ou créez-en manuellement."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => (
            <Card key={cat.id} className="shadow-soft">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-sm truncate">{cat.name}</h3>
                      {cat.is_auto_generated && (
                        <Badge variant="secondary" className="text-[10px] shrink-0">
                          Auto
                        </Badge>
                      )}
                    </div>
                    {cat.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {cat.description}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => {
                        setEditing(cat);
                        setShowForm(true);
                      }}
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => deleteCategory(cat.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <Badge variant="outline" className="text-xs">
                    {cat.product_count} produit{cat.product_count !== 1 ? "s" : ""}
                  </Badge>
                  {cat.keywords && cat.keywords.length > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {cat.keywords.length} mot{cat.keywords.length > 1 ? "s" : ""}-clé
                    </span>
                  )}
                </div>

                {cat.keywords && cat.keywords.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {cat.keywords.slice(0, 5).map((k) => (
                      <Badge key={k} variant="secondary" className="text-[10px]">
                        {k}
                      </Badge>
                    ))}
                    {cat.keywords.length > 5 && (
                      <Badge variant="secondary" className="text-[10px]">
                        +{cat.keywords.length - 5}
                      </Badge>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
