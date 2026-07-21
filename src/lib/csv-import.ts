import * as XLSX from "xlsx";

export type ImportRow = {
  name: string;
  category?: string;
  cost_price?: number;
  sale_price?: number;
  stock?: number;
  sku?: string;
  supplier?: string;
  barcode?: string;
  unit?: string;
};

const HEADERS = [
  "Nom",
  "Categorie",
  "Prix d'achat",
  "Prix de vente",
  "Stock",
  "Reference",
  "Fournisseur",
  "Code-barres",
  "Unite",
];

export function downloadTemplate() {
  const ws = XLSX.utils.aoa_to_sheet([
    HEADERS,
    ["Riz parfumé 5kg", "Alimentation", 4500, 5500, 20, "", "SOSUCO", "", "sac"],
    ["Savon Lux 90g", "Hygiène", 250, 400, 100, "", "", "", "unité"],
    [
      "Ciment CIMFASO 50kg",
      "Matériaux",
      5200,
      6500,
      40,
      "CIM-001",
      "CIMFASO",
      "6191234567890",
      "sac",
    ],
  ]);
  ws["!cols"] = HEADERS.map(() => ({ wch: 22 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Produits");
  XLSX.writeFile(wb, "boutikbf-modele-produits.xlsx");
}

function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

// Détection intelligente des colonnes par similarité de nom
function detectColumn(
  rowKeys: { original: string; normalized: string }[],
  patterns: string[],
): string | null {
  for (const p of patterns) {
    const np = normalize(p);
    // Match exact
    const exact = rowKeys.find((rk) => rk.normalized === np);
    if (exact) return exact.original;
    // Match partiel (contient)
    const partial = rowKeys.find((rk) => rk.normalized.includes(np) || np.includes(rk.normalized));
    if (partial) return partial.original;
  }
  return null;
}

// Détection automatique des colonnes par analyse du contenu
export function autoDetectColumns(rows: Record<string, any>[]): {
  name: string | null;
  cost_price: string | null;
  sale_price: string | null;
  stock: string | null;
  sku: string | null;
  barcode: string | null;
} {
  if (rows.length === 0)
    return {
      name: null,
      cost_price: null,
      sale_price: null,
      stock: null,
      sku: null,
      barcode: null,
    };
  const keys = Object.keys(rows[0]);
  const result: any = {
    name: null,
    cost_price: null,
    sale_price: null,
    stock: null,
    sku: null,
    barcode: null,
  };

  // Analyser chaque colonne pour deviner son type
  for (const key of keys) {
    const values = rows.slice(0, 30).map((r) => r[key]);
    const stringVals = values.filter((v) => typeof v === "string" && v.trim().length > 0);
    const numVals = values.filter(
      (v) => typeof v === "number" || (!isNaN(Number(v)) && String(v).trim().length > 0),
    );
    const isNumeric = numVals.length > values.length * 0.5;
    const avgLen = stringVals.reduce((a, v) => a + v.trim().length, 0) / (stringVals.length || 1);

    if (!isNumeric && avgLen > 5 && !result.name) {
      // Colonne texte longue → probablement le nom du produit
      result.name = key;
    } else if (isNumeric) {
      const nums = numVals.map((v) => Number(v)).filter((n) => !isNaN(n) && n >= 0);
      if (nums.length === 0) continue;
      const max = Math.max(...nums);
      const min = Math.min(...nums);
      const avg = nums.reduce((a, v) => a + v, 0) / nums.length;

      // Prix de vente : nombres élevés (1000+)
      if (max > 1000 && avg > 500 && !result.sale_price) {
        result.sale_price = key;
      }
      // Prix d'achat : nombres moyens (100-1000)
      else if (max > 100 && avg > 50 && !result.cost_price) {
        result.cost_price = key;
      }
      // Stock : petits entiers (0-1000)
      else if (max < 10000 && !result.stock) {
        result.stock = key;
      }
    }
  }

  return result;
}

export async function parseFile(file: File): Promise<ImportRow[]> {
  const buf = await file.arrayBuffer();
  let wb: XLSX.WorkBook;
  try {
    wb = XLSX.read(buf, { type: "array", cellDates: true, cellText: false });
  } catch {
    throw new Error(
      "Impossible de lire le fichier. Assurez-vous que c'est un fichier Excel (.xlsx) valide.",
    );
  }
  if (!wb.SheetNames || wb.SheetNames.length === 0) {
    throw new Error("Le fichier ne contient aucune feuille de calcul.");
  }
  const ws = wb.Sheets[wb.SheetNames[0]];
  if (!ws || !ws["!ref"]) {
    throw new Error("La feuille de calcul est vide.");
  }
  const raw = XLSX.utils.sheet_to_json<Record<string, any>>(ws, { defval: "", header: 1 });

  // Si le format est un tableau simple (pas d'en-têtes détectés)
  if (raw.length > 0 && Array.isArray(raw[0])) {
    const rows = raw as any[][];
    // Chercher la première ligne qui ressemble à des en-têtes
    let headerRow = 0;
    for (let i = 0; i < Math.min(5, rows.length); i++) {
      const row = rows[i];
      const textCount = row.filter((c: any) => typeof c === "string" && c.trim().length > 0).length;
      if (textCount >= 3) {
        headerRow = i;
        break;
      }
    }

    // Convertir en format objet
    const headers = rows[headerRow].map((h: any) => String(h).trim());
    const dataRows = rows
      .slice(headerRow + 1)
      .filter((r: any[]) => r.some((c: any) => String(c).trim().length > 0));

    const objects = dataRows.map((r: any[]) => {
      const obj: Record<string, any> = {};
      headers.forEach((h: string, i: number) => {
        obj[h] = r[i] ?? "";
      });
      return obj;
    });

    return parseObjects(objects);
  }

  // Format standard avec en-têtes
  const objects = XLSX.utils.sheet_to_json<Record<string, any>>(ws, { defval: "" });
  return parseObjects(objects);
}

function parseObjects(raw: Record<string, any>[]): ImportRow[] {
  if (raw.length === 0) {
    throw new Error("Aucune donnée trouvée dans le fichier.");
  }

  const rowKeys = Object.keys(raw[0]).map((k) => ({ original: k, normalized: normalize(k) }));

  // 1. Essayer par nom de colonne
  const nameCol = detectColumn(rowKeys, [
    "Nom",
    "Name",
    "Produit",
    "Product",
    "Article",
    "Designation",
    "Désignation",
    "Libelle",
    "Libellé",
    "Description",
    "Intitule",
    "Intitulé",
  ]);
  const categoryCol = detectColumn(rowKeys, [
    "Categorie",
    "Catégorie",
    "Category",
    "Famille",
    "Rayon",
    "Groupe",
  ]);
  const costCol = detectColumn(rowKeys, [
    "Prix d'achat",
    "Prix achat",
    "Cost",
    "Cost price",
    "Prixachat",
    "Cout",
    "Coût",
    "PA",
    "PrixAchat",
    "CoutAchat",
  ]);
  const saleCol = detectColumn(rowKeys, [
    "Prix de vente",
    "Prix vente",
    "Price",
    "Sale price",
    "Prixvente",
    "Prix",
    "PV",
    "PrixVente",
    "PrixPublic",
  ]);
  const stockCol = detectColumn(rowKeys, [
    "Stock",
    "Quantite",
    "Quantité",
    "Quantity",
    "Qte",
    "Qté",
    "StockDispo",
    "Disponible",
    "EnStock",
  ]);
  const skuCol = detectColumn(rowKeys, [
    "Reference",
    "Référence",
    "SKU",
    "Ref",
    "Code",
    "CodeProduit",
    "RefProduit",
  ]);
  const supplierCol = detectColumn(rowKeys, [
    "Fournisseur",
    "Supplier",
    "Fournisseurproduit",
    "Frs",
    "Distributeur",
  ]);
  const barcodeCol = detectColumn(rowKeys, [
    "Code-barres",
    "Code barres",
    "Barcode",
    "EAN",
    "Codebarre",
    "Codeabarres",
    "Barre",
    "CodeBarre",
    "EAN13",
    "UPC",
  ]);
  const unitCol = detectColumn(rowKeys, [
    "Unite",
    "Unité",
    "Unit",
    "Unitevente",
    "Conditionnement",
    "Emballage",
  ]);

  // 2. Si pas trouvé par nom, essayer par analyse du contenu
  const auto = !nameCol ? autoDetectColumns(raw) : null;

  const rows = raw
    .map((r) => ({
      name: String(r[nameCol || auto?.name || Object.keys(r)[0]] ?? "").trim(),
      category: categoryCol ? String(r[categoryCol] ?? "").trim() || undefined : undefined,
      cost_price: Number(r[costCol || auto?.cost_price || ""] ?? 0) || 0,
      sale_price: Number(r[saleCol || auto?.sale_price || ""] ?? 0) || 0,
      stock: Number(r[stockCol || auto?.stock || ""] ?? 0) || 0,
      sku: skuCol ? String(r[skuCol] ?? "").trim() || undefined : undefined,
      supplier: supplierCol ? String(r[supplierCol] ?? "").trim() || undefined : undefined,
      barcode: barcodeCol ? String(r[barcodeCol] ?? "").trim() || undefined : undefined,
      unit: unitCol ? String(r[unitCol] ?? "").trim() || undefined : undefined,
    }))
    .filter((r) => r.name.length > 0);

  if (rows.length === 0) {
    throw new Error(
      "Aucun produit trouvé. Vérifiez que le fichier contient une colonne avec les noms des produits " +
        "(ex: 'Nom', 'Produit', 'Article', 'Désignation').",
    );
  }
  return rows;
}

export function generateSku(prefix: string, index: number): string {
  return `${prefix}-${String(index).padStart(6, "0")}`;
}

// Retourne les colonnes et lignes brutes sans transformation
export async function parseFileRaw(
  file: File,
): Promise<{ columns: string[]; rows: Record<string, any>[] }> {
  const buf = await file.arrayBuffer();
  let wb: XLSX.WorkBook;
  try {
    wb = XLSX.read(buf, { type: "array", cellDates: true, cellText: false });
  } catch {
    throw new Error(
      "Impossible de lire le fichier. Assurez-vous que c'est un fichier Excel (.xlsx) valide.",
    );
  }
  if (!wb.SheetNames || wb.SheetNames.length === 0) {
    throw new Error("Le fichier ne contient aucune feuille de calcul.");
  }
  const ws = wb.Sheets[wb.SheetNames[0]];
  if (!ws || !ws["!ref"]) {
    throw new Error("La feuille de calcul est vide.");
  }

  const raw = XLSX.utils.sheet_to_json<Record<string, any>>(ws, { defval: "", header: 1 });

  if (raw.length === 0) {
    throw new Error("Le fichier est vide.");
  }

  // Si c'est un tableau de tableaux (format CSV/Excel simple)
  if (Array.isArray(raw[0])) {
    const rows = raw as any[][];
    // Trouver la ligne d'en-tête (première ligne avec du texte)
    let headerRow = 0;
    for (let i = 0; i < Math.min(5, rows.length); i++) {
      const row = rows[i];
      const textCount = row.filter((c: any) => typeof c === "string" && c.trim().length > 0).length;
      if (textCount >= 2) {
        headerRow = i;
        break;
      }
    }

    const headers = rows[headerRow].map((h: any) => String(h).trim());
    const dataRows = rows
      .slice(headerRow + 1)
      .filter((r: any[]) => r.some((c: any) => String(c).trim().length > 0))
      .map((r: any[]) => {
        const obj: Record<string, any> = {};
        headers.forEach((h: string, i: number) => {
          obj[h] = r[i] ?? "";
        });
        return obj;
      });

    return { columns: headers, rows: dataRows };
  }

  // Format standard avec objets
  const objects = XLSX.utils.sheet_to_json<Record<string, any>>(ws, { defval: "" });
  if (objects.length === 0) {
    throw new Error("Aucune donnée trouvée dans le fichier.");
  }

  return { columns: Object.keys(objects[0]), rows: objects };
}

// Trouve une colonne par nom (insensible à la casse, ignore accents)
export function findColumn(columns: string[], possibleNames: string[]): string | null {
  const normalizedCols = columns.map((c) => ({
    original: c,
    normalized: c
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, ""),
  }));

  for (const name of possibleNames) {
    const normalized = name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "");
    // Match exact
    const exact = normalizedCols.find((c) => c.normalized === normalized);
    if (exact) return exact.original;
    // Match partiel
    const partial = normalizedCols.find(
      (c) => c.normalized.includes(normalized) || normalized.includes(c.normalized),
    );
    if (partial) return partial.original;
  }

  return null;
}
