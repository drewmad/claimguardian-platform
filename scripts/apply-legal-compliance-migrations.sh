#!/bin/bash

# Script to apply legal compliance migrations
# Run this to set up the complete legal compliance system

set -e

echo "🔐 Setting up Legal Compliance System..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI not found. Please install it first.${NC}"
    exit 1
fi

# Get the directory of this script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

cd "$PROJECT_ROOT"

echo -e "${YELLOW}📋 Applying migrations in order...${NC}"

# Apply migrations in the correct order
migrations=(
    "20250129_legal_compliance_system.sql"
    "20250129_complete_legal_compliance_cascade.sql"
    "20250129_update_existing_tables_cascade.sql"
    "20250129_consent_rpc_functions.sql"
)

for migration in "${migrations[@]}"; do
    echo -e "\n${YELLOW}▶ Applying migration: $migration${NC}"
    
    if [ -f "supabase/migrations/$migration" ]; then
        # Apply the migration using supabase db execute
        supabase db execute --file "supabase/migrations/$migration"
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ Successfully applied: $migration${NC}"
        else
            echo -e "${RED}❌ Failed to apply: $migration${NC}"
            exit 1
        fi
    else
        echo -e "${RED}❌ Migration file not found: $migration${NC}"
        exit 1
    fi
done

echo -e "\n${YELLOW}📋 Seeding legal documents...${NC}"

# Apply legal documents seed if it exists
if [ -f "supabase/seeds/legal_documents.sql" ]; then
    supabase db execute --file "supabase/seeds/legal_documents.sql"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Successfully seeded legal documents${NC}"
    else
        echo -e "${RED}❌ Failed to seed legal documents${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠️  Legal documents seed file not found, skipping...${NC}"
fi

echo -e "\n${GREEN}🎉 Legal Compliance System setup complete!${NC}"

echo -e "\n${YELLOW}📌 Next steps:${NC}"
echo "1. Update your environment variables with compliance API keys"
echo "2. Test the signup flow with enhanced data capture"
echo "3. Verify legal documents are accessible at /legal/*"
echo "4. Check RLS policies are working correctly"
echo "5. Test consent tracking in the database"

echo -e "\n${YELLOW}📊 Database tables created:${NC}"
echo "- legal_documents (versioned legal docs)"
echo "- user_consents (consent tracking)"
echo "- user_sessions (session management)"
echo "- consent_audit_log (audit trail)"
echo "- user_devices (device tracking)"
echo "- login_activity (enhanced)"
echo "- profiles (enhanced with compliance fields)"

echo -e "\n${YELLOW}🔧 RPC functions created:${NC}"
echo "- get_user_consent_status()"
echo "- record_user_consent()"
echo "- get_active_legal_documents()"
echo "- needs_reaccept()"
echo "- export_user_data() (GDPR compliance)"
echo "- anonymize_user_data() (Right to be forgotten)"

echo -e "\n${GREEN}✨ Legal Compliance System is ready!${NC}"