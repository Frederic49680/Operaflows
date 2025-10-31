# 📦 Migrations SQL Supabase

## Migration initiale

**001_module1_auth.sql** - Schéma complet du Module 1 (tables, RLS de base, rôles par défaut)

## Migration admin

**002_create_admin_user.sql** - Script pour créer un utilisateur administrateur

## Migration consolidée (RECOMMANDÉE)

**000_all_fixes_consolidated.sql** - ⭐ **Utilisez ce fichier** - Contient tous les fixes RLS et corrections en un seul script

### Ce que contient la migration consolidée :
- ✅ Fonction `is_admin()` pour éviter la récursion RLS
- ✅ Fix RLS pour `tbl_users`
- ✅ Fix RLS pour `tbl_user_requests`
- ✅ Fix RLS pour `tbl_sessions`
- ✅ Fix RLS pour `roles`
- ✅ Fix RLS pour `tbl_permissions`
- ✅ Fix RLS pour `tbl_audit_log`
- ✅ Correction taille `session_token` (VARCHAR → TEXT)

## Migrations individuelles (pour référence)

Ces migrations sont maintenant consolidées dans `000_all_fixes_consolidated.sql` mais peuvent être utiles pour comprendre l'historique :

- 003_fix_user_requests_rls.sql
- 004_fix_admin_requests_rls.sql
- 005_fix_sessions_rls.sql
- 006_fix_session_token_length.sql
- 007_fix_roles_rls.sql
- 009_fix_tbl_users_rls.sql
- 010_fix_rls_recursion.sql

## Scripts utilitaires

- **008_restore_admin_role.sql** - Script pour restaurer le rôle Administrateur si perdu

## 📝 Application

1. Allez sur [Supabase Dashboard](https://supabase.com/dashboard)
2. SQL Editor
3. Exécutez d'abord `001_module1_auth.sql`
4. Ensuite `000_all_fixes_consolidated.sql`
5. Si besoin, `002_create_admin_user.sql` ou `008_restore_admin_role.sql`

