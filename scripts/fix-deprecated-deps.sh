#\!/bin/bash

echo "🧹 Cleaning up deprecated dependencies..."

# Remove node_modules and reinstall
echo "📦 Removing node_modules and reinstalling..."
rm -rf node_modules
rm -rf apps/*/node_modules
rm -rf packages/*/node_modules

# Clear pnpm cache
echo "🗑️ Clearing pnpm cache..."
pnpm store prune

# Reinstall dependencies
echo "📥 Reinstalling dependencies..."
pnpm install

# Check for deprecated packages
echo "🔍 Checking for deprecated packages..."
pnpm outdated --recursive | grep deprecated || echo "✅ No deprecated packages found in direct dependencies"

echo "✨ Cleanup complete\!"
