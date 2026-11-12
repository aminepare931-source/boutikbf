-- Console de réglages par boutique (préférences stockées en JSONB).
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS settings JSONB NOT NULL DEFAULT '{}';
