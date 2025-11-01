-- Migration 029 : Module Formations v2.0 - PRD complet
-- Projet : OperaFlow
-- Description : Implémentation complète du système de gestion des formations
-- Date : 2025-01-11

-- ============================================================================
-- 1️⃣ TABLE: tbl_catalogue_formations (Catalogue des formations)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.tbl_catalogue_formations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Informations générales
    nom VARCHAR(255) NOT NULL,
    code_interne VARCHAR(100) UNIQUE, -- Code interne / organisme
    description TEXT,
    
    -- Catégorisation
    categorie VARCHAR(100), -- Sécurité, Technique, Qualité, Managériale, etc.
    type_formation VARCHAR(50) CHECK (type_formation IN ('obligatoire', 'facultative', 'reglementaire')),
    
    -- Durée et périodicité
    duree_heures DECIMAL(6, 2), -- Durée en heures
    duree_jours DECIMAL(4, 1), -- Durée en jours
    periodicite_validite_mois INTEGER, -- Valable X mois/années (en mois)
    
    -- Compétences associées (via table de liaison)
    -- tbl_catalogue_formations_competences
    
    -- Coût et organisme
    cout_unitaire DECIMAL(10, 2), -- Coût unitaire ou forfaitaire
    organisme_formateur VARCHAR(255), -- Organisme formateur / prestataire
    prestataire_id UUID, -- FK vers table prestataires si nécessaire
    
    -- Support de preuve
    support_preuve VARCHAR(100), -- attestation, certificat, etc.
    template_attestation_url TEXT, -- Lien vers template
    
    -- Statut
    is_active BOOLEAN NOT NULL DEFAULT true,
    
    -- Métadonnées
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_catalogue_formations_code ON public.tbl_catalogue_formations(code_interne);
CREATE INDEX idx_catalogue_formations_categorie ON public.tbl_catalogue_formations(categorie);
CREATE INDEX idx_catalogue_formations_type ON public.tbl_catalogue_formations(type_formation);
CREATE INDEX idx_catalogue_formations_active ON public.tbl_catalogue_formations(is_active) WHERE is_active = true;

-- Trigger updated_at
CREATE TRIGGER trigger_update_catalogue_formations_updated_at
    BEFORE UPDATE ON public.tbl_catalogue_formations
    FOR EACH ROW
    EXECUTE FUNCTION update_collaborateurs_updated_at();

-- ============================================================================
-- 2️⃣ TABLE: tbl_catalogue_formations_competences (Liaison Catalogue - Compétences)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.tbl_catalogue_formations_competences (
    catalogue_formation_id UUID NOT NULL REFERENCES public.tbl_catalogue_formations(id) ON DELETE CASCADE,
    competence_id UUID NOT NULL REFERENCES public.competences(id) ON DELETE CASCADE,
    PRIMARY KEY (catalogue_formation_id, competence_id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_catalogue_formations_competences_catalogue ON public.tbl_catalogue_formations_competences(catalogue_formation_id);
CREATE INDEX idx_catalogue_formations_competences_competence ON public.tbl_catalogue_formations_competences(competence_id);

-- ============================================================================
-- 3️⃣ TABLE: tbl_plan_previsionnel_formations (Plan Prévisionnel)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.tbl_plan_previsionnel_formations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Collaborateur concerné
    collaborateur_id UUID NOT NULL REFERENCES public.collaborateurs(id) ON DELETE CASCADE,
    
    -- Formation souhaitée / planifiée
    catalogue_formation_id UUID REFERENCES public.tbl_catalogue_formations(id) ON DELETE SET NULL,
    formation_libelle VARCHAR(255), -- Si formation hors catalogue
    
    -- Période cible
    periode_annee INTEGER NOT NULL, -- Année du plan (ex: 2025)
    periode_mois INTEGER, -- Mois cible (1-12)
    periode_trimestre INTEGER CHECK (periode_trimestre IN (1, 2, 3, 4)), -- Trimestre cible
    date_cible DATE, -- Date précise si disponible
    
    -- Statut de validation
    statut_validation VARCHAR(50) DEFAULT 'en_attente' CHECK (statut_validation IN ('en_attente', 'valide', 'refusé', 'archive')),
    
    -- Budget et priorité
    budget_estime DECIMAL(10, 2),
    priorite VARCHAR(20) CHECK (priorite IN ('haute', 'moyenne', 'basse')),
    
    -- Commentaires
    commentaire_rh TEXT,
    commentaire_demandeur TEXT,
    
    -- Demandeur (qui a demandé la formation)
    demandeur_id UUID REFERENCES auth.users(id),
    date_demande TIMESTAMPTZ DEFAULT NOW(),
    
    -- Validation
    valide_par UUID REFERENCES auth.users(id),
    date_validation TIMESTAMPTZ,
    motif_refus TEXT,
    
    -- Passage au plan réel
    convertie_en_formation_id UUID REFERENCES public.formations(id) ON DELETE SET NULL,
    date_conversion TIMESTAMPTZ,
    
    -- Métadonnées
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_plan_previsionnel_collaborateur ON public.tbl_plan_previsionnel_formations(collaborateur_id);
CREATE INDEX idx_plan_previsionnel_catalogue ON public.tbl_plan_previsionnel_formations(catalogue_formation_id);
CREATE INDEX idx_plan_previsionnel_annee ON public.tbl_plan_previsionnel_formations(periode_annee);
CREATE INDEX idx_plan_previsionnel_statut ON public.tbl_plan_previsionnel_formations(statut_validation);
CREATE INDEX idx_plan_previsionnel_convertie ON public.tbl_plan_previsionnel_formations(convertie_en_formation_id) WHERE convertie_en_formation_id IS NOT NULL;

-- Trigger updated_at
CREATE TRIGGER trigger_update_plan_previsionnel_updated_at
    BEFORE UPDATE ON public.tbl_plan_previsionnel_formations
    FOR EACH ROW
    EXECUTE FUNCTION update_collaborateurs_updated_at();

-- ============================================================================
-- 4️⃣ MISE À JOUR: Table formations (Plan réel)
-- ============================================================================
-- Ajouter les champs manquants à la table formations existante
DO $$ 
BEGIN
    -- Lien vers le catalogue
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'formations' 
        AND column_name = 'catalogue_formation_id'
    ) THEN
        ALTER TABLE public.formations 
        ADD COLUMN catalogue_formation_id UUID REFERENCES public.tbl_catalogue_formations(id) ON DELETE SET NULL;
        
        CREATE INDEX idx_formations_catalogue ON public.formations(catalogue_formation_id);
    END IF;
    
    -- Lien vers le plan prévisionnel
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'formations' 
        AND column_name = 'plan_previsionnel_id'
    ) THEN
        ALTER TABLE public.formations 
        ADD COLUMN plan_previsionnel_id UUID REFERENCES public.tbl_plan_previsionnel_formations(id) ON DELETE SET NULL;
        
        CREATE INDEX idx_formations_plan_previsionnel ON public.formations(plan_previsionnel_id);
    END IF;
    
    -- Budget
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'formations' 
        AND column_name = 'cout_reel'
    ) THEN
        ALTER TABLE public.formations 
        ADD COLUMN cout_reel DECIMAL(10, 2);
    END IF;
    
    -- Date d'échéance de validité
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'formations' 
        AND column_name = 'date_echeance_validite'
    ) THEN
        ALTER TABLE public.formations 
        ADD COLUMN date_echeance_validite DATE;
        
        CREATE INDEX idx_formations_echeance_validite ON public.formations(date_echeance_validite);
    END IF;
    
    -- Statuts supplémentaires
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'formations' 
        AND column_name = 'statut'
    ) THEN
        -- Mettre à jour la contrainte CHECK pour inclure les nouveaux statuts
        ALTER TABLE public.formations DROP CONSTRAINT IF EXISTS formations_statut_check;
        ALTER TABLE public.formations 
        ADD CONSTRAINT formations_statut_check 
        CHECK (statut IN ('planifiee', 'en_cours', 'terminee', 'abandonnee', 'echec', 'reportee', 'annulee'));
    END IF;
    
    -- Priorité
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'formations' 
        AND column_name = 'priorite'
    ) THEN
        ALTER TABLE public.formations 
        ADD COLUMN priorite VARCHAR(20) CHECK (priorite IN ('haute', 'moyenne', 'basse'));
    END IF;
    
    -- Période de validité en mois (depuis le catalogue)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'formations' 
        AND column_name = 'validite_mois'
    ) THEN
        ALTER TABLE public.formations 
        ADD COLUMN validite_mois INTEGER;
    END IF;
END $$;

-- ============================================================================
-- 5️⃣ FONCTIONS UTILITAIRES
-- ============================================================================

-- Fonction pour calculer automatiquement la date d'échéance de validité
CREATE OR REPLACE FUNCTION calculate_formation_echeance_validite()
RETURNS TRIGGER AS $$
DECLARE
    v_validite_mois INTEGER;
BEGIN
    -- Récupérer la validité depuis le catalogue si disponible
    IF NEW.catalogue_formation_id IS NOT NULL THEN
        SELECT periodicite_validite_mois INTO v_validite_mois
        FROM public.tbl_catalogue_formations
        WHERE id = NEW.catalogue_formation_id;
        
        IF v_validite_mois IS NOT NULL AND NEW.date_fin IS NOT NULL THEN
            NEW.date_echeance_validite := (NEW.date_fin + (v_validite_mois || ' months')::INTERVAL)::DATE;
            NEW.validite_mois := v_validite_mois;
        END IF;
    ELSIF NEW.validite_mois IS NOT NULL AND NEW.date_fin IS NOT NULL THEN
        -- Utiliser validite_mois si défini directement
        NEW.date_echeance_validite := (NEW.date_fin + (NEW.validite_mois || ' months')::INTERVAL)::DATE;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour calculer automatiquement l'échéance
DROP TRIGGER IF EXISTS trigger_calculate_formation_echeance ON public.formations;
CREATE TRIGGER trigger_calculate_formation_echeance
    BEFORE INSERT OR UPDATE ON public.formations
    FOR EACH ROW
    WHEN (NEW.date_fin IS NOT NULL)
    EXECUTE FUNCTION calculate_formation_echeance_validite();

-- Fonction pour mettre à jour les compétences après validation d'une formation
CREATE OR REPLACE FUNCTION update_competences_from_formation()
RETURNS TRIGGER AS $$
BEGIN
    -- Seulement si la formation est terminée et réussie
    IF NEW.statut = 'terminee' AND (NEW.resultat = 'reussi' OR NEW.resultat IS NULL) THEN
        -- Mettre à jour les compétences associées au catalogue
        IF NEW.catalogue_formation_id IS NOT NULL THEN
            INSERT INTO public.collaborateurs_competences (collaborateur_id, competence_id, date_obtention)
            SELECT 
                NEW.collaborateur_id,
                cfc.competence_id,
                NEW.date_fin
            FROM public.tbl_catalogue_formations_competences cfc
            WHERE cfc.catalogue_formation_id = NEW.catalogue_formation_id
            AND NOT EXISTS (
                SELECT 1 FROM public.collaborateurs_competences cc
                WHERE cc.collaborateur_id = NEW.collaborateur_id
                AND cc.competence_id = cfc.competence_id
                AND cc.date_obtention >= NEW.date_fin
            )
            ON CONFLICT (collaborateur_id, competence_id) 
            DO UPDATE SET 
                date_obtention = NEW.date_fin,
                updated_at = NOW();
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour mettre à jour les compétences
DROP TRIGGER IF EXISTS trigger_update_competences_from_formation ON public.formations;
CREATE TRIGGER trigger_update_competences_from_formation
    AFTER UPDATE OF statut, resultat ON public.formations
    FOR EACH ROW
    WHEN (NEW.statut = 'terminee')
    EXECUTE FUNCTION update_competences_from_formation();

-- ============================================================================
-- 6️⃣ VUES UTILES
-- ============================================================================

-- Vue pour les alertes d'échéance de formations
CREATE OR REPLACE VIEW public.v_alertes_formations AS
SELECT 
    f.id,
    f.collaborateur_id,
    c.nom AS collaborateur_nom,
    c.prenom AS collaborateur_prenom,
    c.email AS collaborateur_email,
    f.libelle AS formation_libelle,
    cf.nom AS catalogue_formation_nom,
    f.date_echeance_validite,
    f.statut,
    CASE 
        WHEN f.date_echeance_validite IS NULL THEN NULL
        WHEN f.date_echeance_validite < CURRENT_DATE THEN 'expiree'
        WHEN f.date_echeance_validite <= CURRENT_DATE + INTERVAL '30 days' THEN 'echeance_imminente'
        WHEN f.date_echeance_validite <= CURRENT_DATE + INTERVAL '90 days' THEN 'echeance_proche'
        ELSE 'a_jour'
    END AS statut_alerte,
    CASE 
        WHEN f.date_echeance_validite IS NULL THEN NULL
        ELSE (f.date_echeance_validite - CURRENT_DATE)::INTEGER
    END AS jours_restants
FROM public.formations f
JOIN public.collaborateurs c ON f.collaborateur_id = c.id
LEFT JOIN public.tbl_catalogue_formations cf ON f.catalogue_formation_id = cf.id
WHERE f.statut = 'terminee'
    AND f.date_echeance_validite IS NOT NULL
    AND (
        f.date_echeance_validite < CURRENT_DATE 
        OR f.date_echeance_validite <= CURRENT_DATE + INTERVAL '90 days'
    )
ORDER BY f.date_echeance_validite ASC;

-- ============================================================================
-- 7️⃣ ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- RLS pour tbl_catalogue_formations
ALTER TABLE public.tbl_catalogue_formations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tous les utilisateurs authentifiés peuvent voir le catalogue actif"
    ON public.tbl_catalogue_formations FOR SELECT
    USING (auth.uid() IS NOT NULL AND is_active = true);

CREATE POLICY "RH et Admin peuvent gérer le catalogue"
    ON public.tbl_catalogue_formations FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.name IN ('Administrateur', 'Administratif RH', 'RH')
        )
    );

-- RLS pour tbl_plan_previsionnel_formations
ALTER TABLE public.tbl_plan_previsionnel_formations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Les utilisateurs peuvent voir leur plan prévisionnel"
    ON public.tbl_plan_previsionnel_formations FOR SELECT
    USING (
        auth.uid() IS NOT NULL AND (
            -- Voir ses propres demandes
            demandeur_id = auth.uid()
            OR collaborateur_id IN (
                SELECT id FROM public.collaborateurs WHERE user_id = auth.uid()
            )
            -- Ou si RH/Admin
            OR EXISTS (
                SELECT 1 FROM public.user_roles ur
                JOIN public.roles r ON ur.role_id = r.id
                WHERE ur.user_id = auth.uid()
                AND r.name IN ('Administrateur', 'Administratif RH', 'RH')
            )
        )
    );

CREATE POLICY "Les utilisateurs peuvent créer leur plan prévisionnel"
    ON public.tbl_plan_previsionnel_formations FOR INSERT
    WITH CHECK (
        auth.uid() IS NOT NULL AND (
            -- Créer pour soi-même
            collaborateur_id IN (
                SELECT id FROM public.collaborateurs WHERE user_id = auth.uid()
            )
            -- Ou si RH/Admin/Conducteur
            OR EXISTS (
                SELECT 1 FROM public.user_roles ur
                JOIN public.roles r ON ur.role_id = r.id
                WHERE ur.user_id = auth.uid()
                AND r.name IN ('Administrateur', 'Administratif RH', 'RH', 'Conducteur de travaux', 'Chef de chantier')
            )
        )
    );

CREATE POLICY "RH et Admin peuvent modifier le plan prévisionnel"
    ON public.tbl_plan_previsionnel_formations FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.name IN ('Administrateur', 'Administratif RH', 'RH')
        )
    );

-- RLS pour tbl_catalogue_formations_competences (hérite du catalogue)
ALTER TABLE public.tbl_catalogue_formations_competences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Mêmes règles que le catalogue"
    ON public.tbl_catalogue_formations_competences FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.tbl_catalogue_formations cf
            WHERE cf.id = catalogue_formation_id
        )
    );

-- ============================================================================
-- 8️⃣ COMMENTAIRES
-- ============================================================================

COMMENT ON TABLE public.tbl_catalogue_formations IS 'Catalogue référentiel de toutes les formations disponibles';
COMMENT ON TABLE public.tbl_plan_previsionnel_formations IS 'Plan prévisionnel des formations pour l''année N+1 (souhaits et besoins anticipés)';
COMMENT ON COLUMN public.formations.catalogue_formation_id IS 'Lien vers le catalogue de formations';
COMMENT ON COLUMN public.formations.plan_previsionnel_id IS 'Lien vers le plan prévisionnel (si la formation en provient)';
COMMENT ON COLUMN public.formations.date_echeance_validite IS 'Date d''échéance de validité (calculée automatiquement selon la périodicité)';
COMMENT ON COLUMN public.formations.cout_reel IS 'Coût réel de la formation (vs budget estimé)';

