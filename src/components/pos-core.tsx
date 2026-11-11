import { useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useShops, resolveLogoUrl } from "@/lib/shop-store";
import { PageHeader } from "@/components/page-parts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  Receipt,
  CreditCard,
  Smartphone,
  Banknote,
  ShoppingCart,
  ScanLine,
  PauseCircle,
  PlayCircle,
  MessageCircle,
  Printer,
  WifiOff,
  RefreshCw,
} from "lucide-react";
import { fmtMoney } from "@/lib/format";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { openReceipt } from "@/lib/receipt";
import { BarcodeScanner } from "@/components/barcode-scanner";
import { PhoneScanner } from "@/components/phone-scanner";
import {
  queueSale,
  listPendingSales,
  replayPendingSales,
  isNetworkError,
  type PendingSale,
} from "@/lib/offline-queue";
import { getEmployeeSession } from "@/lib/employee-session";

export type PosMode = "owner" | "employee";

type Product = {
  id: string;
  name: string;
  category_id?: string | null;
  category?: string;
  sale_price: number;
  stock: number;
  sku: string | null;
  barcode: string | null;
};
type CartItem = Product & { qty: number };

type HeldTicket = { id: string; at: string; cart: { id: string; name: string; qty: number }[] };

const heldKey = (shopId: string) => `boutikbf-held-${shopId}`;

function loadHeld(shopId: string): HeldTicket[] {
  try {
    return JSON.parse(localStorage.getItem(heldKey(shopId)) ?? "[]") as HeldTicket[];
  } catch {
    return [];
  }
}
function saveHeld(shopId: string, list: HeldTicket[]) {
  localStorage.setItem(heldKey(shopId), JSON.stringify(list));
}

const roundUpTo = (v: number, step: number) => Math.ceil(v / step) * step;

function receiptWhatsAppText(
  shopName: string,
  ref: string,
  items: { name: string; qty: number; total: number }[],
  total: number,
  currency: string,
  paymentLine: string,
  change?: number,
): string {
  const lines = [
    `🧾 *${shopName}*`,
    `Ticket ${ref}`,
    "",
    ...items.map((i) => `${i.name} ×${i.qty} : ${fmtMoney(i.total, currency)}`),
    "",
    `*Total : ${fmtMoney(total, currency)}*`,
    paymentLine,
    ...(change && change > 0 ? [`Monnaie rendue : ${fmtMoney(change, currency)}`] : []),
    "",
    "Merci de votre visite 🇧🇫",
  ];
  return lines.join("\n");
}

function PosCore({ mode }: { mode: PosMode }) {
  const { current, shops } = useShops();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [payment, setPayment] = useState("cash");
  const [processing, setProcessing] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);
  const [scanContinuous, setScanContinuous] = useState(false);
  const [phoneScanOpen, setPhoneScanOpen] = useState(false);

  // — paiement pro —
  const [received, setReceived] = useState("");
  const [mixCash, setMixCash] = useState("");
  const [mixRest, setMixRest] = useState("mobile");

  // — tickets en attente —
  const [held, setHeld] = useState<HeldTicket[]>([]);
  const [heldOpen, setHeldOpen] = useState(false);

  // — après vente —
  const [done, setDone] = useState<{
    ref: string;
    total: number;
    created_at: string;
    paymentLine: string;
    change: number;
    items: { name: string; qty: number; total: number }[];
  } | null>(null);

  // — hors-ligne —
  const [pending, setPending] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [online, setOnline] = useState(true);

  useEffect(() => {
    if (!current) return;

    const loadData = async () => {
      const [productRes, categoryRes] = await Promise.all([
        supabase
          .from("products")
          .select("id,name,sale_price,stock,sku,barcode,category_id,categories(name)")
          .eq("shop_id", current.id)
          .eq("is_active", true),
        supabase
          .from("categories")
          .select("id,name")
          .eq("shop_id", current.id)
          .order("sort_order", { ascending: true }),
      ]);

      const prods = (productRes.data ?? []) as Array<
        Product & { categories?: { name: string | null } | Array<{ name: string | null }> }
      >;

      setProducts(
        prods.map((p) => {
          const cats = p.categories;
          const categoryName = Array.isArray(cats)
            ? (cats[0]?.name ?? undefined)
            : (cats?.name ?? undefined);
          return {
            id: p.id,
            name: p.name,
            sale_price: p.sale_price,
            stock: p.stock,
            sku: p.sku,
            barcode: p.barcode,
            category_id: p.category_id,
            category: categoryName,
          };
        }),
      );
      setCategories((categoryRes.data ?? []) as { id: string; name: string }[]);
    };

    loadData();
    setHeld(loadHeld(current.id));
    listPendingSales(current.id).then((p) => setPending(p.length));
  }, [current?.id]);

  useEffect(() => {
    const goOnline = () => {
      setOnline(true);
      if (current) {
        setSyncing(true);
        replayPendingSales().then(({ done, left }) => {
          setSyncing(false);
          setPending(left);
          if (done > 0) toast.success(`${done} vente(s) hors-ligne synchronisée(s)`);
        });
      }
    };
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    setOnline(navigator.onLine);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, [current?.id]);

  const onScan = (code: string) => {
    const c = code.trim();
    const match = products.find((p) => p.barcode === c || p.sku === c);
    if (match) {
      if (match.stock <= 0) return toast.error(`${match.name} : rupture de stock`);
      add(match);
      toast.success(`Ajouté : ${match.name}`);
    } else if (mode === "owner") {
      navigate({ to: "/products", search: { barcode: c } });
      toast.info(`Code "${c}" non trouvé. Ajoutez-le comme nouveau produit.`);
    } else {
      setQ(c);
      toast.info(`Code "${c}" inconnu — recherche manuelle.`);
    }
  };

  const filtered = useMemo(
    () =>
      products
        .filter((p) =>
          (p.name + (p.sku ?? "") + (p.barcode ?? "") + (p.category ?? ""))
            .toLowerCase()
            .includes(q.toLowerCase()),
        )
        .filter((p) => (selectedCategory ? p.category_id === selectedCategory : true))
        .slice(0, 30),
    [products, q, selectedCategory],
  );

  const grouped = useMemo(() => {
    const groups = new Map<string, Product[]>();
    filtered.forEach((p) => {
      const key = p.category ?? "Sans catégorie";
      const list = groups.get(key) ?? [];
      list.push(p);
      groups.set(key, list);
    });
    return Array.from(groups.entries());
  }, [filtered]);

  const add = (p: Product) => {
    setCart((c) => {
      const ex = c.find((i) => i.id === p.id);
      if (ex) return c.map((i) => (i.id === p.id ? { ...i, qty: i.qty + 1 } : i));
      return [...c, { ...p, qty: 1 }];
    });
  };
  const inc = (id: string) =>
    setCart((c) => c.map((i) => (i.id === id ? { ...i, qty: i.qty + 1 } : i)));
  const dec = (id: string) =>
    setCart((c) =>
      c.flatMap((i) => (i.id === id ? (i.qty > 1 ? [{ ...i, qty: i.qty - 1 }] : []) : [i])),
    );
  const rm = (id: string) => setCart((c) => c.filter((i) => i.id !== id));

  const subtotal = cart.reduce((a, i) => a + i.sale_price * i.qty, 0);
  const cur = current?.currency ?? "XOF";

  // — monnaie & mixte —
  const receivedNum = Number(received || 0);
  const change = payment === "cash" && receivedNum >= subtotal ? receivedNum - subtotal : 0;
  const cashShort = payment === "cash" && receivedNum > 0 && receivedNum < subtotal;
  const mixCashNum = Number(mixCash || 0);
  const mixRestAmount = subtotal - mixCashNum;
  const mixValid = payment !== "mixed" || (mixCashNum > 0 && mixRestAmount > 0);

  const quickCash = [
    subtotal,
    roundUpTo(subtotal, 500),
    roundUpTo(subtotal, 1000),
    roundUpTo(subtotal, 2000),
    roundUpTo(subtotal, 5000),
    roundUpTo(subtotal, 10000),
  ]
    .filter((v, i, a) => v > 0 && a.indexOf(v) === i)
    .slice(0, 5);

  const paymentLine = useMemo(() => {
    if (payment === "cash") return `Paiement : espèces (${fmtMoney(receivedNum || subtotal, cur)})`;
    if (payment === "mixed")
      return `Paiement : ${fmtMoney(mixCashNum, cur)} espèces + ${fmtMoney(Math.max(0, mixRestAmount), cur)} ${mixRest === "mobile" ? "Mobile Money" : "carte"}`;
    if (payment === "mobile") return "Paiement : Mobile Money";
    return "Paiement : carte bancaire";
  }, [payment, receivedNum, mixCashNum, mixRestAmount, mixRest, cur, subtotal]);

  // — mise en attente —
  const holdCart = () => {
    if (!current || cart.length === 0) return;
    const t: HeldTicket = {
      id: "T-" + Date.now().toString(36).toUpperCase(),
      at: new Date().toISOString(),
      cart: cart.map((i) => ({ id: i.id, name: i.name, qty: i.qty })),
    };
    const next = [...held, t];
    setHeld(next);
    saveHeld(current.id, next);
    setCart([]);
    setReceived("");
    setMixCash("");
    toast.success("Ticket mis en attente");
  };
  const restoreHeld = (t: HeldTicket) => {
    const items: CartItem[] = [];
    for (const h of t.cart) {
      const p = products.find((x) => x.id === h.id);
      if (p) items.push({ ...p, qty: h.qty });
      else toast.error(`Produit disparu du catalogue : ${h.name}`);
    }
    setCart(items);
    const next = held.filter((x) => x.id !== t.id);
    setHeld(next);
    if (current) saveHeld(current.id, next);
    setHeldOpen(false);
  };
  const dropHeld = (id: string) => {
    const next = held.filter((x) => x.id !== id);
    setHeld(next);
    if (current) saveHeld(current.id, next);
  };

  const checkout = async () => {
    if (!current || cart.length === 0 || !mixValid) return;
    setProcessing(true);

    const ref = "V-" + Date.now().toString(36).toUpperCase();
    const createdAt = new Date().toISOString();
    const payments =
      payment === "mixed"
        ? [
            { method: "cash", amount: mixCashNum },
            { method: mixRest, amount: mixRestAmount },
          ]
        : null;
    const amountPaid = payment === "cash" && receivedNum > 0 ? receivedNum : subtotal;
    const methodStored = payment === "mixed" ? "mixed" : payment;

    const salePayload = {
      shop_id: current.id,
      subtotal,
      total: subtotal,
      payment_method: methodStored,
      amount_paid: amountPaid,
      change_due: change,
      payments: payments ?? undefined,
      reference: ref,
      created_at: createdAt,
    };

    const itemsPayload = cart.map((i) => ({
      product_id: i.id,
      name: i.name,
      quantity: i.qty,
      unit_price: i.sale_price,
      total: i.sale_price * i.qty,
    }));

    try {
      const attribution =
        mode === "employee"
          ? { cashier_id: null, employee_id: getEmployeeSession()?.employeeId ?? null }
          : {
              cashier_id: (await supabase.auth.getUser()).data.user?.id ?? null,
              employee_id: null,
            };
      const { data: sale, error } = await supabase
        .from("sales")
        .insert({
          ...salePayload,
          ...attribution,
        })
        .select()
        .single();
      if (error || !sale) throw error ?? new Error("Vente non créée");

      const { error: itemsError } = await supabase
        .from("sale_items")
        .insert(itemsPayload.map((i) => ({ ...i, sale_id: sale.id })));
      if (itemsError) throw itemsError;

      for (const i of cart) {
        const { error: stockError } = await (
          supabase as never as {
            rpc: (fn: string, args: Record<string, unknown>) => Promise<{ error: Error | null }>;
          }
        ).rpc("adjust_stock", { p_product_id: i.id, p_delta: -i.qty });
        if (stockError) throw stockError;
        await supabase.from("stock_movements").insert({
          shop_id: current.id,
          product_id: i.id,
          type: "out",
          quantity: i.qty,
          reason: "Vente " + ref,
        });
      }

      toast.success(`Vente ${ref} enregistrée — ${fmtMoney(subtotal, cur)}`);
      setDone({
        ref,
        total: subtotal,
        created_at: sale.created_at ?? createdAt,
        paymentLine,
        change,
        items: cart.map((i) => ({ name: i.name, qty: i.qty, total: i.sale_price * i.qty })),
      });
      setCart([]);
      setReceived("");
      setMixCash("");
      // reload stock
      const { data } = await supabase
        .from("products")
        .select("id,name,sale_price,stock,sku,barcode")
        .eq("shop_id", current.id)
        .eq("is_active", true);
      setProducts((data ?? []) as Product[]);
    } catch (e) {
      if (isNetworkError(e) || !navigator.onLine) {
        // HORS-LIGNE : on met en file, on décrémente le stock localement, la caisse continue
        const sale: PendingSale = {
          ref,
          shop_id: current.id,
          cashier_id:
            mode === "employee" ? null : ((await supabase.auth.getUser()).data.user?.id ?? null),
          employee_id: mode === "employee" ? (getEmployeeSession()?.employeeId ?? null) : null,
          created_at: createdAt,
          subtotal,
          total: subtotal,
          payment_method: methodStored,
          amount_paid: amountPaid,
          change_due: change,
          payments,
          items: itemsPayload,
          queued_at: new Date().toISOString(),
        };
        await queueSale(sale);
        setProducts((ps) =>
          ps.map((p) => {
            const it = itemsPayload.find((i) => i.product_id === p.id);
            return it ? { ...p, stock: p.stock - it.quantity } : p;
          }),
        );
        setPending((n) => n + 1);
        toast.warning(
          `Vente ${ref} enregistrée HORS-LIGNE — elle se synchronisera au retour du réseau`,
        );
        setDone({
          ref,
          total: subtotal,
          created_at: createdAt,
          paymentLine: paymentLine + " · (hors-ligne)",
          change,
          items: cart.map((i) => ({ name: i.name, qty: i.qty, total: i.sale_price * i.qty })),
        });
        setCart([]);
        setReceived("");
        setMixCash("");
      } else {
        toast.error("Vente non enregistrée : " + (e as Error).message);
      }
    } finally {
      setProcessing(false);
    }
  };

  const printDone = async () => {
    if (!done || !current) return;
    const logoUrl = await resolveLogoUrl(current.logo_url);
    openReceipt({
      shop: {
        name: current.name,
        address: current.address,
        phone: current.phone,
        email: current.email,
        logoUrl,
        currency: cur,
      },
      sale: {
        reference: done.ref,
        created_at: done.created_at,
        payment_method: payment === "mixed" ? "mixed" : payment,
        subtotal: done.total,
        total: done.total,
        paid: done.paymentLine,
        change: done.change,
      },
      items: done.items.map((i) => ({
        name: i.name,
        quantity: i.qty,
        unit_price: Math.round(i.total / Math.max(1, i.qty)),
        total: i.total,
      })),
    });
  };

  const whatsappDone = () => {
    if (!done || !current) return;
    const text = receiptWhatsAppText(
      current.name,
      done.ref,
      done.items,
      done.total,
      cur,
      done.paymentLine,
      done.change,
    );
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <div>
      <PageHeader
        title="Caisse"
        description="Vente rapide au comptoir"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {!online && (
              <Badge variant="destructive">
                <WifiOff className="mr-1 h-3 w-3" /> Hors-ligne
              </Badge>
            )}
            {pending > 0 && (
              <Button
                variant="outline"
                size="sm"
                disabled={syncing}
                onClick={() => {
                  setSyncing(true);
                  replayPendingSales().then(({ done: n, left }) => {
                    setSyncing(false);
                    setPending(left);
                    toast.success(`${n} vente(s) synchronisée(s)`);
                  });
                }}
              >
                <RefreshCw className={`mr-1.5 h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
                {pending} en attente de sync
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => setHeldOpen(true)}>
              <PauseCircle className="mr-1.5 h-4 w-4" /> En attente ({held.length})
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_400px]">
        {/* Catalogue */}
        <div>
          <div className="relative mb-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Rechercher un produit…"
                className="pl-9 h-11 text-base"
                autoFocus
              />
            </div>
            <div className="min-w-[220px]">
              <Select
                value={selectedCategory ?? ""}
                onValueChange={(value) => setSelectedCategory(value || null)}
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Toutes catégories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Toutes catégories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="h-11 gap-1.5 flex-1 sm:flex-none"
                onClick={() => {
                  setScanContinuous(false);
                  setScanOpen(true);
                }}
              >
                <ScanLine className="h-4 w-4" /> <span className="sm:inline">Scanner</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-11 gap-1.5 flex-1 sm:flex-none"
                onClick={() => {
                  setScanContinuous(true);
                  setScanOpen(true);
                }}
                title="Scan continu"
              >
                <ScanLine className="h-4 w-4" /> <span className="hidden sm:inline">Continu</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-11 gap-1.5 flex-1 sm:flex-none"
                onClick={() => setPhoneScanOpen(true)}
                title="Scanner avec téléphone"
              >
                <Smartphone className="h-4 w-4" />{" "}
                <span className="hidden sm:inline">Téléphone</span>
              </Button>
            </div>
          </div>
          {grouped.length > 0 ? (
            grouped.map(([categoryName, prods]) => (
              <div key={categoryName} className="mb-6">
                <div className="mb-3 flex items-center justify-between rounded-xl border border-border bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-800">
                  <span>{categoryName}</span>
                  <span className="text-xs text-muted-foreground">{prods.length} produit(s)</span>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
                  {prods.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => add(p)}
                      className="group relative overflow-hidden rounded-xl border border-border bg-card p-4 text-left shadow-soft transition hover:-translate-y-0.5 hover:border-primary hover:shadow-elegant disabled:opacity-40"
                      disabled={p.stock <= 0}
                    >
                      <div className="absolute right-2 top-2">
                        {p.stock <= 0 ? (
                          <Badge variant="destructive" className="text-[10px]">
                            Rupture
                          </Badge>
                        ) : p.stock < 5 ? (
                          <Badge className="bg-warning text-warning-foreground text-[10px]">
                            {p.stock}
                          </Badge>
                        ) : null}
                      </div>
                      <div className="mb-2 grid h-12 w-12 place-items-center rounded-lg bg-gradient-primary/20">
                        <ShoppingCart className="h-5 w-5 text-primary" />
                      </div>
                      <div className="line-clamp-2 font-medium">{p.name}</div>
                      <div className="mt-1 font-display text-lg font-bold text-primary">
                        {fmtMoney(p.sale_price, cur)}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="py-16 text-center text-sm text-muted-foreground">
              Aucun produit trouvé.
            </div>
          )}
        </div>

        {/* Panier */}
        <Card className="shadow-elegant lg:sticky lg:top-24">
          <div className="flex items-center justify-between border-b border-border p-4">
            <h3 className="font-display text-lg font-semibold flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              Ticket
            </h3>
            {cart.length > 0 && (
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={holdCart} title="Mettre en attente">
                  <PauseCircle className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setCart([])}>
                  Vider
                </Button>
              </div>
            )}
          </div>
          <CardContent className="p-0">
            {cart.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                Panier vide — cliquez sur un produit.
              </div>
            ) : (
              <div className="max-h-[35vh] divide-y divide-border overflow-y-auto lg:max-h-[40vh]">
                {cart.map((i) => (
                  <div key={i.id} className="flex items-center gap-2 p-3">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{i.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {fmtMoney(i.sale_price, cur)}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-7 w-7"
                        onClick={() => dec(i.id)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-6 text-center text-sm font-semibold">{i.qty}</span>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-7 w-7"
                        onClick={() => inc(i.id)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => rm(i.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
          <div className="space-y-3 border-t border-border p-4">
            <div className="flex items-center justify-between border-b border-dashed border-border pb-3">
              <span className="font-display text-lg font-semibold">Total</span>
              <span className="font-display text-xl md:text-2xl font-bold text-primary">
                {fmtMoney(subtotal, cur)}
              </span>
            </div>

            <Select value={payment} onValueChange={setPayment}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">
                  <Banknote className="mr-2 inline h-4 w-4" />
                  Espèces
                </SelectItem>
                <SelectItem value="mobile">
                  <Smartphone className="mr-2 inline h-4 w-4" />
                  Mobile Money
                </SelectItem>
                <SelectItem value="card">
                  <CreditCard className="mr-2 inline h-4 w-4" />
                  Carte bancaire
                </SelectItem>
                <SelectItem value="mixed">
                  <RefreshCw className="mr-2 inline h-4 w-4" />
                  Paiement mixte (2 moyens)
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Espèces : reçu / monnaie */}
            {payment === "cash" && cart.length > 0 && (
              <div className="space-y-2 rounded-xl border border-border bg-secondary/30 p-3">
                <Label className="text-xs">Montant reçu (optionnel)</Label>
                <Input
                  type="number"
                  inputMode="numeric"
                  value={received}
                  onChange={(e) => setReceived(e.target.value)}
                  placeholder={String(subtotal)}
                  className="h-10 text-lg font-semibold"
                />
                <div className="flex flex-wrap gap-1.5">
                  {quickCash.map((v) => (
                    <Button
                      key={v}
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="text-xs"
                      onClick={() => setReceived(String(v))}
                    >
                      {v === subtotal ? "Compte exact" : fmtMoney(v, cur)}
                    </Button>
                  ))}
                </div>
                {receivedNum > 0 && (
                  <div className="flex items-center justify-between rounded-lg bg-background px-3 py-2 text-sm">
                    {cashShort ? (
                      <span className="text-destructive font-medium">
                        Il manque {fmtMoney(subtotal - receivedNum, cur)}
                      </span>
                    ) : (
                      <>
                        <span className="text-muted-foreground">Monnaie à rendre</span>
                        <span className="font-display text-lg font-bold text-success">
                          {fmtMoney(change, cur)}
                        </span>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Mixte */}
            {payment === "mixed" && cart.length > 0 && (
              <div className="space-y-2 rounded-xl border border-border bg-secondary/30 p-3">
                <Label className="text-xs">Part en espèces</Label>
                <Input
                  type="number"
                  inputMode="numeric"
                  value={mixCash}
                  onChange={(e) => setMixCash(e.target.value)}
                  placeholder="Ex : 2000"
                  className="h-10"
                />
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Le reste en</span>
                  <Select value={mixRest} onValueChange={setMixRest}>
                    <SelectTrigger className="h-9 flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mobile">Mobile Money</SelectItem>
                      <SelectItem value="card">Carte bancaire</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {mixCashNum > 0 && (
                  <div className="rounded-lg bg-background px-3 py-2 text-sm">
                    {mixValid ? (
                      <span className="text-muted-foreground">
                        {fmtMoney(mixCashNum, cur)} espèces + <b>{fmtMoney(mixRestAmount, cur)}</b>{" "}
                        {mixRest === "mobile" ? "Mobile Money" : "carte"}
                      </span>
                    ) : (
                      <span className="text-destructive">
                        La part espèces doit être entre 0 et le total.
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}

            <Button
              onClick={checkout}
              disabled={cart.length === 0 || processing || !mixValid || cashShort}
              className="h-12 w-full bg-gradient-primary text-base shadow-elegant"
            >
              Encaisser {cart.length > 0 && `· ${fmtMoney(subtotal, cur)}`}
            </Button>
          </div>
        </Card>
      </div>

      {/* Scanner */}
      <BarcodeScanner
        open={scanOpen}
        onOpenChange={setScanOpen}
        onDetected={onScan}
        continuous={scanContinuous}
        title={scanContinuous ? "Scan continu — panier" : "Scanner un produit"}
      />
      <PhoneScanner open={phoneScanOpen} onOpenChange={setPhoneScanOpen} onDetected={onScan} />

      {/* Tickets en attente */}
      <Dialog open={heldOpen} onOpenChange={setHeldOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Tickets en attente</DialogTitle>
            <DialogDescription>
              Les paniers mis en attente restent sur cet appareil.
            </DialogDescription>
          </DialogHeader>
          {held.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Aucun ticket en attente.
            </p>
          ) : (
            <div className="space-y-2">
              {held.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center gap-2 rounded-xl border border-border p-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium">{t.id}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {t.cart.map((i) => `${i.name} ×${i.qty}`).join(", ")}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {new Date(t.at).toLocaleTimeString("fr-FR")}
                    </div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => restoreHeld(t)}>
                    <PlayCircle className="mr-1 h-4 w-4" /> Reprendre
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => dropHeld(t.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Après vente */}
      <Dialog open={!!done} onOpenChange={(o) => !o && setDone(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-success" />
              Vente {done?.ref} enregistrée
            </DialogTitle>
            <DialogDescription>
              {done && fmtMoney(done.total, cur)}
              {done && done.change > 0 && ` · monnaie rendue : ${fmtMoney(done.change, cur)}`}
              {done && done.paymentLine.startsWith("Paiement") && ` · ${done.paymentLine}`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button className="w-full" onClick={printDone}>
              <Printer className="mr-2 h-4 w-4" /> Imprimer le ticket
            </Button>
            <Button className="w-full" variant="outline" onClick={whatsappDone}>
              <MessageCircle className="mr-2 h-4 w-4 text-success" /> Envoyer par WhatsApp
            </Button>
            <Button className="w-full" variant="ghost" onClick={() => setDone(null)}>
              Nouvelle vente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export { PosCore };
