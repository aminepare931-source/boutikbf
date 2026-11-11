import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { supabase } from "@/integrations/supabase/client";
import { resolveLogoUrl } from "@/lib/shop-store";
import { fmtMoney, fmtNumber } from "@/lib/format";
import { Loader2, Printer, Star } from "lucide-react";

export const Route = createFileRoute("/f/$shopId/$customerId")({
  ssr: false,
  head: () => ({ meta: [{ name: "robots", content: "noindex" }] }),
  component: LoyaltyCardPage,
});

type Card = {
  ok: boolean;
  shop_name: string;
  logo_url: string | null;
  currency: string;
  name: string;
  points: number;
  credit: number;
  birthdate: string | null;
  since: string;
};

function LoyaltyCardPage() {
  const { shopId, customerId } = Route.useParams();
  const [card, setCard] = useState<Card | null>(null);
  const [logo, setLogo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.rpc("loyalty_card", {
        p_shop_id: shopId,
        p_customer_id: customerId,
      });
      if (error) return setError(error.message);
      const c = data as Card;
      if (!c || c.ok !== true) return setError("Carte introuvable");
      setCard(c);
      document.title = `Carte fidélité — ${c.shop_name}`;
      setLogo(await resolveLogoUrl(c.logo_url));
    })();
  }, [shopId, customerId]);

  if (error)
    return (
      <div className="grid min-h-screen place-items-center bg-slate-950 p-6 text-center text-white">
        <div>
          <div className="text-5xl">🔍</div>
          <p className="mt-3 text-lg font-semibold">{error}</p>
          <p className="mt-1 text-sm text-white/50">Demande à la boutique de revérifier le lien.</p>
        </div>
      </div>
    );

  if (!card)
    return (
      <div className="grid min-h-screen place-items-center bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-white/60" />
      </div>
    );

  const url = typeof window !== "undefined" ? window.location.href : "";
  const money = (n: number) => fmtMoney(n, card.currency);

  return (
    <div className="grid min-h-screen place-items-center bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950 p-4">
      <div className="w-full max-w-sm">
        <div className="overflow-hidden rounded-3xl bg-white shadow-2xl">
          <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 p-5 text-center text-white">
            {logo ? (
              <img src={logo} alt="" className="mx-auto mb-2 h-14 w-auto" />
            ) : (
              <div className="mb-2 text-4xl">🏪</div>
            )}
            <div className="text-lg font-black tracking-wide">{card.shop_name}</div>
            <div className="text-xs uppercase tracking-widest text-white/80">Carte fidélité</div>
          </div>

          <div className="p-5 text-center">
            <div className="text-xl font-bold text-slate-900">{card.name}</div>
            <div className="text-xs text-slate-500">
              client depuis {new Date(card.since).getFullYear()}
            </div>

            <div className="my-4 flex justify-center">
              <div className="rounded-2xl border-4 border-emerald-500/20 bg-emerald-50 p-3">
                <QRCodeSVG value={url} size={168} level="M" />
              </div>
            </div>
            <p className="text-[11px] text-slate-500">
              Présente ce QR à la caisse — le client est reconnu automatiquement.
            </p>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-amber-50 p-3 text-center">
                <Star className="mx-auto h-4 w-4 text-amber-500" />
                <div className="font-display text-2xl font-black text-amber-600">
                  {fmtNumber(card.points)}
                </div>
                <div className="text-[10px] uppercase tracking-wide text-amber-700/70">points</div>
              </div>
              <div className="rounded-xl bg-rose-50 p-3 text-center">
                <div className="font-display text-xl font-black leading-[1.9] text-rose-600">
                  {money(card.credit)}
                </div>
                <div className="text-[10px] uppercase tracking-wide text-rose-700/70">
                  reste à payer
                </div>
              </div>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => window.print()}
          className="mx-auto mt-4 flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/20 print:hidden"
        >
          <Printer className="h-4 w-4" /> Imprimer / enregistrer en PDF
        </button>
      </div>
    </div>
  );
}
