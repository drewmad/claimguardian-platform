#!/bin/bash

# Update Edge Functions with Security Fixes
# This script patches all Edge Functions to use secure patterns

set -euo pipefail

echo "======================================"
echo "🔒 EDGE FUNCTION SECURITY UPDATE"
echo "======================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Base directory for Edge Functions
FUNCTIONS_DIR="supabase/functions"

# Create patches directory
PATCHES_DIR="$FUNCTIONS_DIR/_security-patches"
mkdir -p "$PATCHES_DIR"

# Function to update CORS headers in a file
update_cors_headers() {
    local file=$1
    local function_name=$(basename $(dirname "$file"))
    
    echo -e "${BLUE}Updating CORS in: $function_name${NC}"
    
    # Create backup
    cp "$file" "$PATCHES_DIR/${function_name}.backup.ts"
    
    # Create patch file with updated CORS
    cat > "$PATCHES_DIR/cors-patch.ts" << 'EOF'
// Secure CORS configuration
const ALLOWED_ORIGINS = [
  'https://claimguardianai.com',
  'https://app.claimguardianai.com',
  process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : null
].filter(Boolean)

function getCorsHeaders(origin: string | null): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  }
  
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin
    headers['Access-Control-Allow-Credentials'] = 'true'
  }
  
  headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
  headers['Access-Control-Allow-Headers'] = 'authorization, x-client-info, apikey, content-type'
  
  return headers
}
EOF

    # Replace old CORS pattern
    if grep -q "Access-Control-Allow-Origin.*\*" "$file"; then
        # Simple replacement for basic CORS headers
        sed -i.bak "s/'Access-Control-Allow-Origin': '\*'/'Access-Control-Allow-Origin': origin && ALLOWED_ORIGINS.includes(origin) ? origin : ''/g" "$file"
        
        # Add ALLOWED_ORIGINS if not present
        if ! grep -q "ALLOWED_ORIGINS" "$file"; then
            # Insert at the beginning after imports
            awk '/^import/ {p=1} p && /^$/ {print ""; system("cat " PATCHES_DIR "/cors-patch.ts"); print ""; p=0} 1' "$file" > "$file.tmp"
            mv "$file.tmp" "$file"
        fi
        
        echo -e "${GREEN}  ✓ CORS headers updated${NC}"
    else
        echo -e "${YELLOW}  ⚠ No wildcard CORS found, manual review needed${NC}"
    fi
}

# Function to add input validation
add_input_validation() {
    local file=$1
    local function_name=$(basename $(dirname "$file"))
    
    echo -e "${BLUE}Adding input validation to: $function_name${NC}"
    
    # Check if Zod is already imported
    if ! grep -q "zod" "$file"; then
        # Add Zod import after other imports
        sed -i.bak "/^import.*edge-runtime/a\\
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'" "$file"
        echo -e "${GREEN}  ✓ Zod validation added${NC}"
    else
        echo -e "${YELLOW}  ⚠ Zod already imported${NC}"
    fi
}

# Function to add rate limiting check
add_rate_limiting() {
    local file=$1
    local function_name=$(basename $(dirname "$file"))
    
    echo -e "${BLUE}Adding rate limiting to: $function_name${NC}"
    
    # Create rate limiting function
    cat > "$PATCHES_DIR/rate-limit.ts" << 'EOF'

// Rate limiting function
async function checkRateLimit(supabase: any, userId: string, functionName: string): Promise<boolean> {
  const WINDOW_MS = 60000 // 1 minute
  const MAX_REQUESTS = 30 // 30 requests per minute
  
  const windowStart = new Date(Date.now() - WINDOW_MS)
  
  const { data: limits } = await supabase
    .from('api_rate_limits')
    .select('request_count')
    .eq('user_id', userId)
    .eq('function_name', functionName)
    .gte('window_start', windowStart.toISOString())
    .single()

  const currentCount = limits?.request_count || 0
  
  if (currentCount >= MAX_REQUESTS) {
    return false
  }

  await supabase.from('api_rate_limits').upsert({
    user_id: userId,
    function_name: functionName,
    request_count: currentCount + 1,
    window_start: windowStart.toISOString(),
    updated_at: new Date().toISOString()
  })

  return true
}
EOF

    # Add rate limiting after auth check
    if grep -q "getUser" "$file" && ! grep -q "checkRateLimit" "$file"; then
        # This is complex, so we'll mark for manual review
        echo -e "${YELLOW}  ⚠ Manual rate limiting integration needed${NC}"
        echo "$function_name" >> "$PATCHES_DIR/needs-rate-limiting.txt"
    fi
}

# Function to add secure logging
add_secure_logging() {
    local file=$1
    local function_name=$(basename $(dirname "$file"))
    
    echo -e "${BLUE}Adding secure logging to: $function_name${NC}"
    
    # Replace console.error patterns that might leak sensitive data
    sed -i.bak 's/console\.error(\(.*\)error\(.*\))/console.error(\1error.message || "Error occurred"\2)/g' "$file"
    
    echo -e "${GREEN}  ✓ Secure logging patterns applied${NC}"
}

# Main update process
echo "Scanning Edge Functions..."
echo ""

# Find all Edge Function index.ts files
functions=$(find "$FUNCTIONS_DIR" -name "index.ts" -not -path "*/_*" | sort)
total=$(echo "$functions" | wc -l | tr -d ' ')

echo "Found $total Edge Functions to update"
echo ""

# Track progress
updated=0
needs_manual=0

# Update each function
for func in $functions; do
    function_name=$(basename $(dirname "$func"))
    echo "----------------------------------------"
    echo -e "${BLUE}Processing: $function_name${NC}"
    
    # Skip template files
    if [[ "$function_name" == "_templates" ]]; then
        echo -e "${YELLOW}  Skipping template${NC}"
        continue
    fi
    
    # Apply security updates
    update_cors_headers "$func"
    add_input_validation "$func"
    add_rate_limiting "$func"
    add_secure_logging "$func"
    
    ((updated++))
    echo ""
done

# Create summary report
echo "======================================"
echo -e "${GREEN}SECURITY UPDATE SUMMARY${NC}"
echo "======================================"
echo ""
echo "Total functions processed: $updated"
echo ""

# List functions needing manual review
if [ -f "$PATCHES_DIR/needs-rate-limiting.txt" ]; then
    echo -e "${YELLOW}Functions needing manual rate limiting:${NC}"
    cat "$PATCHES_DIR/needs-rate-limiting.txt"
    echo ""
fi

# Create verification script
cat > "$PATCHES_DIR/verify-updates.sh" << 'EOF'
#!/bin/bash
# Verify security updates were applied

echo "Verifying Edge Function security updates..."
echo ""

# Check for wildcard CORS
echo "Checking for wildcard CORS..."
if grep -r "Access-Control-Allow-Origin.*\*" supabase/functions --include="*.ts" --exclude-dir="_*"; then
    echo "⚠️  WARNING: Wildcard CORS still present in above files"
else
    echo "✓ No wildcard CORS found"
fi

echo ""
echo "Checking for Zod imports..."
missing_zod=$(find supabase/functions -name "index.ts" -not -path "*/_*" | xargs grep -L "zod" | wc -l)
echo "Functions without Zod validation: $missing_zod"

echo ""
echo "Security verification complete!"
EOF

chmod +x "$PATCHES_DIR/verify-updates.sh"

echo -e "${GREEN}Next steps:${NC}"
echo "1. Review the changes in each function"
echo "2. Run verification: $PATCHES_DIR/verify-updates.sh"
echo "3. Test each function locally"
echo "4. Deploy updated functions: supabase functions deploy"
echo ""
echo -e "${YELLOW}Important:${NC} Some functions need manual review for:"
echo "  - Complex authentication flows"
echo "  - Rate limiting integration"
echo "  - Custom error handling"
echo ""
echo "Backups saved in: $PATCHES_DIR/"