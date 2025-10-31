-- ============================================
-- Migration 008: Restaurer le rôle Administrateur
-- Remplacez 'admin@operaflow.com' par votre email
-- ============================================

-- Étape 1: Récupérer l'ID du rôle Administrateur
DO $$
DECLARE
  admin_role_id UUID;
  user_email TEXT := 'admin@operaflow.com'; -- ⚠️ REMPLACEZ PAR VOTRE EMAIL
  user_id_to_update UUID;
BEGIN
  -- Récupérer l'ID du rôle Administrateur
  SELECT id INTO admin_role_id
  FROM public.roles
  WHERE name = 'Administrateur'
  LIMIT 1;

  IF admin_role_id IS NULL THEN
    RAISE EXCEPTION 'Le rôle Administrateur n''existe pas. Veuillez d''abord créer ce rôle.';
  END IF;

  -- Récupérer l'ID de l'utilisateur depuis auth.users
  SELECT id INTO user_id_to_update
  FROM auth.users
  WHERE email = user_email
  LIMIT 1;

  IF user_id_to_update IS NULL THEN
    RAISE EXCEPTION 'Utilisateur avec l''email % introuvable. Vérifiez l''email.', user_email;
  END IF;

  -- Supprimer les anciennes associations de rôles pour cet utilisateur
  DELETE FROM public.user_roles
  WHERE user_id = user_id_to_update;

  -- Attribuer le rôle Administrateur
  INSERT INTO public.user_roles (user_id, role_id, site_id)
  VALUES (user_id_to_update, admin_role_id, NULL)
  ON CONFLICT (user_id, role_id, site_id) DO NOTHING;

  RAISE NOTICE 'Rôle Administrateur attribué avec succès à % (ID: %)', user_email, user_id_to_update;
END $$;

-- Alternative: Si vous connaissez votre user_id directement, utilisez ce script :
-- Remplacez 'VOTRE_USER_ID_ICI' par votre UUID d'utilisateur
/*
DO $$
DECLARE
  admin_role_id UUID;
  user_id_to_update UUID := 'VOTRE_USER_ID_ICI'::UUID;
BEGIN
  SELECT id INTO admin_role_id
  FROM public.roles
  WHERE name = 'Administrateur'
  LIMIT 1;

  DELETE FROM public.user_roles WHERE user_id = user_id_to_update;

  INSERT INTO public.user_roles (user_id, role_id, site_id)
  VALUES (user_id_to_update, admin_role_id, NULL)
  ON CONFLICT (user_id, role_id, site_id) DO NOTHING;

  RAISE NOTICE 'Rôle Administrateur restauré';
END $$;
*/

