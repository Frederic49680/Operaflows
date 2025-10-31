-- Module 1 : Authentification / Rôles / Permissions
-- Schéma complet selon PRD Module 1

-- ============================================
-- TABLE: tblUsers (Extension de auth.users)
-- ============================================
CREATE TABLE IF NOT EXISTS public.tbl_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  role_id UUID REFERENCES public.roles(id),
  statut VARCHAR(20) DEFAULT 'en_attente' CHECK (statut IN ('actif', 'inactif', 'suspendu', 'en_attente')),
  collaborateur_id UUID REFERENCES public.collaborateurs(id) ON DELETE SET NULL,
  date_creation TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  derniere_connexion TIMESTAMP WITH TIME ZONE,
  password_expires_at TIMESTAMP WITH TIME ZONE, -- Pour mot de passe provisoire 48h
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_tbl_users_email ON public.tbl_users(email);
CREATE INDEX idx_tbl_users_role_id ON public.tbl_users(role_id);
CREATE INDEX idx_tbl_users_statut ON public.tbl_users(statut);
CREATE INDEX idx_tbl_users_collaborateur_id ON public.tbl_users(collaborateur_id);

-- ============================================
-- TABLE: tblRoles (déjà existante mais on l'améliore)
-- ============================================
-- Si la table n'existe pas encore, la créer
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'roles') THEN
    CREATE TABLE public.roles (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(100) NOT NULL UNIQUE,
      description TEXT,
      modules_autorises TEXT[], -- Liste des modules autorisés
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    CREATE INDEX idx_roles_name ON public.roles(name);
  ELSE
    -- Ajouter la colonne modules_autorises si elle n'existe pas
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'roles' 
      AND column_name = 'modules_autorises'
    ) THEN
      ALTER TABLE public.roles ADD COLUMN modules_autorises TEXT[];
    END IF;
    
    -- Ajouter la colonne updated_at si elle n'existe pas
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'roles' 
      AND column_name = 'updated_at'
    ) THEN
      ALTER TABLE public.roles ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
  END IF;
END $$;

-- ============================================
-- TABLE: tblPermissions (Mappage rôle → actions)
-- ============================================
CREATE TABLE IF NOT EXISTS public.tbl_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  module VARCHAR(100) NOT NULL, -- Ex: 'affaires', 'planification', 'rh', 'kpi'
  action VARCHAR(50) NOT NULL, -- Ex: 'read', 'write', 'validate', 'delete', 'admin'
  resource_path VARCHAR(255), -- Chemin de ressource spécifique (optionnel)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(role_id, module, action, resource_path)
);

CREATE INDEX idx_tbl_permissions_role_id ON public.tbl_permissions(role_id);
CREATE INDEX idx_tbl_permissions_module ON public.tbl_permissions(module);

-- ============================================
-- TABLE: tblSessions (Connexions, durée, IP, logs)
-- ============================================
CREATE TABLE IF NOT EXISTS public.tbl_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token VARCHAR(255) NOT NULL UNIQUE,
  ip_address INET,
  user_agent TEXT,
  date_debut TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  date_fin TIMESTAMP WITH TIME ZONE,
  duree_minutes INTEGER, -- Calculé après la fin de session
  statut VARCHAR(20) DEFAULT 'active' CHECK (statut IN ('active', 'terminee', 'expiree', 'revoquee')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_tbl_sessions_user_id ON public.tbl_sessions(user_id);
CREATE INDEX idx_tbl_sessions_statut ON public.tbl_sessions(statut);
CREATE INDEX idx_tbl_sessions_date_debut ON public.tbl_sessions(date_debut);

-- ============================================
-- TABLE: tblUserRequests (Demandes de création de compte)
-- ============================================
CREATE TABLE IF NOT EXISTS public.tbl_user_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom VARCHAR(100) NOT NULL,
  prenom VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  demandeur_id UUID REFERENCES auth.users(id), -- Qui a fait la demande (RH ou Responsable)
  statut VARCHAR(20) DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'acceptee', 'refusee', 'archivee')),
  motif_refus TEXT,
  traite_par UUID REFERENCES auth.users(id), -- Admin qui a traité
  date_traitement TIMESTAMP WITH TIME ZONE,
  role_attribue_id UUID REFERENCES public.roles(id), -- Si acceptée, rôle attribué
  site_id VARCHAR(100), -- Périmètre attribué
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_tbl_user_requests_statut ON public.tbl_user_requests(statut);
CREATE INDEX idx_tbl_user_requests_email ON public.tbl_user_requests(email);
CREATE INDEX idx_tbl_user_requests_demandeur_id ON public.tbl_user_requests(demandeur_id);

-- ============================================
-- TABLE: tblAuditLog (Journal d'audit)
-- ============================================
CREATE TABLE IF NOT EXISTS public.tbl_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action VARCHAR(100) NOT NULL, -- Ex: 'connexion', 'deconnexion', 'creation_compte', 'attribution_role'
  type_entite VARCHAR(50), -- Ex: 'user', 'role', 'permission'
  entite_id UUID, -- ID de l'entité concernée
  details JSONB, -- Détails de l'action en JSON
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_tbl_audit_log_user_id ON public.tbl_audit_log(user_id);
CREATE INDEX idx_tbl_audit_log_action ON public.tbl_audit_log(action);
CREATE INDEX idx_tbl_audit_log_created_at ON public.tbl_audit_log(created_at);
CREATE INDEX idx_tbl_audit_log_type_entite ON public.tbl_audit_log(type_entite);

-- ============================================
-- TABLE: tblUserRoles (Association users / rôles / périmètres)
-- ============================================
-- Amélioration de la table existante si nécessaire
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_roles') THEN
    CREATE TABLE public.user_roles (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
      site_id VARCHAR(100),
      activite_id VARCHAR(100), -- Optionnel : périmètre par activité
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(user_id, role_id, site_id, activite_id)
    );
    
    CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
    CREATE INDEX idx_user_roles_role_id ON public.user_roles(role_id);
  END IF;
END $$;

-- ============================================
-- TRIGGERS: Mise à jour automatique updated_at
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Application des triggers
DROP TRIGGER IF EXISTS update_tbl_users_updated_at ON public.tbl_users;
CREATE TRIGGER update_tbl_users_updated_at
  BEFORE UPDATE ON public.tbl_users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_tbl_user_requests_updated_at ON public.tbl_user_requests;
CREATE TRIGGER update_tbl_user_requests_updated_at
  BEFORE UPDATE ON public.tbl_user_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- FUNCTION: Mise à jour dernière_connexion
-- ============================================
CREATE OR REPLACE FUNCTION public.update_derniere_connexion()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.date_debut IS NOT NULL AND OLD.date_debut IS DISTINCT FROM NEW.date_debut THEN
    UPDATE public.tbl_users
    SET derniere_connexion = NEW.date_debut
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_derniere_connexion ON public.tbl_sessions;
CREATE TRIGGER trigger_update_derniere_connexion
  AFTER INSERT ON public.tbl_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_derniere_connexion();

-- ============================================
-- FUNCTION: Calcul durée session
-- ============================================
CREATE OR REPLACE FUNCTION public.calculate_session_duration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.date_fin IS NOT NULL AND NEW.date_debut IS NOT NULL THEN
    NEW.duree_minutes = EXTRACT(EPOCH FROM (NEW.date_fin - NEW.date_fin)) / 60;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_calculate_session_duration ON public.tbl_sessions;
CREATE TRIGGER trigger_calculate_session_duration
  BEFORE UPDATE ON public.tbl_sessions
  FOR EACH ROW EXECUTE FUNCTION public.calculate_session_duration();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Activer RLS sur toutes les tables
ALTER TABLE public.tbl_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tbl_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tbl_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tbl_user_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tbl_audit_log ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour tbl_users
-- Les utilisateurs peuvent lire leur propre profil
CREATE POLICY "Users can read own profile" ON public.tbl_users
  FOR SELECT USING (auth.uid() = id);

-- Les administrateurs peuvent tout faire
CREATE POLICY "Admins can manage all users" ON public.tbl_users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name = 'Administrateur'
    )
  );

-- Politiques RLS pour tbl_user_requests
-- Les admins peuvent voir toutes les demandes
CREATE POLICY "Admins can view all requests" ON public.tbl_user_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name = 'Administrateur'
    )
  );

-- Les utilisateurs peuvent voir leurs propres demandes
CREATE POLICY "Users can view own requests" ON public.tbl_user_requests
  FOR SELECT USING (demandeur_id = auth.uid());

-- Politiques RLS pour tbl_sessions
-- Les utilisateurs peuvent voir leurs propres sessions
CREATE POLICY "Users can view own sessions" ON public.tbl_sessions
  FOR SELECT USING (user_id = auth.uid());

-- Politiques RLS pour tbl_audit_log
-- Seuls les admins peuvent consulter les logs d'audit
CREATE POLICY "Admins can view audit logs" ON public.tbl_audit_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name = 'Administrateur'
    )
  );

-- Politiques RLS pour tbl_permissions
-- Lecture publique des permissions (pour vérification côté client)
CREATE POLICY "Authenticated users can read permissions" ON public.tbl_permissions
  FOR SELECT USING (auth.role() = 'authenticated');

-- ============================================
-- INSERTION DES RÔLES PAR DÉFAUT
-- ============================================
INSERT INTO public.roles (name, description, modules_autorises) VALUES
  ('Administrateur', 'Supervise la configuration technique, les rôles et la sécurité', ARRAY['all']),
  ('Responsable d''Activité', 'Supervise les chargés d''affaires et la cohérence opérationnelle', ARRAY['affaires', 'planification', 'kpi']),
  ('Planificateur', 'Valide les plannings et supervise le Gantt multi-sites', ARRAY['planification', 'rh']),
  ('Chargé d''Affaires', 'Gère la vie d''une affaire et ses activités', ARRAY['affaires', 'kpi']),
  ('Chef de Chantier', 'Gère les équipes terrain', ARRAY['planification']),
  ('Technicien', 'Exécute les activités planifiées', ARRAY['planification']),
  ('Administratif RH', 'Gère le personnel, les formations et la conformité', ARRAY['rh', 'kpi']),
  ('Consultation', 'Lecture seule globale', ARRAY['kpi'])
ON CONFLICT (name) DO NOTHING;

