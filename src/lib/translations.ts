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
    navSoftware: "Le logiciel",
    navDemo: "Démo",
    navPricing: "Tarifs",
    navFaq: "FAQ",
    login: "Connexion",
    freeTrial: "Essai gratuit",
    badge: "Nouveau",
    heroTitlePre: "Gérez votre boutique plus simplement, ",
    heroTitleHighlight: "plus efficacement",
    heroDesc: "Une caisse moderne, un stock maîtrisé, des ventes boostées — même sans internet.",
    btnTryFree: "Démarrer gratuitement",
    btnTestSim: "Voir la démo",
    activeBoutiques: "boutiques",
    worksOffline: "Fonctionne hors-ligne",
    compliant: "Compatible SYSCOHADA",
    featuresTitle: "Une technologie robuste pour les exigences du terrain",
    featuresSub:
      "Ne laissez plus la lenteur réseau ou le manque d'outils freiner la croissance de votre commerce. BoutikBF résout tous vos défis du quotidien.",
    posTitle: "Caisse tactile rapide",
    posDesc: "Vente en un clic",
    posFooter: "Multi-caisses connectées",
    stockTitle: "Gestion du stock en temps réel",
    stockDesc: "Alertes stock bas",
    stockFooter: "Alertes de péremption",
    mobileMoneyTitle: "Mobile Money intégré",
    mobileMoneyDesc: "Orange, Moov, Wave",
    mobileMoneyFooter: "Contrôle anti-fraude",
    crmTitle: "Base clients (CRM)",
    crmDesc: "Fidélisez vos clients",
    crmFooter: "Rappels de crédit auto",
    accountingTitle: "Comptabilité simplifiée",
    accountingDesc: "Rapports détaillés",
    accountingFooter: "Calculs fiscaux précis",
    securityTitle: "Sécurité avancée",
    securityDesc: "Données protégées",
    securityFooter: "Rôles caissiers/gérants",
    showcaseTitle: "L'excellence à l'œuvre dans votre quotidien",
    showcaseSub:
      "Explorez les modules clés de notre logiciel ERP, illustrés par de véritables captures de l'interface d'administration.",
    pricingTitle: "Des plans adaptés à votre activité",
    pricingSub: "Choisissez le plan qui convient le mieux à votre commerce.",
    plan1Name: "Starter",
    plan1Price: "9 900 F",
    plan1Period: "/ mois",
    plan1Desc: "Pour démarrer et organiser votre commerce.",
    plan2Name: "Pro",
    plan2Price: "19 900 F",
    plan2Period: "/ mois",
    plan2Desc: "La solution complète pour les boutiques en croissance.",
    plan3Name: "Entreprise",
    plan3Price: "39 900 F",
    plan3Period: "/ mois",
    plan3Desc: "Pour les réseaux, franchises et grossistes.",
    testimonialTitle: "Ils nous font confiance",
    testimonialSub: "Des commerçants sereins avec BoutikBF au quotidien.",
    faqTitleSection: "FAQ",
    faqSubSection: "Vos questions, nos réponses",
    simulatorTitle: "Testez notre caisse en ligne",
    simulatorSub: "Ajoutez des produits, choisissez un moyen de paiement et validez votre vente.",
    simulatorCatalog: "Catalogue",
    simulatorCart: "Panier",
    simulatorEmptyCart: "Votre panier est vide — cliquez sur un produit pour l'ajouter.",
    simulatorTotal: "Total",
    simulatorPayBtn: "Valider la vente",
    simulatorReceiptTitle: "Vente enregistrée !",
    simulatorReceiptDesc: "Votre ticket a été généré.",
    simulatorReceiptNewSale: "Nouvelle vente",
    showcase1Tag: "Caisse & POS",
    showcase1Title: "Caisse & Vente",
    showcase1Desc: "Scannez, vendez, imprimez vos tickets",
    showcase1F1: "Mode hors-ligne résistant aux coupures d'électricité",
    showcase1F2: "Compatible imprimantes thermiques Bluetooth & Wifi",
    showcase1F3: "Gestion des remises, promotions et retours",
    showcase2Tag: "Mobile & Inventaire",
    showcase2Title: "Application Mobile",
    showcase2Desc: "Gérez votre boutique où que vous soyez",
    showcase2F1: "Scan code-barres réactif et ultra-précis",
    showcase2F2: "Contrôle de stock et inventaire mobile en simultané",
    showcase2F3: "Notification push en cas de seuil de stock critique",
    showcase3Tag: "Rapports & TVA",
    showcase3Title: "Rapports & Analyses",
    showcase3Desc: "Suivez vos performances en temps réel",
    showcase3F1: "Courbes de chiffre d'affaires et de profits par magasin",
    showcase3F2: "Suivi précis de la TVA collectée et déductible",
    showcase3F3: "Exports Excel et PDF certifiés pour vos experts-comptables",
    plan1F1: "Ventes & Stock",
    plan1F2: "Rapports de base",
    plan1F3: "Support en ligne",
    plan1F4: "🤖 IA de prix & Résumés hebdo auto",
    plan2F1: "Toutes les fonctionnalités",
    plan2F2: "Support prioritaire",
    plan2F3: "Mode hors-ligne",
    plan2F4: "🤖 IA approvisionnement, marges & Chatbot",
    plan3F1: "Multi-magasins",
    plan3F2: "Comptabilité avancée",
    plan3F3: "Accompagnement dédié",
    plan3F4: "🤖 IA sur-mesure & détection de fraudes",
    test1Quote: "BoutikBF a transformé ma boutique. Simple et efficace !",
    test1Author: "Awa Traoré",
    test1Role: "Boutique, Ouagadougou",
    test2Quote: "Je gère mon stock et mes ventes sans stress.",
    test2Author: "M. Sawadogo Ibrahim",
    test2Role: "Commerce, Bobo-Dioulasso",
    test3Quote: "Un outil indispensable pour tout commerçant.",
    test3Author: "Mme Kaboré Fatimata",
    test3Role: "Boutique, Ouagadougou",
    faqQ1: "Est-ce que ça fonctionne hors-ligne ?",
    faqA1:
      "Oui. L'application possède un mode de gestion locale hors-ligne complet. Vous continuez d'enregistrer vos ventes et de servir vos clients sans perturbation. Les données se synchronisent automatiquement de manière sécurisée dès le retour d'une connexion réseau stable.",
    faqQ2: "Combien ça coûte ?",
    faqA2:
      "BoutikBF propose des plans simples à partir de 9 900 F par mois, sans engagement de durée. La formule Starter suffit à la plupart des boutiques de quartier ; passez aux formules Pro et Entreprise pour les fonctions avancées (multi-magasins, comptabilité, accompagnement).",
    faqQ3: "Quel matériel est nécessaire ?",
    faqA3:
      "Juste un ordinateur, une tablette ou un smartphone. Aucun lecteur de code-barres n'est obligatoire : l'application mobile scanne avec l'appareil photo. Une imprimante thermique Bluetooth est optionnelle pour les tickets papier.",
    footerCopyright: "Tous droits réservés.",
    footerSlogan: "Gérez mieux. Vendez plus.",
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
