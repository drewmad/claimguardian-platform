#!/bin/bash

# Apply AI Cost Tracking Schema
# This script applies the AI cost tracking schema to the production database

set -euo pipefail

echo "========================================"
echo "🚀 APPLYING AI COST TRACKING SCHEMA"
echo "========================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# Project details
PROJECT_ID="tmlrvecuwgppbaynesji"
SQL_FILE="supabase/sql/ai-cost-tracking.sql"

echo -e "${BLUE}Applying AI cost tracking schema...${NC}"

# Read the SQL file
if [ ! -f "$SQL_FILE" ]; then
    echo -e "${RED}Error: SQL file not found: $SQL_FILE${NC}"
    exit 1
fi

# Apply the schema using supabase CLI
echo -e "${BLUE}Creating tables and views...${NC}"

# Try to apply directly
if supabase db push "$SQL_FILE" --project-ref "$PROJECT_ID" 2>/dev/null; then
    echo -e "${GREEN}✓ Schema applied successfully via CLI${NC}"
else
    echo -e "${YELLOW}CLI method failed, trying alternative approach...${NC}"
    
    # Alternative: Use psql directly
    if [ -n "${DATABASE_URL:-}" ]; then
        echo -e "${BLUE}Applying via psql...${NC}"
        psql "$DATABASE_URL" -f "$SQL_FILE"
        echo -e "${GREEN}✓ Schema applied successfully via psql${NC}"
    else
        echo -e "${RED}DATABASE_URL not set. Please run:${NC}"
        echo "export DATABASE_URL='postgresql://postgres.[project-ref]:[password]@aws-0-us-east-1.pooler.supabase.com:6543/postgres'"
        exit 1
    fi
fi

echo ""
echo -e "${GREEN}AI cost tracking schema applied successfully!${NC}"
echo ""
echo "Next steps:"
echo "1. Deploy Edge Functions: ./scripts/deploy-secure-edge-functions.sh"
echo "2. Test the dashboard at: /admin/ai-costs"