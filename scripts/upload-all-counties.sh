#!/bin/bash

# Upload all converted county GeoJSON files to Supabase Storage
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
STORAGE_BUCKET="parcels"
COUNTIES_DIR="/Users/madengineering/ClaimGuardian/data/florida/counties"

echo -e "${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║        Uploading Florida Counties to Supabase Storage          ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if counties directory exists
if [[ ! -d "$COUNTIES_DIR" ]]; then
    echo -e "${RED}ERROR: Counties directory not found at $COUNTIES_DIR${NC}"
    echo "Please run ./scripts/convert-all-counties-corrected.sh first"
    exit 1
fi

# Count GeoJSON files
TOTAL_FILES=$(find "$COUNTIES_DIR" -name "*.geojson" -type f | wc -l)
if [[ $TOTAL_FILES -eq 0 ]]; then
    echo -e "${RED}ERROR: No GeoJSON files found in $COUNTIES_DIR${NC}"
    exit 1
fi

echo -e "${BLUE}Found $TOTAL_FILES county files to upload${NC}"
echo ""

# Track progress
UPLOADED=0
FAILED=0
START_TIME=$(date +%s)

# Upload each county file
for geojson_file in "$COUNTIES_DIR"/*.geojson; do
    if [[ -f "$geojson_file" ]]; then
        FILENAME=$(basename "$geojson_file")
        FILE_SIZE=$(du -h "$geojson_file" | cut -f1)

        echo -ne "${BLUE}[$((UPLOADED + FAILED + 1))/$TOTAL_FILES]${NC} Uploading $FILENAME ($FILE_SIZE)... "

        # Storage path: parcels/counties/county_XX_NAME.geojson
        STORAGE_PATH="counties/$FILENAME"

        # Upload using curl
        RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
            "${SUPABASE_URL}/storage/v1/object/${STORAGE_BUCKET}/${STORAGE_PATH}" \
            -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
            -H "Content-Type: application/json" \
            -H "x-upsert: true" \
            --data-binary "@${geojson_file}" 2>&1)

        HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)

        if [[ "$HTTP_CODE" == "200" ]] || [[ "$HTTP_CODE" == "201" ]]; then
            echo -e "${GREEN}✓${NC}"
            ((UPLOADED++))
        else
            echo -e "${RED}✗ (HTTP $HTTP_CODE)${NC}"
            echo "Failed response: $(echo "$RESPONSE" | head -n -1)" >> upload_errors.log
            ((FAILED++))
        fi
    fi
done

# Calculate elapsed time
END_TIME=$(date +%s)
ELAPSED=$((END_TIME - START_TIME))
ELAPSED_MIN=$((ELAPSED / 60))
ELAPSED_SEC=$((ELAPSED % 60))

echo ""
echo -e "${GREEN}════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}Upload Complete!${NC}"
echo ""
echo -e "${BLUE}Summary:${NC}"
echo -e "  • Total Files: $TOTAL_FILES"
echo -e "  • Uploaded: ${GREEN}$UPLOADED${NC}"
echo -e "  • Failed: ${RED}$FAILED${NC}"
echo -e "  • Time: ${ELAPSED_MIN}m ${ELAPSED_SEC}s"
echo ""

if [[ $FAILED -gt 0 ]]; then
    echo -e "${YELLOW}Check upload_errors.log for failed uploads${NC}"
fi

echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Verify uploads in Supabase Dashboard > Storage > parcels bucket"
echo "2. Start processing with: ./scripts/process-all-counties.sh"
echo "3. Monitor progress at: http://localhost:3000/admin/florida-parcels"
echo ""
