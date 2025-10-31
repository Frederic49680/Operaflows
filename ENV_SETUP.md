# Configuration des variables d'environnement

## 📝 Créer le fichier .env.local

Créez un fichier `.env.local` à la racine du projet avec le contenu suivant :

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xcphklkuxwmhdxnfrhgt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjcGhrbGt1eHdtaGR4bmZyaGd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5MzA3NTYsImV4cCI6MjA3NzUwNjc1Nn0.oAV-qu1D_SGJDLxcs2RcJibtOC8bcLrsCShig68O_7A
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjcGhrbGt1eHdtaGR4bmZyaGd0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTkzMDc1NiwiZXhwIjoyMDc3NTA2NzU2fQ.LuLQGnk8lKy3ikClbXaa9gPT299BjUNil20e6g3qJMk

# Application Configuration
NEXTAUTH_SECRET=nHseQGA4pj4sVdjz3EtVGjgJapeKvW5bawnfYSn7HD8=
APP_BASE_URL=http://localhost:3000

# SendGrid Configuration (Optional)
# SENDGRID_API_KEY=your_sendgrid_api_key

# Supabase Storage
SUPABASE_STORAGE_BUCKET=documents

# Optional: Supabase Edge Functions
# SUPABASE_FUNCTION_URL=your_supabase_function_url
```

## ⚡ Commande rapide (Windows PowerShell)

```powershell
@"
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xcphklkuxwmhdxnfrhgt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjcGhrbGt1eHdtaGR4bmZyaGd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5MzA3NTYsImV4cCI6MjA3NzUwNjc1Nn0.oAV-qu1D_SGJDLxcs2RcJibtOC8bcLrsCShig68O_7A
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjcGhrbGt1eHdtaGR4bmZyaGd0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTkzMDc1NiwiZXhwIjoyMDc3NTA2NzU2fQ.LuLQGnk8lKy3ikClbXaa9gPT299BjUNil20e6g3qJMk

# Application Configuration
NEXTAUTH_SECRET=nHseQGA4pj4sVdjz3EtVGjgJapeKvW5bawnfYSn7HD8=
APP_BASE_URL=http://localhost:3000

# SendGrid Configuration (Optional)
# SENDGRID_API_KEY=your_sendgrid_api_key

# Supabase Storage
SUPABASE_STORAGE_BUCKET=documents
"@ | Out-File -FilePath .env.local -Encoding utf8
```

## ⚡ Commande rapide (Linux/Mac)

```bash
cat > .env.local << 'EOF'
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xcphklkuxwmhdxnfrhgt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjcGhrbGt1eHdtaGR4bmZyaGd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5MzA3NTYsImV4cCI6MjA3NzUwNjc1Nn0.oAV-qu1D_SGJDLxcs2RcJibtOC8bcLrsCShig68O_7A
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjcGhrbGt1eHdtaGR4bmZyaGd0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTkzMDc1NiwiZXhwIjoyMDc3NTA2NzU2fQ.LuLQGnk8lKy3ikClbXaa9gPT299BjUNil20e6g3qJMk

# Application Configuration
NEXTAUTH_SECRET=nHseQGA4pj4sVdjz3EtVGjgJapeKvW5bawnfYSn7HD8=
APP_BASE_URL=http://localhost:3000

# SendGrid Configuration (Optional)
# SENDGRID_API_KEY=your_sendgrid_api_key

# Supabase Storage
SUPABASE_STORAGE_BUCKET=documents
EOF
```

## ✅ Vérification

Une fois le fichier créé, vérifiez que tout fonctionne :

```bash
npm run dev
```

L'application devrait se connecter à Supabase sans erreur.

## 🔒 Sécurité

⚠️ **Important** : 
- Ne commitez **jamais** le fichier `.env.local` (il est déjà dans `.gitignore`)
- Ne partagez **jamais** votre `SUPABASE_SERVICE_ROLE_KEY` publiquement
- Pour Vercel, ajoutez ces variables dans les paramètres du projet (pas dans le code)

