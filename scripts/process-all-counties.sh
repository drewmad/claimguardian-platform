#!/bin/bash

# Process all Florida counties using Supabase Edge Functions
set -euo pipefail

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
SUPABASE_URL="https://tmlrvecuwgppbaynesji.supabase.co"
SUPABASE_ANON_KEY="${NEXT_PUBLIC_SUPABASE_ANON_KEY:-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtbHJ2ZWN1d2dwcGJheW5lc2ppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNzUwMzksImV4cCI6MjA2NDY1MTAzOX0.P69j3GyOQ9NeGXeLul_ZyhWOvuyepL9FskjYAK-CDMU}"
ORCHESTRATOR_URL="${SUPABASE_URL}/functions/v1/florida-parcels-orchestrator"
MONITOR_URL="${SUPABASE_URL}/functions/v1/florida-parcels-monitor-enhanced"

echo -e "${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║      Processing All Florida Counties in Supabase               ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Function to check processing status
check_status() {
    echo -e "${BLUE}Checking current processing status...${NC}"
    
    RESPONSE=$(curl -s -X GET \
        "${MONITOR_URL}?view=dashboard" \
        -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
        -H "Content-Type: application/json")
    
    # Extract summary stats
    if command -v jq &> /dev/null; then
        echo "$RESPONSE" | jq -r '.summary // empty'
    else
        echo "$RESPONSE"
    fi
    echo ""
}

# Function to start processing
start_processing() {
    local mode="$1"
    echo -e "${BLUE}Starting $mode processing...${NC}"
    
    RESPONSE=$(curl -s -X POST \
        "${ORCHESTRATOR_URL}" \
        -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
        -H "Content-Type: application/json" \
        -d "{\"action\": \"start\", \"mode\": \"$mode\", \"batchSize\": 1000}")
    
    echo "$RESPONSE"
    echo ""
}

# Main menu
echo -e "${YELLOW}Select processing option:${NC}"
echo "1) Process priority counties first (Miami-Dade, Broward, Palm Beach, etc.)"
echo "2) Process all counties in order"
echo "3) Process specific counties"
echo "4) Check current status only"
echo "5) Stop all processing"
echo ""
read -p "Enter your choice (1-5): " choice

case $choice in
    1)
        echo ""
        check_status
        start_processing "priority"
        echo -e "${GREEN}Priority county processing started!${NC}"
        echo ""
        echo "Priority order:"
        echo "  1. Miami-Dade (23) - ~950k parcels"
        echo "  2. Broward (16) - ~720k parcels"
        echo "  3. Palm Beach (60) - ~650k parcels"
        echo "  4. Hillsborough (39) - ~520k parcels"
        echo "  5. Orange (58) - ~480k parcels"
        echo ""
        ;;
    
    2)
        echo ""
        check_status
        start_processing "all"
        echo -e "${GREEN}All county processing started!${NC}"
        echo "Processing all 67 counties in order..."
        echo ""
        ;;
    
    3)
        echo ""
        read -p "Enter county codes separated by commas (e.g., 18,23,60): " counties
        check_status
        
        # Convert comma-separated to JSON array
        json_counties=$(echo "$counties" | sed 's/,/","/g' | sed 's/^/["/' | sed 's/$/"]/')
        
        RESPONSE=$(curl -s -X POST \
            "${ORCHESTRATOR_URL}" \
            -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
            -H "Content-Type: application/json" \
            -d "{\"action\": \"start\", \"mode\": \"specific\", \"counties\": $json_counties}")
        
        echo "$RESPONSE"
        echo -e "${GREEN}Specific county processing started!${NC}"
        echo ""
        ;;
    
    4)
        echo ""
        check_status
        ;;
    
    5)
        echo ""
        echo -e "${YELLOW}Stopping all processing...${NC}"
        
        RESPONSE=$(curl -s -X POST \
            "${ORCHESTRATOR_URL}" \
            -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
            -H "Content-Type: application/json" \
            -d "{\"action\": \"stop\"}")
        
        echo "$RESPONSE"
        echo -e "${RED}Processing stopped.${NC}"
        echo ""
        ;;
    
    *)
        echo -e "${RED}Invalid choice. Exiting.${NC}"
        exit 1
        ;;
esac

# Monitoring instructions
if [[ $choice -ne 4 ]] && [[ $choice -ne 5 ]]; then
    echo -e "${YELLOW}Monitor progress:${NC}"
    echo "1. Dashboard: http://localhost:3000/admin/florida-parcels"
    echo "2. Command line: watch -n 10 './scripts/check-processing-status.sh'"
    echo "3. Edge Function logs: supabase functions logs florida-parcels-processor --follow"
    echo ""
fi

# Create status checking script
cat > check-processing-status.sh << 'EOF'
#!/bin/bash
curl -s -X GET \
    "https://tmlrvecuwgppbaynesji.supabase.co/functions/v1/florida-parcels-monitor-enhanced?view=dashboard" \
    -H "Authorization: Bearer ${NEXT_PUBLIC_SUPABASE_ANON_KEY:-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtbHJ2ZWN1d2dwcGJheW5lc2ppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNzUwMzksImV4cCI6MjA2NDY1MTAzOX0.P69j3GyOQ9NeGXeLul_ZyhWOvuyepL9FskjYAK-CDMU}" \
    -H "Content-Type: application/json" | jq -r '.summary // empty' 2>/dev/null || echo "Install jq for formatted output"
EOF

chmod +x check-processing-status.sh
echo "Created check-processing-status.sh for quick status checks"