#!/bin/bash

# Complete Florida Parcels Processing Workflow
# This script orchestrates the entire process from GDB to Supabase
set -euo pipefail

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration
SCRIPTS_DIR="/Users/madengineering/ClaimGuardian/scripts"
DATA_DIR="/Users/madengineering/ClaimGuardian/data/florida"
LOG_FILE="$DATA_DIR/florida_parcels_workflow.log"

# Initialize log
echo "Florida Parcels Complete Workflow - Started: $(date)" > "$LOG_FILE"

echo -e "${CYAN}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║           FLORIDA PARCELS COMPLETE PROCESSING WORKFLOW         ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}This workflow will:${NC}"
echo "  1. Convert all 67 Florida counties from GDB to GeoJSON"
echo "  2. Upload all GeoJSON files to Supabase Storage"
echo "  3. Process all counties using Edge Functions"
echo "  4. Monitor progress and report completion"
echo ""
echo -e "${YELLOW}Estimated time: 24-48 hours for complete processing${NC}"
echo ""

# Function to log with timestamp
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Function to check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."

    # Check for GDB file
    if [[ ! -d "$DATA_DIR/Cadastral_Statewide.gdb" ]]; then
        echo -e "${RED}ERROR: Cadastral_Statewide.gdb not found!${NC}"
        echo "Expected location: $DATA_DIR/Cadastral_Statewide.gdb"
        echo ""
        echo "Please extract the GDB file from the uploaded ZIP:"
        echo "  cd $DATA_DIR"
        echo "  unzip Cadastral_Statewide.zip"
        exit 1
    fi

    # Check for ogr2ogr
    if ! command -v ogr2ogr &> /dev/null; then
        echo -e "${RED}ERROR: ogr2ogr not found!${NC}"
        echo "Please install GDAL: brew install gdal"
        exit 1
    fi

    # Check for curl
    if ! command -v curl &> /dev/null; then
        echo -e "${RED}ERROR: curl not found!${NC}"
        exit 1
    fi

    log "Prerequisites check passed ✓"
}

# Confirm with user
read -p "Ready to start the complete workflow? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Workflow cancelled."
    exit 0
fi

# Check prerequisites
check_prerequisites

# Step 1: Convert GDB to GeoJSON
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}STEP 1: Converting GDB to GeoJSON for all 67 counties${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
log "Starting GDB to GeoJSON conversion"

if "$SCRIPTS_DIR/convert-all-counties-corrected.sh"; then
    log "GDB conversion completed successfully"
    echo -e "${GREEN}✓ Conversion complete!${NC}"
else
    log "ERROR: GDB conversion failed"
    echo -e "${RED}✗ Conversion failed. Check logs.${NC}"
    exit 1
fi

# Verify conversion results
CONVERTED_COUNT=$(find "$DATA_DIR/counties" -name "*.geojson" -type f 2>/dev/null | wc -l)
log "Converted $CONVERTED_COUNT county files"

if [[ $CONVERTED_COUNT -eq 0 ]]; then
    echo -e "${RED}ERROR: No GeoJSON files were created${NC}"
    exit 1
fi

# Step 2: Upload to Supabase Storage
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}STEP 2: Uploading GeoJSON files to Supabase Storage${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
log "Starting upload to Supabase Storage"

read -p "Ready to upload $CONVERTED_COUNT files to Supabase? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Upload cancelled. You can run ./scripts/upload-all-counties.sh later."
    exit 0
fi

if "$SCRIPTS_DIR/upload-all-counties.sh"; then
    log "Upload to Storage completed successfully"
    echo -e "${GREEN}✓ Upload complete!${NC}"
else
    log "WARNING: Some uploads may have failed"
    echo -e "${YELLOW}⚠ Upload completed with some errors. Check upload_errors.log${NC}"
fi

# Step 3: Process in Supabase
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}STEP 3: Processing counties in Supabase${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
log "Starting Supabase processing"

echo -e "${YELLOW}Processing options:${NC}"
echo "  1. Process priority counties first (recommended)"
echo "  2. Process all counties in order"
echo ""
read -p "Select option (1 or 2): " process_option

if [[ $process_option == "1" ]]; then
    log "Starting priority county processing"
    echo "1" | "$SCRIPTS_DIR/process-all-counties.sh"
else
    log "Starting all county processing"
    echo "2" | "$SCRIPTS_DIR/process-all-counties.sh"
fi

# Step 4: Monitor progress
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}STEP 4: Monitoring Progress${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
log "Monitoring setup complete"

echo -e "${GREEN}Processing started successfully!${NC}"
echo ""
echo -e "${CYAN}Monitor your progress:${NC}"
echo "  • Dashboard: ${BLUE}http://localhost:3000/admin/florida-parcels${NC}"
echo "  • Quick status: ${BLUE}./check-processing-status.sh${NC}"
echo "  • Detailed logs: ${BLUE}supabase functions logs florida-parcels-processor --follow${NC}"
echo "  • Workflow log: ${BLUE}$LOG_FILE${NC}"
echo ""
echo -e "${YELLOW}Processing will continue in the background.${NC}"
echo "Estimated completion time: 24-48 hours for all counties"
echo ""

# Create a completion check script
cat > check-completion.sh << 'EOF'
#!/bin/bash
# Check if all Florida counties have been processed

TOTAL_COUNTIES=67
COMPLETED=$(curl -s -X GET \
    "https://tmlrvecuwgppbaynesji.supabase.co/functions/v1/florida-parcels-monitor-enhanced?view=dashboard" \
    -H "Authorization: Bearer ${NEXT_PUBLIC_SUPABASE_ANON_KEY:-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtbHJ2ZWN1d2dwcGJheW5lc2ppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNzUwMzksImV4cCI6MjA2NDY1MTAzOX0.P69j3GyOQ9NeGXeLul_ZyhWOvuyepL9FskjYAK-CDMU}" \
    | jq -r '.summary.counties_completed // 0' 2>/dev/null)

if [[ $COMPLETED -eq $TOTAL_COUNTIES ]]; then
    echo "✅ All $TOTAL_COUNTIES counties have been processed!"
else
    echo "⏳ Progress: $COMPLETED / $TOTAL_COUNTIES counties completed"
fi
EOF

chmod +x check-completion.sh
echo "Created check-completion.sh to monitor overall progress"

log "Workflow setup completed - processing in progress"

# Final summary
echo ""
echo -e "${GREEN}════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}Workflow Summary:${NC}"
echo "  • Counties converted: $CONVERTED_COUNT"
echo "  • Upload status: Check upload_errors.log if any failed"
echo "  • Processing: Started in Supabase"
echo "  • Next: Monitor progress using the tools above"
echo -e "${GREEN}════════════════════════════════════════════════════════════════${NC}"
