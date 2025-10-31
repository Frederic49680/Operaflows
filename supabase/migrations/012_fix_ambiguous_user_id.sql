-- ============================================
-- Migration 012: Fix ambiguous user_id dans update_derniere_connexion
-- ============================================

-- Corriger la fonction update_derniere_connexion pour éviter l'ambiguïté
CREATE OR REPLACE FUNCTION public.update_derniere_connexion()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.date_debut IS NOT NULL AND (OLD IS NULL OR OLD.date_debut IS DISTINCT FROM NEW.date_debut) THEN
    UPDATE public.tbl_users
    SET derniere_connexion = NEW.date_debut
    WHERE public.tbl_users.id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

