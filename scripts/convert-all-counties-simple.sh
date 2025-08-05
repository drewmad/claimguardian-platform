#!/bin/bash

# Convert all Florida counties from GDB to GeoJSON
set -euo pipefail

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

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

# Function to get county name
get_county_name() {
    case $1 in
        1) echo "ALACHUA" ;;
        2) echo "BAKER" ;;
        3) echo "BAY" ;;
        4) echo "BRADFORD" ;;
        5) echo "BREVARD" ;;
        6) echo "BROWARD" ;;
        7) echo "CALHOUN" ;;
        8) echo "CHARLOTTE" ;;
        9) echo "CITRUS" ;;
        10) echo "CLAY" ;;
        11) echo "COLLIER" ;;
        12) echo "COLUMBIA" ;;
        13) echo "MIAMI-DADE" ;;
        14) echo "DESOTO" ;;
        15) echo "DIXIE" ;;
        16) echo "DUVAL" ;;
        17) echo "ESCAMBIA" ;;
        18) echo "FLAGLER" ;;
        19) echo "FRANKLIN" ;;
        20) echo "GADSDEN" ;;
        21) echo "GILCHRIST" ;;
        22) echo "GLADES" ;;
        23) echo "GULF" ;;
        24) echo "HAMILTON" ;;
        25) echo "HARDEE" ;;
        26) echo "HENDRY" ;;
        27) echo "HERNANDO" ;;
        28) echo "HIGHLANDS" ;;
        29) echo "HILLSBOROUGH" ;;
        30) echo "HOLMES" ;;
        31) echo "INDIAN_RIVER" ;;
        32) echo "JACKSON" ;;
        33) echo "JEFFERSON" ;;
        34) echo "LAFAYETTE" ;;
        35) echo "LAKE" ;;
        36) echo "LEE" ;;
        37) echo "LEON" ;;
        38) echo "LEVY" ;;
        39) echo "LIBERTY" ;;
        40) echo "MADISON" ;;
        41) echo "MANATEE" ;;
        42) echo "MARION" ;;
        43) echo "MARTIN" ;;
        44) echo "MONROE" ;;
        45) echo "NASSAU" ;;
        46) echo "OKALOOSA" ;;
        47) echo "OKEECHOBEE" ;;
        48) echo "ORANGE" ;;
        49) echo "OSCEOLA" ;;
        50) echo "PALM_BEACH" ;;
        51) echo "PASCO" ;;
        52) echo "PINELLAS" ;;
        53) echo "POLK" ;;
        54) echo "PUTNAM" ;;
        55) echo "ST_JOHNS" ;;
        56) echo "ST_LUCIE" ;;
        57) echo "SANTA_ROSA" ;;
        58) echo "SARASOTA" ;;
        59) echo "SEMINOLE" ;;
        60) echo "SUMTER" ;;
        61) echo "SUWANNEE" ;;
        62) echo "TAYLOR" ;;
        63) echo "UNION" ;;
        64) echo "VOLUSIA" ;;
        65) echo "WAKULLA" ;;
        66) echo "WALTON" ;;
        67) echo "WASHINGTON" ;;
        *) echo "UNKNOWN" ;;
    esac
}

# Convert each county
for COUNTY_CODE in {1..67}; do
    COUNTY_NAME=$(get_county_name $COUNTY_CODE)
    OUTPUT_FILE="$OUTPUT_DIR/county_${COUNTY_CODE}_${COUNTY_NAME}.geojson"
    
    echo -ne "${BLUE}[$((COMPLETED + 1))/$TOTAL]${NC} Converting ${COUNTY_NAME} County (CO_NO=$COUNTY_CODE)... "
    
    # Log start
    echo "" >> "$LOG_FILE"
    echo "County $COUNTY_CODE - $COUNTY_NAME" >> "$LOG_FILE"
    echo "Started: $(date)" >> "$LOG_FILE"
    
    # Convert using ogr2ogr (without progress bar for cleaner output)
    if ogr2ogr \
        -f "GeoJSON" \
        -t_srs "EPSG:4326" \
        -where "CO_NO = $COUNTY_CODE" \
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
echo "2. Upload counties to Supabase Storage: ./scripts/upload-all-counties.sh"
echo "3. Process using florida-parcels-processor"
echo ""

# Log completion
echo "" >> "$LOG_FILE"
echo "================================" >> "$LOG_FILE"
echo "Completed: $(date)" >> "$LOG_FILE"
echo "Total time: ${ELAPSED_MIN}m ${ELAPSED_SEC}s" >> "$LOG_FILE"
echo "Success: $COMPLETED, Failed: $FAILED" >> "$LOG_FILE"