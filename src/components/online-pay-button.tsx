import { useState } from "react";
import { CreditCard, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { fmtPrice, PRICES } from "@/lib/plan-catalog";
import { startOnlinePayment, usePaymentsEnabled, type PayPeriod } from "@/lib/payments/client";

/**
 * Bouton « Payer en ligne » (Orange Money, Moov Money) : n'apparaît que si le serveur est
 * configuré avec GeniusPay. Le montant n'est jamais envoyé : le serveur le calcule.
 */
export function OnlinePayButton({
  shopId,
  planId,
  defaultPeriod = "month",
}: {
  shopId: string;
  planId: string;
  defaultPeriod?: PayPeriod;
}) {
  const enabled = usePaymentsEnabled();
  const [period, setPeriod] = useState<PayPeriod>(defaultPeriod);
  const [busy, setBusy] = useState(false);

  const tier =
    planId === "pro"
      ? "pro"
      : planId === "essentiel" || planId === "essentiel_paid"
        ? "essentiel"
        : null;
  if (!enabled || !tier) return null;

  const pay = async () => {
    setBusy(true);
    const res = await startOnlinePayment({
      shopId,
      plan: tier === "pro" ? "pro" : "essentiel_paid",
      period,
    });
    if (!res.ok) {
      setBusy(false);
      toast.error(res.message);
      return;
    }
    window.location.href = res.url; // on reste « occupé » pendant la redirection
  };

  return (
    <div className="space-y-2.5">
      <div
        className="grid grid-cols-2 gap-1 rounded-xl border border-border bg-background p-1 text-xs font-bold"
        role="group"
        aria-label="Période de facturation"
      >
        {(["month", "year"] as const).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPeriod(p)}
            aria-pressed={period === p}
            className={`rounded-lg px-2 py-2 transition ${period === p ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
          >
            {p === "month"
              ? `Mensuel : ${fmtPrice(PRICES[tier].month)}`
              : `Annuel : ${fmtPrice(PRICES[tier].year)}`}
          </button>
        ))}
      </div>
      <Button onClick={pay} disabled={busy} className="h-12 w-full rounded-xl text-sm font-black">
        {busy ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <CreditCard className="mr-2 h-4 w-4" />
        )}
        Payer en ligne : Orange Money, Moov Money
      </Button>
      <p className="text-center text-[11px] font-medium text-muted-foreground">
        Paiement sécurisé par GeniusPay. Votre formule s&apos;active dès la confirmation, sans rien
        envoyer par WhatsApp.
      </p>
    </div>
  );
}
