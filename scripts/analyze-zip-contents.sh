#!/bin/bash

# Script to analyze the ZIP file contents
set -euo pipefail

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║          Analyzing Cadastral_Statewide.zip Contents            ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Load environment variables
source .env.local

# Call the ZIP extractor to analyze
echo -e "${BLUE}Analyzing ZIP file structure...${NC}"

curl -X POST \
  https://tmlrvecuwgppbaynesji.supabase.co/functions/v1/florida-parcels-zip-extractor \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"action": "analyze"}' | jq '.'

echo ""
echo -e "${GREEN}Analysis complete!${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Review the file structure above"
echo "2. If ready to extract, run: ./scripts/extract-zip-contents.sh"
echo "3. Then process the extracted files based on their format"