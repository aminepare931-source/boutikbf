import { createFileRoute, Link } from "@tanstack/react-router";
import { LegalLayout, LegalSection, UL, Strong } from "@/components/legal/legal-layout";
import { LEGAL } from "@/lib/legal";

export const Route = createFileRoute("/confidentialite")({
  head: () => ({
    meta: [
      { title: "Politique de confidentialité — BoutikBF" },
      {
        name: "description",
        content: "Comment BoutikBF collecte, utilise et protège vos données personnelles.",
      },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  const contact = LEGAL.email ? LEGAL.email : `${LEGAL.phone} (appel ou WhatsApp)`;
  return (
    <LegalLayout
      title="Politique de confidentialité"
      intro="Cette politique explique quelles données personnelles BoutikBF traite, pourquoi, combien de temps nous les conservons et quels sont vos droits. Elle s'appuie sur la loi n° 001-2021/AN du 30 mars 2021 portant protection des personnes à l'égard du traitement des données à caractère personnel au Burkina Faso."
    >
      <LegalSection title="1. Qui est responsable de vos données ?">
        <p>
          <Strong>{LEGAL.publisherName}</Strong> édite l&apos;application {LEGAL.appName} (caisse,
          stock, clients et comptabilité pour les commerces). Pour les données de votre compte, nous
          sommes <Strong>responsable du traitement</Strong>.
        </p>
        <p>
          Pour les données de <Strong>vos propres clients, fournisseurs et employés</Strong> que
          vous saisissez dans l&apos;application, c&apos;est <Strong>vous</Strong> (le commerçant)
          qui êtes responsable du traitement. BoutikBF agit alors comme{" "}
          <Strong>sous-traitant</Strong> : nous ne les utilisons que pour faire fonctionner le
          service pour vous.
        </p>
      </LegalSection>

      <LegalSection title="2. Quelles données collectons-nous ?">
        <UL>
          <li>
            <Strong>Compte :</Strong> nom, adresse e-mail, numéro de téléphone, mot de passe
            (conservé uniquement sous forme chiffrée, nous ne pouvons pas le lire).
          </li>
          <li>
            <Strong>Boutique :</Strong> nom, logo, coordonnées, devise, produits, prix, stocks,
            catégories, fournisseurs, ventes, reçus et mouvements de stock.
          </li>
          <li>
            <Strong>Clients de votre boutique :</Strong> nom, téléphone, e-mail, adresse, points de
            fidélité, crédit, notes — uniquement ce que vous choisissez de saisir.
          </li>
          <li>
            <Strong>Employés :</Strong> nom, téléphone, rôle, ventes réalisées et messages internes.
            Le code PIN est conservé <Strong>chiffré</Strong> et ne peut plus être relu, même par
            nous.
          </li>
          <li>
            <Strong>Fichiers importés :</Strong> les fichiers CSV/Excel que vous importez pour créer
            vos produits.
          </li>
          <li>
            <Strong>Données techniques :</Strong> date de dernière connexion, adresse IP et type
            d&apos;appareil traités par nos prestataires techniques, tentatives de connexion employé
            (conservées environ 24 h pour la sécurité).
          </li>
          <li>
            <Strong>Abonnement :</Strong> formule choisie, date de fin d&apos;essai et notes
            internes de suivi (par exemple la confirmation d&apos;un paiement reçu par Mobile
            Money). BoutikBF ne collecte aucun numéro de carte bancaire dans l&apos;application.
          </li>
        </UL>
        <p>
          Nous ne demandons pas de données sensibles (santé, opinions, origine, etc.) et vous
          demandons de ne pas en saisir.
        </p>
      </LegalSection>

      <LegalSection title="3. Pourquoi et sur quelle base ?">
        <UL>
          <li>
            <Strong>Fournir le service</Strong> (compte, caisse, stock, rapports, équipe) —
            exécution du contrat.
          </li>
          <li>
            <Strong>Gérer votre abonnement</Strong> (essai, formule, suspension en cas
            d&apos;impayé) — exécution du contrat.
          </li>
          <li>
            <Strong>Sécuriser le service</Strong> (limitation des essais de connexion, journal des
            actions d&apos;administration, prévention des abus) — intérêt légitime.
          </li>
          <li>
            <Strong>Vous répondre</Strong> (assistance par téléphone ou WhatsApp) — intérêt légitime
            et exécution du contrat.
          </li>
          <li>
            <Strong>Respecter la loi</Strong> lorsque nous y sommes tenus — obligation légale.
          </li>
        </UL>
        <p>
          Nous ne vendons pas vos données et nous ne faisons ni publicité ciblée ni profilage
          commercial.
        </p>
      </LegalSection>

      <LegalSection title="4. Qui peut accéder à vos données ?">
        <UL>
          <li>
            <Strong>Vous et votre équipe</Strong> : chaque boutique est cloisonnée. Un employé
            n&apos;accède qu&apos;à la boutique et aux fonctions autorisées par son rôle.
          </li>
          <li>
            <Strong>L&apos;équipe BoutikBF</Strong>, uniquement pour l&apos;assistance, la gestion
            des abonnements et la sécurité. Ces actions sont enregistrées dans un journal.
          </li>
          <li>
            <Strong>Nos prestataires techniques</Strong> : Supabase (base de données,
            authentification, stockage des fichiers), notre hébergeur web, Google Fonts (polices
            d&apos;affichage) et jsDelivr (bibliothèques chargées lors de l&apos;ouverture d&apos;un
            reçu PDF).
          </li>
          <li>
            <Strong>Les autorités</Strong>, uniquement sur demande légale valide.
          </li>
        </UL>
      </LegalSection>

      <LegalSection title="5. Transferts hors du Burkina Faso">
        <p>
          Nos prestataires peuvent héberger les données sur des serveurs situés hors du Burkina
          Faso. Nous choisissons des prestataires qui appliquent des mesures de sécurité reconnues
          et nous limitons les données transmises au strict nécessaire, conformément à la
          réglementation applicable.
        </p>
      </LegalSection>

      <LegalSection title="6. Combien de temps conservons-nous les données ?">
        <UL>
          <li>Données de compte et de boutique : tant que votre compte est actif.</li>
          <li>
            Après suppression du compte ou de la boutique : suppression de nos bases, sauf
            obligation légale de conservation. Les copies de sauvegarde sont écrasées selon le cycle
            de rotation du prestataire.
          </li>
          <li>Sessions employé : 12 heures maximum, puis expiration automatique.</li>
          <li>Tentatives de connexion employé : environ 24 heures.</li>
          <li>
            Pièces de vente et données comptables : conservez-les selon vos obligations légales de
            commerçant ; vous pouvez les exporter avant toute suppression.
          </li>
        </UL>
      </LegalSection>

      <LegalSection title="7. Comment protégeons-nous vos données ?">
        <UL>
          <li>Connexion chiffrée (HTTPS) et mots de passe chiffrés.</li>
          <li>
            Codes PIN des employés chiffrés, avec blocage temporaire après plusieurs essais
            incorrects.
          </li>
          <li>
            Cloisonnement strict des données par boutique et droits limités selon le rôle de chaque
            employé.
          </li>
          <li>
            Journal des actions d&apos;administration et suspension possible d&apos;un compte
            compromis.
          </li>
        </UL>
        <p>
          Aucun système n&apos;est infaillible : choisissez un mot de passe solide, ne partagez pas
          vos accès et prévenez-nous rapidement en cas de problème.
        </p>
      </LegalSection>

      <LegalSection title="8. Vos droits">
        <p>
          Vous pouvez à tout moment demander l&apos;<Strong>accès</Strong> à vos données, leur{" "}
          <Strong>rectification</Strong>, leur <Strong>effacement</Strong>, la{" "}
          <Strong>limitation</Strong> ou l&apos;<Strong>opposition</Strong> à un traitement, ainsi
          que leur <Strong>portabilité</Strong> lorsque la loi le permet. Vous pouvez aussi retirer
          un consentement donné.
        </p>
        <p>
          Pour exercer vos droits : <Strong>{contact}</Strong>. Nous répondons dans un délai
          raisonnable, et nous pouvons vous demander de justifier de votre identité.
        </p>
        <p>
          Si vous estimez que vos droits ne sont pas respectés, vous pouvez saisir la{" "}
          <Strong>Commission de l&apos;Informatique et des Libertés (CIL)</Strong> du Burkina Faso.
        </p>
        <p>
          Si vous êtes client d&apos;un commerçant utilisateur de BoutikBF, adressez d&apos;abord
          votre demande à ce commerçant, qui est responsable de vos données.
        </p>
      </LegalSection>

      <LegalSection title="9. Cookies et stockage local">
        <p>
          Nous utilisons uniquement du stockage strictement nécessaire. Le détail est dans notre{" "}
          <Link to="/cookies" className="font-semibold text-primary underline">
            page Cookies
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection title="10. Mineurs">
        <p>
          BoutikBF s&apos;adresse à des professionnels et n&apos;est pas destiné aux personnes de
          moins de 18 ans.
        </p>
      </LegalSection>

      <LegalSection title="11. Modifications">
        <p>
          Nous pouvons mettre à jour cette politique. La date de mise à jour figure en haut de la
          page ; en cas de changement important, nous vous en informerons dans l&apos;application.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
