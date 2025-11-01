# Exécution Migration 024 : Statut automatique "A renouveller" pour contrats intérim

## 📋 Description

Cette migration automatise la gestion des statuts "A renouveller" pour les contrats intérim arrivant à expiration dans les 15 jours.

## 🎯 Fonctionnalités

1. **Statut automatique "A renouveller"** : Si un contrat intérim a une date de fin dans les 15 prochains jours, le statut passe automatiquement à "A renouveller"
2. **Alertes dans v_alertes_echeances** : Les contrats intérim à renouveler apparaissent dans la vue des alertes
3. **Trigger automatique** : Le statut est vérifié et mis à jour à chaque INSERT/UPDATE d'un collaborateur
4. **Fonction manuelle** : La fonction `check_interim_contracts()` peut être appelée manuellement ou via cron

## 📝 Étapes d'exécution

### 1. Exécuter la Migration

1. Allez sur [Supabase Dashboard](https://supabase.com/dashboard)
2. Sélectionnez votre projet
3. Allez dans **SQL Editor**
4. Créez une nouvelle requête
5. Copiez-collez le contenu de `supabase/migrations/024_auto_statut_renouveller_interim.sql`
6. Cliquez sur **Run** pour exécuter

### 2. Vérifier l'exécution

La migration devrait s'exécuter sans erreur et afficher un message de succès :

```sql
-- Vérifier que le statut "A renouveller" a été ajouté au CHECK constraint
SELECT constraint_name, check_clause 
FROM information_schema.check_constraints 
WHERE constraint_name = 'collaborateurs_statut_check';
```

### 3. (Optionnel) Configurer le Cron Job

Pour une vérification quotidienne automatique, voir `CONFIGURER_CRON_INTERIM.md`.

### 4. Tester manuellement

Vous pouvez tester la fonction manuellement :

```sql
-- Vérifier les collaborateurs avec contrats intérim à renouveler
SELECT id, nom, prenom, type_contrat, date_fin_contrat, statut
FROM public.collaborateurs
WHERE type_contrat = 'Interim'
  AND date_fin_contrat IS NOT NULL
  AND date_fin_contrat <= CURRENT_DATE + INTERVAL '15 days';

-- Tester la fonction de vérification
SELECT public.check_interim_contracts();
```

## ✅ Vérification post-migration

Après l'exécution, vérifiez que :

1. ✅ Le statut "A renouveller" apparaît dans les options de statut
2. ✅ Les contrats intérim à 15 jours ou moins passent automatiquement à "A renouveller"
3. ✅ Les alertes apparaissent dans la vue `v_alertes_echeances` avec `type_alerte = 'contrat_interim'`
4. ✅ Le badge orange "A renouveller" s'affiche correctement dans l'interface

## ⚠️ Notes importantes

- Le trigger fonctionne en temps réel : chaque modification de collaborateur déclenche la vérification
- Un cron job quotidien est optionnel mais recommandé pour une vérification complète
- Le statut repasse automatiquement à "actif" si la date de fin est modifiée et dépasse les 15 jours

