# 🚀 Guide pas à pas : Déployer OperaFlow sur Vercel

Ce guide vous accompagne étape par étape pour déployer votre application OperaFlow sur Vercel.

## 📋 Prérequis

- ✅ Projet OperaFlow configuré localement
- ✅ Fichier `.env.local` avec vos clés Supabase
- ⬜ Compte GitHub (gratuit)
- ⬜ Compte Vercel (gratuit)

## 🔴 Étape 1 : Créer un dépôt GitHub (si pas déjà fait)

### 1.1 Initialiser Git (si nécessaire)

```bash
# Vérifier si Git est déjà initialisé
git status

# Si ce n'est pas le cas, initialiser Git
git init
```

### 1.2 Créer un compte et dépôt sur GitHub

1. Allez sur [github.com](https://github.com) et créez un compte (ou connectez-vous)
2. Cliquez sur le bouton **"+"** en haut à droite → **"New repository"**
3. Remplissez les informations :
   - **Repository name** : `OperaFlow` (ou un autre nom)
   - **Description** : "Application de suivi, planification et pilotage d'activités"
   - **Visibilité** : Private (recommandé) ou Public
   - **Ne cochez PAS** "Add a README file" (on a déjà un README)
   - **Ne cochez PAS** "Add .gitignore" (on a déjà un .gitignore)
4. Cliquez sur **"Create repository"**

### 1.3 Connecter le projet local à GitHub

Après avoir créé le dépôt, GitHub vous donne des instructions. Exécutez dans votre terminal :

```bash
# Ajouter tous les fichiers (sauf ceux dans .gitignore)
git add .

# Créer le premier commit
git commit -m "Initial commit - OperaFlow configuration"

# Renommer la branche en 'main' si nécessaire
git branch -M main

# Ajouter l'origine distante (remplacez VOTRE_USERNAME par votre nom d'utilisateur GitHub)
git remote add origin https://github.com/VOTRE_USERNAME/OperaFlow.git

# Pousser le code sur GitHub
git push -u origin main
```

**💡 Si vous avez déjà un dépôt Git configuré**, vérifiez juste :
```bash
git remote -v
# Si vous voyez une URL GitHub, vous êtes prêt !
```

## ☁️ Étape 2 : Créer un compte Vercel

1. Allez sur [vercel.com](https://vercel.com)
2. Cliquez sur **"Sign Up"**
3. **Important** : Choisissez **"Continue with GitHub"** pour connecter directement votre compte GitHub
4. Autorisez Vercel à accéder à vos dépôts GitHub

## 🎯 Étape 3 : Importer le projet OperaFlow sur Vercel

### 3.1 Importer depuis GitHub

1. Dans le tableau de bord Vercel, cliquez sur **"Add New..."** → **"Project"**
2. Vous verrez la liste de vos dépôts GitHub
3. Trouvez **"OperaFlow"** (ou le nom que vous avez donné) et cliquez sur **"Import"**

### 3.2 Configurer le projet

Vercel détecte automatiquement Next.js, mais vérifiez les paramètres :

- **Framework Preset** : `Next.js` (devrait être détecté automatiquement)
- **Root Directory** : `./` (laissez par défaut)
- **Build Command** : `npm run build` (déjà configuré)
- **Output Directory** : `.next` (déjà configuré)
- **Install Command** : `npm install` (déjà configuré)

**Ne cliquez PAS encore sur "Deploy"** - il faut d'abord configurer les variables d'environnement !

## 🔐 Étape 4 : Configurer les variables d'environnement

### 4.1 Avant de déployer

Avant de cliquer sur "Deploy", cliquez sur **"Environment Variables"** pour les ajouter.

### 4.2 Ajouter les variables

Ajoutez les variables suivantes une par une :

| Variable | Valeur | Environnements à cocher |
|----------|--------|-------------------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xcphklkuxwmhdxnfrhgt.supabase.co` | ✅ Production, ✅ Preview, ✅ Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjcGhrbGt1eHdtaGR4bmZyaGd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5MzA3NTYsImV4cCI6MjA3NzUwNjc1Nn0.oAV-qu1D_SGJDLxcs2RcJibtOC8bcLrsCShig68O_7A` | ✅ Production, ✅ Preview, ✅ Development |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjcGhrbGt1eHdtaGR4bmZyaGd0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTkzMDc1NiwiZXhwIjoyMDc3NTA2NzU2fQ.LuLQGnk8lKy3ikClbXaa9gPT299BjUNil20e6g3qJMk` | ✅ Production, ✅ Preview, ✅ Development |
| `NEXTAUTH_SECRET` | `nHseQGA4pj4sVdjz3EtVGjgJapeKvW5bawnfYSn7HD8=` | ✅ Production, ✅ Preview, ✅ Development |

**Pour chaque variable :**
1. Cliquez sur **"Add Another"** (ou le champ de texte)
2. Entrez le nom de la variable dans le champ "Name"
3. Entrez la valeur dans le champ "Value"
4. Cochez les 3 environnements : **Production**, **Preview**, **Development**
5. Cliquez sur **"Save"**

**Note** : Pour `APP_BASE_URL`, vous devrez l'ajouter APRÈS le premier déploiement (vous aurez alors l'URL Vercel).

### 4.3 Vérification

Vous devriez voir 4 variables dans la liste. Vérifiez qu'elles sont toutes cochées pour les 3 environnements.

## 🚀 Étape 5 : Déployer !

1. Cliquez sur **"Deploy"** en bas de la page
2. Vercel va :
   - Cloner votre dépôt GitHub
   - Installer les dépendances (`npm install`)
   - Builder le projet (`npm run build`)
   - Déployer l'application

3. Attendez 1-2 minutes pendant le déploiement
4. Une fois terminé, vous verrez :
   - ✅ **Status** : "Ready"
   - 🌐 **URL** : `https://operaflow-xxx.vercel.app` (ou similaire)

## ✅ Étape 6 : Vérifier le déploiement

### 6.1 Ouvrir l'application

1. Cliquez sur l'URL de déploiement (ex: `https://operaflow-xxx.vercel.app`)
2. L'application devrait s'afficher avec la page d'accueil OperaFlow
3. Ouvrez la console du navigateur (F12) :
   - Pas d'erreurs rouges
   - Pas d'erreurs de connexion Supabase

### 6.2 Vérifier les logs

Dans Vercel :
1. Allez dans **"Deployments"**
2. Cliquez sur le dernier déploiement
3. Cliquez sur **"Logs"**
4. Vérifiez qu'il n'y a pas d'erreurs

### 6.3 Ajouter APP_BASE_URL (après le premier déploiement)

Une fois que vous avez l'URL Vercel :

1. Allez dans **Settings** → **Environment Variables**
2. Ajoutez :
   - **Name** : `APP_BASE_URL`
   - **Value** : `https://votre-projet.vercel.app` (remplacez par votre URL)
   - **Environnements** : ✅ Production
3. Ajoutez aussi pour Preview (si besoin) : `https://votre-projet-git-*.vercel.app`

## 🔄 Étape 7 : Déploiement automatique (CI/CD)

Une fois configuré, le déploiement est automatique :

- **Push sur `main`** → Déploiement en **Production**
- **Push sur une autre branche** → Déploiement en **Preview**
- **Pull Request** → Déploiement de preview automatique

Testez en faisant un petit changement et en poussant sur GitHub :

```bash
# Faire un petit changement (ex: modifier le README)
echo "# Test" >> test.txt
git add test.txt
git commit -m "Test déploiement automatique"
git push origin main

# Vercel déploiera automatiquement en quelques minutes !
```

## 🆘 Problèmes courants et solutions

### ❌ Erreur : "Build failed"

**Solution :**
1. Consultez les logs dans Vercel → Deployments → Logs
2. Vérifiez que toutes les dépendances sont dans `package.json`
3. Testez le build localement : `npm run build`

### ❌ Erreur : "Environment variables not found"

**Solution :**
1. Vérifiez que toutes les variables sont bien ajoutées dans Vercel
2. Vérifiez que les environnements sont bien cochés (Production, Preview, Development)
3. Redéployez après avoir ajouté les variables

### ❌ Erreur : "Cannot connect to Supabase"

**Solution :**
1. Vérifiez que les clés Supabase sont correctes dans Vercel
2. Vérifiez que l'URL Supabase est correcte
3. Testez la connexion depuis votre application locale

### ❌ Erreur : "Repository not found"

**Solution :**
1. Vérifiez que le dépôt GitHub est bien accessible
2. Vérifiez que vous avez connecté le bon compte GitHub à Vercel
3. Réimportez le projet

## 📊 Vérification finale

Votre déploiement est réussi si :

✅ **Vercel Dashboard** :
- Projet listé dans "Projects"
- Dernier déploiement en statut "Ready"
- URL accessible

✅ **Application déployée** :
- Page d'accueil s'affiche correctement
- Pas d'erreurs dans la console navigateur
- Styles TailwindCSS appliqués

✅ **Variables d'environnement** :
- Toutes les variables sont configurées
- Accessibles pour Production, Preview, Development

## 🎉 Félicitations !

Votre application OperaFlow est maintenant déployée sur Vercel ! 🚀

**URL de production** : `https://votre-projet.vercel.app`

## 📚 Ressources utiles

- [Documentation Vercel](https://vercel.com/docs)
- [Vercel Dashboard](https://vercel.com/dashboard)
- [Documentation Next.js](https://nextjs.org/docs)

## 💡 Prochaines étapes

1. ✅ Déploiement Vercel terminé
2. ⏳ Créer le schéma Supabase (voir `SUPABASE_SETUP.md`)
3. ⏳ Développer les modules fonctionnels
4. ⏳ Configurer un domaine personnalisé (optionnel)

