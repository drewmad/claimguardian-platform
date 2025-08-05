#!/bin/bash

# Set Claude and X.AI (Grok) API Keys in Supabase
# This script adds the remaining AI provider keys

set -euo pipefail

echo "========================================"
echo "🤖 SETTING CLAUDE & X.AI (GROK) API KEYS"
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

echo -e "${YELLOW}Adding Claude and X.AI (Grok) API keys:${NC}"
echo ""

# ANTHROPIC_API_KEY (for Claude)
read -p "Enter your ANTHROPIC_API_KEY for Claude: " ANTHROPIC_KEY
if [ ! -z "$ANTHROPIC_KEY" ]; then
    set_secret "ANTHROPIC_API_KEY" "$ANTHROPIC_KEY"
else
    echo -e "${YELLOW}Skipping ANTHROPIC_API_KEY${NC}"
fi

echo ""

# XAI_API_KEY (for Grok)
read -p "Enter your XAI_API_KEY for Grok: " XAI_KEY
if [ ! -z "$XAI_KEY" ]; then
    set_secret "XAI_API_KEY" "$XAI_KEY"
else
    echo -e "${YELLOW}Skipping XAI_API_KEY${NC}"
fi

# Verify all secrets
echo ""
echo -e "${BLUE}Verifying all API keys...${NC}"
echo ""
echo "Current API keys configured:"
supabase secrets list | grep -E "OPENAI|GEMINI|RESEND|ANTHROPIC|XAI" || true

echo ""
echo "========================================"
echo -e "${GREEN}✅ SETUP COMPLETE${NC}"
echo "========================================"
echo ""

echo -e "${GREEN}Your AI provider setup:${NC}"
echo "✓ OpenAI - Already configured"
echo "✓ Gemini - Already configured" 
echo "✓ Resend - Already configured"

if supabase secrets list | grep -q "ANTHROPIC_API_KEY"; then
    echo "✓ Claude (Anthropic) - Just configured"
else
    echo "○ Claude (Anthropic) - Not configured"
fi

if supabase secrets list | grep -q "XAI_API_KEY"; then
    echo "✓ X.AI (Grok) - Just configured"
else
    echo "○ X.AI (Grok) - Not configured"
fi

echo ""
echo -e "${YELLOW}Note:${NC} Claude and X.AI (Grok) are used by the AI services package"
echo "in your main app. They're now available for future Edge Functions too."