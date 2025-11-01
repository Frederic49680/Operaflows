-- Migration 022 : Force fix pour les politiques RLS de collaborateurs
-- Cette migration force la recréation complète des politiques pour garantir qu'elles fonctionnent

-- ============================================
-- 1. Créer/Vérifier toutes les fonctions helper nécessaires
-- ============================================

-- Fonction 1: is_rh_or_admin
CREATE OR REPLACE FUNCTION public.is_rh_or_admin(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_id UUID;
BEGIN
    -- Stocker le paramètre dans une variable locale pour éviter l'ambiguïté
    v_user_id := user_id;
    
    -- SECURITY DEFINER permet de contourner RLS
    RETURN EXISTS (
        SELECT 1 
        FROM public.user_roles ur
        INNER JOIN public.roles r ON ur.role_id = r.id
        WHERE ur.user_id = v_user_id 
        AND (
            r.name = 'Administrateur' 
            OR r.name LIKE '%RH%'
            OR r.name LIKE '%Formation%'
            OR r.name LIKE '%Dosimétrie%'
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction 2: get_collaborateur_id_from_user
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

-- Fonction 3: is_responsable_of
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
-- 2. Supprimer TOUTES les politiques existantes sur collaborateurs
-- ============================================
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'collaborateurs')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.collaborateurs', r.policyname);
    END LOOP;
END $$;

-- ============================================
-- 3. Recréer toutes les politiques dans le bon ordre
-- ============================================

-- Politique 1: Les utilisateurs peuvent lire leur propre profil
CREATE POLICY "Users can read own collaborateur profile" ON public.collaborateurs
  FOR SELECT USING (user_id = auth.uid());

-- Politique 2: Les RH/Admin peuvent lire TOUS les collaborateurs (politique explicite FOR SELECT)
CREATE POLICY "RH/Admin can read all collaborateurs" ON public.collaborateurs
  FOR SELECT USING (public.is_rh_or_admin(auth.uid()));

-- Politique 3: Les responsables peuvent lire les membres de leur équipe
CREATE POLICY "Responsables can read their team" ON public.collaborateurs
  FOR SELECT USING (
    public.is_responsable_of(auth.uid(), id)
  );

-- Politique 4: Les utilisateurs peuvent créer leur propre profil
CREATE POLICY "Users can create own profile" ON public.collaborateurs
  FOR INSERT WITH CHECK (user_id = auth.uid() OR public.is_rh_or_admin(auth.uid()));

-- Politique 5: Les RH/Admin peuvent créer n'importe quel collaborateur
CREATE POLICY "RH/Admin can insert collaborateurs" ON public.collaborateurs
  FOR INSERT WITH CHECK (public.is_rh_or_admin(auth.uid()));

-- Politique 6: Les responsables peuvent créer des membres dans leur équipe
CREATE POLICY "Responsables can insert team members" ON public.collaborateurs
  FOR INSERT WITH CHECK (
    site_id IS NULL OR EXISTS (
      SELECT 1 FROM public.tbl_site_responsables tsr
      WHERE tsr.site_id = site_id
      AND tsr.collaborateur_id = public.get_collaborateur_id_from_user(auth.uid())
      AND tsr.role_fonctionnel = 'Responsable d''activité'
      AND tsr.is_active = true
      AND (tsr.date_fin IS NULL OR tsr.date_fin >= CURRENT_DATE)
    )
  );

-- Politique 7: Les utilisateurs peuvent mettre à jour leur propre profil
CREATE POLICY "Users can update own profile" ON public.collaborateurs
  FOR UPDATE USING (user_id = auth.uid());

-- Politique 8: Les RH/Admin peuvent mettre à jour tous les collaborateurs
CREATE POLICY "RH/Admin can update all collaborateurs" ON public.collaborateurs
  FOR UPDATE USING (public.is_rh_or_admin(auth.uid()));

-- Politique 9: Les RH/Admin peuvent supprimer tous les collaborateurs
CREATE POLICY "RH/Admin can delete all collaborateurs" ON public.collaborateurs
  FOR DELETE USING (public.is_rh_or_admin(auth.uid()));

-- ============================================
-- 4. Vérification
-- ============================================
DO $$ 
BEGIN
    -- Vérifier que toutes les politiques sont créées
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'collaborateurs' 
        AND policyname = 'RH/Admin can read all collaborateurs'
    ) THEN
        RAISE EXCEPTION 'La politique RH/Admin can read all collaborateurs n''a pas été créée';
    END IF;
    
    RAISE NOTICE 'Migration 022 : Toutes les politiques RLS ont été recréées avec succès';
END $$;

