#!/bin/bash

# Load 2024 Florida Parcels from Florida GIO
# This script orchestrates the loading of parcel data from the official 2024 Florida GIO dataset

set -euo pipefail

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
COUNTY="${1:-CHARLOTTE}"
BATCH_SIZE="${2:-1000}"
SUPABASE_PROJECT_ID="tmlrvecuwgppbaynesji"
FUNCTION_URL="https://${SUPABASE_PROJECT_ID}.supabase.co/functions/v1/load-parcels-2024"

# Get Supabase anon key (you may need to set this as an environment variable)
if [ -z "${SUPABASE_ANON_KEY:-}" ]; then
    echo -e "${RED}Error: SUPABASE_ANON_KEY environment variable not set${NC}"
    echo "Please set: export SUPABASE_ANON_KEY='your-anon-key'"
    exit 1
fi

echo -e "${GREEN}Loading 2024 Florida Parcels for ${COUNTY} County${NC}"
echo "Batch size: ${BATCH_SIZE}"
echo "Function URL: ${FUNCTION_URL}"
echo ""

# First, get the total count
echo -e "${YELLOW}Getting total parcel count...${NC}"
COUNT_RESPONSE=$(curl -s -X POST "${FUNCTION_URL}" \
    -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
    -H "Content-Type: application/json" \
    -d "{\"county\": \"${COUNTY}\", \"mode\": \"count\"}")

# Check if count request was successful
if ! echo "$COUNT_RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
    echo -e "${RED}Failed to get count:${NC}"
    echo "$COUNT_RESPONSE" | jq '.'
    exit 1
fi

TOTAL_COUNT=$(echo "$COUNT_RESPONSE" | jq -r '.totalCount')
echo -e "${GREEN}Total parcels to load: ${TOTAL_COUNT}${NC}"
echo ""

# Calculate number of batches needed
BATCHES=$((($TOTAL_COUNT + $BATCH_SIZE - 1) / $BATCH_SIZE))
echo "Will process in ${BATCHES} batches"
echo ""

# Process in batches
OFFSET=0
BATCH_NUM=1
TOTAL_PROCESSED=0
TOTAL_ERRORS=0

while [ $OFFSET -lt $TOTAL_COUNT ]; do
    echo -e "${YELLOW}Processing batch ${BATCH_NUM}/${BATCHES} (offset: ${OFFSET})...${NC}"

    # Load batch
    RESPONSE=$(curl -s -X POST "${FUNCTION_URL}" \
        -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
        -H "Content-Type: application/json" \
        -d "{\"county\": \"${COUNTY}\", \"offset\": ${OFFSET}, \"limit\": ${BATCH_SIZE}, \"mode\": \"load\"}")

    # Check if request was successful
    if ! echo "$RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
        echo -e "${RED}Batch ${BATCH_NUM} failed:${NC}"
        echo "$RESPONSE" | jq '.'

        # Ask if should continue
        read -p "Continue with next batch? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo "Stopping at batch ${BATCH_NUM}"
            break
        fi
    else
        # Extract results
        PROCESSED=$(echo "$RESPONSE" | jq -r '.processed')
        ERRORS=$(echo "$RESPONSE" | jq -r '.errors')

        TOTAL_PROCESSED=$((TOTAL_PROCESSED + PROCESSED))
        TOTAL_ERRORS=$((TOTAL_ERRORS + ERRORS))

        echo -e "${GREEN}Batch ${BATCH_NUM} complete: ${PROCESSED} processed, ${ERRORS} errors${NC}"

        # Show progress
        PROGRESS=$((TOTAL_PROCESSED * 100 / TOTAL_COUNT))
        echo "Progress: ${TOTAL_PROCESSED}/${TOTAL_COUNT} (${PROGRESS}%)"
        echo ""
    fi

    # Update offset and batch number
    OFFSET=$((OFFSET + BATCH_SIZE))
    BATCH_NUM=$((BATCH_NUM + 1))

    # Small delay between batches to avoid overwhelming the API
    if [ $OFFSET -lt $TOTAL_COUNT ]; then
        sleep 1
    fi
done

echo ""
echo -e "${GREEN}=== Loading Complete ===${NC}"
echo "Total processed: ${TOTAL_PROCESSED}"
echo "Total errors: ${TOTAL_ERRORS}"
echo "Success rate: $((TOTAL_PROCESSED * 100 / (TOTAL_PROCESSED + TOTAL_ERRORS)))%"

# Verify in database
echo ""
echo -e "${YELLOW}Verifying in database...${NC}"
echo "Run this SQL to check:"
echo "SELECT COUNT(*) as total,"
echo "       COUNT(DISTINCT PARCEL_ID) as unique_parcels,"
echo "       MIN(import_date) as first_import,"
echo "       MAX(import_date) as last_import"
echo "FROM florida_parcels"
echo "WHERE CO_NO = 15"
echo "  AND data_source = 'FLORIDA_GIO_2024';"
