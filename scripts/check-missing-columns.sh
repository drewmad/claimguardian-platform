#!/bin/bash

# Check which columns from GeoJSON are missing in our schema

set -euo pipefail

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Files
GEOJSON_FILE="./data/florida/charlotte_parcels_2024.geojson"
SCHEMA_FILE="./supabase/sql/florida_parcels_complete.sql"
MIGRATION_FILE="./supabase/sql/complete-florida-parcels-schema.sql"

echo -e "${GREEN}=== Checking Missing Columns ===${NC}"
echo ""

# Extract columns from GeoJSON
echo -e "${YELLOW}Extracting columns from GeoJSON...${NC}"
jq -r '.features[0].properties | keys | sort | .[]' "$GEOJSON_FILE" > /tmp/geojson_columns.txt
GEOJSON_COUNT=$(wc -l < /tmp/geojson_columns.txt)
echo "Found $GEOJSON_COUNT columns in GeoJSON"

# Extract columns from schema files (looking for column names in SQL)
echo ""
echo -e "${YELLOW}Extracting columns from schema files...${NC}"
# Look for patterns like "COLUMN_NAME TYPE" or "ADD COLUMN ... COLUMN_NAME"
grep -E '^\s*(ADD COLUMN IF NOT EXISTS |")?\w+\s+(TEXT|INTEGER|NUMERIC|BOOLEAN|TIMESTAMP|GEOMETRY|vector)' \
    "$SCHEMA_FILE" "$MIGRATION_FILE" 2>/dev/null | \
    sed -E 's/.*?(ADD COLUMN IF NOT EXISTS |")?([A-Z_]+)\s+(TEXT|INTEGER|NUMERIC|BOOLEAN|TIMESTAMP|GEOMETRY|vector).*/\2/' | \
    sort -u > /tmp/schema_columns.txt
SCHEMA_COUNT=$(wc -l < /tmp/schema_columns.txt)
echo "Found $SCHEMA_COUNT columns defined in schema"

# Find missing columns
echo ""
echo -e "${YELLOW}Columns in GeoJSON but not in schema:${NC}"
comm -23 /tmp/geojson_columns.txt /tmp/schema_columns.txt > /tmp/missing_columns.txt

if [ -s /tmp/missing_columns.txt ]; then
    echo -e "${RED}Missing columns:${NC}"
    cat /tmp/missing_columns.txt
    MISSING_COUNT=$(wc -l < /tmp/missing_columns.txt)
    echo ""
    echo -e "${RED}Total missing: $MISSING_COUNT columns${NC}"
else
    echo -e "${GREEN}All GeoJSON columns are present in schema!${NC}"
fi

# Show columns that are in schema but not in GeoJSON (our metadata columns)
echo ""
echo -e "${YELLOW}Additional columns in schema (metadata/AI):${NC}"
comm -13 /tmp/geojson_columns.txt /tmp/schema_columns.txt | head -20

# Summary
echo ""
echo -e "${GREEN}=== Summary ===${NC}"
echo "GeoJSON columns: $GEOJSON_COUNT"
echo "Schema columns: $SCHEMA_COUNT"
if [ -s /tmp/missing_columns.txt ]; then
    echo -e "${RED}Missing columns: $MISSING_COUNT${NC}"
    echo ""
    echo "To add missing columns, run:"
    echo "supabase db push < supabase/sql/complete-florida-parcels-schema.sql"
else
    echo -e "${GREEN}All columns present!${NC}"
fi