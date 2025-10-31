-- ============================================
-- MODULE 2 : RH COLLABORATEURS
-- Schéma complet selon PRD Module 2 v1.4
-- ============================================

-- ============================================
-- TABLE: collaborateurs (structure complète)
-- ============================================
DROP TABLE IF EXISTS public.collaborateurs CASCADE;

CREATE TABLE IF NOT EXISTS public.collaborateurs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  nom VARCHAR(100) NOT NULL,
  prenom VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  telephone VARCHAR(20),
  
  -- Affectation et organisation
  site VARCHAR(100), -- Site d'affectation (texte libre)
  responsable_id UUID REFERENCES public.collaborateurs(id) ON DELETE SET NULL,
  fonction_metier VARCHAR(100),
  
  -- Contrat
  type_contrat VARCHAR(50) CHECK (type_contrat IN ('CDI', 'CDD', 'Interim', 'Apprenti', 'Stage', 'Autre')),
  date_embauche DATE,
  date_fin_contrat DATE,
  statut VARCHAR(20) DEFAULT 'actif' CHECK (statut IN ('actif', 'inactif', 'suspendu', 'archivé')),
  
  -- Compétences
  competence_principale_id UUID, -- Lien vers table compétences (future)
  competence_secondaire_ids UUID[], -- Array de compétences
  
  -- Métadonnées
  commentaire TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_collaborateurs_user_id ON public.collaborateurs(user_id);
CREATE INDEX idx_collaborateurs_email ON public.collaborateurs(email);
CREATE INDEX idx_collaborateurs_site ON public.collaborateurs(site);
CREATE INDEX idx_collaborateurs_responsable_id ON public.collaborateurs(responsable_id);
CREATE INDEX idx_collaborateurs_statut ON public.collaborateurs(statut);
CREATE INDEX idx_collaborateurs_date_embauche ON public.collaborateurs(date_embauche);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_collaborateurs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_collaborateurs_updated_at
  BEFORE UPDATE ON public.collaborateurs
  FOR EACH ROW
  EXECUTE FUNCTION update_collaborateurs_updated_at();

-- ============================================
-- TABLE: habilitations
-- ============================================
CREATE TABLE IF NOT EXISTS public.habilitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collaborateur_id UUID NOT NULL REFERENCES public.collaborateurs(id) ON DELETE CASCADE,
  
  -- Type d'habilitation
  type VARCHAR(100) NOT NULL, -- Ex: 'electrique', 'hauteur', 'atex', 'espace_confiné', 'autre'
  libelle VARCHAR(255) NOT NULL, -- Description lisible
  
  -- Dates
  date_obtention DATE NOT NULL,
  date_expiration DATE,
  duree_validite_mois INTEGER, -- Si durée fixe (ex: 3 ans = 36 mois)
  
  -- Organisme / Certificat
  organisme VARCHAR(255), -- Organisme émetteur
  numero_certificat VARCHAR(100), -- Référence du certificat
  
  -- Statut
  statut VARCHAR(20) DEFAULT 'valide' CHECK (statut IN ('valide', 'expire', 'en_cours_renouvellement', 'suspendu')),
  
  -- Documents
  document_url TEXT, -- Lien vers Supabase Storage
  document_signe_id UUID, -- Lien vers module Signature (future table)
  
  -- Métadonnées
  commentaire TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_habilitations_collaborateur_id ON public.habilitations(collaborateur_id);
CREATE INDEX idx_habilitations_type ON public.habilitations(type);
CREATE INDEX idx_habilitations_date_expiration ON public.habilitations(date_expiration);
CREATE INDEX idx_habilitations_statut ON public.habilitations(statut);

-- Trigger pour updated_at
CREATE TRIGGER trigger_update_habilitations_updated_at
  BEFORE UPDATE ON public.habilitations
  FOR EACH ROW
  EXECUTE FUNCTION update_collaborateurs_updated_at();

-- ============================================
-- TABLE: dosimetrie
-- ============================================
CREATE TABLE IF NOT EXISTS public.dosimetrie (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collaborateur_id UUID NOT NULL REFERENCES public.collaborateurs(id) ON DELETE CASCADE,
  
  -- Dosimètre
  numero_dosimetre VARCHAR(100) NOT NULL,
  periode_debut DATE NOT NULL,
  periode_fin DATE NOT NULL,
  
  -- Doses
  dose_trimestrielle_mSv DECIMAL(10, 3) DEFAULT 0,
  dose_annuelle_mSv DECIMAL(10, 3) DEFAULT 0,
  dose_cumulee_mSv DECIMAL(10, 3) DEFAULT 0,
  limite_reglementaire_mSv DECIMAL(10, 3) DEFAULT 20.0, -- Seuil par défaut 20 mSv/an
  
  -- Fournisseur
  fournisseur VARCHAR(255), -- Ex: Mirion, Landauer
  laboratoire VARCHAR(255),
  
  -- Rapport RTR
  rapport_rtr_url TEXT, -- Lien vers document Supabase Storage
  rapport_rtr_signe_id UUID, -- Lien vers module Signature
  
  -- Import
  import_source VARCHAR(50) CHECK (import_source IN ('manuel', 'csv', 'api_laboratoire')),
  import_date TIMESTAMP WITH TIME ZONE,
  import_metadata JSONB, -- Métadonnées de l'import
  
  -- Métadonnées
  commentaire TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  
  CHECK (periode_fin >= periode_debut)
);

CREATE INDEX idx_dosimetrie_collaborateur_id ON public.dosimetrie(collaborateur_id);
CREATE INDEX idx_dosimetrie_numero_dosimetre ON public.dosimetrie(numero_dosimetre);
CREATE INDEX idx_dosimetrie_periode_debut ON public.dosimetrie(periode_debut);
CREATE INDEX idx_dosimetrie_periode_fin ON public.dosimetrie(periode_fin);
CREATE INDEX idx_dosimetrie_date_import ON public.dosimetrie(import_date);

-- Trigger pour updated_at
CREATE TRIGGER trigger_update_dosimetrie_updated_at
  BEFORE UPDATE ON public.dosimetrie
  FOR EACH ROW
  EXECUTE FUNCTION update_collaborateurs_updated_at();

-- ============================================
-- TABLE: visites_medicales
-- ============================================
CREATE TABLE IF NOT EXISTS public.visites_medicales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collaborateur_id UUID NOT NULL REFERENCES public.collaborateurs(id) ON DELETE CASCADE,
  
  -- Type de visite
  type_visite VARCHAR(50) NOT NULL CHECK (type_visite IN ('embauche', 'periodique', 'reprise', 'inaptitude', 'autre')),
  
  -- Dates
  date_visite DATE NOT NULL,
  date_prochaine_visite DATE,
  frequence_mois INTEGER DEFAULT 36, -- Périodicité en mois (ex: 36 = 3 ans)
  
  -- Centre médical
  centre_medical VARCHAR(255),
  medecin VARCHAR(255),
  
  -- Résultat
  statut VARCHAR(20) DEFAULT 'apte' CHECK (statut IN ('apte', 'apte_avec_reserves', 'inapte', 'en_attente')),
  avis_medical TEXT,
  restrictions TEXT, -- Restrictions éventuelles
  
  -- Documents
  certificat_url TEXT, -- Lien vers document Supabase Storage
  certificat_signe_id UUID, -- Lien vers module Signature
  
  -- Métadonnées
  commentaire TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_visites_medicales_collaborateur_id ON public.visites_medicales(collaborateur_id);
CREATE INDEX idx_visites_medicales_type_visite ON public.visites_medicales(type_visite);
CREATE INDEX idx_visites_medicales_date_visite ON public.visites_medicales(date_visite);
CREATE INDEX idx_visites_medicales_date_prochaine ON public.visites_medicales(date_prochaine_visite);
CREATE INDEX idx_visites_medicales_statut ON public.visites_medicales(statut);

-- Trigger pour updated_at
CREATE TRIGGER trigger_update_visites_medicales_updated_at
  BEFORE UPDATE ON public.visites_medicales
  FOR EACH ROW
  EXECUTE FUNCTION update_collaborateurs_updated_at();

-- ============================================
-- TABLE: absences (structure complète)
-- ============================================
DROP TABLE IF EXISTS public.absences CASCADE;

CREATE TABLE IF NOT EXISTS public.absences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collaborateur_id UUID NOT NULL REFERENCES public.collaborateurs(id) ON DELETE CASCADE,
  
  -- Type et motif
  type VARCHAR(50) NOT NULL CHECK (type IN ('conges_payes', 'rtt', 'repos_site', 'maladie', 'accident_travail', 'absence_autorisee', 'formation', 'habilitation', 'deplacement_externe', 'autre')),
  motif VARCHAR(255),
  
  -- Période
  date_debut DATE NOT NULL,
  date_fin DATE NOT NULL,
  heures_absences DECIMAL(4, 2), -- Pour absences partielles (ex: 4.5h)
  duree_jours DECIMAL(5, 2), -- Calcul automatique ou manuel
  
  -- Statut et validation
  statut VARCHAR(20) DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'validee', 'refusee', 'annulee')),
  valide_par UUID REFERENCES auth.users(id),
  date_validation TIMESTAMP WITH TIME ZONE,
  motif_refus TEXT,
  
  -- Justificatif
  justificatif_url TEXT, -- Lien vers Supabase Storage
  justificatif_signe_id UUID, -- Lien vers module Signature
  
  -- Impact planification
  impact_planif BOOLEAN DEFAULT true, -- Bloque la planification sur cette période
  
  -- Synchronisation externe
  synchro_outlook BOOLEAN DEFAULT false,
  outlook_event_id VARCHAR(255), -- ID de l'événement Outlook
  
  synchro_sirh BOOLEAN DEFAULT false,
  sirh_export_date TIMESTAMP WITH TIME ZONE,
  sirh_export_id VARCHAR(255), -- ID dans le SIRH
  
  -- Métadonnées
  commentaire TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  
  CHECK (date_fin >= date_debut)
);

CREATE INDEX idx_absences_collaborateur_id ON public.absences(collaborateur_id);
CREATE INDEX idx_absences_type ON public.absences(type);
CREATE INDEX idx_absences_dates ON public.absences(date_debut, date_fin);
CREATE INDEX idx_absences_statut ON public.absences(statut);
CREATE INDEX idx_absences_impact_planif ON public.absences(impact_planif);
CREATE INDEX idx_absences_date_debut ON public.absences(date_debut);
CREATE INDEX idx_absences_date_fin ON public.absences(date_fin);

-- Trigger pour updated_at
CREATE TRIGGER trigger_update_absences_updated_at
  BEFORE UPDATE ON public.absences
  FOR EACH ROW
  EXECUTE FUNCTION update_collaborateurs_updated_at();

-- Fonction pour calculer durée en jours
CREATE OR REPLACE FUNCTION calculate_absence_duree_jours()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.date_debut IS NOT NULL AND NEW.date_fin IS NOT NULL THEN
    NEW.duree_jours = (NEW.date_fin - NEW.date_debut + 1)::DECIMAL(5, 2);
    -- Ajuster si heures_absences est renseigné (absence partielle)
    IF NEW.heures_absences IS NOT NULL AND NEW.heures_absences < 8 THEN
      NEW.duree_jours = NEW.heures_absences / 8.0;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_absence_duree
  BEFORE INSERT OR UPDATE ON public.absences
  FOR EACH ROW
  EXECUTE FUNCTION calculate_absence_duree_jours();

-- ============================================
-- TABLE: formations
-- ============================================
CREATE TABLE IF NOT EXISTS public.formations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collaborateur_id UUID NOT NULL REFERENCES public.collaborateurs(id) ON DELETE CASCADE,
  
  -- Formation
  libelle VARCHAR(255) NOT NULL,
  description TEXT,
  type_formation VARCHAR(50) CHECK (type_formation IN ('interne', 'externe', 'habilitation', 'certification', 'autre')),
  
  -- Organisme
  organisme_formateur VARCHAR(255),
  formateur VARCHAR(255),
  
  -- Dates
  date_debut DATE NOT NULL,
  date_fin DATE,
  duree_heures DECIMAL(5, 2),
  
  -- Résultat
  statut VARCHAR(20) DEFAULT 'planifiee' CHECK (statut IN ('planifiee', 'en_cours', 'terminee', 'abandonnee', 'echec')),
  resultat VARCHAR(50), -- Ex: 'reussi', 'echec', 'en_attente'
  note DECIMAL(4, 2), -- Si notation
  
  -- Documents
  attestation_url TEXT, -- Lien vers Supabase Storage
  attestation_signe_id UUID, -- Lien vers module Signature
  
  -- Validation et planification
  validee_par UUID REFERENCES auth.users(id),
  date_validation TIMESTAMP WITH TIME ZONE,
  
  impact_planif BOOLEAN DEFAULT true, -- Bloque la planification
  
  -- Synchronisation externe
  synchro_outlook BOOLEAN DEFAULT false,
  outlook_event_id VARCHAR(255),
  
  synchro_sirh BOOLEAN DEFAULT false,
  sirh_export_date TIMESTAMP WITH TIME ZONE,
  sirh_export_id VARCHAR(255),
  
  -- Métadonnées
  commentaire TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  
  CHECK (date_fin IS NULL OR date_fin >= date_debut)
);

CREATE INDEX idx_formations_collaborateur_id ON public.formations(collaborateur_id);
CREATE INDEX idx_formations_type_formation ON public.formations(type_formation);
CREATE INDEX idx_formations_dates ON public.formations(date_debut, date_fin);
CREATE INDEX idx_formations_statut ON public.formations(statut);
CREATE INDEX idx_formations_impact_planif ON public.formations(impact_planif);

-- Trigger pour updated_at
CREATE TRIGGER trigger_update_formations_updated_at
  BEFORE UPDATE ON public.formations
  FOR EACH ROW
  EXECUTE FUNCTION update_collaborateurs_updated_at();

-- ============================================
-- TABLE: compétences (structure de base)
-- ============================================
CREATE TABLE IF NOT EXISTS public.competences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE,
  libelle VARCHAR(255) NOT NULL,
  description TEXT,
  categorie VARCHAR(100), -- Ex: 'technique', 'securite', 'reglementaire'
  niveau_requis VARCHAR(50), -- Ex: 'base', 'intermediaire', 'expert'
  duree_validite_mois INTEGER, -- Si compétence avec expiration
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_competences_code ON public.competences(code);
CREATE INDEX idx_competences_categorie ON public.competences(categorie);

-- ============================================
-- TABLE: collaborateurs_competences (liaison)
-- ============================================
CREATE TABLE IF NOT EXISTS public.collaborateurs_competences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collaborateur_id UUID NOT NULL REFERENCES public.collaborateurs(id) ON DELETE CASCADE,
  competence_id UUID NOT NULL REFERENCES public.competences(id) ON DELETE CASCADE,
  
  -- Niveau et statut
  niveau VARCHAR(50), -- Niveau acquis par le collaborateur
  date_obtention DATE,
  date_expiration DATE,
  statut VARCHAR(20) DEFAULT 'valide' CHECK (statut IN ('valide', 'expire', 'en_cours_acquisition', 'suspendu')),
  
  -- Validation
  valide_par UUID REFERENCES auth.users(id),
  date_validation TIMESTAMP WITH TIME ZONE,
  
  -- Documents
  attestation_url TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(collaborateur_id, competence_id)
);

CREATE INDEX idx_collab_compet_collaborateur_id ON public.collaborateurs_competences(collaborateur_id);
CREATE INDEX idx_collab_compet_competence_id ON public.collaborateurs_competences(competence_id);
CREATE INDEX idx_collab_compet_statut ON public.collaborateurs_competences(statut);
CREATE INDEX idx_collab_compet_date_expiration ON public.collaborateurs_competences(date_expiration);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Activer RLS sur toutes les tables
ALTER TABLE public.collaborateurs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habilitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dosimetrie ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visites_medicales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.absences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.formations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collaborateurs_competences ENABLE ROW LEVEL SECURITY;

-- Fonction helper pour vérifier si RH/Admin
-- Note: Le paramètre est renommé p_user_id pour éviter l'ambiguïté avec ur.user_id
CREATE OR REPLACE FUNCTION public.is_rh_or_admin(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.user_roles ur
    INNER JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = p_user_id 
    AND (
      r.name = 'Administrateur' 
      OR r.name LIKE '%RH%'
      OR r.name LIKE '%Formation%'
      OR r.name LIKE '%Dosimétrie%'
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS pour collaborateurs
CREATE POLICY "Users can read own collaborateur profile" ON public.collaborateurs
  FOR SELECT USING (
    user_id = auth.uid() OR
    id IN (SELECT id FROM public.collaborateurs WHERE responsable_id IN (
      SELECT id FROM public.collaborateurs WHERE user_id = auth.uid()
    ))
  );

CREATE POLICY "RH/Admin can manage all collaborateurs" ON public.collaborateurs
  FOR ALL USING (public.is_rh_or_admin(auth.uid()));

CREATE POLICY "Responsables can read their team" ON public.collaborateurs
  FOR SELECT USING (
    responsable_id IN (
      SELECT id FROM public.collaborateurs WHERE user_id = auth.uid()
    )
  );

-- RLS pour habilitations
CREATE POLICY "Users can read own habilitations" ON public.habilitations
  FOR SELECT USING (
    collaborateur_id IN (SELECT id FROM public.collaborateurs WHERE user_id = auth.uid())
  );

CREATE POLICY "RH/Admin can manage all habilitations" ON public.habilitations
  FOR ALL USING (public.is_rh_or_admin(auth.uid()));

CREATE POLICY "Responsables can read team habilitations" ON public.habilitations
  FOR SELECT USING (
    collaborateur_id IN (
      SELECT id FROM public.collaborateurs 
      WHERE responsable_id IN (
        SELECT id FROM public.collaborateurs WHERE user_id = auth.uid()
      )
    )
  );

-- RLS pour dosimétrie
CREATE POLICY "Users can read own dosimetrie" ON public.dosimetrie
  FOR SELECT USING (
    collaborateur_id IN (SELECT id FROM public.collaborateurs WHERE user_id = auth.uid())
  );

CREATE POLICY "RH/Admin can manage all dosimetrie" ON public.dosimetrie
  FOR ALL USING (public.is_rh_or_admin(auth.uid()));

-- RLS pour visites médicales
CREATE POLICY "Users can read own visites medicales" ON public.visites_medicales
  FOR SELECT USING (
    collaborateur_id IN (SELECT id FROM public.collaborateurs WHERE user_id = auth.uid())
  );

CREATE POLICY "RH/Admin can manage all visites medicales" ON public.visites_medicales
  FOR ALL USING (public.is_rh_or_admin(auth.uid()));

-- RLS pour absences
CREATE POLICY "Users can read own absences" ON public.absences
  FOR SELECT USING (
    collaborateur_id IN (SELECT id FROM public.collaborateurs WHERE user_id = auth.uid()) OR
    created_by = auth.uid()
  );

CREATE POLICY "Users can create own absences" ON public.absences
  FOR INSERT WITH CHECK (
    collaborateur_id IN (SELECT id FROM public.collaborateurs WHERE user_id = auth.uid()) OR
    created_by = auth.uid()
  );

CREATE POLICY "RH/Admin can manage all absences" ON public.absences
  FOR ALL USING (public.is_rh_or_admin(auth.uid()));

CREATE POLICY "Responsables can read and validate team absences" ON public.absences
  FOR SELECT USING (
    collaborateur_id IN (
      SELECT id FROM public.collaborateurs 
      WHERE responsable_id IN (
        SELECT id FROM public.collaborateurs WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Responsables can validate team absences" ON public.absences
  FOR UPDATE USING (
    collaborateur_id IN (
      SELECT id FROM public.collaborateurs 
      WHERE responsable_id IN (
        SELECT id FROM public.collaborateurs WHERE user_id = auth.uid()
      )
    )
  );

-- RLS pour formations
CREATE POLICY "Users can read own formations" ON public.formations
  FOR SELECT USING (
    collaborateur_id IN (SELECT id FROM public.collaborateurs WHERE user_id = auth.uid())
  );

CREATE POLICY "RH/Admin can manage all formations" ON public.formations
  FOR ALL USING (public.is_rh_or_admin(auth.uid()));

CREATE POLICY "Responsables can read team formations" ON public.formations
  FOR SELECT USING (
    collaborateur_id IN (
      SELECT id FROM public.collaborateurs 
      WHERE responsable_id IN (
        SELECT id FROM public.collaborateurs WHERE user_id = auth.uid()
      )
    )
  );

-- RLS pour compétences (lecture publique, écriture RH/Admin)
CREATE POLICY "Authenticated users can read competences" ON public.competences
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "RH/Admin can manage competences" ON public.competences
  FOR ALL USING (public.is_rh_or_admin(auth.uid()));

-- RLS pour collaborateurs_competences
CREATE POLICY "Users can read own competences" ON public.collaborateurs_competences
  FOR SELECT USING (
    collaborateur_id IN (SELECT id FROM public.collaborateurs WHERE user_id = auth.uid())
  );

CREATE POLICY "RH/Admin can manage all collaborateurs_competences" ON public.collaborateurs_competences
  FOR ALL USING (public.is_rh_or_admin(auth.uid()));

-- ============================================
-- VUES UTILITAIRES
-- ============================================

-- Vue pour alertes échéances (habilitations, visites médicales)
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
  AND (cc.date_expiration IS NULL OR cc.date_expiration <= CURRENT_DATE + INTERVAL '30 days');

-- RLS pour la vue
ALTER VIEW public.v_alertes_echeances OWNER TO postgres;

-- ============================================
-- COMMENTAIRES
-- ============================================
COMMENT ON TABLE public.collaborateurs IS 'Table principale des collaborateurs - Module 2 RH';
COMMENT ON TABLE public.habilitations IS 'Habilitations réglementaires (électrique, hauteur, ATEX, etc.)';
COMMENT ON TABLE public.dosimetrie IS 'Suivi dosimétrique et expositions radiologiques';
COMMENT ON TABLE public.visites_medicales IS 'Visites médicales périodiques et aptitudes';
COMMENT ON TABLE public.absences IS 'Absences et indisponibilités avec workflow de validation';
COMMENT ON TABLE public.formations IS 'Formations suivies par les collaborateurs';
COMMENT ON TABLE public.competences IS 'Référentiel des compétences';
COMMENT ON TABLE public.collaborateurs_competences IS 'Liaison collaborateurs-compétences';

