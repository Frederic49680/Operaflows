-- ============================================
-- Migration 003: Fix RLS policies for tbl_user_requests
-- Permet aux utilisateurs non authentifiés de créer des demandes d'accès
-- ============================================

-- Supprimer les anciennes politiques si elles existent (idempotent)
DROP POLICY IF EXISTS "Anyone can create access request" ON public.tbl_user_requests;
DROP POLICY IF EXISTS "Public can check requests by email" ON public.tbl_user_requests;

-- N'importe qui peut créer une demande d'accès (même non authentifié)
CREATE POLICY "Anyone can create access request" ON public.tbl_user_requests
  FOR INSERT WITH CHECK (true);

-- Permet à n'importe qui de vérifier si un email a déjà une demande
-- (pour éviter les doublons lors de la création)
CREATE POLICY "Public can check requests by email" ON public.tbl_user_requests
  FOR SELECT USING (true);

