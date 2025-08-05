#!/bin/bash

# Process Florida Parcels File Geodatabase to GeoJSON
# Converts GDB to GeoJSON and extracts Charlotte County

set -euo pipefail

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Configuration
DATA_DIR="${DATA_DIR:-./data/florida}"
GDB_ZIP="${DATA_DIR}/Cadastral_Statewide.zip"
GDB_DIR="${DATA_DIR}/Cadastral_Statewide.gdb"
GEOJSON_FULL="${DATA_DIR}/florida_parcels_2024_full.geojson"
CHARLOTTE_GEOJSON="${DATA_DIR}/charlotte_parcels_2024.geojson"

echo -e "${GREEN}=== Florida Parcels GDB Processor ===${NC}"
echo "Data directory: ${DATA_DIR}"
echo ""

# Create directories
mkdir -p "${DATA_DIR}"

# Check for required tools
if ! command -v ogr2ogr &> /dev/null; then
    echo -e "${RED}Error: ogr2ogr (GDAL) not installed${NC}"
    echo "Install with:"
    echo "  macOS: brew install gdal"
    echo "  Ubuntu: sudo apt-get install gdal-bin"
    exit 1
fi

# Check if GDB zip exists
if [ ! -f "$GDB_ZIP" ]; then
    echo -e "${RED}File Geodatabase not found at: $GDB_ZIP${NC}"
    echo ""
    echo "Please download the File Geodatabase from:"
    echo "https://geodata.floridagio.gov/datasets/FGIO::florida-statewide-parcel-data-current/about"
    echo ""
    echo "1. Click 'File Geodatabase' option"
    echo "2. Click 'Access' button"
    echo "3. Save the downloaded file as: $GDB_ZIP"
    echo ""
    echo "Note: The file might be named 'Cadastral_Statewide.zip'"
    exit 1
fi

# Extract GDB if needed
if [ ! -d "$GDB_DIR" ]; then
    echo -e "${YELLOW}Extracting File Geodatabase...${NC}"
    unzip -o "${GDB_ZIP}" -d "${DATA_DIR}"
    
    # Find the .gdb directory
    GDB_DIR=$(find "${DATA_DIR}" -name "*.gdb" -type d | head -1)
    if [ -z "$GDB_DIR" ]; then
        echo -e "${RED}Error: No .gdb directory found in extracted data${NC}"
        exit 1
    fi
fi

echo "Found GDB: $GDB_DIR"

# List layers in the GDB
echo ""
echo -e "${YELLOW}Layers in the geodatabase:${NC}"
ogrinfo -so "${GDB_DIR}" | grep "Layer name"

# Find the main parcels layer
LAYER_NAME=$(ogrinfo -so "${GDB_DIR}" | grep -E "Layer name|[0-9]+:" | grep -i "parcel" | head -1 | sed 's/.*Layer name: //' | sed 's/ .*//')

if [ -z "$LAYER_NAME" ]; then
    # Try to find any layer
    LAYER_NAME=$(ogrinfo -so "${GDB_DIR}" | grep "Layer name" | head -1 | sed 's/.*Layer name: //' | sed 's/ .*//')
fi

echo "Using layer: $LAYER_NAME"

# Convert to GeoJSON with Charlotte County filter
echo ""
echo -e "${YELLOW}Converting GDB to GeoJSON for Charlotte County...${NC}"
echo "This extracts only Charlotte County parcels (CO_NO = 15)"

# Use ogr2ogr to convert and filter
ogr2ogr -f "GeoJSON" \
    "${CHARLOTTE_GEOJSON}" \
    "${GDB_DIR}" \
    "${LAYER_NAME}" \
    -where "CO_NO = 15" \
    -t_srs EPSG:4326 \
    -progress \
    -lco RFC7946=YES

# Count features
if command -v jq &> /dev/null; then
    FEATURE_COUNT=$(jq '.features | length' "${CHARLOTTE_GEOJSON}")
    echo -e "${GREEN}Extracted ${FEATURE_COUNT} Charlotte County parcels${NC}"
    
    # Show sample fields
    echo ""
    echo "Sample fields in the data:"
    jq '.features[0].properties | keys | .[:10]' "${CHARLOTTE_GEOJSON}"
else
    echo -e "${GREEN}Charlotte County GeoJSON created${NC}"
fi

# Get file size
FILE_SIZE=$(ls -lh "${CHARLOTTE_GEOJSON}" | awk '{print $5}')
echo ""
echo "Charlotte County GeoJSON size: ${FILE_SIZE}"

# Optional: Convert full state
echo ""
echo -e "${YELLOW}Full statewide conversion not recommended (10+ GB)${NC}"
echo "If you need other counties, modify the -where clause"

# Show next steps
echo ""
echo -e "${GREEN}=== Conversion Complete ===${NC}"
echo "Charlotte County parcels extracted to:"
echo "  ${CHARLOTTE_GEOJSON}"
echo ""
echo "Next steps:"
echo "1. Upload to Supabase Storage:"
echo "   export SUPABASE_SERVICE_ROLE_KEY='your-service-role-key'"
echo "   ./scripts/upload-parcels-to-storage.sh"
echo ""
echo "2. Or copy directly to server:"
echo "   scp ${CHARLOTTE_GEOJSON} user@server:/path/to/data/"