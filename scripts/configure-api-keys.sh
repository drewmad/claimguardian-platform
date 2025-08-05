#!/bin/bash

# Configure All API Keys for Supabase Edge Functions
# This script helps set up all required API keys

set -euo pipefail

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔑 Configuring API Keys for Edge Functions${NC}"
echo -e "${BLUE}=========================================${NC}"
echo ""

# Check if we're in the right directory
if [[ ! -f "package.json" ]]; then
    echo -e "${RED}ERROR: Script must be run from project root directory${NC}"
    exit 1
fi

# Function to check if secret exists
check_secret() {
    local secret_name="$1"
    if supabase secrets list --linked 2>/dev/null | grep -q "$secret_name"; then
        echo -e "${GREEN}✓${NC} $secret_name already exists"
        return 0
    else
        echo -e "${YELLOW}○${NC} $secret_name not found"
        return 1
    fi
}

# Function to set a secret
set_secret() {
    local secret_name="$1"
    local secret_value="$2"
    
    if [[ -z "$secret_value" ]]; then
        echo -e "${YELLOW}⚠️  Skipping $secret_name (no value provided)${NC}"
        return 1
    fi
    
    echo -e "${BLUE}Setting $secret_name...${NC}"
    if supabase secrets set "$secret_name=$secret_value" --linked; then
        echo -e "${GREEN}✅ $secret_name set successfully${NC}"
        return 0
    else
        echo -e "${RED}❌ Failed to set $secret_name${NC}"
        return 1
    fi
}

# Step 1: Check prerequisites
echo -e "${YELLOW}📋 Checking prerequisites...${NC}"

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}ERROR: Supabase CLI is not installed${NC}"
    echo "Install with: brew install supabase/tap/supabase"
    exit 1
fi

# Check if project is linked
if ! supabase projects list 2>/dev/null | grep -q "tmlrvecuwgppbaynesji"; then
    echo -e "${RED}ERROR: Supabase project is not linked${NC}"
    echo "Link with: supabase link --project-ref tmlrvecuwgppbaynesji"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites check complete${NC}"
echo ""

# Step 2: Check current secrets
echo -e "${YELLOW}🔍 Checking current secrets...${NC}"
echo ""

# List of required secrets with descriptions
declare -A SECRETS=(
    ["OPENAI_API_KEY"]="OpenAI API key for AI features"
    ["GEMINI_API_KEY"]="Google Gemini API key for AI features"
    ["RESEND_API_KEY"]="Resend API key for email services"
    ["CLAUDE_API_KEY"]="Anthropic Claude API key (optional)"
    ["XAI_API_KEY"]="X.AI API key for Grok (optional)"
)

# Check each secret
MISSING_SECRETS=()
for secret in "${!SECRETS[@]}"; do
    if ! check_secret "$secret"; then
        MISSING_SECRETS+=("$secret")
    fi
done

echo ""

# Step 3: Prompt for missing secrets
if [[ ${#MISSING_SECRETS[@]} -gt 0 ]]; then
    echo -e "${YELLOW}📝 Missing secrets detected. Let's set them up:${NC}"
    echo ""
    
    for secret in "${MISSING_SECRETS[@]}"; do
        echo -e "${BLUE}${secret}:${NC} ${SECRETS[$secret]}"
        
        # Special instructions for each service
        case "$secret" in
            "OPENAI_API_KEY")
                echo "  Get from: https://platform.openai.com/api-keys"
                ;;
            "GEMINI_API_KEY")
                echo "  Get from: https://makersuite.google.com/app/apikey"
                ;;
            "RESEND_API_KEY")
                echo "  Get from: https://resend.com/api-keys"
                ;;
            "CLAUDE_API_KEY")
                echo "  Get from: https://console.anthropic.com/settings/keys"
                ;;
            "XAI_API_KEY")
                echo "  Get from: https://x.ai/api"
                ;;
        esac
        
        echo -n "Enter value (or press Enter to skip): "
        read -s secret_value
        echo ""
        
        if [[ -n "$secret_value" ]]; then
            set_secret "$secret" "$secret_value"
        fi
        echo ""
    done
else
    echo -e "${GREEN}✅ All required secrets are already configured${NC}"
fi

# Step 4: Set additional configuration secrets
echo ""
echo -e "${YELLOW}🔧 Setting additional configuration...${NC}"

# Email configuration
if ! check_secret "RESEND_FROM_EMAIL"; then
    set_secret "RESEND_FROM_EMAIL" "noreply@claimguardianai.com"
fi

if ! check_secret "RESEND_REPLY_TO_EMAIL"; then
    set_secret "RESEND_REPLY_TO_EMAIL" "support@claimguardianai.com"
fi

# Step 5: Verify secrets
echo ""
echo -e "${YELLOW}🔍 Verifying secrets...${NC}"
echo ""

# List all secrets (without values)
echo "Current secrets:"
supabase secrets list --linked | grep -E "(OPENAI|GEMINI|RESEND|CLAUDE|XAI|FROM_EMAIL|REPLY_TO)" || true

# Step 6: Create deployment documentation
echo ""
echo -e "${YELLOW}📄 Creating deployment documentation...${NC}"

DOC_FILE="docs/API_KEYS_SETUP.md"
cat > "$DOC_FILE" << 'EOF'
# API Keys Setup Guide

## Overview

ClaimGuardian uses several third-party APIs that require authentication. This guide covers setting up all required API keys for production deployment.

## Required API Keys

### 1. OpenAI API Key
- **Used by**: ai-document-extraction, analyze-damage-with-policy, policy-chat, ocr-document
- **Get from**: https://platform.openai.com/api-keys
- **Pricing**: Pay per token usage
- **Setup**: 
  ```bash
  supabase secrets set OPENAI_API_KEY=sk-... --linked
  ```

### 2. Google Gemini API Key
- **Used by**: AI features as fallback provider
- **Get from**: https://makersuite.google.com/app/apikey
- **Pricing**: Free tier available
- **Setup**:
  ```bash
  supabase secrets set GEMINI_API_KEY=... --linked
  ```

### 3. Resend API Key
- **Used by**: send-email function
- **Get from**: https://resend.com/api-keys
- **Pricing**: Free tier: 100 emails/day
- **Setup**:
  ```bash
  supabase secrets set RESEND_API_KEY=re_... --linked
  supabase secrets set RESEND_FROM_EMAIL=noreply@claimguardianai.com --linked
  ```

## Optional API Keys

### 4. Anthropic Claude API Key
- **Used by**: Advanced reasoning features (future)
- **Get from**: https://console.anthropic.com/settings/keys
- **Setup**:
  ```bash
  supabase secrets set CLAUDE_API_KEY=sk-ant-... --linked
  ```

### 5. X.AI API Key
- **Used by**: Specialized AI tasks (future)
- **Get from**: https://x.ai/api
- **Setup**:
  ```bash
  supabase secrets set XAI_API_KEY=... --linked
  ```

## Edge Functions Using API Keys

| Function | Required Keys | Optional Keys |
|----------|--------------|---------------|
| ai-document-extraction | OPENAI_API_KEY, GEMINI_API_KEY | - |
| analyze-damage-with-policy | OPENAI_API_KEY, GEMINI_API_KEY | - |
| extract-policy-data | OPENAI_API_KEY | GEMINI_API_KEY |
| policy-chat | OPENAI_API_KEY, GEMINI_API_KEY | - |
| send-email | RESEND_API_KEY | - |
| ocr-document | OPENAI_API_KEY | - |
| floir-extractor | OPENAI_API_KEY | - |
| floir-rag-search | OPENAI_API_KEY | - |

## Testing API Keys

### Test OpenAI Integration
```bash
curl -X POST https://tmlrvecuwgppbaynesji.supabase.co/functions/v1/policy-chat \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello, test message"}'
```

### Test Email Service
```bash
curl -X POST https://tmlrvecuwgppbaynesji.supabase.co/functions/v1/send-email \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@example.com",
    "subject": "Test Email",
    "html": "<p>This is a test email</p>"
  }'
```

## Security Best Practices

1. **Never commit API keys** to version control
2. **Use environment-specific keys** (dev/staging/prod)
3. **Set rate limits** on API usage
4. **Monitor usage** regularly
5. **Rotate keys** periodically
6. **Use least privilege** - only grant necessary permissions

## Troubleshooting

### Keys Not Working
1. Check if key is set: `supabase secrets list --linked`
2. Verify key format (some need prefixes like `sk-`)
3. Check API provider dashboard for issues
4. Review Edge Function logs

### Rate Limiting
- OpenAI: Use exponential backoff
- Gemini: Free tier has daily limits
- Resend: 100 emails/day on free tier

### Cost Management
- Set up usage alerts on each platform
- Use Gemini for non-critical features (free tier)
- Implement caching to reduce API calls
- Monitor usage in ClaimGuardian dashboard

## Quick Setup Script

Run the configuration script:
```bash
./scripts/configure-api-keys.sh
```

This will:
1. Check which keys are missing
2. Prompt for each key
3. Set them in Supabase
4. Verify the configuration
EOF

echo -e "${GREEN}✅ Documentation created at $DOC_FILE${NC}"

# Step 7: Summary
echo ""
echo -e "${GREEN}✨ API Keys Configuration Complete!${NC}"
echo ""
echo -e "${BLUE}📊 Summary:${NC}"
echo "  • Secrets are stored securely in Supabase"
echo "  • Edge Functions will automatically use these keys"
echo "  • Documentation created at $DOC_FILE"
echo ""
echo -e "${BLUE}🚀 Next Steps:${NC}"
echo "  1. Deploy Edge Functions: supabase functions deploy --linked"
echo "  2. Test each function to verify API access"
echo "  3. Monitor function logs for any issues"
echo ""
echo -e "${BLUE}🔧 Useful Commands:${NC}"
echo "  • List secrets: supabase secrets list --linked"
echo "  • Update a secret: supabase secrets set KEY=value --linked"
echo "  • Remove a secret: supabase secrets unset KEY --linked"