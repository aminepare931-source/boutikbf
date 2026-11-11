import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/display")({
  ssr: false,
  head: () => ({
    meta: [{ title: "Affichage client — BoutikBF" }, { name: "robots", content: "noindex" }],
  }),
  component: DisplayPage,
});

export type DisplayPayload = {
  shopName: string;
  logoUrl: string | null;
  currency: string;
  lines: { name: string; qty: number | string; total: number }[];
  subtotal: number;
  discount: number;
  total: number;
  message?: string | null; // ex : « Merci ! » après encaissement
  change?: number;
  ts: number;
};

/**
 * Écran client (2ᵉ moniteur ou tablette face au comptoir).
 * Ouvre cette page sur l'autre écran ; la caisse lui envoie le ticket en
 * direct via BroadcastChannel (local au poste, rien ne passe par internet).
 */
function DisplayPage() {
  const [data, setData] = useState<DisplayPayload | null>(null);

  useEffect(() => {
    if (!("BroadcastChannel" in window)) return;
    const ch = new BroadcastChannel("boutikbf-display");
    ch.onmessage = (e) => {
      const p = e.data as DisplayPayload;
      if (p && typeof p.total === "number") setData(p);
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === "boutikbf-display-data" && e.newValue) {
        try {
          setData(JSON.parse(e.newValue) as DisplayPayload);
        } catch {
          /* ignore */
        }
      }
    };
    window.addEventListener("storage", onStorage);
    return () => {
      ch.close();
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const fmt = (n: number) =>
    new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(n || 0) +
    (data?.currency === "XOF" ? " F" : ` ${data?.currency ?? ""}`);

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-white">
      <header className="flex items-center gap-3 border-b border-white/10 p-5">
        {data?.logoUrl ? <img src={data.logoUrl} alt="" className="h-12 w-auto" /> : null}
        <span className="font-display text-xl font-bold">{data?.shopName ?? "Boutique"}</span>
        <span className="ml-auto rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-widest text-white/60">
          Écran client
        </span>
      </header>

      <main className="flex flex-1 flex-col p-6">
        {!data || data.lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
            <div className="text-7xl">🛒</div>
            <p className="text-2xl font-semibold text-white/70">Bienvenue !</p>
            <p className="text-sm text-white/40">
              Les articles de la caisse en cours s'afficheront ici automatiquement.
            </p>
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-2 overflow-y-auto">
              {data.lines.map((l, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3"
                >
                  <span className="truncate text-lg">{l.name}</span>
                  <span className="ml-3 shrink-0 text-right">
                    <span className="mr-3 text-sm text-white/50">×{l.qty}</span>
                    <span className="font-mono font-semibold">{fmt(l.total)}</span>
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 border-t-2 border-white/20 pt-4">
              {data.discount > 0 && (
                <div className="flex justify-between text-white/60">
                  <span>Sous-total</span>
                  <span className="font-mono">{fmt(data.subtotal)}</span>
                </div>
              )}
              <div className="flex items-end justify-between">
                <span className="text-xl font-semibold">TOTAL</span>
                <span className="font-display text-5xl font-black text-emerald-400">
                  {fmt(data.total)}
                </span>
              </div>
              {data.change ? (
                <div className="mt-2 text-right text-lg text-amber-300">
                  Monnaie à rendre : {fmt(data.change)}
                </div>
              ) : null}
              {data.message ? (
                <div className="mt-4 text-center text-2xl font-bold text-emerald-300">
                  {data.message} 🇧🇫
                </div>
              ) : null}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
