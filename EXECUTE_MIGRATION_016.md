# 🔧 Instructions : Exécuter la migration 016 - Fix ambiguïté user_id pour tbl_sites

## Problème
Lors de la création d'un site, l'erreur suivante apparaît :
```
column reference "user_id" is ambiguous
It could refer to either a PL/pgSQL variable or a table column.
```

Cette erreur empêche la création de sites.

## Solution
Exécuter la migration `016_fix_tbl_sites_ambiguous_user_id.sql` dans Supabase.

## Étapes à suivre

### 1. Ouvrir l'éditeur SQL de Supabase
1. Connectez-vous à votre projet Supabase : https://supabase.com/dashboard
2. Sélectionnez votre projet `xcphklkuxwmhdxnfrhgt`
3. Allez dans **SQL Editor** (menu de gauche)
4. Cliquez sur **New query**

### 2. Copier le contenu de la migration
Ouvrez le fichier `supabase/migrations/016_fix_tbl_sites_ambiguous_user_id.sql` et copiez tout son contenu.

### 3. Coller et exécuter
1. Collez le contenu SQL dans l'éditeur SQL de Supabase
2. Cliquez sur **Run** (ou appuyez sur `Ctrl+Enter`)
3. Vérifiez qu'il n'y a pas d'erreur dans les résultats

### 4. Vérifier le résultat
Après exécution, vous devriez voir :
- ✅ La fonction `set_tbl_sites_user_fields()` créée
- ✅ Le trigger `trigger_tbl_sites_user_fields` créé sur `tbl_sites`

### 5. Tester
1. Essayez de créer un nouveau site dans `/rh/sites`
2. Le site devrait maintenant être créé sans erreur
3. Les champs `created_by` et `updated_by` seront automatiquement remplis avec l'ID de l'utilisateur connecté

## Notes importantes
- Cette migration est **idempotente** : elle peut être exécutée plusieurs fois sans problème
- Le trigger gère automatiquement `created_by`, `updated_by` et `updated_at` lors des INSERT et UPDATE
- Le trigger utilise `SECURITY DEFINER` pour avoir accès à `auth.uid()` même dans un contexte RLS

