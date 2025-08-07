#!/bin/bash

# Set API Keys in Supabase Secrets
# This script helps set missing API keys for Edge Functions

set -euo pipefail

echo "========================================"
echo "🔑 SETTING API KEYS IN SUPABASE"
echo "========================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# Check if we're linked to Supabase
if ! supabase db remote get &>/dev/null; then
    echo -e "${RED}Not linked to Supabase project!${NC}"
    echo "Run: supabase link --project-ref tmlrvecuwgppbaynesji"
    exit 1
fi

echo -e "${GREEN}✓ Connected to Supabase project${NC}"
echo ""

# Function to set a secret
set_secret() {
    local key_name="$1"
    local prompt_text="$2"

    echo -e "${BLUE}Setting $key_name...${NC}"

    # Check if already set
    if supabase secrets list 2>/dev/null | grep -q "$key_name"; then
        echo -e "${YELLOW}  ⚠️  $key_name already exists${NC}"
        read -p "  Do you want to update it? (y/N) " -n 1 -r
        echo ""
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo "  Skipping $key_name"
            return
        fi
    fi

    # Prompt for value
    echo "  $prompt_text"
    read -s -p "  Enter value: " secret_value
    echo ""

    if [ -z "$secret_value" ]; then
        echo -e "${RED}  ✗ No value provided, skipping${NC}"
        return
    fi

    # Set the secret
    if supabase secrets set "$key_name=$secret_value" 2>&1 | tee /tmp/secret-set.log; then
        echo -e "${GREEN}  ✓ $key_name set successfully${NC}"
    else
        echo -e "${RED}  ✗ Failed to set $key_name${NC}"
        cat /tmp/secret-set.log
    fi
    echo ""
}

# Set required API keys
echo -e "${BLUE}Setting required API keys for Edge Functions...${NC}"
echo ""

# 1. RESEND_API_KEY (Required for send-email function)
set_secret "RESEND_API_KEY" "Resend API key for email sending (get from https://resend.com/api-keys)"

# 2. RESEND_FROM_EMAIL (Optional, has default)
echo -e "${BLUE}Setting RESEND_FROM_EMAIL...${NC}"
echo "  Default: noreply@claimguardianai.com"
read -p "  Use custom email? (y/N) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    set_secret "RESEND_FROM_EMAIL" "From email address for sending emails"
fi

# 3. Verify other critical keys are set
echo ""
echo -e "${BLUE}Checking other critical API keys...${NC}"

check_secret() {
    local key_name="$1"
    if supabase secrets list 2>/dev/null | grep -q "$key_name"; then
        echo -e "${GREEN}  ✓ $key_name is set${NC}"
    else
        echo -e "${YELLOW}  ⚠️  $key_name is not set${NC}"
    fi
}

check_secret "OPENAI_API_KEY"
check_secret "GEMINI_API_KEY"

# Show current secrets
echo ""
echo -e "${BLUE}Current secrets:${NC}"
supabase secrets list

echo ""
echo "========================================"
echo -e "${GREEN}API KEY SETUP COMPLETE${NC}"
echo "========================================"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Restart Edge Functions to use new secrets:"
echo "   supabase functions deploy send-email"
echo ""
echo "2. Test the send-email function:"
echo "   curl -X POST https://tmlrvecuwgppbaynesji.supabase.co/functions/v1/send-email \\"
echo "     -H 'Authorization: Bearer YOUR_ANON_KEY' \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"type\":\"test\",\"userId\":\"YOUR_USER_ID\"}'"
echo ""
echo -e "${GREEN}API keys configured!${NC}"
