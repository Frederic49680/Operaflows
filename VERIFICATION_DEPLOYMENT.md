# ✅ Guide de vérification du déploiement OperaFlow

Ce guide vous aide à vérifier que votre application est correctement déployée en local (port 3000) et sur Vercel.

## 🏠 Déploiement local (port 3000)

### Vérification 1 : Lancer l'application

```bash
npm run dev
```

L'application devrait démarrer sur [http://localhost:3000](http://localhost:3000)

### Vérification 2 : Tests à effectuer

✅ **Page d'accueil**
- Ouvrez [http://localhost:3000](http://localhost:3000)
- Vérifiez que la page "Bienvenue sur OperaFlow" s'affiche
- Vérifiez que les styles TailwindCSS sont appliqués (couleurs bleu #0EA5E9)

✅ **Console du navigateur**
- Ouvrez les DevTools (F12)
- Onglet Console → Aucune erreur rouge
- Vérifiez qu'il n'y a pas d'erreurs de connexion Supabase

✅ **Réseau**
- Onglet Network → Rechargez la page
- Vérifiez que les requêtes vers Supabase fonctionnent (status 200)

### Vérification 3 : Build de production locale

```bash
npm run build
npm start
```

L'application devrait fonctionner en mode production sur [http://localhost:3000](http://localhost:3000)

## ☁️ Déploiement Vercel

### Vérification 1 : Statut du projet Vercel

1. Allez sur [vercel.com](https://vercel.com)
2. Connectez-vous à votre compte
3. Vérifiez que le projet `OperaFlow` est listé
4. Vérifiez le statut du dernier déploiement :
   - ✅ **Ready** = Déploiement réussi
   - ⏳ **Building** = En cours de construction
   - ❌ **Error** = Erreur à corriger

### Vérification 2 : Variables d'environnement Vercel

Dans Vercel → **Settings** → **Environment Variables**, vérifiez que ces variables sont configurées :

| Variable | Valeur attendue | Statut |
|----------|----------------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xcphklkuxwmhdxnfrhgt.supabase.co` | ⬜ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Votre clé anon | ⬜ |
| `SUPABASE_SERVICE_ROLE_KEY` | Votre clé service role | ⬜ |
| `NEXTAUTH_SECRET` | Clé secrète générée | ⬜ |
| `APP_BASE_URL` | URL de votre projet Vercel | ⬜ |

**⚠️ Important** : Assurez-vous que ces variables sont définies pour **Production**, **Preview** et **Development**.

### Vérification 3 : Test de l'application déployée

1. Ouvrez l'URL de déploiement Vercel (ex: `https://operaflow.vercel.app`)
2. Vérifiez que la page d'accueil s'affiche correctement
3. Testez la console du navigateur (F12) :
   - Pas d'erreurs dans la console
   - Pas d'erreurs de connexion Supabase

### Vérification 4 : Logs Vercel

Dans Vercel → **Deployments** → Cliquez sur le dernier déploiement → **Logs**

✅ **Logs à vérifier :**
- Build réussi : `✓ Compiled successfully`
- Aucune erreur de build
- Les variables d'environnement sont chargées

❌ **Erreurs courantes :**
- `NEXT_PUBLIC_SUPABASE_URL is not defined` → Variable manquante
- `Build failed` → Erreur de compilation (voir détails)
- `Module not found` → Dépendance manquante

## 🔍 Vérification des deux environnements

### Checklist complète

#### Local (port 3000)
- [ ] `npm run dev` fonctionne sans erreur
- [ ] Application accessible sur http://localhost:3000
- [ ] Page d'accueil s'affiche correctement
- [ ] Pas d'erreurs dans la console navigateur
- [ ] Les styles TailwindCSS sont appliqués
- [ ] `npm run build` fonctionne sans erreur

#### Vercel
- [ ] Projet visible dans le tableau de bord Vercel
- [ ] Dernier déploiement en statut "Ready"
- [ ] Toutes les variables d'environnement sont configurées
- [ ] Application accessible sur l'URL Vercel
- [ ] Page d'accueil s'affiche correctement
- [ ] Pas d'erreurs dans la console navigateur
- [ ] Les logs de build sont propres

## 🛠️ Commandes de diagnostic

### Vérifier la configuration locale

```bash
# Vérifier que les variables d'environnement sont chargées
npm run dev
# Ouvrir http://localhost:3000 et vérifier la console

# Tester le build
npm run build

# Vérifier TypeScript
npm run type-check

# Vérifier le linter
npm run lint
```

### Vérifier la connexion Supabase

Dans la console du navigateur (F12), tapez :

```javascript
// Vérifier que Supabase est chargé
console.log(process.env.NEXT_PUBLIC_SUPABASE_URL);
// Devrait afficher : https://xcphklkuxwmhdxnfrhgt.supabase.co
```

## 📊 Comparaison Local vs Vercel

| Aspect | Local (3000) | Vercel |
|--------|-------------|--------|
| **URL** | http://localhost:3000 | https://votre-projet.vercel.app |
| **Variables** | `.env.local` | Settings → Environment Variables |
| **Build** | `npm run build` | Automatique lors du push |
| **Hot Reload** | ✅ Oui | ❌ Non (nouveau déploiement) |
| **Logs** | Terminal | Vercel Dashboard → Logs |
| **Debug** | DevTools | DevTools + Vercel Logs |

## 🔄 Workflow recommandé

1. **Développement local** :
   - Travaillez sur `npm run dev`
   - Testez localement avant de commit

2. **Déploiement Vercel** :
   - Commitez et pushez sur GitHub
   - Vercel déploie automatiquement
   - Testez sur l'URL Vercel

3. **Vérification** :
   - Testez les deux environnements
   - Vérifiez les logs en cas d'erreur

## 🆘 Dépannage

### Erreur : "Cannot find module"
```bash
# Solution : Réinstaller les dépendances
rm -rf node_modules package-lock.json
npm install
```

### Erreur : Variables d'environnement non trouvées
- Vérifiez que `.env.local` existe (local)
- Vérifiez les variables dans Vercel Settings (production)

### Erreur : Connexion Supabase échouée
- Vérifiez l'URL et les clés dans `.env.local`
- Vérifiez que les variables sont bien configurées dans Vercel
- Vérifiez les logs Supabase dans le dashboard

### Build Vercel échoue
1. Consultez les logs de build dans Vercel
2. Testez le build localement : `npm run build`
3. Vérifiez que toutes les dépendances sont dans `package.json`

## ✅ Confirmation finale

Votre déploiement est réussi si :

✅ **Local** :
- Application accessible sur http://localhost:3000
- Aucune erreur dans la console
- Build fonctionne : `npm run build`

✅ **Vercel** :
- Dernier déploiement en statut "Ready"
- Application accessible sur l'URL Vercel
- Aucune erreur dans la console
- Toutes les variables d'environnement configurées

🎉 **Félicitations ! Vous êtes déployé sur les deux environnements !**

