#!/bin/bash
set -e

echo "🚀 ClaimGuardian Florida Data Platform - Quick Setup"
echo "=================================================="

# Check if we're in the right directory
if [[ ! -f "package.json" ]]; then
  echo "❌ Please run this script from the claimguardian-florida root directory"
  exit 1
fi

# Install dependencies
echo "📦 Installing workspace dependencies..."
pnpm install

# Create missing directories
echo "📁 Creating directory structure..."
mkdir -p services/etl/etl/{adapters,validators,loaders,utils}
mkdir -p services/api/src/{routes,lib,ws}
mkdir -p edge-functions/{parcel-risk,address-lookup}
mkdir -p models/{risk,carriers}
mkdir -p dbt/{models/{staging,marts,tests},snapshots}
mkdir -p expectations/{suites,checkpoints}
mkdir -p infra/{grafana/dashboards,k6}
mkdir -p tests/{api,etl,load}
mkdir -p scripts

echo "✅ Quick setup complete!"
echo ""
echo "Next steps:"
echo "1. Copy .env.example to .env and configure your environment"
echo "2. Start your database (Supabase CLI or Docker Compose)"
echo "3. Run the database initialization scripts in order"
echo "4. Use 'pnpm dev' to start the development servers"
echo ""
echo "See README.md for detailed instructions."