#!/bin/bash

# Apply audit logging tables migration
# This script applies the audit logging migration to enable security features

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}Applying audit logging tables migration...${NC}"

# Check if migration file exists
MIGRATION_FILE="supabase/migrations/20250131_audit_logging_tables.sql"

if [ ! -f "$MIGRATION_FILE" ]; then
    echo -e "${RED}Error: Migration file not found at $MIGRATION_FILE${NC}"
    exit 1
fi

# Apply migration using Supabase CLI
echo -e "${GREEN}Running migration...${NC}"
npx supabase db push

echo -e "${GREEN}✓ Audit logging tables migration applied successfully!${NC}"
echo -e "${YELLOW}Note: The following features are now enabled:${NC}"
echo "  - Audit logs table for tracking user actions"
echo "  - Security logs table for tracking auth and API events"
echo "  - Automatic audit triggers on important tables"
echo "  - Row Level Security policies for log tables"

echo -e "${GREEN}Next steps:${NC}"
echo "1. Verify tables exist: npx supabase db inspect"
echo "2. Restart your development server to enable audit logging"
echo "3. Monitor logs in the Supabase dashboard"