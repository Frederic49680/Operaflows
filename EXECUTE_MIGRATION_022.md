# Migration 022 : Force fix pour les politiques RLS de collaborateurs

## Problème

Même après la migration 021, les collaborateurs ne s'affichent toujours pas dans le tableau et il y a toujours des erreurs 404.

## Solution

Cette migration :
1. **Force la suppression de TOUTES les politiques existantes** sur `collaborateurs` (même celles créées ailleurs)
2. **Recrée toutes les politiques dans le bon ordre** avec des politiques explicites pour chaque opération (SELECT, INSERT, UPDATE, DELETE)
3. **Sépare les politiques RH/Admin** en politiques distinctes pour chaque opération pour plus de clarté
4. **Vérifie que les politiques sont bien créées** à la fin

## Exécution

```bash
# Dans Supabase Dashboard > SQL Editor, exécutez le contenu de :
supabase/migrations/022_force_fix_collaborateurs_rls.sql
```

## Différences avec la migration 021

Cette migration :
- Supprime **toutes** les politiques existantes (pas seulement celles nommées)
- Crée des politiques **séparées** pour INSERT, UPDATE, DELETE (au lieu de FOR ALL)
- Vérifie que les politiques sont créées à la fin

## Vérification

Après exécution :
1. Vérifiez dans Supabase Dashboard > Table Editor > collaborateurs > RLS Policies
2. Vous devriez voir 9 politiques :
   - Users can read own collaborateur profile
   - RH/Admin can read all collaborateurs
   - Responsables can read their team
   - Users can create own profile
   - RH/Admin can insert collaborateurs
   - Responsables can insert team members
   - Users can update own profile
   - RH/Admin can update all collaborateurs
   - RH/Admin can delete all collaborateurs

3. Testez ensuite :
   - L'affichage de la liste des collaborateurs
   - L'accès à la page de détail d'un collaborateur
   - La création d'un nouveau collaborateur

