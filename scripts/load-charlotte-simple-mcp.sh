#!/bin/bash

# Simple Charlotte County loader using MCP
set -euo pipefail

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
DATA_FILE="./data/florida/charlotte_parcels_2024.geojson"
BATCH_SIZE=500
TOTAL_FEATURES=343620
TOTAL_BATCHES=$((TOTAL_FEATURES / BATCH_SIZE + 1))

echo -e "${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║      Charlotte County Direct Load via MCP (Simplified)         ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}📁 Data file:${NC} ${DATA_FILE}"
echo -e "${BLUE}📊 Total parcels:${NC} ${TOTAL_FEATURES}"
echo -e "${BLUE}📦 Batch size:${NC} ${BATCH_SIZE} records"
echo -e "${BLUE}🔢 Total batches:${NC} ${TOTAL_BATCHES}"
echo ""

# First, let's check current count
echo -e "${YELLOW}Checking current Charlotte County parcels in database...${NC}"
CURRENT_COUNT=$(claude mcp supabase execute_sql \
  --project_id tmlrvecuwgppbaynesji \
  --query "SELECT COUNT(*) as count FROM florida_parcels WHERE CO_NO = 15" 2>/dev/null | grep -o '"count":[0-9]*' | cut -d':' -f2 || echo "0")

echo -e "${BLUE}Current parcels in database:${NC} ${CURRENT_COUNT}"
echo ""

# Ask to continue
read -p "Process first 10 batches (5,000 records)? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 0
fi

# Process batches
echo -e "${GREEN}Processing batches...${NC}"
echo ""

for ((batch=0; batch<10; batch++)); do
    START_IDX=$((batch * BATCH_SIZE))
    END_IDX=$(((batch + 1) * BATCH_SIZE))

    echo -ne "${BLUE}Batch $((batch + 1))/10: Extracting records ${START_IDX}-${END_IDX}...${NC}"

    # Extract batch and create simplified SQL
    jq --arg start "$START_IDX" --arg end "$END_IDX" '
    .features[$start | tonumber:$end | tonumber] |
    map(
      "(" +
      "15," +                                          # CO_NO
      ("'\''" + (.properties.PARCEL_ID // "") + "'\''") + "," +   # PARCEL_ID
      "'\''12015'\''," +                                     # county_fips
      (if .properties.JV then (.properties.JV | tostring) else "NULL" end) + "," +
      (if .properties.LND_VAL then (.properties.LND_VAL | tostring) else "NULL" end) + "," +
      ("'\''" + (.properties.OWN_NAME // "" | gsub("'\''"; "'\'''\''")) + "'\''") + "," +
      ("'\''" + (.properties.PHY_ADDR1 // "" | gsub("'\''"; "'\'''\''")) + "'\''") + "," +
      "'\''FLORIDA_DOR_2024'\''" +
      ")"
    ) |
    "INSERT INTO florida_parcels (CO_NO, PARCEL_ID, county_fips, JV, LND_VAL, OWN_NAME, PHY_ADDR1, data_source) VALUES " +
    join(",") +
    " ON CONFLICT (CO_NO, PARCEL_ID) DO UPDATE SET JV = EXCLUDED.JV, LND_VAL = EXCLUDED.LND_VAL, updated_at = NOW();"
    ' "$DATA_FILE" > /tmp/batch_${batch}.sql 2>/dev/null

    # Check if SQL was generated
    if [ -s "/tmp/batch_${batch}.sql" ]; then
        # Execute via MCP
        SQL=$(cat /tmp/batch_${batch}.sql)
        RESULT=$(claude mcp supabase execute_sql \
          --project_id tmlrvecuwgppbaynesji \
          --query "$SQL" 2>&1 || echo "ERROR")

        if [[ "$RESULT" == *"ERROR"* ]] || [[ "$RESULT" == *"error"* ]]; then
            echo -e "\r${RED}✗ Batch $((batch + 1)): Failed${NC}"
            echo "Error: $RESULT" | head -2
        else
            echo -e "\r${GREEN}✓ Batch $((batch + 1)): Completed${NC}"
        fi

        rm -f "/tmp/batch_${batch}.sql"
    else
        echo -e "\r${YELLOW}○ Batch $((batch + 1)): No data${NC}"
    fi
done

echo ""
echo -e "${GREEN}Checking final count...${NC}"

# Final count
FINAL_COUNT=$(claude mcp supabase execute_sql \
  --project_id tmlrvecuwgppbaynesji \
  --query "SELECT COUNT(*) as count FROM florida_parcels WHERE CO_NO = 15" 2>/dev/null | grep -o '"count":[0-9]*' | cut -d':' -f2 || echo "0")

echo -e "${BLUE}Final Charlotte County parcels:${NC} ${FINAL_COUNT}"
echo -e "${BLUE}Imported in this run:${NC} $((FINAL_COUNT - CURRENT_COUNT))"
echo ""

if [ "$FINAL_COUNT" -lt "$TOTAL_FEATURES" ]; then
    echo -e "${YELLOW}To continue importing remaining $((TOTAL_FEATURES - FINAL_COUNT)) parcels:${NC}"
    echo "Edit the script to process more batches or run again"
fi

echo -e "${GREEN}Done!${NC}"
