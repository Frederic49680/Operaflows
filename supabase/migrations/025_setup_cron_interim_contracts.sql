-- Migration 025 : Configuration du cron job pour vérification automatique des contrats intérim
-- Ce cron job exécute la fonction check_interim_contracts() tous les jours à 8h du matin

-- ============================================
-- 1. Activer l'extension pg_cron si disponible
-- ============================================
-- Note: L'extension pg_cron doit être activée dans Supabase Dashboard
-- Settings → Database → Extensions → pg_cron → Enable
-- Si l'extension n'est pas disponible, cette migration échouera avec un message clair

DO $$
BEGIN
  -- Vérifier si l'extension existe
  IF NOT EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
  ) THEN
    -- Essayer d'activer l'extension
    BEGIN
      CREATE EXTENSION IF NOT EXISTS pg_cron;
      RAISE NOTICE 'Extension pg_cron activée avec succès';
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Extension pg_cron non disponible. Veuillez l''activer dans Supabase Dashboard (Settings → Database → Extensions). Message: %', SQLERRM;
      -- Ne pas échouer la migration si pg_cron n'est pas disponible
      -- Le cron job pourra être configuré manuellement plus tard
      RETURN;
    END;
  ELSE
    RAISE NOTICE 'Extension pg_cron déjà activée';
  END IF;
END $$;

-- ============================================
-- 2. Supprimer le cron job existant s'il existe (idempotence)
-- ============================================
DO $$
BEGIN
  -- Supprimer le cron job s'il existe déjà
  IF EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'check-interim-contracts-daily'
  ) THEN
    PERFORM cron.unschedule('check-interim-contracts-daily');
    RAISE NOTICE 'Cron job existant supprimé';
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Ignorer l'erreur si pg_cron n'est pas disponible
  RAISE WARNING 'Impossible de supprimer le cron job existant. pg_cron peut ne pas être disponible. Message: %', SQLERRM;
END $$;

-- ============================================
-- 3. Créer le cron job pour vérification quotidienne
-- ============================================
-- Format cron: 'minute heure jour mois jour-semaine'
-- '0 8 * * *' = Tous les jours à 8h00 du matin

DO $$
BEGIN
  -- Vérifier que pg_cron est disponible avant de créer le job
  IF EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
  ) THEN
    -- Créer le cron job
    PERFORM cron.schedule(
      'check-interim-contracts-daily',           -- Nom du job
      '0 8 * * *',                               -- Tous les jours à 8h00
      $$SELECT public.check_interim_contracts()$$ -- Fonction à exécuter
    );
    
    RAISE NOTICE 'Cron job "check-interim-contracts-daily" créé avec succès';
    RAISE NOTICE 'Le job s''exécutera tous les jours à 8h00 du matin';
  ELSE
    RAISE WARNING 'Extension pg_cron non disponible. Le cron job ne peut pas être créé automatiquement.';
    RAISE WARNING 'Veuillez l''activer dans Supabase Dashboard puis exécuter manuellement :';
    RAISE WARNING 'SELECT cron.schedule(''check-interim-contracts-daily'', ''0 8 * * *'', $$SELECT public.check_interim_contracts()$$);';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Erreur lors de la création du cron job: %', SQLERRM;
  RAISE WARNING 'Vérifiez que l''extension pg_cron est activée dans Supabase Dashboard';
END $$;

-- ============================================
-- 4. Vérification post-création
-- ============================================
DO $$
DECLARE
  v_job_count INTEGER;
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
  ) THEN
    -- Compter les jobs liés à check_interim_contracts
    SELECT COUNT(*) INTO v_job_count
    FROM cron.job
    WHERE jobname = 'check-interim-contracts-daily';
    
    IF v_job_count > 0 THEN
      RAISE NOTICE '✅ Cron job créé avec succès. Nombre de jobs trouvés: %', v_job_count;
    ELSE
      RAISE WARNING '⚠️ Aucun cron job trouvé après la création';
    END IF;
  END IF;
END $$;

-- ============================================
-- 5. Documentation des commandes utiles
-- ============================================
-- Pour vérifier les cron jobs :
-- SELECT * FROM cron.job WHERE jobname = 'check-interim-contracts-daily';
--
-- Pour lister tous les cron jobs :
-- SELECT * FROM cron.job;
--
-- Pour supprimer le cron job :
-- SELECT cron.unschedule('check-interim-contracts-daily');
--
-- Pour modifier la planification (ex: tous les jours à 6h) :
-- SELECT cron.unschedule('check-interim-contracts-daily');
-- SELECT cron.schedule('check-interim-contracts-daily', '0 6 * * *', $$SELECT public.check_interim_contracts()$$);
--
-- Pour exécuter manuellement le job :
-- SELECT public.check_interim_contracts();

