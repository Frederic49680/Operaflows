# ✅ Configuration Vercel - OperaFlow

## 🌐 URLs de déploiement

### URL Preview actuelle
**https://operaflows-3ma9uoys3-fredericbaudry49680-5272s-projects.vercel.app/**

Cette URL est une URL de preview. Votre URL de production devrait être plus simple, par exemple :
`https://operaflows.vercel.app` (si vous avez configuré un nom de projet)

## 🔐 Variables d'environnement à ajouter

Dans Vercel → Settings → Environment Variables, ajoutez maintenant :

### Variable APP_BASE_URL (après le déploiement)

Pour l'environnement **Production** uniquement :
- **Name** : `APP_BASE_URL`
- **Value** : `https://operaflows.vercel.app` (ou votre URL de production)

Pour l'environnement **Preview** :
- **Name** : `APP_BASE_URL`
- **Value** : `https://operaflows-3ma9uoys3-fredericbaudry49680-5272s-projects.vercel.app`

💡 **Note** : Les URLs de preview changent à chaque déploiement, donc vous pouvez utiliser une URL générique ou la mettre à jour manuellement.

## ✅ Vérifications à faire

1. **Ouvrir l'URL** : https://operaflows-3ma9uoys3-fredericbaudry49680-5272s-projects.vercel.app/
   - La page d'accueil devrait s'afficher
   - Pas d'erreurs dans la console (F12)

2. **Vérifier les logs Vercel** :
   - Allez dans Vercel Dashboard → Deployments
   - Cliquez sur le dernier déploiement
   - Vérifiez les logs : pas d'erreurs

3. **Vérifier Supabase** :
   - Ouvrez la console du navigateur (F12)
   - Onglet Console → Vérifiez qu'il n'y a pas d'erreurs de connexion Supabase

## 📊 Statut du déploiement

✅ **Déployé sur Vercel** : https://operaflows-3ma9uoys3-fredericbaudry49680-5272s-projects.vercel.app/
✅ **Déploiement local** : http://localhost:3000
✅ **GitHub** : https://github.com/Frederic49680/Operaflows.git

## 🔄 Déploiement automatique

Maintenant, chaque fois que vous poussez du code sur GitHub :

```bash
git add .
git commit -m "Description des changements"
git push origin main
```

Vercel déploiera automatiquement une nouvelle version !

## 🎯 Prochaines étapes

1. ✅ Déploiement Vercel - **TERMINÉ**
2. ⏳ Créer le schéma Supabase (voir `SUPABASE_SETUP.md`)
3. ⏳ Configurer un domaine personnalisé (optionnel)
4. ⏳ Développer les modules fonctionnels

## 📝 Notes

- L'URL de preview peut changer à chaque nouveau déploiement
- Pour avoir une URL stable, configurez un nom de projet dans Vercel ou utilisez un domaine personnalisé
- Les variables d'environnement sont déjà configurées (sauf APP_BASE_URL à ajouter)

