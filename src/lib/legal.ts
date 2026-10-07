/**
 * Informations légales de BoutikBF, utilisées par les pages publiques
 * (mentions légales, confidentialité, conditions, contact…).
 * Les champs vides ne sont simplement pas affichés : complète-les pour
 * que tes pages soient les plus précises possible.
 */
export const LEGAL = {
  appName: "BoutikBF",
  lastUpdate: "6 octobre 2026",

  // Éditeur du service
  publisherName: "BoutikBF",
  legalForm: "", // ex. "Entreprise individuelle", "SARL"…
  address: "", // ex. "Secteur 15, Ouagadougou"
  country: "Burkina Faso",
  registration: "", // ex. "RCCM BF-OUA-2026-A-0000 · IFU 00000000X"
  publicationDirector: "", // nom du directeur de la publication

  // Contact
  email: "", // ex. "contact@boutikbf.com"
  phone: "+226 55 30 08 68",
  whatsapp: "22655300868", // format international sans « + »

  // Hébergeur du site web (en plus de Supabase pour la base de données)
  hostName: "", // ex. "Vercel Inc."
  hostAddress: "", // ex. "440 N Barranca Ave #4133, Covina, CA 91723, États-Unis"
};

export function whatsappLink(message = "Bonjour BoutikBF, j'ai une question.") {
  return `https://wa.me/${LEGAL.whatsapp}?text=${encodeURIComponent(message)}`;
}
