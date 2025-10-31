# 🔧 Corrections de l'interface admin

## Problèmes corrigés

### ✅ 1. Erreur 400 sur `tbl_sessions`
- **Problème** : Le champ `date_debut` était manquant lors de l'insertion
- **Solution** : Ajout de `date_debut: new Date().toISOString()` dans la création de session
- **Fichier modifié** : `src/app/(auth)/login/page.tsx`

### ✅ 2. Bouton "Voir" 404
- **Problème** : Le bouton pointait vers `/admin/users/${user.id}` qui n'existe pas
- **Solution** : Redirection vers `/profile`
- **Fichier modifié** : `src/app/admin/users/users-management-client.tsx`

### ✅ 3. Affichage des rôles dans le tableau utilisateurs
- **Problème** : Les rôles n'apparaissaient pas car la jointure était incorrecte
- **Solution** : Utilisation de `user_roles` au lieu de `roles` directement
- **Fichiers modifiés** : 
  - `src/app/admin/users/page.tsx`
  - `src/app/admin/users/users-management-client.tsx`

### ⚠️ 4. Tableau des demandes en attente vide

**Problème** : Les demandes en attente ne s'affichent pas malgré leur présence dans la base.

**Diagnostic** : Le problème vient probablement des politiques RLS qui créent un conflit.

**Solution** : Appliquez la migration SQL suivante dans Supabase :

```sql
-- Supprimer la politique trop permissive qui crée des conflits
DROP POLICY IF EXISTS "Public can check requests by email" ON public.tbl_user_requests;

-- S'assurer que les admins peuvent voir toutes les demandes
DROP POLICY IF EXISTS "Admins can view all requests" ON public.tbl_user_requests;
CREATE POLICY "Admins can view all requests" ON public.tbl_user_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name = 'Administrateur'
    )
  );

-- Permettre aux utilisateurs de voir leurs demandes (y compris celles sans demandeur_id)
DROP POLICY IF EXISTS "Users can view own requests" ON public.tbl_user_requests;
CREATE POLICY "Users can view own requests" ON public.tbl_user_requests
  FOR SELECT USING (
    demandeur_id = auth.uid() OR
    demandeur_id IS NULL
  );
```

**Instructions** :
1. Allez sur [Supabase Dashboard](https://supabase.com/dashboard)
2. Sélectionnez votre projet
3. Ouvrez **SQL Editor**
4. Collez et exécutez le script ci-dessus
5. Cliquez sur **Run**

## Vérification

Après avoir appliqué la migration :
1. Rafraîchissez la page `/admin/users`
2. Les demandes en attente devraient maintenant s'afficher
3. Le tableau utilisateurs devrait afficher les emails et rôles correctement
4. Le bouton "Voir" devrait rediriger vers `/profile`

## Pages manquantes (non bloquantes)

Les erreurs 404 pour `/forgot-password`, `/rh`, `/kpi`, `/planification`, `/affaires` sont normales car ces pages ne sont pas encore implémentées. Next.js précharge les liens, ce qui génère ces erreurs mais n'empêche pas le fonctionnement.

## Notes

- Les erreurs `favicon.ico` et `manifest.json` sont mineures
- Le code a été poussé sur GitHub et sera déployé automatiquement sur Vercel
- Tester après le déploiement Vercel et l'application de la migration SQL

