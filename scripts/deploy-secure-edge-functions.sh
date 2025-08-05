#!/bin/bash

# Deploy Secure Edge Functions
# This script deploys all critical Edge Functions with security patches

set -euo pipefail

echo "========================================"
echo "🚀 DEPLOYING SECURE EDGE FUNCTIONS"
echo "========================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# Critical functions to deploy
FUNCTIONS=(
  "ai-document-extraction"
  "analyze-damage-with-policy"
  "extract-policy-data"
  "policy-chat"
  "send-email"
  "ocr-document"
  "property-ai-enrichment"
  "spatial-ai-api"
)

# Deploy function
deploy_function() {
  local func="$1"
  echo -e "${BLUE}Deploying $func...${NC}"
  
  if supabase functions deploy "$func" --no-verify-jwt 2>&1 | tee /tmp/deploy-$func.log; then
    echo -e "${GREEN}  ✓ $func deployed successfully${NC}"
    return 0
  else
    echo -e "${RED}  ✗ $func deployment failed${NC}"
    echo "  Check /tmp/deploy-$func.log for details"
    return 1
  fi
}

# Deploy all functions
echo -e "${BLUE}Starting deployment of secure Edge Functions...${NC}"
echo ""

deployed=0
failed=0

for func in "${FUNCTIONS[@]}"; do
  if deploy_function "$func"; then
    ((deployed++))
  else
    ((failed++))
  fi
  echo ""
done

# Summary
echo "========================================"
echo -e "${GREEN}DEPLOYMENT COMPLETE${NC}"
echo "========================================"
echo ""
echo "Results:"
echo -e "  ${GREEN}✓ Deployed: $deployed functions${NC}"
if [ $failed -gt 0 ]; then
  echo -e "  ${RED}✗ Failed: $failed functions${NC}"
fi
echo ""

# Show deployment URLs
echo -e "${YELLOW}Deployment URLs:${NC}"
for func in "${FUNCTIONS[@]}"; do
  echo "  - https://tmlrvecuwgppbaynesji.supabase.co/functions/v1/$func"
done
echo ""

echo -e "${YELLOW}Dashboard:${NC}"
echo "  https://supabase.com/dashboard/project/tmlrvecuwgppbaynesji/functions"
echo ""

if [ $failed -eq 0 ]; then
  echo -e "${GREEN}All Edge Functions deployed successfully with security patches!${NC}"
else
  echo -e "${YELLOW}Some functions failed to deploy. Check the logs for details.${NC}"
fi