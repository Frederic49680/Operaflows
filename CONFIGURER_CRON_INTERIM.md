# Configuration du Cron Job pour Vérification Automatique des Contrats Intérim

Cette migration automatise la gestion des statuts "A renouveller" pour les contrats intérim arrivant à expiration dans les 15 jours.

## Fonctionnalités

1. **Statut automatique "A renouveller"** : Si un contrat intérim a une date de fin dans les 15 prochains jours, le statut passe automatiquement à "A renouveller"
2. **Alertes dans v_alertes_echeances** : Les contrats intérim à renouveler apparaissent dans la vue des alertes
3. **Trigger automatique** : Le statut est vérifié et mis à jour à chaque INSERT/UPDATE d'un collaborateur
4. **Fonction manuelle** : La fonction `check_interim_contracts()` peut être appelée manuellement ou via cron

## Étapes de Configuration

### 1. Exécuter la Migration

```sql
-- Exécuter dans Supabase SQL Editor
-- Fichier: supabase/migrations/024_auto_statut_renouveller_interim.sql
```

### 2. Configurer le Cron Job (Optionnel mais Recommandé)

Pour vérifier automatiquement tous les jours à 8h du matin, créer un cron job dans Supabase :

#### Via Supabase Dashboard

1. Aller dans **Database** > **Cron Jobs**
2. Cliquer sur **New Cron Job**
3. Configurer :
   - **Name**: `check-interim-contracts-daily`
   - **Schedule**: `0 8 * * *` (tous les jours à 8h)
   - **Command**: 
     ```sql
     SELECT public.check_interim_contracts();
     ```

#### Via SQL Direct

```sql
-- Activer l'extension pg_cron si pas déjà fait
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Créer le cron job
SELECT cron.schedule(
  'check-interim-contracts-daily',
  '0 8 * * *',  -- Tous les jours à 8h du matin (format: minute heure jour mois jour-semaine)
  $$SELECT public.check_interim_contracts()$$
);
```

### 3. Vérifier le Fonctionnement

```sql
-- Vérifier les collaborateurs avec statut "A renouveller"
SELECT id, nom, prenom, type_contrat, date_fin_contrat, statut
FROM public.collaborateurs
WHERE statut = 'A renouveller';

-- Vérifier les alertes de contrats intérim
SELECT *
FROM public.v_alertes_echeances
WHERE type_alerte = 'contrat_interim';

-- Tester la fonction manuellement
SELECT public.check_interim_contracts();
```

## Comportement

### Mise à Jour Automatique

Le trigger `trigger_check_interim_contracts` s'exécute :
- **Avant INSERT** : Vérifie si un nouveau collaborateur avec contrat intérim doit avoir le statut "A renouveller"
- **Avant UPDATE** : Vérifie et met à jour le statut si la date de fin change

### Conditions pour "A renouveller"

Le statut passe à "A renouveller" si :
- `type_contrat = 'Interim'`
- `statut = 'actif'`
- `date_fin_contrat IS NOT NULL`
- `date_fin_contrat > CURRENT_DATE` (pas encore expiré)
- `date_fin_contrat <= CURRENT_DATE + INTERVAL '15 days'` (dans les 15 jours)

### Réinitialisation

Le statut repasse à "actif" si :
- La date de fin est modifiée et dépasse les 15 jours
- La date de fin est supprimée (NULL)
- La date de fin est passée (expirée)

## Vues et Alertes

Les contrats intérim à renouveler apparaissent automatiquement dans `v_alertes_echeances` avec :
- `type_alerte = 'contrat_interim'`
- `statut_alerte = 'echeance_proche'` si <= 15 jours
- `statut_alerte = 'expiree'` si date passée
- `jours_restants` : nombre de jours restants avant expiration

## Notes

- Le cron job est optionnel car le trigger gère déjà les mises à jour en temps réel
- Le cron job est utile pour s'assurer que tous les collaborateurs sont vérifiés quotidiennement
- La fonction peut également être appelée manuellement depuis le code ou via une API

