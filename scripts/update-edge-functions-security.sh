#!/bin/bash

# Update Edge Functions with Security Patches
# This script applies security updates to all critical Edge Functions

set -euo pipefail

echo "========================================"
echo "🔐 UPDATING EDGE FUNCTIONS SECURITY"
echo "========================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Critical functions that need security updates
CRITICAL_FUNCTIONS=(
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

# Backup directory
BACKUP_DIR="supabase/functions/_backups/$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo -e "${BLUE}Creating security update script...${NC}"

# Create security patch function
apply_security_patch() {
  local func_path="$1"
  local func_file="supabase/functions/$func_path/index.ts"

  if [ ! -f "$func_file" ]; then
    echo -e "${YELLOW}  ⚠️  Function not found: $func_path${NC}"
    return 1
  fi

  echo -e "${BLUE}Securing $func_path...${NC}"

  # Backup original
  cp "$func_file" "$BACKUP_DIR/$(basename $func_path).ts.backup"

  # Create temporary file for modifications
  local temp_file=$(mktemp)

  # Apply security patches
  awk '
  BEGIN {
    in_serve = 0
    added_origins = 0
    added_headers = 0
  }

  # Add ALLOWED_ORIGINS after imports if not present
  /^import/ && !added_origins {
    imports_done = 1
  }

  # After last import, add ALLOWED_ORIGINS
  !/^import/ && imports_done && !added_origins {
    print "// Security: Allowed origins for CORS"
    print "const ALLOWED_ORIGINS = ["
    print "  '\''https://claimguardianai.com'\'',"
    print "  '\''https://app.claimguardianai.com'\'',"
    print "  Deno.env.get('\''ENVIRONMENT'\'') === '\''development'\'' ? '\''http://localhost:3000'\'' : null"
    print "].filter(Boolean)"
    print ""
    added_origins = 1
  }

  # Fix CORS headers
  /Access-Control-Allow-Origin.*\*/ {
    gsub(/'\''Access-Control-Allow-Origin'\'': '\''*'\''/, "'\''Access-Control-Allow-Origin'\'': origin && ALLOWED_ORIGINS.includes(origin) ? origin : '\'''\''")
  }

  # Add security headers to response headers
  /Content-Type.*application\/json/ && !added_headers {
    print $0 ","
    print "    '\''X-Content-Type-Options'\'': '\''nosniff'\'',"
    print "    '\''X-Frame-Options'\'': '\''DENY'\'',"
    print "    '\''X-XSS-Protection'\'': '\''1; mode=block'\'',"
    print "    '\''Strict-Transport-Security'\'': '\''max-age=31536000; includeSubDomains'\''"
    added_headers = 1
    next
  }

  # Add origin extraction if not present
  /Deno\.serve\(async \(req/ {
    in_serve = 1
  }

  in_serve && /const corsHeaders/ && !/const origin = req\.headers\.get/ {
    print "  const origin = req.headers.get('\''origin'\'')"
    print ""
  }

  # Fix wildcard in corsHeaders object
  /corsHeaders.*=.*{/ {
    in_cors_headers = 1
  }

  in_cors_headers && /Access-Control-Allow-Origin.*\*/ {
    gsub(/'\''*'\''/, "origin && ALLOWED_ORIGINS.includes(origin) ? origin : '\'''\''")
  }

  in_cors_headers && /}/ {
    in_cors_headers = 0
  }

  # Print all lines (modified or not)
  {
    if (!added_headers || $0 !~ /Content-Type.*application\/json/) {
      print
    }
  }
  ' "$func_file" > "$temp_file"

  # Move temp file back
  mv "$temp_file" "$func_file"

  echo -e "${GREEN}  ✓ $func_path secured${NC}"
  return 0
}

# Apply patches to all critical functions
echo ""
echo -e "${BLUE}Applying security patches to critical functions...${NC}"
echo ""

updated_count=0
for func in "${CRITICAL_FUNCTIONS[@]}"; do
  if apply_security_patch "$func"; then
    ((updated_count++))
  fi
done

echo ""
echo -e "${GREEN}✓ Updated $updated_count functions${NC}"

# Create verification script
echo ""
echo -e "${BLUE}Creating verification script...${NC}"

cat > verify-edge-functions-security.sh << 'EOF'
#!/bin/bash

# Verify Edge Functions Security
echo "Verifying Edge Function Security..."
echo ""

# Check for wildcard CORS
echo "Checking for wildcard CORS headers..."
grep -r "Access-Control-Allow-Origin.*\*" supabase/functions/*/index.ts | grep -v "_templates" | grep -v "_shared" || echo "✅ No wildcard CORS found"

echo ""
echo "Checking for ALLOWED_ORIGINS..."
for func in ai-document-extraction analyze-damage-with-policy extract-policy-data policy-chat send-email; do
  if [ -f "supabase/functions/$func/index.ts" ]; then
    if grep -q "ALLOWED_ORIGINS" "supabase/functions/$func/index.ts"; then
      echo "✅ $func has ALLOWED_ORIGINS"
    else
      echo "❌ $func missing ALLOWED_ORIGINS"
    fi
  fi
done

echo ""
echo "Checking for security headers..."
for func in ai-document-extraction analyze-damage-with-policy extract-policy-data policy-chat send-email; do
  if [ -f "supabase/functions/$func/index.ts" ]; then
    if grep -q "X-Frame-Options" "supabase/functions/$func/index.ts"; then
      echo "✅ $func has security headers"
    else
      echo "❌ $func missing security headers"
    fi
  fi
done
EOF

chmod +x verify-edge-functions-security.sh

echo -e "${GREEN}✓ Verification script created${NC}"

# Summary
echo ""
echo "========================================"
echo -e "${GREEN}✅ EDGE FUNCTIONS SECURITY UPDATED${NC}"
echo "========================================"
echo ""
echo "Updated functions:"
for func in "${CRITICAL_FUNCTIONS[@]}"; do
  if [ -f "supabase/functions/$func/index.ts" ]; then
    echo "  - $func"
  fi
done
echo ""
echo "Backups saved to: $BACKUP_DIR"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Review the changes with: git diff supabase/functions/"
echo "2. Test functions locally: supabase functions serve"
echo "3. Deploy to production: supabase functions deploy"
echo "4. Verify security: ./verify-edge-functions-security.sh"
echo ""
echo -e "${GREEN}Security patches applied! Ready for deployment.${NC}"
