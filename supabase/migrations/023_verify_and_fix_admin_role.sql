-- Migration 023 : Vérification et correction du rôle Administrateur
-- Ce script permet de vérifier et corriger le rôle Administrateur pour un utilisateur

-- ============================================
-- 1. Vérifier les rôles actuels d'un utilisateur
-- ============================================
-- Remplacer 'VOTRE_USER_ID' par l'ID de votre utilisateur (ou son email)
-- Exemple : SELECT * FROM auth.users WHERE email = 'admin@operaflow.com';

DO $$
DECLARE
    v_user_id UUID;
    v_user_email TEXT;
    v_admin_role_id UUID;
    v_existing_roles RECORD;
BEGIN
    -- Remplacer par l'email de votre utilisateur administrateur
    v_user_email := 'admin@operaflow.com';
    
    -- Récupérer l'ID de l'utilisateur depuis auth.users
    SELECT id INTO v_user_id FROM auth.users WHERE email = v_user_email LIMIT 1;
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Utilisateur avec email % non trouvé dans auth.users', v_user_email;
    END IF;
    
    RAISE NOTICE '🔍 Utilisateur trouvé : % (ID: %)', v_user_email, v_user_id;
    
    -- Récupérer l'ID du rôle Administrateur
    SELECT id INTO v_admin_role_id FROM public.roles WHERE name = 'Administrateur' LIMIT 1;
    
    IF v_admin_role_id IS NULL THEN
        RAISE EXCEPTION 'Rôle Administrateur non trouvé dans public.roles';
    END IF;
    
    RAISE NOTICE '✅ Rôle Administrateur trouvé (ID: %)', v_admin_role_id;
    
    -- Afficher les rôles actuels de l'utilisateur
    RAISE NOTICE '';
    RAISE NOTICE '📋 Rôles actuels de l''utilisateur :';
    FOR v_existing_roles IN
        SELECT 
            ur.id,
            ur.role_id,
            ur.site_id,
            r.name as role_name,
            r.description
        FROM public.user_roles ur
        INNER JOIN public.roles r ON ur.role_id = r.id
        WHERE ur.user_id = v_user_id
    LOOP
        RAISE NOTICE '  - % (ID: %, Site: %)', 
            v_existing_roles.role_name, 
            v_existing_roles.role_id,
            COALESCE(v_existing_roles.site_id::TEXT, 'GLOBAL');
    END LOOP;
    
    -- Vérifier si l'utilisateur a déjà le rôle Administrateur
    IF EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = v_user_id 
        AND role_id = v_admin_role_id
        AND site_id IS NULL
    ) THEN
        RAISE NOTICE '';
        RAISE NOTICE '✅ L''utilisateur a déjà le rôle Administrateur (global)';
    ELSE
        RAISE NOTICE '';
        RAISE NOTICE '⚠️ L''utilisateur N''A PAS le rôle Administrateur';
        RAISE NOTICE '🔧 Attribution du rôle Administrateur...';
        
        -- Supprimer tous les rôles existants de l'utilisateur (optionnel)
        -- Décommenter si vous voulez nettoyer les rôles existants
        -- DELETE FROM public.user_roles WHERE user_id = v_user_id;
        
        -- Attribuer le rôle Administrateur (global, site_id = NULL)
        INSERT INTO public.user_roles (user_id, role_id, site_id)
        VALUES (v_user_id, v_admin_role_id, NULL)
        ON CONFLICT (user_id, role_id, site_id) DO NOTHING;
        
        RAISE NOTICE '✅ Rôle Administrateur attribué avec succès';
    END IF;
    
    -- Vérification finale
    RAISE NOTICE '';
    RAISE NOTICE '🔍 Vérification finale :';
    IF EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = v_user_id 
        AND role_id = v_admin_role_id
        AND site_id IS NULL
    ) THEN
        RAISE NOTICE '✅ SUCCÈS : L''utilisateur a bien le rôle Administrateur';
    ELSE
        RAISE EXCEPTION '❌ ERREUR : L''attribution du rôle Administrateur a échoué';
    END IF;
    
END $$;

-- ============================================
-- 2. Requête pour vérifier manuellement (optionnel)
-- ============================================
-- Pour vérifier manuellement les rôles d'un utilisateur :
/*
SELECT 
    u.email,
    u.id as user_id,
    r.name as role_name,
    r.description,
    ur.site_id,
    CASE 
        WHEN ur.site_id IS NULL THEN 'GLOBAL'
        ELSE s.site_code || ' - ' || s.site_label
    END as site
FROM auth.users u
LEFT JOIN public.user_roles ur ON ur.user_id = u.id
LEFT JOIN public.roles r ON ur.role_id = r.id
LEFT JOIN public.tbl_sites s ON ur.site_id = s.site_id
WHERE u.email = 'admin@operaflow.com'
ORDER BY r.name, site;
*/

