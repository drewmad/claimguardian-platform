#!/bin/bash

# Convert all Florida counties from GDB to GeoJSON with CORRECT county codes
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
echo -e "${GREEN}║     Converting All Florida Counties from GDB to GeoJSON        ║${NC}"
echo -e "${GREEN}║              Using Correct County Codes (11-77)                ║${NC}"
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

# Correct Florida county codes (from Department of Revenue)
# These are the actual CO_NO values in the GDB file
declare -A COUNTIES=(
    [11]="ALACHUA"
    [12]="BAKER"
    [13]="BAY"
    [14]="BRADFORD"
    [15]="BREVARD"
    [16]="BROWARD"
    [17]="CALHOUN"
    [18]="CHARLOTTE"
    [19]="CITRUS"
    [20]="CLAY"
    [21]="COLLIER"
    [22]="COLUMBIA"
    [23]="MIAMI-DADE"
    [24]="DESOTO"
    [25]="DIXIE"
    [26]="DUVAL"
    [27]="ESCAMBIA"
    [28]="FLAGLER"
    [29]="FRANKLIN"
    [30]="GADSDEN"
    [31]="GILCHRIST"
    [32]="GLADES"
    [33]="GULF"
    [34]="HAMILTON"
    [35]="HARDEE"
    [36]="HENDRY"
    [37]="HERNANDO"
    [38]="HIGHLANDS"
    [39]="HILLSBOROUGH"
    [40]="HOLMES"
    [41]="INDIAN_RIVER"
    [42]="JACKSON"
    [43]="JEFFERSON"
    [44]="LAFAYETTE"
    [45]="LAKE"
    [46]="LEE"
    [47]="LEON"
    [48]="LEVY"
    [49]="LIBERTY"
    [50]="MADISON"
    [51]="MANATEE"
    [52]="MARION"
    [53]="MARTIN"
    [54]="MONROE"
    [55]="NASSAU"
    [56]="OKALOOSA"
    [57]="OKEECHOBEE"
    [58]="ORANGE"
    [59]="OSCEOLA"
    [60]="PALM_BEACH"
    [61]="PASCO"
    [62]="PINELLAS"
    [63]="POLK"
    [64]="PUTNAM"
    [65]="ST_JOHNS"
    [66]="ST_LUCIE"
    [67]="SANTA_ROSA"
    [68]="SARASOTA"
    [69]="SEMINOLE"
    [70]="SUMTER"
    [71]="SUWANNEE"
    [72]="TAYLOR"
    [73]="UNION"
    [74]="VOLUSIA"
    [75]="WAKULLA"
    [76]="WALTON"
    [77]="WASHINGTON"
)

# First, verify we can access the GDB
if [[ ! -d "$GDB_PATH" ]]; then
    echo -e "${RED}ERROR: GDB file not found at $GDB_PATH${NC}"
    echo "Please ensure the Cadastral_Statewide.gdb is extracted to the correct location."
    exit 1
fi

# Process each county
PROGRESS=0
for COUNTY_CODE in "${!COUNTIES[@]}"; do
    COUNTY_NAME="${COUNTIES[$COUNTY_CODE]}"
    OUTPUT_FILE="$OUTPUT_DIR/county_${COUNTY_CODE}_${COUNTY_NAME}.geojson"

    ((PROGRESS++))
    echo -ne "${BLUE}[$PROGRESS/$TOTAL]${NC} Converting ${COUNTY_NAME} County (CO_NO=$COUNTY_CODE)... "

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

        # Check if file has content
        if [[ -s "$OUTPUT_FILE" ]]; then
            FILE_SIZE=$(du -h "$OUTPUT_FILE" | cut -f1)
            echo -e "${GREEN}✓${NC} ($FILE_SIZE)"
            echo "Success - Size: $FILE_SIZE" >> "$LOG_FILE"
            ((COMPLETED++))
        else
            echo -e "${YELLOW}⚠ Empty file${NC}"
            echo "Warning: Empty output file" >> "$LOG_FILE"
            rm -f "$OUTPUT_FILE"
        fi
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
if [[ -d "$OUTPUT_DIR" ]] && [[ $(ls -A "$OUTPUT_DIR"/*.geojson 2>/dev/null | wc -l) -gt 0 ]]; then
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
else
    echo -e "  ${RED}No output files generated${NC}"
fi

echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Review conversion log: $LOG_FILE"
echo "2. Upload counties to Supabase Storage: ./scripts/upload-all-counties.sh"
echo "3. Process using florida-parcels-orchestrator Edge Function"
echo ""

# Log completion
echo "" >> "$LOG_FILE"
echo "================================" >> "$LOG_FILE"
echo "Completed: $(date)" >> "$LOG_FILE"
echo "Total time: ${ELAPSED_MIN}m ${ELAPSED_SEC}s" >> "$LOG_FILE"
echo "Success: $COMPLETED, Failed: $FAILED" >> "$LOG_FILE"
