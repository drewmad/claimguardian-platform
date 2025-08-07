#!/bin/bash

# Apply Security Updates to Edge Functions
# This script applies security patches to Edge Functions properly

set -euo pipefail

echo "========================================"
echo "🔐 APPLYING EDGE FUNCTIONS SECURITY"
echo "========================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Critical functions to update
FUNCTIONS=(
  "ai-document-extraction"
  "analyze-damage-with-policy"
  "extract-policy-data"
  "policy-chat"
  "send-email"
  "ocr-document"
  "property-ai-enrichment"
  "spatial-ai-api"
  "florida/floir-extractor"
  "florida/scrape-florida-parcels"
)

# Apply security patch to a function
apply_security_to_function() {
  local func_path="$1"
  local func_file="supabase/functions/$func_path/index.ts"

  if [ ! -f "$func_file" ]; then
    echo -e "${YELLOW}  ⚠️  Function not found: $func_path${NC}"
    return 1
  fi

  echo -e "${BLUE}Securing $func_path...${NC}"

  # Create temp file
  local temp_file=$(mktemp)

  # Apply security patches with sed
  sed -E '
    # Add ALLOWED_ORIGINS after imports
    /^import.*edge-runtime\.d\.ts"$/ {
      a\
\
// Security: Allowed origins for CORS\
const ALLOWED_ORIGINS = [\
  '\''https://claimguardianai.com'\'',\
  '\''https://app.claimguardianai.com'\'',\
  Deno.env.get('\''ENVIRONMENT'\'') === '\''development'\'' ? '\''http://localhost:3000'\'' : null\
].filter(Boolean)
    }

    # Replace wildcard CORS
    s/'\''Access-Control-Allow-Origin'\'': '\''[*]'\''/'\''Access-Control-Allow-Origin'\'': origin \&\& ALLOWED_ORIGINS.includes(origin) ? origin : '\'''\''/g

    # Add origin extraction after Deno.serve
    /^Deno\.serve\(async \(req: Request\)/ {
      a\
  const origin = req.headers.get('\''origin'\'')
    }

    # Add security headers to corsHeaders
    /^const corsHeaders = \{$/ {
      a\
  '\''Access-Control-Allow-Origin'\'': origin \&\& ALLOWED_ORIGINS.includes(origin) ? origin : '\'''\'',
      d
    }

    # Add security headers after Access-Control-Allow-Headers
    /'\''Access-Control-Allow-Headers'\'':.*,$/ {
      a\
  '\''Access-Control-Allow-Methods'\'': '\''POST, OPTIONS'\'',\
  '\''X-Content-Type-Options'\'': '\''nosniff'\'',\
  '\''X-Frame-Options'\'': '\''DENY'\'',\
  '\''X-XSS-Protection'\'': '\''1; mode=block'\'',\
  '\''Strict-Transport-Security'\'': '\''max-age=31536000; includeSubDomains'\''
    }
  ' "$func_file" > "$temp_file"

  # Move temp file back
  mv "$temp_file" "$func_file"

  echo -e "${GREEN}  ✓ $func_path secured${NC}"
  return 0
}

# Apply patches
echo -e "${BLUE}Applying security patches...${NC}"
echo ""

updated=0
for func in "${FUNCTIONS[@]}"; do
  if apply_security_to_function "$func"; then
    ((updated++))
  fi
done

echo ""
echo -e "${GREEN}✓ Updated $updated functions${NC}"

# Verify
echo ""
echo -e "${BLUE}Verifying security patches...${NC}"

# Check for wildcard CORS
echo ""
echo "Checking for wildcard CORS..."
if grep -r "Access-Control-Allow-Origin.*\*" supabase/functions/*/index.ts 2>/dev/null | grep -v "_templates" | grep -v "ALLOWED_ORIGINS"; then
  echo -e "${YELLOW}⚠️  Some functions still have wildcard CORS${NC}"
else
  echo -e "${GREEN}✅ No wildcard CORS found${NC}"
fi

# Check for ALLOWED_ORIGINS
echo ""
echo "Checking for ALLOWED_ORIGINS..."
for func in ai-document-extraction analyze-damage-with-policy extract-policy-data policy-chat send-email; do
  if [ -f "supabase/functions/$func/index.ts" ]; then
    if grep -q "ALLOWED_ORIGINS" "supabase/functions/$func/index.ts"; then
      echo -e "${GREEN}✅ $func has ALLOWED_ORIGINS${NC}"
    else
      echo -e "${YELLOW}⚠️  $func missing ALLOWED_ORIGINS${NC}"
    fi
  fi
done

echo ""
echo "========================================"
echo -e "${GREEN}SECURITY PATCHES APPLIED${NC}"
echo "========================================"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Review changes: git diff supabase/functions/"
echo "2. Test locally: supabase functions serve"
echo "3. Deploy to production: supabase functions deploy"
