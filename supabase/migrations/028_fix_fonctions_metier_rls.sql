-- Migration 028 : Fix RLS pour tbl_fonctions_metier
-- Corrige les politiques RLS pour utiliser la fonction helper is_admin et éviter la récursion

-- Vérifier que la fonction is_admin existe (créée dans migration 010 ou 000)
-- Si elle n'existe pas, la créer
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
DROP POLICY IF EXISTS "Admins peuvent lire toutes fonctions métier" ON public.tbl_fonctions_metier;
DROP POLICY IF EXISTS "Admins peuvent créer fonctions métier" ON public.tbl_fonctions_metier;
DROP POLICY IF EXISTS "Admins peuvent modifier fonctions métier" ON public.tbl_fonctions_metier;
DROP POLICY IF EXISTS "Admins peuvent supprimer fonctions métier" ON public.tbl_fonctions_metier;

-- Recréer les politiques avec la fonction helper is_admin

-- Seuls les admins peuvent lire toutes les fonctions métier (y compris inactives)
CREATE POLICY "Admins peuvent lire toutes fonctions métier" ON public.tbl_fonctions_metier
  FOR SELECT
  USING (public.is_admin(auth.uid()));

-- Seuls les admins peuvent créer des fonctions métier
CREATE POLICY "Admins peuvent créer fonctions métier" ON public.tbl_fonctions_metier
  FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

-- Seuls les admins peuvent modifier des fonctions métier
CREATE POLICY "Admins peuvent modifier fonctions métier" ON public.tbl_fonctions_metier
  FOR UPDATE
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Seuls les admins peuvent supprimer (désactiver) des fonctions métier
CREATE POLICY "Admins peuvent supprimer fonctions métier" ON public.tbl_fonctions_metier
  FOR DELETE
  USING (public.is_admin(auth.uid()));

