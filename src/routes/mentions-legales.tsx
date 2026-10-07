import { createFileRoute, Link } from "@tanstack/react-router";
import { LegalLayout, LegalSection, UL, Strong } from "@/components/legal/legal-layout";
import { LEGAL } from "@/lib/legal";

export const Route = createFileRoute("/mentions-legales")({
  head: () => ({
    meta: [
      { title: "Mentions légales — BoutikBF" },
      { name: "description", content: "Éditeur, hébergement et informations légales de BoutikBF." },
    ],
  }),
  component: LegalNoticePage,
});

function LegalNoticePage() {
  return (
    <LegalLayout title="Mentions légales">
      <LegalSection title="1. Éditeur du service">
        <UL>
          <li>
            <Strong>Nom :</Strong> {LEGAL.publisherName}
          </li>
          {LEGAL.legalForm && (
            <li>
              <Strong>Forme :</Strong> {LEGAL.legalForm}
            </li>
          )}
          {LEGAL.address && (
            <li>
              <Strong>Adresse :</Strong> {LEGAL.address}, {LEGAL.country}
            </li>
          )}
          {!LEGAL.address && (
            <li>
              <Strong>Pays :</Strong> {LEGAL.country}
            </li>
          )}
          {LEGAL.registration && (
            <li>
              <Strong>Immatriculation :</Strong> {LEGAL.registration}
            </li>
          )}
          {LEGAL.publicationDirector && (
            <li>
              <Strong>Directeur de la publication :</Strong> {LEGAL.publicationDirector}
            </li>
          )}
          <li>
            <Strong>Téléphone / WhatsApp :</Strong> {LEGAL.phone}
          </li>
          {LEGAL.email && (
            <li>
              <Strong>E-mail :</Strong> {LEGAL.email}
            </li>
          )}
        </UL>
      </LegalSection>

      <LegalSection title="2. Hébergement">
        <UL>
          {LEGAL.hostName && (
            <li>
              <Strong>Site web :</Strong> {LEGAL.hostName}
              {LEGAL.hostAddress ? `, ${LEGAL.hostAddress}` : ""}
            </li>
          )}
          <li>
            <Strong>Base de données, authentification et fichiers :</Strong> Supabase Inc.
          </li>
        </UL>
      </LegalSection>

      <LegalSection title="3. Propriété intellectuelle">
        <p>
          Le nom {LEGAL.appName}, le logo, l&apos;interface, les textes, les images et le code de
          l&apos;application sont protégés. Toute reproduction ou réutilisation sans autorisation
          écrite est interdite. Les données que vous saisissez dans l&apos;application restent votre
          propriété.
        </p>
      </LegalSection>

      <LegalSection title="4. Responsabilité">
        <p>
          Nous faisons le maximum pour que le service soit disponible et exact, sans garantir
          l&apos;absence totale d&apos;interruption ou d&apos;erreur. Les informations affichées
          (stocks, chiffres, rapports) dépendent des données que vous saisissez : vérifiez-les avant
          toute décision importante. Les liens vers des sites tiers (par exemple WhatsApp) sont
          fournis par commodité ; nous ne contrôlons pas leur contenu.
        </p>
      </LegalSection>

      <LegalSection title="5. Données personnelles et cookies">
        <p>
          Voir la{" "}
          <Link to="/confidentialite" className="font-semibold text-primary underline">
            politique de confidentialité
          </Link>{" "}
          et la page{" "}
          <Link to="/cookies" className="font-semibold text-primary underline">
            Cookies
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection title="6. Droit applicable">
        <p>
          Les présentes mentions sont soumises au droit burkinabè. En cas de litige, une solution
          amiable sera recherchée en priorité ; à défaut, les juridictions compétentes du Burkina
          Faso seront saisies.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
