#!/bin/bash

# Fix auth tables migration script
# This script applies the migration to fix missing columns and RLS policies

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}Fixing auth tables and RLS policies...${NC}"

# Check if migration file exists
MIGRATION_FILE="supabase/migrations/20250131_fix_auth_tables.sql"

if [ ! -f "$MIGRATION_FILE" ]; then
    echo -e "${RED}Error: Migration file not found at $MIGRATION_FILE${NC}"
    exit 1
fi

# Apply migration using Supabase CLI
echo -e "${GREEN}Running migration...${NC}"
npx supabase db push

echo -e "${GREEN}✓ Auth tables migration applied successfully!${NC}"
echo -e "${YELLOW}Note: The following issues have been fixed:${NC}"
echo "  - Missing columns in user_preferences table"
echo "  - Missing columns in consent_audit_log table"
echo "  - Created user_devices table"
echo "  - Fixed RLS policies for all user-related tables"
echo "  - Fixed capture_signup_data function parameters"

echo -e "${GREEN}Next steps:${NC}"
echo "1. Clear your browser cookies/cache"
echo "2. Try signing in again"
echo "3. Email verification should now work correctly"
