#!/bin/bash

# Upload parcel data to Supabase Storage

set -euo pipefail

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Configuration
SUPABASE_PROJECT_ID="${SUPABASE_PROJECT_ID:-tmlrvecuwgppbaynesji}"
SUPABASE_URL="https://${SUPABASE_PROJECT_ID}.supabase.co"
DATA_DIR="${DATA_DIR:-./data/florida}"
BUCKET_NAME="parcels"

# Try to load from macOS Keychain first
if [ -z "${SUPABASE_SERVICE_ROLE_KEY:-}" ]; then
    if command -v security &> /dev/null; then
        KEYCHAIN_KEY=$(security find-generic-password -s "ClaimGuardian-Supabase" -a "service-role-key" -w 2>/dev/null || true)
        if [ -n "$KEYCHAIN_KEY" ]; then
            echo "Loading service key from macOS Keychain"
            export SUPABASE_SERVICE_ROLE_KEY="$KEYCHAIN_KEY"
        fi
    fi
fi

# Load from .env.local if exists and still no key
if [ -z "${SUPABASE_SERVICE_ROLE_KEY:-}" ] && [ -f ".env.local" ]; then
    echo "Loading environment from .env.local"
    export $(grep -v '^#' .env.local | xargs)
fi

# Check for service key
if [ -z "${SUPABASE_SERVICE_ROLE_KEY:-}" ]; then
    echo -e "${RED}Error: SUPABASE_SERVICE_ROLE_KEY not set${NC}"
    echo ""
    echo "Please create a .env.local file with your service role key:"
    echo "cp .env.local.example .env.local"
    echo "Then edit .env.local and add your key"
    echo ""
    echo "Or export it temporarily:"
    echo "export SUPABASE_SERVICE_ROLE_KEY='your-service-role-key'"
    exit 1
fi

echo -e "${GREEN}=== Supabase Storage Upload Script ===${NC}"
echo "Project: ${SUPABASE_PROJECT_ID}"
echo "Bucket: ${BUCKET_NAME}"
echo ""

# Function to create bucket if not exists
create_bucket() {
    echo -e "${YELLOW}Creating storage bucket '${BUCKET_NAME}'...${NC}"
    
    RESPONSE=$(curl -s -X POST \
        "${SUPABASE_URL}/storage/v1/bucket" \
        -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
        -H "Content-Type: application/json" \
        -d "{
            \"id\": \"${BUCKET_NAME}\",
            \"name\": \"${BUCKET_NAME}\",
            \"public\": false,
            \"fileSizeLimit\": 5368709120,
            \"allowedMimeTypes\": [\"application/json\", \"application/geo+json\"]
        }")
    
    if echo "$RESPONSE" | grep -q "Bucket already exists"; then
        echo "Bucket already exists"
    elif echo "$RESPONSE" | grep -q "error"; then
        echo -e "${RED}Error creating bucket:${NC}"
        echo "$RESPONSE" | jq '.'
        return 1
    else
        echo -e "${GREEN}Bucket created successfully${NC}"
    fi
}

# Function to upload file
upload_file() {
    local FILE_PATH=$1
    local STORAGE_PATH=$2
    
    if [ ! -f "$FILE_PATH" ]; then
        echo -e "${RED}File not found: $FILE_PATH${NC}"
        return 1
    fi
    
    FILE_SIZE=$(ls -lh "$FILE_PATH" | awk '{print $5}')
    echo -e "${YELLOW}Uploading ${FILE_PATH} (${FILE_SIZE})...${NC}"
    
    # Upload with upsert to overwrite if exists
    RESPONSE=$(curl -s -X POST \
        "${SUPABASE_URL}/storage/v1/object/${BUCKET_NAME}/${STORAGE_PATH}" \
        -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
        -H "Content-Type: application/geo+json" \
        -H "x-upsert: true" \
        --data-binary "@${FILE_PATH}")
    
    if echo "$RESPONSE" | grep -q "error"; then
        echo -e "${RED}Upload failed:${NC}"
        echo "$RESPONSE" | jq '.'
        return 1
    else
        echo -e "${GREEN}Upload successful!${NC}"
        echo "Storage path: ${BUCKET_NAME}/${STORAGE_PATH}"
    fi
}

# Main process
echo "1. Ensuring bucket exists..."
create_bucket

echo ""
echo "2. Available files to upload:"
ls -lh "${DATA_DIR}"/*.geojson 2>/dev/null || {
    echo -e "${RED}No GeoJSON files found in ${DATA_DIR}${NC}"
    echo "Run ./scripts/download-florida-parcels-2024.sh first"
    exit 1
}

echo ""
echo "3. Uploading files..."

# Upload Charlotte County subset if exists
CHARLOTTE_FILE="${DATA_DIR}/charlotte_parcels_2024.geojson"
if [ -f "$CHARLOTTE_FILE" ]; then
    upload_file "$CHARLOTTE_FILE" "2024/charlotte_parcels.geojson"
fi

# Ask about full file
FULL_FILE="${DATA_DIR}/florida_parcels_2024_full.geojson"
if [ -f "$FULL_FILE" ]; then
    FILE_SIZE=$(du -h "$FULL_FILE" | cut -f1)
    echo ""
    echo -e "${YELLOW}Full statewide file is ${FILE_SIZE}${NC}"
    read -p "Upload full statewide file? This may take a while (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        upload_file "$FULL_FILE" "2024/florida_parcels_full.geojson"
    fi
fi

echo ""
echo -e "${GREEN}=== Upload Complete ===${NC}"
echo ""
echo "Files are now available in Supabase Storage."
echo "Use the Edge Function to process them:"
echo "supabase functions invoke load-parcels-2024-storage --body '{\"county\":\"CHARLOTTE\"}'"