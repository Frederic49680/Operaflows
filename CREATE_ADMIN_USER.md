# 🔐 Création d'un utilisateur Administrateur

## ✅ Étape 1 : Utilisateur créé dans Auth UI

Vous avez déjà créé l'utilisateur `admin@operaflow.com` dans Supabase Auth UI. Parfait !

## 📝 Étape 2 : Attribuer le rôle Administrateur

### Option A : Script SQL complet (recommandé)

1. Ouvrez **Supabase Studio** → **SQL Editor**
2. Copiez-collez le contenu du fichier `supabase/migrations/002_create_admin_user.sql`
3. Cliquez sur **Run** ou **Exécuter**

Le script va automatiquement :
- Trouver l'ID de l'utilisateur `admin@operaflow.com`
- Créer l'entrée dans `tbl_users` avec le statut "actif"
- Attribuer le rôle "Administrateur"

### Option B : Commandes SQL séparées

Si vous préférez exécuter étape par étape :

#### 1. Trouver l'ID de l'utilisateur

```sql
SELECT id, email FROM auth.users WHERE email = 'admin@operaflow.com';
```

**Notez l'ID retourné** (format UUID, ex: `123e4567-e89b-12d3-a456-426614174000`)

#### 2. Créer l'entrée dans tbl_users

Remplacez `VOTRE_USER_ID` par l'ID obtenu à l'étape 1 :

```sql
INSERT INTO public.tbl_users (id, email, statut)
VALUES (
  'VOTRE_USER_ID',
  'admin@operaflow.com',
  'actif'
)
ON CONFLICT (id) DO UPDATE 
SET statut = 'actif';
```

#### 3. Attribuer le rôle Administrateur

**Important** : La contrainte UNIQUE de `user_roles` inclut aussi `site_id`, donc on doit l'inclure dans l'INSERT (NULL pour un admin global) :

```sql
INSERT INTO public.user_roles (user_id, role_id, site_id)
VALUES (
  'VOTRE_USER_ID',
  (SELECT id FROM public.roles WHERE name = 'Administrateur'),
  NULL
)
ON CONFLICT (user_id, role_id, site_id) DO NOTHING;
```

### Option C : Script tout-en-un (copier-coller direct)

Si vous voulez tout faire d'un coup, voici le script complet :

```sql
-- Créer l'entrée dans tbl_users
INSERT INTO public.tbl_users (id, email, statut)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'admin@operaflow.com'),
  'admin@operaflow.com',
  'actif'
)
ON CONFLICT (id) DO UPDATE 
SET statut = 'actif';

-- Attribuer le rôle Administrateur
-- Note: La contrainte UNIQUE inclut (user_id, role_id, site_id)
INSERT INTO public.user_roles (user_id, role_id, site_id)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'admin@operaflow.com'),
  (SELECT id FROM public.roles WHERE name = 'Administrateur'),
  NULL
)
ON CONFLICT (user_id, role_id, site_id) DO NOTHING;

-- Vérification
SELECT 
  u.email,
  u.statut,
  r.name as role_name,
  r.description
FROM public.tbl_users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
LEFT JOIN public.roles r ON ur.role_id = r.id
WHERE u.email = 'admin@operaflow.com';
```

## ✅ Vérification

Après avoir exécuté le script, vous devriez voir :

| email | statut | role_name | description |
|-------|--------|-----------|-------------|
| admin@operaflow.com | actif | Administrateur | Supervise la configuration technique... |

## 🎉 C'est fait !

Vous pouvez maintenant :
1. Vous connecter à l'application avec `admin@operaflow.com` et votre mot de passe
2. Accéder à la page `/admin/users` pour gérer les utilisateurs
3. Accéder à la page `/admin/audit` pour consulter les logs

## 🔒 Sécurité

⚠️ **Important** : Après votre première connexion, pensez à :
- Changer votre mot de passe si c'était un mot de passe provisoire
- Activer l'authentification à deux facteurs si disponible
- Vérifier que votre email est bien confirmé dans Supabase Auth

## 🆘 En cas de problème

Si l'utilisateur n'apparaît pas ou le rôle n'est pas attribué :

1. Vérifiez que l'email est correct dans `auth.users` :
   ```sql
   SELECT * FROM auth.users WHERE email = 'admin@operaflow.com';
   ```

2. Vérifiez que le rôle "Administrateur" existe :
   ```sql
   SELECT * FROM public.roles WHERE name = 'Administrateur';
   ```

3. Vérifiez l'entrée dans `tbl_users` :
   ```sql
   SELECT * FROM public.tbl_users WHERE email = 'admin@operaflow.com';
   ```

4. Vérifiez l'attribution du rôle :
   ```sql
   SELECT * FROM public.user_roles 
   WHERE user_id = (SELECT id FROM auth.users WHERE email = 'admin@operaflow.com');
   ```

