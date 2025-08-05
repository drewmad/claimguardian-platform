#!/bin/bash
set -euo pipefail

# Fix Edge Function Deno Type Issues
# This script fixes all Deno type errors in Edge Functions

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔧 Fixing Edge Function Deno Type Issues${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if we're in the right directory
if [[ ! -f "package.json" ]]; then
    echo -e "${RED}ERROR: Run this script from the project root directory${NC}"
    exit 1
fi

cd supabase/functions

# Functions that need fixing
FUNCTIONS_TO_FIX=(
    "ai-document-extraction"
    "analyze-damage-with-policy"
    "property-ai-enrichment"
    "extract-policy-data"
    "ocr-document"
    "policy-chat"
)

echo -e "${YELLOW}📋 Fixing import statements in Edge Functions...${NC}"
echo ""

# Function to fix imports in a file
fix_imports() {
    local file=$1
    echo -e "${BLUE}  Fixing imports in $file${NC}"
    
    # Replace npm imports with proper Deno imports
    sed -i.backup \
        -e 's/import { GoogleGenerativeAI } from "npm:@google\/generative-ai"/import { GoogleGenerativeAI } from "@google\/generative-ai"/g' \
        -e 's/import OpenAI from "npm:openai@4.73.0"/import OpenAI from "openai"/g' \
        -e 's/import OpenAI from "npm:openai"/import OpenAI from "openai"/g' \
        -e 's/import { z } from "npm:zod"/import { z } from "https:\/\/deno.land\/x\/zod@v3.22.4\/mod.ts"/g' \
        "$file"
    
    # Remove backup files
    rm -f "${file}.backup"
}

# Fix each function
for func in "${FUNCTIONS_TO_FIX[@]}"; do
    if [[ -d "$func" && -f "$func/index.ts" ]]; then
        echo -e "${YELLOW}Fixing $func...${NC}"
        fix_imports "$func/index.ts"
        echo -e "${GREEN}  ✅ Fixed $func${NC}"
    else
        echo -e "${YELLOW}  ⚠️  Skipping $func (not found)${NC}"
    fi
done

# Create import_map.json for better import management
echo ""
echo -e "${BLUE}Creating import_map.json...${NC}"

cat > import_map.json << 'EOF'
{
  "imports": {
    "@google/generative-ai": "npm:@google/generative-ai@0.24.1",
    "openai": "npm:openai@4.73.0",
    "@supabase/supabase-js": "jsr:@supabase/supabase-js@2",
    "@supabase/functions-js": "jsr:@supabase/functions-js@2",
    "zod": "https://deno.land/x/zod@v3.22.4/mod.ts"
  }
}
EOF

echo -e "${GREEN}✅ Created import_map.json${NC}"

# Install dependencies
echo ""
echo -e "${BLUE}Installing dependencies...${NC}"
deno install

# Run type checking
echo ""
echo -e "${BLUE}Running type checks...${NC}"

SUCCESS_COUNT=0
FAIL_COUNT=0

for func in "${FUNCTIONS_TO_FIX[@]}"; do
    if [[ -d "$func" && -f "$func/index.ts" ]]; then
        echo -e "${YELLOW}Checking $func...${NC}"
        if deno check "$func/index.ts" 2>/dev/null; then
            echo -e "${GREEN}  ✅ $func passes type check${NC}"
            ((SUCCESS_COUNT++))
        else
            echo -e "${RED}  ❌ $func has type errors${NC}"
            ((FAIL_COUNT++))
            # Show first few errors
            deno check "$func/index.ts" 2>&1 | head -5
        fi
    fi
done

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}📊 Type Check Summary${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}✅ Success: $SUCCESS_COUNT functions${NC}"
echo -e "${RED}❌ Failed: $FAIL_COUNT functions${NC}"
echo ""

# Deploy fixed functions
echo -e "${YELLOW}🚀 Ready to deploy fixed functions?${NC}"
echo -e "${YELLOW}Run: ./scripts/deploy-secure-edge-functions.sh${NC}"
echo ""

# Create a test script
cat > /tmp/test-fixed-functions.sh << 'EOF'
#!/bin/bash
# Test fixed Edge Functions

PROJECT_ID="tmlrvecuwgppbaynesji"
FUNCTIONS=(
    "ai-document-extraction"
    "analyze-damage-with-policy"
    "property-ai-enrichment"
)

echo "Testing fixed Edge Functions..."
for func in "${FUNCTIONS[@]}"; do
    echo -n "Testing $func... "
    STATUS=$(curl -s -X OPTIONS \
        "https://${PROJECT_ID}.supabase.co/functions/v1/${func}" \
        -H "Origin: https://claimguardianai.com" \
        -w "%{http_code}" -o /dev/null)
    
    if [[ "$STATUS" == "200" || "$STATUS" == "204" ]]; then
        echo "✅ OK (HTTP $STATUS)"
    else
        echo "❌ Failed (HTTP $STATUS)"
    fi
done
EOF

chmod +x /tmp/test-fixed-functions.sh

echo -e "${GREEN}✅ Edge Function type fixes complete!${NC}"
echo ""
echo "Test functions with: bash /tmp/test-fixed-functions.sh"