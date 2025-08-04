#!/bin/bash

# API Key Rotation Script for ClaimGuardian
# Manages rotation of all external API keys

set -euo pipefail

echo "======================================"
echo "🔑 API KEY ROTATION MANAGER"
echo "======================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Create secure keys directory
KEYS_DIR=".keys"
mkdir -p "$KEYS_DIR"
chmod 700 "$KEYS_DIR"

# Timestamp for rotation tracking
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
ROTATION_LOG="$KEYS_DIR/rotation-log-$TIMESTAMP.txt"

# Function to securely read password
read_secret() {
    local prompt=$1
    local var_name=$2
    echo -n "$prompt"
    read -s $var_name
    echo ""
}

# Function to generate secure random key
generate_key() {
    openssl rand -base64 32 | tr -d "=+/" | cut -c1-32
}

# Function to update .env file
update_env_file() {
    local key_name=$1
    local new_value=$2
    local env_file=$3
    
    if [ -f "$env_file" ]; then
        # Create backup
        cp "$env_file" "$env_file.backup-$TIMESTAMP"
        
        # Update or add key
        if grep -q "^$key_name=" "$env_file"; then
            # Key exists, update it
            if [[ "$OSTYPE" == "darwin"* ]]; then
                # macOS
                sed -i '' "s/^$key_name=.*/$key_name=$new_value/" "$env_file"
            else
                # Linux
                sed -i "s/^$key_name=.*/$key_name=$new_value/" "$env_file"
            fi
        else
            # Key doesn't exist, add it
            echo "$key_name=$new_value" >> "$env_file"
        fi
        echo -e "${GREEN}✓ Updated $key_name in $env_file${NC}"
    else
        echo -e "${YELLOW}⚠ File not found: $env_file${NC}"
    fi
}

# Log rotation
log_rotation() {
    local service=$1
    local status=$2
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $service - $status" >> "$ROTATION_LOG"
}

echo "This script will help you rotate API keys securely."
echo ""
echo -e "${YELLOW}Prerequisites:${NC}"
echo "1. Access to your API provider dashboards"
echo "2. Supabase project access"
echo "3. Local and production .env files"
echo ""
read -p "Ready to proceed? (y/N) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 1
fi

echo ""
echo "======================================"
echo "STEP 1: Inventory Current Keys"
echo "======================================"
echo ""

# Check which keys are configured
echo "Checking current API keys configuration..."
echo ""

KEYS_TO_ROTATE=(
    "OPENAI_API_KEY"
    "GEMINI_API_KEY"
    "RESEND_API_KEY"
    "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY"
    "SENTRY_AUTH_TOKEN"
    "GOOGLE_PAGESPEED_API_KEY"
)

for key in "${KEYS_TO_ROTATE[@]}"; do
    if grep -q "^$key=" .env.local 2>/dev/null || grep -q "^$key=" .env 2>/dev/null; then
        echo -e "${GREEN}✓ $key - Configured${NC}"
    else
        echo -e "${RED}✗ $key - Not found${NC}"
    fi
done

echo ""
echo "======================================"
echo "STEP 2: Generate New Keys"
echo "======================================"
echo ""

echo "For each service, you'll need to:"
echo "1. Log into the service dashboard"
echo "2. Generate a new API key"
echo "3. Enter it here"
echo "4. We'll update your configuration"
echo ""

# OpenAI
echo -e "${BLUE}1. OpenAI API Key${NC}"
echo "   Dashboard: https://platform.openai.com/api-keys"
echo "   - Click 'Create new secret key'"
echo "   - Copy the key (you won't see it again)"
echo ""
read_secret "Enter new OpenAI API key (or press Enter to skip): " NEW_OPENAI_KEY

if [ ! -z "$NEW_OPENAI_KEY" ]; then
    update_env_file "OPENAI_API_KEY" "$NEW_OPENAI_KEY" ".env.local"
    log_rotation "OpenAI" "Rotated"
fi

# Gemini
echo ""
echo -e "${BLUE}2. Google Gemini API Key${NC}"
echo "   Dashboard: https://makersuite.google.com/app/apikey"
echo "   - Click 'Create API key'"
echo "   - Select your project"
echo ""
read_secret "Enter new Gemini API key (or press Enter to skip): " NEW_GEMINI_KEY

if [ ! -z "$NEW_GEMINI_KEY" ]; then
    update_env_file "GEMINI_API_KEY" "$NEW_GEMINI_KEY" ".env.local"
    log_rotation "Gemini" "Rotated"
fi

# Resend
echo ""
echo -e "${BLUE}3. Resend API Key${NC}"
echo "   Dashboard: https://resend.com/api-keys"
echo "   - Click 'Create API key'"
echo "   - Set permissions (send emails)"
echo ""
read_secret "Enter new Resend API key (or press Enter to skip): " NEW_RESEND_KEY

if [ ! -z "$NEW_RESEND_KEY" ]; then
    update_env_file "RESEND_API_KEY" "$NEW_RESEND_KEY" ".env.local"
    log_rotation "Resend" "Rotated"
fi

echo ""
echo "======================================"
echo "STEP 3: Update Supabase Edge Functions"
echo "======================================"
echo ""

echo "Now we need to update the keys in Supabase Edge Functions."
echo ""
echo -e "${YELLOW}Run these commands:${NC}"
echo ""

if [ ! -z "$NEW_OPENAI_KEY" ]; then
    echo "supabase secrets set OPENAI_API_KEY=\"$NEW_OPENAI_KEY\""
fi

if [ ! -z "$NEW_GEMINI_KEY" ]; then
    echo "supabase secrets set GEMINI_API_KEY=\"$NEW_GEMINI_KEY\""
fi

if [ ! -z "$NEW_RESEND_KEY" ]; then
    echo "supabase secrets set RESEND_API_KEY=\"$NEW_RESEND_KEY\""
fi

echo ""
echo "After setting secrets, redeploy Edge Functions:"
echo "supabase functions deploy"

echo ""
echo "======================================"
echo "STEP 4: Create Key Rotation Schedule"
echo "======================================"
echo ""

# Create rotation schedule
cat > "$KEYS_DIR/rotation-schedule.md" << EOF
# API Key Rotation Schedule

Generated: $(date)

## Rotation Policy
- **Critical Keys** (OpenAI, Gemini): Every 30 days
- **Email Keys** (Resend): Every 90 days
- **Public Keys** (Google Maps): Every 180 days
- **Monitoring Keys** (Sentry): Every 90 days

## Next Rotation Dates
- OpenAI API Key: $(date -d "+30 days" +%Y-%m-%d 2>/dev/null || date -v +30d +%Y-%m-%d)
- Gemini API Key: $(date -d "+30 days" +%Y-%m-%d 2>/dev/null || date -v +30d +%Y-%m-%d)
- Resend API Key: $(date -d "+90 days" +%Y-%m-%d 2>/dev/null || date -v +90d +%Y-%m-%d)
- Google Maps API Key: $(date -d "+180 days" +%Y-%m-%d 2>/dev/null || date -v +180d +%Y-%m-%d)
- Sentry Auth Token: $(date -d "+90 days" +%Y-%m-%d 2>/dev/null || date -v +90d +%Y-%m-%d)

## Rotation Checklist
1. [ ] Generate new key in provider dashboard
2. [ ] Update local .env files
3. [ ] Update Supabase secrets
4. [ ] Redeploy Edge Functions
5. [ ] Test all integrations
6. [ ] Revoke old key (after 24h)
7. [ ] Update rotation log

## Emergency Rotation
If a key is compromised:
1. Immediately generate new key
2. Update all environments
3. Revoke compromised key
4. Audit usage logs
5. Check for unauthorized access
EOF

echo -e "${GREEN}✓ Rotation schedule created: $KEYS_DIR/rotation-schedule.md${NC}"

echo ""
echo "======================================"
echo "STEP 5: Verification"
echo "======================================"
echo ""

# Create verification script
cat > "$KEYS_DIR/verify-keys.sh" << 'EOF'
#!/bin/bash

echo "Verifying API keys..."
echo ""

# Test OpenAI
if [ ! -z "$OPENAI_API_KEY" ]; then
    echo -n "Testing OpenAI API... "
    response=$(curl -s -o /dev/null -w "%{http_code}" \
        -H "Authorization: Bearer $OPENAI_API_KEY" \
        https://api.openai.com/v1/models)
    if [ "$response" = "200" ]; then
        echo "✓ Valid"
    else
        echo "✗ Invalid (HTTP $response)"
    fi
fi

# Test Gemini
if [ ! -z "$GEMINI_API_KEY" ]; then
    echo -n "Testing Gemini API... "
    response=$(curl -s -o /dev/null -w "%{http_code}" \
        "https://generativelanguage.googleapis.com/v1beta/models?key=$GEMINI_API_KEY")
    if [ "$response" = "200" ]; then
        echo "✓ Valid"
    else
        echo "✗ Invalid (HTTP $response)"
    fi
fi

# Test Resend
if [ ! -z "$RESEND_API_KEY" ]; then
    echo -n "Testing Resend API... "
    response=$(curl -s -o /dev/null -w "%{http_code}" \
        -H "Authorization: Bearer $RESEND_API_KEY" \
        https://api.resend.com/emails)
    if [ "$response" = "200" ]; then
        echo "✓ Valid"
    else
        echo "✗ Invalid (HTTP $response)"
    fi
fi

echo ""
echo "Verification complete!"
EOF

chmod +x "$KEYS_DIR/verify-keys.sh"

echo "To verify your new keys, run:"
echo "source .env.local && $KEYS_DIR/verify-keys.sh"
echo ""

echo -e "${GREEN}======================================"
echo "✓ API KEY ROTATION COMPLETE"
echo "======================================${NC}"
echo ""
echo "Summary:"
echo "- Rotation log: $ROTATION_LOG"
echo "- Rotation schedule: $KEYS_DIR/rotation-schedule.md"
echo "- Verification script: $KEYS_DIR/verify-keys.sh"
echo ""
echo -e "${YELLOW}Don't forget to:${NC}"
echo "1. Update production environment variables"
echo "2. Redeploy Edge Functions"
echo "3. Test all API integrations"
echo "4. Revoke old keys after 24 hours"
echo ""
echo -e "${RED}Security reminder:${NC} Never commit API keys to git!"