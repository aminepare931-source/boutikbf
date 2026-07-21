import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useShops, resolveLogoUrl } from "@/lib/shop-store";
import { PageHeader, EmptyState } from "@/components/page-parts";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Printer, FileText } from "lucide-react";
import { fmtMoney, fmtDate } from "@/lib/format";
import { openReceipt } from "@/lib/receipt";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/sales")({
  head: () => ({ meta: [{ title: "Ventes — BoutikBF" }] }),
  component: SalesPage,
});

function SalesPage() {
  const { current } = useShops();
  const [sales, setSales] = useState<any[]>([]);
  useEffect(() => {
    if (!current) return;
    supabase
      .from("sales")
      .select("*")
      .eq("shop_id", current.id)
      .order("created_at", { ascending: false })
      .limit(100)
      .then(({ data }) => setSales(data ?? []));
  }, [current?.id]);

  const labelPay: Record<string, string> = {
    cash: "Espèces",
    mobile: "Mobile Money",
    card: "Carte",
    credit: "Crédit",
  };

  const openDoc = async (saleId: string, mode: "receipt" | "invoice") => {
    if (!current) return;
    const [saleRes, itemsRes] = await Promise.all([
      supabase.from("sales").select("*").eq("id", saleId).single(),
      supabase.from("sale_items").select("*").eq("sale_id", saleId),
    ]);
    if (saleRes.error || !saleRes.data) return toast.error("Vente introuvable");
    const logoUrl = await resolveLogoUrl(current.logo_url);
    openReceipt({
      mode,
      shop: {
        name: current.name,
        address: current.address,
        phone: current.phone,
        email: current.email,
        logoUrl,
        currency: current.currency,
      },
      sale: {
        reference: saleRes.data.reference ?? saleRes.data.id,
        created_at: saleRes.data.created_at,
        payment_method: saleRes.data.payment_method,
        subtotal: Number(saleRes.data.subtotal),
        tax: Number(saleRes.data.tax),
        discount: Number(saleRes.data.discount),
        total: Number(saleRes.data.total),
      },
      items: (itemsRes.data ?? []).map((i: any) => ({
        name: i.name,
        quantity: Number(i.quantity),
        unit_price: Number(i.unit_price),
        total: Number(i.total),
      })),
    });
  };

  return (
    <div>
      <PageHeader
        title="Historique des ventes"
        description="Toutes les transactions enregistrées — impression de reçus et factures"
      />
      <Card className="shadow-soft">
        <CardContent className="p-0">
          {sales.length === 0 ? (
            <EmptyState
              icon={ShoppingCart}
              title="Aucune vente"
              description="Les ventes réalisées à la caisse apparaîtront ici."
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[100px]">Référence</TableHead>
                    <TableHead className="hidden sm:table-cell">Date</TableHead>
                    <TableHead className="hidden md:table-cell">Paiement</TableHead>
                    <TableHead className="hidden sm:table-cell">Statut</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="w-[80px] text-right">Documents</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sales.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-mono text-xs">{s.reference}</TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {fmtDate(s.created_at)}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {labelPay[s.payment_method] ?? s.payment_method}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant="secondary">{s.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono font-semibold text-primary">
                        {fmtMoney(s.total, current?.currency)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            title="Reçu"
                            onClick={() => openDoc(s.id, "receipt")}
                          >
                            <Printer className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            title="Facture"
                            onClick={() => openDoc(s.id, "invoice")}
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
