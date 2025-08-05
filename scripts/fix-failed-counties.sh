#!/bin/bash

# Fix Failed Counties Import Script
# Handles counties that failed due to timeouts or data issues

set -euo pipefail

# Security: Use environment variable or secure prompt
DB_PASSWORD="${DB_PASSWORD:-}"
if [ -z "$DB_PASSWORD" ]; then
    echo "Database password required. Set DB_PASSWORD environment variable or enter now:"
    read -sp "Password: " DB_PASSWORD
    echo
fi

# Configuration
GDB_PATH="/Users/madengineering/ClaimGuardian/data/florida/Cadastral_Statewide.gdb"
WORK_DIR="/tmp/florida_parcels_import"
LOG_DIR="$WORK_DIR/logs"

# Database connection
DB_HOST="aws-0-us-east-2.pooler.supabase.com"
DB_PORT="6543"
DB_USER="postgres.tmlrvecuwgppbaynesji"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Create directories
mkdir -p "$WORK_DIR" "$LOG_DIR"

# Function to log messages
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Function to import with batching
import_county_batched() {
    local COUNTY_CODE="$1"
    local COUNTY_NAME="$2"
    local BATCH_SIZE="${3:-50000}"  # Default 50k records per batch
    
    log "Processing $COUNTY_NAME County ($COUNTY_CODE) with batched import"
    
    # Check current status
    local EXISTING=$(PGPASSWORD="$DB_PASSWORD" psql \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d postgres \
        -t -A \
        -c "SELECT COUNT(*) FROM florida_parcels WHERE co_no = $COUNTY_CODE;" 2>/dev/null || echo "0")
    
    if [ "$EXISTING" -gt 0 ]; then
        log "Already has $EXISTING parcels. Clearing for re-import..."
        PGPASSWORD="$DB_PASSWORD" psql \
            -h "$DB_HOST" \
            -p "$DB_PORT" \
            -U "$DB_USER" \
            -d postgres \
            -c "DELETE FROM florida_parcels WHERE co_no = $COUNTY_CODE;"
    fi
    
    # Convert county name to lowercase
    local COUNTY_NAME_LOWER=$(echo "$COUNTY_NAME" | tr '[:upper:]' '[:lower:]' | tr ' ' '_')
    local CSV_FILE="$WORK_DIR/${COUNTY_NAME_LOWER}_parcels.csv"
    
    # Extract from GDB
    log "Extracting data from GDB..."
    ogr2ogr -f CSV "$CSV_FILE" \
        "$GDB_PATH" \
        -sql "SELECT * FROM CADASTRAL_DOR WHERE CO_NO = $COUNTY_CODE" \
        -lco GEOMETRY=AS_WKT \
        -progress
    
    if [ ! -f "$CSV_FILE" ]; then
        error "Failed to extract data for $COUNTY_NAME"
        return 1
    fi
    
    # Count records
    local TOTAL_RECORDS=$(($(wc -l < "$CSV_FILE") - 1))
    log "Extracted $TOTAL_RECORDS records"
    
    # Clean data
    local CLEAN_CSV="$WORK_DIR/${COUNTY_NAME_LOWER}_clean.csv"
    
    log "Cleaning data..."
    awk -F',' '
    BEGIN { OFS="," }
    NR == 1 { print; next }  # Keep header
    {
        # Clean each field
        for (i = 1; i <= NF; i++) {
            # Remove quotes and trim whitespace
            gsub(/^[ \t"]+|[ \t"]+$/, "", $i)
            
            # Handle empty numeric fields
            if ($i == "" || $i == " " || $i == "  " || $i == "NULL") {
                # Check if this is a numeric column based on position
                if (i >= 10 && i <= 130) {  # Most numeric columns are in this range
                    $i = "0"
                }
            }
        }
        print
    }' "$CSV_FILE" > "$CLEAN_CSV"
    
    # Split into batches
    log "Splitting into batches of $BATCH_SIZE records..."
    
    # Save header
    head -1 "$CLEAN_CSV" > "$WORK_DIR/${COUNTY_NAME_LOWER}_header.csv"
    
    # Split data (excluding header)
    tail -n +2 "$CLEAN_CSV" | split -l $BATCH_SIZE - "$WORK_DIR/${COUNTY_NAME_LOWER}_batch_"
    
    # Count batches
    local BATCH_COUNT=$(ls -1 "$WORK_DIR/${COUNTY_NAME_LOWER}_batch_"* 2>/dev/null | wc -l)
    log "Created $BATCH_COUNT batches"
    
    # Process each batch
    local BATCH_NUM=0
    local TOTAL_IMPORTED=0
    
    for BATCH_FILE in "$WORK_DIR/${COUNTY_NAME_LOWER}_batch_"*; do
        if [ -f "$BATCH_FILE" ]; then
            BATCH_NUM=$((BATCH_NUM + 1))
            log "Processing batch $BATCH_NUM of $BATCH_COUNT..."
            
            # Create temp file for this batch (without header for COPY)
            local TEMP_BATCH="$WORK_DIR/${COUNTY_NAME_LOWER}_import_batch_${BATCH_NUM}.csv"
            cp "$BATCH_FILE" "$TEMP_BATCH"
            
            # Import this batch
            local BATCH_RESULT=$(PGPASSWORD="$DB_PASSWORD" psql \
                -h "$DB_HOST" \
                -p "$DB_PORT" \
                -U "$DB_USER" \
                -d postgres \
                -c "\COPY florida_parcels(wkt, parcel_id, co_no, parcel_no, sub_parcel, bas_st_cd, asd_val, jv, tv, sd, scd, jvh, tvh, jvl, consrv_lnd, sec, twp, rng, dor_uc, pa_uc, soh_dt, mp, nbrhd_cd, nbrhd_factor, nbrhd_typ_cd, tax_auth_cd, twp_id, own_addr_1, own_addr_2, own_addr_3, own_city, own_state, own_country, own_zipcd, own_state_dom, vi_cd, yr_blt, no_buldng, no_res_unts, struct_val, m_par_sal1, vi_cd1, qal_cd1, sale_prc1, sale_yr1, sale_mo1, or_book1, or_page1, clerk_no1, s_chng_cd1, m_par_sal2, vi_cd2, qal_cd2, sale_prc2, sale_yr2, sale_mo2, or_book2, or_page2, clerk_no2, s_chng_cd2, m_par_sal3, vi_cd3, qal_cd3, sale_prc3, sale_yr3, sale_mo3, or_book3, or_page3, clerk_no3, s_chng_cd3, lnd_val, bldg_val, tot_val, soh_val, new_consrv_val, assess_val, nconst_val, del_val, par_splt, distr_cd, distr_yr, lnd_unts_cd, no_lnd_unts, lnd_sqfoot, dt_last_inspt, certified_val, flucv_val, exmpt_01, exmpt_02, exmpt_03, exmpt_04, exmpt_05, exmpt_06, exmpt_07, exmpt_08, exmpt_09, exmpt_10, exmpt_11, exmpt_12, exmpt_13, exmpt_14, exmpt_15, exmpt_16, exmpt_17, exmpt_18, exmpt_19, exmpt_20, exmpt_21, exmpt_22, exmpt_23, exmpt_24, exmpt_25, exmpt_26, exmpt_27, exmpt_28, exmpt_29, exmpt_30, exmpt_31, exmpt_32, exmpt_33, exmpt_34, exmpt_35, exmpt_36, exmpt_37, exmpt_38, exmpt_39, exmpt_40, exmpt_tot, seq_no, rs_id, mp_id, state_par_id, situs_addr_1, situs_addr_2, situs_city, situs_state, situs_zip, phy_addr1, phy_addr2, phy_city, phy_zipcd, alt_key, ass_dif_trns, own_name, objectid, shape_length, shape_area) FROM '$TEMP_BATCH' WITH (FORMAT csv);" 2>&1)
            
            if [ $? -eq 0 ]; then
                local BATCH_IMPORTED=$(echo "$BATCH_RESULT" | grep -o 'COPY [0-9]*' | awk '{print $2}')
                TOTAL_IMPORTED=$((TOTAL_IMPORTED + BATCH_IMPORTED))
                success "Batch $BATCH_NUM imported: $BATCH_IMPORTED records"
            else
                error "Batch $BATCH_NUM failed: $BATCH_RESULT"
            fi
            
            # Clean up batch file
            rm -f "$TEMP_BATCH"
        fi
    done
    
    # Verify final count
    local FINAL_COUNT=$(PGPASSWORD="$DB_PASSWORD" psql \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d postgres \
        -t -A \
        -c "SELECT COUNT(*) FROM florida_parcels WHERE co_no = $COUNTY_CODE;" 2>/dev/null || echo "0")
    
    success "$COUNTY_NAME County: Imported $FINAL_COUNT parcels (from $TOTAL_RECORDS extracted)"
    
    # Cleanup
    rm -f "$CSV_FILE" "$CLEAN_CSV" "$WORK_DIR/${COUNTY_NAME_LOWER}_batch_"* "$WORK_DIR/${COUNTY_NAME_LOWER}_header.csv"
}

# Failed counties that need fixing
log "Starting to fix failed county imports..."

# Counties that failed with timeouts
FAILED_COUNTIES=(
    "23 DESOTO"
    "46 LEON"
    "51 MARION"
    "52 MARTIN"
    "58 ORANGE"
)

# Also fix Miami-Dade which only partially imported
log "Including Miami-Dade for re-import (partial data issue)..."
FAILED_COUNTIES+=("53 MIAMI-DADE")

# Process each failed county
for COUNTY in "${FAILED_COUNTIES[@]}"; do
    IFS=' ' read -r CODE NAME <<< "$COUNTY"
    log "========================="
    log "Fixing County $CODE ($NAME)"
    log "========================="
    
    # Use different batch sizes based on expected county size
    case $CODE in
        53)  # Miami-Dade - very large
            import_county_batched "$CODE" "$NAME" 25000
            ;;
        58)  # Orange - large
            import_county_batched "$CODE" "$NAME" 30000
            ;;
        51|52)  # Marion, Martin - medium
            import_county_batched "$CODE" "$NAME" 40000
            ;;
        *)  # Others - standard
            import_county_batched "$CODE" "$NAME" 50000
            ;;
    esac
    
    echo
done

success "Failed counties recovery process completed!"
log "Run the monitoring script to verify: ./scripts/monitor-import-ultimate.sh"