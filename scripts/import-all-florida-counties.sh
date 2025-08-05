#!/bin/bash

# Optimal Florida Counties Import System
# Imports all 67 counties efficiently using parallel processing

set -euo pipefail

# Configuration
DB_HOST="db.tmlrvecuwgppbaynesji.supabase.co"
DB_PORT="5432"
DB_USER="postgres"
DB_NAME="postgres"
DB_PASSWORD="Hotdam2025a"
GDB_PATH="/Users/madengineering/ClaimGuardian/data/florida/Cadastral_Statewide.gdb"
WORK_DIR="/tmp/florida_parcels_import"
MAX_PARALLEL=4  # Number of parallel imports
LOG_FILE="$WORK_DIR/import_log.txt"

# Florida counties (code: name)
declare -A COUNTIES=(
    [11]="ALACHUA" [12]="BAKER" [13]="BAY" [14]="BRADFORD" [15]="BREVARD"
    [16]="BROWARD" [17]="CALHOUN" [19]="CITRUS" [20]="CLAY"
    [21]="COLLIER" [22]="COLUMBIA" [23]="DESOTO" [24]="DIXIE" [25]="DUVAL"
    [26]="ESCAMBIA" [27]="FLAGLER" [28]="FRANKLIN" [29]="GADSDEN" [30]="GILCHRIST"
    [31]="GLADES" [32]="GULF" [33]="HAMILTON" [34]="HARDEE" [35]="HENDRY"
    [36]="HERNANDO" [37]="HIGHLANDS" [38]="HILLSBOROUGH" [39]="HOLMES" [40]="INDIAN RIVER"
    [41]="JACKSON" [42]="JEFFERSON" [43]="LAFAYETTE" [44]="LAKE" [45]="LEE"
    [46]="LEON" [47]="LEVY" [48]="LIBERTY" [49]="MADISON" [50]="MANATEE"
    [51]="MARION" [52]="MARTIN" [53]="MIAMI-DADE" [54]="MONROE" [55]="NASSAU"
    [56]="OKALOOSA" [57]="OKEECHOBEE" [58]="ORANGE" [59]="OSCEOLA" [60]="PALM BEACH"
    [61]="PASCO" [62]="PINELLAS" [63]="POLK" [64]="PUTNAM" [65]="ST. JOHNS"
    [66]="ST. LUCIE" [67]="SANTA ROSA" [68]="SARASOTA" [69]="SEMINOLE" [70]="SUMTER"
    [71]="SUWANNEE" [72]="TAYLOR" [73]="UNION" [74]="VOLUSIA" [75]="WAKULLA"
    [76]="WALTON" [77]="WASHINGTON"
)

# Create work directory
mkdir -p "$WORK_DIR"
echo "Florida Parcels Import System" > "$LOG_FILE"
echo "Started: $(date)" >> "$LOG_FILE"
echo "================================" >> "$LOG_FILE"

# Function to process a single county
process_county() {
    local COUNTY_CODE=$1
    local COUNTY_NAME=$2
    local CSV_FILE="$WORK_DIR/county_${COUNTY_CODE}.csv"
    local CLEAN_CSV="$WORK_DIR/county_${COUNTY_CODE}_clean.csv"
    local START_TIME=$(date +%s)
    
    echo "[County $COUNTY_CODE - $COUNTY_NAME] Starting..." | tee -a "$LOG_FILE"
    
    # Extract county to CSV
    echo "[County $COUNTY_CODE - $COUNTY_NAME] Extracting from GDB..." | tee -a "$LOG_FILE"
    ogr2ogr -f CSV \
        "$CSV_FILE" \
        "$GDB_PATH" \
        CADASTRAL_DOR \
        -where "CO_NO = $COUNTY_CODE" \
        -progress \
        2>&1 | grep -v "Warning" || true
    
    # Check if CSV was created
    if [ ! -f "$CSV_FILE" ]; then
        echo "[County $COUNTY_CODE - $COUNTY_NAME] ERROR: Failed to extract data" | tee -a "$LOG_FILE"
        return 1
    fi
    
    # Get row count
    local ROW_COUNT=$(wc -l < "$CSV_FILE")
    echo "[County $COUNTY_CODE - $COUNTY_NAME] Extracted $ROW_COUNT rows" | tee -a "$LOG_FILE"
    
    # Create clean CSV with required columns
    echo "[County $COUNTY_CODE - $COUNTY_NAME] Preparing data..." | tee -a "$LOG_FILE"
    awk -F',' '
    NR==1 {
        print "co_no,parcel_id,file_t,asmnt_yr,bas_strt,atv_strt,grp_no,dor_uc,pa_uc,spass_cd,jv,jv_chng,jv_chng_cd,av_sd,av_nsd,tv_sd,tv_nsd,jv_hmstd,av_hmstd,jv_non_hms,lnd_val,imp_val,own_name,own_addr1,own_addr2,own_city,own_state,own_zipcd,phy_addr1,phy_addr2,phy_city,phy_zipcd,lnd_sqfoot,tot_lvg_ar,no_buldng,sale_prc1,sale_yr1,sale_mo1,or_book1,or_page1,clerk_no1,qual_cd1,sale_prc2,sale_yr2,sale_mo2,or_book2,or_page2,clerk_no2,qual_cd2,s_legal,twn,rng,sec"
    }
    NR>1 {
        printf "%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s\n",
            $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,
            $41,$42,$74,$75,$76,$77,$78,$79,$99,$100,$101,$102,$52,$49,$53,
            $57,$58,$59,$60,$61,$62,$55,$67,$68,$69,$70,$71,$72,$65,$87,$88,$89,$90
    }' "$CSV_FILE" > "$CLEAN_CSV"
    
    # Remove duplicates
    local UNIQUE_CSV="$WORK_DIR/county_${COUNTY_CODE}_unique.csv"
    awk -F',' 'NR==1 || !seen[$2]++' "$CLEAN_CSV" > "$UNIQUE_CSV"
    
    local UNIQUE_COUNT=$(wc -l < "$UNIQUE_CSV")
    echo "[County $COUNTY_CODE - $COUNTY_NAME] Unique parcels: $UNIQUE_COUNT" | tee -a "$LOG_FILE"
    
    # Import to database
    echo "[County $COUNTY_CODE - $COUNTY_NAME] Importing to database..." | tee -a "$LOG_FILE"
    PGPASSWORD="$DB_PASSWORD" psql \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        -c "\COPY florida_parcels(co_no,parcel_id,file_t,asmnt_yr,bas_strt,atv_strt,grp_no,dor_uc,pa_uc,spass_cd,jv,jv_chng,jv_chng_cd,av_sd,av_nsd,tv_sd,tv_nsd,jv_hmstd,av_hmstd,jv_non_hms,lnd_val,imp_val,own_name,own_addr1,own_addr2,own_city,own_state,own_zipcd,phy_addr1,phy_addr2,phy_city,phy_zipcd,lnd_sqfoot,tot_lvg_ar,no_buldng,sale_prc1,sale_yr1,sale_mo1,or_book1,or_page1,clerk_no1,qual_cd1,sale_prc2,sale_yr2,sale_mo2,or_book2,or_page2,clerk_no2,qual_cd2,s_legal,twn,rng,sec) FROM '$UNIQUE_CSV' WITH (FORMAT csv, HEADER true);" 2>&1 | tee -a "$LOG_FILE"
    
    # Check import success
    local IMPORT_COUNT=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM florida_parcels WHERE co_no = $COUNTY_CODE;")
    
    # Clean up temporary files
    rm -f "$CSV_FILE" "$CLEAN_CSV" "$UNIQUE_CSV"
    
    # Calculate time
    local END_TIME=$(date +%s)
    local ELAPSED=$((END_TIME - START_TIME))
    
    echo "[County $COUNTY_CODE - $COUNTY_NAME] ✅ Complete! Imported $IMPORT_COUNT parcels in ${ELAPSED}s" | tee -a "$LOG_FILE"
    echo "================================" >> "$LOG_FILE"
}

# Main execution
echo "=========================================="
echo "Florida Counties Import System"
echo "=========================================="
echo "Counties to import: ${#COUNTIES[@]}"
echo "Parallel workers: $MAX_PARALLEL"
echo "Work directory: $WORK_DIR"
echo

# Check if Charlotte (18) is already imported
CHARLOTTE_COUNT=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM florida_parcels WHERE co_no = 18;" | xargs)
if [ "$CHARLOTTE_COUNT" -gt 0 ]; then
    echo "✅ Charlotte County already imported: $CHARLOTTE_COUNT parcels"
    unset COUNTIES[18]
fi

# Export functions for parallel execution
export -f process_county
export DB_HOST DB_PORT DB_USER DB_NAME DB_PASSWORD GDB_PATH WORK_DIR LOG_FILE

# Create jobs file
JOBS_FILE="$WORK_DIR/jobs.txt"
> "$JOBS_FILE"
for code in "${!COUNTIES[@]}"; do
    echo "$code ${COUNTIES[$code]}" >> "$JOBS_FILE"
done

# Sort jobs by county code
sort -n "$JOBS_FILE" -o "$JOBS_FILE"

echo "Starting parallel import of ${#COUNTIES[@]} counties..."
echo

# Run parallel imports
cat "$JOBS_FILE" | xargs -n 2 -P "$MAX_PARALLEL" bash -c 'process_county "$@"' _

# Final summary
echo
echo "=========================================="
echo "Import Summary"
echo "=========================================="

# Get total counts
TOTAL_PARCELS=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM florida_parcels;" | xargs)
COUNTY_COUNTS=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT co_no, COUNT(*) as count FROM florida_parcels GROUP BY co_no ORDER BY co_no;")

echo "Total parcels imported: $TOTAL_PARCELS"
echo
echo "Parcels by county:"
echo "$COUNTY_COUNTS"
echo
echo "Log file: $LOG_FILE"
echo "Completed: $(date)"