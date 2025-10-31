# Guide de configuration Supabase pour OperaFlow

Ce guide détaille la configuration complète de Supabase pour OperaFlow, incluant le schéma de base de données, les politiques RLS, et les fonctions Edge.

## 📋 Prérequis

- Compte Supabase créé
- Projet Supabase créé avec région EU-Central (RGPD)
- Accès au SQL Editor dans Supabase Studio

## 🗄️ Schéma de base de données

### 1. Tables principales

Exécutez les scripts SQL suivants dans l'ordre dans le SQL Editor de Supabase.

#### Table `roles` (Rôles applicatifs)

```sql
CREATE TABLE IF NOT EXISTS public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX idx_roles_name ON public.roles(name);
```

#### Table `role_pages` (Association rôles / pages accessibles)

```sql
CREATE TABLE IF NOT EXISTS public.role_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  page_path VARCHAR(255) NOT NULL,
  permission VARCHAR(20) NOT NULL CHECK (permission IN ('read', 'write', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(role_id, page_path)
);

CREATE INDEX idx_role_pages_role_id ON public.role_pages(role_id);
```

#### Table `user_roles` (Association utilisateurs / rôles)

```sql
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  site_id VARCHAR(100), -- Optionnel : périmètre par site
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, role_id, site_id)
);

CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_role_id ON public.user_roles(role_id);
```

#### Table `collaborateurs` (Module RH)

```sql
CREATE TABLE IF NOT EXISTS public.collaborateurs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  nom VARCHAR(100) NOT NULL,
  prenom VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  site VARCHAR(100),
  responsable_id UUID REFERENCES public.collaborateurs(id),
  date_embauche DATE,
  date_fin_contrat DATE,
  statut VARCHAR(20) DEFAULT 'actif' CHECK (statut IN ('actif', 'inactif', 'suspendu')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_collaborateurs_user_id ON public.collaborateurs(user_id);
CREATE INDEX idx_collaborateurs_email ON public.collaborateurs(email);
CREATE INDEX idx_collaborateurs_site ON public.collaborateurs(site);
```

#### Table `absences` (Gestion des absences)

```sql
CREATE TABLE IF NOT EXISTS public.absences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collaborateur_id UUID NOT NULL REFERENCES public.collaborateurs(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('conges', 'maladie', 'formation', 'autre')),
  date_debut DATE NOT NULL,
  date_fin DATE NOT NULL,
  statut VARCHAR(20) DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'valide', 'refuse')),
  valide_par UUID REFERENCES public.collaborateurs(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CHECK (date_fin >= date_debut)
);

CREATE INDEX idx_absences_collaborateur_id ON public.absences(collaborateur_id);
CREATE INDEX idx_absences_dates ON public.absences(date_debut, date_fin);
```

#### Table `affaires` (Module Affaires)

```sql
CREATE TABLE IF NOT EXISTS public.affaires (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero VARCHAR(50) NOT NULL UNIQUE,
  libelle VARCHAR(255) NOT NULL,
  client VARCHAR(255),
  charge_affaires_id UUID REFERENCES public.collaborateurs(id),
  site VARCHAR(100),
  date_debut DATE,
  date_fin DATE,
  montant DECIMAL(15,2),
  statut VARCHAR(20) DEFAULT 'cree' CHECK (statut IN ('cree', 'planifie', 'en_cours', 'suspendu', 'termine', 'archive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_affaires_numero ON public.affaires(numero);
CREATE INDEX idx_affaires_statut ON public.affaires(statut);
CREATE INDEX idx_affaires_site ON public.affaires(site);
```

#### Table `planification` (Gantt / Planning)

```sql
CREATE TABLE IF NOT EXISTS public.planification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affaire_id UUID NOT NULL REFERENCES public.affaires(id) ON DELETE CASCADE,
  collaborateur_id UUID REFERENCES public.collaborateurs(id),
  date_debut TIMESTAMP WITH TIME ZONE NOT NULL,
  date_fin TIMESTAMP WITH TIME ZONE NOT NULL,
  heures_prevues DECIMAL(5,2),
  heures_reelles DECIMAL(5,2),
  statut VARCHAR(20) DEFAULT 'planifie' CHECK (statut IN ('planifie', 'en_cours', 'suspendu', 'reporte', 'termine')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CHECK (date_fin >= date_debut)
);

CREATE INDEX idx_planification_affaire_id ON public.planification(affaire_id);
CREATE INDEX idx_planification_collaborateur_id ON public.planification(collaborateur_id);
CREATE INDEX idx_planification_dates ON public.planification(date_debut, date_fin);
```

### 2. Fonctions et triggers

#### Fonction `update_updated_at`

```sql
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Application aux tables
CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON public.roles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_collaborateurs_updated_at BEFORE UPDATE ON public.collaborateurs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_affaires_updated_at BEFORE UPDATE ON public.affaires
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_planification_updated_at BEFORE UPDATE ON public.planification
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
```

## 🔐 Row Level Security (RLS)

### Activer RLS sur toutes les tables

```sql
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collaborateurs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.absences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affaires ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planification ENABLE ROW LEVEL SECURITY;
```

### Politiques RLS de base (à adapter selon vos besoins)

#### Rôles - Lecture pour tous les utilisateurs authentifiés

```sql
CREATE POLICY "Users can read roles" ON public.roles
  FOR SELECT USING (auth.role() = 'authenticated');
```

#### User Roles - Accès à ses propres rôles

```sql
CREATE POLICY "Users can read own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);
```

#### Collaborateurs - Lecture selon périmètre (exemple)

```sql
-- Les utilisateurs peuvent voir les collaborateurs de leur site
CREATE POLICY "Users can read collaborators" ON public.collaborateurs
  FOR SELECT USING (
    auth.role() = 'authenticated' AND
    (site IN (SELECT site FROM public.user_roles WHERE user_id = auth.uid()) OR
     EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role_id IN (SELECT id FROM public.roles WHERE name = 'Administrateur')))
  );
```

⚠️ **Important** : Les politiques RLS doivent être définies précisément selon vos règles métier. Les exemples ci-dessus sont des bases à adapter.

## 📦 Storage Buckets

### Créer le bucket `documents`

Dans Supabase Studio → Storage :

1. Cliquez sur "Create bucket"
2. Nom : `documents`
3. Public : `false` (privé)
4. File size limit : 50 MB
5. Allowed MIME types : `application/pdf`, `image/*`

### Politique de stockage

```sql
-- Permettre l'upload pour les utilisateurs authentifiés
CREATE POLICY "Authenticated users can upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'documents' AND
    auth.role() = 'authenticated'
  );

-- Permettre la lecture selon les permissions
CREATE POLICY "Users can read own documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'documents' AND
    auth.role() = 'authenticated'
  );
```

## 🔄 Edge Functions (Optionnel)

Les Edge Functions Supabase peuvent être utilisées pour :
- Synchronisation SIRH (cron quotidien)
- Webhooks Microsoft 365
- Envoi d'emails via SendGrid

Exemple de structure :

```typescript
// supabase/functions/sync-sirh/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  // Logique de synchronisation
  return new Response(JSON.stringify({ success: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
```

## ✅ Vérification

1. Vérifiez que toutes les tables sont créées : Supabase Studio → Table Editor
2. Vérifiez que RLS est activé : Supabase Studio → Authentication → Policies
3. Testez une requête depuis votre application Next.js
4. Vérifiez les logs : Supabase Studio → Logs

## 📚 Ressources

- [Documentation Supabase RLS](https://supabase.com/docs/guides/auth/row-level-security)
- [Documentation Supabase Storage](https://supabase.com/docs/guides/storage)
- [Documentation Edge Functions](https://supabase.com/docs/guides/functions)

