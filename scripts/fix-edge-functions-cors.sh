#!/bin/bash

# Fix corrupted Edge Functions CORS headers
# This script repairs the Edge Functions that were corrupted by the awk script

set -euo pipefail

echo "========================================"
echo "🔧 FIXING EDGE FUNCTIONS CORS HEADERS"
echo "========================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Functions to fix
FUNCTIONS_TO_FIX=(
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

# Fix function
fix_edge_function() {
  local func_path="$1"
  local func_file="supabase/functions/$func_path/index.ts"
  
  if [ ! -f "$func_file" ]; then
    echo -e "${YELLOW}  ⚠️  Function not found: $func_path${NC}"
    return 1
  fi
  
  echo -e "${BLUE}Fixing $func_path...${NC}"
  
  # Create a temporary file
  local temp_file=$(mktemp)
  
  # Read the file and fix the corrupted lines
  while IFS= read -r line; do
    # Skip the corrupted corsHeaders line
    if [[ "$line" =~ "origin '' ALLOWED_ORIGINS.includes" ]]; then
      continue
    fi
    
    # Check if this is where we need to insert the proper Deno.serve
    if [[ "$line" =~ "Deno.serve(async (req: Request)" ]] && [[ ! "$line" =~ "const origin = req.headers.get" ]]; then
      # This is a fresh Deno.serve, add origin extraction
      echo "$line" >> "$temp_file"
      echo "  const origin = req.headers.get('origin')" >> "$temp_file"
      echo "" >> "$temp_file"
      echo "  const corsHeaders = {" >> "$temp_file"
      echo "    'Access-Control-Allow-Origin': origin && ALLOWED_ORIGINS.includes(origin) ? origin : ''," >> "$temp_file"
      echo "    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'," >> "$temp_file"
      echo "    'Access-Control-Allow-Methods': 'POST, OPTIONS'," >> "$temp_file"
      echo "    'X-Content-Type-Options': 'nosniff'," >> "$temp_file"
      echo "    'X-Frame-Options': 'DENY'," >> "$temp_file"
      echo "    'X-XSS-Protection': '1; mode=block'," >> "$temp_file"
      echo "    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'" >> "$temp_file"
      echo "  }" >> "$temp_file"
    elif [[ "$line" =~ "const corsHeaders = {" ]]; then
      # Skip the old corsHeaders definition, we already added it
      continue
    elif [[ "$line" =~ "'Access-Control-Allow-Headers': 'authorization" ]] && [[ "$line" =~ "}$" ]]; then
      # This is the end of the old corsHeaders, skip it
      continue
    else
      # Regular line, just copy it
      echo "$line" >> "$temp_file"
    fi
  done < "$func_file"
  
  # Move the temp file back
  mv "$temp_file" "$func_file"
  
  echo -e "${GREEN}  ✓ $func_path fixed${NC}"
  return 0
}

# Apply fixes
echo -e "${BLUE}Applying fixes to corrupted functions...${NC}"
echo ""

fixed_count=0
for func in "${FUNCTIONS_TO_FIX[@]}"; do
  if fix_edge_function "$func"; then
    ((fixed_count++))
  fi
done

echo ""
echo -e "${GREEN}✓ Fixed $fixed_count functions${NC}"

# Verify the fixes
echo ""
echo -e "${BLUE}Verifying fixes...${NC}"
echo ""

# Check for corrupted CORS headers
echo "Checking for corrupted CORS headers..."
if grep -r "origin '' ALLOWED_ORIGINS.includes" supabase/functions/*/index.ts 2>/dev/null; then
  echo -e "${RED}❌ Some functions still have corrupted headers${NC}"
else
  echo -e "${GREEN}✅ No corrupted headers found${NC}"
fi

echo ""
echo "Checking for proper CORS implementation..."
for func in "${FUNCTIONS_TO_FIX[@]}"; do
  if [ -f "supabase/functions/$func/index.ts" ]; then
    if grep -q "'Access-Control-Allow-Origin': origin && ALLOWED_ORIGINS.includes(origin)" "supabase/functions/$func/index.ts"; then
      echo -e "${GREEN}✅ $func has proper CORS${NC}"
    else
      echo -e "${RED}❌ $func needs manual fix${NC}"
    fi
  fi
done

echo ""
echo "========================================"
echo -e "${GREEN}CORS FIX COMPLETED${NC}"
echo "========================================"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Review the changes: git diff supabase/functions/"
echo "2. Deploy to production: supabase functions deploy"
echo "3. Test the functions to ensure they work correctly"