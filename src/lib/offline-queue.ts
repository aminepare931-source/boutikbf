// File d'attente hors-ligne des ventes : si le réseau tombe en pleine vente,
// la vente est stockée localement (IndexedDB) et rejouée au retour du réseau.
import { supabase } from "@/integrations/supabase/client";

export type PendingSale = {
  ref: string; // référence unique V-... (idempotence au rejeu)
  shop_id: string;
  cashier_id: string | null;
  employee_id?: string | null;
  customer_id?: string | null;
  customer_points_delta?: number;
  discount?: number;
  created_at: string;
  subtotal: number;
  total: number;
  payment_method: string;
  amount_paid: number | null;
  change_due: number;
  payments: { method: string; amount: number }[] | null;
  items: {
    product_id: string;
    name: string;
    quantity: number;
    unit_price: number;
    total: number;
  }[];
  queued_at: string;
};

const DB_NAME = "boutikbf-offline";
const STORE = "pending_sales";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "ref" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function queueSale(sale: PendingSale): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(sale);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function listPendingSales(shopId?: string): Promise<PendingSale[]> {
  const db = await openDb();
  const all: PendingSale[] = await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    tx.objectStore(STORE).getAll().onsuccess = (e) =>
      resolve((e.target as IDBRequest).result as PendingSale[]);
    tx.objectStore(STORE).getAll().onerror = () => reject(tx.error);
  });
  db.close();
  const filtered = shopId ? all.filter((s) => s.shop_id === shopId) : all;
  return filtered.sort((a, b) => a.queued_at.localeCompare(b.queued_at));
}

async function removePending(ref: string): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(ref);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

/** True si l'erreur vient du réseau (pas de la base). */
export function isNetworkError(e: unknown): boolean {
  if (e instanceof TypeError) return true; // fetch a échoué
  const msg = String((e as { message?: string })?.message ?? "").toLowerCase();
  return msg.includes("failed to fetch") || msg.includes("network") || msg.includes("load failed");
}

let replaying = false;

/** Rejoue la file, dans l'ordre. S'arrête si le réseau n'est toujours pas là. */
export async function replayPendingSales(): Promise<{ done: number; left: number }> {
  if (replaying) return { done: 0, left: (await listPendingSales()).length };
  replaying = true;
  let done = 0;
  try {
    const pending = await listPendingSales();
    for (const sale of pending) {
      if (!navigator.onLine) break;
      try {
        // 1. la vente (référence = clé d'idempotence ; on vérifie avant)
        const { data: existing } = await supabase
          .from("sales")
          .select("id")
          .eq("reference", sale.ref)
          .maybeSingle();
        if (!existing) {
          const { data: saleRow, error } = await supabase
            .from("sales")
            .insert({
              shop_id: sale.shop_id,
              cashier_id: sale.cashier_id,
              employee_id: sale.employee_id ?? null,
              customer_id: sale.customer_id ?? null,
              subtotal: sale.subtotal,
              discount: sale.discount ?? 0,
              total: sale.total,
              payment_method: sale.payment_method,
              amount_paid: sale.amount_paid,
              change_due: sale.change_due,
              payments: sale.payments ?? undefined,
              reference: sale.ref,
              created_at: sale.created_at,
            })
            .select()
            .single();
          if (error) throw error;

          const { error: itemsError } = await supabase.from("sale_items").insert(
            sale.items.map((i) => ({
              sale_id: saleRow.id,
              product_id: i.product_id,
              name: i.name,
              quantity: i.quantity,
              unit_price: i.unit_price,
              total: i.total,
            })),
          );
          if (itemsError) throw itemsError;

          // vente à crédit : la dette du client est ajoutée au rejeu
          if (sale.payment_method === "credit" && sale.customer_id) {
            const { data: cust } = await supabase
              .from("customers")
              .select("credit_balance")
              .eq("id", sale.customer_id)
              .maybeSingle();
            if (cust)
              await supabase
                .from("customers")
                .update({ credit_balance: Number(cust.credit_balance) + Number(sale.total) })
                .eq("id", sale.customer_id);
          }

          // fidélité : points gagnés/utilisés pendant la vente hors-ligne
          if (sale.customer_id && sale.customer_points_delta) {
            const { data: custPts } = await supabase
              .from("customers")
              .select("loyalty_points")
              .eq("id", sale.customer_id)
              .maybeSingle();
            if (custPts)
              await supabase
                .from("customers")
                .update({
                  loyalty_points: Math.max(
                    0,
                    Number(custPts.loyalty_points) + sale.customer_points_delta,
                  ),
                })
                .eq("id", sale.customer_id);
          }

          for (const i of sale.items) {
            await (
              supabase as never as {
                rpc: (fn: string, args: Record<string, unknown>) => Promise<{ error: unknown }>;
              }
            ).rpc("adjust_stock", { p_product_id: i.product_id, p_delta: -i.quantity });
            await supabase.from("stock_movements").insert({
              shop_id: sale.shop_id,
              product_id: i.product_id,
              type: "out",
              quantity: i.quantity,
              reason: "Vente " + sale.ref + " (hors-ligne)",
            });
          }
        }
        await removePending(sale.ref);
        done++;
      } catch (e) {
        if (isNetworkError(e)) break; // toujours hors-ligne : on réessaiera plus tard
        // erreur métier (ex: produit supprimé) : on retire quand même pour ne pas bloquer la file
        console.error("Rejeu vente impossible:", sale.ref, e);
        await removePending(sale.ref);
      }
    }
  } finally {
    replaying = false;
  }
  const left = (await listPendingSales()).length;
  return { done, left };
}
