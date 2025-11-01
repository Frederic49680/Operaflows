-- Migration 023 : Vérification et correction du rôle Administrateur
-- Ce script permet de vérifier et corriger le rôle Administrateur pour un utilisateur

-- ============================================
-- ÉTAPE 1 : Afficher les informations de l'utilisateur et ses rôles actuels
-- ============================================
-- Remplacez 'admin@operaflow.com' par l'email de votre utilisateur administrateur
SELECT 
    '=== INFORMATIONS UTILISATEUR ===' as info,
    u.email,
    u.id as user_id,
    u.created_at as user_created_at
FROM auth.users u
WHERE u.email = 'admin@operaflow.com';  -- ⚠️ MODIFIEZ CET EMAIL

-- ============================================
-- ÉTAPE 2 : Afficher les rôles actuels de l'utilisateur
-- ============================================
SELECT 
    '=== RÔLES ACTUELS ===' as info,
    r.name as role_name,
    r.description,
    ur.site_id,
    CASE 
        WHEN ur.site_id IS NULL THEN 'GLOBAL'
        ELSE COALESCE(s.site_code || ' - ' || s.site_label, 'Site inconnu')
    END as site,
    ur.created_at as role_attributed_at
FROM auth.users u
INNER JOIN public.user_roles ur ON ur.user_id = u.id
INNER JOIN public.roles r ON ur.role_id = r.id
LEFT JOIN public.tbl_sites s ON ur.site_id::TEXT = s.site_id::TEXT
WHERE u.email = 'admin@operaflow.com'  -- ⚠️ MODIFIEZ CET EMAIL
ORDER BY r.name, site;

-- ============================================
-- ÉTAPE 3 : Vérifier si le rôle Administrateur existe
-- ============================================
SELECT 
    '=== RÔLE ADMINISTRATEUR DISPONIBLE ===' as info,
    r.id as admin_role_id,
    r.name,
    r.description
FROM public.roles r
WHERE r.name = 'Administrateur';

-- ============================================
-- ÉTAPE 4 : Vérifier si l'utilisateur a déjà le rôle Administrateur
-- ============================================
SELECT 
    '=== VÉRIFICATION RÔLE ADMIN ===' as info,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM auth.users u
            INNER JOIN public.user_roles ur ON ur.user_id = u.id
            INNER JOIN public.roles r ON ur.role_id = r.id
            WHERE u.email = 'admin@operaflow.com'  -- ⚠️ MODIFIEZ CET EMAIL
            AND r.name = 'Administrateur'
            AND ur.site_id IS NULL
        ) THEN '✅ L''utilisateur a déjà le rôle Administrateur (GLOBAL)'
        ELSE '⚠️ L''utilisateur N''A PAS le rôle Administrateur'
    END as statut;

-- ============================================
-- ÉTAPE 5 : CORRECTION - Attribuer le rôle Administrateur si nécessaire
-- ============================================
-- ⚠️ DÉCOMMENTEZ ET EXÉCUTEZ CETTE SECTION SI L'UTILISATEUR N'A PAS LE RÔLE
/*
DO $$
DECLARE
    v_user_id UUID;
    v_user_email TEXT := 'admin@operaflow.com';  -- ⚠️ MODIFIEZ CET EMAIL
    v_admin_role_id UUID;
    v_role_existed BOOLEAN := FALSE;
BEGIN
    -- Récupérer l'ID de l'utilisateur
    SELECT id INTO v_user_id 
    FROM auth.users 
    WHERE email = v_user_email 
    LIMIT 1;
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Utilisateur avec email % non trouvé dans auth.users', v_user_email;
    END IF;
    
    -- Récupérer l'ID du rôle Administrateur
    SELECT id INTO v_admin_role_id 
    FROM public.roles 
    WHERE name = 'Administrateur' 
    LIMIT 1;
    
    IF v_admin_role_id IS NULL THEN
        RAISE EXCEPTION 'Rôle Administrateur non trouvé dans public.roles';
    END IF;
    
    -- Vérifier si le rôle existe déjà
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = v_user_id 
        AND role_id = v_admin_role_id
        AND site_id IS NULL
    ) INTO v_role_existed;
    
    IF NOT v_role_existed THEN
        -- Attribuer le rôle Administrateur (global, site_id = NULL)
        INSERT INTO public.user_roles (user_id, role_id, site_id)
        VALUES (v_user_id, v_admin_role_id, NULL)
        ON CONFLICT (user_id, role_id, site_id) DO NOTHING;
        
        RAISE NOTICE '✅ Rôle Administrateur attribué avec succès à %', v_user_email;
    ELSE
        RAISE NOTICE 'ℹ️ Le rôle Administrateur était déjà attribué à %', v_user_email;
    END IF;
    
END $$;
*/

-- ============================================
-- ÉTAPE 6 : Vérification finale après correction
-- ============================================
-- Exécutez cette requête après avoir exécuté l'ÉTAPE 5 pour vérifier
SELECT 
    '=== VÉRIFICATION FINALE ===' as info,
    u.email,
    r.name as role_name,
    CASE 
        WHEN ur.site_id IS NULL THEN 'GLOBAL'
        WHEN s.site_id IS NOT NULL THEN s.site_code || ' - ' || s.site_label
        ELSE 'Site: ' || ur.site_id
    END as site,
    CASE 
        WHEN r.name = 'Administrateur' AND ur.site_id IS NULL THEN '✅ Rôle Administrateur (GLOBAL) confirmé'
        WHEN r.name = 'Administrateur' THEN '⚠️ Rôle Administrateur avec site spécifique'
        ELSE 'ℹ️ Autre rôle'
    END as statut
FROM auth.users u
INNER JOIN public.user_roles ur ON ur.user_id = u.id
INNER JOIN public.roles r ON ur.role_id = r.id
LEFT JOIN public.tbl_sites s ON ur.site_id::UUID = s.site_id
WHERE u.email = 'admin@operaflow.com'  -- ⚠️ MODIFIEZ CET EMAIL
AND r.name = 'Administrateur'
ORDER BY ur.site_id NULLS FIRST;

