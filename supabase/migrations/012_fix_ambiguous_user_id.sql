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

