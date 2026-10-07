import { createFileRoute, Link } from "@tanstack/react-router";
import { LegalLayout, LegalSection, UL, Strong } from "@/components/legal/legal-layout";

export const Route = createFileRoute("/cookies")({
  head: () => ({
    meta: [
      { title: "Cookies et stockage local — BoutikBF" },
      {
        name: "description",
        content: "Ce que BoutikBF enregistre sur votre appareil et pourquoi.",
      },
    ],
  }),
  component: CookiesPage,
});

const ITEMS = [
  {
    name: "sb-…-auth-token",
    purpose: "Maintient votre connexion à votre compte.",
    duration: "Jusqu'à la déconnexion ou l'expiration de la session",
  },
  {
    name: "boutikbf-employee-session",
    purpose: "Maintient la connexion d'un employé (jeton de session, sans le PIN).",
    duration: "12 heures maximum, effacé à la déconnexion",
  },
  {
    name: "boutikbf-shops-cache, boutikbf-current-shop",
    purpose: "Affiche plus vite votre boutique. Effacés à la déconnexion.",
    duration: "Jusqu'à la déconnexion",
  },
  {
    name: "boutikbf-theme",
    purpose: "Mémorise votre choix d'affichage (clair ou sombre).",
    duration: "Jusqu'à ce que vous l'effaciez",
  },
  {
    name: "boutikbf-cookie-notice",
    purpose: "Se souvient que vous avez lu le bandeau d'information.",
    duration: "Jusqu'à ce que vous l'effaciez",
  },
];

function CookiesPage() {
  return (
    <LegalLayout
      title="Cookies et stockage local"
      intro="BoutikBF n'utilise aucun cookie publicitaire, aucun outil de suivi d'audience et aucun pixel de réseaux sociaux. Nous enregistrons seulement sur votre appareil ce qui est nécessaire au fonctionnement de l'application."
    >
      <LegalSection title="1. Qu'est-ce que c'est ?">
        <p>
          Un cookie ou un stockage local est un petit fichier enregistré par votre navigateur. Il
          permet, par exemple, de vous garder connecté d&apos;une page à l&apos;autre.
        </p>
      </LegalSection>

      <LegalSection title="2. Ce que nous enregistrons">
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-left text-xs">
            <thead className="bg-secondary/40 text-foreground">
              <tr>
                <th className="p-3 font-semibold">Nom</th>
                <th className="p-3 font-semibold">À quoi ça sert</th>
                <th className="p-3 font-semibold">Durée</th>
              </tr>
            </thead>
            <tbody>
              {ITEMS.map((i) => (
                <tr key={i.name} className="border-t border-border align-top">
                  <td className="p-3 font-mono text-[11px] text-foreground">{i.name}</td>
                  <td className="p-3">{i.purpose}</td>
                  <td className="p-3">{i.duration}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          Tous sont <Strong>strictement nécessaires</Strong> au service que vous demandez.
          C&apos;est pourquoi ils ne demandent pas de consentement préalable.
        </p>
      </LegalSection>

      <LegalSection title="3. Services tiers">
        <UL>
          <li>
            <Strong>Google Fonts</Strong> : les polices du site sont chargées depuis les serveurs de
            Google, qui peut recevoir votre adresse IP pour les envoyer. Aucun cookie n&apos;est
            déposé par BoutikBF à cette occasion.
          </li>
          <li>
            <Strong>jsDelivr</Strong> : lors de l&apos;ouverture d&apos;un reçu à imprimer ou à
            enregistrer en PDF, des bibliothèques sont chargées depuis ce réseau de diffusion.
          </li>
          <li>
            <Strong>WhatsApp</Strong> : si vous cliquez sur un lien de contact WhatsApp, vous
            quittez BoutikBF et WhatsApp applique ses propres règles.
          </li>
        </UL>
      </LegalSection>

      <LegalSection title="4. Les contrôler ou les supprimer">
        <p>
          Vous pouvez effacer les données du site dans les paramètres de votre navigateur (« Effacer
          les données de navigation »). Vous serez alors déconnecté et vos préférences seront
          réinitialisées. Bloquer ce stockage empêchera la connexion de fonctionner.
        </p>
      </LegalSection>

      <LegalSection title="5. En savoir plus">
        <p>
          Consultez notre{" "}
          <Link to="/confidentialite" className="font-semibold text-primary underline">
            politique de confidentialité
          </Link>{" "}
          pour savoir comment nous traitons vos données personnelles.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
