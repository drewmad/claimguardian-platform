#!/bin/bash

##############################################################################
# FAST Charlotte County Extraction
# Extract Charlotte County (CO_NO = 15) from existing CSV files
##############################################################################

set -euo pipefail

# Configuration
readonly CHARLOTTE_CO_NO="15"
readonly INPUT_DIR="CleanedSplit"
readonly OUTPUT_DIR="data/charlotte_county"
readonly OUTPUT_FILE="$OUTPUT_DIR/charlotte_parcels.csv"

# Colors
readonly GREEN='\033[0;32m'
readonly BLUE='\033[0;34m'
readonly YELLOW='\033[1;33m'
readonly NC='\033[0m'

echo -e "${BLUE}🏖️  Extracting Charlotte County data for Phase 1...${NC}"

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Initialize counters
total_files=0
charlotte_records_found=0
header_written=false

# Count files
csv_files=("$INPUT_DIR"/*.csv)
total_files=${#csv_files[@]}

echo -e "${GREEN}📄 Processing $total_files CSV files...${NC}"

# Process each CSV file
for csv_file in "${csv_files[@]}"; do
    filename=$(basename "$csv_file")
    echo "   Processing: $filename"

    # Extract Charlotte County records (CO_NO = 15)
    if [ "$header_written" = false ]; then
        # First file: include header
        awk -F',' 'BEGIN{count=0} NR==1 {print} NR>1 && $2=="15" {print; count++} END {print count > "/tmp/awk_count.txt"}' "$csv_file" > "$OUTPUT_FILE"
        header_written=true
    else
        # Subsequent files: skip header, append data
        awk -F',' 'BEGIN{count=0} NR>1 && $2=="15" {print; count++} END {print count > "/tmp/awk_count.txt"}' "$csv_file" >> "$OUTPUT_FILE"
    fi

    # Get count
    if [ -f "/tmp/awk_count.txt" ]; then
        count=$(cat /tmp/awk_count.txt)
        if [ -n "$count" ] && [ "$count" != "0" ]; then
            echo "     ✅ Found $count Charlotte County records"
            charlotte_records_found=$((charlotte_records_found + count))
        fi
        rm -f /tmp/awk_count.txt
    fi
done

# Summary
echo ""
echo -e "${GREEN}📊 Extraction Summary:${NC}"
echo "   Total CSV files processed: $total_files"
echo "   Charlotte County records found: $charlotte_records_found"

if [ -f "$OUTPUT_FILE" ]; then
    file_size=$(ls -lh "$OUTPUT_FILE" | awk '{print $5}')
    echo "   Output file: $OUTPUT_FILE"
    echo "   File size: $file_size"

    # Show sample of extracted data
    echo ""
    echo -e "${YELLOW}📋 Sample of extracted data:${NC}"
    head -3 "$OUTPUT_FILE"

    if [ "$charlotte_records_found" -gt 0 ]; then
        echo ""
        echo -e "${GREEN}✅ Charlotte County extraction completed!${NC}"
        echo -e "${BLUE}📋 Next steps:${NC}"
        echo "   1. Apply database schema: Execute scripts/charlotte-county-schema.sql in Supabase"
        echo "   2. Run Phase 1: ./scripts/phased-deployment.sh 1"
    else
        echo ""
        echo -e "${YELLOW}⚠️  No Charlotte County records found!${NC}"
        echo "💡 Let's check what county codes are actually in the data..."

        # Sample county codes from first file
        echo "   County codes in sample file:"
        head -100 "${csv_files[0]}" | tail -n +2 | cut -d',' -f2 | sort | uniq -c | sort -nr | head -10
    fi
else
    echo -e "${YELLOW}❌ No output file created${NC}"
fi
