#!/bin/bash
set -euo pipefail

# Run geospatial data loader with environment variables from .env.local
# This script safely loads environment variables without exposing them

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "Error: .env.local file not found"
    echo "Please ensure you have a .env.local file with required environment variables"
    exit 1
fi

# Export environment variables from .env.local
# This approach safely loads vars without exposing them in the script
# Use sed to clean up any inline comments and special characters
NEXT_PUBLIC_SUPABASE_URL=$(grep -E '^NEXT_PUBLIC_SUPABASE_URL=' .env.local | cut -d'=' -f2- | sed 's/\s*#.*$//' | tr -d '\n' | tr -d '"')
# The anon key appears on one line and we need to extract just the key part
NEXT_PUBLIC_SUPABASE_ANON_KEY=$(grep -E '^NEXT_PUBLIC_SUPABASE_ANON_KEY=' .env.local | cut -d'=' -f2 | cut -d'\' -f1 | tr -d '\n' | tr -d '"')

export NEXT_PUBLIC_SUPABASE_URL
export NEXT_PUBLIC_SUPABASE_ANON_KEY

# Verify required variables are set
if [ -z "${NEXT_PUBLIC_SUPABASE_URL:-}" ]; then
    echo "Error: NEXT_PUBLIC_SUPABASE_URL not found in .env.local"
    exit 1
fi

if [ -z "${NEXT_PUBLIC_SUPABASE_ANON_KEY:-}" ]; then
    echo "Error: NEXT_PUBLIC_SUPABASE_ANON_KEY not found in .env.local"
    exit 1
fi

echo "✅ Environment variables loaded securely from .env.local"
echo "🚀 Starting geospatial data loader..."

# Run the batch loader
node scripts/batch-load-geospatial-data.js "$@"