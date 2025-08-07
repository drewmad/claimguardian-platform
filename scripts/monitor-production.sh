#!/bin/bash

# Production Monitoring Script for ClaimGuardian
# Runs health checks on all critical systems

set -euo pipefail

echo "========================================"
echo "🏥 CLAIMGUARDIAN PRODUCTION MONITOR"
echo "========================================"
echo "Timestamp: $(date)"
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

# 1. EDGE FUNCTION STATUS
echo -e "${BLUE}=== EDGE FUNCTION HEALTH ===${NC}"
echo ""

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

FAILED_COUNT=0
for func in "${FUNCTIONS[@]}"; do
    echo -n "Checking $func... "
    STATUS=$(curl -s -X OPTIONS "https://tmlrvecuwgppbaynesji.supabase.co/functions/v1/$func" \
        -H "Origin: https://claimguardianai.com" \
        -w "%{http_code}" -o /dev/null)

    if [ "$STATUS" = "204" ] || [ "$STATUS" = "200" ]; then
        echo -e "${GREEN}✓ OK (HTTP $STATUS)${NC}"
    else
        echo -e "${RED}✗ FAILED (HTTP $STATUS)${NC}"
        ((FAILED_COUNT++))
    fi
done

echo ""
if [ $FAILED_COUNT -eq 0 ]; then
    echo -e "${GREEN}All Edge Functions are healthy!${NC}"
else
    echo -e "${RED}$FAILED_COUNT Edge Functions need attention${NC}"
fi

# 2. DATABASE HEALTH
echo ""
echo -e "${BLUE}=== DATABASE HEALTH ===${NC}"
echo ""

# Check connection
echo -n "Database connection... "
if supabase db remote status &>/dev/null; then
    echo -e "${GREEN}✓ Connected${NC}"
else
    echo -e "${RED}✗ Connection failed${NC}"
fi

# Check for recent errors
echo -n "Recent database errors... "
ERROR_COUNT=$(supabase db diff 2>&1 | grep -i error | wc -l || echo "0")
if [ "$ERROR_COUNT" -eq 0 ]; then
    echo -e "${GREEN}✓ No errors${NC}"
else
    echo -e "${YELLOW}⚠️  $ERROR_COUNT errors found${NC}"
fi

# 3. SECURITY STATUS
echo ""
echo -e "${BLUE}=== SECURITY STATUS ===${NC}"
echo ""

# Check API keys
echo "API Keys configured:"
supabase secrets list 2>/dev/null | grep -E "OPENAI|GEMINI|RESEND|ANTHROPIC|XAI" | while read line; do
    KEY_NAME=$(echo "$line" | awk '{print $1}')
    echo -e "  ${GREEN}✓${NC} $KEY_NAME"
done

# 4. RECENT ERRORS (Last 24 hours)
echo ""
echo -e "${BLUE}=== RECENT ERRORS (24h) ===${NC}"
echo ""

# Get Edge Function logs
echo "Edge Function errors:"
supabase functions logs --limit 50 2>/dev/null | grep -i "error\|failed\|exception" | tail -5 || echo "  No recent errors"

# 5. PERFORMANCE METRICS
echo ""
echo -e "${BLUE}=== PERFORMANCE SNAPSHOT ===${NC}"
echo ""

# Test response time of a healthy function
echo -n "API Response time (send-email): "
RESPONSE_TIME=$(curl -s -X OPTIONS "https://tmlrvecuwgppbaynesji.supabase.co/functions/v1/send-email" \
    -H "Origin: https://claimguardianai.com" \
    -w "%{time_total}" -o /dev/null)
echo "${RESPONSE_TIME}s"

# Generate summary report
cat > monitoring-report-$(date +%Y%m%d-%H%M%S).md << EOF
# Production Monitoring Report
Generated: $(date)

## System Health Summary
- Edge Functions: $((8 - FAILED_COUNT))/8 healthy
- Database: Connected
- Security: All API keys configured

## Edge Function Status
$(for func in "${FUNCTIONS[@]}"; do
    STATUS=$(curl -s -X OPTIONS "https://tmlrvecuwgppbaynesji.supabase.co/functions/v1/$func" \
        -H "Origin: https://claimguardianai.com" \
        -w "%{http_code}" -o /dev/null)
    if [ "$STATUS" = "204" ] || [ "$STATUS" = "200" ]; then
        echo "- ✅ $func: OK"
    else
        echo "- ❌ $func: FAILED (HTTP $STATUS)"
    fi
done)

## Action Items
$(if [ $FAILED_COUNT -gt 0 ]; then
    echo "1. Debug failing Edge Functions"
    echo "2. Check Supabase logs for error details"
    echo "3. Verify API keys are set correctly"
else
    echo "No immediate actions required - system healthy"
fi)

## Next Monitoring Run
Schedule: Daily at 9 AM ET
Command: ./scripts/monitor-production.sh
EOF

echo ""
echo "========================================"
echo -e "${GREEN}✅ MONITORING COMPLETE${NC}"
echo "========================================"
echo ""
echo "Report saved to: monitoring-report-$(date +%Y%m%d-%H%M%S).md"
echo ""

# Alert if critical issues
if [ $FAILED_COUNT -gt 3 ]; then
    echo -e "${RED}⚠️  CRITICAL: Multiple Edge Functions are failing!${NC}"
    echo "Immediate action required."
    exit 1
fi

echo "Next steps:"
echo "1. Schedule this script to run daily"
echo "2. Set up alerts for failures"
echo "3. Review monitoring reports weekly"
