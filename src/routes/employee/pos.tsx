import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useShops, resolveLogoUrl } from "@/lib/shop-store";
import { PageHeader } from "@/components/page-parts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

export const Route = createFileRoute("/employee/pos")({
  head: () => ({ meta: [{ title: "Caisse — BoutikBF" }] }),
  component: EmployeePOS,
});

type Product = {
  id: string;
  name: string;
  sale_price: number;
  stock: number;
  sku: string | null;
  barcode: string | null;
};
type CartItem = Product & { qty: number };

function EmployeePOS() {
  const { current } = useShops();
  const [products, setProducts] = useState<Product[]>([]);
  const [q, setQ] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [payment, setPayment] = useState("cash");
  const [processing, setProcessing] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);
  const [scanContinuous, setScanContinuous] = useState(false);
  const [phoneScanOpen, setPhoneScanOpen] = useState(false);

  useEffect(() => {
    if (!current) return;
    supabase
      .from("products")
      .select("id,name,sale_price,stock,sku,barcode")
      .eq("shop_id", current.id)
      .eq("is_active", true)
      .then(({ data }) => setProducts((data ?? []) as Product[]));
  }, [current?.id]);

  const onScan = (code: string) => {
    const c = code.trim();
    const match = products.find((p) => p.barcode === c || p.sku === c);
    if (match) {
      if (match.stock <= 0) return toast.error(`${match.name} : rupture de stock`);
      add(match);
      toast.success(`Ajouté : ${match.name}`);
    } else {
      setQ(c);
      toast.info(`Code "${c}" — aucun produit trouvé. Recherchez manuellement.`);
    }
  };

  const filtered = useMemo(
    () =>
      products
        .filter((p) =>
          (p.name + (p.sku ?? "") + (p.barcode ?? "")).toLowerCase().includes(q.toLowerCase()),
        )
        .slice(0, 30),
    [products, q],
  );

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

  const checkout = async () => {
    if (!current || cart.length === 0) return;
    setProcessing(true);
    const { data: userData } = await supabase.auth.getUser();
    const { data: sale, error } = await supabase
      .from("sales")
      .insert({
        shop_id: current.id,
        cashier_id: userData.user?.id,
        subtotal,
        total: subtotal,
        payment_method: payment,
        reference: "V-" + Date.now().toString(36).toUpperCase(),
      })
      .select()
      .single();
    if (error || !sale) {
      setProcessing(false);
      toast.error(error?.message ?? "Erreur");
      return;
    }

    const items = cart.map((i) => ({
      sale_id: sale.id,
      product_id: i.id,
      name: i.name,
      quantity: i.qty,
      unit_price: i.sale_price,
      total: i.sale_price * i.qty,
    }));
    await supabase.from("sale_items").insert(items);
    // Decrement stock
    for (const i of cart) {
      await supabase
        .from("products")
        .update({ stock: i.stock - i.qty })
        .eq("id", i.id);
      await supabase.from("stock_movements").insert({
        shop_id: current.id,
        product_id: i.id,
        type: "out",
        quantity: i.qty,
        reason: "Vente " + (sale.reference ?? ""),
      });
    }
    toast.success(
      `Vente ${sale.reference ?? ""} enregistrée — ${fmtMoney(subtotal, current.currency)}`,
    );
    // Open receipt in a new window
    const logoUrl = await resolveLogoUrl(current.logo_url);
    openReceipt({
      shop: {
        name: current.name,
        address: current.address,
        phone: current.phone,
        email: current.email,
        logoUrl,
        currency: current.currency,
      },
      sale: {
        reference: sale.reference ?? sale.id,
        created_at: sale.created_at,
        payment_method: payment,
        subtotal,
        total: subtotal,
      },
      items: cart.map((i) => ({
        name: i.name,
        quantity: i.qty,
        unit_price: i.sale_price,
        total: i.sale_price * i.qty,
      })),
    });
    setCart([]);
    setProcessing(false);
    // reload stock
    const { data } = await supabase
      .from("products")
      .select("id,name,sale_price,stock,sku,barcode")
      .eq("shop_id", current.id)
      .eq("is_active", true);
    setProducts((data ?? []) as Product[]);
  };

  return (
    <div>
      <PageHeader title="Caisse" description="Vente rapide au comptoir" />

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
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((p) => (
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
                  {fmtMoney(p.sale_price, current?.currency)}
                </div>
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="col-span-full py-16 text-center text-sm text-muted-foreground">
                Aucun produit trouvé.
              </div>
            )}
          </div>
        </div>

        {/* Panier - Sur mobile, il sera en bas de page */}
        <Card className="shadow-elegant lg:sticky lg:top-24">
          <div className="flex items-center justify-between border-b border-border p-4">
            <h3 className="font-display text-lg font-semibold flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              Ticket
            </h3>
            {cart.length > 0 && (
              <Button variant="ghost" size="sm" onClick={() => setCart([])}>
                Vider
              </Button>
            )}
          </div>
          <CardContent className="p-0">
            {cart.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                Panier vide — cliquez sur un produit.
              </div>
            ) : (
              <div className="max-h-[40vh] divide-y divide-border overflow-y-auto lg:max-h-[45vh]">
                {cart.map((i) => (
                  <div key={i.id} className="flex items-center gap-2 p-3">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{i.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {fmtMoney(i.sale_price, current?.currency)}
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
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Sous-total</span>
              <span>{fmtMoney(subtotal, current?.currency)}</span>
            </div>
            <div className="flex items-center justify-between border-t border-dashed border-border pt-3">
              <span className="font-display text-lg font-semibold">Total</span>
              <span className="font-display text-xl md:text-2xl font-bold text-primary">
                {fmtMoney(subtotal, current?.currency)}
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
              </SelectContent>
            </Select>
            <Button
              onClick={checkout}
              disabled={cart.length === 0 || processing}
              className="h-12 w-full bg-gradient-primary text-base shadow-elegant"
            >
              Encaisser {cart.length > 0 && `· ${fmtMoney(subtotal, current?.currency)}`}
            </Button>
          </div>
        </Card>
      </div>
      <BarcodeScanner
        open={scanOpen}
        onOpenChange={setScanOpen}
        onDetected={onScan}
        continuous={scanContinuous}
        title={scanContinuous ? "Scan continu — panier" : "Scanner un produit"}
      />
      <PhoneScanner open={phoneScanOpen} onOpenChange={setPhoneScanOpen} onDetected={onScan} />
    </div>
  );
}
