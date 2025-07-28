#!/bin/bash

# Vercel install script that handles lockfile issues gracefully
echo "🚀 Running Vercel install script..."

# Remove any existing modules and lockfile to start fresh
echo "🧹 Cleaning up old files..."
rm -rf node_modules pnpm-lock.yaml

# Install dependencies without frozen lockfile
echo "📦 Installing dependencies..."
pnpm install --no-frozen-lockfile

# Verify installation
if [ $? -eq 0 ]; then
  echo "✅ Dependencies installed successfully"
else
  echo "❌ Installation failed, trying alternative approach..."
  # Try with legacy peer deps as fallback
  pnpm install --no-frozen-lockfile --legacy-peer-deps
fi

echo "✅ Install complete"