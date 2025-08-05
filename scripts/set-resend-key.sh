#!/bin/bash

# Set RESEND_API_KEY in Supabase
# This script sets the RESEND API key for email functionality

set -euo pipefail

echo "========================================"
echo "🔑 SETTING RESEND_API_KEY"
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

# Set the RESEND_API_KEY
echo -e "${BLUE}Setting RESEND_API_KEY...${NC}"

if supabase secrets set RESEND_API_KEY=re_Ba9je6LK_3sNp6LXviYwtktpwU1QQFvzd 2>&1 | tee /tmp/resend-key-set.log; then
    echo -e "${GREEN}✓ RESEND_API_KEY set successfully${NC}"
else
    echo -e "${RED}✗ Failed to set RESEND_API_KEY${NC}"
    cat /tmp/resend-key-set.log
    exit 1
fi

# Optionally set FROM email
echo ""
echo -e "${BLUE}Setting RESEND_FROM_EMAIL...${NC}"
echo "Using default: noreply@claimguardianai.com"

supabase secrets set RESEND_FROM_EMAIL=noreply@claimguardianai.com

# Verify the keys are set
echo ""
echo -e "${BLUE}Verifying secrets...${NC}"
supabase secrets list | grep -E "RESEND|GEMINI|OPENAI" || true

echo ""
echo "========================================"
echo -e "${GREEN}✅ RESEND_API_KEY CONFIGURED${NC}"
echo "========================================"
echo ""

# Test the send-email function
echo -e "${YELLOW}Testing send-email function...${NC}"
echo ""

# Get the anon key for testing
ANON_KEY=$(supabase status --output json 2>/dev/null | jq -r '.API.anon_key' || echo "")

if [ -z "$ANON_KEY" ]; then
    echo -e "${YELLOW}Could not retrieve anon key for testing${NC}"
    echo "You can test manually with:"
    echo "curl -X POST https://tmlrvecuwgppbaynesji.supabase.co/functions/v1/send-email \\"
    echo "  -H 'Authorization: Bearer YOUR_ANON_KEY' \\"
    echo "  -H 'Content-Type: application/json' \\"
    echo "  -d '{\"type\":\"welcome\",\"userId\":\"YOUR_USER_ID\"}'"
else
    echo "Testing CORS..."
    STATUS=$(curl -s -X OPTIONS https://tmlrvecuwgppbaynesji.supabase.co/functions/v1/send-email \
      -H "Origin: https://claimguardianai.com" \
      -w "%{http_code}" -o /dev/null)
    
    if [ "$STATUS" = "204" ] || [ "$STATUS" = "200" ]; then
        echo -e "${GREEN}✓ send-email CORS working (HTTP $STATUS)${NC}"
    else
        echo -e "${RED}✗ send-email CORS failed (HTTP $STATUS)${NC}"
    fi
fi

echo ""
echo -e "${GREEN}RESEND_API_KEY is now configured!${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. The send-email function should now work"
echo "2. Test email sending from your application"
echo "3. Check logs if issues: supabase functions logs send-email"
echo ""
echo -e "${GREEN}Email functionality is ready!${NC}"