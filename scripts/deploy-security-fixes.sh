#!/bin/bash

# ClaimGuardian Security Fix Deployment Script
# This script applies critical security remediations

set -euo pipefail

echo "=================================="
echo "🔐 CLAIMGUARDIAN SECURITY FIX DEPLOYMENT"
echo "=================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: Must run from project root directory${NC}"
    exit 1
fi

# Function to prompt for confirmation
confirm() {
    echo -e "${YELLOW}$1${NC}"
    read -p "Continue? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${RED}Aborted.${NC}"
        exit 1
    fi
}

# Step 1: Backup current database
echo -e "${GREEN}Step 1: Creating database backup...${NC}"
BACKUP_FILE="backup-pre-security-$(date +%Y%m%d-%H%M%S).sql"

if command -v supabase &> /dev/null; then
    echo "Creating backup with Supabase CLI..."
    supabase db dump -f "$BACKUP_FILE" --data-only=false
    echo -e "${GREEN}✓ Backup saved to: $BACKUP_FILE${NC}"
else
    echo -e "${YELLOW}⚠ Supabase CLI not found. Please backup manually before proceeding.${NC}"
    confirm "Have you created a manual backup?"
fi

# Step 2: Test remediation script locally first
echo ""
echo -e "${GREEN}Step 2: Testing remediation script...${NC}"
confirm "This will test the security fixes on your LOCAL database. Make sure Supabase is running locally."

if [ -f "scripts/security-remediation.sql" ]; then
    echo "Applying security fixes to local database..."
    psql "postgresql://postgres:postgres@localhost:54322/postgres" < scripts/security-remediation.sql

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Local test successful${NC}"
    else
        echo -e "${RED}✗ Local test failed. Please fix errors before proceeding.${NC}"
        exit 1
    fi
else
    echo -e "${RED}Error: security-remediation.sql not found${NC}"
    exit 1
fi

# Step 3: Check security status locally
echo ""
echo -e "${GREEN}Step 3: Checking local security status...${NC}"
psql "postgresql://postgres:postgres@localhost:54322/postgres" -c "SELECT * FROM check_security_status();" -t

# Step 4: Deploy to production
echo ""
echo -e "${YELLOW}⚠️  PRODUCTION DEPLOYMENT${NC}"
echo "This will apply security fixes to your PRODUCTION database."
echo "Make sure you have:"
echo "  1. Created a backup"
echo "  2. Notified your team"
echo "  3. Prepared for potential downtime"
echo ""
confirm "Deploy security fixes to PRODUCTION?"

# Apply to production using Supabase CLI
echo "Applying security fixes to production..."
supabase db push --include-all

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Production deployment successful${NC}"
else
    echo -e "${RED}✗ Production deployment failed${NC}"
    echo "Please check the logs and restore from backup if needed:"
    echo "  psql \$DATABASE_URL < $BACKUP_FILE"
    exit 1
fi

# Step 5: Verify production fixes
echo ""
echo -e "${GREEN}Step 5: Verifying production security status...${NC}"
echo "Run this SQL in your Supabase dashboard to verify:"
echo ""
echo "SELECT * FROM check_security_status();"
echo ""

# Step 6: Enable additional security features
echo -e "${GREEN}Step 6: Additional security configurations...${NC}"
echo ""
echo "Please complete these manual steps in your Supabase dashboard:"
echo ""
echo "1. Enable Leaked Password Protection:"
echo "   - Go to Authentication > Providers"
echo "   - Enable 'Leaked password protection'"
echo ""
echo "2. Configure SMTP for security alerts:"
echo "   - Go to Settings > Email"
echo "   - Configure SMTP settings"
echo ""
echo "3. Review and update API keys:"
echo "   - Rotate all API keys (OpenAI, Gemini, etc.)"
echo "   - Update in Settings > Edge Functions"
echo ""

echo -e "${GREEN}=================================="
echo "✓ Security remediation script deployed!"
echo "=================================="
echo ""
echo "Next steps:"
echo "1. Monitor application for any issues"
echo "2. Run security verification queries"
echo "3. Update Edge Functions with secure template"
echo "4. Test all authentication flows"
echo ""
echo -e "${YELLOW}Remember to update your .env files with any new security configurations!${NC}"
