-- Migration 024 : Statut "A renouveller" pour contrats intérim arrivant à expiration
-- Si contrat Interim et date_fin_contrat <= 15 jours, statut passe automatiquement à "A renouveller"
-- et création d'alerte dans v_alertes_echeances

-- ============================================
-- 1. Ajouter le statut "A renouveller" au CHECK constraint
-- ============================================
ALTER TABLE public.collaborateurs 
DROP CONSTRAINT IF EXISTS collaborateurs_statut_check;

ALTER TABLE public.collaborateurs 
ADD CONSTRAINT collaborateurs_statut_check 
CHECK (statut IN ('actif', 'inactif', 'suspendu', 'archivé', 'A renouveller'));

-- ============================================
-- 2. Fonction pour vérifier et mettre à jour les statuts des contrats intérim
-- ============================================
CREATE OR REPLACE FUNCTION public.check_interim_contracts()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_updated_count INTEGER := 0;
  v_collab RECORD;
BEGIN
  -- Parcourir tous les collaborateurs avec contrat Interim actif
  FOR v_collab IN 
    SELECT id, date_fin_contrat, statut
    FROM public.collaborateurs
    WHERE type_contrat = 'Interim'
      AND statut = 'actif'
      AND date_fin_contrat IS NOT NULL
      AND date_fin_contrat > CURRENT_DATE
      AND date_fin_contrat <= CURRENT_DATE + INTERVAL '15 days'
  LOOP
    -- Mettre à jour le statut si pas déjà "A renouveller"
    IF v_collab.statut != 'A renouveller' THEN
      UPDATE public.collaborateurs
      SET statut = 'A renouveller',
          updated_at = NOW()
      WHERE id = v_collab.id;
      
      v_updated_count := v_updated_count + 1;
    END IF;
  END LOOP;
  
  -- Réinitialiser le statut à "actif" si la date de fin est passée de plus de 15 jours
  -- (pour les cas où la date a été modifiée)
  UPDATE public.collaborateurs
  SET statut = 'actif',
      updated_at = NOW()
  WHERE type_contrat = 'Interim'
    AND statut = 'A renouveller'
    AND (
      date_fin_contrat IS NULL 
      OR date_fin_contrat > CURRENT_DATE + INTERVAL '15 days'
      OR date_fin_contrat < CURRENT_DATE
    );
  
  RETURN v_updated_count;
END;
$$;

-- ============================================
-- 3. Mettre à jour la vue v_alertes_echeances pour inclure les contrats intérim
-- ============================================
CREATE OR REPLACE VIEW public.v_alertes_echeances AS
SELECT 
  'habilitation' as type_alerte,
  h.id,
  c.id as collaborateur_id,
  c.nom,
  c.prenom,
  c.email,
  h.libelle as libelle_document,
  h.date_expiration,
  CASE 
    WHEN h.date_expiration IS NULL THEN NULL
    WHEN h.date_expiration < CURRENT_DATE THEN 'expiree'
    WHEN h.date_expiration <= CURRENT_DATE + INTERVAL '30 days' THEN 'echeance_proche'
    ELSE 'ok'
  END as statut_alerte,
  (h.date_expiration - CURRENT_DATE)::INTEGER as jours_restants
FROM public.habilitations h
INNER JOIN public.collaborateurs c ON h.collaborateur_id = c.id
WHERE h.statut = 'valide' 
  AND (h.date_expiration IS NULL OR h.date_expiration <= CURRENT_DATE + INTERVAL '30 days')

UNION ALL

SELECT 
  'visite_medicale' as type_alerte,
  vm.id,
  c.id as collaborateur_id,
  c.nom,
  c.prenom,
  c.email,
  'Visite médicale ' || vm.type_visite as libelle_document,
  vm.date_prochaine_visite as date_expiration,
  CASE 
    WHEN vm.date_prochaine_visite IS NULL THEN NULL
    WHEN vm.date_prochaine_visite < CURRENT_DATE THEN 'expiree'
    WHEN vm.date_prochaine_visite <= CURRENT_DATE + INTERVAL '30 days' THEN 'echeance_proche'
    ELSE 'ok'
  END as statut_alerte,
  (vm.date_prochaine_visite - CURRENT_DATE)::INTEGER as jours_restants
FROM public.visites_medicales vm
INNER JOIN public.collaborateurs c ON vm.collaborateur_id = c.id
WHERE vm.statut IN ('apte', 'apte_avec_reserves')
  AND (vm.date_prochaine_visite IS NULL OR vm.date_prochaine_visite <= CURRENT_DATE + INTERVAL '30 days')

UNION ALL

SELECT 
  'competence' as type_alerte,
  cc.id,
  c.id as collaborateur_id,
  c.nom,
  c.prenom,
  c.email,
  comp.libelle as libelle_document,
  cc.date_expiration,
  CASE 
    WHEN cc.date_expiration IS NULL THEN NULL
    WHEN cc.date_expiration < CURRENT_DATE THEN 'expiree'
    WHEN cc.date_expiration <= CURRENT_DATE + INTERVAL '30 days' THEN 'echeance_proche'
    ELSE 'ok'
  END as statut_alerte,
  (cc.date_expiration - CURRENT_DATE)::INTEGER as jours_restants
FROM public.collaborateurs_competences cc
INNER JOIN public.collaborateurs c ON cc.collaborateur_id = c.id
INNER JOIN public.competences comp ON cc.competence_id = comp.id
WHERE cc.statut = 'valide'
  AND (cc.date_expiration IS NULL OR cc.date_expiration <= CURRENT_DATE + INTERVAL '30 days')

UNION ALL

-- Nouvelle section pour les contrats intérim à renouveler
SELECT 
  'contrat_interim' as type_alerte,
  c.id,
  c.id as collaborateur_id,
  c.nom,
  c.prenom,
  c.email,
  'Contrat Intérim - ' || COALESCE(c.fonction_metier, 'Sans fonction') as libelle_document,
  c.date_fin_contrat as date_expiration,
  CASE 
    WHEN c.date_fin_contrat IS NULL THEN NULL
    WHEN c.date_fin_contrat < CURRENT_DATE THEN 'expiree'
    WHEN c.date_fin_contrat <= CURRENT_DATE + INTERVAL '15 days' THEN 'echeance_proche'
    ELSE 'ok'
  END as statut_alerte,
  (c.date_fin_contrat - CURRENT_DATE)::INTEGER as jours_restants
FROM public.collaborateurs c
WHERE c.type_contrat = 'Interim'
  AND c.statut IN ('actif', 'A renouveller')
  AND c.date_fin_contrat IS NOT NULL
  AND c.date_fin_contrat <= CURRENT_DATE + INTERVAL '15 days';

-- ============================================
-- 4. Trigger pour vérifier automatiquement lors de la mise à jour d'un collaborateur
-- ============================================
CREATE OR REPLACE FUNCTION public.trigger_check_interim_on_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Vérifier si c'est un contrat intérim avec date de fin à 15 jours ou moins
  IF NEW.type_contrat = 'Interim' 
     AND NEW.statut = 'actif'
     AND NEW.date_fin_contrat IS NOT NULL
     AND NEW.date_fin_contrat > CURRENT_DATE
     AND NEW.date_fin_contrat <= CURRENT_DATE + INTERVAL '15 days' THEN
    NEW.statut := 'A renouveller';
  END IF;
  
  -- Réinitialiser le statut si la date de fin est passée de plus de 15 jours ou annulée
  IF NEW.type_contrat = 'Interim' 
     AND NEW.statut = 'A renouveller'
     AND (
       NEW.date_fin_contrat IS NULL 
       OR NEW.date_fin_contrat > CURRENT_DATE + INTERVAL '15 days'
       OR NEW.date_fin_contrat < CURRENT_DATE
     ) THEN
    NEW.statut := 'actif';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Créer le trigger
DROP TRIGGER IF EXISTS trigger_check_interim_contracts ON public.collaborateurs;
CREATE TRIGGER trigger_check_interim_contracts
  BEFORE INSERT OR UPDATE ON public.collaborateurs
  FOR EACH ROW
  WHEN (NEW.type_contrat = 'Interim')
  EXECUTE FUNCTION public.trigger_check_interim_on_update();

-- ============================================
-- 5. Exécuter immédiatement la fonction pour mettre à jour les statuts existants
-- ============================================
SELECT public.check_interim_contracts() as collaborateurs_mis_a_jour;

-- ============================================
-- 6. Cron job configuré automatiquement
-- ============================================
-- Le cron job est configuré dans la migration 025_setup_cron_interim_contracts.sql
-- Exécutez cette migration pour activer la vérification quotidienne automatique

