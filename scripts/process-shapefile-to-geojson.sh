#!/bin/bash

# Process Florida Parcels Shapefile to GeoJSON
# Converts Shapefile to GeoJSON and extracts Charlotte County

set -euo pipefail

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Configuration
DATA_DIR="${DATA_DIR:-./data/florida}"
SHAPEFILE_URL="https://opendata.arcgis.com/api/v3/datasets/efa909d6b1c841d298b0a649e7f71cf2_0/downloads/data?format=shp&spatialRefId=4326"
SHAPEFILE_ZIP="${DATA_DIR}/florida_parcels_2024.zip"
SHAPEFILE_DIR="${DATA_DIR}/florida_parcels_2024_shp"
GEOJSON_FULL="${DATA_DIR}/florida_parcels_2024_full.geojson"
CHARLOTTE_GEOJSON="${DATA_DIR}/charlotte_parcels_2024.geojson"

echo -e "${GREEN}=== Florida Parcels Shapefile Processor ===${NC}"
echo "Data directory: ${DATA_DIR}"
echo ""

# Create directories
mkdir -p "${DATA_DIR}"
mkdir -p "${SHAPEFILE_DIR}"

# Check for required tools
if ! command -v ogr2ogr &> /dev/null; then
    echo -e "${RED}Error: ogr2ogr (GDAL) not installed${NC}"
    echo "Install with:"
    echo "  macOS: brew install gdal"
    echo "  Ubuntu: sudo apt-get install gdal-bin"
    exit 1
fi

# Download Shapefile
if [ ! -f "$SHAPEFILE_ZIP" ]; then
    echo -e "${YELLOW}Downloading Florida Parcels Shapefile (this may take 10-30 minutes)...${NC}"
    curl -L -o "${SHAPEFILE_ZIP}" "${SHAPEFILE_URL}" --progress-bar
    echo -e "${GREEN}Download complete!${NC}"
else
    echo -e "${YELLOW}Shapefile ZIP already exists${NC}"
fi

# Extract Shapefile
echo -e "${YELLOW}Extracting Shapefile...${NC}"
unzip -o "${SHAPEFILE_ZIP}" -d "${SHAPEFILE_DIR}"

# Find the .shp file
SHAPEFILE=$(find "${SHAPEFILE_DIR}" -name "*.shp" | head -1)
if [ -z "$SHAPEFILE" ]; then
    echo -e "${RED}Error: No .shp file found in extracted data${NC}"
    exit 1
fi

echo "Found shapefile: $SHAPEFILE"

# Convert to GeoJSON with Charlotte County filter
echo ""
echo -e "${YELLOW}Converting Shapefile to GeoJSON for Charlotte County...${NC}"
echo "This extracts only Charlotte County parcels"

# Use ogr2ogr to convert and filter in one step
ogr2ogr -f "GeoJSON" \
    "${CHARLOTTE_GEOJSON}" \
    "${SHAPEFILE}" \
    -where "CO_NO = 15" \
    -t_srs EPSG:4326 \
    -progress

# Count features
if command -v jq &> /dev/null; then
    FEATURE_COUNT=$(jq '.features | length' "${CHARLOTTE_GEOJSON}")
    echo -e "${GREEN}Extracted ${FEATURE_COUNT} Charlotte County parcels${NC}"
else
    echo -e "${GREEN}Charlotte County GeoJSON created${NC}"
fi

# Optional: Convert full state (warning: large file)
echo ""
read -p "Convert full statewide shapefile to GeoJSON? This creates a very large file (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Converting full shapefile to GeoJSON...${NC}"
    ogr2ogr -f "GeoJSON" \
        "${GEOJSON_FULL}" \
        "${SHAPEFILE}" \
        -t_srs EPSG:4326 \
        -progress
    echo -e "${GREEN}Full GeoJSON created${NC}"
fi

# Show file sizes
echo ""
echo -e "${GREEN}=== File Summary ===${NC}"
ls -lh "${DATA_DIR}"/*.geojson 2>/dev/null || echo "No GeoJSON files created yet"

# AI-specific notes
echo ""
echo -e "${GREEN}=== AI Processing Notes ===${NC}"
echo "The Shapefile format preserves all 138 DOR columns including:"
echo "- All assessment values (JV, AV_SD, TV_NSD, etc.)"
echo "- Complete owner information (OWN_NAME, addresses)"
echo "- Property characteristics (year built, square footage)"
echo "- Sales history (SALE_PRC1, SALE_YR1, etc.)"
echo "- Legal descriptions and location data"
echo "- Geometry with Shape__Area and Shape__Length"
echo ""
echo "For AI analysis, this data enables:"
echo "- Property value predictions"
echo "- Market trend analysis"
echo "- Risk assessment modeling"
echo "- Spatial pattern recognition"
echo "- Owner clustering analysis"

echo ""
echo -e "${GREEN}=== Next Steps ===${NC}"
echo "1. Upload Charlotte County GeoJSON to Supabase:"
echo "   ./scripts/upload-parcels-to-storage.sh"
echo ""
echo "2. Or process directly with Python for AI:"
echo "   python scripts/process-parcels-for-ai.py"
