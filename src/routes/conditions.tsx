import { createFileRoute, Link } from "@tanstack/react-router";
import { LegalLayout, LegalSection, UL, Strong } from "@/components/legal/legal-layout";
import { LEGAL } from "@/lib/legal";

export const Route = createFileRoute("/conditions")({
  head: () => ({
    meta: [
      { title: "Conditions d'utilisation — BoutikBF" },
      {
        name: "description",
        content: "Conditions générales d'utilisation et de vente de BoutikBF.",
      },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <LegalLayout
      title="Conditions générales d'utilisation et de vente"
      intro={`Ces conditions encadrent l'utilisation de ${LEGAL.appName}. En créant un compte ou en utilisant l'application, vous les acceptez.`}
    >
      <LegalSection title="1. Le service">
        <p>
          {LEGAL.appName} est une application en ligne de gestion de commerce : caisse, produits,
          stock, clients, fournisseurs, équipe, comptabilité et rapports. Elle est destinée aux
          professionnels.
        </p>
      </LegalSection>

      <LegalSection title="2. Votre compte">
        <UL>
          <li>Vous devez fournir des informations exactes et les tenir à jour.</li>
          <li>
            Vous êtes responsable de la confidentialité de vos accès et de ceux de vos employés.
          </li>
          <li>
            Vous pouvez créer des comptes employés (nom + code PIN) avec des droits adaptés à leur
            rôle.
          </li>
          <li>
            Prévenez-nous sans délai si vous pensez que votre compte a été utilisé à votre insu.
          </li>
        </UL>
      </LegalSection>

      <LegalSection title="3. Formules, essai et paiement">
        <UL>
          <li>
            Une période d&apos;essai gratuite est proposée à la création de la boutique. Sa durée et
            son éventuelle prolongation sont indiquées dans l&apos;application.
          </li>
          <li>
            Les formules payantes (Essentiel, Pro, Sur mesure) et leurs tarifs sont ceux affichés
            sur la page d&apos;accueil, en francs CFA. Les limites (par exemple le nombre
            d&apos;employés) dépendent de la formule.
          </li>
          <li>
            Le paiement s&apos;effectue en dehors de l&apos;application (par exemple par Mobile
            Money) après prise de contact avec nous. La formule est activée à réception du paiement.
          </li>
          <li>
            Sans paiement à la fin de l&apos;essai ou de la période payée, l&apos;accès à la
            boutique peut être <Strong>suspendu</Strong>. Vos données sont conservées et
            l&apos;accès est rétabli dès régularisation.
          </li>
          <li>
            Les sommes déjà versées pour une période entamée ne sont pas remboursables, sauf erreur
            de notre part.
          </li>
        </UL>
      </LegalSection>

      <LegalSection title="4. Utilisation correcte">
        <p>Vous vous engagez à ne pas :</p>
        <UL>
          <li>utiliser le service pour une activité illégale ou frauduleuse ;</li>
          <li>
            tenter d&apos;accéder aux données d&apos;une autre boutique ou de contourner les
            protections ;
          </li>
          <li>
            perturber le fonctionnement du service (attaques, envois massifs, copie automatisée) ;
          </li>
          <li>
            enregistrer des données sensibles ou des informations sur des personnes sans y être
            autorisé.
          </li>
        </UL>
        <p>En cas de manquement grave, nous pouvons suspendre ou fermer le compte.</p>
      </LegalSection>

      <LegalSection title="5. Vos données">
        <p>
          Les données que vous saisissez (produits, ventes, clients, etc.) vous appartiennent. Vous
          nous autorisez simplement à les héberger et à les traiter pour faire fonctionner le
          service. Vous restez responsable de leur exactitude et du respect de la loi vis-à-vis de
          vos clients et employés. Voir la{" "}
          <Link to="/confidentialite" className="font-semibold text-primary underline">
            politique de confidentialité
          </Link>
          . Pensez à exporter régulièrement vos données importantes.
        </p>
      </LegalSection>

      <LegalSection title="6. Disponibilité et évolutions">
        <p>
          Nous mettons tout en œuvre pour un service disponible et sûr, sans pouvoir garantir une
          absence totale d&apos;interruption (maintenance, panne de réseau ou de prestataire). Le
          service évolue : des fonctions peuvent être ajoutées, modifiées ou retirées.
        </p>
      </LegalSection>

      <LegalSection title="7. Responsabilité">
        <p>
          Dans la limite permise par la loi, notre responsabilité est limitée aux dommages directs
          et ne peut dépasser les sommes que vous avez versées pour le service sur les 12 derniers
          mois. Nous ne sommes pas responsables des pertes indirectes (perte de bénéfices, de
          clientèle…) ni des erreurs dues à des données mal saisies, à un appareil ou une connexion
          défaillants, ou au non-respect des présentes conditions.
        </p>
      </LegalSection>

      <LegalSection title="8. Fin du contrat">
        <p>
          Vous pouvez arrêter d&apos;utiliser le service et demander la suppression de votre compte
          à tout moment. Nous pouvons fermer un compte en cas de manquement, avec un préavis
          raisonnable sauf urgence. À la fermeture, vos données sont supprimées selon la politique
          de confidentialité.
        </p>
      </LegalSection>

      <LegalSection title="9. Propriété intellectuelle">
        <p>
          {LEGAL.appName} (nom, logo, interface, code) reste notre propriété. Nous vous accordons un
          droit d&apos;utilisation personnel, non exclusif et non transférable, pendant la durée de
          votre abonnement.
        </p>
      </LegalSection>

      <LegalSection title="10. Modification des conditions">
        <p>
          Nous pouvons modifier ces conditions. La date de mise à jour figure en haut de la page.
          Continuer à utiliser le service après modification vaut acceptation.
        </p>
      </LegalSection>

      <LegalSection title="11. Droit applicable et litiges">
        <p>
          Ces conditions sont soumises au droit burkinabè. Nous privilégions le règlement amiable ;
          à défaut, les juridictions compétentes du Burkina Faso seront saisies.
        </p>
        <p>
          Une question ? Consultez la page{" "}
          <Link to="/contact" className="font-semibold text-primary underline">
            Contact
          </Link>
          .
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
