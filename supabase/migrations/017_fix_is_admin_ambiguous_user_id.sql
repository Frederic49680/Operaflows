-- Migration 017 : Fix ambiguïté user_id pour fonction is_admin
-- Corrige l'ambiguïté similaire à celle de is_rh_or_admin

-- ============================================================================
-- Fix ambiguïté dans la fonction is_admin
-- ============================================================================
-- Le problème : le paramètre user_id entre en conflit avec ur.user_id dans la requête
-- Solution : Utiliser une variable locale pour éviter l'ambiguïté sans changer le nom du paramètre

CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_id UUID;
BEGIN
    -- Stocker le paramètre dans une variable locale pour éviter l'ambiguïté
    v_user_id := user_id;
    
    -- Vérifier directement dans user_roles sans passer par une politique
    -- qui pourrait créer une récursion
    RETURN EXISTS (
        SELECT 1 
        FROM public.user_roles ur
        INNER JOIN public.roles r ON ur.role_id = r.id
        WHERE ur.user_id = v_user_id 
        AND r.name = 'Administrateur'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

