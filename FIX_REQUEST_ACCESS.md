# 🔧 Correction du problème de demande d'accès

## Problème
L'erreur `new row violates row-level security policy for table "tbl_user_requests"` se produit car les utilisateurs non authentifiés ne peuvent pas créer de demandes d'accès.

## Solution

### 1. Appliquer la migration SQL dans Supabase

1. Connectez-vous à [Supabase Dashboard](https://supabase.com/dashboard)
2. Sélectionnez votre projet `xcphklkuxwmhdxnfrhgt`
3. Allez dans **SQL Editor**
4. Collez et exécutez le script suivant :

```sql
-- Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Anyone can create access request" ON public.tbl_user_requests;
DROP POLICY IF EXISTS "Public can check requests by email" ON public.tbl_user_requests;

-- N'importe qui peut créer une demande d'accès (même non authentifié)
CREATE POLICY "Anyone can create access request" ON public.tbl_user_requests
  FOR INSERT WITH CHECK (true);

-- Permet à n'importe qui de vérifier si un email a déjà une demande
CREATE POLICY "Public can check requests by email" ON public.tbl_user_requests
  FOR SELECT USING (true);
```

5. Cliquez sur **Run** pour exécuter

### 2. Vérification

Une fois la migration appliquée, testez à nouveau la page `/request-access` :
- Le formulaire devrait fonctionner
- Les demandes devraient être créées sans erreur
- La vérification d'email existant devrait fonctionner

## Autres corrections apportées

- ✅ Correction de la requête SELECT pour éviter l'erreur avec `.single()` quand aucun résultat
- ✅ Ajout des politiques RLS dans la migration `003_fix_user_requests_rls.sql`
- ✅ Code client mis à jour pour gérer correctement les cas sans résultat

## Note

Les erreurs `favicon.ico:1 404` et `manifest.json:1 Syntax error` sont mineures et n'empêchent pas le fonctionnement. On peut les corriger plus tard en ajoutant :
- Un fichier `favicon.ico` dans `public/`
- Un fichier `manifest.json` correct dans `public/`

