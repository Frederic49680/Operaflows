// Types pour le Module 2 : RH Collaborateurs

export type TypeContrat = 'CDI' | 'CDD' | 'Interim' | 'Apprenti' | 'Stage' | 'Autre';
export type StatutCollaborateur = 'actif' | 'inactif' | 'suspendu' | 'archivé' | 'A renouveller';
export type TypeAbsence = 'conges_payes' | 'rtt' | 'repos_site' | 'maladie' | 'accident_travail' | 'absence_autorisee' | 'formation' | 'habilitation' | 'deplacement_externe' | 'autre';
export type StatutAbsence = 
  | 'en_attente_validation_n1'  // Étape 1 : En attente validation N+1
  | 'validee_n1'                // Étape 2 : Validée par N+1
  | 'refusee_n1'                // Refusée par N+1
  | 'en_attente_validation_rh'  // Étape 3 : En attente validation RH
  | 'validee_rh'                // Étape 4 : Validée par RH (impacte planification)
  | 'refusee_rh'                // Refusée par RH
  | 'annulee'                   // Annulée par le collaborateur
  | 'appliquee';                // Étape 5 : Appliquée dans le plan de charge

// Anciens statuts (dépréciés, gardés pour compatibilité)
export type StatutAbsenceLegacy = 'en_attente' | 'validee' | 'refusee' | 'annulee';
export type TypeFormation = 'interne' | 'externe' | 'habilitation' | 'certification' | 'autre';
export type StatutFormation = 'planifiee' | 'en_cours' | 'terminee' | 'abandonnee' | 'echec' | 'reportee' | 'annulee';
export type TypeVisiteMedicale = 'embauche' | 'periodique' | 'reprise' | 'inaptitude' | 'autre';
export type StatutVisiteMedicale = 'apte' | 'apte_avec_reserves' | 'inapte' | 'en_attente';
export type StatutHabilitation = 'valide' | 'expire' | 'en_cours_renouvellement' | 'suspendu';

export interface Collaborateur {
  id: string;
  user_id: string | null;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string | null;
  site?: string | null; // Deprecated: utiliser site_id
  site_id?: string | null; // FK vers tbl_sites
  responsable_id?: string | null; // Deprecated: utiliser responsable_activite_id
  responsable_activite_id?: string | null; // FK vers collaborateurs (responsable d'activité)
  fonction_metier?: string | null;
  type_contrat?: TypeContrat | null;
  date_embauche?: string | null;
  date_fin_contrat?: string | null;
  statut: StatutCollaborateur;
  competence_principale_id?: string | null;
  competence_secondaire_ids?: string[] | null;
  commentaire?: string | null;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
  updated_by?: string | null;
  
  // Relations
  responsable?: Collaborateur | null; // Deprecated: utiliser responsable_activite
  responsable_activite?: { id: string; nom: string; prenom: string } | null;
  user?: { id: string; email: string } | null;
  site_detail?: { site_code: string; site_label: string } | null;
}

export interface Habilitation {
  id: string;
  collaborateur_id: string;
  type: string;
  libelle: string;
  date_obtention: string;
  date_expiration?: string | null;
  duree_validite_mois?: number | null;
  organisme?: string | null;
  numero_certificat?: string | null;
  statut: StatutHabilitation;
  document_url?: string | null;
  document_signe_id?: string | null;
  commentaire?: string | null;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
  updated_by?: string | null;
}

export interface Dosimetrie {
  id: string;
  collaborateur_id: string;
  numero_dosimetre: string;
  periode_debut: string;
  periode_fin: string;
  dose_trimestrielle_mSv: number;
  dose_annuelle_mSv: number;
  dose_cumulee_mSv: number;
  limite_reglementaire_mSv: number;
  fournisseur?: string | null;
  laboratoire?: string | null;
  rapport_rtr_url?: string | null;
  rapport_rtr_signe_id?: string | null;
  import_source?: 'manuel' | 'csv' | 'api_laboratoire' | null;
  import_date?: string | null;
  import_metadata?: Record<string, unknown> | null;
  commentaire?: string | null;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
  updated_by?: string | null;
}

export interface VisiteMedicale {
  id: string;
  collaborateur_id: string;
  type_visite: TypeVisiteMedicale;
  date_visite: string;
  date_prochaine_visite?: string | null;
  frequence_mois: number;
  centre_medical?: string | null;
  medecin?: string | null;
  statut: StatutVisiteMedicale;
  avis_medical?: string | null;
  restrictions?: string | null;
  certificat_url?: string | null;
  certificat_signe_id?: string | null;
  commentaire?: string | null;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
  updated_by?: string | null;
}

export interface Absence {
  id: string;
  collaborateur_id: string;
  type: TypeAbsence;
  catalogue_absence_id?: string | null; // Nouveau : référence au catalogue
  motif?: string | null;
  date_debut: string;
  date_fin: string;
  heures_absences?: number | null;
  duree_jours?: number | null;
  jours_ouvres?: number | null; // Nouveau : calcul automatique
  jours_ouvrables?: number | null; // Nouveau : calcul automatique
  statut: StatutAbsence;
  
  // Validation N+1
  valide_par_n1?: string | null;
  date_validation_n1?: string | null;
  motif_refus_n1?: string | null;
  
  // Validation RH
  valide_par_rh?: string | null;
  date_validation_rh?: string | null;
  motif_refus_rh?: string | null;
  
  // Champs de compatibilité (dépréciés)
  valide_par?: string | null;
  date_validation?: string | null;
  motif_refus?: string | null;
  
  // Forcer validation RH (cas exceptionnel)
  force_validation_rh?: boolean;
  
  // Justificatifs
  justificatif_url?: string | null;
  justificatif_signe_id?: string | null;
  
  // Impact planification
  impact_planif: boolean;
  
  // Synchronisation externe
  synchro_outlook: boolean;
  outlook_event_id?: string | null;
  synchro_sirh: boolean;
  sirh_export_date?: string | null;
  sirh_export_id?: string | null;
  
  // Métadonnées
  commentaire?: string | null;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
  updated_by?: string | null;
  
  // Relations
  collaborateur?: Collaborateur | null;
  valide_par_user?: { id: string; email: string } | null;
  catalogue_absence?: CatalogueAbsence | null;
  historique_validations?: HistoriqueValidationAbsence[] | null;
}

// Nouveau : Catalogue des absences
export interface CatalogueAbsence {
  id: string;
  code: string;
  libelle: string;
  description?: string | null;
  categorie: 'exceptionnelle' | 'legale' | 'autorisee' | 'conges' | 'non_remuneree';
  duree_max_jours?: number | null;
  duree_min_jours?: number | null;
  besoin_justificatif: boolean;
  besoin_validation_n1: boolean;
  besoin_validation_rh: boolean;
  motif_complementaire?: string | null;
  conditions_particulieres?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
  updated_by?: string | null;
}

// Nouveau : Historique des validations
export interface HistoriqueValidationAbsence {
  id: string;
  absence_id: string;
  niveau_validation: 'n1' | 'rh';
  action: 'validee' | 'refusee' | 'modifiee' | 'creee';
  valide_par: string;
  date_action: string;
  commentaire?: string | null;
  ancien_statut?: string | null;
  nouveau_statut?: string | null;
  created_at: string;
}

export interface Formation {
  id: string;
  collaborateur_id: string;
  libelle: string;
  description?: string | null;
  type_formation?: TypeFormation | null;
  organisme_formateur?: string | null;
  formateur?: string | null;
  date_debut: string;
  date_fin?: string | null;
  duree_heures?: number | null;
  statut: StatutFormation;
  resultat?: string | null;
  note?: number | null;
  attestation_url?: string | null;
  attestation_signe_id?: string | null;
  validee_par?: string | null;
  date_validation?: string | null;
  impact_planif: boolean;
  synchro_outlook: boolean;
  outlook_event_id?: string | null;
  synchro_sirh: boolean;
  sirh_export_date?: string | null;
  sirh_export_id?: string | null;
  commentaire?: string | null;
  
  // Nouveaux champs v2.0
  catalogue_formation_id?: string | null;
  plan_previsionnel_id?: string | null;
  cout_reel?: number | null;
  date_echeance_validite?: string | null;
  priorite?: 'haute' | 'moyenne' | 'basse' | null;
  validite_mois?: number | null;
  
  // Relations
  catalogue_formation?: CatalogueFormation | null;
  plan_previsionnel?: PlanPrevisionnelFormation | null;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
  updated_by?: string | null;
  
  // Relations
  collaborateur?: Collaborateur | null;
}

// Nouveau : Catalogue des formations
export interface CatalogueFormation {
  id: string;
  nom: string;
  code_interne?: string | null;
  description?: string | null;
  categorie?: string | null;
  type_formation?: 'obligatoire' | 'facultative' | 'reglementaire' | null;
  duree_heures?: number | null;
  duree_jours?: number | null;
  periodicite_validite_mois?: number | null;
  cout_unitaire?: number | null;
  organisme_formateur?: string | null;
  prestataire_id?: string | null;
  support_preuve?: string | null;
  template_attestation_url?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
  updated_by?: string | null;
  
  // Relations
  competences?: Array<{ id: string; libelle: string; }> | null;
}

// Nouveau : Plan prévisionnel des formations
export interface PlanPrevisionnelFormation {
  id: string;
  collaborateur_id: string;
  catalogue_formation_id?: string | null;
  formation_libelle?: string | null;
  periode_annee: number;
  periode_mois?: number | null;
  periode_trimestre?: number | null;
  date_cible?: string | null;
  statut_validation: 'en_attente' | 'valide' | 'refusé' | 'archive';
  budget_estime?: number | null;
  priorite?: 'haute' | 'moyenne' | 'basse' | null;
  commentaire_rh?: string | null;
  commentaire_demandeur?: string | null;
  demandeur_id?: string | null;
  date_demande: string;
  valide_par?: string | null;
  date_validation?: string | null;
  motif_refus?: string | null;
  convertie_en_formation_id?: string | null;
  date_conversion?: string | null;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
  updated_by?: string | null;
  
  // Relations
  collaborateur?: Collaborateur | null;
  catalogue_formation?: CatalogueFormation | null;
}

export interface Competence {
  id: string;
  code?: string | null;
  libelle: string;
  description?: string | null;
  categorie?: string | null;
  niveau_requis?: string | null;
  duree_validite_mois?: number | null;
  created_at: string;
  updated_at: string;
}

export interface CollaborateurCompetence {
  id: string;
  collaborateur_id: string;
  competence_id: string;
  niveau?: string | null;
  date_obtention?: string | null;
  date_expiration?: string | null;
  statut: 'valide' | 'expire' | 'en_cours_acquisition' | 'suspendu';
  valide_par?: string | null;
  date_validation?: string | null;
  attestation_url?: string | null;
  created_at: string;
  updated_at: string;
  
  // Relations
  competence?: Competence | null;
}

export interface AlerteEcheance {
  type_alerte: 'habilitation' | 'visite_medicale' | 'competence' | 'contrat_interim';
  id: string;
  collaborateur_id: string;
  nom: string;
  prenom: string;
  email: string;
  libelle_document: string;
  date_expiration: string | null;
  statut_alerte: 'expiree' | 'echeance_proche' | 'ok' | null;
  jours_restants: number | null;
}

