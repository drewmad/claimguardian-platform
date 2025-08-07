#!/bin/bash

# Download ZIP from Supabase, extract locally, convert to GeoJSON, and upload back
set -euo pipefail

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration
SUPABASE_URL="https://tmlrvecuwgppbaynesji.supabase.co"
SUPABASE_ANON_KEY="${NEXT_PUBLIC_SUPABASE_ANON_KEY:-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtbHJ2ZWN1d2dwcGJheW5lc2ppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNzUwMzksImV4cCI6MjA2NDY1MTAzOX0.P69j3GyOQ9NeGXeLul_ZyhWOvuyepL9FskjYAK-CDMU}"
WORK_DIR="/Users/madengineering/ClaimGuardian/data/florida"
ZIP_URL="${SUPABASE_URL}/storage/v1/object/public/parcels/Cadastral_Statewide.zip"

echo -e "${CYAN}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║     Download, Extract, Convert, and Upload Florida Parcels     ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Create working directory
mkdir -p "$WORK_DIR"
cd "$WORK_DIR"

# Step 1: Download ZIP from Supabase Storage
if [[ ! -f "Cadastral_Statewide.zip" ]]; then
    echo -e "${BLUE}Step 1: Downloading ZIP from Supabase Storage...${NC}"
    echo "This is a 4.1GB file - it may take a while..."

    if curl -L --progress-bar -o "Cadastral_Statewide.zip" "$ZIP_URL"; then
        echo -e "${GREEN}✓ Download complete!${NC}"
    else
        echo -e "${RED}✗ Download failed${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}ZIP file already exists locally, skipping download${NC}"
fi

# Step 2: Extract ZIP
if [[ ! -d "Cadastral_Statewide.gdb" ]]; then
    echo ""
    echo -e "${BLUE}Step 2: Extracting ZIP file...${NC}"

    if unzip -q "Cadastral_Statewide.zip"; then
        echo -e "${GREEN}✓ Extraction complete!${NC}"
    else
        echo -e "${RED}✗ Extraction failed${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}GDB already extracted, skipping extraction${NC}"
fi

# Step 3: Convert and upload counties
echo ""
echo -e "${BLUE}Step 3: Converting counties to GeoJSON and uploading...${NC}"

# Run the conversion script
if [[ -f "/Users/madengineering/ClaimGuardian/scripts/convert-all-counties-corrected.sh" ]]; then
    /Users/madengineering/ClaimGuardian/scripts/convert-all-counties-corrected.sh
else
    echo -e "${RED}Conversion script not found!${NC}"
    exit 1
fi

# Step 4: Upload converted files
echo ""
echo -e "${BLUE}Step 4: Uploading GeoJSON files to Supabase Storage...${NC}"

if [[ -f "/Users/madengineering/ClaimGuardian/scripts/upload-all-counties.sh" ]]; then
    /Users/madengineering/ClaimGuardian/scripts/upload-all-counties.sh
else
    echo -e "${RED}Upload script not found!${NC}"
    exit 1
fi

# Step 5: Start processing
echo ""
echo -e "${BLUE}Step 5: Starting processing in Supabase...${NC}"

read -p "Ready to start processing all counties? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    /Users/madengineering/ClaimGuardian/scripts/process-all-counties.sh
fi

echo ""
echo -e "${GREEN}════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}Workflow complete!${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════════════════${NC}"
