-- ============================================
-- Migration 009: Fix RLS pour tbl_users
-- Permet aux utilisateurs de lire leur propre profil lors de la connexion
-- ============================================

-- Supprimer les anciennes politiques
DROP POLICY IF EXISTS "Users can read own profile" ON public.tbl_users;
DROP POLICY IF EXISTS "Admins can manage all users" ON public.tbl_users;

-- Les utilisateurs peuvent lire leur propre profil
CREATE POLICY "Users can read own profile" ON public.tbl_users
  FOR SELECT USING (auth.uid() = id);

-- Les administrateurs peuvent tout faire
CREATE POLICY "Admins can manage all users" ON public.tbl_users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name = 'Administrateur'
    )
  );

