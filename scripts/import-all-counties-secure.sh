#!/bin/bash

# Secure Florida Parcels Import Script
# Imports all counties with proper password security

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
MAX_PARALLEL=4
BATCH_SIZE=200000  # Records per batch for large counties

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

# Function to process a single county
process_county() {
    local COUNTY_CODE="$1"
    local COUNTY_NAME="$2"
    local LOG_FILE="$LOG_DIR/county_${COUNTY_CODE}_${COUNTY_NAME}.log"

    {
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting $COUNTY_NAME County ($COUNTY_CODE)"

        # Check if already imported
        local EXISTING_COUNT=$(PGPASSWORD="$DB_PASSWORD" psql \
            -h "$DB_HOST" \
            -p "$DB_PORT" \
            -U "$DB_USER" \
            -d postgres \
            -t -A \
            -c "SELECT COUNT(*) FROM florida_parcels WHERE co_no = $COUNTY_CODE;" 2>/dev/null || echo "0")

        if [ "$EXISTING_COUNT" -gt 0 ]; then
            echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✅ Already imported: $EXISTING_COUNT parcels"
            return 0
        fi

        # Convert county name to lowercase for file naming
        local COUNTY_NAME_LOWER=$(echo "$COUNTY_NAME" | tr '[:upper:]' '[:lower:]')
        local CSV_FILE="$WORK_DIR/${COUNTY_NAME_LOWER}_parcels.csv"

        # Extract from GDB
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] Extracting from GDB..."
        ogr2ogr -f CSV "$CSV_FILE" \
            "$GDB_PATH" \
            -sql "SELECT * FROM CADASTRAL_DOR WHERE CO_NO = $COUNTY_CODE" \
            -lco GEOMETRY=AS_WKT \
            -progress

        if [ ! -f "$CSV_FILE" ]; then
            echo "[$(date '+%Y-%m-%d %H:%M:%S')] ❌ Failed to extract data"
            return 1
        fi

        # Count extracted records
        local EXTRACTED_COUNT=$(($(wc -l < "$CSV_FILE") - 1))
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] Extracted $EXTRACTED_COUNT rows"

        # Clean data
        local CLEAN_CSV="$WORK_DIR/${COUNTY_NAME_LOWER}_clean.csv"

        # Process CSV: handle empty values and ensure proper formatting
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

        # Remove duplicates based on parcel_id
        local UNIQUE_CSV="$WORK_DIR/${COUNTY_NAME_LOWER}_unique.csv"
        head -1 "$CLEAN_CSV" > "$UNIQUE_CSV"
        tail -n +2 "$CLEAN_CSV" | sort -t',' -k2,2 -u >> "$UNIQUE_CSV"

        local UNIQUE_COUNT=$(($(wc -l < "$UNIQUE_CSV") - 1))
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] Unique parcels: $UNIQUE_COUNT"

        # Import to database
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] Importing to database..."

        # Prepare final CSV without header
        tail -n +2 "$UNIQUE_CSV" > "$WORK_DIR/${COUNTY_NAME_LOWER}_final.csv"

        # Use COPY command
        PGPASSWORD="$DB_PASSWORD" psql \
            -h "$DB_HOST" \
            -p "$DB_PORT" \
            -U "$DB_USER" \
            -d postgres \
            -c "\COPY florida_parcels(wkt, parcel_id, co_no, parcel_no, sub_parcel, bas_st_cd, asd_val, jv, tv, sd, scd, jvh, tvh, jvl, consrv_lnd, sec, twp, rng, dor_uc, pa_uc, soh_dt, mp, nbrhd_cd, nbrhd_factor, nbrhd_typ_cd, tax_auth_cd, twp_id, own_addr_1, own_addr_2, own_addr_3, own_city, own_state, own_country, own_zipcd, own_state_dom, vi_cd, yr_blt, no_buldng, no_res_unts, struct_val, m_par_sal1, vi_cd1, qal_cd1, sale_prc1, sale_yr1, sale_mo1, or_book1, or_page1, clerk_no1, s_chng_cd1, m_par_sal2, vi_cd2, qal_cd2, sale_prc2, sale_yr2, sale_mo2, or_book2, or_page2, clerk_no2, s_chng_cd2, m_par_sal3, vi_cd3, qal_cd3, sale_prc3, sale_yr3, sale_mo3, or_book3, or_page3, clerk_no3, s_chng_cd3, lnd_val, bldg_val, tot_val, soh_val, new_consrv_val, assess_val, nconst_val, del_val, par_splt, distr_cd, distr_yr, lnd_unts_cd, no_lnd_unts, lnd_sqfoot, dt_last_inspt, certified_val, flucv_val, exmpt_01, exmpt_02, exmpt_03, exmpt_04, exmpt_05, exmpt_06, exmpt_07, exmpt_08, exmpt_09, exmpt_10, exmpt_11, exmpt_12, exmpt_13, exmpt_14, exmpt_15, exmpt_16, exmpt_17, exmpt_18, exmpt_19, exmpt_20, exmpt_21, exmpt_22, exmpt_23, exmpt_24, exmpt_25, exmpt_26, exmpt_27, exmpt_28, exmpt_29, exmpt_30, exmpt_31, exmpt_32, exmpt_33, exmpt_34, exmpt_35, exmpt_36, exmpt_37, exmpt_38, exmpt_39, exmpt_40, exmpt_tot, seq_no, rs_id, mp_id, state_par_id, situs_addr_1, situs_addr_2, situs_city, situs_state, situs_zip, phy_addr1, phy_addr2, phy_city, phy_zipcd, alt_key, ass_dif_trns, own_name, objectid, shape_length, shape_area) FROM '$WORK_DIR/${COUNTY_NAME_LOWER}_final.csv' WITH (FORMAT csv);"

        local IMPORT_EXIT=$?

        # Verify import
        local IMPORTED_COUNT=$(PGPASSWORD="$DB_PASSWORD" psql \
            -h "$DB_HOST" \
            -p "$DB_PORT" \
            -U "$DB_USER" \
            -d postgres \
            -t -A \
            -c "SELECT COUNT(*) FROM florida_parcels WHERE co_no = $COUNTY_CODE;" 2>/dev/null || echo "0")

        echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✅ Complete! Imported $IMPORTED_COUNT parcels"

        # Cleanup
        rm -f "$CSV_FILE" "$CLEAN_CSV" "$UNIQUE_CSV" "$WORK_DIR/${COUNTY_NAME_LOWER}_final.csv"

    } > "$LOG_FILE" 2>&1
}

export -f process_county
export DB_PASSWORD DB_HOST DB_PORT DB_USER WORK_DIR LOG_DIR

# County list (code and name)
COUNTIES=(
    "11 ALACHUA"
    "12 BAKER"
    "13 BAY"
    "14 BRADFORD"
    "15 BREVARD"
    "16 BROWARD"
    "17 CALHOUN"
    "18 CHARLOTTE"
    "19 CITRUS"
    "20 CLAY"
    "21 COLLIER"
    "22 COLUMBIA"
    "23 DESOTO"
    "24 DIXIE"
    "25 DUVAL"
    "26 ESCAMBIA"
    "27 FLAGLER"
    "28 FRANKLIN"
    "29 GADSDEN"
    "30 GILCHRIST"
    "31 GLADES"
    "32 GULF"
    "33 HAMILTON"
    "34 HARDEE"
    "35 HENDRY"
    "36 HERNANDO"
    "37 HIGHLANDS"
    "38 HILLSBOROUGH"
    "39 HOLMES"
    "40 INDIAN RIVER"
    "41 JACKSON"
    "42 JEFFERSON"
    "43 LAFAYETTE"
    "44 LAKE"
    "45 LEE"
    "46 LEON"
    "47 LEVY"
    "48 LIBERTY"
    "49 MADISON"
    "50 MANATEE"
    "51 MARION"
    "52 MARTIN"
    "53 MIAMI-DADE"
    "54 MONROE"
    "55 NASSAU"
    "56 OKALOOSA"
    "57 OKEECHOBEE"
    "58 ORANGE"
    "59 OSCEOLA"
    "60 PALM BEACH"
    "61 PASCO"
    "62 PINELLAS"
    "63 POLK"
    "64 PUTNAM"
    "65 ST. JOHNS"
    "66 ST. LUCIE"
    "67 SANTA ROSA"
    "68 SARASOTA"
    "69 SEMINOLE"
    "70 SUMTER"
    "71 SUWANNEE"
    "72 TAYLOR"
    "73 UNION"
    "74 VOLUSIA"
    "75 WAKULLA"
    "76 WALTON"
    "77 WASHINGTON"
)

log "Starting secure Florida parcels import for all counties"
log "Using parallel processing with $MAX_PARALLEL jobs"
log "Check individual county logs in: $LOG_DIR"

# Process counties in parallel
printf '%s\n' "${COUNTIES[@]}" | xargs -n 1 -P "$MAX_PARALLEL" -I {} bash -c 'process_county $1 $2' _ {}

success "Import process completed!"
log "Check logs in $LOG_DIR for details"
log "Run monitor script to see results: ./scripts/monitor-import-ultimate.sh"
