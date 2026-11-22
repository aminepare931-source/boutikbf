import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, Clock, Loader2, XCircle } from "lucide-react";
import logo from "@/assets/logo-trim.png";
import { confirmPayment } from "@/lib/payments/client";

export const Route = createFileRoute("/paiement/retour")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>): { ref?: string; status?: string } => ({
    ref: typeof s.ref === "string" ? s.ref : undefined,
    status: typeof s.status === "string" ? s.status : undefined,
  }),
  head: () => ({ meta: [{ title: "Paiement BoutikBF" }, { name: "robots", content: "noindex" }] }),
  component: PaymentReturn,
});

type View = "checking" | "paid" | "waiting" | "failed" | "unknown";

const POLL_MS = 4_000;
const MAX_TRIES = 30; // environ 2 minutes

function PaymentReturn() {
  const { ref } = Route.useSearch();
  const [view, setView] = useState<View>(ref ? "checking" : "unknown");
  const [plan, setPlan] = useState<string | null>(null);

  useEffect(() => {
    if (!ref) return;
    let cancelled = false;
    let tries = 0;
    let timer: ReturnType<typeof setTimeout>;

    // Le paiement est relu chez GeniusPay à chaque vérification : on ne croit jamais l'adresse du retour.
    const check = async () => {
      const res = await confirmPayment(ref);
      if (cancelled) return;
      tries += 1;
      if (res?.status === "paid") {
        setPlan(res.plan);
        setView("paid");
        return;
      }
      if (res && ["failed", "cancelled", "expired", "refunded"].includes(res.status)) {
        setView("failed");
        return;
      }
      if (tries >= MAX_TRIES) {
        setView(res ? "waiting" : "unknown");
        return;
      }
      timer = setTimeout(check, POLL_MS);
    };
    void check();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [ref]);

  const planLabel = plan === "pro" ? "Pro" : plan ? "Essentiel" : null;

  return (
    <div className="grid min-h-screen place-items-center bg-gradient-to-b from-white to-bk-mint/50 p-5 font-sans text-bk-ink">
      <main className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-[0_18px_50px_rgba(10,59,37,0.12)]">
        <img src={logo} alt="BoutikBF" className="mx-auto h-14 w-auto" />

        <div className="mt-6" role="status" aria-live="polite">
          {view === "checking" && (
            <>
              <Loader2 className="mx-auto h-10 w-10 animate-spin text-bk" aria-hidden="true" />
              <h1 className="mt-4 font-jakarta text-xl font-extrabold">
                Vérification de votre paiement
              </h1>
              <p className="mt-2 text-sm text-bk-ink/70">
                Quelques secondes. Ne fermez pas cette page.
              </p>
            </>
          )}
          {view === "paid" && (
            <>
              <CheckCircle2 className="mx-auto h-12 w-12 text-bk" aria-hidden="true" />
              <h1 className="mt-4 font-jakarta text-xl font-extrabold">Paiement confirmé</h1>
              <p className="mt-2 text-sm text-bk-ink/70">
                {planLabel ? `Votre formule ${planLabel} est active.` : "Votre formule est active."}{" "}
                Merci de votre confiance.
              </p>
              <Link
                to="/start"
                className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-bk px-6 py-3 font-bold text-white hover:bg-bk-dark"
              >
                Retourner à BoutikBF
              </Link>
            </>
          )}
          {view === "waiting" && (
            <>
              <Clock className="mx-auto h-12 w-12 text-amber-500" aria-hidden="true" />
              <h1 className="mt-4 font-jakarta text-xl font-extrabold">
                Paiement en cours de traitement
              </h1>
              <p className="mt-2 text-sm text-bk-ink/70">
                Cela peut prendre quelques minutes. Votre formule s&apos;activera automatiquement
                dès la confirmation de l&apos;opérateur. Vous pouvez fermer cette page.
              </p>
              <Link
                to="/start"
                className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-bk px-6 py-3 font-bold text-white hover:bg-bk-dark"
              >
                Retourner à BoutikBF
              </Link>
            </>
          )}
          {view === "failed" && (
            <>
              <XCircle className="mx-auto h-12 w-12 text-red-600" aria-hidden="true" />
              <h1 className="mt-4 font-jakarta text-xl font-extrabold">
                Le paiement n&apos;a pas abouti
              </h1>
              <p className="mt-2 text-sm text-bk-ink/70">
                Aucune formule n&apos;a été activée. Si de l&apos;argent a été débité,
                contactez-nous avec la référence ci-dessous.
              </p>
              <Link
                to="/settings"
                className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-bk px-6 py-3 font-bold text-white hover:bg-bk-dark"
              >
                Réessayer le paiement
              </Link>
            </>
          )}
          {view === "unknown" && (
            <>
              <XCircle className="mx-auto h-12 w-12 text-bk-ink/40" aria-hidden="true" />
              <h1 className="mt-4 font-jakarta text-xl font-extrabold">Paiement introuvable</h1>
              <p className="mt-2 text-sm text-bk-ink/70">
                Nous n&apos;avons pas retrouvé ce paiement. S&apos;il a été débité, contactez-nous.
              </p>
              <Link
                to="/start"
                className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-bk px-6 py-3 font-bold text-white hover:bg-bk-dark"
              >
                Retourner à BoutikBF
              </Link>
            </>
          )}
        </div>

        {ref && (
          <p className="mt-6 text-xs text-bk-ink/50">
            Référence : <span className="font-mono">{ref}</span>
          </p>
        )}
        <a
          href="https://wa.me/22655300868"
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-block text-xs font-semibold text-bk underline underline-offset-4"
        >
          Un problème ? Écrire au support sur WhatsApp
        </a>
      </main>
    </div>
  );
}
