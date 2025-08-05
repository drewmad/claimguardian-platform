#\!/bin/bash

# Direct parcel loading to database
set -euo pipefail

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
DATA_FILE="./data/florida/charlotte_parcels_2024.geojson"
BATCH_SIZE=5000
PARALLEL_JOBS=4

echo -e "${GREEN}=== Charlotte County Direct Database Import ===${NC}"
echo -e "${BLUE}Data file:${NC} ${DATA_FILE}"
echo -e "${BLUE}Batch size:${NC} ${BATCH_SIZE} records"
echo -e "${BLUE}Parallel jobs:${NC} ${PARALLEL_JOBS}"
echo ""

# Check file
if [ \! -f "$DATA_FILE" ]; then
    echo -e "${RED}Error: Data file not found\!${NC}"
    exit 1
fi

# Get total features
TOTAL_FEATURES=$(jq '.features | length' "$DATA_FILE" 2>/dev/null || echo "0")
if [ "$TOTAL_FEATURES" -eq 0 ]; then
    echo -e "${RED}Error: No features found in data file\!${NC}"
    exit 1
fi

TOTAL_BATCHES=$(( ($TOTAL_FEATURES + $BATCH_SIZE - 1) / $BATCH_SIZE ))

echo -e "${BLUE}Total parcels:${NC} ${TOTAL_FEATURES}"
echo -e "${BLUE}Total batches:${NC} ${TOTAL_BATCHES}"
echo -e "${BLUE}Estimated time:${NC} $(( $TOTAL_BATCHES * 2 / $PARALLEL_JOBS )) - $(( $TOTAL_BATCHES * 4 / $PARALLEL_JOBS )) minutes"
echo ""

# Use MCP for database operations
echo -e "${GREEN}Using MCP for database operations...${NC}"
echo ""

# Process features in batches
process_batch() {
    local start=$1
    local batch_num=$(( ($start / $BATCH_SIZE) + 1 ))
    local end=$(( $start + $BATCH_SIZE ))
    
    echo -e "${YELLOW}Processing batch ${batch_num}/${TOTAL_BATCHES} (records ${start}-${end})...${NC}"
    
    # Extract batch of features and create SQL
    jq --arg start "$start" --arg size "$BATCH_SIZE" '
    .features[$start | tonumber:($start | tonumber) + ($size | tonumber)] | 
    map({
        CO_NO: 15,
        PARCEL_ID: .properties.PARCEL_ID,
        county_fips: "12015",
        FILE_T: .properties.FILE_T,
        ASMNT_YR: .properties.ASMNT_YR,
        DOR_UC: .properties.DOR_UC,
        PA_UC: .properties.PA_UC,
        JV: .properties.JV,
        JV_HMSTD: .properties.JV_HMSTD,
        AV_HMSTD: .properties.AV_HMSTD,
        LND_VAL: .properties.LND_VAL,
        LND_SQFOOT: .properties.LND_SQFOOT,
        IMP_VAL: .properties.IMP_VAL,
        TOT_LVG_AR: .properties.TOT_LVG_AR,
        NO_BULDNG: .properties.NO_BULDNG,
        NO_RES_UNT: .properties.NO_RES_UNT,
        EFF_YR_BLT: .properties.EFF_YR_BLT,
        ACT_YR_BLT: .properties.ACT_YR_BLT,
        OWN_NAME: .properties.OWN_NAME,
        OWN_ADDR1: .properties.OWN_ADDR1,
        OWN_CITY: .properties.OWN_CITY,
        OWN_STATE: .properties.OWN_STATE,
        OWN_ZIPCD: .properties.OWN_ZIPCD,
        PHY_ADDR1: .properties.PHY_ADDR1,
        PHY_CITY: .properties.PHY_CITY,
        PHY_ZIPCD: .properties.PHY_ZIPCD,
        S_LEGAL: .properties.S_LEGAL,
        data_source: "FLORIDA_DOR_2024",
        import_batch: "charlotte_2024_direct",
        source_file: "charlotte_parcels_2024.geojson"
    })' "$DATA_FILE" > "/tmp/batch_${batch_num}.json"
    
    # Count records in batch
    local count=$(jq 'length' "/tmp/batch_${batch_num}.json")
    
    if [ "$count" -gt 0 ]; then
        echo "Batch ${batch_num}: Inserting ${count} records..."
        
        # Use Python script to insert via MCP
        python3 << EOPYTHON
import json
import subprocess

# Read batch data
with open('/tmp/batch_${batch_num}.json', 'r') as f:
    records = json.load(f)

# Create insert values
values = []
for r in records:
    value_parts = []
    for k, v in r.items():
        if v is None:
            value_parts.append("NULL")
        elif isinstance(v, str):
            # Escape single quotes
            escaped = v.replace("'", "''")
            value_parts.append(f"'{escaped}'")
        else:
            value_parts.append(str(v))
    
    # Build column names and values
    cols = list(r.keys())
    vals = value_parts
    
# Split into smaller chunks if needed
chunk_size = 100
for i in range(0, len(records), chunk_size):
    chunk = records[i:i+chunk_size]
    
    # Build SQL for chunk
    sql_values = []
    for r in chunk:
        vals = []
        for k, v in r.items():
            if v is None:
                vals.append("NULL")
            elif isinstance(v, str):
                escaped = v.replace("'", "''")
                vals.append(f"'{escaped}'")
            else:
                vals.append(str(v))
        sql_values.append(f"({','.join(vals)})")
    
    # Create INSERT statement
    columns = ','.join(r.keys())
    sql = f"""
    INSERT INTO florida_parcels ({columns})
    VALUES {','.join(sql_values)}
    ON CONFLICT (CO_NO, PARCEL_ID) DO UPDATE SET
        data_source = EXCLUDED.data_source,
        import_batch = EXCLUDED.import_batch,
        updated_at = NOW()
    """
    
    # Execute via claude mcp
    try:
        result = subprocess.run([
            'claude', 'mcp', 
            'supabase', 'execute_sql',
            '--project_id', 'tmlrvecuwgppbaynesji',
            '--query', sql
        ], capture_output=True, text=True)
        
        if result.returncode \!= 0:
            print(f"Error in chunk: {result.stderr}")
    except Exception as e:
        print(f"Error: {e}")

print(f"Batch ${batch_num} complete")
EOPYTHON
        
        echo -e "${GREEN}✓ Batch ${batch_num} complete${NC}"
    else
        echo "Batch ${batch_num}: No records to process"
    fi
    
    # Clean up
    rm -f "/tmp/batch_${batch_num}.json"
    
    # Show progress
    local remaining=$(( $TOTAL_BATCHES - $batch_num ))
    echo -e "${BLUE}Progress: ${batch_num}/${TOTAL_BATCHES} batches complete, ${remaining} remaining${NC}"
    echo ""
}

# Export function for parallel execution
export -f process_batch
export DATA_FILE BATCH_SIZE TOTAL_BATCHES GREEN YELLOW RED BLUE NC

# Start time
START_TIME=$(date +%s)

echo -e "${GREEN}Starting import...${NC}"
echo ""

# Process in parallel
seq 0 $BATCH_SIZE $(( $TOTAL_FEATURES - 1 )) | xargs -P $PARALLEL_JOBS -I {} bash -c 'process_batch "$@"' _ {}

# End time
END_TIME=$(date +%s)
DURATION=$(( ($END_TIME - $START_TIME) / 60 ))

echo ""
echo -e "${GREEN}=== Import Complete ===${NC}"
echo -e "${BLUE}Duration:${NC} ${DURATION} minutes"
echo ""

# Verify via MCP
echo "Verifying import..."
claude mcp supabase execute_sql \
  --project_id tmlrvecuwgppbaynesji \
  --query "SELECT COUNT(*) as count FROM florida_parcels WHERE CO_NO = 15"

echo ""
echo -e "${GREEN}Import complete\!${NC}"
