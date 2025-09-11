#!/bin/bash

# Script de nettoyage complet du cache TeamUp
# Supprime tous les caches qui peuvent poser problème

echo "🧹 Démarrage du nettoyage complet du cache TeamUp..."

# 1. Arrêter le serveur Next.js s'il tourne
echo "📱 Arrêt du serveur Next.js..."
pkill -f "next dev" 2>/dev/null || true
sleep 2

# 2. Supprimer le cache Next.js
echo "🗂️  Suppression du cache Next.js (.next)..."
rm -rf .next

# 3. Supprimer node_modules et package-lock.json
echo "📦 Suppression de node_modules et package-lock.json..."
rm -rf node_modules
rm -f package-lock.json

# 4. Supprimer les caches npm
echo "🔧 Nettoyage du cache npm..."
npm cache clean --force

# 5. Supprimer les caches TypeScript
echo "📝 Suppression des caches TypeScript..."
rm -f tsconfig.tsbuildinfo
rm -f *.tsbuildinfo

# 6. Supprimer les caches Webpack/Babel
echo "⚙️  Suppression des caches Webpack/Babel..."
rm -rf .cache
rm -rf .babel-cache
rm -rf .webpack-cache

# 7. Supprimer les caches du navigateur (service worker)
echo "🌐 Suppression des caches service worker..."
rm -rf .serwist
rm -rf sw-*

# 8. Supprimer les fichiers temporaires
echo "🗑️  Suppression des fichiers temporaires..."
rm -rf .tmp
rm -rf tmp
rm -f .DS_Store
find . -name ".DS_Store" -delete 2>/dev/null || true

# 9. Supprimer les logs
echo "📋 Suppression des logs..."
rm -f *.log
rm -f npm-debug.log*
rm -f yarn-debug.log*
rm -f yarn-error.log*

# 10. Réinstaller les dépendances
echo "📥 Réinstallation des dépendances..."
npm install

# 11. Vérifier la version Next.js
echo "✅ Vérification de la version Next.js..."
npm list next

echo ""
echo "🎉 Nettoyage complet terminé !"
echo "🚀 Vous pouvez maintenant redémarrer le serveur avec: npm run dev"
echo ""
