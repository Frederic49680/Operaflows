# ⚡ Déploiement Vercel - Guide Rapide

Vous avez déjà un dépôt GitHub : `https://github.com/Frederic49680/Operaflows.git`

## 🚀 Étapes rapides (5 minutes)

### Étape 1 : Commiter les changements récents

```bash
git add .
git commit -m "Ajout configuration Vercel et documentation"
git push origin main
```

### Étape 2 : Créer un compte Vercel

1. Allez sur [vercel.com](https://vercel.com)
2. Cliquez sur **"Sign Up"** → **"Continue with GitHub"**
3. Autorisez Vercel à accéder à vos dépôts

### Étape 3 : Importer le projet

1. Dans Vercel Dashboard, cliquez sur **"Add New..."** → **"Project"**
2. Trouvez **"Operaflows"** dans la liste et cliquez sur **"Import"**

### Étape 4 : Configurer les variables d'environnement

**⚠️ IMPORTANT : Avant de cliquer sur "Deploy"**, configurez les variables :

Dans la section **"Environment Variables"**, ajoutez ces 4 variables :

#### Variable 1
- **Name** : `NEXT_PUBLIC_SUPABASE_URL`
- **Value** : `https://xcphklkuxwmhdxnfrhgt.supabase.co`
- ✅ Cochez : Production, Preview, Development

#### Variable 2
- **Name** : `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Value** : `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjcGhrbGt1eHdtaGR4bmZyaGd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5MzA3NTYsImV4cCI6MjA3NzUwNjc1Nn0.oAV-qu1D_SGJDLxcs2RcJibtOC8bcLrsCShig68O_7A`
- ✅ Cochez : Production, Preview, Development

#### Variable 3
- **Name** : `SUPABASE_SERVICE_ROLE_KEY`
- **Value** : `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjcGhrbGt1eHdtaGR4bmZyaGd0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTkzMDc1NiwiZXhwIjoyMDc3NTA2NzU2fQ.LuLQGnk8lKy3ikClbXaa9gPT299BjUNil20e6g3qJMk`
- ✅ Cochez : Production, Preview, Development

#### Variable 4
- **Name** : `NEXTAUTH_SECRET`
- **Value** : `nHseQGA4pj4sVdjz3EtVGjgJapeKvW5bawnfYSn7HD8=`
- ✅ Cochez : Production, Preview, Development

**💡 Pour chaque variable :**
1. Cliquez sur le champ "Name" et entrez le nom
2. Cliquez sur le champ "Value" et collez la valeur
3. Cochez les 3 cases : Production, Preview, Development
4. Cliquez sur "Save"

### Étape 5 : Déployer

1. Cliquez sur **"Deploy"** en bas
2. Attendez 1-2 minutes
3. Une fois terminé, vous verrez votre URL : `https://operflows-xxx.vercel.app`

### Étape 6 : Ajouter APP_BASE_URL (après le déploiement)

Une fois que vous avez votre URL Vercel :

1. Allez dans **Settings** → **Environment Variables**
2. Ajoutez :
   - **Name** : `APP_BASE_URL`
   - **Value** : `https://votre-url-vercel.vercel.app` (remplacez par votre vraie URL)
   - ✅ Cocher : Production uniquement
3. Redéployez (ou attendez le prochain push)

## ✅ Vérification

1. Ouvrez votre URL Vercel dans le navigateur
2. La page d'accueil OperaFlow devrait s'afficher
3. Ouvrez la console (F12) - pas d'erreurs rouges

## 🎉 C'est fait !

Votre application est maintenant déployée sur Vercel !

**🔗 URL Preview** : `https://operaflows-3ma9uoys3-fredericbaudry49680-5272s-projects.vercel.app/`
**🔗 URL Production** : Vérifiez dans Vercel Dashboard → Settings → Domains

## 📝 Commandes utiles

```bash
# Après chaque changement, pour redéployer automatiquement :
git add .
git commit -m "Description du changement"
git push origin main
# Vercel déploiera automatiquement !
```

## 🆘 Problèmes ?

- **Build failed** : Vérifiez les logs dans Vercel → Deployments → Logs
- **Variables manquantes** : Vérifiez Settings → Environment Variables
- **Erreur Supabase** : Vérifiez que les clés sont correctes

Consultez `DEPLOY_VERCEL.md` pour un guide détaillé avec toutes les solutions.

