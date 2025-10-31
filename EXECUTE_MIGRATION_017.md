# 🔧 Instructions : Exécuter la migration 017 - Fix ambiguïté user_id pour is_admin

## Problème
La fonction `is_admin(user_id UUID)` a le même problème d'ambiguïté que `is_rh_or_admin` : le paramètre `user_id` entre en conflit avec la colonne `ur.user_id` dans la requête SQL.

## Solution
Exécuter la migration `017_fix_is_admin_ambiguous_user_id.sql` dans Supabase.

## Étapes à suivre

### 1. Ouvrir l'éditeur SQL de Supabase
1. Connectez-vous à votre projet Supabase : https://supabase.com/dashboard
2. Sélectionnez votre projet
3. Allez dans **SQL Editor** (menu de gauche)
4. Cliquez sur **New query**

### 2. Copier le contenu de la migration
Ouvrez le fichier `supabase/migrations/017_fix_is_admin_ambiguous_user_id.sql` et copiez tout son contenu.

### 3. Coller et exécuter
1. Collez le contenu SQL dans l'éditeur SQL de Supabase
2. Cliquez sur **Run** (ou appuyez sur `Ctrl+Enter`)
3. Vérifiez qu'il n'y a pas d'erreur dans les résultats

### 4. Vérifier le résultat
Après exécution, vous devriez voir :
- ✅ La fonction `is_admin` recréée avec la variable locale `v_user_id`

### 5. Impact
Cette correction prévient les erreurs d'ambiguïté lors de l'utilisation de la fonction `is_admin` dans les politiques RLS pour :
- `tbl_users`
- `roles`
- `tbl_permissions`
- `tbl_user_requests`
- Et toutes les autres tables utilisant cette fonction

## Notes importantes
- Cette migration est **idempotente** : elle peut être exécutée plusieurs fois sans problème
- La fonction utilise `CREATE OR REPLACE`, donc pas besoin de supprimer les dépendances
- Toutes les politiques RLS utilisant `is_admin()` continueront de fonctionner normalement

