-- Migration 014 : Module 2.2 - Sites & Responsables d'activité
-- Remplace la logique simplifiée par un référentiel structuré

-- ============================================================================
-- 1️⃣ Table tbl_sites : Référentiel unique des sites d'activité
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.tbl_sites (
    site_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_code TEXT NOT NULL UNIQUE,
    site_label TEXT NOT NULL,
    parent_site_id UUID REFERENCES public.tbl_sites(site_id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_sites_parent ON public.tbl_sites(parent_site_id);
CREATE INDEX IF NOT EXISTS idx_sites_active ON public.tbl_sites(is_active);
CREATE INDEX IF NOT EXISTS idx_sites_code ON public.tbl_sites(site_code);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_tbl_sites_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_tbl_sites_updated_at
    BEFORE UPDATE ON public.tbl_sites
    FOR EACH ROW
    EXECUTE FUNCTION update_tbl_sites_updated_at();

-- ============================================================================
-- 2️⃣ Table tbl_site_responsables : Association site-responsable
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.tbl_site_responsables (
    site_id UUID NOT NULL REFERENCES public.tbl_sites(site_id) ON DELETE CASCADE,
    collaborateur_id UUID NOT NULL REFERENCES public.collaborateurs(id) ON DELETE CASCADE,
    role_fonctionnel TEXT NOT NULL DEFAULT 'Responsable d''activité',
    date_debut DATE NOT NULL DEFAULT CURRENT_DATE,
    date_fin DATE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    PRIMARY KEY (site_id, collaborateur_id, role_fonctionnel),
    CONSTRAINT chk_date_fin_after_debut CHECK (date_fin IS NULL OR date_fin >= date_debut)
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_site_responsables_site ON public.tbl_site_responsables(site_id);
CREATE INDEX IF NOT EXISTS idx_site_responsables_collab ON public.tbl_site_responsables(collaborateur_id);
CREATE INDEX IF NOT EXISTS idx_site_responsables_active ON public.tbl_site_responsables(is_active) WHERE is_active = true;

-- Trigger updated_at
CREATE TRIGGER trigger_tbl_site_responsables_updated_at
    BEFORE UPDATE ON public.tbl_site_responsables
    FOR EACH ROW
    EXECUTE FUNCTION update_tbl_sites_updated_at();

-- ============================================================================
-- 3️⃣ Table tbl_collaborateur_sites : Affectations multi-sites
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.tbl_collaborateur_sites (
    collaborateur_id UUID NOT NULL REFERENCES public.collaborateurs(id) ON DELETE CASCADE,
    site_id UUID NOT NULL REFERENCES public.tbl_sites(site_id) ON DELETE CASCADE,
    priorite INTEGER NOT NULL DEFAULT 1,
    date_debut DATE NOT NULL DEFAULT CURRENT_DATE,
    date_fin DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    PRIMARY KEY (collaborateur_id, site_id),
    CONSTRAINT chk_priorite CHECK (priorite >= 1 AND priorite <= 2),
    CONSTRAINT chk_collab_sites_date_fin CHECK (date_fin IS NULL OR date_fin >= date_debut)
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_collab_sites_collab ON public.tbl_collaborateur_sites(collaborateur_id);
CREATE INDEX IF NOT EXISTS idx_collab_sites_site ON public.tbl_collaborateur_sites(site_id);
CREATE INDEX IF NOT EXISTS idx_collab_sites_priorite ON public.tbl_collaborateur_sites(collaborateur_id, priorite);

-- Trigger updated_at
CREATE TRIGGER trigger_tbl_collaborateur_sites_updated_at
    BEFORE UPDATE ON public.tbl_collaborateur_sites
    FOR EACH ROW
    EXECUTE FUNCTION update_tbl_sites_updated_at();

-- ============================================================================
-- 4️⃣ Modification de tbl_collaborateurs
-- ============================================================================

-- Ajouter site_id (FK vers tbl_sites) pour site principal
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'collaborateurs' 
        AND column_name = 'site_id'
    ) THEN
        ALTER TABLE public.collaborateurs 
        ADD COLUMN site_id UUID REFERENCES public.tbl_sites(site_id) ON DELETE SET NULL;
        
        CREATE INDEX IF NOT EXISTS idx_collaborateurs_site_id 
        ON public.collaborateurs(site_id);
    END IF;
END $$;

-- Ajouter responsable_activite_id (FK vers collaborateurs) pour hiérarchie directe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'collaborateurs' 
        AND column_name = 'responsable_activite_id'
    ) THEN
        ALTER TABLE public.collaborateurs 
        ADD COLUMN responsable_activite_id UUID REFERENCES public.collaborateurs(id) ON DELETE SET NULL;
        
        CREATE INDEX IF NOT EXISTS idx_collaborateurs_resp_activite 
        ON public.collaborateurs(responsable_activite_id);
        
        -- Commentaire pour documentation
        COMMENT ON COLUMN public.collaborateurs.responsable_activite_id IS 
        'Responsable d''activité direct (peut être dérivé de tbl_site_responsables mais peut aussi être défini manuellement)';
    END IF;
END $$;

-- Note: On garde temporairement le champ 'site' (texte) pour migration progressive
-- Il sera supprimé dans une migration ultérieure une fois les données migrées

-- ============================================================================
-- 5️⃣ Fonctions utilitaires
-- ============================================================================

-- Fonction pour obtenir le responsable d'activité d'un site
CREATE OR REPLACE FUNCTION get_responsable_activite_site(p_site_id UUID)
RETURNS UUID AS $$
DECLARE
    v_responsable_id UUID;
BEGIN
    SELECT collaborateur_id INTO v_responsable_id
    FROM public.tbl_site_responsables
    WHERE site_id = p_site_id
      AND role_fonctionnel = 'Responsable d''activité'
      AND is_active = true
      AND (date_fin IS NULL OR date_fin >= CURRENT_DATE)
    ORDER BY date_debut DESC
    LIMIT 1;
    
    RETURN v_responsable_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour obtenir le site principal d'un collaborateur
CREATE OR REPLACE FUNCTION get_site_principal_collaborateur(p_collaborateur_id UUID)
RETURNS UUID AS $$
DECLARE
    v_site_id UUID;
BEGIN
    -- D'abord vérifier site_id dans collaborateurs
    SELECT site_id INTO v_site_id
    FROM public.collaborateurs
    WHERE id = p_collaborateur_id;
    
    -- Si pas défini, chercher dans tbl_collaborateur_sites avec priorité 1
    IF v_site_id IS NULL THEN
        SELECT site_id INTO v_site_id
        FROM public.tbl_collaborateur_sites
        WHERE collaborateur_id = p_collaborateur_id
          AND priorite = 1
          AND (date_fin IS NULL OR date_fin >= CURRENT_DATE)
        ORDER BY date_debut DESC
        LIMIT 1;
    END IF;
    
    RETURN v_site_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 6️⃣ Vues utiles
-- ============================================================================

-- Vue pour liste des sites avec leurs responsables actifs
CREATE OR REPLACE VIEW public.v_sites_responsables AS
SELECT 
    s.site_id,
    s.site_code,
    s.site_label,
    s.parent_site_id,
    s.is_active,
    s.created_at,
    COALESCE(
        json_agg(
            json_build_object(
                'collaborateur_id', sr.collaborateur_id,
                'role_fonctionnel', sr.role_fonctionnel,
                'date_debut', sr.date_debut,
                'date_fin', sr.date_fin
            )
        ) FILTER (WHERE sr.is_active = true AND (sr.date_fin IS NULL OR sr.date_fin >= CURRENT_DATE)),
        '[]'::json
    ) as responsables_actifs
FROM public.tbl_sites s
LEFT JOIN public.tbl_site_responsables sr ON s.site_id = sr.site_id
GROUP BY s.site_id, s.site_code, s.site_label, s.parent_site_id, s.is_active, s.created_at;

-- ============================================================================
-- 7️⃣ Row Level Security (RLS)
-- ============================================================================

-- RLS pour tbl_sites
ALTER TABLE public.tbl_sites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active sites"
    ON public.tbl_sites FOR SELECT
    USING (is_active = true);

CREATE POLICY "Admins and RH can manage sites"
    ON public.tbl_sites FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.name IN ('Administrateur', 'RH')
        )
    );

-- RLS pour tbl_site_responsables
ALTER TABLE public.tbl_site_responsables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view site responsables"
    ON public.tbl_site_responsables FOR SELECT
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins and RH can manage site responsables"
    ON public.tbl_site_responsables FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.name IN ('Administrateur', 'RH')
        )
    );

-- RLS pour tbl_collaborateur_sites
ALTER TABLE public.tbl_collaborateur_sites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own site assignments"
    ON public.tbl_collaborateur_sites FOR SELECT
    USING (
        collaborateur_id IN (
            SELECT id FROM public.collaborateurs WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "RH and admins can view all site assignments"
    ON public.tbl_collaborateur_sites FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.name IN ('Administrateur', 'RH')
        )
    );

CREATE POLICY "Admins and RH can manage site assignments"
    ON public.tbl_collaborateur_sites FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.name IN ('Administrateur', 'RH')
        )
    );

-- ============================================================================
-- 8️⃣ Données initiales (exemples)
-- ============================================================================

-- Insérer quelques sites d'exemple (optionnel, à adapter selon besoins)
-- INSERT INTO public.tbl_sites (site_code, site_label, is_active) VALUES
-- ('BEL', 'Bellegarde', true),
-- ('DAM', 'Damparis', true),
-- ('SAV', 'Savoie', true);

-- ============================================================================
-- COMMENTAIRES
-- ============================================================================

COMMENT ON TABLE public.tbl_sites IS 'Référentiel unique des sites d''activité';
COMMENT ON TABLE public.tbl_site_responsables IS 'Association entre sites et responsables d''activité';
COMMENT ON TABLE public.tbl_collaborateur_sites IS 'Affectations multi-sites des collaborateurs';
COMMENT ON COLUMN public.collaborateurs.site_id IS 'Site principal du collaborateur (FK vers tbl_sites)';
COMMENT ON COLUMN public.collaborateurs.responsable_activite_id IS 'Responsable d''activité direct du collaborateur';

