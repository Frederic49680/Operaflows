# 🔴 IMPORTANT : Appliquer la migration 013 (version forcée)

## ❌ Problème

Malgré la migration 012, l'erreur `tbl_sessions 400 (Bad Request)` persiste.

## ✅ Solution

La migration 013 force la suppression complète et la recréation de la fonction `update_derniere_connexion()` et de son trigger.

## 📝 Instructions

### Étape 1 : Ouvrir Supabase Dashboard

1. Allez sur : https://supabase.com/dashboard
2. Sélectionnez votre projet : `xcphklkuxwmhdxnfrhgt`
3. Cliquez sur **"SQL Editor"** dans le menu de gauche

### Étape 2 : Copier-coller le SQL

Copiez **TOUT** le contenu de `supabase/migrations/013_force_fix_derniere_connexion.sql` :

```sql
-- ============================================
-- Migration 013: Force fix update_derniere_connexion
-- Cette migration supprime complètement et recrée la fonction et le trigger
-- ============================================

-- Supprimer complètement le trigger et la fonction
DROP TRIGGER IF EXISTS trigger_update_derniere_connexion ON public.tbl_sessions;
DROP FUNCTION IF EXISTS public.update_derniere_connexion();

-- Recréer la fonction avec une version simplifiée et sans ambiguïté
CREATE OR REPLACE FUNCTION public.update_derniere_connexion()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_date_debut TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Extraire les valeurs de NEW explicitement
  v_user_id := NEW.user_id;
  v_date_debut := NEW.date_debut;
  
  -- Mettre à jour derniere_connexion uniquement si les valeurs sont valides
  IF v_date_debut IS NOT NULL AND v_user_id IS NOT NULL THEN
    UPDATE public.tbl_users
    SET derniere_connexion = v_date_debut
    WHERE public.tbl_users.id = v_user_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Recréer le trigger
CREATE TRIGGER trigger_update_derniere_connexion
  AFTER INSERT ON public.tbl_sessions
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_derniere_connexion();
```

### Étape 3 : Exécuter

1. Collez le SQL dans l'éditeur
2. Cliquez sur **"Run"** ou appuyez sur `Ctrl+Enter`
3. Vous devriez voir : **"Success. No rows returned"**

### Étape 4 : Vérifier l'erreur exacte

Après avoir appliqué la migration :
1. Rechargez l'application (Ctrl+F5)
2. Essayez de vous connecter
3. **Ouvrez la console du navigateur (F12)**
4. Regardez l'erreur détaillée qui devrait maintenant afficher :
   - `code`
   - `message`
   - `details`
   - `hint`

**Copiez-collez cette erreur complète** pour que je puisse la diagnostiquer.

## 🔍 Différences avec la migration 012

- ✅ **DROP complet** de la fonction et du trigger avant recréation
- ✅ **SECURITY DEFINER** ajouté pour s'assurer que les permissions sont correctes
- ✅ **Vérification automatique** que le trigger et la fonction existent après création
- ✅ **Logging amélioré** dans le code pour voir l'erreur exacte

## 📊 Après application

Si l'erreur persiste, la console du navigateur affichera maintenant l'erreur complète avec tous les détails nécessaires pour diagnostiquer le problème.

