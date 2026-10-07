import { createFileRoute, Link } from "@tanstack/react-router";
import { LegalLayout, LegalSection, UL } from "@/components/legal/legal-layout";
import { LEGAL } from "@/lib/legal";

export const Route = createFileRoute("/a-propos")({
  head: () => ({
    meta: [
      { title: "À propos — BoutikBF" },
      {
        name: "description",
        content:
          "BoutikBF, la caisse et la gestion de stock pensées pour les commerces du Burkina Faso.",
      },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <LegalLayout
      title="À propos de BoutikBF"
      intro="BoutikBF est une application de gestion de commerce pensée au Burkina Faso, pour les boutiques, commerces et vendeurs d'ici."
    >
      <LegalSection title="Notre mission">
        <p>
          Aider chaque commerçant à mieux tenir sa boutique : savoir ce qu&apos;il vend, ce
          qu&apos;il lui reste en stock, qui lui doit de l&apos;argent et combien il gagne, sans
          cahier ni calculs compliqués.
        </p>
      </LegalSection>

      <LegalSection title="Ce que vous pouvez faire">
        <UL>
          <li>
            Encaisser rapidement avec une caisse simple, y compris avec un lecteur de codes-barres.
          </li>
          <li>Suivre vos produits, vos stocks et vos fournisseurs.</li>
          <li>Gérer vos clients, leurs crédits et leurs points de fidélité.</li>
          <li>Donner un accès adapté à chaque employé (caissier, magasinier, comptable…).</li>
          <li>Suivre vos ventes, votre comptabilité et vos rapports.</li>
        </UL>
      </LegalSection>

      <LegalSection title="Nos engagements">
        <UL>
          <li>Des tarifs clairs en francs CFA, sans engagement de longue durée.</li>
          <li>
            Vos données restent les vôtres et ne sont ni vendues ni utilisées pour de la publicité.
          </li>
          <li>Une assistance humaine, accessible par téléphone ou WhatsApp.</li>
        </UL>
      </LegalSection>

      <LegalSection title="Nous contacter">
        <p>
          Une question, une idée, un souci ? Rendez-vous sur la page{" "}
          <Link to="/contact" className="font-semibold text-primary underline">
            Contact
          </Link>{" "}
          ou appelez le {LEGAL.phone}.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
