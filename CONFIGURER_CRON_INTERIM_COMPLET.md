# Configuration Complète du Cron Job pour Contrats Intérim

## 📋 Vue d'ensemble

Ce guide explique comment configurer un cron job dans Supabase pour vérifier automatiquement les contrats intérim arrivant à expiration dans les 15 jours.

## 🎯 Fonctionnement

Le cron job exécute la fonction `check_interim_contracts()` **tous les jours à 8h00 du matin** pour :
1. Mettre à jour automatiquement le statut des contrats intérim à "A renouveller" si `date_fin_contrat <= 15 jours`
2. Réinitialiser le statut à "actif" si la date a été modifiée et dépasse les 15 jours

## 📝 Étapes de Configuration

### Option 1 : Configuration Automatique (Recommandée)

#### 1. Activer l'extension pg_cron dans Supabase

1. Allez sur [Supabase Dashboard](https://supabase.com/dashboard)
2. Sélectionnez votre projet
3. Allez dans **Settings** → **Database**
4. Dans la section **Extensions**, recherchez **pg_cron**
5. Cliquez sur **Enable** pour activer l'extension

#### 2. Exécuter la Migration

1. Allez dans **SQL Editor**
2. Exécutez la migration `025_setup_cron_interim_contracts.sql`

La migration :
- ✅ Vérifie si pg_cron est activé
- ✅ Crée automatiquement le cron job
- ✅ Configure l'exécution quotidienne à 8h00

#### 3. Vérifier la Configuration

Exécutez cette requête pour vérifier que le cron job a été créé :

```sql
SELECT 
  jobid,
  jobname,
  schedule,
  command,
  nodename,
  nodeport,
  database,
  username,
  active
FROM cron.job
WHERE jobname = 'check-interim-contracts-daily';
```

Vous devriez voir :
- `jobname`: `check-interim-contracts-daily`
- `schedule`: `0 8 * * *` (tous les jours à 8h00)
- `command`: `SELECT public.check_interim_contracts()`
- `active`: `true`

### Option 2 : Configuration Manuelle

Si l'extension pg_cron n'est pas disponible ou si vous préférez configurer manuellement :

#### 1. Activer pg_cron

Dans Supabase Dashboard → Settings → Database → Extensions → pg_cron → **Enable**

#### 2. Créer le Cron Job Manuellement

Exécutez cette commande dans le SQL Editor :

```sql
SELECT cron.schedule(
  'check-interim-contracts-daily',
  '0 8 * * *',  -- Tous les jours à 8h00 du matin
  $$SELECT public.check_interim_contracts()$$
);
```

## 🔧 Commandes Utiles

### Vérifier tous les cron jobs

```sql
SELECT * FROM cron.job;
```

### Voir les détails du job

```sql
SELECT 
  jobid,
  jobname,
  schedule,
  command,
  nodename,
  nodeport,
  database,
  username,
  active
FROM cron.job
WHERE jobname = 'check-interim-contracts-daily';
```

### Voir l'historique d'exécution

```sql
SELECT 
  jobid,
  runid,
  job_pid,
  database,
  username,
  command,
  status,
  return_message,
  start_time,
  end_time
FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'check-interim-contracts-daily')
ORDER BY start_time DESC
LIMIT 10;
```

### Exécuter le job manuellement (test)

```sql
-- Tester la fonction directement
SELECT public.check_interim_contracts();

-- Voir combien de collaborateurs ont été mis à jour
-- (retourne le nombre de collaborateurs modifiés)
```

### Modifier la planification

Par exemple, pour exécuter tous les jours à 6h00 au lieu de 8h00 :

```sql
-- Supprimer l'ancien job
SELECT cron.unschedule('check-interim-contracts-daily');

-- Créer le nouveau job avec la nouvelle planification
SELECT cron.schedule(
  'check-interim-contracts-daily',
  '0 6 * * *',  -- Tous les jours à 6h00
  $$SELECT public.check_interim_contracts()$$
);
```

### Modifier la fréquence

Exemples de planifications :

```sql
-- Tous les jours à 8h00 (par défaut)
'0 8 * * *'

-- Deux fois par jour (8h00 et 18h00)
'0 8,18 * * *'

-- Tous les jours à minuit
'0 0 * * *'

-- Toutes les 6 heures
'0 */6 * * *'

-- Tous les lundis à 8h00
'0 8 * * 1'

-- Le premier jour de chaque mois à 8h00
'0 8 1 * *'
```

### Désactiver le cron job

```sql
SELECT cron.unschedule('check-interim-contracts-daily');
```

### Réactiver le cron job

Si vous l'avez supprimé, recréez-le :

```sql
SELECT cron.schedule(
  'check-interim-contracts-daily',
  '0 8 * * *',
  $$SELECT public.check_interim_contracts()$$
);
```

## ✅ Vérification du Fonctionnement

### 1. Vérifier que le job est actif

```sql
SELECT active, jobname, schedule 
FROM cron.job 
WHERE jobname = 'check-interim-contracts-daily';
```

### 2. Tester manuellement

```sql
-- Exécuter la fonction manuellement
SELECT public.check_interim_contracts();

-- Vérifier les résultats
SELECT id, nom, prenom, type_contrat, date_fin_contrat, statut
FROM public.collaborateurs
WHERE type_contrat = 'Interim'
  AND statut = 'A renouveller';
```

### 3. Vérifier les alertes

```sql
SELECT *
FROM public.v_alertes_echeances
WHERE type_alerte = 'contrat_interim';
```

## 🕐 Format Cron

Le format cron utilisé par pg_cron est : `minute heure jour mois jour-semaine`

- **minute** : 0-59
- **heure** : 0-23
- **jour** : 1-31
- **mois** : 1-12
- **jour-semaine** : 0-7 (0 et 7 = dimanche)

### Exemples

- `0 8 * * *` → Tous les jours à 8h00
- `0 */2 * * *` → Toutes les 2 heures
- `0 0 * * 1` → Tous les lundis à minuit
- `30 14 1 * *` → Le 1er de chaque mois à 14h30

## ⚠️ Notes Importantes

1. **Extension pg_cron** : Doit être activée dans Supabase Dashboard. Certains plans Supabase peuvent ne pas l'inclure.

2. **Fuseau horaire** : Les heures sont en UTC par défaut. Pour un autre fuseau, ajustez la planification en conséquence.

3. **Dépendances** : Le cron job nécessite que :
   - La migration `024_auto_statut_renouveller_interim.sql` ait été exécutée
   - La fonction `check_interim_contracts()` existe

4. **Monitoring** : Surveillez les exécutions via `cron.job_run_details` pour détecter d'éventuelles erreurs.

5. **Alternative** : Si pg_cron n'est pas disponible, le trigger automatique fonctionne toujours en temps réel lors des INSERT/UPDATE de collaborateurs.

## 🔍 Dépannage

### Le cron job ne s'exécute pas

1. Vérifier que pg_cron est activé :
   ```sql
   SELECT * FROM pg_extension WHERE extname = 'pg_cron';
   ```

2. Vérifier que le job est actif :
   ```sql
   SELECT active FROM cron.job WHERE jobname = 'check-interim-contracts-daily';
   ```

3. Vérifier les logs d'exécution :
   ```sql
   SELECT * FROM cron.job_run_details 
   WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'check-interim-contracts-daily')
   ORDER BY start_time DESC 
   LIMIT 5;
   ```

### Erreur lors de la création

Si vous obtenez une erreur comme `extension "pg_cron" does not exist` :
1. Activez d'abord pg_cron dans Supabase Dashboard
2. Réessayez la création du cron job

### Le trigger fonctionne mais pas le cron

Le trigger fonctionne en temps réel, donc le cron job est optionnel. Il sert principalement à :
- Vérifier tous les collaborateurs quotidiennement
- S'assurer qu'aucun contrat n'est manqué
- Gérer les cas où les dates sont modifiées en dehors de l'application

## 📚 Ressources

- [Documentation pg_cron](https://github.com/citusdata/pg_cron)
- [Documentation Supabase Extensions](https://supabase.com/docs/guides/database/extensions)

