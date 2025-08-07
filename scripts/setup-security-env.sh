#!/bin/bash

# Setup Security Environment
# Prepares environment for security fixes

set -euo pipefail

echo "======================================"
echo "🔧 SECURITY ENVIRONMENT SETUP"
echo "======================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check if Supabase is linked
if ! supabase projects list &>/dev/null; then
    echo -e "${YELLOW}Supabase not linked. Linking to project...${NC}"
    echo ""
    echo "Your project ID is: tmlrvecuwgppbaynesji"
    echo ""

    # Link to the project
    supabase link --project-ref tmlrvecuwgppbaynesji

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Successfully linked to Supabase project${NC}"
    else
        echo -e "${RED}✗ Failed to link project${NC}"
        echo "Please run manually: supabase link --project-ref tmlrvecuwgppbaynesji"
        exit 1
    fi
else
    echo -e "${GREEN}✓ Supabase already linked${NC}"
fi

# Check database connection
echo ""
echo -e "${BLUE}Checking database connection...${NC}"

# Get database URL from Supabase
DB_URL=$(supabase db remote get 2>/dev/null || echo "")

if [ -z "$DB_URL" ]; then
    echo -e "${YELLOW}Cannot retrieve database URL automatically.${NC}"
    echo ""
    echo "Please set your DATABASE_URL environment variable:"
    echo "export DATABASE_URL='postgresql://postgres:[YOUR-PASSWORD]@db.tmlrvecuwgppbaynesji.supabase.co:5432/postgres'"
    echo ""
    echo "You can find this in your Supabase dashboard under Settings > Database"
    exit 1
else
    export DATABASE_URL="$DB_URL"
    echo -e "${GREEN}✓ Database connection configured${NC}"
fi

# Create local test environment
echo ""
echo -e "${BLUE}Setting up local test environment...${NC}"

# Start local Supabase if not running
if ! supabase status &>/dev/null; then
    echo "Starting local Supabase..."
    supabase start
fi

# Export project details
export SUPABASE_PROJECT_ID="tmlrvecuwgppbaynesji"
export PROJECT_ID="tmlrvecuwgppbaynesji"

echo ""
echo -e "${GREEN}======================================"
echo "✓ ENVIRONMENT READY FOR SECURITY FIXES"
echo "======================================${NC}"
echo ""
echo "Environment variables set:"
echo "- PROJECT_ID: $PROJECT_ID"
echo "- DATABASE_URL: [CONFIGURED]"
echo ""
echo "You can now run:"
echo "1. ./scripts/emergency-security-fix.sh"
echo "2. ./scripts/deploy-security-fixes.sh"
echo "3. ./scripts/update-edge-functions-security.sh"
echo "4. ./scripts/rotate-api-keys.sh"
echo ""
