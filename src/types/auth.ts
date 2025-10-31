// Types pour le Module 1: Authentification / Rôles / Permissions

export type UserStatus = 'actif' | 'inactif' | 'suspendu' | 'en_attente';
export type RequestStatus = 'en_attente' | 'acceptee' | 'refusee' | 'archivee';
export type SessionStatus = 'active' | 'terminee' | 'expiree' | 'revoquee';
export type PermissionAction = 'read' | 'write' | 'validate' | 'delete' | 'admin';

export interface User {
  id: string;
  email: string;
  role_id: string | null;
  statut: UserStatus;
  collaborateur_id: string | null;
  date_creation: string;
  derniere_connexion: string | null;
  password_expires_at: string | null;
}

export interface Role {
  id: string;
  name: string;
  description: string | null;
  modules_autorises: string[] | null;
}

export interface Permission {
  id: string;
  role_id: string;
  module: string;
  action: string;
  resource_path: string | null;
}

export interface UserRequest {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  demandeur_id: string | null;
  statut: RequestStatus;
  motif_refus: string | null;
  traite_par: string | null;
  date_traitement: string | null;
  role_attribue_id: string | null;
  site_id: string | null;
  created_at: string;
}

export interface Session {
  id: string;
  user_id: string;
  session_token: string;
  ip_address: string | null;
  user_agent: string | null;
  date_debut: string;
  date_fin: string | null;
  duree_minutes: number | null;
  statut: SessionStatus;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  type_entite: string | null;
  entite_id: string | null;
  details: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

// Rôles applicatifs selon le PRD
export const ROLES = {
  ADMINISTRATEUR: 'Administrateur',
  RESPONSABLE_ACTIVITE: 'Responsable d\'Activité',
  PLANIFICATEUR: 'Planificateur',
  CHARGE_AFFAIRES: 'Chargé d\'Affaires',
  CHEF_CHANTIER: 'Chef de Chantier',
  TECHNICIEN: 'Technicien',
  ADMINISTRATIF_RH: 'Administratif RH',
  CONSULTATION: 'Consultation',
} as const;

export type RoleName = typeof ROLES[keyof typeof ROLES];

