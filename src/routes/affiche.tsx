import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Printer } from "lucide-react";
import logo from "@/assets/logo-trim.png";

/**
 * Affichette A4 imprimable avec QR code.
 *  - /affiche                  : « Installer BoutikBF » (à donner à un nouveau client)
 *  - /affiche?mode=equipe&b=…  : « Connexion de l'équipe » d'une boutique (code boutique inclus)
 * Le QR code est dessiné en vectoriel : il reste net à l'impression, quelle que soit la taille.
 */
export const Route = createFileRoute("/affiche")({
  ssr: false,
  validateSearch: (
    s: Record<string, unknown>,
  ): { mode: "installer" | "equipe"; b?: string; n?: string } => ({
    mode: s.mode === "equipe" ? "equipe" : "installer",
    b: typeof s.b === "string" ? s.b.slice(0, 60) : undefined,
    n: typeof s.n === "string" ? s.n.slice(0, 80) : undefined,
  }),
  head: () => ({
    meta: [{ title: "Affichette BoutikBF" }, { name: "robots", content: "noindex" }],
  }),
  component: PosterPage,
});

const SUPPORT_PHONE = "+226 55 30 08 68";

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-4">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-bk text-lg font-extrabold text-white print:bg-bk">
        {n}
      </span>
      <span className="pt-1 text-xl leading-snug text-bk-ink">{children}</span>
    </li>
  );
}

function PosterPage() {
  const { mode, b, n } = Route.useSearch();
  const [origin, setOrigin] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);

  const team = mode === "equipe";
  const missingCode = team && !b;
  const url = !origin
    ? ""
    : team
      ? `${origin}/auth-employee?b=${encodeURIComponent(b ?? "")}`
      : `${origin}/installer`;
  const host = origin.replace(/^https?:\/\//, "");

  return (
    <div className="min-h-screen bg-neutral-200 p-4 font-sans text-bk-ink print:bg-white print:p-0">
      <style>{`@page { size: A4; margin: 0 } @media print { html, body { background: #fff !important; } }`}</style>

      <div className="mx-auto mb-4 flex max-w-[794px] flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex gap-2 text-sm font-semibold">
          <Link
            to="/affiche"
            search={{ mode: "installer" }}
            className={`rounded-full px-4 py-2 ${!team ? "bg-bk text-white" : "bg-white text-bk-ink"}`}
          >
            Installer BoutikBF
          </Link>
          {b && (
            <Link
              to="/affiche"
              search={{ mode: "equipe", b, n }}
              className={`rounded-full px-4 py-2 ${team ? "bg-bk text-white" : "bg-white text-bk-ink"}`}
            >
              Connexion de l&apos;équipe
            </Link>
          )}
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-full bg-bk px-5 py-2.5 text-sm font-bold text-white hover:bg-bk-dark"
        >
          <Printer className="h-4 w-4" aria-hidden="true" />
          Imprimer ou enregistrer en PDF
        </button>
      </div>

      <article
        className="mx-auto flex aspect-[210/297] w-full max-w-[794px] flex-col overflow-hidden bg-white shadow-xl print:aspect-auto print:h-[297mm] print:w-[210mm] print:max-w-none print:shadow-none"
        aria-label="Affichette"
      >
        <header className="flex items-center justify-center bg-bk-mint py-6 print:bg-bk-mint">
          <img src={logo} alt="BoutikBF" className="h-24 w-auto" />
        </header>

        <div className="flex flex-1 flex-col items-center px-12 pb-8 pt-8 text-center">
          {team ? (
            <>
              <p className="text-xl font-semibold text-bk">
                {n ? `Équipe de ${n}` : "Équipe de la boutique"}
              </p>
              <h1 className="mt-2 font-jakarta text-5xl font-extrabold leading-tight tracking-tight">
                Connexion à la caisse
              </h1>
            </>
          ) : (
            <>
              <h1 className="font-jakarta text-5xl font-extrabold leading-tight tracking-tight">
                Gérez votre boutique
                <br />
                <span className="text-bk">avec BoutikBF</span>
              </h1>
              <p className="mt-4 max-w-xl text-2xl text-bk-ink/75">
                Caisse, stock, ventes et clients. Même quand le réseau coupe.
              </p>
            </>
          )}

          <div className="mt-8 rounded-3xl border-4 border-bk bg-white p-5">
            {missingCode ? (
              <p className="grid h-[300px] w-[300px] place-items-center text-lg font-semibold text-red-600">
                Code boutique manquant
              </p>
            ) : url ? (
              <QRCodeSVG value={url} size={300} level="M" marginSize={0} />
            ) : (
              <div className="h-[300px] w-[300px]" />
            )}
          </div>
          <p className="mt-4 text-2xl font-extrabold text-bk">
            {team ? "Scannez pour vous connecter" : "Scannez pour installer l'application"}
          </p>
          {team && b && (
            <p className="mt-2 text-lg text-bk-ink/70">
              Code de la boutique : <strong className="font-mono text-2xl text-bk-ink">{b}</strong>
            </p>
          )}

          <ol className="mt-8 w-full max-w-xl space-y-4 text-left">
            {team ? (
              <>
                <Step n={1}>Scannez ce code avec l&apos;appareil photo du téléphone.</Step>
                <Step n={2}>Entrez votre nom et votre code PIN.</Step>
                <Step n={3}>Installez l&apos;application sur votre écran d&apos;accueil.</Step>
              </>
            ) : (
              <>
                <Step n={1}>Scannez ce code avec l&apos;appareil photo du téléphone.</Step>
                <Step n={2}>Installez l&apos;application, en deux minutes.</Step>
                <Step n={3}>Créez votre compte et faites votre première vente.</Step>
              </>
            )}
          </ol>

          {!team && (
            <ul className="mt-8 flex flex-wrap justify-center gap-3 text-lg font-bold text-bk">
              {["15 jours gratuits", "Sans carte bancaire", "Orange Money et Moov Money"].map(
                (t) => (
                  <li key={t} className="rounded-full bg-bk-mint px-5 py-2 print:bg-bk-mint">
                    {t}
                  </li>
                ),
              )}
            </ul>
          )}
        </div>

        <footer className="bg-bk-deep px-10 py-5 text-center text-white print:bg-bk-deep">
          {team ? (
            <p className="text-lg font-semibold">Ne partagez jamais votre code PIN.</p>
          ) : (
            <p className="text-lg font-semibold">
              Besoin d&apos;aide ? WhatsApp {SUPPORT_PHONE}
              {host ? <span className="ml-3 text-white/70">{host}</span> : null}
            </p>
          )}
        </footer>
      </article>
    </div>
  );
}
