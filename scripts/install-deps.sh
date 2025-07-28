#!/bin/bash

# Robust dependency installation script for CI/CD environments
echo "📦 Starting dependency installation..."

# Function to try installation
try_install() {
  local method=$1
  echo "🔄 Attempting: $method"
  
  case $method in
    "standard")
      pnpm install --no-frozen-lockfile
      ;;
    "clean")
      rm -rf node_modules pnpm-lock.yaml
      pnpm install
      ;;
    "force")
      rm -rf node_modules pnpm-lock.yaml .pnpm-store
      pnpm install --force
      ;;
  esac
  
  return $?
}

# Try different installation methods
for method in "standard" "clean" "force"; do
  if try_install $method; then
    echo "✅ Installation successful with method: $method"
    exit 0
  else
    echo "⚠️  Method $method failed, trying next..."
  fi
done

echo "❌ All installation methods failed"
exit 1