-- ============================================
-- Migration 010: Fix récursion infinie dans les politiques RLS
-- Le problème : la politique "Admins can manage all users" crée une récursion
-- car elle lit user_roles -> roles, mais roles peut aussi vérifier les admins
-- ============================================

-- Solution : Utiliser une fonction SQL qui vérifie directement sans récursion
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Vérifier directement dans user_roles sans passer par une politique
  -- qui pourrait créer une récursion
  RETURN EXISTS (
    SELECT 1 
    FROM public.user_roles ur
    INNER JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = user_id 
    AND r.name = 'Administrateur'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Réappliquer les politiques avec la fonction pour éviter la récursion
DROP POLICY IF EXISTS "Admins can manage all users" ON public.tbl_users;
CREATE POLICY "Admins can manage all users" ON public.tbl_users
  FOR ALL USING (public.is_admin(auth.uid()));

-- Les utilisateurs peuvent lire leur propre profil (déjà fait, mais on s'assure qu'elle existe)
DROP POLICY IF EXISTS "Users can read own profile" ON public.tbl_users;
CREATE POLICY "Users can read own profile" ON public.tbl_users
  FOR SELECT USING (auth.uid() = id);

-- Même correction pour les rôles
DROP POLICY IF EXISTS "Admins can manage roles" ON public.roles;
CREATE POLICY "Admins can manage roles" ON public.roles
  FOR ALL USING (public.is_admin(auth.uid()));

-- Et pour les permissions
DROP POLICY IF EXISTS "Admins can manage permissions" ON public.tbl_permissions;
CREATE POLICY "Admins can manage permissions" ON public.tbl_permissions
  FOR ALL USING (public.is_admin(auth.uid()));

-- Et pour les demandes d'accès
DROP POLICY IF EXISTS "Admins can view all requests" ON public.tbl_user_requests;
CREATE POLICY "Admins can view all requests" ON public.tbl_user_requests
  FOR SELECT USING (public.is_admin(auth.uid()));

