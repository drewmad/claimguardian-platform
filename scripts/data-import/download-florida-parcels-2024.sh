#!/bin/bash

# Download 2024 Florida Statewide Parcels from FGIO
# Dataset ID: efa909d6b1c841d298b0a649e7f71cf2_0

set -euo pipefail

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Configuration
DATA_DIR="${DATA_DIR:-./data/florida}"
DOWNLOAD_URL="https://opendata.arcgis.com/api/v3/datasets/efa909d6b1c841d298b0a649e7f71cf2_0/downloads/data?format=geojson&spatialRefId=4326"
OUTPUT_FILE="${DATA_DIR}/florida_parcels_2024_full.geojson"
CHARLOTTE_FILE="${DATA_DIR}/charlotte_parcels_2024.geojson"

echo -e "${GREEN}=== Florida Parcels 2024 Download Script ===${NC}"
echo "Data directory: ${DATA_DIR}"
echo ""

# Create data directory
mkdir -p "${DATA_DIR}"

# Check if file already exists
if [ -f "$OUTPUT_FILE" ]; then
    echo -e "${YELLOW}Full parcel file already exists at: ${OUTPUT_FILE}${NC}"
    read -p "Re-download? This will take a while (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Using existing file"
    else
        echo -e "${YELLOW}Downloading 2024 Florida Parcels (this may take 10-30 minutes)...${NC}"
        curl -L -o "${OUTPUT_FILE}" "${DOWNLOAD_URL}" --progress-bar
        echo -e "${GREEN}Download complete!${NC}"
    fi
else
    echo -e "${YELLOW}Downloading 2024 Florida Parcels (this may take 10-30 minutes)...${NC}"
    echo "URL: ${DOWNLOAD_URL}"
    curl -L -o "${OUTPUT_FILE}" "${DOWNLOAD_URL}" --progress-bar
    echo -e "${GREEN}Download complete!${NC}"
fi

# Check file size
FILE_SIZE=$(ls -lh "${OUTPUT_FILE}" | awk '{print $5}')
echo ""
echo "File size: ${FILE_SIZE}"

# Extract Charlotte County parcels
if [ ! -f "$CHARLOTTE_FILE" ]; then
    echo ""
    echo -e "${YELLOW}Extracting Charlotte County parcels...${NC}"

    # Use jq to filter for Charlotte County
    # This assumes COUNTYNAME field exists in the properties
    if command -v jq &> /dev/null; then
        jq '.features = [.features[] | select(.properties.COUNTYNAME == "CHARLOTTE")]' \
            "${OUTPUT_FILE}" > "${CHARLOTTE_FILE}"

        CHARLOTTE_COUNT=$(jq '.features | length' "${CHARLOTTE_FILE}")
        echo -e "${GREEN}Extracted ${CHARLOTTE_COUNT} Charlotte County parcels${NC}"
        echo "Saved to: ${CHARLOTTE_FILE}"
    else
        echo -e "${RED}jq not installed. Install with: brew install jq${NC}"
        echo "Cannot extract Charlotte County subset without jq"
    fi
fi

echo ""
echo -e "${GREEN}=== Next Steps ===${NC}"
echo "1. Upload to Supabase Storage:"
echo "   - Create 'parcels' bucket in Supabase dashboard if not exists"
echo "   - Upload ${CHARLOTTE_FILE} to the bucket"
echo ""
echo "2. Or use the upload script:"
echo "   ./scripts/upload-parcels-to-storage.sh"
echo ""
echo "3. Then run the Edge Function to import:"
echo "   supabase functions invoke load-parcels-2024-storage --body '{\"county\":\"CHARLOTTE\",\"offset\":0,\"limit\":1000}'"
