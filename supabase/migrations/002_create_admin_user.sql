-- Script pour créer un utilisateur administrateur
-- À exécuter après avoir créé l'utilisateur dans Supabase Auth UI

-- ============================================
-- ÉTAPE 1 : Trouver l'ID de l'utilisateur créé dans auth.users
-- ============================================
-- Exécutez d'abord cette requête pour voir l'ID de votre utilisateur :
-- SELECT id, email FROM auth.users WHERE email = 'admin@operaflow.com';

-- ============================================
-- ÉTAPE 2 : Créer l'entrée dans tbl_users
-- ============================================
INSERT INTO public.tbl_users (id, email, statut)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'admin@operaflow.com'),
  'admin@operaflow.com',
  'actif'
)
ON CONFLICT (id) DO UPDATE 
SET statut = 'actif';

-- ============================================
-- ÉTAPE 3 : Attribuer le rôle Administrateur
-- ============================================
-- IMPORTANT: La contrainte UNIQUE de user_roles inclut (user_id, role_id, site_id)
-- On doit donc inclure site_id dans l'INSERT (NULL pour un admin global)
INSERT INTO public.user_roles (user_id, role_id, site_id)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'admin@operaflow.com'),
  (SELECT id FROM public.roles WHERE name = 'Administrateur'),
  NULL
)
ON CONFLICT (user_id, role_id, site_id) DO NOTHING;

-- ============================================
-- VÉRIFICATION
-- ============================================
-- Exécutez cette requête pour vérifier que tout est correct :
SELECT 
  u.email,
  u.statut,
  r.name as role_name,
  r.description
FROM public.tbl_users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
LEFT JOIN public.roles r ON ur.role_id = r.id
WHERE u.email = 'admin@operaflow.com';
