// ============================================================================
// Console de réglages par boutique — une seule source de vérité typée.
// Chaque réglage a un défaut ; les écrans lisent useShopSettings() et
// enregistrent via saveShopSettings(). Les valeurs non définies retombent
// sur les défauts (migration douce : rien n'est obligatoire en base).
// ============================================================================
import { useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { useShops } from "./shop-store";
import { toast } from "sonner";

export type ShopSettings = {
  // — Caisse —
  defaultPayment: "cash" | "mobile" | "card"; // mode de paiement sélectionné par défaut
  quickCash: string; // montants arrondis rapides, séparés par des virgules ("500,1000,5000")
  enableCredit: boolean; // autoriser la vente à crédit
  creditLimit: number; // dette max autorisée par client (0 = illimité)
  enableVoice: boolean; // micro de saisie vocale
  enableTips: boolean; // arrondi/pourboire proposé à l'encaissement espèces
  autoPrint: boolean; // ouvrir le ticket automatiquement après encaissement
  receiptPaper: "58" | "80"; // largeur papier par défaut
  referencePrefix: string; // préfixe des références de vente ("V")
  requireShift: boolean; // obliger à ouvrir la caisse avant de vendre
  // — Tickets & reçus —
  receiptHeader: string; // message d'en-tête sur les reçus
  receiptFooter: string; // message de bas de page (« merci… »)
  showCustomerOnReceipt: boolean;
  showPointsOnReceipt: boolean; // affiche les points gagnés sur le ticket
  // — Fidélité —
  pointsPer: number; // 1 point gagné par X F dépensés
  pointsValue: number; // 100 points valent X F de remise
  birthdayMessages: boolean; // suggestions d'anniversaires dans l'assistant
  // — Stock & alertes —
  lowStockDefault: number; // seuil mini par défaut des nouveaux produits
  expiryAlertDays: number; // alerter X jours avant péremption
  reorderMultiplier: number; // réappro suggéré = seuil × X
  autoBlockExpired: boolean; // interdire la vente des produits périmés (sinon simple alerte)
  // — Rapports & IA —
  vatDefault: number; // taux de TVA par défaut (%)
  aiMarginTarget: number; // marge cible conseillée par l'IA (%)
  aiPromoDays: number; // durée par défaut des promos suggérées (jours)
  dailyReport: boolean; // bouton rapport du jour WhatsApp visible
  // — Interface —
  language: "fr" | "en" | "mo" | "di" | "ff" | "gma"; // langue de l'appli pour cette boutique
  compactMode: boolean; // interface dense (petits espacements)
  showFavoritesFirst: boolean; // favoris en tête de grille caisse
  // — Divers —
  cashDrawerCount: boolean; // exiger le comptage d'espèces à la fermeture
  whatsappOnReceiptShare: boolean; // proposer l'envoi WhatsApp après impression
};

export const DEFAULT_SETTINGS: ShopSettings = {
  defaultPayment: "cash",
  quickCash: "500,1000,2000,5000,10000",
  enableCredit: true,
  creditLimit: 0,
  enableVoice: true,
  enableTips: false,
  autoPrint: false,
  receiptPaper: "80",
  referencePrefix: "V",
  requireShift: false,
  receiptHeader: "",
  receiptFooter: "Merci de votre visite 🇧🇫",
  showCustomerOnReceipt: true,
  showPointsOnReceipt: true,
  pointsPer: 100,
  pointsValue: 1000,
  birthdayMessages: true,
  lowStockDefault: 5,
  expiryAlertDays: 60,
  reorderMultiplier: 2,
  autoBlockExpired: false,
  vatDefault: 18,
  aiMarginTarget: 25,
  aiPromoDays: 14,
  dailyReport: true,
  language: "fr",
  compactMode: false,
  showFavoritesFirst: true,
  cashDrawerCount: true,
  whatsappOnReceiptShare: true,
};

export function mergeSettings(raw: unknown): ShopSettings {
  const obj = (raw ?? {}) as Partial<ShopSettings>;
  return { ...DEFAULT_SETTINGS, ...obj };
}

/** Réglages de la boutique courante (fusionnés avec les défauts). */
export function useShopSettings(): {
  settings: ShopSettings;
  save: (patch: Partial<ShopSettings>) => Promise<void>;
  saving: boolean;
} {
  const { current, reload } = useShops();
  const settings = useMemo(() => mergeSettings(current?.settings), [current?.settings]);

  const save = useCallback(
    async (patch: Partial<ShopSettings>) => {
      if (!current) return;
      const next = { ...settings, ...patch };
      const { error } = await supabase
        .from("shops")
        .update({ settings: next as unknown as Json })
        .eq("id", current.id);
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Réglage enregistré");
      reload();
    },
    [current, settings, reload],
  );

  return { settings, save, saving: false };
}

/** Liste des montants rapides configurés. */
export function quickCashList(s: ShopSettings): number[] {
  return s.quickCash
    .split(",")
    .map((v) => Number(v.trim()))
    .filter((v) => v > 0)
    .slice(0, 6);
}
