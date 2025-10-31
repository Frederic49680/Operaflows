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

# Copier le fichier d'environnement
cp .env.example .env.local

# Configurer les variables d'environnement dans .env.local
# (voir section Configuration ci-dessous)

# Lancer le serveur de développement
npm run dev
```

L'application sera accessible sur [http://localhost:3000](http://localhost:3000)

## ⚙️ Configuration

### Variables d'environnement

Créez un fichier `.env.local` à la racine du projet avec les variables suivantes :

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=votre_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_cle_anon
SUPABASE_SERVICE_ROLE_KEY=votre_cle_service_role

# Application
NEXTAUTH_SECRET=votre_secret_nextauth
APP_BASE_URL=http://localhost:3000

# SendGrid (optionnel)
SENDGRID_API_KEY=votre_cle_sendgrid

# Supabase Storage
SUPABASE_STORAGE_BUCKET=documents
```

### Configuration Supabase

1. Créez un projet sur [supabase.com](https://supabase.com)
2. Notez l'URL du projet et les clés API
3. Activez les fonctionnalités suivantes :
   - Authentication
   - Storage
   - Row Level Security (RLS)

### Configuration Vercel

1. Connectez votre dépôt GitHub à Vercel
2. Configurez les variables d'environnement dans les paramètres du projet Vercel
3. Le déploiement se fera automatiquement à chaque push sur la branche `main`

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

1. **Structure & UI / Droits** - Socle technique, design, responsive, gestion des rôles
2. **Authentification / Rôles / Permissions** - Connexion, sécurité, gestion des accès
3. **RH Collaborateurs** - Gestion des fiches RH, absences, formations, conformité
4. **Affaires** - Création, suivi, valorisation, rapport pré-planif
5. **Planification & Suivi** - Gantt interactif, suivi terrain, valorisation horaire
6. **KPI & Alertes globales** - Tableaux de bord, performance, alertes intelligentes

## 🚢 Déploiement

### Vercel (Production)

Le déploiement est automatique via GitHub :

- **Production**: branche `main`
- **Preview**: autres branches
- **Environnement**: variables configurées dans Vercel

### Supabase

- Base de données PostgreSQL managée
- Sauvegardes automatiques quotidiennes
- Stockage pour documents et signatures
- Edge Functions pour automatisations

## 📝 Licence

Propriétaire - Tous droits réservés

## 🔗 Liens utiles

- [Documentation Next.js](https://nextjs.org/docs)
- [Documentation Supabase](https://supabase.com/docs)
- [Documentation Vercel](https://vercel.com/docs)

