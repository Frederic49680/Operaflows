export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      // Module 1: Authentification / Rôles / Permissions
      tbl_users: {
        Row: {
          id: string;
          email: string;
          role_id: string | null;
          statut: 'actif' | 'inactif' | 'suspendu' | 'en_attente';
          collaborateur_id: string | null;
          date_creation: string;
          derniere_connexion: string | null;
          password_expires_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          role_id?: string | null;
          statut?: 'actif' | 'inactif' | 'suspendu' | 'en_attente';
          collaborateur_id?: string | null;
          date_creation?: string;
          derniere_connexion?: string | null;
          password_expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          role_id?: string | null;
          statut?: 'actif' | 'inactif' | 'suspendu' | 'en_attente';
          collaborateur_id?: string | null;
          date_creation?: string;
          derniere_connexion?: string | null;
          password_expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      roles: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          modules_autorises: string[] | null;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          modules_autorises?: string[] | null;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          modules_autorises?: string[] | null;
          created_at?: string;
          updated_at?: string | null;
        };
      };
      tbl_permissions: {
        Row: {
          id: string;
          role_id: string;
          module: string;
          action: string;
          resource_path: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          role_id: string;
          module: string;
          action: string;
          resource_path?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          role_id?: string;
          module?: string;
          action?: string;
          resource_path?: string | null;
          created_at?: string;
        };
      };
      tbl_sessions: {
        Row: {
          id: string;
          user_id: string;
          session_token: string;
          ip_address: string | null;
          user_agent: string | null;
          date_debut: string;
          date_fin: string | null;
          duree_minutes: number | null;
          statut: 'active' | 'terminee' | 'expiree' | 'revoquee';
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          session_token: string;
          ip_address?: string | null;
          user_agent?: string | null;
          date_debut?: string;
          date_fin?: string | null;
          duree_minutes?: number | null;
          statut?: 'active' | 'terminee' | 'expiree' | 'revoquee';
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          session_token?: string;
          ip_address?: string | null;
          user_agent?: string | null;
          date_debut?: string;
          date_fin?: string | null;
          duree_minutes?: number | null;
          statut?: 'active' | 'terminee' | 'expiree' | 'revoquee';
          created_at?: string;
        };
      };
      tbl_user_requests: {
        Row: {
          id: string;
          nom: string;
          prenom: string;
          email: string;
          demandeur_id: string | null;
          statut: 'en_attente' | 'acceptee' | 'refusee' | 'archivee';
          motif_refus: string | null;
          traite_par: string | null;
          date_traitement: string | null;
          role_attribue_id: string | null;
          site_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          nom: string;
          prenom: string;
          email: string;
          demandeur_id?: string | null;
          statut?: 'en_attente' | 'acceptee' | 'refusee' | 'archivee';
          motif_refus?: string | null;
          traite_par?: string | null;
          date_traitement?: string | null;
          role_attribue_id?: string | null;
          site_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nom?: string;
          prenom?: string;
          email?: string;
          demandeur_id?: string | null;
          statut?: 'en_attente' | 'acceptee' | 'refusee' | 'archivee';
          motif_refus?: string | null;
          traite_par?: string | null;
          date_traitement?: string | null;
          role_attribue_id?: string | null;
          site_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      tbl_audit_log: {
        Row: {
          id: string;
          user_id: string | null;
          action: string;
          type_entite: string | null;
          entite_id: string | null;
          details: Json | null;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          action: string;
          type_entite?: string | null;
          entite_id?: string | null;
          details?: Json | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          action?: string;
          type_entite?: string | null;
          entite_id?: string | null;
          details?: Json | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
      };
      user_roles: {
        Row: {
          id: string;
          user_id: string;
          role_id: string;
          site_id: string | null;
          activite_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          role_id: string;
          site_id?: string | null;
          activite_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          role_id?: string;
          site_id?: string | null;
          activite_id?: string | null;
          created_at?: string;
        };
      };
      // Module 2: RH Collaborateurs
      collaborateurs: {
        Row: {
          id: string;
          user_id: string | null;
          nom: string;
          prenom: string;
          email: string;
          site: string | null;
          responsable_id: string | null;
          date_embauche: string | null;
          date_fin_contrat: string | null;
          statut: 'actif' | 'inactif' | 'suspendu';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          nom: string;
          prenom: string;
          email: string;
          site?: string | null;
          responsable_id?: string | null;
          date_embauche?: string | null;
          date_fin_contrat?: string | null;
          statut?: 'actif' | 'inactif' | 'suspendu';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          nom?: string;
          prenom?: string;
          email?: string;
          site?: string | null;
          responsable_id?: string | null;
          date_embauche?: string | null;
          date_fin_contrat?: string | null;
          statut?: 'actif' | 'inactif' | 'suspendu';
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

