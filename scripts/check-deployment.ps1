# Script de vérification du déploiement OperaFlow
# PowerShell script pour vérifier le statut local et Vercel

Write-Host "🔍 Vérification du déploiement OperaFlow" -ForegroundColor Cyan
Write-Host ""

# Vérification 1: Variables d'environnement locales
Write-Host "📝 Vérification des variables d'environnement locales..." -ForegroundColor Yellow
if (Test-Path .env.local) {
    Write-Host "   ✅ Fichier .env.local trouvé" -ForegroundColor Green
    
    $envContent = Get-Content .env.local -Raw
    
    if ($envContent -match "NEXT_PUBLIC_SUPABASE_URL=https://") {
        Write-Host "   ✅ NEXT_PUBLIC_SUPABASE_URL configuré" -ForegroundColor Green
    } else {
        Write-Host "   ❌ NEXT_PUBLIC_SUPABASE_URL manquant" -ForegroundColor Red
    }
    
    if ($envContent -match "NEXT_PUBLIC_SUPABASE_ANON_KEY=") {
        Write-Host "   ✅ NEXT_PUBLIC_SUPABASE_ANON_KEY configuré" -ForegroundColor Green
    } else {
        Write-Host "   ❌ NEXT_PUBLIC_SUPABASE_ANON_KEY manquant" -ForegroundColor Red
    }
    
    if ($envContent -match "SUPABASE_SERVICE_ROLE_KEY=") {
        Write-Host "   ✅ SUPABASE_SERVICE_ROLE_KEY configuré" -ForegroundColor Green
    } else {
        Write-Host "   ❌ SUPABASE_SERVICE_ROLE_KEY manquant" -ForegroundColor Red
    }
} else {
    Write-Host "   ❌ Fichier .env.local non trouvé" -ForegroundColor Red
    Write-Host "   💡 Créez le fichier .env.local avec vos clés Supabase" -ForegroundColor Yellow
}

Write-Host ""

# Vérification 2: Dépendances
Write-Host "📦 Vérification des dépendances..." -ForegroundColor Yellow
if (Test-Path node_modules) {
    Write-Host "   ✅ node_modules trouvé" -ForegroundColor Green
    
    if (Test-Path node_modules/next) {
        Write-Host "   ✅ Next.js installé" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Next.js non installé - Exécutez: npm install" -ForegroundColor Red
    }
} else {
    Write-Host "   ❌ node_modules non trouvé - Exécutez: npm install" -ForegroundColor Red
}

Write-Host ""

# Vérification 3: Build
Write-Host "🔨 Test du build..." -ForegroundColor Yellow
try {
    $buildOutput = npm run build 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Build réussi" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Build échoué" -ForegroundColor Red
        Write-Host $buildOutput -ForegroundColor Red
    }
} catch {
    Write-Host "   ⚠️  Impossible de tester le build" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✅ Vérifications locales terminées" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Prochaines étapes:" -ForegroundColor Yellow
Write-Host "   1. Lancer l'app locale: npm run dev" -ForegroundColor White
Write-Host "   2. Ouvrir http://localhost:3000 dans votre navigateur" -ForegroundColor White
Write-Host "   3. Vérifier Vercel: https://vercel.com/dashboard" -ForegroundColor White
Write-Host ""

