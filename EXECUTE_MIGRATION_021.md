# Migration 021 : Correction de la récursion infinie dans les politiques RLS de collaborateurs

## Problème

1. Lors de la création d'un collaborateur, une erreur `infinite recursion detected in policy for relation "collaborateurs"` se produit.
2. Les collaborateurs ne s'affichent pas dans la liste même pour les RH/Admin.
3. Erreur 404 lors de l'accès à la page de détail d'un collaborateur.

Cela est dû aux politiques RLS qui font des sous-requêtes sur la même table `collaborateurs`, créant une boucle infinie. De plus, il manquait une politique explicite `FOR SELECT` pour les RH/Admin.

## Solution

Cette migration :
1. Crée des fonctions helper avec `SECURITY DEFINER` pour contourner RLS lors des vérifications
2. Remplace les politiques récursives par des politiques simples utilisant ces fonctions
3. Ajoute une politique explicite `FOR SELECT` pour permettre aux RH/Admin de lire tous les collaborateurs (en plus de `FOR ALL`)

## Exécution

```bash
# Dans Supabase Dashboard > SQL Editor, exécutez le contenu de :
supabase/migrations/021_fix_collaborateurs_rls_recursion.sql
```

**Note** : Si la migration a déjà été exécutée précédemment, pas de problème ! Le script utilise `DROP POLICY IF EXISTS` et `CREATE OR REPLACE FUNCTION`, donc il peut être ré-exécuté sans danger.

## Vérification

Après exécution :
1. Testez la création d'un collaborateur - cela devrait fonctionner sans erreur de récursion
2. Vérifiez que les collaborateurs s'affichent dans la liste pour les utilisateurs RH/Admin
3. Vérifiez que l'accès à la page de détail fonctionne sans erreur 404

