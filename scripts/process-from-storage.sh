#!/bin/bash

# Process Florida parcels directly from Supabase Storage
set -euo pipefail

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration
SUPABASE_URL="https://tmlrvecuwgppbaynesji.supabase.co"
SUPABASE_ANON_KEY="${NEXT_PUBLIC_SUPABASE_ANON_KEY:-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtbHJ2ZWN1d2dwcGJheW5lc2ppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNzUwMzksImV4cCI6MjA2NDY1MTAzOX0.P69j3GyOQ9NeGXeLul_ZyhWOvuyepL9FskjYAK-CDMU}"

echo -e "${CYAN}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║    Processing Florida Parcels from Supabase Storage            ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${BLUE}Current Status:${NC}"
echo "  • ZIP file: Uploaded to Supabase Storage ✓"
echo "  • Edge Functions: Deployed and ready ✓"
echo "  • Monitoring Dashboard: Available ✓"
echo ""

echo -e "${YELLOW}Since the ZIP file is in Storage, we need to:${NC}"
echo "1. Extract the GDB from ZIP in Storage (requires server-side processing)"
echo "2. Convert GDB to GeoJSON for each county"
echo "3. Process the parcels into the database"
echo ""

echo -e "${BLUE}Starting direct processing workflow...${NC}"
echo ""

# Start the orchestrator to process from Storage
echo -e "${GREEN}Starting Florida Parcels Orchestrator...${NC}"

RESPONSE=$(curl -s -X POST \
    "${SUPABASE_URL}/functions/v1/florida-parcels-orchestrator" \
    -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
    -H "Content-Type: application/json" \
    -d '{
        "action": "start",
        "mode": "storage-extract",
        "config": {
            "sourcePath": "parcels/Cadastral_Statewide.zip",
            "extractPath": "parcels/extracted/",
            "counties": "all",
            "batchSize": 1000
        }
    }')

echo "Orchestrator Response:"
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""

# Check monitoring dashboard
echo -e "${YELLOW}Monitor progress at:${NC}"
echo "  • Dashboard: ${BLUE}http://localhost:3000/admin/florida-parcels${NC}"
echo "  • API Status: ${BLUE}curl -s '${SUPABASE_URL}/functions/v1/florida-parcels-monitor-enhanced?view=dashboard' -H 'Authorization: Bearer ${SUPABASE_ANON_KEY}'${NC}"
echo ""

# Create status check script
cat > check-storage-processing.sh << 'EOF'
#!/bin/bash
SUPABASE_URL="https://tmlrvecuwgppbaynesji.supabase.co"
SUPABASE_ANON_KEY="${NEXT_PUBLIC_SUPABASE_ANON_KEY:-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtbHJ2ZWN1d2dwcGJheW5lc2ppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNzUwMzksImV4cCI6MjA2NDY1MTAzOX0.P69j3GyOQ9NeGXeLul_ZyhWOvuyepL9FskjYAK-CDMU}"

echo "Checking Florida parcels processing status..."
curl -s -X GET \
    "${SUPABASE_URL}/functions/v1/florida-parcels-monitor-enhanced?view=dashboard" \
    -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" | jq '.' 2>/dev/null
EOF

chmod +x check-storage-processing.sh

echo -e "${GREEN}Created check-storage-processing.sh for status monitoring${NC}"
echo ""

echo -e "${CYAN}Note:${NC} Since the ZIP file is 4.1GB, extraction in Edge Functions may hit"
echo "resource limits. If that happens, we'll need to use an alternative approach:"
echo ""
echo "Alternative options:"
echo "1. Use Supabase CLI locally to extract and upload GeoJSON files"
echo "2. Create a dedicated extraction service with more resources"
echo "3. Process counties one at a time from pre-extracted files"
echo ""
