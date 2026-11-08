export type Language = "fr" | "en" | "mo" | "di";

export interface TranslationSet {
  navFeatures: string;
  navSoftware: string;
  navDemo: string;
  navPricing: string;
  navFaq: string;
  login: string;
  freeTrial: string;
  badge: string;
  heroTitlePre: string;
  heroTitleHighlight: string;
  heroDesc: string;
  btnTryFree: string;
  btnTestSim: string;
  activeBoutiques: string;
  worksOffline: string;
  compliant: string;
  featuresTitle: string;
  featuresSub: string;
  posTitle: string;
  posDesc: string;
  posFooter: string;
  stockTitle: string;
  stockDesc: string;
  stockFooter: string;
  mobileMoneyTitle: string;
  mobileMoneyDesc: string;
  mobileMoneyFooter: string;
  crmTitle: string;
  crmDesc: string;
  crmFooter: string;
  accountingTitle: string;
  accountingDesc: string;
  accountingFooter: string;
  securityTitle: string;
  securityDesc: string;
  securityFooter: string;
  showcaseTitle: string;
  showcaseSub: string;
  pricingTitle: string;
  pricingSub: string;
  plan1Name: string;
  plan1Price: string;
  plan1Period: string;
  plan1Desc: string;
  plan2Name: string;
  plan2Price: string;
  plan2Period: string;
  plan2Desc: string;
  plan3Name: string;
  plan3Price: string;
  plan3Period: string;
  plan3Desc: string;
  testimonialTitle: string;
  testimonialSub: string;
  faqTitleSection: string;
  faqSubSection: string;
  simulatorTitle: string;
  simulatorSub: string;
  simulatorCatalog: string;
  simulatorCart: string;
  simulatorEmptyCart: string;
  simulatorTotal: string;
  simulatorPayBtn: string;
  simulatorReceiptTitle: string;
  simulatorReceiptDesc: string;
  simulatorReceiptNewSale: string;

  // Showcase features
  showcase1Tag: string;
  showcase1Title: string;
  showcase1Desc: string;
  showcase1F1: string;
  showcase1F2: string;
  showcase1F3: string;

  showcase2Tag: string;
  showcase2Title: string;
  showcase2Desc: string;
  showcase2F1: string;
  showcase2F2: string;
  showcase2F3: string;

  showcase3Tag: string;
  showcase3Title: string;
  showcase3Desc: string;
  showcase3F1: string;
  showcase3F2: string;
  showcase3F3: string;

  // Plan features
  plan1F1: string;
  plan1F2: string;
  plan1F3: string;
  plan1F4: string;
  plan2F1: string;
  plan2F2: string;
  plan2F3: string;
  plan2F4: string;
  plan3F1: string;
  plan3F2: string;
  plan3F3: string;
  plan3F4: string;

  // Testimonials
  test1Quote: string;
  test1Author: string;
  test1Role: string;
  test2Quote: string;
  test2Author: string;
  test2Role: string;
  test3Quote: string;
  test3Author: string;
  test3Role: string;

  // FAQs
  faqQ1: string;
  faqA1: string;
  faqQ2: string;
  faqA2: string;
  faqQ3: string;
  faqA3: string;

  // Slogans
  footerCopyright: string;
  footerSlogan: string;
}

export const translations: Record<Language, TranslationSet> = {
  fr: {
    navFeatures: "Fonctionnalités",
    navSoftware: "Le Logiciel",
    navDemo: "Simulateur Caisse",
    navPricing: "Tarifs",
    navFaq: "FAQ",
    login: "Se connecter",
    freeTrial: "Essai Gratuit",
    badge: "Le standard n°1 de gestion des commerces au Burkina",
    heroTitlePre: "Pilotez votre commerce avec une ",
    heroTitleHighlight: "clarté absolue",
    heroDesc:
      "Suivez vos stocks en temps réel, automatisez vos facturations, enregistrez vos ventes rapidement et sécurisez vos transactions Mobile Money (Orange Money, Moov, Wave) avec un progiciel d'excellence conçu pour le marché burkinabè.",
    btnTryFree: "Essayer BoutikBF gratuitement",
    btnTestSim: "Tester le simulateur",
    activeBoutiques: "Boutiques actives",
    worksOffline: "Fonctionne sans réseau",
    compliant: "100% Conforme",
    featuresTitle: "Une technologie robuste pour les exigences du terrain",
    featuresSub:
      "Ne laissez plus la lenteur réseau ou le manque d'outils freiner la croissance de votre commerce. BoutikBF résout tous vos défis du quotidien.",
    posTitle: "Caisse enregistreuse tactile",
    posDesc:
      "Une interface tactile ultra-fluide pour iPad, tablettes Android, ordinateurs et smartphones. Enregistrez les articles d'un clic ou par scan de code-barres.",
    posFooter: "Multi-caisses connectées",
    stockTitle: "Multi-dépôts & Inventaire",
    stockDesc:
      "Suivez vos quantités de stock en temps réel entre votre boutique centrale et vos dépôts (Bobo, Ouaga, etc.). Alertes automatisées de rupture de stock.",
    stockFooter: "Alertes de péremption",
    mobileMoneyTitle: "Mobile Money intégré",
    mobileMoneyDesc:
      "Fini le casse-tête des rapprochements à la fermeture ! Enregistrez et validez les règlements Orange Money, Moov Money et Wave avec un contrôle d'état sécurisé.",
    mobileMoneyFooter: "Contrôle anti-fraude",
    crmTitle: "Fidélité client & WhatsApp",
    crmDesc:
      "Conservez l'historique d'achat de vos clients, gérez les comptes à crédit et envoyez les factures/reçus de vente professionnels en un clic par WhatsApp ou SMS.",
    crmFooter: "Rappels de crédit auto",
    accountingTitle: "Comptabilité SYSCOHADA",
    accountingDesc:
      "Générez des rapports comptables complets et exploitables en un clic (TVA, Marges, Bilan journalier, mensuel). Exportez pour votre expert-comptable au format Excel/PDF.",
    accountingFooter: "Calculs fiscaux précis",
    securityTitle: "Données hautement protégées",
    securityDesc:
      "Chiffrement militaire de bout en bout et sauvegardes automatiques dans le cloud. Vos données commerciales restent strictement confidentielles et sécurisées.",
    securityFooter: "Rôles caissiers/gérants",
    showcaseTitle: "L'excellence à l'œuvre dans votre quotidien",
    showcaseSub:
      "Explorez les modules clés de notre logiciel ERP, illustrés par de véritables captures de l'interface d'administration.",
    pricingTitle: "Des tarifs clairs et sans surprise",
    pricingSub:
      "Faites évoluer votre formule selon l'activité de vos boutiques et dépôts. Sans engagement de durée.",
    plan1Name: "Formule Essentiel",
    plan1Price: "5 000 F",
    plan1Period: "/ mois",
    plan1Desc: "Idéal pour structurer et automatiser votre commerce de quartier.",
    plan2Name: "Formule Pro",
    plan2Price: "10 000 F",
    plan2Period: "/ mois",
    plan2Desc: "La solution de gestion complète pour les boutiques en forte croissance.",
    plan3Name: "Formule Sur Mesure",
    plan3Price: "Sur Mesure",
    plan3Period: "",
    plan3Desc: "Pour les supermarchés, grossistes, franchises et réseaux de distribution.",
    testimonialTitle: "Ils réussissent avec BoutikBF",
    testimonialSub:
      "Découvrez les retours d'expérience d'entrepreneurs locaux ayant digitalisé leur gestion commerciale.",
    faqTitleSection: "Questions Fréquentes",
    faqSubSection: "Tout ce que vous devez savoir pour démarrer sereinement avec notre logiciel.",
    simulatorTitle: "Essayez la simplicité de notre caisse",
    simulatorSub:
      "Sélectionnez des articles burkinabè dans le catalogue, choisissez votre moyen de paiement Mobile Money et validez pour imprimer fictivement votre reçu.",
    simulatorCatalog: "Catalogue Produits",
    simulatorCart: "Panier en cours",
    simulatorEmptyCart:
      "Votre panier est vide. Sélectionnez des articles dans le catalogue pour démarrer une vente fictive.",
    simulatorTotal: "Total à régler",
    simulatorPayBtn: "Enregistrer le règlement",
    simulatorReceiptTitle: "Vente enregistrée !",
    simulatorReceiptDesc:
      "La transaction a été sauvegardée dans le cloud local. Reçu disponible ci-dessous.",
    simulatorReceiptNewSale: "Nouvelle Vente",
    showcase1Tag: "Caisse & POS",
    showcase1Title: "Enregistrez une vente en moins de 3 secondes",
    showcase1Desc:
      "L'interface de caisse a été optimisée avec un niveau de fluidité sans précédent. Vos caissiers sélectionnent les produits rapidement à l'écran ou scannent les codes-barres avec une caméra intégrée. Le ticket s'affiche en temps réel, prêt à être édité ou envoyé directement au client sur WhatsApp.",
    showcase1F1: "Mode hors-ligne résistant aux coupures d'électricité",
    showcase1F2: "Compatible imprimantes thermiques Bluetooth & Wifi",
    showcase1F3: "Gestion des remises, promotions et retours",
    showcase2Tag: "Mobile & Inventaire",
    showcase2Title: "Scannez vos stocks et vos articles par téléphone",
    showcase2Desc:
      "Pas besoin d'acheter de coûteuses douchettes de code-barres ! Notre application smartphone se connecte instantanément à la base de données. Utilisez l'appareil photo de n'importe quel téléphone pour effectuer vos inventaires ou ajouter de nouveaux produits en rayon.",
    showcase2F1: "Scan code-barres réactif et ultra-précis",
    showcase2F2: "Contrôle de stock et inventaire mobile en simultané",
    showcase2F3: "Notification push en cas de seuil de stock critique",
    showcase3Tag: "Rapports & TVA",
    showcase3Title: "Visualisez vos marges et votre santé comptable",
    showcase3Desc:
      "Gardez un œil affûté sur la rentabilité de vos activités. Notre dashboard analytique haut de gamme regroupe en continu vos meilleures ventes, le montant de votre TVA collectée et l'analyse fine de vos marges par produit et catégorie de vente.",
    showcase3F1: "Courbes de chiffre d'affaires et de profits par magasin",
    showcase3F2: "Suivi précis de la TVA collectée et déductible",
    showcase3F3: "Exports Excel et PDF certifiés pour vos experts-comptables",
    plan1F1: "POS, catalogue (150 art.) & stocks bas",
    plan1F2: "Encaissement Express (Espèces/MoMo)",
    plan1F3: "Reçus numériques & Factures directes",
    plan1F4: "🤖 IA de prix & Résumés hebdo auto",
    plan2F1: "Articles & Ventes 100% illimités",
    plan2F2: "Multi-boutiques (3) & Gestion d'équipe",
    plan2F3: "Rapports graphiques détaillés (Mes Chiffres)",
    plan2F4: "🤖 IA approvisionnement, marges & Chatbot",
    plan3F1: "Boutiques, entrepôts & équipe illimités",
    plan3F2: "Connexions douchettes & API sur-mesure",
    plan3F3: "Sauvegardes automatiques en continu",
    plan3F4: "🤖 IA sur-mesure & détection de fraudes",
    test1Quote:
      "Grâce au scan de codes-barres directement sur mon smartphone, mes inventaires hebdomadaires d'alimentation prennent désormais 15 minutes au lieu de mobiliser ma boutique toute une journée.",
    test1Author: "Mariam S.",
    test1Role: "Alimentation Générale — Ouagadougou",
    test2Quote:
      "Le fait d'avoir une caisse qui enregistre les ventes hors-ligne me sauve les jours de coupure internet. La synchronisation sur nos téléphones mobiles à distance fonctionne parfaitement.",
    test2Author: "Idrissa K.",
    test2Role: "Quincaillerie — Bobo-Dioulasso",
    test3Quote:
      "Nos clients sont ravis d'obtenir leur ticket directement sur WhatsApp. De notre côté, la comptabilité SYSCOHADA simplifiée nous a évité toute erreur lors de nos bilans mensuels.",
    test3Author: "Dr. Fatimata O.",
    test3Role: "Pharmacie du Centre — Koudougou",
    faqQ1: "Est-ce que BoutikBF fonctionne si la connexion Internet est coupée ?",
    faqA1:
      "Oui. L'application possède un mode de gestion locale hors-ligne complet. Vous continuez d'enregistrer vos ventes et de servir vos clients sans perturbation. Les données se synchronisent automatiquement de manière sécurisée dès le retour d'une connexion réseau stable.",
    faqQ2: "Comment s'effectue le rapprochement Mobile Money (Orange Money, Moov, Wave) ?",
    faqA2:
      "Lors de l'encaissement d'une vente en boutique, sélectionnez le mode de règlement Mobile Money approprié. L'application génère un reçu correspondant et enregistre la méthode de paiement, facilitant le rapprochement en fin de journée et évitant les écarts de comptabilité.",
    faqQ3: "Mes données de vente et de stock sont-elles sécurisées et confidentielles ?",
    faqA3:
      "Oui. La sécurité de vos données est notre priorité. Toutes les connexions et transferts d'informations sont entièrement chiffrés. Seuls le gérant de la boutique et les utilisateurs configurés peuvent accéder à vos bilans de ventes et de stocks.",
    footerCopyright: "BoutikBF • ERP & caisse enregistreuse professionnelle conforme SYSCOHADA.",
    footerSlogan:
      "BoutikBF — Accompagner la numérisation et la croissance du commerce de détail burkinabè.",
  },
  en: {
    navFeatures: "Features",
    navSoftware: "The Software",
    navDemo: "Register Simulator",
    navPricing: "Pricing",
    navFaq: "FAQ",
    login: "Log in",
    freeTrial: "Free Trial",
    badge: "The #1 standard for retail management in Burkina Faso",
    heroTitlePre: "Manage your retail business with ",
    heroTitleHighlight: "absolute clarity",
    heroDesc:
      "Track stock in real-time, automate billing, record sales instantly, and secure Mobile Money transactions (Orange Money, Moov, Wave) with an excellent software suite designed for the Burkinabè market.",
    btnTryFree: "Try BoutikBF for free",
    btnTestSim: "Test the simulator",
    activeBoutiques: "Active shops",
    worksOffline: "Works fully offline",
    compliant: "100% Compliant",
    featuresTitle: "Robust technology built for the field's demands",
    featuresSub:
      "Do not let slow internet speed or lack of proper tools hinder your growth. BoutikBF solves all your daily business challenges.",
    posTitle: "Tactile Cash Register",
    posDesc:
      "An ultra-smooth touch screen interface for iPads, Android tablets, computers, and smartphones. Add items with one tap or by scanning barcodes.",
    posFooter: "Multi-register connected",
    stockTitle: "Multi-warehouse & Inventory",
    stockDesc:
      "Track stock quantities in real-time across your main shop and your warehouses (Bobo, Ouaga, etc.). Automated low-stock alerts.",
    stockFooter: "Expiration alerts",
    mobileMoneyTitle: "Integrated Mobile Money",
    mobileMoneyDesc:
      "No more close-of-business reconciliation headaches! Easily record and validate Orange Money, Moov Money, and Wave payments safely.",
    mobileMoneyFooter: "Anti-fraud validation",
    crmTitle: "Loyalty & WhatsApp receipts",
    crmDesc:
      "Keep your customers' history, manage credit sales, and send clean receipts or professional invoices directly via WhatsApp or SMS in one click.",
    crmFooter: "Auto credit reminders",
    accountingTitle: "SYSCOHADA Accounting",
    accountingDesc:
      "Generate complete, actionable financial reports (VAT, profit margins, daily/monthly balances) ready to export in Excel/PDF format for your accountant.",
    accountingFooter: "Accurate tax calculation",
    securityTitle: "Highly Protected Data",
    securityDesc:
      "End-to-end military-grade encryption with automated backups to the cloud. Your commercial data remains strictly private and secure.",
    securityFooter: "Cashier & Manager roles",
    showcaseTitle: "Excellence in action daily",
    showcaseSub:
      "Explore the core modules of our ERP software, illustrated with real screenshots of the administration interface.",
    pricingTitle: "Clear, transparent pricing",
    pricingSub: "Upgrade or downgrade your plan as your business grows. No long-term commitment.",
    plan1Name: "Starter Plan",
    plan1Price: "0 F",
    plan1Period: "/ Free forever",
    plan1Desc: "Perfect for digitizing your first single-owner retail store.",
    plan2Name: "Professional Plan",
    plan2Price: "15,000 F",
    plan2Period: "/ month",
    plan2Desc: "Perfect for managing multiple team members, warehouse inventory, and stores.",
    plan3Name: "Enterprise Plan",
    plan3Price: "Custom Quote",
    plan3Period: "",
    plan3Desc: "For franchises, larger supermarkets, wholesalers, and multi-location businesses.",
    testimonialTitle: "Succeeding with BoutikBF",
    testimonialSub:
      "Discover testimonials from local business owners who digitized their commercial management.",
    faqTitleSection: "Frequently Asked Questions",
    faqSubSection: "Everything you need to know to get started smoothly with our platform.",
    simulatorTitle: "Experience the simplicity of our cash register",
    simulatorSub:
      "Pick some local Burkinabè items from the catalog, choose your Mobile Money provider, and validate to print a sample receipt.",
    simulatorCatalog: "Product Catalog",
    simulatorCart: "Current Basket",
    simulatorEmptyCart:
      "Your basket is empty. Add products from the catalog to start a simulated checkout.",
    simulatorTotal: "Total due",
    simulatorPayBtn: "Save payment",
    simulatorReceiptTitle: "Sale saved successfully!",
    simulatorReceiptDesc:
      "The transaction has been safely logged in the local cloud database. Receipt is shown below.",
    simulatorReceiptNewSale: "New Sale",
    showcase1Tag: "Register & POS",
    showcase1Title: "Record a sale in under 3 seconds",
    showcase1Desc:
      "The POS interface has been optimized for extreme speed and response. Cashiers select products or scan barcodes with the built-in camera. The receipt compiles instantly, ready to print or send on WhatsApp.",
    showcase1F1: "Offline mode resistant to blackouts and network cuts",
    showcase1F2: "Compatible with Bluetooth & Wifi thermal printers",
    showcase1F3: "Track discounts, promotions, and returns",
    showcase2Tag: "Mobile & Inventory",
    showcase2Title: "Scan stocks and items with any smartphone",
    showcase2Desc:
      "No need to buy expensive dedicated scanners! Our mobile app connects instantly to your database. Use any phone's camera to run inventory audits or register items in real-time.",
    showcase2F1: "Fast, accurate, responsive camera barcode scanning",
    showcase2F2: "Run multi-user mobile audits simultaneously",
    showcase2F3: "Push notifications on low stock thresholds",
    showcase3Tag: "Reports & VAT",
    showcase3Title: "Monitor your margins and financial health",
    showcase3Desc:
      "Keep a close eye on business profitability. Our high-end dashboard aggregates best-selling items, collected VAT, and fine-tuned margins per product and category.",
    showcase3F1: "Revenue and profit charts per storefront",
    showcase3F2: "Accurate tracking of collected and deductible VAT",
    showcase3F3: "Excel & PDF exports optimized for your accountant",
    plan1F1: "1 single storefront",
    plan1F2: "100 catalog products",
    plan1F3: "Basic cash register features",
    plan1F4: "Standard email support",
    plan2F1: "Up to 3 storefronts or stock depots",
    plan2F2: "Unlimited products & sales",
    plan2F3: "Advanced profit margins & VAT analytics",
    plan2F4: "Direct receipt sending via WhatsApp",
    plan3F1: "Unlimited warehouses & storefronts",
    plan3F2: "Custom API integrations",
    plan3F3: "Advanced staff permission controls",
    plan3F4: "Dedicated technical advisor",
    test1Quote:
      "Thanks to smartphone barcode scanning, our weekly inventory takes only 15 minutes instead of shutting down the store for a full day.",
    test1Author: "Mariam S.",
    test1Role: "General Grocery Store — Ouagadougou",
    test2Quote:
      "Having an offline-enabled register saves our days during power cuts. Real-time background sync works flawlessly when network returns.",
    test2Author: "Idrissa K.",
    test2Role: "Hardware Store — Bobo-Dioulasso",
    test3Quote:
      "Our clients love receiving paperless receipts directly on WhatsApp. And simplified SYSCOHADA tax calculations prevent any mistakes during close-out.",
    test3Author: "Dr. Fatimata O.",
    test3Role: "Central Pharmacy — Koudougou",
    faqQ1: "Does BoutikBF work during network outages or blackouts?",
    faqA1:
      "Yes. The application features a robust local-first engine. You can keep recording sales and serving customers continuously. All changes securely synchronize to the cloud once network is restored.",
    faqQ2: "How is Mobile Money reconciled at the end of the day?",
    faqA2:
      "Simply check Orange Money, Moov, or Wave during payment. The system records the method, flags it on the receipt, and structures the records so closing matches perfectly without errors.",
    faqQ3: "Is my business data secure and kept confidential?",
    faqA3:
      "Yes. Data security is our absolute priority. All transmissions and storage databases are fully encrypted. Only you and explicitly authorized staff can access financial metrics.",
    footerCopyright:
      "BoutikBF • Professional ERP & Cash Register compliant with SYSCOHADA standards.",
    footerSlogan:
      "BoutikBF — Accompanying the digitalization and growth of Burkinabè retail stores.",
  },
  mo: {
    navFeatures: "Tõog tẽmsa",
    navSoftware: "Sõsg-nẽere",
    navDemo: "Kaas makre",
    navPricing: "Ligdi yaoodo",
    navFaq: "Sõsg Sõsga",
    login: "Kẽese kẽer",
    freeTrial: "Maak yãnd-zaala",
    badge: "Burkina gilli laas diki yõor-zaka gestion n°1",
    heroTitlePre: "N bĩng yaa f yõor-zaka ne ",
    heroTitleHighlight: "vẽenega vẽene",
    heroDesc:
      "Bãng f tẽng diki kooba wã, tigma f yaood fãa, kẽes f raabo tao-tao tɩ f bãng Orange Money, Moov Money b Wave yõodo ne bãngr-kãseng m be Burkina Faso raaba fãa.",
    btnTryFree: "Maak BoutikBF yãnd-zaala",
    btnTestSim: "Maak kaasẽ wã",
    activeBoutiques: "Butigi raab pãngẽ",
    worksOffline: "Tũma n sã n ka be kourã",
    compliant: "100% Tũudem",
    featuresTitle: "Teknolozĩ m pãng tẽng raab sɩda fãa yĩnga",
    featuresSub:
      "Da bas tɩ rezo sã n ka be bɩ diki raas pãng fãa kẽer n sãam f yõor ye. BoutikBF tõoga f tũmda daari fãa nande.",
    posTitle: "Caisse tactile teere",
    posDesc:
      "Tũmda ne nug raabo tablet nenga, b tablest Android bõne, ordinaatõ b bãnga portabls. Kẽes kooba nenga taore, b ne scan codes-barres.",
    posFooter: "Kaas fãa tũmd taaba",
    stockTitle: "Multi-dépôts la bãng raabo",
    stockDesc:
      "Bãng f butigi raabo tẽnga nenga n tũ m be Ouaga b Bobo fãa. Keem-kãsenga tɩ yaa b fãa f sã n kẽer kooba.",
    stockFooter: "Bãng raabo alertes",
    mobileMoneyTitle: "Mobile Money rãmb fãa kẽerẽ",
    mobileMoneyDesc:
      "Sɩd yaa m bãng kẽer Orange Money, Moov, la Wave tao-tao n sã n sɩd gũis kẽer-vãala.",
    mobileMoneyFooter: "Contrôle anti-fraude tũudem",
    crmTitle: "Ko-raand fãa la WhatsApp tũma",
    crmDesc:
      "Ko-raand kooba kẽere, b raas kẽere fãa tũma fãa tao-tao n tũme m be WhatsApp b SMS diki nug a ye.",
    crmFooter: "Rappels de crédit tũmd a ye",
    accountingTitle: "Comptabilité SYSCOHADA fãa",
    accountingDesc:
      "Kẽes kooba rãmb fãa bàng-kãsenga (TVA, Marges, Bilan daare/kiu fãa) fãa export format Excel b PDF yĩnga.",
    accountingFooter: "TVA bàng-vẽene",
    securityTitle: "Gũisg pãng diki kooba rãmba",
    securityDesc:
      "Chiffrement m pãng gilli la sauvegarde fãa cloud nenga. F yõor-zaka kooba rãmb fãa gũisg sɩda.",
    securityFooter: "Caissiers & gérants tũma",
    showcaseTitle: "Bãngr-kãsenga daare fãa taore",
    showcaseSub: "Gũis f module rãmba fãa n tũm ne interface administrateur tũma fãa.",
    pricingTitle: "Ligdi yõodo fãa vẽenega",
    pricingSub: "Toeem f formul n tũ ne f butigi kẽer pãng-kãsenga fãa.",
    plan1Name: "Formule Découverte",
    plan1Price: "0 F",
    plan1Period: "/ Yãnd-zaala wakat fãa",
    plan1Desc: "Sẽn sɩng f single boutique raaba m sɩnge.",
    plan2Name: "Formule Professionnelle",
    plan2Price: "15 000 F",
    plan2Period: "/ kiu fãa",
    plan2Desc: "Sẽn yaa zems ne tũmta fãa, multi-magasins, dépôt rãmba la employés fãa.",
    plan3Name: "Formule Entreprise",
    plan3Price: "Kẽes sã n dat",
    plan3Period: "",
    plan3Desc: "Zems ne franchises diki butigi kãsems fãa la tẽng rãmb fãa.",
    testimonialTitle: "B tõogame ne BoutikBF",
    testimonialSub: "Bãng f entrepreneurs tẽnga n sã n bãng tao-tao ne BoutikBF.",
    faqTitleSection: "Sõsg m be sõsga",
    faqSubSection: "Bõn fãa f sã n dat n bãng diki sɩngg taore n zems ne BoutikBF.",
    simulatorTitle: "Maak diki kaasẽ wã fãa taore",
    simulatorSub:
      "Yãk f kooba Burkina tẽnga m be catalogue, yãk Mobile Money yõodo la enregistre n bãng reçu nenga.",
    simulatorCatalog: "Kooba Catalogue",
    simulatorCart: "Panier m be zĩiga",
    simulatorEmptyCart: "F panier ka be bõn ye. Yãk kooba diki catalogue nenga n sɩng makre.",
    simulatorTotal: "Ligdi diki yõodo",
    simulatorPayBtn: "Kẽes yõodo taore",
    simulatorReceiptTitle: "Vente enregistrée !",
    simulatorReceiptDesc: "Vente nenga gũisg n sɩd zãme cloud nenga. Reçu nenga be taore.",
    simulatorReceiptNewSale: "Vente Paalga",
    showcase1Tag: "POS Caisse",
    showcase1Title: "Kẽes kooba nenga segf 3 pãngẽ",
    showcase1Desc:
      "Interface tactile ne nzaala pãngẽ. Caissiers rãmba yãkda kooba sɩda tao-tao, b scan camera nenga.",
    showcase1F1: "Kaas tũma hors-ligne sã n ka be courant wã",
    showcase1F2: "Zems ne imprimantes thermiques Bluetooth la Wifi",
    showcase1F3: "Yãk remises, promotions la kooba lebgre fãa",
    showcase2Tag: "Mobile & Inventaire",
    showcase2Title: "Maak f butigi raabo f portabl nenga",
    showcase2Desc:
      "Ka dat n ra douchettes ligdi kãsenga ye! App portabl tõogta fãa tigma taore database nenga diki camera raabo daari fãa.",
    showcase2F1: "Scan codes-barres réactif la sɩda",
    showcase2F2: "Inventaire multi-utilisateurs portabl nenga pãngẽ",
    showcase2F3: "Bãng alertes sã n dat n rupture de stock",
    showcase3Tag: "Compta Rapports",
    showcase3Title: "Bãng f marges la ligdi pãng fãa",
    showcase3Desc:
      "Gũis f yõor-zaka raas-tũmda tao-tao. Dashboard analytique bãngda f sales fãa, TVA, la marges kooba diki kategori rãmba fãa.",
    showcase3F1: "Marge la chiffre d'affaires yaoodo kiu fãa",
    showcase3F2: "Bãng TVA sɩda diki calcul fãa",
    showcase3F3: "Exports Excel b PDF format diki comptables rãmba",
    plan1F1: "1 boutique sɩda unique",
    plan1F2: "100 products catalogue",
    plan1F3: "Kaas tũma basique kẽere",
    plan1F4: "Support standard e-mail pãngẽ",
    plan2F1: "Tũm ne butigi 3 b dépôts stock rãmba",
    plan2F2: "Products & sales unlimited wakat fãa",
    plan2F3: "Calcul marges la TVA advanced",
    plan2F4: "Reçus & invoices kẽes WhatsApp pãngẽ",
    plan3F1: "Dépôts la boutiques unlimited fãa",
    plan3F2: "Intégrations API custom sɩda",
    plan3F3: "Gestion droits employés advanced",
    plan3F4: "Conseiller technique dédié wakat fãa",
    test1Quote:
      "Diki scan codes-barres portabl nenga, inventaires daari fãa tõogda miniti 15 n zems ne daari gilli wã.",
    test1Author: "Mariam S.",
    test1Role: "Alimentation Générale — Ouagadougou",
    test2Quote:
      "Caisse ne hors-ligne tũma sõngda mam wakat fãa coupures courant raabo. Synco wã tũmd kãsenga m be rezo raabo.",
    test2Author: "Idrissa K.",
    test2Role: "Quincaillerie — Bobo-Dioulasso",
    test3Quote:
      "Ko-raand fãa sũ-noogo wakat fãa recibo WhatsApp nenga. Comptabilité SYSCOHADA sõngda diki fãa bilans daari.",
    test3Author: "Dr. Fatimata O.",
    test3Role: "Pharmacie du Centre — Koudougou",
    faqQ1: "BoutikBF tũmda hors-ligne sã n ka be rezo b courant ?",
    faqA1:
      "Sɩda. App wã bĩng tũma hors-ligne complete m be nenga. F tõogame n enregistre sales la tũm ne ko-raand. Tigma cloud nenga sã n rezo wa.",
    faqQ2: "Yaa wãn la Mobile Money yõodo (Orange Money, Moov, Wave) rapprochement tũmda ?",
    faqA2:
      "Yãk Mobile Money yõodo f sã n kooba butigi. App wã bĩng reçu la enregistre yõodo pãngẽ tɩ daari bilans fãa zems a ye.",
    faqQ3: "M kooba, raas la stock gũisg sɩda confidential ?",
    faqA3:
      "Sɩda. Data security yaa prioritario fãa. Connexions la transferts fãa chiffré complete. Gérant la employés n tũ configurés la tõog kẽer f bilans.",
    footerCopyright: "BoutikBF • ERP & caisse enregistreuse professionnelle conforme SYSCOHADA.",
    footerSlogan:
      "BoutikBF — Accompagner la numérisation et la croissance du commerce de détail burkinabè.",
  },
  di: {
    navFeatures: "Baarakow",
    navSoftware: "Porogaramu",
    navDemo: "Kaasi simulator",
    navPricing: "Sarakaw",
    navFaq: "Nyinikaliw",
    login: "Don a kɔnɔ",
    freeTrial: "Mali dɔ fɔyi",
    badge: "Burkina butiki kalasigo labɛn nɔgɔyali n°1",
    heroTitlePre: "I ka feereyoro labɛn n'a ye ",
    heroTitleHighlight: "ɲɛfɔli lakika",
    heroDesc:
      "A bɛ i ka mɔgɔw kɔlɔsi, i ka sarakaw gɛlɛya, i ka feerebaara dunanba labɛn, ani Orange Money, Moov Money, Wave sarakaw lakana BF konɔ.",
    btnTryFree: "BoutikBF dɔ fɔyi makɔnɔ",
    btnTestSim: "Kaasi simulator maki",
    activeBoutiques: "Butiki labɛnba",
    worksOffline: "A bɛ baara kɛ ni rezo t'eye",
    compliant: "100% zemseli",
    featuresTitle: "Baarakɛ minɛn basigi lakika duguma hamiw kama",
    featuresSub:
      "I kana rezo gɛlɛya bɛ i ka butiki baara kɛgɛlɛya to ye. BoutikBF bɛ fɛɛrɛbɔ i ka hamiw bɛɛ la.",
    posTitle: "Kaasi nɔgɔman tactile",
    posDesc:
      "A bɛ baara kɛ iPad, Android bɛɛ la, ani teli fana. I bɛ jago don ni nɛgɛ-nug-kɛli jɔna code-barres nɛgɛ scan ye.",
    posFooter: "Kaasi caman sirilen jɔna",
    stockTitle: "Dépôts caman ni mɔgɔw kalasigo",
    stockDesc:
      "I ka mɔgɔ duguma fanga bɛɛ kalasigo Bobo, Ouaga butiki rɔ jɔna. Jamanakow kɔlɔsili teli.",
    stockFooter: "Butiki hamiw jɔna",
    mobileMoneyTitle: "Mobile Money sirilen bɛɛ kɔnɔ",
    mobileMoneyDesc:
      "Orange Money, Moov Money, ani Wave sarakaw lakana don o don, dɔgɔfiyalo bɛɛ lakika gundo la.",
    mobileMoneyFooter: "Anti-fraude kɔlɔsili",
    crmTitle: "Jago dunanw ni WhatsApp reçuw",
    crmDesc:
      "I bɛ jago dunan ka tariku bɛɛ kalasigo, don fana bɛ kɛ dɔgɔfiyalo la ani reçuw bila u ma ni WhatsApp bɛ SMS nug kelen ye.",
    crmFooter: "Sarakaba teli maki",
    accountingTitle: "SYSCOHADA sarakabilali bɛɛ",
    accountingDesc:
      "A bɛ sarakaw labɛn bɛɛ maki (TVA, Marges, jago Bilan) fana don o don. Excel ni PDF dabilen fana.",
    accountingFooter: "TVA lakika maki",
    securityTitle: "Jago gundow lakana lakika",
    securityDesc:
      "Chiffrement military-grade ani cloud dabilen fana don o don. I ka jago hamiw bɛɛ lakana.",
    securityFooter: "Caissiers ni gérants baara",
    showcaseTitle: "ɲɛfɔli lakika don o don",
    showcaseSub: "I ka baarakow caman labɛnyɔrɔ dabilen administrateur interface rɔ.",
    pricingTitle: "Sarakaw lakika, fɔyi gundo t'a rɔ",
    pricingSub: "I ka formul toeem n'i ka butiki baara pãnga fanga ye lakika.",
    plan1Name: "Formule Découverte",
    plan1Price: "0 F",
    plan1Period: "/ Abada fɔyi",
    plan1Desc: "A ka fisa ni i ka butiki singila jago fɔlɔ bɛ damina.",
    plan2Name: "Formule Professionnelle",
    plan2Price: "15 000 F",
    plan2Period: "/ kalo fɔlɔ",
    plan2Desc: "A bɛ i dɛmɛ ni multi-magasins, dépôts, ani baarakɛlaw bɛɛ baara la.",
    plan3Name: "Formule Entreprise",
    plan3Price: "Sarakaw yɛrɛ rɔ",
    plan3Period: "",
    plan3Desc: "A bɛ franchises bɛɛ dɛmɛ ani butiki kãsengoba bɛɛ.",
    testimonialTitle: "U bɛ sɔrɔli kɛ ni BoutikBF ye",
    testimonialSub: "I bɛ teli maki jago dunanw ka barokan caman fana.",
    faqTitleSection: "Nyinikali lakikaw",
    faqSubSection: "I bɛ fɛn o fɛn sɔrɔ m bɛ dɛmɛ kɛ damina f fana ni BoutikBF ye.",
    simulatorTitle: "Kaasi simulator maki jɔna",
    simulatorSub:
      "Burkina jago caman yãk catalogue kɔnɔ, yãk Mobile Money sarakaw, o kɔfɛ i bɛ reçu lakika sɔrɔ.",
    simulatorCatalog: "Jago Catalogue",
    simulatorCart: "Panier baara kɔnɔ",
    simulatorEmptyCart: "I ka panier bɛ fɔyi ra. Yãk catalogue kɔnɔ n'i bɛ dɔ kɛ.",
    simulatorTotal: "Saraka lakika bɛɛ",
    simulatorPayBtn: "Saraka don jɔna",
    simulatorReceiptTitle: "Vente enregistrée !",
    simulatorReceiptDesc: "Vente gundo fana dabilen cloud kɔnɔ. Reçu bɛ duguma.",
    simulatorReceiptNewSale: "Vente Kura",
    showcase1Tag: "Caisse & POS",
    showcase1Title: "Vente sɛbɛn segf 3 kɔnɔ",
    showcase1Desc:
      "Caisse kuro teli tɛmɛsira fɛɛrɛ. Caissiers fãna bɛ jago maki jɔna screen bɛ scan code-barres camera ye.",
    showcase1F1: "Baara bɛ kɛ hors-ligne courant t'eye",
    showcase1F2: "Baara kɛ ni imprimantes Bluetooth bɛ Wifi ye",
    showcase1F3: "Remises, promotions bɛ retours maki jɔna",
    showcase2Tag: "Mobile & Inventory",
    showcase2Title: "I ka butiki jago maki ni foni ye",
    showcase2Desc:
      "Sarakaba scan-douchettes t'a rɔ! Mobile application bɛ sirilen jɔna database kɔnɔ ni camera ye.",
    showcase2F1: "Scan codes-barres teli lakika",
    showcase2F2: "Inventaire mobile caman bɛ kɛ jɔna",
    showcase2F3: "Kɔlɔsili teli ni jago bɛ ban",
    showcase3Tag: "Jago & TVA",
    showcase3Title: "I ka Marges ni TVA maki",
    showcase3Desc: "I bɛ sarakaw labɛn bɛɛ kɔlɔsi. Dashboard kɔnɔ jago, TVA, bɛɛ maki jɔna.",
    showcase3F1: "Marge ni Chiffre d'affaires kalo kalo",
    showcase3F2: "TVA maki lakika",
    showcase3F3: "Excel ni PDF dabilen comptables sarakaw kama",
    plan1F1: "1 single butiki",
    plan1F2: "100 products catalogue",
    plan1F3: "Kaasi baara basique",
    plan1F4: "Email sarakabilali standard",
    plan2F1: "Butiki 3 bɛ dépôts stock baara la",
    plan2F2: "Products & sales unlimited abada",
    plan2F3: "Profit margins & TVA analytics advanced",
    plan2F4: "Reçuw bila WhatsApp rɔ jɔna",
    plan3F1: "Dépôts ni butiki unlimited bɛɛ",
    plan3F2: "Custom API integrations labɛn",
    plan3F3: "Employés advanced permission controls",
    plan3F4: "Technical advisor dedicated dɔ",
    test1Quote:
      "Smartphone scan codes-barres kama, dɔgɔfiyalo mɔgɔ kɔlɔsili bɛ kalo 15 kalo kɔnɔ o tɛmɛ don bɛɛ sãam ye.",
    test1Author: "Mariam S.",
    test1Role: "Alimentation Générale — Ouagadougou",
    test2Quote: "Hors-ligne dabilen bɛ dɛmɛ nɛgɛ courant t'eye. Synco bɛ kɛ teli rezo sã n kura.",
    test2Author: "Idrissa K.",
    test2Role: "Quincaillerie — Bobo-Dioulasso",
    test3Quote: "Jago dunanw sũ bɛ di reçuw WhatsApp rɔ jɔna. SYSCOHADA sarakabilali bɛ dɛmɛ kɛ.",
    test3Author: "Dr. Fatimata O.",
    test3Role: "Pharmacie du Centre — Koudougou",
    faqQ1: "BoutikBF bɛ baara kɛ ni courant bɛ rezo t'eye ?",
    faqA1:
      "Sɔbɛ. Local-first engine bɛ dɛmɛ kɛ abada. I bɛ jago fãna maki jɔna o kɔfɛ synco bɛ kɛ cloud kɔnɔ.",
    faqQ2: "Orange Money, Moov, bɛ Wave sarakaw labɛn bɛ kɛ kalo kalo ?",
    faqA2: "Yãk Mobile Money payment butiki. Application bɛ saraka maki jɔna dɔgɔfiyalo dabilen.",
    faqQ3: "I ka jago hamiw bɛɛ lakana gundo la ?",
    faqA3: "Sɔbɛ. Data security bɛ prioritize kɛ. Sarakaw bɛɛ chiffré complete gérants labɛn.",
    footerCopyright: "BoutikBF • ERP & caisse enregistreuse professionnelle conforme SYSCOHADA.",
    footerSlogan:
      "BoutikBF — Accompagner la numérisation et la croissance du commerce de détail burkinabè.",
  },
};
