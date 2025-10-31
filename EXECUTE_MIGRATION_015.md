# 🔧 Instructions : Exécuter la migration RLS pour tbl_sites

## Problème
Les sites ne s'affichent pas dans :
- La page `/rh/sites` (liste des sites)
- Le formulaire de création de collaborateur (`/rh/new` - dropdown "Site principal")

**Cause** : Les politiques RLS (Row Level Security) bloquent la lecture de la table `tbl_sites`.

## Solution
Exécuter la migration `015_fix_tbl_sites_rls.sql` dans Supabase.

## Étapes à suivre

### 1. Ouvrir l'éditeur SQL de Supabase
1. Connectez-vous à votre projet Supabase : https://supabase.com/dashboard
2. Sélectionnez votre projet `xcphklkuxwmhdxnfrhgt`
3. Allez dans **SQL Editor** (menu de gauche)
4. Cliquez sur **New query**

### 2. Copier le contenu de la migration
Ouvrez le fichier `supabase/migrations/015_fix_tbl_sites_rls.sql` et copiez tout son contenu.

### 3. Coller et exécuter
1. Collez le contenu SQL dans l'éditeur SQL de Supabase
2. Cliquez sur **Run** (ou appuyez sur `Ctrl+Enter`)
3. Vérifiez qu'il n'y a pas d'erreur dans les résultats

### 4. Vérifier le résultat
Après exécution, vous devriez voir :
- ✅ Les politiques RLS créées pour `tbl_sites` et `tbl_site_responsables`
- ✅ La fonction `is_rh_or_admin` créée ou mise à jour

### 5. Tester
1. Rafraîchissez la page `/rh/sites` - les sites devraient s'afficher
2. Allez sur `/rh/new` - le dropdown "Site principal" devrait être rempli

## Notes importantes
- Cette migration est **idempotente** : elle peut être exécutée plusieurs fois sans problème
- Si vous rencontrez une erreur, vérifiez que la migration `011_module2_rh_complete.sql` a été exécutée (elle crée la fonction `is_rh_or_admin`)
- Les logs de debug dans la console du navigateur (F12) vous aideront à diagnostiquer les problèmes restants

## Contenu de la migration (pour référence)

```sql
-- Migration 015 : Fix RLS pour tbl_sites
-- Corrige les politiques RLS pour permettre l'affichage des sites

-- Supprimer les anciennes politiques
DROP POLICY IF EXISTS "Anyone can view active sites" ON public.tbl_sites;
DROP POLICY IF EXISTS "Admins and RH can manage sites" ON public.tbl_sites;

-- Vérifier que la fonction is_rh_or_admin existe (définie dans migration 011)
-- Si elle n'existe pas, la créer
[... voir le fichier complet ...]

-- Nouvelle politique : Utilisateurs authentifiés peuvent voir les sites actifs
CREATE POLICY "Authenticated users can view active sites"
    ON public.tbl_sites FOR SELECT
    USING (
        auth.uid() IS NOT NULL 
        AND is_active = true
    );

-- Nouvelle politique : RH/Admin peuvent voir tous les sites (actifs et inactifs)
CREATE POLICY "RH/Admin can view all sites"
    ON public.tbl_sites FOR SELECT
    USING (public.is_rh_or_admin(auth.uid()));

-- Nouvelle politique : RH/Admin peuvent gérer tous les sites
CREATE POLICY "RH/Admin can manage all sites"
    ON public.tbl_sites FOR ALL
    USING (public.is_rh_or_admin(auth.uid()))
    WITH CHECK (public.is_rh_or_admin(auth.uid()));
```

