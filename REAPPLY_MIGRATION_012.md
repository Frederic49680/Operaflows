# 🔴 IMPORTANT : Réappliquer la migration 012 (version corrigée)

## ❌ Problème identifié

Le bug persiste car la fonction originale utilisait `OLD.date_debut` dans un trigger `AFTER INSERT`, mais lors d'un INSERT, `OLD` est toujours NULL. Cela peut causer des erreurs.

## ✅ Solution corrigée

La migration 012 a été corrigée pour :
1. **Supprimer toute référence à OLD** (qui n'existe pas lors d'un INSERT)
2. **Utiliser des variables locales explicites** pour éviter toute ambiguïté
3. **Recréer le trigger** pour s'assurer qu'il est bien configuré

## 📝 Instructions

### Étape 1 : Ouvrir Supabase Dashboard

1. Allez sur : https://supabase.com/dashboard
2. Sélectionnez votre projet : `xcphklkuxwmhdxnfrhgt`
3. Cliquez sur **"SQL Editor"** dans le menu de gauche

### Étape 2 : Copier-coller le SQL corrigé

```sql
-- ============================================
-- Migration 012: Fix ambiguous user_id dans update_derniere_connexion
-- ============================================

-- Corriger la fonction update_derniere_connexion pour éviter l'ambiguïté
-- Cette fonction est déclenchée par un trigger AFTER INSERT sur tbl_sessions
-- IMPORTANT: OLD n'existe pas lors d'un INSERT, donc on ne l'utilise pas
CREATE OR REPLACE FUNCTION public.update_derniere_connexion()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_date_debut TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Récupérer explicitement les valeurs depuis NEW (tbl_sessions)
  v_user_id := NEW.user_id;
  v_date_debut := NEW.date_debut;
  
  -- Mettre à jour derniere_connexion dans tbl_users
  -- Pour un trigger AFTER INSERT, NEW existe toujours mais OLD est NULL
  IF v_date_debut IS NOT NULL AND v_user_id IS NOT NULL THEN
    UPDATE public.tbl_users
    SET derniere_connexion = v_date_debut
    WHERE public.tbl_users.id = v_user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- S'assurer que le trigger est bien configuré
DROP TRIGGER IF EXISTS trigger_update_derniere_connexion ON public.tbl_sessions;
CREATE TRIGGER trigger_update_derniere_connexion
  AFTER INSERT ON public.tbl_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_derniere_connexion();
```

### Étape 3 : Exécuter

1. Collez le SQL dans l'éditeur
2. Cliquez sur **"Run"** ou appuyez sur `Ctrl+Enter`
3. Vous devriez voir : **"Success. No rows returned"**

### Étape 4 : Vérifier

1. Rechargez l'application (Ctrl+F5)
2. Essayez de vous connecter
3. L'erreur `column reference "user_id" is ambiguous` devrait maintenant être résolue

## 🔍 Différences avec la version précédente

- ✅ Suppression de toute référence à `OLD` (qui n'existe pas lors d'un INSERT)
- ✅ Utilisation de variables locales explicites (`v_user_id`, `v_date_debut`)
- ✅ Qualification explicite de `public.tbl_users.id`
- ✅ Recréation explicite du trigger pour s'assurer qu'il est bien configuré

