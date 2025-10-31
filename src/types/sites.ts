// Types pour le Module 2.2 : Sites & Responsables d'activité

export interface Site {
  site_id: string;
  site_code: string;
  site_label: string;
  parent_site_id?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
  updated_by?: string | null;
}

export interface SiteResponsable {
  site_id: string;
  collaborateur_id: string;
  role_fonctionnel: string; // "Responsable d'activité", "Adjoint", "Suppléant"
  date_debut: string;
  date_fin?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
  updated_by?: string | null;
  
  // Relations
  site?: Site | null;
  collaborateur?: {
    id: string;
    nom: string;
    prenom: string;
    email: string;
  } | null;
}

export interface CollaborateurSite {
  collaborateur_id: string;
  site_id: string;
  priorite: number; // 1 = principal, 2 = secondaire
  date_debut: string;
  date_fin?: string | null;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
  updated_by?: string | null;
  
  // Relations
  site?: Site | null;
  collaborateur?: {
    id: string;
    nom: string;
    prenom: string;
  } | null;
}

export interface SiteAvecResponsables extends Site {
  responsables_actifs: Array<{
    collaborateur_id: string;
    role_fonctionnel: string;
    date_debut: string;
    date_fin?: string | null;
    collaborateur?: {
      nom: string;
      prenom: string;
      email?: string;
    } | null;
  }>;
}

