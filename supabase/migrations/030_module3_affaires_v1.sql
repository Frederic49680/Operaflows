-- Migration 030 : Module 3 Affaires v1.0
-- Projet : OperaFlow
-- Description : Implémentation complète du système de gestion des affaires
-- Date : 2025-01-11

-- ============================================================================
-- 1️⃣ TABLE: tbl_affaires (Affaires principales)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.tbl_affaires (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identification
    numero VARCHAR(50) NOT NULL UNIQUE,
    libelle VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Client et gestion
    client VARCHAR(255),
    client_code VARCHAR(100), -- Code client interne si référentiel
    charge_affaires_id UUID REFERENCES public.collaborateurs(id) ON DELETE SET NULL,
    
    -- Site et localisation
    site_id UUID REFERENCES public.tbl_sites(site_id) ON DELETE SET NULL,
    
    -- Périodes
    date_debut DATE,
    date_fin DATE,
    date_cloture DATE,
    
    -- Valorisation globale
    montant_total DECIMAL(15, 2), -- Montant total de l'affaire
    type_valorisation VARCHAR(50) CHECK (type_valorisation IN ('BPU', 'forfait', 'dépense', 'mixte')),
    
    -- Statut et cycle de vie
    statut VARCHAR(50) NOT NULL DEFAULT 'cree' CHECK (statut IN ('cree', 'pre_planifie', 'planifie', 'en_cours', 'suspendu', 'en_cloture', 'termine', 'archive')),
    
    -- Priorité
    priorite VARCHAR(20) CHECK (priorite IN ('basse', 'moyenne', 'haute', 'critique')),
    
    -- Pré-planification
    date_pre_planif DATE, -- Date de pré-planification réalisée
    pre_planifie_par UUID REFERENCES auth.users(id), -- Qui a fait la pré-planif
    
    -- Métadonnées
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    
    CONSTRAINT chk_dates_affaire CHECK (date_fin IS NULL OR date_debut IS NULL OR date_fin >= date_debut)
);

CREATE INDEX IF NOT EXISTS idx_affaires_numero ON public.tbl_affaires(numero);
CREATE INDEX IF NOT EXISTS idx_affaires_statut ON public.tbl_affaires(statut);
CREATE INDEX IF NOT EXISTS idx_affaires_site_id ON public.tbl_affaires(site_id);
CREATE INDEX IF NOT EXISTS idx_affaires_charge_affaires ON public.tbl_affaires(charge_affaires_id);
CREATE INDEX IF NOT EXISTS idx_affaires_client ON public.tbl_affaires(client);
CREATE INDEX IF NOT EXISTS idx_affaires_dates ON public.tbl_affaires(date_debut, date_fin);

-- Trigger updated_at
DROP TRIGGER IF EXISTS trigger_update_affaires_updated_at ON public.tbl_affaires;
CREATE TRIGGER trigger_update_affaires_updated_at
    BEFORE UPDATE ON public.tbl_affaires
    FOR EACH ROW
    EXECUTE FUNCTION update_collaborateurs_updated_at();

-- ============================================================================
-- 2️⃣ TABLE: tbl_affaires_bpu (BPU - Bordereau de Prix Unitaires)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.tbl_affaires_bpu (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    affaire_id UUID NOT NULL REFERENCES public.tbl_affaires(id) ON DELETE CASCADE,
    
    -- Ligne BPU
    code_bpu VARCHAR(100), -- Code référence (ex: "TR001")
    libelle_bpu VARCHAR(255) NOT NULL,
    description TEXT,
    unite VARCHAR(50), -- Unité de mesure (h, j, m², m, etc.)
    
    -- Quantités et prix
    quantite_prevue DECIMAL(12, 3) NOT NULL DEFAULT 0,
    quantite_reelle DECIMAL(12, 3), -- Renseignée au fur et à mesure
    prix_unitaire_ht DECIMAL(12, 2) NOT NULL DEFAULT 0,
    
    -- Totaux calculés
    montant_total_ht DECIMAL(15, 2) GENERATED ALWAYS AS (quantite_prevue * prix_unitaire_ht) STORED,
    
    -- Métadonnées
    ordre_affichage INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_bpu_affaire_id ON public.tbl_affaires_bpu(affaire_id);
CREATE INDEX IF NOT EXISTS idx_bpu_code ON public.tbl_affaires_bpu(code_bpu);

-- Trigger updated_at
DROP TRIGGER IF EXISTS trigger_update_bpu_updated_at ON public.tbl_affaires_bpu;
CREATE TRIGGER trigger_update_bpu_updated_at
    BEFORE UPDATE ON public.tbl_affaires_bpu
    FOR EACH ROW
    EXECUTE FUNCTION update_collaborateurs_updated_at();

-- ============================================================================
-- 3️⃣ TABLE: tbl_affaires_depenses (Dépenses / Coûts)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.tbl_affaires_depenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    affaire_id UUID NOT NULL REFERENCES public.tbl_affaires(id) ON DELETE CASCADE,
    
    -- Catégorie de dépense
    categorie VARCHAR(100), -- Ex: 'Matériel', 'Prestation', 'Transport', 'Autre'
    libelle VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Montant et facturation
    montant_ht DECIMAL(12, 2) NOT NULL DEFAULT 0,
    taux_tva DECIMAL(5, 2) DEFAULT 20.00,
    montant_ttc DECIMAL(12, 2) GENERATED ALWAYS AS (montant_ht * (1 + taux_tva / 100)) STORED,
    
    -- Dates
    date_depense DATE NOT NULL,
    date_facturation DATE,
    numero_facture VARCHAR(100),
    
    -- Fournisseur
    fournisseur VARCHAR(255),
    fournisseur_id UUID, -- FK vers table prestataires si module existe
    
    -- Métadonnées
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_depenses_affaire_id ON public.tbl_affaires_depenses(affaire_id);
CREATE INDEX IF NOT EXISTS idx_depenses_date ON public.tbl_affaires_depenses(date_depense);
CREATE INDEX IF NOT EXISTS idx_depenses_categorie ON public.tbl_affaires_depenses(categorie);

-- Trigger updated_at
DROP TRIGGER IF EXISTS trigger_update_depenses_updated_at ON public.tbl_affaires_depenses;
CREATE TRIGGER trigger_update_depenses_updated_at
    BEFORE UPDATE ON public.tbl_affaires_depenses
    FOR EACH ROW
    EXECUTE FUNCTION update_collaborateurs_updated_at();

-- ============================================================================
-- 4️⃣ TABLE: tbl_affaires_pre_planif (Rapport pré-planification)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.tbl_affaires_pre_planif (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    affaire_id UUID NOT NULL REFERENCES public.tbl_affaires(id) ON DELETE CASCADE,
    
    -- Analyse des besoins
    besoins_competences JSONB, -- { competence_id: string, niveau: string, quantite: number }
    besoins_habilitations JSONB, -- Liste des habilitations requises
    ressources_estimees JSONB, -- { collaborateur_id: string, jours: number, heures: number }
    
    -- Charge estimée
    total_jours_homme DECIMAL(8, 2),
    total_heures DECIMAL(10, 2),
    charge_par_competence JSONB, -- Répartition par compétence
    
    -- Contraintes
    contraintes_calendrier TEXT, -- Dates bloquantes, disponibilités
    contraintes_techniques TEXT, -- Contraintes matérielles, environnementales
    contraintes_rh TEXT, -- Absences prévues, formations, habilitations
    
    -- Risques identifiés
    risques TEXT,
    
    -- Commentaires
    commentaire TEXT,
    
    -- Validation
    valide_par UUID REFERENCES auth.users(id),
    date_validation TIMESTAMPTZ,
    
    -- Métadonnées
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_pre_planif_affaire_id ON public.tbl_affaires_pre_planif(affaire_id);

-- Trigger updated_at
DROP TRIGGER IF EXISTS trigger_update_pre_planif_updated_at ON public.tbl_affaires_pre_planif;
CREATE TRIGGER trigger_update_pre_planif_updated_at
    BEFORE UPDATE ON public.tbl_affaires_pre_planif
    FOR EACH ROW
    EXECUTE FUNCTION update_collaborateurs_updated_at();

-- ============================================================================
-- 5️⃣ TABLE: tbl_affaires_lots (Découpage financier par lot / jalon)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.tbl_affaires_lots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    affaire_id UUID NOT NULL REFERENCES public.tbl_affaires(id) ON DELETE CASCADE,
    
    -- Identification du lot
    numero_lot VARCHAR(50) NOT NULL, -- Ex: "Lot 1", "Lot A", "Jalon 1"
    libelle_lot VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Découpage financier
    pourcentage_total DECIMAL(5, 2) NOT NULL CHECK (pourcentage_total > 0 AND pourcentage_total <= 100),
    montant_alloue DECIMAL(15, 2), -- Montant calculé automatiquement selon le pourcentage
    
    -- Jalon pour Gantt
    est_jalon_gantt BOOLEAN DEFAULT true, -- Indique si ce lot sert de jalon pour le Gantt
    
    -- Dates (optionnelles pour le lot)
    date_debut_previsionnelle DATE,
    date_fin_previsionnelle DATE,
    
    -- Ordre d'affichage
    ordre_affichage INTEGER,
    
    -- Métadonnées
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    
    -- Contrainte: le total des pourcentages ne doit pas dépasser 100%
    CONSTRAINT chk_dates_lot CHECK (date_fin_previsionnelle IS NULL OR date_debut_previsionnelle IS NULL OR date_fin_previsionnelle >= date_debut_previsionnelle)
);

CREATE INDEX IF NOT EXISTS idx_lots_affaire_id ON public.tbl_affaires_lots(affaire_id);
CREATE INDEX IF NOT EXISTS idx_lots_jalon ON public.tbl_affaires_lots(affaire_id, est_jalon_gantt) WHERE est_jalon_gantt = true;

-- Trigger updated_at
DROP TRIGGER IF EXISTS trigger_update_lots_updated_at ON public.tbl_affaires_lots;
CREATE TRIGGER trigger_update_lots_updated_at
    BEFORE UPDATE ON public.tbl_affaires_lots
    FOR EACH ROW
    EXECUTE FUNCTION update_collaborateurs_updated_at();

-- Fonction pour calculer automatiquement le montant alloué au lot
CREATE OR REPLACE FUNCTION calculate_lot_montant_alloue()
RETURNS TRIGGER AS $$
DECLARE
    v_montant_total DECIMAL(15, 2);
BEGIN
    -- Récupérer le montant total de l'affaire
    SELECT montant_total INTO v_montant_total
    FROM public.tbl_affaires
    WHERE id = NEW.affaire_id;
    
    -- Calculer le montant alloué selon le pourcentage
    IF v_montant_total IS NOT NULL THEN
        NEW.montant_alloue := v_montant_total * (NEW.pourcentage_total / 100);
    ELSE
        NEW.montant_alloue := NULL;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour calculer automatiquement le montant alloué
DROP TRIGGER IF EXISTS trigger_calculate_lot_montant ON public.tbl_affaires_lots;
CREATE TRIGGER trigger_calculate_lot_montant
    BEFORE INSERT OR UPDATE ON public.tbl_affaires_lots
    FOR EACH ROW
    EXECUTE FUNCTION calculate_lot_montant_alloue();

-- Fonction pour vérifier que la somme des pourcentages ne dépasse pas 100%
CREATE OR REPLACE FUNCTION check_lots_percentage_total()
RETURNS TRIGGER AS $$
DECLARE
    v_total_percentage DECIMAL(5, 2);
    v_affaire_id UUID;
BEGIN
    -- Déterminer l'ID de l'affaire concernée
    IF TG_OP = 'DELETE' THEN
        v_affaire_id := OLD.affaire_id;
    ELSE
        v_affaire_id := NEW.affaire_id;
    END IF;
    
    -- Calculer le total des pourcentages pour cette affaire
    SELECT COALESCE(SUM(pourcentage_total), 0) INTO v_total_percentage
    FROM public.tbl_affaires_lots
    WHERE affaire_id = v_affaire_id;
    
    -- Si on est en INSERT ou UPDATE, ajouter le nouveau pourcentage
    IF TG_OP IN ('INSERT', 'UPDATE') THEN
        IF TG_OP = 'UPDATE' THEN
            -- En UPDATE, retirer l'ancien pourcentage
            v_total_percentage := v_total_percentage - COALESCE(OLD.pourcentage_total, 0);
        END IF;
        v_total_percentage := v_total_percentage + NEW.pourcentage_total;
    END IF;
    
    -- Vérifier que le total ne dépasse pas 100%
    IF v_total_percentage > 100 THEN
        RAISE EXCEPTION 'Le total des pourcentages des lots ne peut pas dépasser 100%%. Total actuel: %%%', v_total_percentage;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour vérifier la somme des pourcentages
DROP TRIGGER IF EXISTS trigger_check_lots_percentage ON public.tbl_affaires_lots;
CREATE TRIGGER trigger_check_lots_percentage
    BEFORE INSERT OR UPDATE OR DELETE ON public.tbl_affaires_lots
    FOR EACH ROW
    EXECUTE FUNCTION check_lots_percentage_total();

-- Trigger pour recalculer les montants alloués quand le montant total de l'affaire change
CREATE OR REPLACE FUNCTION recalculate_lots_montants()
RETURNS TRIGGER AS $$
BEGIN
    -- Recalculer tous les montants alloués des lots de cette affaire
    UPDATE public.tbl_affaires_lots
    SET montant_alloue = NEW.montant_total * (pourcentage_total / 100),
        updated_at = NOW()
    WHERE affaire_id = NEW.id AND NEW.montant_total IS NOT NULL;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_recalculate_lots_on_affaire_montant_change ON public.tbl_affaires;
CREATE TRIGGER trigger_recalculate_lots_on_affaire_montant_change
    AFTER UPDATE OF montant_total ON public.tbl_affaires
    FOR EACH ROW
    WHEN (OLD.montant_total IS DISTINCT FROM NEW.montant_total)
    EXECUTE FUNCTION recalculate_lots_montants();

-- ============================================================================
-- 6️⃣ TABLE: tbl_affaires_documents (Documents liés aux affaires)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.tbl_affaires_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    affaire_id UUID NOT NULL REFERENCES public.tbl_affaires(id) ON DELETE CASCADE,
    
    -- Document
    nom_fichier VARCHAR(255) NOT NULL,
    type_document VARCHAR(100), -- Ex: 'devis', 'facture', 'rapport', 'photo', 'autre'
    url_storage TEXT, -- Lien vers Supabase Storage
    taille_octets BIGINT,
    
    -- Métadonnées
    description TEXT,
    uploaded_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documents_affaire_id ON public.tbl_affaires_documents(affaire_id);
CREATE INDEX IF NOT EXISTS idx_documents_type ON public.tbl_affaires_documents(type_document);

-- ============================================================================
-- 7️⃣ FONCTIONS UTILITAIRES
-- ============================================================================

-- Fonction pour calculer le montant total d'une affaire
CREATE OR REPLACE FUNCTION calculate_affaire_montant_total(affaire_uuid UUID)
RETURNS DECIMAL(15, 2) AS $$
DECLARE
    v_total DECIMAL(15, 2) := 0;
    v_type_valorisation VARCHAR(50);
BEGIN
    -- Récupérer le type de valorisation
    SELECT type_valorisation INTO v_type_valorisation
    FROM public.tbl_affaires
    WHERE id = affaire_uuid;
    
    -- Calcul selon le type
    IF v_type_valorisation = 'BPU' THEN
        -- Somme des lignes BPU
        SELECT COALESCE(SUM(montant_total_ht), 0) INTO v_total
        FROM public.tbl_affaires_bpu
        WHERE affaire_id = affaire_uuid;
    ELSIF v_type_valorisation = 'forfait' THEN
        -- Montant forfaitaire (déjà dans montant_total)
        SELECT COALESCE(montant_total, 0) INTO v_total
        FROM public.tbl_affaires
        WHERE id = affaire_uuid;
    ELSIF v_type_valorisation = 'dépense' THEN
        -- Somme des dépenses
        SELECT COALESCE(SUM(montant_ht), 0) INTO v_total
        FROM public.tbl_affaires_depenses
        WHERE affaire_id = affaire_uuid;
    ELSIF v_type_valorisation = 'mixte' THEN
        -- BPU + dépenses
        SELECT 
            COALESCE(SUM(bpu.montant_total_ht), 0) + 
            COALESCE(SUM(dep.montant_ht), 0)
        INTO v_total
        FROM public.tbl_affaires aff
        LEFT JOIN public.tbl_affaires_bpu bpu ON bpu.affaire_id = aff.id
        LEFT JOIN public.tbl_affaires_depenses dep ON dep.affaire_id = aff.id
        WHERE aff.id = affaire_uuid;
    END IF;
    
    RETURN COALESCE(v_total, 0);
END;
$$ LANGUAGE plpgsql;

-- Fonction pour mettre à jour automatiquement le montant total
CREATE OR REPLACE FUNCTION update_affaire_montant_total()
RETURNS TRIGGER AS $$
BEGIN
    -- Mettre à jour le montant total de l'affaire
    UPDATE public.tbl_affaires
    SET montant_total = calculate_affaire_montant_total(NEW.affaire_id)
    WHERE id = NEW.affaire_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers pour mettre à jour automatiquement le montant total
DROP TRIGGER IF EXISTS trigger_update_montant_on_bpu_change ON public.tbl_affaires_bpu;
CREATE TRIGGER trigger_update_montant_on_bpu_change
    AFTER INSERT OR UPDATE OR DELETE ON public.tbl_affaires_bpu
    FOR EACH ROW
    EXECUTE FUNCTION update_affaire_montant_total();

DROP TRIGGER IF EXISTS trigger_update_montant_on_depense_change ON public.tbl_affaires_depenses;
CREATE TRIGGER trigger_update_montant_on_depense_change
    AFTER INSERT OR UPDATE OR DELETE ON public.tbl_affaires_depenses
    FOR EACH ROW
    EXECUTE FUNCTION update_affaire_montant_total();

-- ============================================================================
-- 8️⃣ VUES UTILES
-- ============================================================================

-- Vue pour le tableau de bord des affaires
CREATE OR REPLACE VIEW public.v_affaires_dashboard AS
SELECT 
    a.id,
    a.numero,
    a.libelle,
    a.client,
    a.statut,
    a.priorite,
    a.date_debut,
    a.date_fin,
    a.montant_total,
    a.type_valorisation,
    a.site_id,
    s.site_label,
    s.site_code,
    c.nom AS charge_affaires_nom,
    c.prenom AS charge_affaires_prenom,
    (a.date_fin - CURRENT_DATE) AS jours_restants,
    CASE 
        WHEN a.date_fin IS NULL THEN NULL
        WHEN a.date_fin < CURRENT_DATE AND a.statut NOT IN ('termine', 'archive') THEN 'en_retard'
        WHEN (a.date_fin - CURRENT_DATE) <= 7 THEN 'echeance_proche'
        ELSE 'a_jour'
    END AS statut_echeance,
    -- Statistiques BPU
    (SELECT COUNT(*) FROM public.tbl_affaires_bpu WHERE affaire_id = a.id) AS nb_lignes_bpu,
    (SELECT COALESCE(SUM(quantite_prevue), 0) FROM public.tbl_affaires_bpu WHERE affaire_id = a.id) AS total_quantites_bpu,
    -- Statistiques dépenses
    (SELECT COUNT(*) FROM public.tbl_affaires_depenses WHERE affaire_id = a.id) AS nb_depenses,
    (SELECT COALESCE(SUM(montant_ht), 0) FROM public.tbl_affaires_depenses WHERE affaire_id = a.id) AS total_depenses
FROM public.tbl_affaires a
LEFT JOIN public.tbl_sites s ON s.site_id = a.site_id
LEFT JOIN public.collaborateurs c ON c.id = a.charge_affaires_id;

-- ============================================================================
-- 9️⃣ ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- RLS pour tbl_affaires
ALTER TABLE public.tbl_affaires ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tous les utilisateurs authentifiés peuvent voir les affaires" ON public.tbl_affaires;
CREATE POLICY "Tous les utilisateurs authentifiés peuvent voir les affaires"
    ON public.tbl_affaires FOR SELECT
    USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Chargé d'affaires et RH/Admin peuvent créer des affaires" ON public.tbl_affaires;
CREATE POLICY "Chargé d'affaires et RH/Admin peuvent créer des affaires"
    ON public.tbl_affaires FOR INSERT
    WITH CHECK (
        auth.uid() IS NOT NULL AND (
            EXISTS (
                SELECT 1 FROM public.user_roles ur
                JOIN public.roles r ON ur.role_id = r.id
                WHERE ur.user_id = auth.uid()
                AND r.name IN ('Administrateur', 'Administratif RH', 'RH', 'Chargé d''Affaires', 'Responsable d''Activité')
            )
        )
    );

DROP POLICY IF EXISTS "Chargé d'affaires et RH/Admin peuvent modifier les affaires" ON public.tbl_affaires;
CREATE POLICY "Chargé d'affaires et RH/Admin peuvent modifier les affaires"
    ON public.tbl_affaires FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.name IN ('Administrateur', 'Administratif RH', 'RH', 'Chargé d''Affaires', 'Responsable d''Activité')
        )
    );

-- RLS pour tbl_affaires_bpu
ALTER TABLE public.tbl_affaires_bpu ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Même règles que les affaires parentes" ON public.tbl_affaires_bpu;
CREATE POLICY "Même règles que les affaires parentes"
    ON public.tbl_affaires_bpu FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.tbl_affaires a
            WHERE a.id = affaire_id
        )
    );

-- RLS pour tbl_affaires_depenses
ALTER TABLE public.tbl_affaires_depenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Même règles que les affaires parentes pour dépenses" ON public.tbl_affaires_depenses;
CREATE POLICY "Même règles que les affaires parentes pour dépenses"
    ON public.tbl_affaires_depenses FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.tbl_affaires a
            WHERE a.id = affaire_id
        )
    );

-- RLS pour tbl_affaires_pre_planif
ALTER TABLE public.tbl_affaires_pre_planif ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Même règles que les affaires parentes pour pré-planif" ON public.tbl_affaires_pre_planif;
CREATE POLICY "Même règles que les affaires parentes pour pré-planif"
    ON public.tbl_affaires_pre_planif FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.tbl_affaires a
            WHERE a.id = affaire_id
        )
    );

-- RLS pour tbl_affaires_lots
ALTER TABLE public.tbl_affaires_lots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Même règles que les affaires parentes pour lots" ON public.tbl_affaires_lots;
CREATE POLICY "Même règles que les affaires parentes pour lots"
    ON public.tbl_affaires_lots FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.tbl_affaires a
            WHERE a.id = affaire_id
        )
    );

-- RLS pour tbl_affaires_documents
ALTER TABLE public.tbl_affaires_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Même règles que les affaires parentes pour documents" ON public.tbl_affaires_documents;
CREATE POLICY "Même règles que les affaires parentes pour documents"
    ON public.tbl_affaires_documents FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.tbl_affaires a
            WHERE a.id = affaire_id
        )
    );

-- ============================================================================
-- 🔟 COMMENTAIRES
-- ============================================================================

COMMENT ON TABLE public.tbl_affaires IS 'Gestion des affaires et projets';
COMMENT ON TABLE public.tbl_affaires_bpu IS 'Bordereau de Prix Unitaires par affaire';
COMMENT ON TABLE public.tbl_affaires_depenses IS 'Dépenses et coûts associés aux affaires';
COMMENT ON TABLE public.tbl_affaires_pre_planif IS 'Rapport de pré-planification pour analyse des besoins';
COMMENT ON TABLE public.tbl_affaires_lots IS 'Découpage financier par lot / jalon pour le Gantt';
COMMENT ON TABLE public.tbl_affaires_documents IS 'Documents liés aux affaires (devis, factures, rapports)';
COMMENT ON COLUMN public.tbl_affaires.type_valorisation IS 'Type de valorisation: BPU (Bordereau Prix Unitaires), forfait, dépense, ou mixte';
COMMENT ON COLUMN public.tbl_affaires.statut IS 'Cycle de vie de l''affaire: cree → pre_planifie → planifie → en_cours → suspendu → en_cloture → termine → archive';
COMMENT ON COLUMN public.tbl_affaires_lots.pourcentage_total IS 'Pourcentage du montant total de l''affaire alloué à ce lot (0-100%)';
COMMENT ON COLUMN public.tbl_affaires_lots.est_jalon_gantt IS 'Indique si ce lot sert de jalon dans le Gantt (module Planification)';

