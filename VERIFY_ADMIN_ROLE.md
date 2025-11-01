# Vérification et Correction du Rôle Administrateur

## Problème

Après certaines migrations, le rôle Administrateur peut ne plus être reconnu correctement, causant des erreurs d'accès aux pages RH et autres fonctionnalités administratives.

## Solution

Exécuter la migration `023_verify_and_fix_admin_role.sql` dans Supabase Dashboard pour :
1. Vérifier les rôles actuels de l'utilisateur
2. Attacher le rôle Administrateur si absent
3. Afficher un rapport de vérification

## Instructions

### Étape 1 : Ouvrir Supabase Dashboard

1. Connectez-vous à [Supabase Dashboard](https://app.supabase.com)
2. Sélectionnez votre projet
3. Allez dans **SQL Editor**

### Étape 2 : Modifier et Exécuter la Migration

1. Ouvrez le fichier `supabase/migrations/023_verify_and_fix_admin_role.sql`
2. **IMPORTANT** : Modifiez la ligne avec l'email de votre utilisateur administrateur :
   ```sql
   v_user_email := 'admin@operaflow.com';  -- Remplacez par votre email
   ```
3. Copiez le contenu du fichier dans l'éditeur SQL
4. Cliquez sur **Run** (ou Ctrl+Enter)

### Étape 3 : Vérifier les Résultats

Le script affichera :
- ✅ L'ID de l'utilisateur trouvé
- ✅ L'ID du rôle Administrateur
- 📋 La liste des rôles actuels de l'utilisateur
- ✅ Confirmation que le rôle Administrateur est bien attribué

### Vérification Manuelle (Optionnel)

Si vous voulez vérifier manuellement, exécutez cette requête dans SQL Editor :

```sql
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
WHERE u.email = 'admin@operaflow.com'  -- Remplacez par votre email
ORDER BY r.name, site;
```

Vous devriez voir une ligne avec :
- `role_name` = `Administrateur`
- `site` = `GLOBAL`

## Notes

- Le script utilise `ON CONFLICT DO NOTHING` pour éviter les doublons
- Le rôle Administrateur est attribué **globalement** (`site_id = NULL`)
- Si vous voulez nettoyer les rôles existants avant, décommentez la ligne `DELETE FROM public.user_roles WHERE user_id = v_user_id;`

## Après Correction

Une fois le rôle Administrateur corrigé, l'utilisateur devrait pouvoir :
- ✅ Accéder aux pages RH (`/rh`)
- ✅ Accéder aux pages d'administration (`/admin/*`)
- ✅ Voir tous les collaborateurs dans la liste
- ✅ Accéder aux pages de détail des collaborateurs

