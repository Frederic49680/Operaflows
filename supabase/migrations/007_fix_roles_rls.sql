-- ============================================
-- Migration 007: Fix RLS pour permettre aux admins de gérer les rôles
-- ============================================

-- Les admins peuvent tout faire sur les rôles
DROP POLICY IF EXISTS "Admins can manage roles" ON public.roles;
CREATE POLICY "Admins can manage roles" ON public.roles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name = 'Administrateur'
    )
  );

-- Tous les utilisateurs authentifiés peuvent lire les rôles (pour les listes déroulantes)
DROP POLICY IF EXISTS "Users can read roles" ON public.roles;
CREATE POLICY "Users can read roles" ON public.roles
  FOR SELECT USING (auth.role() = 'authenticated');

-- Les admins peuvent tout faire sur les permissions
DROP POLICY IF EXISTS "Admins can manage permissions" ON public.tbl_permissions;
CREATE POLICY "Admins can manage permissions" ON public.tbl_permissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name = 'Administrateur'
    )
  );

