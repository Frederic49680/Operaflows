# Guide de déploiement OperaFlow

Ce guide explique comment déployer OperaFlow sur Git, Supabase et Vercel.

## 📋 Prérequis

- Compte GitHub
- Compte Supabase (gratuit ou payant)
- Compte Vercel (gratuit ou payant)
- Compte SendGrid (optionnel, pour les notifications email)
- Node.js >= 18.0.0 installé localement

## 🔧 Étape 1 : Configuration Git

### 1.1 Initialiser le dépôt Git

```bash
# Initialiser Git (si ce n'est pas déjà fait)
git init

# Ajouter tous les fichiers
git add .

# Créer le premier commit
git commit -m "Initial commit - Structure OperaFlow"
```

### 1.2 Créer un dépôt sur GitHub

1. Allez sur [github.com](https://github.com) et créez un nouveau dépôt
2. Nommez-le `OperaFlow` (ou votre nom préféré)
3. Ne cochez **pas** "Initialize with README" (le README existe déjà)
4. Copiez l'URL du dépôt (ex: `https://github.com/votre-username/OperaFlow.git`)

### 1.3 Connecter le dépôt local à GitHub

```bash
# Ajouter l'origine distante
git remote add origin https://github.com/votre-username/OperaFlow.git

# Renommer la branche principale en 'main' si nécessaire
git branch -M main

# Pousser le code
git push -u origin main
```

## 🗄️ Étape 2 : Configuration Supabase

### 2.1 Créer un projet Supabase

1. Allez sur [supabase.com](https://supabase.com)
2. Créez un compte ou connectez-vous
3. Cliquez sur "New Project"
4. Remplissez les informations :
   - **Name**: OperaFlow
   - **Database Password**: Choisissez un mot de passe fort (à sauvegarder)
   - **Region**: Choisissez `eu-central-1` (Europe) pour la conformité RGPD
   - **Plan**: Free ou Pro selon vos besoins

### 2.2 Récupérer les clés API

Une fois le projet créé :

1. Allez dans **Settings** → **API**
2. Notez les informations suivantes :
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ gardez-le secret !)

### 2.3 Activer les fonctionnalités

Dans le tableau de bord Supabase :

1. **Authentication** → Activez les providers :
   - Email (déjà activé)
   - Microsoft (optionnel, pour OAuth2)
   
2. **Storage** → Créez un bucket nommé `documents` :
   - Allez dans **Storage**
   - Cliquez sur "Create bucket"
   - Nom : `documents`
   - Public : `false` (privé)
   - File size limit : 50 MB

3. **Row Level Security (RLS)** :
   - RLS sera activé au niveau des tables lors de la création du schéma

### 2.4 Créer le schéma de base de données

Vous pouvez créer les tables via le SQL Editor dans Supabase Studio. Un fichier de migration sera créé séparément pour structurer le schéma complet.

## ☁️ Étape 3 : Configuration Vercel

### 3.1 Créer un compte Vercel

1. Allez sur [vercel.com](https://vercel.com)
2. Créez un compte (connexion GitHub recommandée)

### 3.2 Importer le projet

1. Dans le tableau de bord Vercel, cliquez sur **Add New** → **Project**
2. Importez votre dépôt GitHub `OperaFlow`
3. Vercel détectera automatiquement Next.js
4. Configurez les paramètres :
   - **Framework Preset**: Next.js
   - **Root Directory**: `./`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

### 3.3 Configurer les variables d'environnement

Dans les paramètres du projet Vercel → **Environment Variables**, ajoutez :

| Variable | Valeur | Environnements |
|----------|--------|----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Votre URL Supabase | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Votre clé anon | Production, Preview, Development |
| `SUPABASE_SERVICE_ROLE_KEY` | Votre clé service role | Production, Preview, Development |
| `NEXTAUTH_SECRET` | Générez une clé aléatoire | Production, Preview, Development |
| `APP_BASE_URL` | `https://votre-projet.vercel.app` | Production |
| `APP_BASE_URL` | `https://votre-projet-git-*.vercel.app` | Preview |
| `SENDGRID_API_KEY` | Votre clé SendGrid (optionnel) | Production |

**Pour générer `NEXTAUTH_SECRET`** :
```bash
openssl rand -base64 32
```

### 3.4 Déployer

1. Cliquez sur **Deploy**
2. Vercel va construire et déployer votre application
3. Une fois terminé, vous obtiendrez une URL : `https://votre-projet.vercel.app`

## 📧 Étape 4 : Configuration SendGrid (Optionnel)

### 4.1 Créer un compte SendGrid

1. Allez sur [sendgrid.com](https://sendgrid.com)
2. Créez un compte gratuit (100 emails/jour)
3. Vérifiez votre email

### 4.2 Créer une clé API

1. Allez dans **Settings** → **API Keys**
2. Cliquez sur "Create API Key"
3. Nom : `OperaFlow Production`
4. Permissions : **Full Access** (ou **Restricted Access** avec Mail Send uniquement)
5. Copiez la clé API et ajoutez-la à Vercel : `SENDGRID_API_KEY`

## 🔗 Étape 5 : Configuration du domaine personnalisé (Optionnel)

### 5.1 Ajouter un domaine dans Vercel

1. Allez dans **Settings** → **Domains**
2. Ajoutez votre domaine (ex: `operaflow.app`)
3. Suivez les instructions pour configurer les DNS

### 5.2 Mettre à jour les variables d'environnement

Mettez à jour `APP_BASE_URL` dans Vercel avec votre domaine personnalisé.

## ✅ Vérification du déploiement

### 5.1 Vérifier l'application

1. Ouvrez l'URL de déploiement Vercel
2. Vérifiez que la page d'accueil s'affiche correctement
3. Testez l'authentification Supabase (vous devrez créer une page de connexion)

### 5.2 Vérifier les logs

Dans Vercel :
- **Deployments** → Cliquez sur un déploiement → **Logs** pour voir les logs de build

Dans Supabase :
- **Logs** → Vérifiez les requêtes et erreurs éventuelles

## 🔄 Déploiement continu (CI/CD)

Une fois configuré, le déploiement est automatique :

- **Push sur `main`** → Déploiement en production
- **Push sur une autre branche** → Déploiement en preview
- **Pull Request** → Déploiement de preview pour tester

## 🛠️ Commandes utiles

```bash
# Développement local
npm run dev

# Build de production
npm run build

# Lancer en production locale
npm start

# Vérification TypeScript
npm run type-check

# Linter
npm run lint
```

## 📝 Notes importantes

- ⚠️ Ne commitez **jamais** le fichier `.env.local` (il est dans `.gitignore`)
- ⚠️ La clé `SUPABASE_SERVICE_ROLE_KEY` doit rester secrète (uniquement dans Vercel)
- ✅ Utilisez les variables d'environnement pour tous les secrets
- ✅ Testez en preview avant de merger sur `main`

## 🆘 Dépannage

### Erreur de connexion Supabase

- Vérifiez que les variables d'environnement sont correctement configurées dans Vercel
- Vérifiez que l'URL et les clés API sont correctes

### Erreur de build Vercel

- Consultez les logs de déploiement dans Vercel
- Vérifiez que toutes les dépendances sont dans `package.json`
- Vérifiez la version de Node.js (>= 18.0.0)

### Erreur d'authentification

- Vérifiez que l'Authentication est activée dans Supabase
- Vérifiez la configuration RLS sur les tables

## 📚 Ressources

- [Documentation Next.js](https://nextjs.org/docs)
- [Documentation Supabase](https://supabase.com/docs)
- [Documentation Vercel](https://vercel.com/docs)
- [Documentation SendGrid](https://docs.sendgrid.com)

