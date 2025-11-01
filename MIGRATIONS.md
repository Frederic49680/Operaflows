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

## Module 2 - RH Collaborateurs

- **011_module2_rh_complete.sql** - Schéma complet du Module 2 (collaborateurs, habilitations, dosimétrie, visites médicales, absences, formations, compétences)
- **014_module2_sites_et_responsables.sql** - Module 2.2 : Sites et Responsables d'activité
- **015_fix_tbl_sites_rls.sql** - Fix RLS pour tbl_sites
- **016_fix_tbl_sites_ambiguous_user_id.sql** - Fix ambiguïté user_id dans triggers tbl_sites
- **021_fix_collaborateurs_rls_recursion.sql** - Fix récursion RLS pour collaborateurs
- **022_force_fix_collaborateurs_rls.sql** - Force fix RLS collaborateurs (recréation complète)
- **024_auto_statut_renouveller_interim.sql** - Statut automatique "A renouveller" pour contrats intérim (≤15 jours)
- **025_setup_cron_interim_contracts.sql** - Configuration cron job pour vérification quotidienne automatique

## Scripts utilitaires

- **008_restore_admin_role.sql** - Script pour restaurer le rôle Administrateur si perdu
- **023_verify_and_fix_admin_role.sql** - Script pour vérifier et corriger le rôle Administrateur

## 📝 Application

### Ordre d'exécution recommandé

1. **Module 1** :
   - `001_module1_auth.sql` - Schéma initial
   - `000_all_fixes_consolidated.sql` - Tous les fixes RLS (recommandé)
   - `002_create_admin_user.sql` - Créer un admin
   - `017_fix_is_admin_ambiguous_user_id.sql` - Fix ambiguïté user_id

2. **Module 2** :
   - `011_module2_rh_complete.sql` - Schéma Module 2
   - `014_module2_sites_et_responsables.sql` - Sites et Responsables
   - `015_fix_tbl_sites_rls.sql` - Fix RLS sites
   - `016_fix_tbl_sites_ambiguous_user_id.sql` - Fix triggers sites
   - `021_fix_collaborateurs_rls_recursion.sql` - Fix récursion collaborateurs
   - `022_force_fix_collaborateurs_rls.sql` - Force fix RLS collaborateurs (si nécessaire)
   - `024_auto_statut_renouveller_interim.sql` - Statut auto "A renouveller" pour intérim
   - `025_setup_cron_interim_contracts.sql` - Cron job vérification quotidienne (optionnel, nécessite pg_cron)

3. **Scripts utilitaires** (si nécessaire) :
   - `008_restore_admin_role.sql` - Restaurer rôle admin
   - `023_verify_and_fix_admin_role.sql` - Vérifier/corriger rôle admin

### Instructions détaillées

- Migration 024 : Voir `EXECUTE_MIGRATION_024.md`
- Migration 025 : Voir `CONFIGURER_CRON_INTERIM_COMPLET.md`
- Migration 015 : Voir `EXECUTE_MIGRATION_015.md`
- Migration 016 : Voir `EXECUTE_MIGRATION_016.md`
- Migration 017 : Voir `EXECUTE_MIGRATION_017.md`
- Migration 021 : Voir `EXECUTE_MIGRATION_021.md`
- Migration 022 : Voir `EXECUTE_MIGRATION_022.md`

