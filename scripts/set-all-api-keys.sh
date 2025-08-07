#!/bin/bash

# Set ALL API Keys in Supabase
# This script helps you set all required API keys for Edge Functions

set -euo pipefail

echo "========================================"
echo "🔑 SETTING ALL API KEYS IN SUPABASE"
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
    local key_name=$1
    local key_value=$2

    echo -e "${BLUE}Setting ${key_name}...${NC}"
    if supabase secrets set "${key_name}=${key_value}"; then
        echo -e "${GREEN}✓ ${key_name} set successfully${NC}"
    else
        echo -e "${RED}✗ Failed to set ${key_name}${NC}"
        return 1
    fi
}

# Get API keys from user
echo -e "${YELLOW}Please enter your API keys:${NC}"
echo ""

# OPENAI_API_KEY
read -p "Enter your OPENAI_API_KEY (or press Enter to skip): " OPENAI_KEY
if [ ! -z "$OPENAI_KEY" ]; then
    set_secret "OPENAI_API_KEY" "$OPENAI_KEY"
fi

# GEMINI_API_KEY
read -p "Enter your GEMINI_API_KEY (or press Enter to skip): " GEMINI_KEY
if [ ! -z "$GEMINI_KEY" ]; then
    set_secret "GEMINI_API_KEY" "$GEMINI_KEY"
fi

# RESEND_API_KEY (already set, but allow override)
read -p "Enter your RESEND_API_KEY (or press Enter to keep existing): " RESEND_KEY
if [ ! -z "$RESEND_KEY" ]; then
    set_secret "RESEND_API_KEY" "$RESEND_KEY"
fi

# ANTHROPIC_API_KEY (for Claude)
read -p "Enter your ANTHROPIC_API_KEY (or press Enter to skip): " ANTHROPIC_KEY
if [ ! -z "$ANTHROPIC_KEY" ]; then
    set_secret "ANTHROPIC_API_KEY" "$ANTHROPIC_KEY"
fi

# GROQ_API_KEY
read -p "Enter your GROQ_API_KEY (or press Enter to skip): " GROQ_KEY
if [ ! -z "$GROQ_KEY" ]; then
    set_secret "GROQ_API_KEY" "$GROQ_KEY"
fi

# Optional: Set FROM email
echo ""
read -p "Enter RESEND_FROM_EMAIL (or press Enter for default: noreply@claimguardianai.com): " FROM_EMAIL
if [ ! -z "$FROM_EMAIL" ]; then
    set_secret "RESEND_FROM_EMAIL" "$FROM_EMAIL"
else
    set_secret "RESEND_FROM_EMAIL" "noreply@claimguardianai.com"
fi

# Verify all secrets
echo ""
echo -e "${BLUE}Verifying secrets...${NC}"
echo ""
supabase secrets list | grep -E "OPENAI|GEMINI|RESEND|ANTHROPIC|GROQ" || true

echo ""
echo "========================================"
echo -e "${GREEN}✅ API KEY SETUP COMPLETE${NC}"
echo "========================================"
echo ""

# Test which functions should now work
echo -e "${YELLOW}Functions that should now work:${NC}"
echo ""

if supabase secrets list | grep -q "OPENAI_API_KEY"; then
    echo "✓ Functions using OpenAI:"
    echo "  - policy-chat"
    echo "  - extract-policy-data"
    echo "  - ai-document-extraction"
fi

if supabase secrets list | grep -q "GEMINI_API_KEY"; then
    echo "✓ Functions using Gemini:"
    echo "  - analyze-damage-with-policy"
    echo "  - ocr-document"
fi

if supabase secrets list | grep -q "RESEND_API_KEY"; then
    echo "✓ Functions using Resend:"
    echo "  - send-email"
fi

if supabase secrets list | grep -q "ANTHROPIC_API_KEY"; then
    echo "✓ AI Services using Claude:"
    echo "  - Available for future Edge Functions"
    echo "  - Currently used in main app"
fi

if supabase secrets list | grep -q "GROQ_API_KEY"; then
    echo "✓ AI Services using Groq:"
    echo "  - Available for future Edge Functions"
    echo "  - Currently used in main app"
fi

echo ""
echo -e "${GREEN}All API keys are now configured in Supabase!${NC}"
echo ""
echo "Next steps:"
echo "1. Test your Edge Functions from the application"
echo "2. Monitor logs: supabase functions logs <function-name>"
echo "3. Check function status: ./scripts/monitor-security-status.sh"
