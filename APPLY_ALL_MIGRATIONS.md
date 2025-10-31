# 🔧 Guide complet : Application de toutes les migrations SQL

Pour corriger tous les problèmes, appliquez ces migrations dans l'ordre dans Supabase SQL Editor.

## 📋 Migrations à appliquer

### 1. Migration 003 : Permettre les demandes d'accès non authentifiées

```sql
-- Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Anyone can create access request" ON public.tbl_user_requests;
DROP POLICY IF EXISTS "Public can check requests by email" ON public.tbl_user_requests;

-- N'importe qui peut créer une demande d'accès (même non authentifié)
CREATE POLICY "Anyone can create access request" ON public.tbl_user_requests
  FOR INSERT WITH CHECK (true);

-- Permet à n'importe qui de vérifier si un email a déjà une demande
CREATE POLICY "Public can check requests by email" ON public.tbl_user_requests
  FOR SELECT USING (true);
```

### 2. Migration 004 : Fix RLS pour permettre aux admins de voir toutes les demandes

```sql
-- Supprimer la politique trop permissive qui pourrait créer des conflits
DROP POLICY IF EXISTS "Public can check requests by email" ON public.tbl_user_requests;

-- Les admins peuvent voir toutes les demandes (SELECT)
DROP POLICY IF EXISTS "Admins can view all requests" ON public.tbl_user_requests;
CREATE POLICY "Admins can view all requests" ON public.tbl_user_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name = 'Administrateur'
    )
  );

-- Les utilisateurs peuvent voir leurs propres demandes (y compris celles sans demandeur_id)
DROP POLICY IF EXISTS "Users can view own requests" ON public.tbl_user_requests;
CREATE POLICY "Users can view own requests" ON public.tbl_user_requests
  FOR SELECT USING (
    demandeur_id = auth.uid() OR
    demandeur_id IS NULL
  );
```

### 3. Migration 005 : Fix RLS pour tbl_sessions

```sql
-- Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Users can create own sessions" ON public.tbl_sessions;
DROP POLICY IF EXISTS "Users can view own sessions" ON public.tbl_sessions;

-- Les utilisateurs peuvent créer leurs propres sessions
CREATE POLICY "Users can create own sessions" ON public.tbl_sessions
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Les utilisateurs peuvent voir leurs propres sessions
CREATE POLICY "Users can view own sessions" ON public.tbl_sessions
  FOR SELECT USING (user_id = auth.uid());
```

### 4. Migration 006 : Augmenter la taille de session_token

```sql
-- Modifier le type de session_token de VARCHAR(255) à TEXT pour supporter les JWT complets
ALTER TABLE public.tbl_sessions 
  ALTER COLUMN session_token TYPE TEXT;

-- Supprimer la contrainte UNIQUE et la recréer sur TEXT (si elle existe)
ALTER TABLE public.tbl_sessions 
  DROP CONSTRAINT IF EXISTS tbl_sessions_session_token_key;

CREATE UNIQUE INDEX IF NOT EXISTS idx_tbl_sessions_session_token ON public.tbl_sessions(session_token);
```

## 🚀 Application rapide (tout en un)

Copiez-collez ce script complet dans Supabase SQL Editor :

```sql
-- ============================================
-- MIGRATIONS COMPLÈTES POUR OPERAFLOW
-- ============================================

-- Migration 003: Demandes d'accès
DROP POLICY IF EXISTS "Anyone can create access request" ON public.tbl_user_requests;
DROP POLICY IF EXISTS "Public can check requests by email" ON public.tbl_user_requests;

CREATE POLICY "Anyone can create access request" ON public.tbl_user_requests
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can check requests by email" ON public.tbl_user_requests
  FOR SELECT USING (true);

-- Migration 004: RLS Admin pour demandes
DROP POLICY IF EXISTS "Admins can view all requests" ON public.tbl_user_requests;
CREATE POLICY "Admins can view all requests" ON public.tbl_user_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name = 'Administrateur'
    )
  );

DROP POLICY IF EXISTS "Users can view own requests" ON public.tbl_user_requests;
CREATE POLICY "Users can view own requests" ON public.tbl_user_requests
  FOR SELECT USING (
    demandeur_id = auth.uid() OR
    demandeur_id IS NULL
  );

-- Migration 005: RLS Sessions
DROP POLICY IF EXISTS "Users can create own sessions" ON public.tbl_sessions;
DROP POLICY IF EXISTS "Users can view own sessions" ON public.tbl_sessions;

CREATE POLICY "Users can create own sessions" ON public.tbl_sessions
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view own sessions" ON public.tbl_sessions
  FOR SELECT USING (user_id = auth.uid());

-- Migration 006: Taille session_token
ALTER TABLE public.tbl_sessions 
  ALTER COLUMN session_token TYPE TEXT;

ALTER TABLE public.tbl_sessions 
  DROP CONSTRAINT IF EXISTS tbl_sessions_session_token_key;

CREATE UNIQUE INDEX IF NOT EXISTS idx_tbl_sessions_session_token ON public.tbl_sessions(session_token);
```

## ✅ Vérification après application

1. Testez la création d'une demande d'accès → devrait fonctionner
2. Connectez-vous en tant qu'admin → les demandes en attente devraient s'afficher
3. Vérifiez la console navigateur → plus d'erreur 400 sur `tbl_sessions`
4. Vérifiez la console → plus d'erreur sur `manifest.json`

## 🐛 Si les demandes ne s'affichent toujours pas

Vérifiez dans Supabase SQL Editor que vous êtes bien connecté avec un compte admin :

```sql
-- Vérifier vos rôles
SELECT r.name, ur.site_id 
FROM public.user_roles ur
JOIN public.roles r ON ur.role_id = r.id
WHERE ur.user_id = auth.uid();
```

Vous devriez voir "Administrateur" dans les résultats.

