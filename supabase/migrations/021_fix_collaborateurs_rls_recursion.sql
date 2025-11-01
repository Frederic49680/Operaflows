-- Migration 021 : Fix récursion infinie dans les politiques RLS de collaborateurs
-- Le problème : Les politiques RLS font des requêtes sur collaborateurs qui déclenchent à nouveau RLS
-- Solution : Utiliser des fonctions SECURITY DEFINER pour contourner RLS lors des vérifications

-- ============================================
-- 1. Fonction helper pour obtenir le collaborateur_id d'un user_id
-- ============================================
CREATE OR REPLACE FUNCTION public.get_collaborateur_id_from_user(p_user_id UUID)
RETURNS UUID AS $$
DECLARE
    v_collab_id UUID;
BEGIN
    -- SECURITY DEFINER permet de contourner RLS pour cette fonction
    SELECT id INTO v_collab_id
    FROM public.collaborateurs
    WHERE user_id = p_user_id
    LIMIT 1;
    
    RETURN v_collab_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 2. Fonction helper pour vérifier si un collaborateur est responsable d'un autre
-- ============================================
CREATE OR REPLACE FUNCTION public.is_responsable_of(p_responsable_user_id UUID, p_collaborateur_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_responsable_collab_id UUID;
    v_responsable_id UUID;
    v_responsable_activite_id UUID;
BEGIN
    -- Obtenir le collaborateur_id du responsable (SECURITY DEFINER contourne RLS)
    v_responsable_collab_id := public.get_collaborateur_id_from_user(p_responsable_user_id);
    
    IF v_responsable_collab_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Lire directement les colonnes responsable_id et responsable_activite_id du collaborateur
    -- SECURITY DEFINER permet de contourner RLS pour cette requête
    SELECT responsable_id, responsable_activite_id 
    INTO v_responsable_id, v_responsable_activite_id
    FROM public.collaborateurs
    WHERE id = p_collaborateur_id;
    
    -- Vérifier si le responsable correspond
    RETURN (
        v_responsable_id = v_responsable_collab_id 
        OR v_responsable_activite_id = v_responsable_collab_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 3. Supprimer les anciennes politiques
-- ============================================
DROP POLICY IF EXISTS "Users can read own collaborateur profile" ON public.collaborateurs;
DROP POLICY IF EXISTS "RH/Admin can read all collaborateurs" ON public.collaborateurs;
DROP POLICY IF EXISTS "RH/Admin can manage all collaborateurs" ON public.collaborateurs;
DROP POLICY IF EXISTS "Responsables can read their team" ON public.collaborateurs;
DROP POLICY IF EXISTS "Responsables can insert team members" ON public.collaborateurs;

-- ============================================
-- 4. Recréer les politiques sans récursion
-- ============================================

-- Les utilisateurs peuvent lire leur propre profil
CREATE POLICY "Users can read own collaborateur profile" ON public.collaborateurs
  FOR SELECT USING (user_id = auth.uid());

-- Les RH/Admin peuvent lire tous les collaborateurs (politique explicite FOR SELECT)
CREATE POLICY "RH/Admin can read all collaborateurs" ON public.collaborateurs
  FOR SELECT USING (public.is_rh_or_admin(auth.uid()));

-- Les RH/Admin peuvent gérer (INSERT, UPDATE, DELETE) tous les collaborateurs
CREATE POLICY "RH/Admin can manage all collaborateurs" ON public.collaborateurs
  FOR ALL USING (public.is_rh_or_admin(auth.uid()));

-- Les responsables peuvent lire les membres de leur équipe
CREATE POLICY "Responsables can read their team" ON public.collaborateurs
  FOR SELECT USING (
    public.is_responsable_of(auth.uid(), id)
  );

-- Les responsables peuvent créer des membres dans leur équipe
-- Note: Simplifié pour éviter les jointures récursives avec collaborateurs
-- On vérifie uniquement via tbl_site_responsables qui n'a pas de récursion
CREATE POLICY "Responsables can insert team members" ON public.collaborateurs
  FOR INSERT WITH CHECK (
    -- Si un site_id est fourni, vérifier que le responsable gère ce site via tbl_site_responsables
    site_id IS NULL OR EXISTS (
      SELECT 1 FROM public.tbl_site_responsables tsr
      WHERE tsr.site_id = site_id
      AND tsr.collaborateur_id = public.get_collaborateur_id_from_user(auth.uid())
      AND tsr.role_fonctionnel = 'Responsable d''activité'
      AND tsr.is_active = true
      AND (tsr.date_fin IS NULL OR tsr.date_fin >= CURRENT_DATE)
    )
    OR public.is_rh_or_admin(auth.uid())
  );

-- Tous les utilisateurs authentifiés peuvent créer leur propre profil
CREATE POLICY "Users can create own profile" ON public.collaborateurs
  FOR INSERT WITH CHECK (user_id = auth.uid() OR public.is_rh_or_admin(auth.uid()));

-- Les utilisateurs peuvent mettre à jour leur propre profil
CREATE POLICY "Users can update own profile" ON public.collaborateurs
  FOR UPDATE USING (user_id = auth.uid());

