# 🔴 URGENT : Appliquer la migration SQL 012

## ❌ Erreur actuelle

```
POST /rest/v1/tbl_sessions 400 (Bad Request)
Erreur création session: {code: '42702', details: 'It could refer to either a PL/pgSQL variable or a table column.', hint: null, message: 'column reference "user_id" is ambiguous'}
```

**Cette erreur empêche la création de session lors de la connexion !**

## ✅ Solution IMMÉDIATE

### Étape 1 : Ouvrir Supabase Dashboard

1. Allez sur : https://supabase.com/dashboard
2. Sélectionnez votre projet : `xcphklkuxwmhdxnfrhgt`
3. Cliquez sur **"SQL Editor"** dans le menu de gauche

### Étape 2 : Copier-coller le SQL

Copiez **TOUT** le contenu du fichier `supabase/migrations/012_fix_ambiguous_user_id.sql` :

```sql
-- ============================================
-- Migration 012: Fix ambiguous user_id dans update_derniere_connexion
-- ============================================

-- Corriger la fonction update_derniere_connexion pour éviter l'ambiguïté
-- Cette fonction est déclenchée par un trigger AFTER INSERT sur tbl_sessions
CREATE OR REPLACE FUNCTION public.update_derniere_connexion()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Récupérer explicitement user_id depuis NEW (tbl_sessions)
  v_user_id := NEW.user_id;
  
  -- Mettre à jour derniere_connexion dans tbl_users
  IF NEW.date_debut IS NOT NULL THEN
    UPDATE public.tbl_users
    SET derniere_connexion = NEW.date_debut
    WHERE public.tbl_users.id = v_user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Étape 3 : Exécuter

1. Collez le SQL dans l'éditeur
2. Cliquez sur **"Run"** ou appuyez sur `Ctrl+Enter` (Windows) / `Cmd+Enter` (Mac)
3. Vous devriez voir : **"Success. No rows returned"**

### Étape 4 : Vérifier

1. Rechargez l'application
2. Essayez de vous connecter
3. L'erreur `column reference "user_id" is ambiguous` devrait disparaître

## 📝 Note technique

Cette migration corrige la fonction trigger `update_derniere_connexion()` qui met à jour automatiquement `derniere_connexion` dans `tbl_users` lorsqu'une nouvelle session est créée dans `tbl_sessions`.

Le problème était que PostgreSQL ne pouvait pas déterminer si `user_id` faisait référence à la colonne de `tbl_sessions` ou à une autre table. La solution utilise une variable locale explicite pour éviter cette ambiguïté.

