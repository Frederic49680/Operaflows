-- Migration 016 : Fix ambiguïté user_id pour tbl_sites
-- Corrige l'erreur "column reference 'user_id' is ambiguous" lors de l'insertion

-- Supprimer les triggers existants si nécessaire
DROP TRIGGER IF EXISTS trigger_tbl_sites_created_by ON public.tbl_sites;
DROP TRIGGER IF EXISTS trigger_tbl_sites_updated_by ON public.tbl_sites;

-- Fonction pour gérer created_by et updated_by de manière explicite
CREATE OR REPLACE FUNCTION public.set_tbl_sites_user_fields()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id UUID;
BEGIN
    -- Récupérer l'ID de l'utilisateur actuel de manière explicite
    v_user_id := auth.uid();
    
    -- Si c'est un INSERT, définir created_by si non déjà défini
    IF TG_OP = 'INSERT' THEN
        IF NEW.created_by IS NULL THEN
            NEW.created_by := v_user_id;
        END IF;
        NEW.updated_by := v_user_id;
        NEW.updated_at := now();
    END IF;
    
    -- Si c'est un UPDATE, définir updated_by
    IF TG_OP = 'UPDATE' THEN
        NEW.updated_by := v_user_id;
        NEW.updated_at := now();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer le trigger BEFORE INSERT OR UPDATE
DROP TRIGGER IF EXISTS trigger_tbl_sites_user_fields ON public.tbl_sites;
CREATE TRIGGER trigger_tbl_sites_user_fields
    BEFORE INSERT OR UPDATE ON public.tbl_sites
    FOR EACH ROW
    EXECUTE FUNCTION public.set_tbl_sites_user_fields();

