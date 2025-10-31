-- ============================================
-- Migration 006: Augmenter la taille de session_token pour supporter les JWT complets
-- ============================================

-- Modifier le type de session_token de VARCHAR(255) à TEXT pour supporter les JWT (généralement 300-500 caractères)
ALTER TABLE public.tbl_sessions 
  ALTER COLUMN session_token TYPE TEXT;

-- Supprimer la contrainte UNIQUE et la recréer sur TEXT (si elle existe)
ALTER TABLE public.tbl_sessions 
  DROP CONSTRAINT IF EXISTS tbl_sessions_session_token_key;

CREATE UNIQUE INDEX IF NOT EXISTS idx_tbl_sessions_session_token ON public.tbl_sessions(session_token);

