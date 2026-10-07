import { createFileRoute } from "@tanstack/react-router";
import { LegalLayout, LegalSection, Strong } from "@/components/legal/legal-layout";
import { LEGAL, whatsappLink } from "@/lib/legal";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — BoutikBF" },
      { name: "description", content: "Contactez l'équipe BoutikBF par téléphone ou WhatsApp." },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <LegalLayout
      title="Nous contacter"
      intro="Notre équipe vous répond directement. Choisissez le moyen le plus simple pour vous."
    >
      <LegalSection title="Assistance et abonnements">
        <div className="flex flex-wrap gap-3">
          <a
            href={whatsappLink()}
            target="_blank"
            rel="noreferrer noopener"
            className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            Écrire sur WhatsApp
          </a>
          <a
            href={`tel:${LEGAL.phone.replace(/\s/g, "")}`}
            className="rounded-xl border border-border px-5 py-3 text-sm font-semibold text-foreground hover:bg-secondary"
          >
            Appeler le {LEGAL.phone}
          </a>
        </div>
        {LEGAL.email && (
          <p>
            Par e-mail : <Strong>{LEGAL.email}</Strong>
          </p>
        )}
      </LegalSection>

      <LegalSection title="Données personnelles">
        <p>
          Pour exercer vos droits (accès, rectification, suppression…), contactez-nous par l&apos;un
          des moyens ci-dessus en précisant l&apos;adresse e-mail ou le numéro associé à votre
          compte.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
