import { toast } from "sonner";
import { PRO_ONLY_MESSAGE } from "@/lib/plans";

export function toCsv(rows: Record<string, any>[], headers?: string[]): string {
  if (rows.length === 0) return headers?.join(",") ?? "";
  const cols = headers ?? Object.keys(rows[0]);
  const esc = (v: any) => {
    if (v === null || v === undefined) return "";
    const s = String(v);
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [cols.join(","), ...rows.map((r) => cols.map((c) => esc(r[c])).join(","))].join("\n");
}

// Fixé par le shell de l'app selon la formule (exports analytiques réservés au Pro).
let exportsAllowed = true;
export function setExportsAllowed(allowed: boolean) {
  exportsAllowed = allowed;
}

/**
 * `always: true` = sauvegarde des données du commerçant (toujours autorisée :
 * on ne retient jamais les données d'un client, quelle que soit sa formule).
 */
export function downloadCsv(
  filename: string,
  rows: Record<string, any>[],
  headers?: string[],
  opts?: { always?: boolean },
) {
  if (!exportsAllowed && !opts?.always) {
    toast.error(PRO_ONLY_MESSAGE);
    return;
  }
  const csv = toCsv(rows, headers);
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
