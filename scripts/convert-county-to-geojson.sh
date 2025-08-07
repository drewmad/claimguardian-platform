#!/bin/bash

# Convert specific county from GDB to GeoJSON
set -euo pipefail

# County mapping
declare -A COUNTIES=(
    [15]="CHARLOTTE"
    [13]="MIAMI-DADE"
    [6]="BROWARD"
    [50]="PALM_BEACH"
    [29]="HILLSBOROUGH"
    [48]="ORANGE"
)

# Default to Charlotte County if no argument
COUNTY_CODE=${1:-15}
COUNTY_NAME=${COUNTIES[$COUNTY_CODE]:-"COUNTY_$COUNTY_CODE"}

echo "Converting $COUNTY_NAME County (CO_NO=$COUNTY_CODE) to GeoJSON..."

# Input and output paths
GDB_PATH="/Users/madengineering/ClaimGuardian/data/florida/Cadastral_Statewide.gdb"
OUTPUT_DIR="/Users/madengineering/ClaimGuardian/data/florida/counties"
OUTPUT_FILE="$OUTPUT_DIR/county_${COUNTY_CODE}_${COUNTY_NAME}.geojson"

# Create output directory if it doesn't exist
mkdir -p "$OUTPUT_DIR"

# Convert using ogr2ogr
# -f: Output format
# -t_srs: Transform to WGS84 (standard for web mapping)
# -where: Filter by county code
# -progress: Show progress
ogr2ogr \
    -f "GeoJSON" \
    -t_srs "EPSG:4326" \
    -where "CO_NO = $COUNTY_CODE" \
    -progress \
    "$OUTPUT_FILE" \
    "$GDB_PATH" \
    CADASTRAL_DOR

# Check file size
FILE_SIZE=$(du -h "$OUTPUT_FILE" | cut -f1)
echo ""
echo "Conversion complete!"
echo "Output file: $OUTPUT_FILE"
echo "File size: $FILE_SIZE"
echo ""
echo "To upload to Storage, run:"
echo "python scripts/upload-county-geojson.py $OUTPUT_FILE"
