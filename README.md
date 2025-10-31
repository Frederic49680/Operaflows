# OperaFlow

Application web et mobile de suivi, planification et pilotage d'activités de terrain.

## 🏗️ Architecture

- **Front-end**: Next.js 15 + TypeScript + TailwindCSS
- **Back-end**: Supabase (PostgreSQL + Auth + Storage + Edge Functions)
- **Hébergement**: Vercel
- **Notifications**: SendGrid
- **Graphiques**: Recharts

## 🚀 Démarrage rapide

### Prérequis

- Node.js >= 18.0.0
- Compte Supabase
- Compte Vercel
- Compte SendGrid (optionnel pour les notifications)

### Installation locale

```bash
# Installer les dépendances
npm install

# Le fichier .env.local devrait déjà être configuré
# Sinon, créez-le en copiant .env.example et ajoutez vos clés Supabase

# Lancer le serveur de développement
npm run dev
```

L'application sera accessible sur [http://localhost:3000](http://localhost:3000)

## ⚙️ Configuration

### Variables d'environnement

Le fichier `.env.local` contient :
- `NEXT_PUBLIC_SUPABASE_URL` - URL de votre projet Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Clé publique anonyme Supabase
- `SUPABASE_SERVICE_ROLE_KEY` - Clé service role Supabase (secrète)
- `NEXTAUTH_SECRET` - Secret pour NextAuth
- `APP_BASE_URL` - URL de base de l'application
- `SENDGRID_API_KEY` - Clé API SendGrid (optionnel)
- `SUPABASE_STORAGE_BUCKET` - Nom du bucket Storage Supabase

### Configuration Supabase

1. Créez un projet sur [supabase.com](https://supabase.com)
2. Notez l'URL du projet et les clés API
3. Activez les fonctionnalités suivantes :
   - Authentication
   - Storage
   - Row Level Security (RLS)
4. Exécutez les scripts SQL de `SUPABASE_SETUP.md` pour créer le schéma

### Configuration Vercel

1. Connectez votre dépôt GitHub à Vercel
2. Configurez les variables d'environnement dans les paramètres du projet Vercel
3. Le déploiement se fera automatiquement à chaque push sur la branche `main`

📖 **Voir `DEPLOYMENT.md` pour le guide complet de déploiement**

## 📁 Structure du projet

```
operflow/
├── src/
│   ├── app/                 # Pages Next.js (App Router)
│   ├── components/          # Composants React réutilisables
│   ├── lib/                 # Utilitaires et clients Supabase
│   ├── types/               # Types TypeScript
│   ├── hooks/               # Hooks React personnalisés
│   └── utils/               # Fonctions utilitaires
├── public/                  # Fichiers statiques
├── scripts/                 # Scripts utilitaires
├── .cursor/                 # Règles Cursor
└── ...
```

## 🔐 Sécurité

- Authentification via Supabase Auth (JWT)
- Row Level Security (RLS) activé sur toutes les tables
- Variables d'environnement sensibles non exposées au client
- HTTPS obligatoire en production

## 🎨 Design

Charte graphique OperaFlow :
- **Primaire**: Bleu OperaFlow (#0EA5E9)
- **Secondaire**: Gris anthracite (#1F2937)
- **Accent**: Orange chantier (#F97316)
- **Fond clair**: #F3F4F6

## 📦 Modules

1. ✅ **Authentification / Rôles / Permissions** - COMPLET
   - Connexion sécurisée, gestion des utilisateurs, gestion des rôles, journal d'audit
2. **RH Collaborateurs** - À venir
3. **Affaires** - À venir
4. **Planification & Suivi** - À venir
5. **KPI & Alertes globales** - À venir

## 🚢 Déploiement

### Local (Développement)

```bash
npm run dev      # Serveur de développement sur http://localhost:3000
npm run build    # Build de production
npm run start    # Lancer en mode production
```

### Vercel (Production)

Le déploiement est automatique via GitHub :

- **Production**: branche `main`
- **Preview**: autres branches
- **Environnement**: variables configurées dans Vercel

📖 **Voir `DEPLOYMENT.md` pour les détails complets**

### Vérification

Utilisez le script PowerShell pour vérifier votre déploiement :

```powershell
.\scripts\check-deployment.ps1
```

Ou consultez `VERIFICATION_DEPLOYMENT.md` pour un guide détaillé.

## ✅ Statut actuel

- ✅ Structure Next.js 15 configurée
- ✅ Supabase configuré (clés dans `.env.local`)
- ✅ Build de production fonctionnel
- ✅ Documentation complète
- ⏳ Déploiement Vercel à configurer
- ⏳ Schéma Supabase à créer

## 📝 Documentation

- `DEPLOYMENT.md` - Guide complet de déploiement (Git, Supabase, Vercel)
- `SUPABASE_SETUP.md` - Configuration Supabase avec schéma SQL
- `VERIFICATION_DEPLOYMENT.md` - Guide de vérification des déploiements
- `QUICKSTART.md` - Guide de démarrage rapide
- `ENV_SETUP.md` - Configuration des variables d'environnement
- `SETUP_COMPLETE.md` - Récapitulatif de la configuration

## 🛠️ Commandes utiles

```bash
npm run dev          # Développement
npm run build        # Build production
npm run start        # Production locale
npm run lint         # Linter
npm run type-check   # Vérification TypeScript
```

## 📚 Ressources

- [Documentation Next.js](https://nextjs.org/docs)
- [Documentation Supabase](https://supabase.com/docs)
- [Documentation Vercel](https://vercel.com/docs)
- [Documentation SendGrid](https://docs.sendgrid.com)

## 📝 Licence

Propriétaire - Tous droits réservés
