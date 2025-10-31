-- Migration 018 : Ajout du statut "en_attente_validation_mail" pour tbl_user_requests
-- Ce statut permet de tracker les demandes dont le compte a été créé mais l'email n'a pas encore été validé/envoyé

-- Modifier la contrainte CHECK pour inclure le nouveau statut
ALTER TABLE public.tbl_user_requests 
DROP CONSTRAINT IF EXISTS tbl_user_requests_statut_check;

ALTER TABLE public.tbl_user_requests 
ADD CONSTRAINT tbl_user_requests_statut_check 
CHECK (statut IN ('en_attente', 'acceptee', 'refusee', 'archivee', 'en_attente_validation_mail'));

