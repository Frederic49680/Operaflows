-- Migration 020 : Fix RLS pour user_roles pour permettre l'affichage des utilisateurs
-- Le problème : Si RLS est activé sur user_roles sans politiques, personne ne peut lire cette table
-- Cela bloque les requêtes avec jointures dans page.tsx

-- Vérifier si RLS est activé sur user_roles
DO $$
BEGIN
  -- Si RLS est activé mais qu'il n'y a pas de politiques, on va en créer
  IF EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'user_roles'
    AND rowsecurity = true
  ) THEN
    -- Supprimer les anciennes politiques si elles existent
    DROP POLICY IF EXISTS "Users can read own roles" ON public.user_roles;
    DROP POLICY IF EXISTS "Admins can read all user_roles" ON public.user_roles;
    DROP POLICY IF EXISTS "Admins can manage all user_roles" ON public.user_roles;
    DROP POLICY IF EXISTS "Authenticated users can read user_roles" ON public.user_roles;
    
    -- Les utilisateurs peuvent lire leurs propres rôles
    CREATE POLICY "Users can read own roles" ON public.user_roles
      FOR SELECT USING (user_id = auth.uid());
    
    -- Les admins peuvent lire toutes les relations user_roles (nécessaire pour afficher les utilisateurs avec leurs rôles)
    CREATE POLICY "Admins can read all user_roles" ON public.user_roles
      FOR SELECT USING (public.is_admin(auth.uid()));
    
    -- Les admins peuvent gérer (INSERT, UPDATE, DELETE) toutes les relations
    CREATE POLICY "Admins can manage all user_roles" ON public.user_roles
      FOR ALL USING (public.is_admin(auth.uid()));
    
    -- Tous les utilisateurs authentifiés peuvent lire les user_roles (pour les listes déroulantes, etc.)
    -- mais seulement pour voir quels rôles existent, pas pour voir qui les a
    -- On va être plus restrictif : seulement les admins peuvent tout voir
    -- Les autres ne voient que leurs propres relations
  ELSE
    -- Si RLS n'est pas activé, on l'active et on crée les politiques
    ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
    
    -- Créer les politiques
    CREATE POLICY "Users can read own roles" ON public.user_roles
      FOR SELECT USING (user_id = auth.uid());
    
    CREATE POLICY "Admins can read all user_roles" ON public.user_roles
      FOR SELECT USING (public.is_admin(auth.uid()));
    
    CREATE POLICY "Admins can manage all user_roles" ON public.user_roles
      FOR ALL USING (public.is_admin(auth.uid()));
  END IF;
END $$;

