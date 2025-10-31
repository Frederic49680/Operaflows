-- ============================================
-- Migration 004: Fix RLS pour permettre aux admins de voir toutes les demandes
-- ============================================

-- Supprimer la politique trop permissive qui pourrait créer des conflits
DROP POLICY IF EXISTS "Public can check requests by email" ON public.tbl_user_requests;

-- Les admins peuvent voir toutes les demandes (SELECT)
-- Cette politique existe déjà mais vérifions qu'elle est correcte
DROP POLICY IF EXISTS "Admins can view all requests" ON public.tbl_user_requests;
CREATE POLICY "Admins can view all requests" ON public.tbl_user_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name = 'Administrateur'
    )
  );

-- Les utilisateurs peuvent voir leurs propres demandes
-- Cette politique existe déjà
DROP POLICY IF EXISTS "Users can view own requests" ON public.tbl_user_requests;
CREATE POLICY "Users can view own requests" ON public.tbl_user_requests
  FOR SELECT USING (
    demandeur_id = auth.uid() OR
    demandeur_id IS NULL
  );

