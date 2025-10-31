# 🔧 Restaurer le rôle Administrateur

Si vous avez perdu votre rôle Administrateur suite à une migration, utilisez ce guide pour le restaurer.

## Méthode 1 : Par email (recommandé)

1. Allez sur [Supabase Dashboard](https://supabase.com/dashboard)
2. Sélectionnez votre projet
3. Ouvrez **SQL Editor**
4. Exécutez le script suivant en remplaçant `admin@operaflow.com` par votre email :

```sql
DO $$
DECLARE
  admin_role_id UUID;
  user_email TEXT := 'admin@operaflow.com'; -- ⚠️ REMPLACEZ ICI
  user_id_to_update UUID;
BEGIN
  -- Récupérer l'ID du rôle Administrateur
  SELECT id INTO admin_role_id
  FROM public.roles
  WHERE name = 'Administrateur'
  LIMIT 1;

  IF admin_role_id IS NULL THEN
    RAISE EXCEPTION 'Le rôle Administrateur n''existe pas';
  END IF;

  -- Récupérer l'ID de l'utilisateur
  SELECT id INTO user_id_to_update
  FROM auth.users
  WHERE email = user_email
  LIMIT 1;

  IF user_id_to_update IS NULL THEN
    RAISE EXCEPTION 'Utilisateur introuvable : %', user_email;
  END IF;

  -- Supprimer les anciennes associations
  DELETE FROM public.user_roles
  WHERE user_id = user_id_to_update;

  -- Attribuer le rôle Administrateur
  INSERT INTO public.user_roles (user_id, role_id, site_id)
  VALUES (user_id_to_update, admin_role_id, NULL)
  ON CONFLICT (user_id, role_id, site_id) DO NOTHING;

  RAISE NOTICE '✅ Rôle Administrateur restauré pour %', user_email;
END $$;
```

5. Cliquez sur **Run**

## Méthode 2 : Par user_id

Si vous connaissez votre `user_id` (UUID), utilisez ce script :

```sql
DO $$
DECLARE
  admin_role_id UUID;
  user_id_to_update UUID := 'VOTRE_USER_ID_ICI'::UUID; -- ⚠️ REMPLACEZ ICI
BEGIN
  SELECT id INTO admin_role_id
  FROM public.roles
  WHERE name = 'Administrateur'
  LIMIT 1;

  DELETE FROM public.user_roles WHERE user_id = user_id_to_update;

  INSERT INTO public.user_roles (user_id, role_id, site_id)
  VALUES (user_id_to_update, admin_role_id, NULL)
  ON CONFLICT (user_id, role_id, site_id) DO NOTHING;

  RAISE NOTICE '✅ Rôle Administrateur restauré';
END $$;
```

## Méthode 3 : Via Supabase Studio (interface)

1. Allez dans **Table Editor** → `user_roles`
2. Cliquez sur **Insert row**
3. Remplissez :
   - `user_id` : Votre UUID (trouvé dans `auth.users`)
   - `role_id` : L'ID du rôle Administrateur (trouvé dans `roles` où `name = 'Administrateur'`)
   - `site_id` : NULL
4. Cliquez sur **Save**

## Vérification

Après avoir restauré le rôle :

1. Déconnectez-vous de l'application
2. Reconnectez-vous
3. Allez sur `/admin/users` ou `/admin/roles`
4. Vous devriez avoir accès aux pages admin

## Trouver votre user_id

Si vous ne connaissez pas votre `user_id`, exécutez ce script :

```sql
-- Voir tous les utilisateurs avec leurs emails
SELECT 
  au.id as user_id,
  au.email,
  au.created_at,
  tu.statut,
  r.name as role_name
FROM auth.users au
LEFT JOIN public.tbl_users tu ON tu.id = au.id
LEFT JOIN public.user_roles ur ON ur.user_id = au.id
LEFT JOIN public.roles r ON r.id = ur.role_id
ORDER BY au.created_at DESC;
```

Cela vous affichera tous les utilisateurs avec leurs rôles actuels.

