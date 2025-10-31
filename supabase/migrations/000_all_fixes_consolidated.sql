-- ============================================
-- MIGRATION CONSOLIDÉE : Tous les fixes RLS et corrections
-- À exécuter une seule fois pour appliquer toutes les corrections
-- ============================================

-- ============================================
-- 1. Fonction helper pour vérifier si admin (évite récursion)
-- ============================================
-- Note: Utilisation d'une variable locale pour éviter l'ambiguïté avec ur.user_id
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_id UUID;
BEGIN
    -- Stocker le paramètre dans une variable locale pour éviter l'ambiguïté
    v_user_id := user_id;
    
    RETURN EXISTS (
        SELECT 1 
        FROM public.user_roles ur
        INNER JOIN public.roles r ON ur.role_id = r.id
        WHERE ur.user_id = v_user_id 
        AND r.name = 'Administrateur'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 2. Fix RLS pour tbl_users
-- ============================================
DROP POLICY IF EXISTS "Users can read own profile" ON public.tbl_users;
DROP POLICY IF EXISTS "Admins can manage all users" ON public.tbl_users;

CREATE POLICY "Users can read own profile" ON public.tbl_users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can manage all users" ON public.tbl_users
  FOR ALL USING (public.is_admin(auth.uid()));

-- ============================================
-- 3. Fix RLS pour tbl_user_requests
-- ============================================
DROP POLICY IF EXISTS "Anyone can create access request" ON public.tbl_user_requests;
DROP POLICY IF EXISTS "Public can check requests by email" ON public.tbl_user_requests;
DROP POLICY IF EXISTS "Admins can view all requests" ON public.tbl_user_requests;
DROP POLICY IF EXISTS "Users can view own requests" ON public.tbl_user_requests;

CREATE POLICY "Anyone can create access request" ON public.tbl_user_requests
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all requests" ON public.tbl_user_requests
  FOR SELECT USING (public.is_admin(auth.uid()));

CREATE POLICY "Users can view own requests" ON public.tbl_user_requests
  FOR SELECT USING (
    demandeur_id = auth.uid() OR
    demandeur_id IS NULL
  );

-- ============================================
-- 4. Fix RLS pour tbl_sessions
-- ============================================
DROP POLICY IF EXISTS "Users can create own sessions" ON public.tbl_sessions;
DROP POLICY IF EXISTS "Users can view own sessions" ON public.tbl_sessions;

CREATE POLICY "Users can create own sessions" ON public.tbl_sessions
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view own sessions" ON public.tbl_sessions
  FOR SELECT USING (user_id = auth.uid());

-- ============================================
-- 5. Fix RLS pour roles
-- ============================================
DROP POLICY IF EXISTS "Admins can manage roles" ON public.roles;
DROP POLICY IF EXISTS "Users can read roles" ON public.roles;

CREATE POLICY "Admins can manage roles" ON public.roles
  FOR ALL USING (public.is_admin(auth.uid()));

CREATE POLICY "Users can read roles" ON public.roles
  FOR SELECT USING (auth.role() = 'authenticated');

-- ============================================
-- 6. Fix RLS pour tbl_permissions
-- ============================================
DROP POLICY IF EXISTS "Admins can manage permissions" ON public.tbl_permissions;
DROP POLICY IF EXISTS "Authenticated users can read permissions" ON public.tbl_permissions;

CREATE POLICY "Admins can manage permissions" ON public.tbl_permissions
  FOR ALL USING (public.is_admin(auth.uid()));

CREATE POLICY "Authenticated users can read permissions" ON public.tbl_permissions
  FOR SELECT USING (auth.role() = 'authenticated');

-- ============================================
-- 7. Fix RLS pour tbl_audit_log
-- ============================================
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.tbl_audit_log;

CREATE POLICY "Admins can view audit logs" ON public.tbl_audit_log
  FOR SELECT USING (public.is_admin(auth.uid()));

-- ============================================
-- 8. Fix session_token : passer de VARCHAR(255) à TEXT
-- ============================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'tbl_sessions' 
    AND column_name = 'session_token'
    AND data_type = 'character varying'
  ) THEN
    ALTER TABLE public.tbl_sessions 
      ALTER COLUMN session_token TYPE TEXT;
    
    ALTER TABLE public.tbl_sessions 
      DROP CONSTRAINT IF EXISTS tbl_sessions_session_token_key;
    
    CREATE UNIQUE INDEX IF NOT EXISTS idx_tbl_sessions_session_token 
      ON public.tbl_sessions(session_token);
  END IF;
END $$;

