import { createFileRoute, useNavigate, useSearch, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useShops } from "@/lib/shop-store";
import { PageHeader, EmptyState } from "@/components/page-parts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Package,
  Plus,
  Search,
  Trash2,
  Pencil,
  Upload,
  Download,
  Barcode,
  Loader2,
  ScanLine,
  Table2,
  Smartphone,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  ImagePlus,
  X,
} from "lucide-react";
import { fmtMoney } from "@/lib/format";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { BarcodeScanner } from "@/components/barcode-scanner";
import { PhoneScanner } from "@/components/phone-scanner";
import {
  downloadTemplate,
  generateSku,
  parseFileRaw,
  findColumn,
  autoDetectColumns,
} from "@/lib/csv-import";
import { openLabels } from "@/lib/receipt";
import { Checkbox } from "@/components/ui/checkbox";
import JsBarcode from "jsbarcode";

export const Route = createFileRoute("/_authenticated/products")({
  head: () => ({ meta: [{ title: "Produits — BoutikBF" }] }),
  validateSearch: (search: Record<string, unknown>): { barcode?: string } => ({
    barcode:
      typeof search.barcode === "string" || typeof search.barcode === "number"
        ? String(search.barcode)
        : undefined,
  }),
  component: ProductsPage,
});

type Product = {
  id: string;
  name: string;
  category_id?: string | null;
  category?: string;
  sku: string | null;
  barcode: string | null;
  cost_price: number;
  sale_price: number;
  stock: number;
  unit: string;
  is_active: boolean;
  description?: string | null;
  brand?: string | null;
  image_url?: string | null;
  expiry_date?: string | null;
  batch_label?: string | null;
  promo_price?: number | null;
  promo_start?: string | null;
  promo_end?: string | null;
  extra?: { supplier?: string; weight?: string; color?: string; size?: string } | null;
};

type Cat = { id: string; name: string; parent_id: string | null };

const FIELD_OPTIONS = [
  { value: "name", label: "Nom du produit *" },
  { value: "category", label: "Catégorie" },
  { value: "sku", label: "Référence (SKU)" },
  { value: "barcode", label: "Code-barres" },
  { value: "cost_price", label: "Prix d'achat" },
  { value: "sale_price", label: "Prix de vente" },
  { value: "stock", label: "Stock" },
  { value: "unit", label: "Unité" },
  { value: "total_price", label: "Prix total (quantité × prix)" },
  { value: "margin", label: "Marge bénéficiaire" },
  { value: "discount", label: "Remise / Réduction" },
  { value: "supplier", label: "Fournisseur" },
  { value: "brand", label: "Marque" },
  { value: "weight", label: "Poids" },
  { value: "color", label: "Couleur" },
  { value: "size", label: "Taille" },
  { value: "description", label: "Description" },
  { value: "ignore", label: "Ignorer cette colonne" },
];

function ProductsPage() {
  const { current } = useShops();
  const navigate = useNavigate();
  const { barcode: barcodeParam } = useSearch({ from: "/_authenticated/products" });
  const [items, setItems] = useState<Product[]>([]);
  const [cats, setCats] = useState<Cat[]>([]);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [imgBusy, setImgBusy] = useState(false);
  const imgRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    name: "",
    category_id: "",
    sku: "",
    barcode: "",
    cost_price: 0,
    sale_price: 0,
    stock: 0,
    unit: "unité",
    supplier: "",
    brand: "",
    weight: "",
    color: "",
    size: "",
    description: "",
    image_url: "",
    expiry_date: "",
    batch_label: "",
    promo_price: 0,
    promo_start: "",
    promo_end: "",
  });

  const emptyForm = {
    name: "",
    category_id: "",
    sku: "",
    barcode: "",
    cost_price: 0,
    sale_price: 0,
    stock: 0,
    unit: "unité",
    supplier: "",
    brand: "",
    weight: "",
    color: "",
    size: "",
    description: "",
    image_url: "",
    expiry_date: "",
    batch_label: "",
    promo_price: 0,
    promo_start: "",
    promo_end: "",
  };

  // Détecter le paramètre barcode dans l'URL et ouvrir le formulaire
  useEffect(() => {
    if (barcodeParam && !open) {
      setEditing(null);
      setForm((f) => ({ ...f, barcode: barcodeParam }));
      setOpen(true);
      // Nettoyer l'URL
      navigate({ to: "/products", search: {}, replace: true });
    }
  }, [barcodeParam, open, navigate]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [importing, setImporting] = useState(false);
  const [importPreview, setImportPreview] = useState<{
    columns: string[];
    rows: Record<string, any>[];
    file: File;
  } | null>(null);
  const [colMapping, setColMapping] = useState<Record<string, string>>({});
  const [scanOpen, setScanOpen] = useState(false);
  const [phoneScanOpen, setPhoneScanOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetRows, setSheetRows] = useState<
    {
      name: string;
      cost_price: number;
      sale_price: number;
      stock: number;
      unit: string;
      barcode: string;
    }[]
  >([]);
  const [sheetSaving, setSheetSaving] = useState(false);
  const [step, setStep] = useState<"preview" | "mapping" | "confirm">("preview");
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    if (!current) return;
    const [{ data }, { data: catRows }] = await Promise.all([
      supabase
        .from("products")
        .select(
          "id,name,category_id,sku,barcode,cost_price,sale_price,stock,unit,is_active,description,brand,image_url,expiry_date,batch_label,promo_price,promo_start,promo_end,extra,categories(name)",
        )
        .eq("shop_id", current.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("categories")
        .select("id,name,parent_id")
        .eq("shop_id", current.id)
        .order("name"),
    ]);
    setCats((catRows ?? []) as Cat[]);

    const products = (data ?? []) as Array<
      Product & { categories?: { name: string | null } | Array<{ name: string | null }> }
    >;
    setItems(
      products.map((p) => {
        const categories = p.categories;
        const categoryName = Array.isArray(categories)
          ? (categories[0]?.name ?? undefined)
          : (categories?.name ?? undefined);
        return {
          ...p,
          category: categoryName,
          category_id: p.category_id,
        };
      }),
    );
  };
  useEffect(() => {
    load();
    setSelected({});
  }, [current?.id]);

  const openNew = () => {
    setEditing(null);
    setForm({ ...emptyForm });
    setOpen(true);
  };
  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({
      name: p.name,
      category_id: p.category_id ?? "",
      sku: p.sku ?? "",
      barcode: p.barcode ?? "",
      cost_price: p.cost_price,
      sale_price: p.sale_price,
      stock: p.stock,
      unit: p.unit,
      supplier: p.extra?.supplier ?? "",
      brand: p.brand ?? "",
      weight: p.extra?.weight ?? "",
      color: p.extra?.color ?? "",
      size: p.extra?.size ?? "",
      description: p.description ?? "",
      image_url: p.image_url ?? "",
      expiry_date: p.expiry_date ?? "",
      batch_label: p.batch_label ?? "",
      promo_price: p.promo_price ?? 0,
      promo_start: p.promo_start ?? "",
      promo_end: p.promo_end ?? "",
    });
    setOpen(true);
  };

  const nextSkuIndex = () => {
    const prefix = shopSkuPrefix(current?.name ?? "PRD");
    const max = items.reduce((m, p) => {
      const match = p.sku?.match(new RegExp(`^${prefix}-(\\d+)$`));
      return match ? Math.max(m, parseInt(match[1], 10)) : m;
    }, 0);
    return { prefix, next: max + 1 };
  };

  const generateBarcode = () => {
    try {
      const code = form.sku || `PRD-${Date.now().toString(36).toUpperCase()}`;
      const canvas = document.createElement("canvas");

      // Utiliser JsBarcode pour générer le code-barres
      JsBarcode(canvas, code, {
        format: "CODE128",
        width: 2,
        height: 100,
        displayValue: true,
        fontSize: 14,
      });

      const url = canvas.toDataURL("image/png");
      setForm((f) => ({ ...f, barcode: code }));
      toast.success(`Code-barres généré : ${code}`);

      // Ouvrir dans un nouvel onglet pour impression
      const win = window.open();
      if (win) {
        win.opener = null;
        win.document.write(`
          <html>
            <head><title>Code-barres</title></head>
            <body style="display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;">
              <img src="${url}" style="width:300px;height:100px;" />
              <p style="position:absolute;bottom:20px;font-family:Arial;font-size:14px;">${String(code).replace(/[^0-9A-Za-z-]/g, "")}</p>
            </body>
          </html>
        `);
      }
    } catch (e: any) {
      toast.error("Erreur génération code-barres: " + (e?.message ?? "inconnue"));
    }
  };

  const save = async () => {
    if (!current || !form.name.trim()) return;
    let sku = form.sku.trim();
    if (!sku && !editing) {
      const { prefix, next } = nextSkuIndex();
      sku = generateSku(prefix, next);
    }
    const payload = {
      shop_id: current.id,
      name: form.name.trim(),
      sku: sku || null,
      barcode: form.barcode.trim() || null,
      cost_price: Number(form.cost_price) || 0,
      sale_price: Number(form.sale_price) || 0,
      stock: Number(form.stock) || 0,
      unit: form.unit.trim() || "unité",
      category_id: form.category_id ? form.category_id : null,
      description: form.description.trim() || null,
      brand: form.brand.trim() || null,
      image_url: form.image_url || null,
      expiry_date: form.expiry_date || null,
      batch_label: form.batch_label.trim() || null,
      promo_price: Number(form.promo_price) > 0 ? Number(form.promo_price) : null,
      promo_start: form.promo_start || null,
      promo_end: form.promo_end || null,
      extra: {
        supplier: form.supplier.trim() || undefined,
        weight: form.weight.trim() || undefined,
        color: form.color.trim() || undefined,
        size: form.size.trim() || undefined,
      },
    };
    const { error } = editing
      ? await supabase.from("products").update(payload).eq("id", editing.id)
      : await supabase.from("products").insert(payload);
    if (error) return toast.error(error.message);
    toast.success(editing ? "Produit mis à jour" : "Produit ajouté");
    setOpen(false);
    load();
  };

  // Upload photo produit → bucket product-images/<shop>/<uuid>
  const uploadImage = async (file: File) => {
    if (!current) return;
    if (file.size > 2 * 1024 * 1024) return toast.error("Image trop lourde (max 2 Mo)");
    setImgBusy(true);
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const path = `${current.id}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("product-images").upload(path, file, {
      contentType: file.type,
      upsert: false,
    });
    setImgBusy(false);
    if (error) return toast.error("Upload image : " + error.message);
    const { data } = supabase.storage.from("product-images").getPublicUrl(path);
    setForm((f) => ({ ...f, image_url: data.publicUrl }));
    toast.success("Photo ajoutée");
  };

  const remove = async (id: string) => {
    if (!confirm("Supprimer ce produit ?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Supprimé");
    load();
  };

  const removeSelected = async () => {
    if (!confirm(`Supprimer ${Object.keys(selected).length} produits sélectionnés ?`)) return;
    const ids = Object.keys(selected).filter((id) => selected[id]);
    if (ids.length === 0) return toast.error("Aucun produit sélectionné");
    setImporting(true);
    try {
      let deleted = 0;
      for (let i = 0; i < ids.length; i += 100) {
        const batch = ids.slice(i, i + 100);
        const { error, data } = await supabase
          .from("products")
          .delete()
          .in("id", batch)
          .select("id");
        if (error) {
          toast.error(`Erreur suppression: ${error.message}`);
          break;
        }
        deleted += data?.length ?? 0;
      }
      toast.success(`${deleted} produits supprimés`);
      setSelected({});
      load();
    } catch (err: any) {
      toast.error("Erreur: " + (err?.message ?? "inconnue"));
    } finally {
      setImporting(false);
    }
  };

  const removeAll = async () => {
    if (
      !confirm(
        `ATTENTION : Supprimer TOUS les produits (${filtered.length}) ?\n\nCette action est irréversible.`,
      )
    )
      return;
    if (!confirm("Êtes-vous vraiment sûr ? Tous les produits vont être supprimés.")) return;
    setImporting(true);
    try {
      const { data: allProducts } = await supabase
        .from("products")
        .select("id")
        .eq("shop_id", current!.id);
      const ids = (allProducts ?? []).map((p) => p.id);
      let deleted = 0;
      for (let i = 0; i < ids.length; i += 100) {
        const batch = ids.slice(i, i + 100);
        const { error, data } = await supabase
          .from("products")
          .delete()
          .in("id", batch)
          .select("id");
        if (error) {
          toast.error(`Erreur suppression: ${error.message}`);
          break;
        }
        deleted += data?.length ?? 0;
      }
      toast.success(`${deleted} produits supprimés`);
      setSelected({});
      load();
    } catch (err: any) {
      toast.error("Erreur: " + (err?.message ?? "inconnue"));
    } finally {
      setImporting(false);
    }
  };

  // === IMPORT LOGIC ===
  const onPickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    try {
      toast.info("Lecture du fichier en cours...");
      const { columns, rows } = await parseFileRaw(f);
      if (rows.length === 0) {
        toast.error("Aucune donnée trouvée.");
        return;
      }

      const mapping: Record<string, string> = {};

      columns.forEach((col) => {
        const colLower = col
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");
        // Nom du produit
        if (
          /nom|name|produit|product|article|designation|libelle|description|intitule|intitulé/.test(
            colLower,
          )
        )
          mapping[col] = "name";
        // Catégorie
        else if (/categorie|category|famille|rayon|groupe|type|classe|section/.test(colLower))
          mapping[col] = "category";
        // Prix d'achat (unité = prix unitaire = prix d'achat dans certains fichiers)
        else if (
          /prix.*achat|cost.*price|cout|coût|prix.*unite|prix.*unitaire|pu|p\.u|p\. achat|pachat/.test(
            colLower,
          ) &&
          !/vente|total/.test(colLower)
        )
          mapping[col] = "cost_price";
        // Prix de vente
        else if (/prix.*vente|sale.*price|prix|price|pv|p\.v|pvente|prix.*public/.test(colLower))
          mapping[col] = "sale_price";
        // Stock
        else if (
          /stock|quantite|quantité|quantity|qte|qté|qt|disponible|enstock|stk/.test(colLower)
        )
          mapping[col] = "stock";
        // Référence
        else if (/reference|référence|sku|ref|code.*prod|code.*art|article.*code/.test(colLower))
          mapping[col] = "sku";
        // Code-barres
        else if (/code.*barre|barcode|ean|codebarre|upc|gtin/.test(colLower))
          mapping[col] = "barcode";
        // Unité
        else if (/unite|unité|unit|conditionnement|emballage|mesure/.test(colLower))
          mapping[col] = "unit";
        // Fournisseur
        else if (/fournisseur|supplier|frs|distributeur|fabriquant/.test(colLower))
          mapping[col] = "supplier";
        // Marque
        else if (/marque|brand|marque/.test(colLower)) mapping[col] = "brand";
        // Prix total
        else if (/prix.*total|total.*prix|montant|total/.test(colLower))
          mapping[col] = "total_price";
        // Marge
        else if (/marge|margin|benefice|bénéfice/.test(colLower)) mapping[col] = "margin";
        // Remise
        else if (/remise|reduction|réduction|discount|rabais/.test(colLower))
          mapping[col] = "discount";
        // Poids
        else if (/poids|weight|masse|kg|gramme/.test(colLower)) mapping[col] = "weight";
        // Couleur
        else if (/couleur|color|colour/.test(colLower)) mapping[col] = "color";
        // Taille
        else if (/taille|size|dimension|pointure/.test(colLower)) mapping[col] = "size";
        // Description
        else if (/description|desc|notes|comment/.test(colLower)) mapping[col] = "description";
        else mapping[col] = "ignore";
      });

      if (!Object.values(mapping).includes("name")) {
        const firstTextCol = columns.find((col) => {
          const sample = rows
            .slice(0, 5)
            .map((r) => String(r[col] ?? ""))
            .filter((s) => s.length > 0);
          return sample.length > 0 && sample.some((s) => s.length > 5);
        });
        if (firstTextCol) mapping[firstTextCol] = "name";
      }

      setColMapping(mapping);
      setImportPreview({ columns, rows, file: f });
      setStep("mapping");
      toast.success(`${rows.length} lignes détectées — vérifiez le mapping`);
    } catch (err: any) {
      toast.error("Erreur: " + (err?.message ?? "Format non supporté"));
    }
  };

  const updateMapping = (col: string, field: string) => {
    setColMapping((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((k) => {
        if (next[k] === field && k !== col) next[k] = "ignore";
      });
      next[col] = field;
      return next;
    });
  };

  const previewMappedData = () => {
    if (!importPreview) return [];
    const map = colMapping;
    return importPreview.rows.slice(0, 5).map((row) => {
      const entry: Record<string, any> = {};
      Object.entries(map).forEach(([col, field]) => {
        if (field !== "ignore") entry[field] = row[col];
      });
      return entry;
    });
  };

  const confirmImport = async () => {
    if (!current || !importPreview) return;

    const hasName = Object.values(colMapping).includes("name");
    if (!hasName) {
      toast.error("Vous devez indiquer quelle colonne contient le nom du produit");
      return;
    }

    setImporting(true);
    try {
      const { prefix, next } = nextSkuIndex();
      const map = colMapping;

      const toNumber = (val: any): number => {
        if (val === undefined || val === null || val === "") return 0;
        if (typeof val === "number") return val;
        const str = String(val)
          .trim()
          .replace(/[^0-9.,\-]/g, "")
          .replace(",", ".");
        const num = Number(str);
        return isNaN(num) ? 0 : Math.max(0, num);
      };

      const payload = importPreview.rows
        .map((r, i) => {
          // Helper pour extraire une valeur du mapping
          const getValue = (field: string): any => {
            const col = Object.entries(map).find(([_, v]) => v === field)?.[0];
            return col ? r[col] : undefined;
          };

          const name = String(getValue("name") ?? "").trim();
          if (!name) return null;

          const sku = String(getValue("sku") ?? "").trim();
          const barcode = String(getValue("barcode") ?? "").trim();
          const unit = String(getValue("unit") ?? "").trim();

          return {
            shop_id: current.id,
            name,
            sku: sku || generateSku(prefix, next + i),
            barcode: barcode || null,
            cost_price: toNumber(getValue("cost_price")),
            sale_price: toNumber(getValue("sale_price")),
            stock: toNumber(getValue("stock")),
            unit: unit || "unité",
          };
        })
        .filter((p): p is NonNullable<typeof p> => p !== null);

      if (payload.length === 0) {
        toast.error("Aucun produit valide trouvé");
        return;
      }

      const withPrice = payload.filter((p) => p.sale_price > 0).length;
      const withStock = payload.filter((p) => p.stock > 0).length;

      toast.info(`${payload.length} produits : ${withPrice} avec prix, ${withStock} avec stock`);

      let inserted = 0;
      for (let i = 0; i < payload.length; i += 200) {
        const chunk = payload.slice(i, i + 200);
        const { error, data } = await supabase.from("products").insert(chunk).select("id");
        if (error) {
          console.error("Erreur import:", error);
          toast.error(`Erreur ligne ${i + 1}: ${error.message}`);
          break;
        }
        inserted += data?.length ?? 0;
      }

      if (inserted > 0) {
        toast.success(`${inserted} produits importés avec succès`);
        setImportPreview(null);
        setStep("preview");
        load();
      }
    } catch (err: any) {
      console.error("Erreur import:", err);
      toast.error("Erreur: " + (err?.message ?? "inconnue"));
    } finally {
      setImporting(false);
    }
  };

  const saveSheet = async () => {
    if (!current) return;
    const valid = sheetRows.filter((r) => r.name.trim().length > 0);
    if (valid.length === 0) return toast.error("Ajoutez au moins une ligne avec un nom");
    setSheetSaving(true);
    const { prefix, next } = nextSkuIndex();
    const payload = valid.map((r, i) => ({
      shop_id: current.id,
      name: r.name.trim(),
      sku: generateSku(prefix, next + i),
      barcode: r.barcode.trim() || null,
      cost_price: Number(r.cost_price) || 0,
      sale_price: Number(r.sale_price) || 0,
      stock: Number(r.stock) || 0,
      unit: r.unit || "unité",
    }));
    const { error } = await supabase.from("products").insert(payload);
    setSheetSaving(false);
    if (error) return toast.error(error.message);
    toast.success(`${valid.length} produits enregistrés`);
    setSheetOpen(false);
    load();
  };

  const filtered = items.filter((p) => {
    const search = q.toLowerCase().trim();
    if (!search) return true;
    return (
      p.name.toLowerCase().includes(search) ||
      (p.sku ?? "").toLowerCase().includes(search) ||
      (p.barcode ?? "").toLowerCase().includes(search) ||
      (p.unit ?? "").toLowerCase().includes(search) ||
      (p.category ?? "").toLowerCase().includes(search)
    );
  });

  // « Parent · Enfant » pour l'affichage et la recherche de catégorie
  const catPath = (id?: string | null): string | null => {
    if (!id) return null;
    const c = cats.find((x) => x.id === id);
    if (!c) return null;
    if (c.parent_id) {
      const par = cats.find((x) => x.id === c.parent_id);
      return par ? `${par.name} · ${c.name}` : c.name;
    }
    return c.name;
  };
  const selectedProducts = filtered.filter((p) => selected[p.id]);

  const printSelectedLabels = () => {
    const list = (selectedProducts.length > 0 ? selectedProducts : filtered)
      .filter((p) => p.sku)
      .map((p) => ({ name: p.name, sku: p.sku as string, sale_price: p.sale_price }));
    if (list.length === 0) return toast.error("Aucun produit avec SKU sélectionné");
    openLabels(list, current?.currency);
  };

  const onScan = (code: string) => {
    const c = code.trim();
    const match = items.find((p) => p.barcode === c || p.sku === c);
    if (match) {
      openEdit(match);
      toast.success(`Produit trouvé : ${match.name}`);
    } else {
      setEditing(null);
      setForm({ ...emptyForm, barcode: c });
      setOpen(true);
      toast.info(`Nouveau produit — code-barres ${c} pré-rempli`);
    }
  };

  return (
    <div>
      <PageHeader
        title="Produits"
        description="Catalogue, prix, stocks, import Excel et étiquettes code-barres."
        actions={
          <div className="flex flex-wrap gap-2">
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={onPickFile}
            />
            <Button variant="outline" onClick={() => setScanOpen(true)}>
              <ScanLine className="mr-2 h-4 w-4" />
              Scanner
            </Button>
            <Button
              variant="outline"
              onClick={() => setPhoneScanOpen(true)}
              title="Utilisez votre téléphone comme scanner"
            >
              <Smartphone className="mr-2 h-4 w-4" />
              Téléphone
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setSheetRows(
                  Array.from({ length: 5 }, () => ({
                    name: "",
                    cost_price: 0,
                    sale_price: 0,
                    stock: 0,
                    unit: "unité",
                    barcode: "",
                  })),
                );
                setSheetOpen(true);
              }}
            >
              <Table2 className="mr-2 h-4 w-4" />
              Saisie tableau
            </Button>
            <Button variant="outline" onClick={() => downloadTemplate()}>
              <Download className="mr-2 h-4 w-4" />
              Modèle Excel
            </Button>
            <Button variant="outline" onClick={() => fileRef.current?.click()}>
              <Upload className="mr-2 h-4 w-4" />
              Importer
            </Button>
            <Button variant="outline" onClick={printSelectedLabels}>
              <Barcode className="mr-2 h-4 w-4" />
              Étiquettes
            </Button>
            <Button onClick={openNew} className="bg-gradient-primary shadow-elegant">
              <Plus className="mr-2 h-4 w-4" />
              Nouveau produit
            </Button>
          </div>
        }
      />

      <Card className="shadow-soft">
        <CardContent className="p-0">
          <div className="flex items-center gap-2 border-b border-border p-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Rechercher par nom, SKU, code-barres…"
                className="pl-9"
              />
            </div>
            {selectedProducts.length > 0 && (
              <div className="flex gap-2">
                <span className="text-xs text-muted-foreground self-center">
                  {selectedProducts.length} sélectionné(s)
                </span>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={removeSelected}
                  disabled={importing}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Supprimer sélection
                </Button>
              </div>
            )}
            {filtered.length > 0 && selectedProducts.length === 0 && (
              <Button variant="destructive" size="sm" onClick={removeAll} disabled={importing}>
                <Trash2 className="mr-2 h-4 w-4" />
                Tout supprimer
              </Button>
            )}
          </div>

          {filtered.length === 0 && !importPreview ? (
            <EmptyState
              icon={Package}
              title="Aucun produit"
              description="Ajoutez un produit ou importez votre catalogue depuis Excel."
              action={
                <Button onClick={openNew} className="bg-gradient-primary">
                  <Plus className="mr-2 h-4 w-4" />
                  Ajouter
                </Button>
              }
            />
          ) : importPreview && step === "mapping" ? (
            // ÉTAPE 1 : Mapping des colonnes
            <div className="flex flex-col">
              <div className="flex items-center justify-between border-b border-border bg-muted/30 p-4">
                <div>
                  <h3 className="font-display text-lg font-semibold">
                    Étape 1 : Associer les colonnes
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {importPreview.rows.length} lignes × {importPreview.columns.length} colonnes —{" "}
                    {importPreview.file.name}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setImportPreview(null);
                      setStep("preview");
                    }}
                  >
                    Annuler
                  </Button>
                  <Button
                    onClick={() => setStep("preview")}
                    disabled={importing}
                    className="bg-gradient-primary"
                  >
                    <ArrowRight className="mr-2 h-4 w-4" />
                    Voir l'aperçu
                  </Button>
                </div>
              </div>

              <div className="p-4">
                <p className="mb-4 text-sm">
                  Pour chaque colonne de votre fichier, indiquez à quel champ elle correspond :
                </p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {importPreview.columns.map((col) => (
                    <div
                      key={col}
                      className="flex flex-col gap-1.5 rounded-lg border border-border bg-white p-3 shadow-sm"
                    >
                      <Label className="text-xs text-muted-foreground">
                        Colonne : <strong className="text-foreground">{col}</strong>
                      </Label>
                      <Select
                        value={colMapping[col] || "ignore"}
                        onValueChange={(v) => updateMapping(col, v)}
                      >
                        <SelectTrigger className="h-9 text-sm">
                          <SelectValue placeholder="Choisir..." />
                        </SelectTrigger>
                        <SelectContent>
                          {FIELD_OPTIONS.map((opt) => (
                            <SelectItem
                              key={opt.value}
                              value={opt.value}
                              className={opt.value === "ignore" ? "text-muted-foreground" : ""}
                            >
                              {opt.value === colMapping[col] && (
                                <CheckCircle2 className="mr-2 h-3.5 w-3.5 inline text-primary" />
                              )}
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="text-xs text-muted-foreground truncate">
                        Ex: "{String(importPreview.rows[0]?.[col] ?? "").slice(0, 50)}"
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm">
                  <strong className="text-green-800">Mapping actuel :</strong>
                  <div className="mt-1 grid grid-cols-2 gap-1 text-xs text-green-700">
                    {Object.entries(colMapping)
                      .filter(([_, v]) => v !== "ignore")
                      .map(([col, field]) => {
                        const label = FIELD_OPTIONS.find((f) => f.value === field)?.label || field;
                        return (
                          <div key={col}>
                            <strong>{label}</strong> ← {col}
                          </div>
                        );
                      })}
                  </div>
                  {!Object.values(colMapping).includes("name") && (
                    <p className="mt-2 text-amber-600 font-medium">
                      ⚠ Vous devez associer une colonne au "Nom du produit"
                    </p>
                  )}
                </div>

                <div className="mt-4 flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setImportPreview(null);
                      setStep("preview");
                    }}
                  >
                    Annuler
                  </Button>
                  <Button
                    onClick={() => setStep("preview")}
                    disabled={!Object.values(colMapping).includes("name")}
                    className="bg-gradient-primary"
                  >
                    <ArrowRight className="mr-2 h-4 w-4" />
                    Voir l'aperçu
                  </Button>
                </div>
              </div>
            </div>
          ) : importPreview && step === "preview" ? (
            // ÉTAPE 2 : Aperçu avant import
            <div className="flex flex-col">
              <div className="flex items-center justify-between border-b border-border bg-muted/30 p-4">
                <div>
                  <h3 className="font-display text-lg font-semibold">
                    Étape 2 : Aperçu avant import
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Vérifiez que les données sont correctement associées
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep("mapping")}>
                    Modifier le mapping
                  </Button>
                  <Button
                    onClick={confirmImport}
                    disabled={importing}
                    className="bg-gradient-primary"
                  >
                    {importing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Importer {importPreview.rows.length} produits
                  </Button>
                </div>
              </div>

              <div className="border-b border-border bg-white p-4">
                <p className="mb-2 text-sm font-medium">
                  Aperçu des données ({Math.min(5, importPreview.rows.length)} premières lignes) :
                </p>
                <div className="overflow-x-auto rounded-lg border border-border">
                  <table className="min-w-full divide-y divide-border">
                    <thead className="bg-slate-800">
                      <tr>
                        {Object.entries(colMapping)
                          .filter(([_, v]) => v !== "ignore")
                          .map(([col, field]) => {
                            const label =
                              FIELD_OPTIONS.find((f) => f.value === field)?.label || field;
                            return (
                              <th
                                key={col}
                                className="px-4 py-2.5 text-left text-xs font-bold text-white uppercase"
                              >
                                {label}
                              </th>
                            );
                          })}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border bg-white">
                      {previewMappedData().map((row, i) => (
                        <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                          {Object.entries(colMapping)
                            .filter(([_, v]) => v !== "ignore")
                            .map(([col]) => (
                              <td key={col} className="px-4 py-2 text-sm font-mono">
                                {String(row[col] ?? "")}
                              </td>
                            ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {importPreview.rows.length > 5 && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    …et {importPreview.rows.length - 5} lignes supplémentaires
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-4">
                <div className="rounded-lg border border-border bg-white p-3 text-center">
                  <p className="text-2xl font-bold text-primary">{importPreview.rows.length}</p>
                  <p className="text-xs text-muted-foreground">Produits détectés</p>
                </div>
                <div className="rounded-lg border border-border bg-white p-3 text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {importPreview.columns.length}
                  </p>
                  <p className="text-xs text-muted-foreground">Colonnes mappées</p>
                </div>
                <div className="rounded-lg border border-border bg-white p-3 text-center">
                  <p className="text-2xl font-bold text-amber-600">
                    {
                      importPreview.rows.filter((r) => {
                        const nameCol = Object.entries(colMapping).find(
                          ([_, v]) => v === "name",
                        )?.[0];
                        return nameCol ? !String(r[nameCol] ?? "").trim() : true;
                      }).length
                    }
                  </p>
                  <p className="text-xs text-muted-foreground">Sans nom</p>
                </div>
                <div className="rounded-lg border border-border bg-white p-3 text-center">
                  <p className="text-2xl font-bold text-blue-600">
                    {
                      importPreview.rows.filter((r) => {
                        const priceCol = Object.entries(colMapping).find(
                          ([_, v]) => v === "sale_price",
                        )?.[0];
                        return priceCol ? Number(r[priceCol]) > 0 : false;
                      }).length
                    }
                  </p>
                  <p className="text-xs text-muted-foreground">Avec prix</p>
                </div>
              </div>
            </div>
          ) : (
            // TABLEAU PRODUITS - Style Excel avec toutes les colonnes
            <div className="overflow-x-auto rounded-lg border border-slate-300">
              <Table className="[&_th]:border-r [&_th]:border-r-slate-600 [&_td]:border-r [&_td]:border-r-slate-200 [&_th:last-child]:border-r-0 [&_td:last-child]:border-r-0 [&_td]:px-4 [&_td]:py-3">
                <TableHeader>
                  <TableRow className="bg-slate-800 hover:bg-slate-800">
                    <TableHead className="w-10 text-white font-bold">
                      <Checkbox
                        checked={filtered.length > 0 && selectedProducts.length === filtered.length}
                        onCheckedChange={(v) => {
                          const newSel: Record<string, boolean> = {};
                          if (v)
                            filtered.forEach((p) => {
                              newSel[p.id] = true;
                            });
                          setSelected(newSel);
                        }}
                      />
                    </TableHead>
                    <TableHead className="text-white font-bold min-w-[150px] md:min-w-[200px]">
                      Nom
                    </TableHead>
                    <TableHead className="text-white font-bold hidden md:table-cell min-w-[120px]">
                      Catégorie
                    </TableHead>
                    <TableHead className="text-white font-bold hidden sm:table-cell min-w-[120px]">
                      Référence
                    </TableHead>
                    <TableHead className="text-white font-bold hidden lg:table-cell min-w-[120px]">
                      Code-barres
                    </TableHead>
                    <TableHead className="text-white font-bold text-right hidden md:table-cell min-w-[100px]">
                      Prix achat
                    </TableHead>
                    <TableHead className="text-white font-bold text-right min-w-[100px]">
                      Prix vente
                    </TableHead>
                    <TableHead className="text-white font-bold text-right min-w-[80px]">
                      Stock
                    </TableHead>
                    <TableHead className="text-white font-bold hidden sm:table-cell min-w-[80px]">
                      Unité
                    </TableHead>
                    <TableHead className="text-white font-bold hidden md:table-cell min-w-[80px]">
                      Statut
                    </TableHead>
                    <TableHead className="text-white font-bold w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((p, idx) => (
                    <TableRow
                      key={p.id}
                      className={`
                      ${idx % 2 === 0 ? "bg-white" : "bg-slate-50"}
                      hover:bg-blue-50 transition-colors
                      border-b border-slate-200
                    `}
                    >
                      <TableCell>
                        <Checkbox
                          checked={!!selected[p.id]}
                          onCheckedChange={(v) => setSelected((s) => ({ ...s, [p.id]: !!v }))}
                        />
                      </TableCell>
                      <TableCell className="font-medium text-slate-900">
                        <div className="flex items-center gap-2.5">
                          {p.image_url ? (
                            <img
                              src={p.image_url}
                              alt=""
                              className="h-9 w-9 shrink-0 rounded-lg border border-slate-200 object-cover"
                            />
                          ) : (
                            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-slate-100">
                              <Package className="h-4 w-4 text-slate-400" />
                            </div>
                          )}
                          <span>{p.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-600 text-xs hidden md:table-cell">
                        {catPath(p.category_id) ?? p.category ?? "—"}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-slate-500 hidden sm:table-cell">
                        {p.sku ?? "—"}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-slate-500 hidden lg:table-cell">
                        {p.barcode ?? "—"}
                      </TableCell>
                      <TableCell className="text-right font-mono text-slate-600 hidden md:table-cell">
                        {fmtMoney(p.cost_price, current?.currency)}
                      </TableCell>
                      <TableCell className="text-right font-mono font-semibold text-slate-900">
                        {fmtMoney(p.sale_price, current?.currency)}
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={`font-mono font-semibold ${p.stock < 5 ? "text-red-600" : "text-green-700"}`}
                        >
                          {p.stock}
                        </span>
                      </TableCell>
                      <TableCell className="text-slate-600 text-xs hidden sm:table-cell">
                        {p.unit}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge
                          variant={p.is_active ? "default" : "secondary"}
                          className={
                            p.is_active ? "bg-green-100 text-green-800 hover:bg-green-200" : ""
                          }
                        >
                          {p.is_active ? "Actif" : "Inactif"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openEdit(p)}
                            title="Modifier"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-700"
                            onClick={() => remove(p.id)}
                            title="Supprimer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filtered.length === 0 && q && (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  Aucun produit trouvé pour "{q}"
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog produit - Formulaire compact, hauteur limitée, sections visibles */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="flex max-h-[92vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl">
          <DialogHeader className="shrink-0 px-6 pb-2 pt-6">
            <DialogTitle className="font-display">
              {editing ? "Modifier" : "Nouveau"} produit
            </DialogTitle>
          </DialogHeader>
          <div className="grid min-h-0 flex-1 grid-cols-2 content-start gap-4 overflow-y-auto px-6 py-4 md:grid-cols-3">
            <div className="col-span-2 space-y-1.5">
              <Label>Nom *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Nom du produit"
                className="h-10"
              />
            </div>

            {/* Photo compacte */}
            <div className="space-y-1.5">
              <Label>Photo</Label>
              <input
                ref={imgRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) uploadImage(f);
                  e.target.value = "";
                }}
              />
              <div className="flex items-center gap-2">
                {form.image_url ? (
                  <div className="relative shrink-0">
                    <img
                      src={form.image_url}
                      alt="aperçu"
                      className="h-10 w-10 rounded-lg border border-border object-cover"
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="destructive"
                      className="absolute -right-1.5 -top-1.5 h-5 w-5 rounded-full"
                      onClick={() => setForm({ ...form, image_url: "" })}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-dashed border-border bg-secondary/30">
                    <ImagePlus className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-10 flex-1"
                  disabled={imgBusy}
                  onClick={() => imgRef.current?.click()}
                >
                  {imgBusy ? (
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="mr-1.5 h-4 w-4" />
                  )}
                  {form.image_url ? "Changer" : "Photo"}
                </Button>
              </div>
            </div>

            <div className="col-span-2 space-y-1.5 md:col-span-2">
              <Label>Catégorie</Label>
              {cats.length === 0 ? (
                <>
                  <Input value="" disabled placeholder="Aucune catégorie créée" />
                  <p className="text-xs text-muted-foreground">
                    Créez d'abord vos catégories (avec sous-catégories) dans la page{" "}
                    <Link to="/categories" className="underline font-medium">
                      Catégories
                    </Link>
                    .
                  </p>
                </>
              ) : (
                <Select
                  value={form.category_id || "none"}
                  onValueChange={(v) => setForm({ ...form, category_id: v === "none" ? "" : v })}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Choisir…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— Aucune catégorie —</SelectItem>
                    {(() => {
                      const byId = new Map(cats.map((c) => [c.id, c]));
                      const roots = cats.filter((c) => !c.parent_id || !byId.has(c.parent_id));
                      const childrenOf = (id: string) => cats.filter((c) => c.parent_id === id);
                      return roots.map((root) => {
                        const kids = childrenOf(root.id);
                        return (
                          <SelectGroup key={root.id}>
                            <SelectLabel>{root.name}</SelectLabel>
                            <SelectItem value={root.id}>
                              {root.name}
                              {kids.length > 0 ? " (catégorie générale)" : ""}
                            </SelectItem>
                            {kids.map((k) => (
                              <SelectItem key={k.id} value={k.id} className="pl-8">
                                {k.name}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        );
                      });
                    })()}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Référence</Label>
              <Input
                value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
                placeholder="auto si vide"
                className="h-10"
              />
            </div>

            <div className="col-span-2 space-y-1.5 md:col-span-3">
              <Label>Code-barres</Label>
              <div className="flex gap-2">
                <Input
                  value={form.barcode}
                  onChange={(e) => setForm({ ...form, barcode: e.target.value })}
                  placeholder="Scannez ou générez"
                  className="h-10 flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 shrink-0"
                  onClick={() => setScanOpen(true)}
                  title="Scanner"
                >
                  <ScanLine className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 shrink-0"
                  onClick={generateBarcode}
                  title="Générer un code-barres"
                >
                  <Barcode className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="col-span-2 -mb-1 mt-1 border-t border-border pt-3 text-xs font-bold uppercase tracking-wider text-muted-foreground md:col-span-3">
              Prix & stock
            </div>
            <div className="space-y-1.5">
              <Label>Prix d'achat</Label>
              <Input
                type="number"
                value={form.cost_price}
                onChange={(e) => setForm({ ...form, cost_price: +e.target.value })}
                className="h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Prix de vente</Label>
              <Input
                type="number"
                value={form.sale_price}
                onChange={(e) => setForm({ ...form, sale_price: +e.target.value })}
                className="h-10"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label>Stock</Label>
                <Input
                  type="number"
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: +e.target.value })}
                  className="h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Unité</Label>
                <Input
                  value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value })}
                  placeholder="kg, sac…"
                  className="h-10"
                />
              </div>
            </div>

            <div className="col-span-2 -mb-1 mt-1 border-t border-border pt-3 text-xs font-bold uppercase tracking-wider text-muted-foreground md:col-span-3">
              Caractéristiques
            </div>
            <div className="space-y-1.5">
              <Label>Fournisseur</Label>
              <Input
                value={form.supplier}
                onChange={(e) => setForm({ ...form, supplier: e.target.value })}
                placeholder="Fournisseur"
                className="h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Marque</Label>
              <Input
                value={form.brand}
                onChange={(e) => setForm({ ...form, brand: e.target.value })}
                placeholder="Marque"
                className="h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Taille</Label>
              <Input
                value={form.size}
                onChange={(e) => setForm({ ...form, size: e.target.value })}
                placeholder="M, XL, 42…"
                className="h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Poids</Label>
              <Input
                value={form.weight}
                onChange={(e) => setForm({ ...form, weight: e.target.value })}
                placeholder="1,5 kg"
                className="h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Couleur</Label>
              <Input
                value={form.color}
                onChange={(e) => setForm({ ...form, color: e.target.value })}
                placeholder="Couleur"
                className="h-10"
              />
            </div>
            <div className="col-span-2 space-y-1.5 md:col-span-3">
              <Label>Description</Label>
              <Textarea
                rows={2}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Description du produit…"
              />
            </div>

            <div className="col-span-2 -mb-1 mt-1 border-t border-border pt-3 text-xs font-bold uppercase tracking-wider text-muted-foreground md:col-span-3">
              Péremption & promotion
            </div>
            <div className="space-y-1.5">
              <Label>Date de péremption</Label>
              <Input
                type="date"
                value={form.expiry_date}
                onChange={(e) => setForm({ ...form, expiry_date: e.target.value })}
                className="h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label>N° de lot</Label>
              <Input
                value={form.batch_label}
                onChange={(e) => setForm({ ...form, batch_label: e.target.value })}
                placeholder="Ex : LOT-2026-A"
                className="h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Prix promo (vide = pas de promo)</Label>
              <Input
                type="number"
                min="0"
                value={form.promo_price || ""}
                onChange={(e) => setForm({ ...form, promo_price: +e.target.value })}
                placeholder="Ex : 700"
                className="h-10"
              />
            </div>
            <div className="col-span-2 grid grid-cols-2 gap-2 md:col-span-3">
              <div className="space-y-1.5">
                <Label>Promo du</Label>
                <Input
                  type="date"
                  value={form.promo_start}
                  onChange={(e) => setForm({ ...form, promo_start: e.target.value })}
                  className="h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label>au</Label>
                <Input
                  type="date"
                  value={form.promo_end}
                  onChange={(e) => setForm({ ...form, promo_end: e.target.value })}
                  className="h-10"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground md:col-span-3">
              💡 La promo s'applique automatiquement à la caisse pendant la période (et un badge «
              Promo » barré du prix normal s'affiche). La date de péremption alimente les alertes de
              la page Stock.
            </p>
          </div>
          <DialogFooter className="m-0 shrink-0 border-t border-border px-6 py-4">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button onClick={save} className="bg-gradient-primary shadow-elegant">
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BarcodeScanner
        open={scanOpen}
        onOpenChange={setScanOpen}
        onDetected={(code) => {
          if (open) {
            setForm((f) => ({ ...f, barcode: code.trim() }));
            toast.success(`Code-barres : ${code.trim()}`);
          } else onScan(code);
        }}
      />
      <PhoneScanner open={phoneScanOpen} onOpenChange={setPhoneScanOpen} onDetected={onScan} />

      {/* Saisie tableau */}
      <Dialog open={sheetOpen} onOpenChange={setSheetOpen}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle className="font-display">Saisie tableau (comme Excel)</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground">
            Remplissez les lignes ci-dessous. Les SKU sont générés automatiquement.
          </p>
          <div className="max-h-[55vh] overflow-auto rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[220px]">Nom *</TableHead>
                  <TableHead className="w-32 text-right">Prix achat</TableHead>
                  <TableHead className="w-32 text-right">Prix vente</TableHead>
                  <TableHead className="w-24 text-right">Stock</TableHead>
                  <TableHead className="w-28">Unité</TableHead>
                  <TableHead className="w-40">Code-barres</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sheetRows.map((r, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Input
                        value={r.name}
                        onChange={(e) =>
                          setSheetRows((rows) =>
                            rows.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)),
                          )
                        }
                        placeholder="Nom"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        className="text-right"
                        value={r.cost_price}
                        onChange={(e) =>
                          setSheetRows((rows) =>
                            rows.map((x, j) =>
                              j === i ? { ...x, cost_price: +e.target.value } : x,
                            ),
                          )
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        className="text-right"
                        value={r.sale_price}
                        onChange={(e) =>
                          setSheetRows((rows) =>
                            rows.map((x, j) =>
                              j === i ? { ...x, sale_price: +e.target.value } : x,
                            ),
                          )
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        className="text-right"
                        value={r.stock}
                        onChange={(e) =>
                          setSheetRows((rows) =>
                            rows.map((x, j) => (j === i ? { ...x, stock: +e.target.value } : x)),
                          )
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={r.unit}
                        onChange={(e) =>
                          setSheetRows((rows) =>
                            rows.map((x, j) => (j === i ? { ...x, unit: e.target.value } : x)),
                          )
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={r.barcode}
                        onChange={(e) =>
                          setSheetRows((rows) =>
                            rows.map((x, j) => (j === i ? { ...x, barcode: e.target.value } : x)),
                          )
                        }
                        placeholder="(optionnel)"
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSheetRows((rows) => rows.filter((_, j) => j !== i))}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="flex justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setSheetRows((rows) => [
                  ...rows,
                  { name: "", cost_price: 0, sale_price: 0, stock: 0, unit: "unité", barcode: "" },
                ])
              }
            >
              <Plus className="mr-2 h-4 w-4" />
              Ajouter une ligne
            </Button>
            <span className="text-xs text-muted-foreground self-center">
              {sheetRows.filter((r) => r.name.trim()).length} produit(s)
            </span>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setSheetOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={saveSheet}
              disabled={sheetSaving}
              className="bg-gradient-primary shadow-elegant"
            >
              {sheetSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Enregistrer tout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function shopSkuPrefix(name: string): string {
  const letters = name
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .slice(0, 3);
  return letters.length >= 2 ? letters : "PRD";
}
