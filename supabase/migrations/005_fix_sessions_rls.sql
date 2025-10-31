-- ============================================
-- Migration 005: Fix RLS pour tbl_sessions
-- Permet aux utilisateurs de créer leurs propres sessions
-- ============================================

-- Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Users can create own sessions" ON public.tbl_sessions;
DROP POLICY IF EXISTS "Users can view own sessions" ON public.tbl_sessions;

-- Les utilisateurs peuvent créer leurs propres sessions
CREATE POLICY "Users can create own sessions" ON public.tbl_sessions
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Les utilisateurs peuvent voir leurs propres sessions
CREATE POLICY "Users can view own sessions" ON public.tbl_sessions
  FOR SELECT USING (user_id = auth.uid());

