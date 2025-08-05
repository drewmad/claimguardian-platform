#!/bin/bash

# Convert all Florida counties from GDB to GeoJSON
set -euo pipefail

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Function to get county name
get_county_name() {
    case $1 in
    [1]="ALACHUA" [2]="BAKER" [3]="BAY" [4]="BRADFORD" [5]="BREVARD"
    [6]="BROWARD" [7]="CALHOUN" [8]="CHARLOTTE" [9]="CITRUS" [10]="CLAY"
    [11]="COLLIER" [12]="COLUMBIA" [13]="MIAMI-DADE" [14]="DESOTO" [15]="DIXIE"
    [16]="DUVAL" [17]="ESCAMBIA" [18]="FLAGLER" [19]="FRANKLIN" [20]="GADSDEN"
    [21]="GILCHRIST" [22]="GLADES" [23]="GULF" [24]="HAMILTON" [25]="HARDEE"
    [26]="HENDRY" [27]="HERNANDO" [28]="HIGHLANDS" [29]="HILLSBOROUGH" [30]="HOLMES"
    [31]="INDIAN_RIVER" [32]="JACKSON" [33]="JEFFERSON" [34]="LAFAYETTE" [35]="LAKE"
    [36]="LEE" [37]="LEON" [38]="LEVY" [39]="LIBERTY" [40]="MADISON"
    [41]="MANATEE" [42]="MARION" [43]="MARTIN" [44]="MONROE" [45]="NASSAU"
    [46]="OKALOOSA" [47]="OKEECHOBEE" [48]="ORANGE" [49]="OSCEOLA" [50]="PALM_BEACH"
    [51]="PASCO" [52]="PINELLAS" [53]="POLK" [54]="PUTNAM" [55]="ST_JOHNS"
    [56]="ST_LUCIE" [57]="SANTA_ROSA" [58]="SARASOTA" [59]="SEMINOLE" [60]="SUMTER"
    [61]="SUWANNEE" [62]="TAYLOR" [63]="UNION" [64]="VOLUSIA" [65]="WAKULLA"
    [66]="WALTON" [67]="WASHINGTON"
)

# Paths
GDB_PATH="/Users/madengineering/ClaimGuardian/data/florida/Cadastral_Statewide.gdb"
OUTPUT_DIR="/Users/madengineering/ClaimGuardian/data/florida/counties"
LOG_FILE="$OUTPUT_DIR/conversion_log.txt"

# Create output directory
mkdir -p "$OUTPUT_DIR"

echo -e "${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║        Converting All Florida Counties from GDB to GeoJSON     ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Source:${NC} $GDB_PATH"
echo -e "${BLUE}Output:${NC} $OUTPUT_DIR"
echo ""

# Initialize log
echo "Florida Counties GDB to GeoJSON Conversion Log" > "$LOG_FILE"
echo "Started: $(date)" >> "$LOG_FILE"
echo "================================" >> "$LOG_FILE"

# Track progress
TOTAL=67
COMPLETED=0
FAILED=0
START_TIME=$(date +%s)

# Convert each county
for COUNTY_CODE in {1..67}; do
    COUNTY_NAME=${COUNTIES[$COUNTY_CODE]}
    OUTPUT_FILE="$OUTPUT_DIR/county_${COUNTY_CODE}_${COUNTY_NAME}.geojson"
    
    echo -ne "${BLUE}[$((COMPLETED + 1))/$TOTAL]${NC} Converting ${COUNTY_NAME} County (CO_NO=$COUNTY_CODE)... "
    
    # Log start
    echo "" >> "$LOG_FILE"
    echo "County $COUNTY_CODE - $COUNTY_NAME" >> "$LOG_FILE"
    echo "Started: $(date)" >> "$LOG_FILE"
    
    # Convert using ogr2ogr
    if ogr2ogr \
        -f "GeoJSON" \
        -t_srs "EPSG:4326" \
        -where "CO_NO = $COUNTY_CODE" \
        -progress \
        "$OUTPUT_FILE" \
        "$GDB_PATH" \
        CADASTRAL_DOR 2>> "$LOG_FILE"; then
        
        # Get file size
        FILE_SIZE=$(du -h "$OUTPUT_FILE" | cut -f1)
        echo -e "${GREEN}✓${NC} ($FILE_SIZE)"
        echo "Success - Size: $FILE_SIZE" >> "$LOG_FILE"
        ((COMPLETED++))
    else
        echo -e "${RED}✗ Failed${NC}"
        echo "FAILED!" >> "$LOG_FILE"
        ((FAILED++))
    fi
done

# Calculate elapsed time
END_TIME=$(date +%s)
ELAPSED=$((END_TIME - START_TIME))
ELAPSED_MIN=$((ELAPSED / 60))
ELAPSED_SEC=$((ELAPSED % 60))

echo ""
echo -e "${GREEN}════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}Conversion Complete!${NC}"
echo ""
echo -e "${BLUE}Summary:${NC}"
echo -e "  • Total Counties: $TOTAL"
echo -e "  • Completed: ${GREEN}$COMPLETED${NC}"
echo -e "  • Failed: ${RED}$FAILED${NC}"
echo -e "  • Time: ${ELAPSED_MIN}m ${ELAPSED_SEC}s"
echo ""

# List output files
echo -e "${BLUE}Output Files:${NC}"
TOTAL_SIZE=$(du -sh "$OUTPUT_DIR" | cut -f1)
echo -e "  • Directory: $OUTPUT_DIR"
echo -e "  • Total Size: $TOTAL_SIZE"
echo ""

# Show largest files
echo -e "${BLUE}Largest Counties:${NC}"
du -h "$OUTPUT_DIR"/*.geojson 2>/dev/null | sort -hr | head -5 | while read size file; do
    filename=$(basename "$file")
    echo -e "  • $filename: $size"
done

echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Review conversion log: $LOG_FILE"
echo "2. Upload counties to Supabase Storage"
echo "3. Process using florida-parcels-processor"
echo ""

# Log completion
echo "" >> "$LOG_FILE"
echo "================================" >> "$LOG_FILE"
echo "Completed: $(date)" >> "$LOG_FILE"
echo "Total time: ${ELAPSED_MIN}m ${ELAPSED_SEC}s" >> "$LOG_FILE"
echo "Success: $COMPLETED, Failed: $FAILED" >> "$LOG_FILE"