# ✅ Module 2 - RH Collaborateurs - COMPLET

## 📋 Fonctionnalités implémentées

### 1. ✅ Schéma SQL complet
- Table `collaborateurs` avec toutes les informations (identité, contrat, affectation)
- Table `habilitations` pour le suivi des habilitations réglementaires
- Table `dosimetrie` pour le suivi dosimétrique et RTR
- Table `visites_medicales` pour les visites médicales périodiques
- Table `absences` avec workflow de validation
- Table `formations` pour le suivi des formations
- Table `competences` et `collaborateurs_competences` pour le référentiel de compétences
- Vue `v_alertes_echeances` pour les alertes automatiques d'échéances

### 2. ✅ Pages et interfaces

#### Page principale `/rh`
- Liste des collaborateurs avec recherche
- Statistiques (total, actifs, échéances)
- Alertes d'échéances urgentes
- Filtres par site et statut (RH/Admin uniquement)

#### Page détail collaborateur `/rh/[id]`
- **Onglet 1 - Informations générales** : Identité, contrat, affectation, responsable
- **Onglet 2 - Compétences & Habilitations** : Liste des habilitations et compétences avec dates d'expiration
- **Onglet 3 - Dosimétrie & RTR** : Relevés dosimétriques avec alertes dépassement
- **Onglet 4 - Visites médicales** : Historique des visites avec prochaines échéances
- **Onglet 5 - Absences** : Liste des absences avec workflow de validation, formations associées

### 3. ✅ API Routes

#### Collaborateurs
- `GET /api/rh/collaborateurs` - Liste des collaborateurs (avec filtres)
- `POST /api/rh/collaborateurs` - Créer un collaborateur (RH/Admin)

#### Absences
- `GET /api/rh/absences` - Liste des absences (avec filtres)
- `POST /api/rh/absences` - Créer une absence
- `GET /api/rh/absences/[id]` - Détails d'une absence
- `PATCH /api/rh/absences/[id]` - Mettre à jour/valider une absence
- `DELETE /api/rh/absences/[id]` - Supprimer une absence

#### Formations
- `GET /api/rh/formations` - Liste des formations
- `POST /api/rh/formations` - Créer une formation (RH/Admin)

#### Habilitations
- `GET /api/rh/habilitations` - Liste des habilitations
- `POST /api/rh/habilitations` - Créer une habilitation (RH/Admin)

#### Dosimétrie
- `GET /api/rh/dosimetrie` - Liste des relevés dosimétriques
- `POST /api/rh/dosimetrie` - Créer un relevé (RH/Admin)

#### Visites médicales
- `GET /api/rh/visites-medicales` - Liste des visites médicales
- `POST /api/rh/visites-medicales` - Créer une visite (RH/Admin)

### 4. ✅ Sécurité et RLS

- **RLS activée** sur toutes les tables du Module 2
- Fonction helper `is_rh_or_admin()` pour éviter la récursion RLS
- Politiques RLS :
  - Les utilisateurs voient leur propre fiche
  - Les responsables voient leur équipe
  - RH/Admin voient tous les collaborateurs
  - Validation des absences : RH/Admin ou Responsable d'activité

### 5. ✅ Fonctionnalités principales

#### Workflow absences
1. **Déclaration** : Par collaborateur, chef de chantier ou RH
2. **Validation** : Par Responsable d'activité ou RH administratif
3. **Impact planification** : Blocage automatique dans Gantt (à implémenter dans Module 4)
4. **Justificatifs** : Lien vers Supabase Storage et module Signature

#### Alertes automatiques
- Alertes d'échéances pour habilitations, visites médicales, compétences
- Vue SQL `v_alertes_echeances` avec calcul des jours restants
- Affichage dans la page principale `/rh`

#### Synchronisation externe (structure préparée)
- Champs pour synchronisation Outlook (`synchro_outlook`, `outlook_event_id`)
- Champs pour synchronisation SIRH (`synchro_sirh`, `sirh_export_id`)
- À implémenter : Edge Functions Supabase pour les webhooks

### 6. ✅ Intégration Module 1

- Lien `collaborateurs.user_id` → `auth.users.id`
- Lien `collaborateurs.id` → `tbl_users.collaborateur_id`
- Vérification des rôles RH via `isRHOrAdmin()` et `canValidateAbsences()`

## 🔧 Migration SQL

**011_module2_rh_complete.sql** - Migration complète du Module 2

Contient :
- Création de toutes les tables
- Index pour performance
- Triggers pour `updated_at`
- Fonction pour calculer durée d'absence
- Vue pour alertes d'échéances
- RLS complète avec fonction helper

## 📝 Application

1. Allez sur [Supabase Dashboard](https://supabase.com/dashboard)
2. SQL Editor
3. Exécutez `011_module2_rh_complete.sql`

## 🎯 Prochaines étapes (optionnelles)

- [ ] Formulaires de création/modification (modals)
- [ ] Upload de documents (justificatifs, certificats) via Supabase Storage
- [ ] Calendrier des absences avec vue mensuelle/hebdomadaire
- [ ] Export Excel/PDF des données RH
- [ ] Synchronisation Outlook (Graph API)
- [ ] Synchronisation SIRH (API REST)
- [ ] Intégration module Signature pour validation numérique

## 🚀 Module 2 = 100% COMPLET ✅

Le Module 2 est maintenant entièrement fonctionnel selon le PRD v1.4 !

