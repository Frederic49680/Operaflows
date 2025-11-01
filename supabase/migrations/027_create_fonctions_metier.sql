-- Migration: Création de la table tbl_fonctions_metier pour gérer les fonctions métier

-- Créer la table si elle n'existe pas
CREATE TABLE IF NOT EXISTS public.tbl_fonctions_metier (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  libelle VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  ordre_affichage INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_fonctions_metier_libelle ON public.tbl_fonctions_metier(libelle);
CREATE INDEX IF NOT EXISTS idx_fonctions_metier_is_active ON public.tbl_fonctions_metier(is_active);
CREATE INDEX IF NOT EXISTS idx_fonctions_metier_ordre ON public.tbl_fonctions_metier(ordre_affichage);

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION public.update_fonctions_metier_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour updated_at
DROP TRIGGER IF EXISTS trigger_update_fonctions_metier_updated_at ON public.tbl_fonctions_metier;
CREATE TRIGGER trigger_update_fonctions_metier_updated_at
  BEFORE UPDATE ON public.tbl_fonctions_metier
  FOR EACH ROW
  EXECUTE FUNCTION public.update_fonctions_metier_updated_at();

-- Fonctions pour gérer created_by et updated_by
CREATE OR REPLACE FUNCTION public.set_fonctions_metier_created_by()
RETURNS TRIGGER AS $$
BEGIN
  NEW.created_by = auth.uid();
  NEW.created_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.set_fonctions_metier_updated_by()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers pour created_by et updated_by
DROP TRIGGER IF EXISTS trigger_set_fonctions_metier_created_by ON public.tbl_fonctions_metier;
CREATE TRIGGER trigger_set_fonctions_metier_created_by
  BEFORE INSERT ON public.tbl_fonctions_metier
  FOR EACH ROW
  EXECUTE FUNCTION public.set_fonctions_metier_created_by();

DROP TRIGGER IF EXISTS trigger_set_fonctions_metier_updated_by ON public.tbl_fonctions_metier;
CREATE TRIGGER trigger_set_fonctions_metier_updated_by
  BEFORE UPDATE ON public.tbl_fonctions_metier
  FOR EACH ROW
  EXECUTE FUNCTION public.set_fonctions_metier_updated_by();

-- Activer RLS
ALTER TABLE public.tbl_fonctions_metier ENABLE ROW LEVEL SECURITY;

-- Politiques RLS
-- Tous peuvent lire les fonctions métier actives
DROP POLICY IF EXISTS "Tous peuvent lire fonctions métier actives" ON public.tbl_fonctions_metier;
CREATE POLICY "Tous peuvent lire fonctions métier actives" ON public.tbl_fonctions_metier
  FOR SELECT
  USING (is_active = true);

-- Seuls les admins peuvent lire toutes les fonctions métier (y compris inactives)
DROP POLICY IF EXISTS "Admins peuvent lire toutes fonctions métier" ON public.tbl_fonctions_metier;
CREATE POLICY "Admins peuvent lire toutes fonctions métier" ON public.tbl_fonctions_metier
  FOR SELECT
  USING (public.is_admin(auth.uid()));

-- Seuls les admins peuvent créer des fonctions métier
DROP POLICY IF EXISTS "Admins peuvent créer fonctions métier" ON public.tbl_fonctions_metier;
CREATE POLICY "Admins peuvent créer fonctions métier" ON public.tbl_fonctions_metier
  FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

-- Seuls les admins peuvent modifier des fonctions métier
-- Utiliser la fonction helper is_admin pour éviter la récursion
DROP POLICY IF EXISTS "Admins peuvent modifier fonctions métier" ON public.tbl_fonctions_metier;
CREATE POLICY "Admins peuvent modifier fonctions métier" ON public.tbl_fonctions_metier
  FOR UPDATE
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Seuls les admins peuvent supprimer (désactiver) des fonctions métier
DROP POLICY IF EXISTS "Admins peuvent supprimer fonctions métier" ON public.tbl_fonctions_metier;
CREATE POLICY "Admins peuvent supprimer fonctions métier" ON public.tbl_fonctions_metier
  FOR DELETE
  USING (public.is_admin(auth.uid()));

-- Insérer les fonctions métier initiales
INSERT INTO public.tbl_fonctions_metier (libelle, ordre_affichage, is_active) VALUES
  ('Conducteur de travaux', 1, true),
  ('Chef de chantier', 2, true),
  ('Chef d''équipe', 3, true),
  ('Technicien', 4, true),
  ('Électricien', 5, true),
  ('Électricien qualifié', 6, true),
  ('Monteur', 7, true),
  ('Câbleur', 8, true),
  ('Soudeur', 9, true),
  ('Chaudronnier', 10, true),
  ('Mécanicien', 11, true),
  ('Automaticien', 12, true),
  ('Dessinateur projeteur', 13, true),
  ('Ingénieur', 14, true),
  ('Ingénieur études', 15, true),
  ('Ingénieur méthode', 16, true),
  ('Ingénieur qualité', 17, true),
  ('Chargé d''affaires', 18, true),
  ('Assistant administratif', 19, true),
  ('Comptable', 20, true),
  ('Responsable RH', 21, true),
  ('Responsable HSE', 22, true),
  ('Responsable maintenance', 23, true),
  ('Responsable production', 24, true),
  ('Responsable logistique', 25, true),
  ('Magasinier', 26, true),
  ('Manutentionnaire', 27, true),
  ('Agent de sécurité', 28, true),
  ('Autre', 99, true)
ON CONFLICT (libelle) DO NOTHING;

-- Commentaires
COMMENT ON TABLE public.tbl_fonctions_metier IS 'Référentiel des fonctions métier disponibles pour les collaborateurs';
COMMENT ON COLUMN public.tbl_fonctions_metier.libelle IS 'Libellé de la fonction métier (unique)';
COMMENT ON COLUMN public.tbl_fonctions_metier.description IS 'Description optionnelle de la fonction métier';
COMMENT ON COLUMN public.tbl_fonctions_metier.is_active IS 'Indique si la fonction métier est active et visible dans les formulaires';
COMMENT ON COLUMN public.tbl_fonctions_metier.ordre_affichage IS 'Ordre d''affichage dans les listes déroulantes';

