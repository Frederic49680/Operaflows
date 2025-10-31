# 🔧 Correction finale : Récursion RLS et Manifest

## ⚠️ Problème identifié

1. **Récursion infinie dans les politiques RLS** : `infinite recursion detected in policy for relation "roles"`
   - Cause : Les politiques vérifient `user_roles -> roles`, mais `roles` lui-même vérifie les admins
   - Solution : Fonction SQL `SECURITY DEFINER` pour éviter la récursion

2. **Erreur manifest.json** : Problème de syntaxe ou de Content-Type

## 🔧 Solutions

### 1. Migration SQL pour corriger la récursion

Exécutez ce script dans Supabase SQL Editor :

```sql
-- ============================================
-- Migration 010: Fix récursion infinie dans les politiques RLS
-- ============================================

-- Créer une fonction qui vérifie si un utilisateur est admin
-- Utilise SECURITY DEFINER pour éviter la récursion RLS
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.user_roles ur
    INNER JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = user_id 
    AND r.name = 'Administrateur'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Réappliquer les politiques avec la fonction
DROP POLICY IF EXISTS "Admins can manage all users" ON public.tbl_users;
CREATE POLICY "Admins can manage all users" ON public.tbl_users
  FOR ALL USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Users can read own profile" ON public.tbl_users;
CREATE POLICY "Users can read own profile" ON public.tbl_users
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can manage roles" ON public.roles;
CREATE POLICY "Admins can manage roles" ON public.roles
  FOR ALL USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Users can read roles" ON public.roles;
CREATE POLICY "Users can read roles" ON public.roles
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admins can manage permissions" ON public.tbl_permissions;
CREATE POLICY "Admins can manage permissions" ON public.tbl_permissions
  FOR ALL USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can view all requests" ON public.tbl_user_requests;
CREATE POLICY "Admins can view all requests" ON public.tbl_user_requests
  FOR SELECT USING (public.is_admin(auth.uid()));
```

### 2. Vérification du manifest.json

Le fichier `public/manifest.json` est correct. Si l'erreur persiste :

1. Videz le cache du navigateur (Ctrl+Shift+Delete)
2. Ou testez en navigation privée
3. L'erreur peut être un faux positif du navigateur

## ✅ Après application

1. Déconnectez-vous et reconnectez-vous
2. Vérifiez que la connexion fonctionne
3. Vérifiez l'accès aux pages admin

