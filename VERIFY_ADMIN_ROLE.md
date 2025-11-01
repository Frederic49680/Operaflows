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
2. **IMPORTANT** : Remplacez toutes les occurrences de `'admin@operaflow.com'` par votre email administrateur (il y en a plusieurs)
3. Copiez le contenu du fichier dans l'éditeur SQL
4. Cliquez sur **Run** (ou Ctrl+Enter)

### Étape 3 : Vérifier les Résultats

Le script affichera plusieurs tableaux de résultats :

**Tableau 1 : Informations utilisateur**
- L'email, l'ID et la date de création de l'utilisateur

**Tableau 2 : Rôles actuels**
- Tous les rôles actuellement attribués à l'utilisateur
- Vous devriez voir si "Administrateur" est présent ou non

**Tableau 3 : Rôle Administrateur disponible**
- Confirme que le rôle Administrateur existe dans la base

**Tableau 4 : Statut du rôle Admin**
- Indique si l'utilisateur a déjà le rôle Administrateur ou non

### Étape 4 : Corriger le Rôle (si nécessaire)

Si le **Tableau 4** indique que l'utilisateur n'a pas le rôle Administrateur :

1. Dans le fichier `023_verify_and_fix_admin_role.sql`, cherchez la section **ÉTAPE 5**
2. **Décommentez** le bloc `DO $$ ... END $$;` (enlevez les `/*` et `*/`)
3. Vérifiez que l'email dans cette section est correct
4. Exécutez uniquement cette section (ou ré-exécutez tout le script)
5. Le script attribuera automatiquement le rôle Administrateur

### Étape 5 : Vérification Finale

Après la correction, exécutez l'**ÉTAPE 6** pour confirmer que le rôle a bien été attribué.

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

