import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useShops, resolveLogoUrl } from "@/lib/shop-store";
import { PageHeader } from "@/components/page-parts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Loader2,
  Upload,
  Store,
  Check,
  Sparkles,
  Bot,
  Zap,
  BadgeCheck,
  Phone,
  MessageSquare,
  AlertTriangle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Paramètres — BoutikBF" }] }),
  component: SettingsPage,
});

const PLANS = [
  {
    id: "essentiel",
    name: "Formule Essentiel",
    price: "5 000 F CFA",
    period: "/ mois",
    description: "Parfait pour structurer et automatiser votre commerce de quartier.",
    badge: "Populaire",
    category1: {
      title: "Gestion Ventes & POS",
      items: [
        "Caisse tactile POS intuitive & fluide",
        "Encaissement Express (Espèces, Mobile Money)",
        "Reçus et factures numériques instantanés",
      ],
    },
    category2: {
      title: "Stocks & Inventaire",
      items: [
        "Catalogue jusqu'à 150 articles",
        "Alertes de stock bas en temps réel",
        "Saisie simplifiée des dépenses",
      ],
    },
    aiFeatures: {
      title: "IA d'Assistance",
      items: [
        "🤖 Assistant IA de suggestion de prix de vente locaux",
        "🤖 Résumé hebdomadaire automatique par IA (ventes & marges)",
      ],
    },
  },
  {
    id: "pro",
    name: "Formule Pro",
    price: "10 000 F CFA",
    period: "/ mois",
    description: "La solution de gestion complète pour les boutiques en forte croissance.",
    badge: "Recommandé",
    category1: {
      title: "Ventes & Opérations Avancées",
      items: [
        "Nombre d'articles et ventes 100% illimités",
        "Caisse tactile POS avancée multi-terminaux",
        "Factures professionnelles avec votre logo",
        "Gestion des clients & relances d'impayés",
      ],
    },
    category2: {
      title: "Gestion d'Équipe & Analyses",
      items: [
        "Suivi de stock en temps réel & Multi-boutiques (jusqu'à 3)",
        "Rapports de vente graphiques (Mes Chiffres)",
        "Gestion d'équipe (jusqu'à 10 employés/caissiers)",
        "Exports comptables complets au format CSV",
      ],
    },
    aiFeatures: {
      title: "IA d'Assistance",
      items: [
        "🤖 IA prédictive d'approvisionnement pour anticiper les ruptures",
        "🤖 Conseil d'ajustement de prix stratégique & marges par l'IA",
        "🤖 Chatbot IA conseiller d'affaires disponible 24h/24 & 7j/7",
      ],
    },
  },
  {
    id: "sur-mesure",
    name: "Formule Sur Mesure",
    price: "Sur Mesure",
    period: "",
    description: "Pour les supermarchés, grossistes, franchises et réseaux de distribution.",
    badge: "Entreprise",
    category1: {
      title: "Multi-sites & Logistique",
      items: [
        "Magasins, entrepôts et boutiques illimités",
        "Double-contrôle des caisses & coffre-fort",
        "Support ultra-prioritaire 24h/24 par WhatsApp",
        "Connexions directes aux douchettes & scanners",
      ],
    },
    category2: {
      title: "Administration & API",
      items: [
        "Gestion d'équipe illimitée avec rôles granulaires",
        "Connexion API sur-mesure avec votre comptabilité",
        "Sauvegardes multi-serveurs automatiques en continu",
        "Formation de vos équipes sur site",
      ],
    },
    aiFeatures: {
      title: "IA d'Assistance",
      items: [
        "🤖 Modèle d'IA sur-mesure entraîné sur vos propres données",
        "🤖 Rapports prévisionnels stratégiques annuels par l'IA",
        "🤖 Détection automatisée des anomalies et fraudes de caisse",
      ],
    },
  },
];

function SettingsPage() {
  const { current, reload } = useShops();
  const [form, setForm] = useState({
    name: "",
    currency: "XOF",
    phone: "",
    email: "",
    address: "",
  });
  const [saving, setSaving] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectingPlan, setSelectingPlan] = useState<string | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedPlanDetails, setSelectedPlanDetails] = useState<{
    id: string;
    name: string;
    price: string;
  } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (current) {
      setForm({
        name: current.name,
        currency: current.currency,
        phone: current.phone ?? "",
        email: current.email ?? "",
        address: current.address ?? "",
      });
      resolveLogoUrl(current.logo_url).then(setLogoPreview);
    }
  }, [current?.id, current?.logo_url]);

  const save = async () => {
    if (!current) return;
    setSaving(true);
    const { error } = await supabase.from("shops").update(form).eq("id", current.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Paramètres enregistrés");
    reload();
  };

  const uploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !current) return;
    if (file.size > 2 * 1024 * 1024) return toast.error("Fichier trop volumineux (max 2 Mo)");
    setUploading(true);
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "png";
    const path = `${current.id}/logo-${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from("shop-logos")
      .upload(path, file, { upsert: true, contentType: file.type });
    if (error) {
      setUploading(false);
      return toast.error(error.message);
    }
    const { error: upErr } = await supabase
      .from("shops")
      .update({ logo_url: path })
      .eq("id", current.id);
    setUploading(false);
    if (upErr) return toast.error(upErr.message);
    toast.success("Logo mis à jour");
    reload();
  };

  const handleSelectPlan = (planId: string) => {
    if (!current) return;
    const plan = PLANS.find((p) => p.id === planId);
    if (!plan) return;
    setSelectedPlanDetails({
      id: planId,
      name: plan.name,
      price: plan.price,
    });
    setPaymentDialogOpen(true);
  };

  return (
    <div>
      <PageHeader title="Paramètres" description="Personnalisez votre boutique" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="font-display text-lg">Logo de la boutique</CardTitle>
            <CardDescription className="text-sm">
              Apparaît sur les reçus, factures et étiquettes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="grid h-20 w-20 sm:h-24 sm:w-24 place-items-center overflow-hidden rounded-xl border border-border bg-muted flex-shrink-0">
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo" className="h-full w-full object-contain" />
                ) : (
                  <Store className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
              <div className="space-y-2">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={uploadLogo}
                />
                <Button
                  variant="outline"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="h-10"
                >
                  {uploading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="mr-2 h-4 w-4" />
                  )}
                  Téléverser
                </Button>
                <p className="text-xs text-muted-foreground">PNG ou JPG carré, max 2 Mo.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="font-display text-lg">Informations boutique</CardTitle>
            <CardDescription className="text-sm">Nom, contacts et devise</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Nom</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Devise</Label>
                <Select
                  value={form.currency}
                  onValueChange={(v) => setForm({ ...form, currency: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="XOF">Franc CFA (XOF)</SelectItem>
                    <SelectItem value="EUR">Euro (EUR)</SelectItem>
                    <SelectItem value="USD">Dollar US (USD)</SelectItem>
                    <SelectItem value="MAD">Dirham (MAD)</SelectItem>
                    <SelectItem value="NGN">Naira (NGN)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Téléphone</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Adresse</Label>
              <Input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </div>
            <Button onClick={save} disabled={saving} className="bg-gradient-primary shadow-elegant">
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enregistrer
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Subscription Plans full-width comparison section */}
      <div className="mt-8 space-y-6">
        <div className="border-t border-border/50 pt-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
            <div className="space-y-1">
              <h2 className="font-display text-xl md:text-2xl font-black flex items-center gap-2">
                <Zap className="h-5.5 w-5.5 text-amber-500 fill-amber-500/10" />
                Abonnements & Tarifs BoutikBF
              </h2>
              <p className="text-sm text-muted-foreground">
                Choisissez la formule idéale pour booster les ventes et automatiser
                l&apos;intelligence de votre boutique.
              </p>
            </div>
            {current?.plan && (
              <div className="text-xs font-semibold px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 w-max select-none">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Formule active :{" "}
                <span className="uppercase font-bold">
                  {current.plan === "essentiel_paid"
                    ? "ESSENTIEL (Payé)"
                    : current.plan === "essentiel"
                      ? "ESSENTIEL (Essai)"
                      : current.plan}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {PLANS.map((plan) => {
            const rawPlan = current?.plan?.toLowerCase();
            const isActive =
              rawPlan === plan.id || (plan.id === "essentiel" && rawPlan === "essentiel_paid");
            return (
              <Card
                key={plan.id}
                className={`relative overflow-hidden flex flex-col border transition-all duration-300 hover:shadow-xl hover:scale-[1.01] ${
                  isActive
                    ? "border-emerald-500/50 bg-emerald-500/[0.02] ring-2 ring-emerald-500/10 shadow-md"
                    : "border-border/80"
                }`}
              >
                {/* Visual Top Ribbon for active or highlight status */}
                {isActive && (
                  <div className="absolute top-0 right-0 bg-emerald-500 text-white font-bold text-[9px] uppercase tracking-widest px-3 py-1 rounded-bl-xl shadow-sm flex items-center gap-1 z-10">
                    <BadgeCheck className="h-3 w-3" />
                    Actuel
                  </div>
                )}
                {!isActive && plan.badge && (
                  <div className="absolute top-0 right-0 bg-secondary-foreground/10 text-muted-foreground font-bold text-[9px] uppercase tracking-widest px-3 py-1 rounded-bl-xl">
                    {plan.badge}
                  </div>
                )}

                <CardHeader className="pb-4">
                  <div className="space-y-1">
                    <CardTitle className="font-display text-lg font-black">{plan.name}</CardTitle>
                    <p className="text-xs text-muted-foreground min-h-[32px] leading-normal">
                      {plan.description}
                    </p>
                  </div>
                  <div className="mt-4 flex items-baseline">
                    <span className="text-2xl md:text-3xl font-black font-display tracking-tight bg-gradient-to-br from-foreground to-foreground/80 bg-clip-text">
                      {plan.price}
                    </span>
                    {plan.period && (
                      <span className="ml-1 text-xs text-muted-foreground font-semibold">
                        {plan.period}
                      </span>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="flex-1 flex flex-col space-y-5">
                  {/* Category 1: Ventes & Opérations */}
                  <div className="space-y-2.5">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 border-b border-border/40 pb-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      {plan.category1.title}
                    </h4>
                    <ul className="space-y-2">
                      {plan.category1.items.map((item, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2 text-xs font-medium text-foreground/90"
                        >
                          <Check className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Category 2: Administration & Gestion */}
                  <div className="space-y-2.5">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 border-b border-border/40 pb-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                      {plan.category2.title}
                    </h4>
                    <ul className="space-y-2">
                      {plan.category2.items.map((item, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2 text-xs font-medium text-foreground/90"
                        >
                          <Check className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Highlights: IA d'Assistance */}
                  <div className="mt-auto pt-4 border-t border-border/40 space-y-2.5 bg-gradient-to-r from-amber-500/[0.03] to-purple-500/[0.03] p-3 rounded-xl border border-amber-500/10">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
                      {plan.aiFeatures.title}
                    </h4>
                    <ul className="space-y-1.5">
                      {plan.aiFeatures.items.map((item, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2 text-xs font-medium text-amber-900/90 dark:text-amber-200/90 leading-normal"
                        >
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Selector Button */}
                  <div className="pt-2">
                    <Button
                      onClick={() => handleSelectPlan(plan.id)}
                      disabled={isActive || selectingPlan === plan.id}
                      className={`w-full h-10 rounded-xl font-bold text-xs cursor-pointer transition-all active:scale-[0.98] ${
                        isActive
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/15 cursor-default font-semibold"
                          : plan.id === "pro"
                            ? "bg-gradient-to-r from-emerald-600 to-amber-500 hover:from-emerald-700 hover:to-amber-600 text-white shadow-md shadow-emerald-500/10 font-bold"
                            : "bg-secondary text-foreground hover:bg-secondary/80 border border-border/50 font-bold"
                      }`}
                    >
                      {selectingPlan === plan.id && (
                        <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                      )}
                      {isActive
                        ? "Votre plan actuel"
                        : plan.id === "sur-mesure"
                          ? "Contacter le support"
                          : `S'abonner à la formule`}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="rounded-2xl max-w-md border-border bg-card p-6 shadow-soft">
          <DialogHeader className="text-center pb-2">
            <div className="mx-auto h-12 w-12 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mb-3">
              <AlertTriangle className="h-6 w-6 animate-pulse" />
            </div>
            <DialogTitle className="font-display text-xl font-bold tracking-tight text-foreground">
              Paiements en ligne indisponibles 💳
            </DialogTitle>
            <DialogDescription className="text-sm font-medium text-muted-foreground/90 mt-1">
              Les paiements électroniques directs par carte et mobile money sont temporairement
              indisponibles (documents en cours d&apos;examen par les opérateurs).
            </DialogDescription>
          </DialogHeader>

          {selectedPlanDetails && (
            <div className="space-y-4">
              <div className="rounded-xl border border-dashed border-border/80 bg-secondary/30 p-3.5 text-center">
                <div className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                  Formule Sélectionnée
                </div>
                <div className="mt-1 font-display text-lg font-black text-foreground">
                  {selectedPlanDetails.name}
                </div>
                <div className="mt-0.5 text-xl font-black text-amber-600 dark:text-amber-400">
                  {selectedPlanDetails.price === "Sur Mesure"
                    ? "Tarif sur devis"
                    : selectedPlanDetails.price}
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Instructions de Paiement Local
                </h4>
                <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/[0.04] to-orange-500/[0.04] border border-amber-500/10 space-y-3">
                  <div className="flex items-start gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500 text-[10px] font-black text-white">
                      1
                    </span>
                    <p className="text-xs font-semibold text-foreground/95 leading-relaxed">
                      Effectuez le dépôt ou transfert local (Orange Money ou Moov Money) du montant
                      ci-dessus.
                    </p>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500 text-[10px] font-black text-white">
                      2
                    </span>
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-foreground/95">
                        Envoyez au numéro unique suivant :
                      </p>
                      <div className="bg-background border border-border/80 px-3 py-2 rounded-lg font-mono text-sm font-black text-amber-600 dark:text-amber-400 flex items-center justify-between mt-1 select-all select-none group">
                        <span>+226 55 30 08 68</span>
                        <span className="text-[9px] uppercase tracking-wider text-muted-foreground/80 font-sans group-hover:text-primary transition-colors">
                          Copier
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground font-semibold">
                        Destinataire :{" "}
                        <strong className="text-foreground">Service Client BoutikBF</strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500 text-[10px] font-black text-white">
                      3
                    </span>
                    <p className="text-xs font-semibold text-foreground/95 leading-relaxed">
                      Une fois le transfert effectué, cliquez ci-dessous pour contacter le service
                      client afin de faire activer votre compte instantanément.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-2.5 pt-2">
                <Button
                  onClick={() => {
                    const message = encodeURIComponent(
                      `Bonjour BoutikBF, je souhaite souscrire à la ${selectedPlanDetails.name} (${selectedPlanDetails.price}) pour ma boutique "${current?.name}". J'ai effectué le paiement par transfert local sur le +226 55300868.`,
                    );
                    window.open(`https://wa.me/22655300868?text=${message}`, "_blank");
                  }}
                  className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
                >
                  <MessageSquare className="h-4 w-4 fill-white/10" />
                  Contacter sur WhatsApp pour Activer
                </Button>

                <Button
                  variant="outline"
                  onClick={() => {
                    window.open("tel:+22655300868", "_self");
                  }}
                  className="w-full h-11 border-border bg-background hover:bg-secondary/40 font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
                >
                  <Phone className="h-4 w-4" />
                  Appeler le +226 55 30 08 68
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
