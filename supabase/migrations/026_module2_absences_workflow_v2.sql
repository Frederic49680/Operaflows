-- Migration 026 : Module Absences - Workflow de validation à 2 niveaux (N+1 puis RH)
-- Conforme au PRD v2.0 : Gestion des Absences & Plan de Charge

-- ============================================
-- 1. TABLE : catalogue_absences (Référentiel des types d'absences)
-- ============================================
CREATE TABLE IF NOT EXISTS public.catalogue_absences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identification
  code VARCHAR(50) NOT NULL UNIQUE, -- Ex: 'CP', 'RTT', 'MALADIE', 'AT'
  libelle VARCHAR(255) NOT NULL, -- Ex: 'Congés payés', 'Repos compensateur'
  description TEXT,
  
  -- Classification
  categorie VARCHAR(50) NOT NULL CHECK (categorie IN (
    'exceptionnelle',  -- Ex: décès, hospitalisation
    'legale',         -- Ex: congés payés, RTT
    'autorisee',      -- Ex: RDV médical, famille
    'conges',         -- Congés payés
    'non_remuneree'   -- Sans solde
  )),
  
  -- Caractéristiques
  duree_max_jours INTEGER, -- Durée maximum autorisée (si applicable)
  duree_min_jours INTEGER, -- Durée minimum (si applicable)
  besoin_justificatif BOOLEAN DEFAULT false,
  besoin_validation_n1 BOOLEAN DEFAULT true, -- Nécessite validation N+1
  besoin_validation_rh BOOLEAN DEFAULT true, -- Nécessite validation RH
  
  -- Conditions particulières
  motif_complementaire TEXT, -- Précisions locales ajoutées par RH
  conditions_particulieres TEXT, -- Ex: "Uniquement sur présentation d'un justificatif"
  
  -- Statut
  is_active BOOLEAN DEFAULT true,
  
  -- Métadonnées
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_catalogue_absences_code ON public.catalogue_absences(code);
CREATE INDEX IF NOT EXISTS idx_catalogue_absences_categorie ON public.catalogue_absences(categorie);
CREATE INDEX IF NOT EXISTS idx_catalogue_absences_is_active ON public.catalogue_absences(is_active);

-- Trigger pour updated_at
DROP TRIGGER IF EXISTS trigger_update_catalogue_absences_updated_at ON public.catalogue_absences;
CREATE TRIGGER trigger_update_catalogue_absences_updated_at
  BEFORE UPDATE ON public.catalogue_absences
  FOR EACH ROW
  EXECUTE FUNCTION update_collaborateurs_updated_at();

-- ============================================
-- 2. TABLE : historique_validations_absences (Traçabilité complète)
-- ============================================
CREATE TABLE IF NOT EXISTS public.historique_validations_absences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  absence_id UUID NOT NULL REFERENCES public.absences(id) ON DELETE CASCADE,
  
  -- Validation
  niveau_validation VARCHAR(10) NOT NULL CHECK (niveau_validation IN ('n1', 'rh')),
  action VARCHAR(20) NOT NULL CHECK (action IN ('validee', 'refusee', 'modifiee', 'creee')),
  
  -- Validateur
  valide_par UUID NOT NULL REFERENCES auth.users(id),
  date_action TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Détails
  commentaire TEXT, -- Motif de refus, commentaire de validation, etc.
  ancien_statut VARCHAR(50), -- Statut avant l'action
  nouveau_statut VARCHAR(50), -- Statut après l'action
  
  -- Métadonnées
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_historique_validations_absence_id ON public.historique_validations_absences(absence_id);
CREATE INDEX IF NOT EXISTS idx_historique_validations_valide_par ON public.historique_validations_absences(valide_par);
CREATE INDEX IF NOT EXISTS idx_historique_validations_date_action ON public.historique_validations_absences(date_action);
CREATE INDEX IF NOT EXISTS idx_historique_validations_niveau ON public.historique_validations_absences(niveau_validation);

-- ============================================
-- 3. MISE À JOUR : Table absences avec nouveaux statuts et champs
-- ============================================

-- Ajouter nouveaux statuts au CHECK constraint
ALTER TABLE public.absences 
DROP CONSTRAINT IF EXISTS absences_statut_check;

ALTER TABLE public.absences 
ADD CONSTRAINT absences_statut_check 
CHECK (statut IN (
  'en_attente_validation_n1', -- Étape 1 : En attente validation N+1
  'validee_n1',              -- Étape 2 : Validée par N+1
  'refusee_n1',              -- Refusée par N+1
  'en_attente_validation_rh', -- Étape 3 : En attente validation RH
  'validee_rh',              -- Étape 4 : Validée par RH (impacte planification)
  'refusee_rh',              -- Refusée par RH
  'annulee',                 -- Annulée par le collaborateur
  'appliquee'                -- Étape 5 : Appliquée dans le plan de charge (statut final)
));

-- Ajouter colonnes pour les validations à 2 niveaux
ALTER TABLE public.absences
ADD COLUMN IF NOT EXISTS catalogue_absence_id UUID REFERENCES public.catalogue_absences(id) ON DELETE SET NULL;

ALTER TABLE public.absences
ADD COLUMN IF NOT EXISTS valide_par_n1 UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS date_validation_n1 TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS motif_refus_n1 TEXT;

ALTER TABLE public.absences
ADD COLUMN IF NOT EXISTS valide_par_rh UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS date_validation_rh TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS motif_refus_rh TEXT;

-- Déprécier l'ancien champ valide_par (garder pour compatibilité)
-- Il sera rempli automatiquement selon le niveau de validation

-- Ajouter champ pour le calcul automatique des jours ouvrés
ALTER TABLE public.absences
ADD COLUMN IF NOT EXISTS jours_ouvres DECIMAL(5, 2), -- Calcul automatique (hors week-end et jours fériés)
ADD COLUMN IF NOT EXISTS jours_ouvrables DECIMAL(5, 2); -- Calcul automatique (hors dimanche et jours fériés)

-- Ajouter champ pour forcer la validation RH (cas exceptionnel)
ALTER TABLE public.absences
ADD COLUMN IF NOT EXISTS force_validation_rh BOOLEAN DEFAULT false; -- RH peut court-circuiter la validation N+1

-- ============================================
-- 4. FONCTION : Calculer jours ouvrés et ouvrables
-- ============================================
CREATE OR REPLACE FUNCTION public.calculate_jours_calendaires()
RETURNS TRIGGER AS $$
DECLARE
  v_jours_ouvres DECIMAL(5, 2) := 0;
  v_jours_ouvrables DECIMAL(5, 2) := 0;
  v_date_courante DATE;
BEGIN
  IF NEW.date_debut IS NOT NULL AND NEW.date_fin IS NOT NULL THEN
    v_date_courante := NEW.date_debut;
    
    WHILE v_date_courante <= NEW.date_fin LOOP
      -- Jours ouvrables : du lundi au samedi (exclut dimanche)
      IF EXTRACT(DOW FROM v_date_courante) BETWEEN 1 AND 6 THEN
        v_jours_ouvrables := v_jours_ouvrables + 1;
        
        -- Jours ouvrés : du lundi au vendredi (exclut week-end)
        IF EXTRACT(DOW FROM v_date_courante) BETWEEN 1 AND 5 THEN
          v_jours_ouvres := v_jours_ouvres + 1;
        END IF;
      END IF;
      
      v_date_courante := v_date_courante + 1;
    END LOOP;
    
    NEW.jours_ouvres := v_jours_ouvres;
    NEW.jours_ouvrables := v_jours_ouvrables;
    
    -- Si heures_absences est renseigné (absence partielle), ajuster
    IF NEW.heures_absences IS NOT NULL AND NEW.heures_absences < (v_jours_ouvres * 8) THEN
      NEW.duree_jours := NEW.heures_absences / 8.0;
    ELSE
      NEW.duree_jours := (NEW.date_fin - NEW.date_debut + 1)::DECIMAL(5, 2);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Supprimer l'ancien trigger et le recréer
DROP TRIGGER IF EXISTS trigger_calculate_absence_duree ON public.absences;
CREATE TRIGGER trigger_calculate_absence_duree
  BEFORE INSERT OR UPDATE OF date_debut, date_fin, heures_absences ON public.absences
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_jours_calendaires();

-- ============================================
-- 5. FONCTION : Enregistrer l'historique des validations
-- ============================================
CREATE OR REPLACE FUNCTION public.log_validation_absence()
RETURNS TRIGGER AS $$
DECLARE
  v_ancien_statut VARCHAR(50);
  v_niveau_validation VARCHAR(10);
  v_action VARCHAR(20);
  v_valide_par UUID;
BEGIN
  v_ancien_statut := OLD.statut;
  
  -- Déterminer le niveau et l'action
  IF NEW.statut != OLD.statut THEN
    -- Validation N+1
    IF NEW.statut IN ('validee_n1', 'refusee_n1') THEN
      v_niveau_validation := 'n1';
      IF NEW.statut = 'validee_n1' THEN
        v_action := 'validee';
        -- Utiliser valide_par_n1 si défini, sinon auth.uid()
        v_valide_par := COALESCE(NEW.valide_par_n1, auth.uid());
        NEW.valide_par_n1 := v_valide_par;
        NEW.date_validation_n1 := NOW();
        NEW.valide_par := v_valide_par; -- Compatibilité avec ancien champ
        NEW.date_validation := NOW();
        
        -- Passer en attente RH si validée N+1
        NEW.statut := 'en_attente_validation_rh';
      ELSE
        v_action := 'refusee';
        v_valide_par := COALESCE(NEW.valide_par_n1, auth.uid());
      END IF;
    
    -- Validation RH
    ELSIF NEW.statut IN ('validee_rh', 'refusee_rh', 'appliquee') THEN
      v_niveau_validation := 'rh';
      IF NEW.statut IN ('validee_rh', 'appliquee') THEN
        v_action := 'validee';
        -- Utiliser valide_par_rh si défini, sinon auth.uid()
        v_valide_par := COALESCE(NEW.valide_par_rh, auth.uid());
        NEW.valide_par_rh := v_valide_par;
        NEW.date_validation_rh := NOW();
        NEW.valide_par := v_valide_par; -- Compatibilité avec ancien champ
        NEW.date_validation := NOW();
        
        -- Si validée RH, elle impacte automatiquement la planification
        IF NEW.impact_planif IS NULL THEN
          NEW.impact_planif := true;
        END IF;
      ELSE
        v_action := 'refusee';
        v_valide_par := COALESCE(NEW.valide_par_rh, auth.uid());
      END IF;
    
    -- Création initiale
    ELSIF NEW.statut = 'en_attente_validation_n1' AND OLD.statut IS NULL THEN
      v_niveau_validation := 'n1';
      v_action := 'creee';
      v_valide_par := COALESCE(NEW.created_by, auth.uid());
    END IF;
    
    -- Enregistrer dans l'historique seulement si on a déterminé les valeurs
    IF v_niveau_validation IS NOT NULL THEN
      INSERT INTO public.historique_validations_absences (
        absence_id,
        niveau_validation,
        action,
        valide_par,
        date_action,
        commentaire,
        ancien_statut,
        nouveau_statut
      ) VALUES (
        NEW.id,
        v_niveau_validation,
        v_action,
        v_valide_par,
        NOW(),
        CASE 
          WHEN NEW.statut = 'refusee_n1' THEN NEW.motif_refus_n1
          WHEN NEW.statut = 'refusee_rh' THEN NEW.motif_refus_rh
          ELSE NULL
        END,
        v_ancien_statut,
        NEW.statut
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour logger les validations (UPDATE)
DROP TRIGGER IF EXISTS trigger_log_validation_absence ON public.absences;
CREATE TRIGGER trigger_log_validation_absence
  BEFORE UPDATE ON public.absences
  FOR EACH ROW
  WHEN (OLD.statut IS DISTINCT FROM NEW.statut)
  EXECUTE FUNCTION public.log_validation_absence();

-- Trigger pour INSERT avec statuts déjà validés (cas admin qui crée directement validé)
CREATE OR REPLACE FUNCTION public.handle_insert_validation_absence()
RETURNS TRIGGER AS $$
BEGIN
  -- Si l'absence est créée avec un statut "validee_n1", passer automatiquement en "en_attente_validation_rh"
  IF NEW.statut = 'validee_n1' AND NEW.valide_par_n1 IS NOT NULL THEN
    NEW.statut := 'en_attente_validation_rh';
    
    -- Logger la validation N+1 dans l'historique
    INSERT INTO public.historique_validations_absences (
      absence_id,
      niveau_validation,
      action,
      valide_par,
      date_action,
      ancien_statut,
      nouveau_statut
    ) VALUES (
      NEW.id,
      'n1',
      'validee',
      NEW.valide_par_n1,
      COALESCE(NEW.date_validation_n1, NOW()),
      'en_attente_validation_n1',
      'en_attente_validation_rh'
    );
  END IF;
  
  -- Si l'absence est créée avec un statut "validee_rh", activer l'impact planification
  IF NEW.statut IN ('validee_rh', 'appliquee') AND NEW.valide_par_rh IS NOT NULL THEN
    IF NEW.impact_planif IS NULL THEN
      NEW.impact_planif := true;
    END IF;
    
    -- Logger la validation RH dans l'historique
    INSERT INTO public.historique_validations_absences (
      absence_id,
      niveau_validation,
      action,
      valide_par,
      date_action,
      ancien_statut,
      nouveau_statut
    ) VALUES (
      NEW.id,
      'rh',
      'validee',
      NEW.valide_par_rh,
      COALESCE(NEW.date_validation_rh, NOW()),
      'en_attente_validation_rh',
      NEW.statut
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_handle_insert_validation_absence ON public.absences;
CREATE TRIGGER trigger_handle_insert_validation_absence
  BEFORE INSERT ON public.absences
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_insert_validation_absence();

-- ============================================
-- 6. INSERTION : Données initiales du catalogue (types d'absences de base)
-- ============================================
INSERT INTO public.catalogue_absences (
  code, libelle, categorie, besoin_justificatif, besoin_validation_n1, besoin_validation_rh, is_active
) VALUES
  ('CP', 'Congés payés', 'legale', false, true, true, true),
  ('RTT', 'Repos compensateur (RTT)', 'legale', false, true, true, true),
  ('REPOS_SITE', 'Repos site', 'legale', false, true, true, true),
  ('MALADIE', 'Arrêt maladie', 'exceptionnelle', true, false, true, true), -- Pas besoin N+1
  ('AT', 'Accident du travail', 'exceptionnelle', true, false, true, true), -- Pas besoin N+1
  ('AUTORISEE', 'Absence autorisée', 'autorisee', false, true, true, true),
  ('RDV_MEDICAL', 'RDV médical / familial', 'autorisee', false, true, false, true),
  ('FORMATION', 'Formation', 'autorisee', false, true, true, true),
  ('HABILITATION', 'Habilitation', 'autorisee', false, true, true, true),
  ('DEPLACEMENT', 'Déplacement externe', 'autorisee', false, true, true, true),
  ('DECES', 'Décès / obsèques', 'exceptionnelle', false, false, true, true), -- Pas besoin N+1
  ('HOSPITALISATION', 'Hospitalisation', 'exceptionnelle', true, false, true, true), -- Pas besoin N+1
  ('SANS_SOLDE', 'Absence sans solde', 'non_remuneree', false, true, true, true),
  ('AUTRE', 'Autre', 'autorisee', false, true, true, true)
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- 7. RLS : Row Level Security pour les nouvelles tables
-- ============================================

-- Catalogue des absences : Lecture pour tous, écriture pour RH/Admin
ALTER TABLE public.catalogue_absences ENABLE ROW LEVEL SECURITY;

-- Politique : Tous peuvent lire les absences actives
DROP POLICY IF EXISTS "Tous peuvent lire catalogue actif" ON public.catalogue_absences;
CREATE POLICY "Tous peuvent lire catalogue actif" ON public.catalogue_absences
  FOR SELECT
  USING (is_active = true);

-- Politique : RH/Admin peuvent tout faire
DROP POLICY IF EXISTS "RH peut gérer catalogue" ON public.catalogue_absences;
CREATE POLICY "RH peut gérer catalogue" ON public.catalogue_absences
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      INNER JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND (r.name = 'Administrateur' OR r.name LIKE '%RH%')
    )
  );

-- Historique des validations : Lecture pour collaborateur propriétaire, RH, et responsable
ALTER TABLE public.historique_validations_absences ENABLE ROW LEVEL SECURITY;

-- Politique : Collaborateur peut voir l'historique de ses absences
DROP POLICY IF EXISTS "Collaborateur voit son historique" ON public.historique_validations_absences;
CREATE POLICY "Collaborateur voit son historique" ON public.historique_validations_absences
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.absences a
      INNER JOIN public.collaborateurs c ON a.collaborateur_id = c.id
      WHERE a.id = historique_validations_absences.absence_id
      AND c.user_id = auth.uid()
    )
  );

-- Politique : RH/Admin et responsables peuvent voir tous les historiques
DROP POLICY IF EXISTS "RH voit tous historiques" ON public.historique_validations_absences;
CREATE POLICY "RH voit tous historiques" ON public.historique_validations_absences
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      INNER JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND (r.name = 'Administrateur' OR r.name LIKE '%RH%')
    )
    OR EXISTS (
      SELECT 1 FROM public.absences a
      INNER JOIN public.collaborateurs c ON a.collaborateur_id = c.id
      WHERE a.id = historique_validations_absences.absence_id
      AND (c.responsable_id IN (
        SELECT id FROM public.collaborateurs WHERE user_id = auth.uid()
      ) OR c.responsable_activite_id IN (
        SELECT id FROM public.collaborateurs WHERE user_id = auth.uid()
      ))
    )
  );

-- ============================================
-- 8. VUE : Liste des absences avec détails du catalogue
-- ============================================
CREATE OR REPLACE VIEW public.v_absences_detail AS
SELECT 
  a.*,
  ca.code as catalogue_code,
  ca.libelle as catalogue_libelle,
  ca.categorie as catalogue_categorie,
  c.nom as collaborateur_nom,
  c.prenom as collaborateur_prenom,
  c.email as collaborateur_email,
  valide_n1.nom as valide_n1_nom,
  valide_n1.prenom as valide_n1_prenom,
  valide_rh.nom as valide_rh_nom,
  valide_rh.prenom as valide_rh_prenom
FROM public.absences a
LEFT JOIN public.catalogue_absences ca ON a.catalogue_absence_id = ca.id
LEFT JOIN public.collaborateurs c ON a.collaborateur_id = c.id
LEFT JOIN public.collaborateurs valide_n1 ON valide_n1.user_id = a.valide_par_n1
LEFT JOIN public.collaborateurs valide_rh ON valide_rh.user_id = a.valide_par_rh;

-- ============================================
-- 9. COMMENTAIRES
-- ============================================
COMMENT ON TABLE public.catalogue_absences IS 'Référentiel des types d''absences reconnus dans l''entreprise';
COMMENT ON TABLE public.historique_validations_absences IS 'Historique complet des validations et modifications d''absences pour traçabilité';
COMMENT ON COLUMN public.absences.statut IS 'Statut du workflow à 2 niveaux : en_attente_validation_n1 → validee_n1 → en_attente_validation_rh → validee_rh → appliquee';
COMMENT ON COLUMN public.absences.force_validation_rh IS 'Permet à la RH de court-circuiter la validation N+1 (cas exceptionnel : arrêt maladie, décès, etc.)';

