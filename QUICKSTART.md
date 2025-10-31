# 🚀 Guide de démarrage rapide OperaFlow

Ce guide vous permet de démarrer rapidement avec OperaFlow en 5 minutes.

## ✅ Checklist de démarrage

### 1. Installation locale (2 min)

```bash
# Installer les dépendances
npm install

# Copier et configurer les variables d'environnement
cp .env.example .env.local

# Modifier .env.local avec vos clés Supabase (voir étape 2)
```

### 2. Configuration Supabase (3 min)

1. Créez un compte sur [supabase.com](https://supabase.com)
2. Créez un nouveau projet (région: EU-Central pour RGPD)
3. Dans **Settings** → **API**, copiez :
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL` dans `.env.local`
   - `anon public key` → `NEXT_PUBLIC_SUPABASE_ANON_KEY` dans `.env.local`
   - `service_role key` → `SUPABASE_SERVICE_ROLE_KEY` dans `.env.local`
4. Dans **Storage**, créez un bucket nommé `documents` (privé)
5. Exécutez les scripts SQL du fichier `SUPABASE_SETUP.md` dans le SQL Editor

### 3. Lancer l'application

```bash
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur.

## 🔄 Prochaines étapes

1. **Déployer sur Vercel** : Suivez le guide `DEPLOYMENT.md`
2. **Configurer SendGrid** : Pour les notifications email (optionnel)
3. **Créer les premiers utilisateurs** : Via Supabase Auth
4. **Développer les modules** : Commencer par l'authentification

## 📚 Documentation

- `DEPLOYMENT.md` - Guide complet de déploiement
- `SUPABASE_SETUP.md` - Configuration détaillée Supabase
- `README.md` - Documentation générale du projet

## 🆘 Problèmes courants

### Erreur "NEXT_PUBLIC_SUPABASE_URL is not defined"
→ Vérifiez que `.env.local` existe et contient les variables d'environnement

### Erreur de connexion Supabase
→ Vérifiez que l'URL et les clés API sont correctes dans `.env.local`

### Erreur de build
→ Vérifiez la version Node.js (>= 18.0.0) : `node --version`

