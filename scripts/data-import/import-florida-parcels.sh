#!/bin/bash

# Florida Parcels Import Script
# Imports data from GDB file directly to Supabase without extracting to disk

# Configuration
SUPABASE_PROJECT="tmlrvecuwgppbaynesji"
SUPABASE_HOST="aws-0-us-east-1.pooler.supabase.com"
SUPABASE_DB="postgres"
SUPABASE_PORT="5432"
GDB_PATH="Cadastral_Statewide.gdb"

# Get database password from environment or prompt
if [ -z "$SUPABASE_DB_PASSWORD" ]; then
    echo "Please set SUPABASE_DB_PASSWORD environment variable"
    echo "You can find this in your Supabase project settings under Database"
    exit 1
fi

# Connection string
DB_URL="postgresql://postgres.${SUPABASE_PROJECT}:${SUPABASE_DB_PASSWORD}@${SUPABASE_HOST}:${SUPABASE_PORT}/${SUPABASE_DB}"

echo "Florida Parcels Import Tool"
echo "=========================="
echo ""

# First, check what layers are available
echo "Checking available layers in GDB..."
ogrinfo -so "$GDB_PATH" 2>/dev/null | grep "Layer name:" | sed 's/^.*Layer name: //' > /tmp/gdb_layers.txt

if [ ! -s /tmp/gdb_layers.txt ]; then
    echo "Error: Could not read layers from GDB file"
    echo "Trying alternative method..."
    
    # Try extracting from ZIP if GDB is corrupted
    if [ -f "Cadastral_Statewide.zip" ]; then
        echo "Attempting to use ZIP file instead..."
        # Use /dev/shm for in-memory extraction if available
        TEMP_DIR="/dev/shm/parcels_temp"
        if [ ! -d "/dev/shm" ]; then
            TEMP_DIR="/tmp/parcels_temp"
        fi
        
        mkdir -p "$TEMP_DIR"
        cd "$TEMP_DIR"
        
        # Extract only the layer info
        unzip -q "../Cadastral_Statewide.zip" "*/a00000009.gdbtable" 2>/dev/null || true
        
        # Try reading from extracted path
        GDB_PATH="$TEMP_DIR/Cadastral_Statewide.gdb"
        ogrinfo -so "$GDB_PATH" 2>/dev/null | grep "Layer name:" | sed 's/^.*Layer name: //'
        
        cd - > /dev/null
    fi
    exit 1
fi

echo "Found layers:"
cat /tmp/gdb_layers.txt
echo ""

# Get the main parcels layer (usually named something like "Parcels" or "Cadastral")
PARCELS_LAYER=$(cat /tmp/gdb_layers.txt | grep -i "parcel\|cadastral" | head -1)

if [ -z "$PARCELS_LAYER" ]; then
    echo "Could not find parcels layer. Available layers:"
    cat /tmp/gdb_layers.txt
    echo ""
    echo "Please specify layer name as argument: $0 <layer_name>"
    exit 1
fi

echo "Using layer: $PARCELS_LAYER"
echo ""

# Option 1: Direct streaming import (recommended for large datasets)
echo "Starting streaming import..."
echo "This will import data directly without intermediate files"
echo ""

# Import with progress reporting
# -progress: Show progress
# -skipfailures: Continue on errors
# -append: Append to existing table
# -nlt PROMOTE_TO_MULTI: Handle mixed geometry types
# -lco GEOMETRY_NAME=geom: Name geometry column
# -t_srs EPSG:4326: Transform to WGS84

ogr2ogr \
    -f "PostgreSQL" \
    PG:"$DB_URL" \
    "$GDB_PATH" \
    "$PARCELS_LAYER" \
    -nln florida_parcels \
    -append \
    -skipfailures \
    -progress \
    -nlt PROMOTE_TO_MULTI \
    -lco GEOMETRY_NAME=geom \
    -t_srs EPSG:4326 \
    --config PG_USE_COPY YES \
    --config GDAL_HTTP_MAX_RETRY 3 \
    --config GDAL_HTTP_RETRY_DELAY 5

echo ""
echo "Import complete!"
echo ""

# Verify import
echo "Verifying import..."
psql "$DB_URL" -c "SELECT COUNT(*) as total_parcels FROM florida_parcels;"
psql "$DB_URL" -c "SELECT co_no, get_county_name(co_no) as county, COUNT(*) as parcels FROM florida_parcels GROUP BY co_no ORDER BY co_no LIMIT 10;"

echo ""
echo "Import verification complete!"

# Clean up
rm -f /tmp/gdb_layers.txt
if [ -d "$TEMP_DIR" ]; then
    rm -rf "$TEMP_DIR"
fi