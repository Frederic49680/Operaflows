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

