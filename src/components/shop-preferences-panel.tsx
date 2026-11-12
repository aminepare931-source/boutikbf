// ============================================================================
// Console de réglages par boutique — 30 options organisées en 5 groupes,
// sauvegarde automatique au changement (debounce 600 ms), valeurs par
// défaut si aucune donnée n'est enregistrée encore.
// ============================================================================
import { useEffect, useRef, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Save } from "lucide-react";
import { useShopSettings, type ShopSettings } from "@/lib/shop-settings";

// ————————————————————————————————————————————————————————————————
// Petits composants de ligne réutilisables
// ————————————————————————————————————————————————————————————————
type RowProps = { label: string; hint?: string; children: React.ReactNode };

function Row({ label, hint, children }: RowProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5 border-b border-border/40 last:border-b-0">
      <div className="min-w-0">
        <div className="text-sm font-medium">{label}</div>
        {hint && <div className="text-xs text-muted-foreground mt-0.5 leading-tight">{hint}</div>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function NumRow({
  label,
  hint,
  value,
  min,
  max,
  step,
  suffix,
  onChange,
}: {
  label: string;
  hint?: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  onChange: (v: number) => void;
}) {
  return (
    <Row label={label} hint={hint}>
      <div className="flex items-center gap-1.5">
        <Input
          type="number"
          value={String(value)}
          min={min}
          max={max}
          step={step}
          onChange={(e) => onChange(Number(e.target.value))}
          className="h-8 w-24 text-sm font-mono text-right"
        />
        {suffix && <span className="text-xs text-muted-foreground w-10">{suffix}</span>}
      </div>
    </Row>
  );
}

function BoolRow({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <Row label={label} hint={hint}>
      <Switch checked={value} onCheckedChange={onChange} />
    </Row>
  );
}

// ————————————————————————————————————————————————————————————————
// Panneau principal
// ————————————————————————————————————————————————————————————————
export function ShopPreferencesPanel() {
  const { settings, save } = useShopSettings();
  const [saving, setSaving] = useState(false);
  const lastSaved = useRef(0);

  // Sauvegarde auto : chaque patch déclenche l'écriture (debounce léger)
  const pending = useRef<Partial<ShopSettings> | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const apply = (patch: Partial<ShopSettings>) => {
    pending.current = { ...(pending.current ?? {}), ...patch };
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      const p = pending.current;
      pending.current = null;
      if (!p) return;
      setSaving(true);
      await save(p);
      setSaving(false);
      lastSaved.current = Date.now();
    }, 600);
  };

  // Nettoyage du timer à la sortie
  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const s = settings;

  return (
    <div className="space-y-6">
      {/* En-tête du bloc */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl md:text-2xl font-black flex items-center gap-2">
            <Save className="h-5.5 w-5.5 text-emerald-500 fill-emerald-500/10" />
            Réglages de la boutique
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            30 options organisées en 5 thèmes — la sauvegarde est automatique
            dès que vous modifiez une valeur.
          </p>
        </div>
        <div className="text-right">
          <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 justify-end">
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            {saving ? "Enregistrement…" : "Auto"}
          </div>
          {lastSaved.current > 0 && (
            <div className="text-[10px] text-muted-foreground mt-0.5">
              Dernière sauvegarde :{" "}
              {new Date(lastSaved.current).toLocaleTimeString("fr-FR", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ———————————————————————————————————————————————— */}
        {/* 1 · Caisse & encaissement (9 réglages)              */}
        {/* ———————————————————————————————————————————————— */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="font-display text-lg flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500" /> Caisse &
              encaissement
            </CardTitle>
            <CardDescription className="text-sm">
              Comportement par défaut de la caisse au moment de l&apos;encaissement.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Row
              label="Mode de paiement par défaut"
              hint="Sélectionné automatiquement sur le clavier tactile"
            >
              <Select
                value={s.defaultPayment}
                onValueChange={(v) =>
                  apply({ defaultPayment: v as ShopSettings["defaultPayment"] })
                }
              >
                <SelectTrigger className="h-8 w-36 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Espèces</SelectItem>
                  <SelectItem value="mobile">Mobile Money</SelectItem>
                  <SelectItem value="card">Carte bancaire</SelectItem>
                </SelectContent>
              </Select>
            </Row>

            <Row
              label="Montants rapides"
              hint="Boutons « 500 / 1 000 / 5 000 F » sur le clavier (virgules)"
            >
              <Input
                value={s.quickCash}
                onChange={(e) => apply({ quickCash: e.target.value })}
                className="h-8 w-48 text-sm font-mono"
              />
            </Row>

            <BoolRow
              label="Vente à crédit"
              hint="Autorise les clients à devoir (dette)"
              value={s.enableCredit}
              onChange={(v) => apply({ enableCredit: v })}
            />
            <NumRow
              label="Plafond de dette par client"
              hint="0 = illimité"
              value={s.creditLimit}
              min={0}
              step={1000}
              suffix="F CFA"
              onChange={(v) => apply({ creditLimit: v })}
            />
            <BoolRow
              label="Saisie vocale"
              hint="Micro pour la recherche de produits"
              value={s.enableVoice}
              onChange={(v) => apply({ enableVoice: v })}
            />
            <BoolRow
              label="Pourboire / arrondi"
              hint="Propose l&apos;arrondi lors du paiement en espèces"
              value={s.enableTips}
              onChange={(v) => apply({ enableTips: v })}
            />
            <BoolRow
              label="Impression automatique du ticket"
              hint="Ouvre le dialogue d&apos;impression après chaque vente"
              value={s.autoPrint}
              onChange={(v) => apply({ autoPrint: v })}
            />
            <Row label="Papier de reçu" hint="Largeur de la bobine">
              <Select
                value={s.receiptPaper}
                onValueChange={(v) =>
                  apply({ receiptPaper: v as ShopSettings["receiptPaper"] })
                }
              >
                <SelectTrigger className="h-8 w-28 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="58">58 mm</SelectItem>
                  <SelectItem value="80">80 mm</SelectItem>
                </SelectContent>
              </Select>
            </Row>
            <Row label="Préfixe de référence" hint="V-0001, F-0042…">
              <Input
                value={s.referencePrefix}
                onChange={(e) => apply({ referencePrefix: e.target.value.toUpperCase() })}
                className="h-8 w-20 text-sm font-mono"
              />
            </Row>
            <BoolRow
              label="Obliger l&apos;ouverture de caisse"
              hint="Impossible de vendre avant d&apos;avoir ouvert le shift"
              value={s.requireShift}
              onChange={(v) => apply({ requireShift: v })}
            />
          </CardContent>
        </Card>

        {/* ———————————————————————————————————————————————— */}
        {/* 2 · Tickets & reçus (4) + 3 · Fidélité (3)          */}
        {/* ———————————————————————————————————————————————— */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="font-display text-lg flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-500" /> Tickets &
              fidélité
            </CardTitle>
            <CardDescription className="text-sm">
              Apparence du reçu et règles du programme de points.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label>Message d&apos;en-tête du ticket</Label>
              <Input
                value={s.receiptHeader}
                onChange={(e) => apply({ receiptHeader: e.target.value })}
                placeholder="Ex. : Bienvenue chez BoutikBF !!"
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label>Message de bas de page</Label>
              <Input
                value={s.receiptFooter}
                onChange={(e) => apply({ receiptFooter: e.target.value })}
                placeholder="Merci de votre visite !"
                className="h-8 text-sm"
              />
            </div>
            <BoolRow
              label="Afficher le client sur le ticket"
              value={s.showCustomerOnReceipt}
              onChange={(v) => apply({ showCustomerOnReceipt: v })}
            />
            <BoolRow
              label="Afficher les points gagnés"
              value={s.showPointsOnReceipt}
              onChange={(v) => apply({ showPointsOnReceipt: v })}
            />

            <div className="pt-2 border-t border-border/50" />

            <NumRow
              label="1 point gagné par…"
              hint="Montant de dépense qui génère 1 point"
              value={s.pointsPer}
              min={100}
              step={100}
              suffix="F"
              onChange={(v) => apply({ pointsPer: v })}
            />
            <NumRow
              label="100 points valent"
              hint="Remise en FCFA convertie à la caisse"
              value={s.pointsValue}
              min={100}
              step={100}
              suffix="F"
              onChange={(v) => apply({ pointsValue: v })}
            />
            <BoolRow
              label="Annonces d&apos;anniversaire"
              hint="Suggestions dans l&apos;assistant IA"
              value={s.birthdayMessages}
              onChange={(v) => apply({ birthdayMessages: v })}
            />
          </CardContent>
        </Card>

        {/* ———————————————————————————————————————————————— */}
        {/* 4 · Stock & alertes (4)                               */}
        {/* ———————————————————————————————————————————————— */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="font-display text-lg flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-cyan-500" /> Stock &
              alertes
            </CardTitle>
            <CardDescription className="text-sm">
              Seuils par défaut pour les nouveaux produits.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <NumRow
              label="Seuil de stock bas par défaut"
              value={s.lowStockDefault}
              min={0}
              step={1}
              suffix="unités"
              onChange={(v) => apply({ lowStockDefault: v })}
            />
            <NumRow
              label="Alerte de péremption"
              hint="Jours avant la date limite"
              value={s.expiryAlertDays}
              min={0}
              step={1}
              suffix="jours"
              onChange={(v) => apply({ expiryAlertDays: v })}
            />
            <NumRow
              label="Coefficient de réappro"
              hint="Suggestion = seuil × ce coefficient"
              value={s.reorderMultiplier}
              min={1}
              step={0.5}
              suffix="×"
              onChange={(v) => apply({ reorderMultiplier: v })}
            />
            <BoolRow
              label="Bloquer les produits périmés"
              hint="Vente interdite sinon simple alerte"
              value={s.autoBlockExpired}
              onChange={(v) => apply({ autoBlockExpired: v })}
            />
          </CardContent>
        </Card>

        {/* ———————————————————————————————————————————————— */}
        {/* 5 · Rapports & IA (4) + 6 · Interface (3) + Divers (2)*/}
        {/* ———————————————————————————————————————————————— */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="font-display text-lg flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-purple-500" /> Rapports,
              IA & interface
            </CardTitle>
            <CardDescription className="text-sm">
              Taux par défaut, suggestions IA, langue et densité de l&apos;affichage.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <NumRow
              label="TVA par défaut"
              value={s.vatDefault}
              min={0}
              max={100}
              step={0.5}
              suffix="%"
              onChange={(v) => apply({ vatDefault: v })}
            />
            <NumRow
              label="Marge cible IA"
              hint="Recommandée par l&apos;assistant"
              value={s.aiMarginTarget}
              min={0}
              max={90}
              step={1}
              suffix="%"
              onChange={(v) => apply({ aiMarginTarget: v })}
            />
            <NumRow
              label="Durée des promos IA"
              value={s.aiPromoDays}
              min={1}
              step={1}
              suffix="jours"
              onChange={(v) => apply({ aiPromoDays: v })}
            />
            <BoolRow
              label="Rapport quotidien WhatsApp"
              hint="Bouton sur l&apos;écran du jour"
              value={s.dailyReport}
              onChange={(v) => apply({ dailyReport: v })}
            />

            <div className="pt-2 border-t border-border/50" />

            <Row label="Langue de l&apos;application">
              <Select
                value={s.language}
                onValueChange={(v) =>
                  apply({ language: v as ShopSettings["language"] })
                }
              >
                <SelectTrigger className="h-8 w-32 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fr">Français</SelectItem>
                  <SelectItem value="en">Anglais</SelectItem>
                  <SelectItem value="mo">Moore</SelectItem>
                  <SelectItem value="di">Dioula</SelectItem>
                  <SelectItem value="ff">Fula</SelectItem>
                  <SelectItem value="gma">Gurma</SelectItem>
                </SelectContent>
              </Select>
            </Row>
            <BoolRow
              label="Interface compacte"
              hint="Espacements réduits (plus d&apos;infos à l&apos;écran)"
              value={s.compactMode}
              onChange={(v) => apply({ compactMode: v })}
            />
            <BoolRow
              label="Favoris en tête de grille"
              value={s.showFavoritesFirst}
              onChange={(v) => apply({ showFavoritesFirst: v })}
            />

            <div className="pt-2 border-t border-border/50" />

            <BoolRow
              label="Comptage d&apos;espèces en clôture"
              hint="Contrôle du tiroir-casque à la fin de shift"
              value={s.cashDrawerCount}
              onChange={(v) => apply({ cashDrawerCount: v })}
            />
            <BoolRow
              label="Partage WhatsApp après impression"
              value={s.whatsappOnReceiptShare}
              onChange={(v) => apply({ whatsappOnReceiptShare: v })}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
