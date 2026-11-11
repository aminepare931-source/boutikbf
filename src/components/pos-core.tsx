import { useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
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
  UserRound,
  HandCoins,
  X,
  RefreshCw,
  Monitor,
  Mic,
  StopCircle,
  Star,
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
  promo_price?: number | null;
  promo_start?: string | null;
  promo_end?: string | null;
  stock: number;
  unit?: string;
  sku: string | null;
  barcode: string | null;
  expiry_date?: string | null;
  is_favorite?: boolean;
};

type CustomerLite = { id: string; name: string; phone: string | null; loyalty_points: number };

const CLIENT_QR_PREFIX = "BOUTIKBF-CLIENT:";
const POINTS_PER_1000F = 1; // 1 point par 100 F
const POINTS_VALUE = 10; // 100 points valent 1 000 F

/** Prix effectif : promo si active à la date du jour. */
function effectivePrice(p: Product): number {
  if (!p.promo_price || p.promo_price <= 0 || p.promo_price >= p.sale_price) return p.sale_price;
  const today = new Date().toISOString().slice(0, 10);
  if (p.promo_start && today < p.promo_start) return p.sale_price;
  if (p.promo_end && today > p.promo_end) return p.sale_price;
  return p.promo_price;
}

function isPromoActive(p: Product): boolean {
  return effectivePrice(p) < p.sale_price;
}
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
  const [favOnly, setFavOnly] = useState(false);
  const [q, setQ] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [payment, setPayment] = useState("cash");
  const [discount, setDiscount] = useState("");
  const [discountPct, setDiscountPct] = useState(false);
  const [customer, setCustomer] = useState<{
    id: string;
    name: string;
    phone: string | null;
    loyalty_points?: number;
  } | null>(null);
  // vente au poids (kg, g, tonne, litre…)
  const [weighFor, setWeighFor] = useState<{
    id: string;
    name: string;
    unit: string;
    price: number;
  } | null>(null);
  const [weightQty, setWeightQty] = useState("");
  const [displayLogo, setDisplayLogo] = useState<string | null>(null);
  const [customersLite, setCustomersLite] = useState<CustomerLite[]>([]);
  const [redeem, setRedeem] = useState(false);
  const [shift, setShift] = useState<{ id: string; opened_at: string; float: number } | null>(null);
  const [shiftOpenDlg, setShiftOpenDlg] = useState(false);
  const [shiftCloseDlg, setShiftCloseDlg] = useState(false);
  const [shiftFloat, setShiftFloat] = useState("0");
  const [shiftCounted, setShiftCounted] = useState("");
  const [custOpen, setCustOpen] = useState(false);
  const [custQ, setCustQ] = useState("");
  const [custResults, setCustResults] = useState<
    { id: string; name: string; phone: string | null }[]
  >([]);
  const [newCust, setNewCust] = useState({ name: "", phone: "" });
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
    method: string;
    subtotal: number;
    discount: number;
    customerName: string | null;
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
          .select(
            "id,name,sale_price,promo_price,promo_start,promo_end,stock,unit,sku,barcode,expiry_date,is_favorite,category_id,categories(name)",
          )
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
    resolveLogoUrl(current.logo_url).then(setDisplayLogo);
    supabase
      .from("customers")
      .select("id,name,phone,loyalty_points")
      .eq("shop_id", current.id)
      .then(({ data }) => setCustomersLite((data ?? []) as CustomerLite[]));
    supabase
      .from("cash_shifts")
      .select("id,opened_at,float")
      .eq("shop_id", current.id)
      .is("closed_at", null)
      .order("opened_at", { ascending: false })
      .limit(1)
      .then(({ data }) =>
        setShift((data?.[0] as { id: string; opened_at: string; float: number }) ?? null),
      );
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
    // Carte fidélité client (QR) → identification automatique
    if (c.toUpperCase().startsWith(CLIENT_QR_PREFIX)) {
      const id = c.slice(CLIENT_QR_PREFIX.length).trim();
      const cust = customersLite.find((x) => x.id === id);
      if (cust) {
        setCustomer(cust);
        setRedeem(false);
        toast.success(`Client reconnu : ${cust.name} (${cust.loyalty_points} pts)`);
      } else toast.error("Carte fidélité inconnue de cette boutique");
      return;
    }
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
        .filter((p) => (favOnly ? p.is_favorite : true))
        .sort((a, b) => Number(b.is_favorite ?? false) - Number(a.is_favorite ?? false))
        .slice(0, 30),
    [products, q, selectedCategory, favOnly],
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

  const isWeighed = (unit: string) =>
    ["kg", "g", "tonne", "t", "l", "litre", "dl"].includes((unit || "").trim().toLowerCase());

  const isExpired = (p: Product) =>
    !!p.expiry_date && new Date(p.expiry_date).getTime() < Date.now();

  const add = (p: Product) => {
    if (
      isExpired(p) &&
      !confirm(`⚠️ « ${p.name} » est périmé depuis le ${p.expiry_date}.\nVendre quand même ?`)
    )
      return;
    const priced = { ...p, sale_price: effectivePrice(p) };
    if (isWeighed(p.unit ?? "")) {
      setWeighFor({ id: p.id, name: p.name, unit: p.unit ?? "kg", price: priced.sale_price });
      setWeightQty("");
      return;
    }
    setCart((c) => {
      const ex = c.find((i) => i.id === p.id);
      if (ex) return c.map((i) => (i.id === p.id ? { ...i, qty: i.qty + 1 } : i));
      return [...c, { ...priced, qty: 1 }];
    });
  };

  const confirmWeight = () => {
    if (!weighFor) return;
    const qty = Number(weightQty);
    if (!qty || qty <= 0) return toast.error("Quantité invalide");
    setCart((c) => {
      const ex = c.find((i) => i.id === weighFor.id);
      if (ex)
        return c.map((i) =>
          i.id === weighFor.id ? { ...i, qty: Math.round((i.qty + qty) * 1000) / 1000 } : i,
        );
      const prod = products.find((x) => x.id === weighFor.id);
      if (!prod) return c;
      return [...c, { ...prod, sale_price: weighFor.price, qty: Math.round(qty * 1000) / 1000 }];
    });
    setWeighFor(null);
    setWeightQty("");
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

  // — remise (+ points fidélité utilisés) —
  const discountNum = Math.max(0, Number(discount || 0));
  const baseDiscount = discountPct
    ? Math.round((subtotal * Math.min(100, discountNum)) / 100)
    : discountNum;
  const canRedeem = !!customer && (customer.loyalty_points ?? 0) >= 100;
  const redeemValue =
    redeem && canRedeem ? Math.min(1000, Math.max(0, subtotal - baseDiscount)) : 0;
  const discountValue = Math.min(baseDiscount + redeemValue, subtotal);
  const total = Math.max(0, subtotal - discountValue);

  // — monnaie & mixte —
  const receivedNum = Number(received || 0);
  const change = payment === "cash" && receivedNum >= total ? receivedNum - total : 0;
  const cashShort = payment === "cash" && receivedNum > 0 && receivedNum < total;
  const mixCashNum = Number(mixCash || 0);
  const mixRestAmount = total - mixCashNum;
  const mixValid = payment !== "mixed" || (mixCashNum > 0 && mixRestAmount > 0);
  const creditValid = payment !== "credit" || !!customer;

  const quickCash = [
    total,
    roundUpTo(total, 500),
    roundUpTo(total, 1000),
    roundUpTo(total, 2000),
    roundUpTo(total, 5000),
    roundUpTo(total, 10000),
  ]
    .filter((v, i, a) => v > 0 && a.indexOf(v) === i)
    .slice(0, 5);

  const paymentLine = useMemo(() => {
    if (payment === "cash") return `Paiement : espèces (${fmtMoney(receivedNum || total, cur)})`;
    if (payment === "mixed")
      return `Paiement : ${fmtMoney(mixCashNum, cur)} espèces + ${fmtMoney(Math.max(0, mixRestAmount), cur)} ${mixRest === "mobile" ? "Mobile Money" : "carte"}`;
    if (payment === "mobile") return "Paiement : Mobile Money";
    if (payment === "credit") return `À crédit — ${customer?.name ?? ""}`;
    return "Paiement : carte bancaire";
  }, [payment, receivedNum, mixCashNum, mixRestAmount, mixRest, cur, total, customer]);

  // — recherche client —
  useEffect(() => {
    if (!custOpen || !current) return;
    const t = setTimeout(async () => {
      let query = supabase
        .from("customers")
        .select("id,name,phone")
        .eq("shop_id", current.id)
        .order("name")
        .limit(8);
      if (custQ.trim())
        query = query.or(`name.ilike.%${custQ.trim()}%,phone.ilike.%${custQ.trim()}%`);
      const { data } = await query;
      setCustResults((data ?? []) as typeof custResults);
    }, 200);
    return () => clearTimeout(t);
  }, [custOpen, custQ, current?.id]);

  const createCustomer = async () => {
    if (!current || !newCust.name.trim()) return;
    const { data, error } = await supabase
      .from("customers")
      .insert({
        shop_id: current.id,
        name: newCust.name.trim(),
        phone: newCust.phone.trim() || null,
      })
      .select("id,name,phone")
      .single();
    if (error) return toast.error(error.message);
    setCustomer(data as { id: string; name: string; phone: string | null });
    setCustOpen(false);
    setNewCust({ name: "", phone: "" });
    toast.success("Client ajouté");
  };

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
    setDiscount("");
    setDiscountPct(false);
    setCustomer(null);
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

  const openShift = async () => {
    if (!current) return;
    const { data, error } = await supabase
      .from("cash_shifts")
      .insert({ shop_id: current.id, float: Number(shiftFloat) || 0 })
      .select("id,opened_at,float")
      .single();
    if (error) return toast.error(error.message);
    setShift(data as { id: string; opened_at: string; float: number });
    setShiftOpenDlg(false);
    toast.success("Caisse ouverte — bonne journée !");
  };

  const closeShift = async () => {
    if (!shift) return;
    const { error } = await supabase
      .from("cash_shifts")
      .update({ closed_at: new Date().toISOString(), counted: Number(shiftCounted) || null })
      .eq("id", shift.id);
    if (error) return toast.error(error.message);
    setShift(null);
    setShiftCloseDlg(false);
    setShiftCounted("");
    toast.success("Caisse clôturée 🎉");
  };

  const toggleFav = async (p: Product) => {
    const nv = !p.is_favorite;
    setProducts((ps) => ps.map((x) => (x.id === p.id ? { ...x, is_favorite: nv } : x)));
    await supabase.from("products").update({ is_favorite: nv }).eq("id", p.id);
  };

  // — diffusion vers l'écran client (fenêtre /display ouverte sur l'autre écran) —
  useEffect(() => {
    if (typeof window === "undefined" || !("BroadcastChannel" in window)) return;
    const ch = new BroadcastChannel("boutikbf-display");
    const payload = {
      shopName: current?.name ?? "Boutique",
      logoUrl: displayLogo,
      currency: cur,
      lines: cart.map((i) => ({
        name: i.name,
        qty: isWeighed(i.unit ?? "") ? `${i.qty}${i.unit ?? ""}` : i.qty,
        total: Math.round(i.sale_price * i.qty),
      })),
      subtotal,
      discount: discountValue,
      total,
      message: done ? "Merci de votre visite !" : null,
      change: done?.change ?? (change || 0),
      ts: Date.now(),
    };
    ch.postMessage(payload);
    // secours si BroadcastChannel indisponible (vieux navigateurs de la 2ᵉ fenêtre)
    try {
      localStorage.setItem("boutikbf-display-data", JSON.stringify(payload));
    } catch {
      /* quota privé */
    }
    return () => ch.close();
  }, [cart, subtotal, discountValue, total, change, done, current?.name, cur]);

  const checkout = async () => {
    if (!current || cart.length === 0 || !mixValid || !creditValid) return;
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
    const amountPaid =
      payment === "credit" ? null : payment === "cash" && receivedNum > 0 ? receivedNum : total;
    const methodStored = payment === "mixed" ? "mixed" : payment;

    const salePayload = {
      shop_id: current.id,
      subtotal,
      discount: discountValue,
      total,
      payment_method: methodStored,
      amount_paid: amountPaid,
      change_due: change,
      payments: payments ?? undefined,
      customer_id: customer?.id ?? null,
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

      // vente à crédit : la dette du client est mise à jour
      if (payment === "credit" && customer) {
        const { data: cust } = await supabase
          .from("customers")
          .select("credit_balance")
          .eq("id", customer.id)
          .maybeSingle();
        if (cust)
          await supabase
            .from("customers")
            .update({ credit_balance: Number(cust.credit_balance) + total })
            .eq("id", customer.id);
      }

      // fidélité : 1 point par 100 F gagnés, moins les points utilisés
      if (customer) {
        const delta = Math.floor(total / 100) - (redeemValue > 0 ? 100 : 0);
        if (delta !== 0) {
          await supabase
            .from("customers")
            .update({ loyalty_points: Math.max(0, (customer.loyalty_points ?? 0) + delta) })
            .eq("id", customer.id);
        }
      }

      toast.success(`Vente ${ref} enregistrée — ${fmtMoney(total, cur)}`);
      setDone({
        ref,
        total,
        created_at: sale.created_at ?? createdAt,
        paymentLine,
        change,
        items: cart.map((i) => ({ name: i.name, qty: i.qty, total: i.sale_price * i.qty })),
        method: methodStored,
        subtotal,
        discount: discountValue,
        customerName: customer?.name ?? null,
      });
      setCart([]);
      setReceived("");
      setMixCash("");
      setDiscount("");
      setDiscountPct(false);
      setRedeem(false);
      setCustomer(null);
      // recharger les points client en mémoire
      setCustomersLite((cs) =>
        cs.map((x) =>
          x.id === customer?.id
            ? {
                ...x,
                loyalty_points: Math.max(
                  0,
                  (x.loyalty_points ?? 0) + Math.floor(total / 100) - (redeemValue > 0 ? 100 : 0),
                ),
              }
            : x,
        ),
      );
      // reload stock
      const { data } = await supabase
        .from("products")
        .select(
          "id,name,sale_price,promo_price,promo_start,promo_end,stock,unit,sku,barcode,expiry_date,is_favorite",
        )
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
          customer_id: customer?.id ?? null,
          customer_points_delta: customer
            ? Math.floor(total / 100) - (redeemValue > 0 ? 100 : 0)
            : undefined,
          created_at: createdAt,
          subtotal,
          total,
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
          total,
          created_at: createdAt,
          paymentLine: paymentLine + " · (hors-ligne)",
          change,
          items: cart.map((i) => ({ name: i.name, qty: i.qty, total: i.sale_price * i.qty })),
          method: methodStored,
          subtotal,
          discount: discountValue,
          customerName: customer?.name ?? null,
        });
        setCart([]);
        setReceived("");
        setMixCash("");
        setDiscount("");
        setDiscountPct(false);
        setCustomer(null);
      } else {
        toast.error("Vente non enregistrée : " + (e as Error).message);
      }
    } finally {
      setProcessing(false);
    }
  };

  const printDone = async (paper: "58" | "80" = "80") => {
    if (!done || !current) return;
    const logoUrl = await resolveLogoUrl(current.logo_url);
    openReceipt({
      paper,
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
        payment_method: done.method,
        subtotal: done.subtotal,
        discount: done.discount,
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
      customer: done.customerName ? { name: done.customerName } : null,
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

  const [listening, setListening] = useState(false);
  const recRef = useRef<{ stop: () => void } | null>(null);

  const toggleVoice = () => {
    type SRAlt = { transcript: string };

    type SREvent = { results: ArrayLike<ArrayLike<SRAlt>> };

    type SRInstance = {
      lang: string;
      interimResults: boolean;
      maxAlternatives: number;
      start: () => void;
      stop: () => void;
      onresult: ((e: SREvent) => void) | null;
      onend: (() => void) | null;
      onerror: (() => void) | null;
    };
    const SR =
      (
        window as unknown as {
          SpeechRecognition?: new () => SRInstance;
          webkitSpeechRecognition?: new () => SRInstance;
        }
      ).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: new () => SRInstance })
        .webkitSpeechRecognition;
    if (!SR) return toast.error("Reconnaissance vocale non supportée ici — essaie Chrome/Android.");
    if (listening) {
      recRef.current?.stop();
      setListening(false);
      return;
    }
    const rec = new SR();
    rec.lang = "fr-FR";
    rec.interimResults = false;
    rec.maxAlternatives = 3;
    rec.onresult = (e) => {
      const alts: string[] = Array.from(e.results[0]).map((a) => String(a.transcript));
      const norm = (s: string) =>
        s
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase();
      for (const t of alts) {
        const words = norm(t)
          .split(/\s+/)
          .filter((w) => w.length > 2);
        let best: Product | null = null;
        let bestScore = 0;
        for (const p of products) {
          const pn = norm(p.name);
          const score = words.filter((w) => pn.includes(w)).length;
          if (score > bestScore) {
            bestScore = score;
            best = p;
          }
        }
        if (best && bestScore > 0) {
          if (best.stock <= 0) {
            toast.error(`${best.name} : rupture de stock`);
            return;
          }
          add(best);
          toast.success(`🎤 Voix : ajouté « ${best.name} »`);
          return;
        }
      }
      toast.info(`🎤 « ${alts[0]} » — aucun produit reconnu`);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => {
      setListening(false);
      toast.error("Micro indisponible ou refusé");
    };
    recRef.current = rec;
    setListening(true);
    rec.start();
  };

  // — douchettes code-barres USB/Bluetooth (émulation clavier) —
  // Ces appareils « tapent » le code très vite puis Entrée. On les capte même
  // si aucun champ n'est focusé (typique des scanners gun et PDA Android).
  useEffect(() => {
    let buf = "";
    let last = 0;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const inField =
        t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);
      if (inField) return; // le champ recherche gère lui-même Entrée
      const now = Date.now();
      if (now - last > 120) buf = ""; // frappe humaine → pas un scanner
      last = now;
      if (e.key === "Enter") {
        if (buf.length >= 5) {
          onScan(buf);
          e.preventDefault();
        }
        buf = "";
      } else if (e.key.length === 1 && /[0-9A-Za-z-]/.test(e.key)) {
        buf += e.key;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products]);

  const onSearchEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    const c = q.trim();
    if (!c) return;
    const exact = products.find(
      (p) =>
        (p.barcode && p.barcode.toLowerCase() === c.toLowerCase()) ||
        (p.sku && p.sku.toLowerCase() === c.toLowerCase()),
    );
    if (exact) {
      if (exact.stock <= 0) return toast.error(`${exact.name} : rupture de stock`);
      add(exact);
      setQ("");
      toast.success(`Ajouté : ${exact.name}`);
    } else if (filtered.length === 1) {
      add(filtered[0]);
      setQ("");
    }
  };

  return (
    <div>
      <PageHeader
        title="Caisse"
        description="Vente rapide au comptoir"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {!shift ? (
              <Button variant="outline" size="sm" onClick={() => setShiftOpenDlg(true)}>
                <PlayCircle className="mr-1.5 h-4 w-4 text-success" /> Ouvrir la caisse
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setShiftCloseDlg(true)}>
                <StopCircle className="mr-1.5 h-4 w-4 text-destructive" /> Clôturer (
                {new Date(shift.opened_at).toLocaleTimeString("fr-FR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}{" "}
                · fond {fmtMoney(shift.float, cur)})
              </Button>
            )}
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
            <Button
              variant="outline"
              size="sm"
              title="Ouvrir l'affichage client sur le 2ᵉ écran"
              onClick={() => window.open("/display", "client-display", "width=900,height=700")}
            >
              <Monitor className="mr-1.5 h-4 w-4" /> Écran client
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
                onKeyDown={onSearchEnter}
                placeholder="Rechercher un produit…"
                className="pl-9 pr-11 h-11 text-base"
                autoFocus
              />
              <button
                type="button"
                onClick={toggleVoice}
                title="Ajouter un produit à la voix"
                className={`absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full transition ${
                  listening
                    ? "animate-pulse bg-destructive text-destructive-foreground"
                    : "bg-secondary text-muted-foreground hover:bg-primary/15 hover:text-primary"
                }`}
              >
                <Mic className="h-4 w-4" />
              </button>
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
                variant={favOnly ? "default" : "outline"}
                className="h-11 gap-1.5 flex-1 sm:flex-none"
                onClick={() => setFavOnly((v) => !v)}
                title="Afficher uniquement mes produits favoris"
              >
                <Star className="h-4 w-4" /> <span className="hidden sm:inline">Favoris</span>
              </Button>
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
                      <button
                        type="button"
                        title={p.is_favorite ? "Retirer des favoris" : "Ajouter aux favoris"}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFav(p);
                        }}
                        className="absolute left-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-full bg-white/70 backdrop-blur"
                      >
                        <Star
                          className={`h-4 w-4 ${p.is_favorite ? "fill-amber-400 text-amber-400" : "text-slate-300"}`}
                        />
                      </button>
                      <div className="mb-2 grid h-12 w-12 place-items-center rounded-lg bg-gradient-primary/20">
                        <ShoppingCart className="h-5 w-5 text-primary" />
                      </div>
                      <div className="line-clamp-2 font-medium">{p.name}</div>
                      <div className="mt-1 font-display text-lg font-bold text-primary">
                        {fmtMoney(effectivePrice(p), cur)}
                        {isWeighed(p.unit ?? "") && (
                          <span className="text-xs font-medium text-muted-foreground">
                            {" "}
                            / {p.unit}
                          </span>
                        )}
                        {isPromoActive(p) && (
                          <span className="ml-1.5 align-middle rounded bg-destructive px-1.5 py-0.5 text-[9px] font-bold uppercase text-destructive-foreground">
                            Promo
                          </span>
                        )}
                      </div>
                      {isPromoActive(p) && (
                        <div className="text-xs text-muted-foreground line-through">
                          {fmtMoney(p.sale_price, cur)}
                        </div>
                      )}
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
                        {isWeighed(i.unit ?? "") ? ` / ${i.unit}` : ""}
                      </div>
                    </div>
                    {isWeighed(i.unit ?? "") ? (
                      <button
                        type="button"
                        className="rounded-lg border border-border px-2 py-1 text-sm font-semibold hover:bg-secondary"
                        title="Ajuster le poids"
                        onClick={() => add({ ...i, qty: 1 } as Product)}
                      >
                        {i.qty} {i.unit}
                      </button>
                    ) : (
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
                    )}
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
            {/* Client au comptoir */}
            <div className="flex items-center justify-between gap-2">
              {customer ? (
                <div className="flex min-w-0 flex-col gap-1">
                  <Badge variant="secondary" className="max-w-[220px] gap-1.5 py-1 text-xs">
                    <UserRound className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{customer.name}</span>
                    <button
                      type="button"
                      className="grid h-4 w-4 place-items-center rounded-full hover:bg-destructive/20"
                      title="Retirer le client"
                      onClick={() => {
                        setCustomer(null);
                        setRedeem(false);
                        if (payment === "credit") setPayment("cash");
                      }}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                  {canRedeem && (
                    <label className="flex cursor-pointer items-center gap-1.5 text-xs text-amber-600">
                      <input
                        type="checkbox"
                        checked={redeem}
                        onChange={(e) => setRedeem(e.target.checked)}
                        className="h-3.5 w-3.5 accent-amber-500"
                      />
                      Utiliser 100 pts = −1 000 F ({customer.loyalty_points ?? 0} pts)
                    </label>
                  )}
                </div>
              ) : (
                <span className="text-xs text-muted-foreground">Client comptoir</span>
              )}
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-8 text-xs"
                onClick={() => setCustOpen(true)}
              >
                <UserRound className="mr-1.5 h-3.5 w-3.5" /> Client
              </Button>
            </div>

            {/* Remise */}
            {cart.length > 0 && (
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="0"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  placeholder="Remise…"
                  className="h-9 flex-1"
                />
                <Button
                  type="button"
                  size="sm"
                  variant={discountPct ? "default" : "outline"}
                  className="h-9 w-10 shrink-0"
                  onClick={() => setDiscountPct((v) => !v)}
                  title="Basculer % / montant"
                >
                  {discountPct ? "%" : cur === "XOF" ? "F" : cur}
                </Button>
              </div>
            )}

            {discountValue > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Sous-total</span>
                <span className="text-muted-foreground">{fmtMoney(subtotal, cur)}</span>
              </div>
            )}
            <div className="flex items-center justify-between border-b border-dashed border-border pb-3">
              <span className="font-display text-lg font-semibold">
                Total
                {discountValue > 0 && (
                  <span className="ml-1 text-xs font-normal text-destructive">
                    − remise {fmtMoney(discountValue, cur)}
                  </span>
                )}
              </span>
              <span className="font-display text-xl md:text-2xl font-bold text-primary">
                {fmtMoney(total, cur)}
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
                <SelectItem value="credit">
                  <HandCoins className="mr-2 inline h-4 w-4" />À crédit{" "}
                  {customer ? `— ${customer.name}` : "(client requis)"}
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
                  placeholder={String(total)}
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
                        Il manque {fmtMoney(total - receivedNum, cur)}
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
              disabled={cart.length === 0 || processing || !mixValid || !creditValid || cashShort}
              className="h-12 w-full bg-gradient-primary text-base shadow-elegant"
            >
              Encaisser {cart.length > 0 && `· ${fmtMoney(total, cur)}`}
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
            <div className="flex gap-2">
              <Button className="flex-1" onClick={() => printDone("80")}>
                <Printer className="mr-2 h-4 w-4" /> Imprimer 80 mm
              </Button>
              <Button className="flex-1" variant="outline" onClick={() => printDone("58")}>
                <Printer className="mr-2 h-4 w-4" /> 58 mm
              </Button>
            </div>
            <Button className="w-full" variant="outline" onClick={whatsappDone}>
              <MessageCircle className="mr-2 h-4 w-4 text-success" /> Envoyer par WhatsApp
            </Button>
            <Button className="w-full" variant="ghost" onClick={() => setDone(null)}>
              Nouvelle vente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Choix du client */}
      <Dialog open={custOpen} onOpenChange={setCustOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Client</DialogTitle>
            <DialogDescription>
              Associer un client à cette vente (historique, fidélité, crédit).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Nom ou téléphone…"
                value={custQ}
                onChange={(e) => setCustQ(e.target.value)}
                autoFocus
              />
            </div>
            <div className="max-h-48 space-y-1 overflow-y-auto">
              {custResults.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className="flex w-full items-center justify-between rounded-lg border border-border p-2.5 text-left text-sm hover:bg-secondary"
                  onClick={() => {
                    setCustomer(c);
                    setCustOpen(false);
                  }}
                >
                  <span className="font-medium">{c.name}</span>
                  <span className="text-xs text-muted-foreground">{c.phone ?? ""}</span>
                </button>
              ))}
              {custResults.length === 0 && (
                <p className="py-3 text-center text-xs text-muted-foreground">
                  Aucun client trouvé.
                </p>
              )}
            </div>
            <div className="rounded-xl border border-dashed border-border p-3">
              <p className="mb-2 text-xs font-semibold">Créer un nouveau client</p>
              <div className="flex gap-2">
                <Input
                  placeholder="Nom *"
                  value={newCust.name}
                  onChange={(e) => setNewCust({ ...newCust, name: e.target.value })}
                />
                <Input
                  placeholder="Téléphone"
                  className="w-36"
                  value={newCust.phone}
                  onChange={(e) => setNewCust({ ...newCust, phone: e.target.value })}
                />
                <Button
                  size="sm"
                  className="shrink-0"
                  disabled={!newCust.name.trim()}
                  onClick={createCustomer}
                >
                  <Plus className="mr-1 h-4 w-4" /> Créer
                </Button>
              </div>
            </div>
            {customer && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-destructive"
                onClick={() => {
                  setCustomer(null);
                  setCustOpen(false);
                  if (payment === "credit") setPayment("cash");
                }}
              >
                Retirer le client actuel
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Pesée (vente au poids) */}
      <Dialog open={!!weighFor} onOpenChange={(o) => !o && setWeighFor(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display">{weighFor?.name}</DialogTitle>
            <DialogDescription>
              Saisis la quantité pesée — prix :{" "}
              <b>
                {fmtMoney(weighFor?.price ?? 0, cur)} / {weighFor?.unit}
              </b>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Input
                type="number"
                step="0.001"
                min="0"
                autoFocus
                value={weightQty}
                onChange={(e) => setWeightQty(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && confirmWeight()}
                placeholder={`0,000 ${weighFor?.unit ?? ""}`}
                className="h-14 text-2xl font-bold text-center"
              />
              <span className="text-lg font-semibold text-muted-foreground">{weighFor?.unit}</span>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {[0.1, 0.25, 0.5, 1, 2].map((v) => (
                <Button key={v} size="sm" variant="outline" onClick={() => setWeightQty(String(v))}>
                  {v} {weighFor?.unit}
                </Button>
              ))}
            </div>
            <div className="rounded-xl bg-secondary/40 p-3 text-center">
              <span className="text-sm text-muted-foreground">À encaisser : </span>
              <span className="font-display text-xl font-bold text-primary">
                {fmtMoney(Math.round((Number(weightQty) || 0) * (weighFor?.price ?? 0)), cur)}
              </span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setWeighFor(null)}>
              Annuler
            </Button>
            <Button onClick={confirmWeight} className="bg-gradient-primary shadow-elegant">
              Ajouter au ticket
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ouverture de caisse (shift) */}
      <Dialog open={shiftOpenDlg} onOpenChange={setShiftOpenDlg}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display">Ouvrir la caisse</DialogTitle>
            <DialogDescription>
              Combine d'ouverture : combien d'espèces y a-t-il dans le tiroir ?
            </DialogDescription>
          </DialogHeader>
          <Input
            type="number"
            min="0"
            value={shiftFloat}
            onChange={(e) => setShiftFloat(e.target.value)}
            className="h-12 text-xl font-bold"
            autoFocus
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShiftOpenDlg(false)}>
              Annuler
            </Button>
            <Button onClick={openShift} className="bg-gradient-primary">
              <PlayCircle className="mr-1.5 h-4 w-4" /> Ouvrir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Fermeture de caisse (shift) */}
      <Dialog open={shiftCloseDlg} onOpenChange={setShiftCloseDlg}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display">Clôturer la caisse</DialogTitle>
            <DialogDescription>
              Compte les espèces du tiroir. Le fond d'ouverture était de{" "}
              <b>{fmtMoney(shift?.float ?? 0, cur)}</b> (caisse ouverte à{" "}
              {shift
                ? new Date(shift.opened_at).toLocaleTimeString("fr-FR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "—"}
              ).
            </DialogDescription>
          </DialogHeader>
          <Input
            type="number"
            min="0"
            placeholder="Espèces comptées…"
            value={shiftCounted}
            onChange={(e) => setShiftCounted(e.target.value)}
            className="h-12 text-xl font-bold"
            autoFocus
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShiftCloseDlg(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={closeShift}>
              <StopCircle className="mr-1.5 h-4 w-4" /> Clôturer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export { PosCore };
