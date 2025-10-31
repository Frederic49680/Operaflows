// Types Supabase générés - À régénérer avec supabase gen types typescript
// Structure minimale pour le build

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
      tbl_users: {
        Row: {
          id: string;
          email: string;
          role_id: string | null;
          statut: string;
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
          statut?: string;
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
          statut?: string;
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
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          modules_autorises?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          modules_autorises?: string[] | null;
          created_at?: string;
          updated_at?: string;
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
      user_roles: {
        Row: {
          id: string;
          user_id: string;
          role_id: string;
          site_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          role_id: string;
          site_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          role_id?: string;
          site_id?: string | null;
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
          statut: string;
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
          statut?: string;
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
          statut?: string;
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
          action: string;
          type_entite: string | null;
          entite_id: string | null;
          user_id: string | null;
          details: Json | null;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          action: string;
          type_entite?: string | null;
          entite_id?: string | null;
          user_id?: string | null;
          details?: Json | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          action?: string;
          type_entite?: string | null;
          entite_id?: string | null;
          user_id?: string | null;
          details?: Json | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
      };
      collaborateurs: {
        Row: {
          id: string;
          user_id: string | null;
          nom: string;
          prenom: string;
          email: string;
          telephone: string | null;
          site: string | null;
          responsable_id: string | null;
          fonction_metier: string | null;
          type_contrat: string | null;
          date_embauche: string | null;
          date_fin_contrat: string | null;
          statut: string;
          competence_principale_id: string | null;
          competence_secondaire_ids: string[] | null;
          commentaire: string | null;
          created_at: string;
          updated_at: string;
          created_by: string | null;
          updated_by: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          nom: string;
          prenom: string;
          email: string;
          telephone?: string | null;
          site?: string | null;
          responsable_id?: string | null;
          fonction_metier?: string | null;
          type_contrat?: string | null;
          date_embauche?: string | null;
          date_fin_contrat?: string | null;
          statut?: string;
          competence_principale_id?: string | null;
          competence_secondaire_ids?: string[] | null;
          commentaire?: string | null;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
          updated_by?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          nom?: string;
          prenom?: string;
          email?: string;
          telephone?: string | null;
          site?: string | null;
          responsable_id?: string | null;
          fonction_metier?: string | null;
          type_contrat?: string | null;
          date_embauche?: string | null;
          date_fin_contrat?: string | null;
          statut?: string;
          competence_principale_id?: string | null;
          competence_secondaire_ids?: string[] | null;
          commentaire?: string | null;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
          updated_by?: string | null;
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

