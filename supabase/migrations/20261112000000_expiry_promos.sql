-- ============================================================================
-- Fonctionnalités différenciantes (2026-11-12)
--  - Dates de péremption + n° de lot (pharmacie, alimentation)
--  - Promotions à durée limitée (promo_price existait déjà, jamais exploitée)
-- À exécuter UNE FOIS (CLI).
-- ============================================================================

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS expiry_date DATE;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS batch_label TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS promo_start DATE;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS promo_end DATE;

CREATE INDEX IF NOT EXISTS idx_products_expiry ON public.products(shop_id, expiry_date)
  WHERE expiry_date IS NOT NULL;
