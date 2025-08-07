#!/bin/bash

# Clean build script with suppressed verbose logging
# Usage: ./scripts/build-clean.sh

echo "🚀 Starting clean build process..."

# Set environment variables to suppress verbose logging
export NODE_ENV=production
export VERBOSE_LOGS=false
export LOG_LEVEL=error

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf apps/web/.next
rm -rf packages/*/dist

# Run the build
echo "🔨 Building packages..."
pnpm build 2>&1 | grep -E "(Building|success|error|warn|failed|Tasks:|Cached:|Time:)" | grep -v "Supabase Factory" | grep -v "monitoring started" | grep -v "Redis AI Cache"

echo "✅ Build complete!"
