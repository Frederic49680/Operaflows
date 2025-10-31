-- Migration 015 : Fix RLS pour tbl_sites
-- Corrige les politiques RLS pour permettre l'affichage des sites

-- Supprimer les anciennes politiques
DROP POLICY IF EXISTS "Anyone can view active sites" ON public.tbl_sites;
DROP POLICY IF EXISTS "Admins and RH can manage sites" ON public.tbl_sites;

-- Vérifier que la fonction is_rh_or_admin existe (définie dans migration 011)
-- Si elle n'existe pas, la créer
-- Note: Cette fonction doit être créée AVANT les politiques RLS qui l'utilisent
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'is_rh_or_admin'
  ) THEN
    CREATE FUNCTION public.is_rh_or_admin(user_id UUID)
    RETURNS BOOLEAN AS $$
    BEGIN
      RETURN EXISTS (
        SELECT 1 
        FROM public.user_roles ur
        INNER JOIN public.roles r ON ur.role_id = r.id
        WHERE ur.user_id = user_id 
        AND (
          r.name = 'Administrateur' 
          OR r.name LIKE '%RH%'
          OR r.name LIKE '%Formation%'
          OR r.name LIKE '%Dosimétrie%'
        )
      );
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
  ELSE
    -- S'assurer que la fonction existe avec SECURITY DEFINER
    CREATE OR REPLACE FUNCTION public.is_rh_or_admin(user_id UUID)
    RETURNS BOOLEAN AS $$
    BEGIN
      RETURN EXISTS (
        SELECT 1 
        FROM public.user_roles ur
        INNER JOIN public.roles r ON ur.role_id = r.id
        WHERE ur.user_id = user_id 
        AND (
          r.name = 'Administrateur' 
          OR r.name LIKE '%RH%'
          OR r.name LIKE '%Formation%'
          OR r.name LIKE '%Dosimétrie%'
        )
      );
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
  END IF;
END $$;

-- Nouvelle politique : Utilisateurs authentifiés peuvent voir les sites actifs
CREATE POLICY "Authenticated users can view active sites"
    ON public.tbl_sites FOR SELECT
    USING (
        auth.uid() IS NOT NULL 
        AND is_active = true
    );

-- Nouvelle politique : RH/Admin peuvent voir tous les sites (actifs et inactifs)
CREATE POLICY "RH/Admin can view all sites"
    ON public.tbl_sites FOR SELECT
    USING (public.is_rh_or_admin(auth.uid()));

-- Nouvelle politique : RH/Admin peuvent gérer tous les sites (utilise la fonction helper)
CREATE POLICY "RH/Admin can manage all sites"
    ON public.tbl_sites FOR ALL
    USING (public.is_rh_or_admin(auth.uid()))
    WITH CHECK (public.is_rh_or_admin(auth.uid()));

-- ============================================================================
-- Fix RLS pour tbl_site_responsables
-- ============================================================================

-- Supprimer les anciennes politiques
DROP POLICY IF EXISTS "Authenticated users can view site responsables" ON public.tbl_site_responsables;
DROP POLICY IF EXISTS "Admins and RH can manage site responsables" ON public.tbl_site_responsables;

-- Nouvelle politique : Utilisateurs authentifiés peuvent voir les responsables
CREATE POLICY "Authenticated users can view site responsables"
    ON public.tbl_site_responsables FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- Nouvelle politique : RH/Admin peuvent gérer les responsables (utilise la fonction helper)
CREATE POLICY "RH/Admin can manage site responsables"
    ON public.tbl_site_responsables FOR ALL
    USING (public.is_rh_or_admin(auth.uid()))
    WITH CHECK (public.is_rh_or_admin(auth.uid()));

