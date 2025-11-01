# Migration 021 : Correction de la récursion infinie dans les politiques RLS de collaborateurs

## Problème

Lors de la création d'un collaborateur, une erreur `infinite recursion detected in policy for relation "collaborateurs"` se produit.

Cela est dû aux politiques RLS qui font des sous-requêtes sur la même table `collaborateurs`, créant une boucle infinie.

## Solution

Cette migration :
1. Crée des fonctions helper avec `SECURITY DEFINER` pour contourner RLS lors des vérifications
2. Remplace les politiques récursives par des politiques simples utilisant ces fonctions

## Exécution

```bash
# Dans Supabase Dashboard > SQL Editor, exécutez le contenu de :
supabase/migrations/021_fix_collaborateurs_rls_recursion.sql
```

## Vérification

Après exécution, testez la création d'un collaborateur. Cela devrait fonctionner sans erreur de récursion.

