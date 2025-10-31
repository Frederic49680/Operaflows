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

-- Vérifier que tout est correct
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trigger_update_derniere_connexion' 
    AND tgrelid = 'public.tbl_sessions'::regclass
  ) THEN
    RAISE EXCEPTION 'Trigger trigger_update_derniere_connexion n''a pas été créé correctement';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'update_derniere_connexion' 
    AND pronamespace = 'public'::regnamespace
  ) THEN
    RAISE EXCEPTION 'Fonction update_derniere_connexion n''a pas été créée correctement';
  END IF;
END $$;

