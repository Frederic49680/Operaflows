-- Migration 019 : Fix RLS pour permettre aux admins de lire tous les utilisateurs
-- Le problème : la politique "Admins can manage all users" utilise FOR ALL mais 
-- peut avoir des problèmes avec les jointures dans les SELECT

-- S'assurer que la fonction is_admin existe et fonctionne correctement
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_id UUID;
BEGIN
    -- Stocker le paramètre dans une variable locale pour éviter l'ambiguïté
    v_user_id := user_id;
    
    RETURN EXISTS (
        SELECT 1 
        FROM public.user_roles ur
        INNER JOIN public.roles r ON ur.role_id = r.id
        WHERE ur.user_id = v_user_id 
        AND r.name = 'Administrateur'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Supprimer les anciennes politiques
DROP POLICY IF EXISTS "Users can read own profile" ON public.tbl_users;
DROP POLICY IF EXISTS "Admins can manage all users" ON public.tbl_users;
DROP POLICY IF EXISTS "Admins can read all users" ON public.tbl_users;

-- Les utilisateurs peuvent lire leur propre profil
CREATE POLICY "Users can read own profile" ON public.tbl_users
  FOR SELECT USING (auth.uid() = id);

-- Politique spécifique pour que les admins puissent LIRE tous les utilisateurs
CREATE POLICY "Admins can read all users" ON public.tbl_users
  FOR SELECT USING (public.is_admin(auth.uid()));

-- Les administrateurs peuvent gérer (INSERT, UPDATE, DELETE) tous les utilisateurs
CREATE POLICY "Admins can manage all users" ON public.tbl_users
  FOR ALL USING (public.is_admin(auth.uid()));

