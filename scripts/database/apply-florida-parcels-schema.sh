#!/bin/bash

# Apply Florida Parcels Complete Schema
# This script applies the full 138-column Florida DOR parcels schema

set -euo pipefail

echo "========================================"
echo "🏘️  APPLYING FLORIDA PARCELS SCHEMA"
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
SQL_FILE="supabase/sql/florida_parcels_complete.sql"

# Check if SQL file exists
if [ ! -f "$SQL_FILE" ]; then
    echo -e "${RED}Error: SQL file not found: $SQL_FILE${NC}"
    exit 1
fi

echo -e "${BLUE}Schema Overview:${NC}"
echo "  - 138 columns matching Florida DOR NAL format"
echo "  - PostGIS spatial support with geometry columns"
echo "  - Full-text search on owner names"
echo "  - Comprehensive indexing for performance"
echo "  - Import status tracking"
echo ""

echo -e "${YELLOW}Warning: This will create a large table structure.${NC}"
echo "Press Ctrl+C to cancel, or wait 5 seconds to continue..."
sleep 5

echo -e "${BLUE}Applying Florida parcels schema...${NC}"

# Method 1: Try using Supabase CLI
echo -e "${BLUE}Method 1: Using Supabase CLI...${NC}"
if supabase db push "$SQL_FILE" --project-ref "$PROJECT_ID" 2>/dev/null; then
    echo -e "${GREEN}✓ Schema applied successfully via CLI${NC}"
else
    echo -e "${YELLOW}CLI method failed, trying alternative approach...${NC}"

    # Method 2: Use psql if available
    if [ -n "${DATABASE_URL:-}" ]; then
        echo -e "${BLUE}Method 2: Using psql direct connection...${NC}"
        if psql "$DATABASE_URL" -f "$SQL_FILE"; then
            echo -e "${GREEN}✓ Schema applied successfully via psql${NC}"
        else
            echo -e "${RED}Failed to apply schema via psql${NC}"
            exit 1
        fi
    else
        echo -e "${RED}DATABASE_URL not set. Cannot apply schema.${NC}"
        echo ""
        echo "To set DATABASE_URL:"
        echo "export DATABASE_URL='postgresql://postgres.[project-ref]:[password]@aws-0-us-east-1.pooler.supabase.com:6543/postgres'"
        exit 1
    fi
fi

echo ""
echo -e "${GREEN}✅ Florida parcels schema applied successfully!${NC}"
echo ""
echo "Schema includes:"
echo "  ✓ florida_parcels table with 138 DOR columns"
echo "  ✓ PostGIS spatial indexes"
echo "  ✓ Full-text search indexes on owner names"
echo "  ✓ Automatic geometry processing triggers"
echo "  ✓ Land use category mapping"
echo "  ✓ Import status tracking"
echo ""
echo "Next steps:"
echo "1. Verify schema: SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'florida_parcels';"
echo "2. Check indexes: SELECT indexname FROM pg_indexes WHERE tablename = 'florida_parcels';"
echo "3. Start importing data: ./scripts/import-florida-parcels.sh"
echo ""
echo "Table Statistics:"
echo "  - Total columns: 138 + additional fields"
echo "  - Total indexes: 40+"
echo "  - Spatial indexes: 3"
echo "  - Text search indexes: 2"
