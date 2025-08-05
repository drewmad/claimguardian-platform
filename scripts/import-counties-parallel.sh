#!/bin/bash

# Parallel Florida Counties Import System
# Processes multiple counties simultaneously for faster imports

set -euo pipefail

# Configuration
DB_HOST="aws-0-us-east-2.pooler.supabase.com"
DB_PORT="6543"
DB_USER="postgres.tmlrvecuwgppbaynesji"
DB_NAME="postgres"
DB_PASSWORD="Hotdam2025a"
GDB_PATH="/Users/madengineering/ClaimGuardian/data/florida/Cadastral_Statewide.gdb"
WORK_DIR="/tmp/florida_parcels_import"
LOG_DIR="$WORK_DIR/logs"
MAX_PARALLEL=4  # Number of parallel imports

# Create directories
mkdir -p "$WORK_DIR" "$LOG_DIR"

# Function to process a single county
process_county() {
    local COUNTY_CODE=$1
    local COUNTY_NAME=$2
    local LOG_FILE="$LOG_DIR/county_${COUNTY_CODE}_${COUNTY_NAME}.log"
    
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting $COUNTY_NAME County ($COUNTY_CODE)" > "$LOG_FILE"
    
    # Extract from GDB
    local CSV_FILE="$WORK_DIR/${COUNTY_NAME}_${COUNTY_CODE}_parcels.csv"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Extracting from GDB..." >> "$LOG_FILE"
    
    ogr2ogr -f CSV "$CSV_FILE" "$GDB_PATH" CADASTRAL_DOR \
        -where "CO_NO = $COUNTY_CODE" \
        -progress 2>&1 | grep -v "Warning" >> "$LOG_FILE" || true
    
    if [ ! -f "$CSV_FILE" ]; then
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: Failed to extract data" >> "$LOG_FILE"
        return 1
    fi
    
    local ROW_COUNT=$(wc -l < "$CSV_FILE")
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Extracted $ROW_COUNT rows" >> "$LOG_FILE"
    
    # Extract required columns
    local CLEAN_CSV="$WORK_DIR/${COUNTY_NAME}_${COUNTY_CODE}_clean.csv"
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
    
    # Clean data and remove duplicates
    local FINAL_CSV="$WORK_DIR/${COUNTY_NAME}_${COUNTY_CODE}_final.csv"
    awk -F',' -v OFS=',' '
    NR==1 { print; next }
    {
        # Clean fields
        for (i = 1; i <= NF; i++) {
            gsub(/^"/, "", $i)
            gsub(/"$/, "", $i)
            gsub(/^[ \t]+|[ \t]+$/, "", $i)
            
            # Fix numeric fields
            if ((i >= 11 && i <= 22) || (i >= 33 && i <= 38) || (i >= 43 && i <= 45)) {
                if ($i == "" || $i == " " || $i == "  " || $i == "NULL") {
                    $i = "0"
                }
            }
        }
        print
    }' "$CLEAN_CSV" | awk -F',' '!seen[$2]++' > "$FINAL_CSV"
    
    local UNIQUE_COUNT=$(wc -l < "$FINAL_CSV")
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Unique parcels: $((UNIQUE_COUNT - 1))" >> "$LOG_FILE"
    
    # Import to database
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Importing to database..." >> "$LOG_FILE"
    PGPASSWORD="$DB_PASSWORD" psql \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        -c "\COPY florida_parcels(co_no,parcel_id,file_t,asmnt_yr,bas_strt,atv_strt,grp_no,dor_uc,pa_uc,spass_cd,jv,jv_chng,jv_chng_cd,av_sd,av_nsd,tv_sd,tv_nsd,jv_hmstd,av_hmstd,jv_non_hms,lnd_val,imp_val,own_name,own_addr1,own_addr2,own_city,own_state,own_zipcd,phy_addr1,phy_addr2,phy_city,phy_zipcd,lnd_sqfoot,tot_lvg_ar,no_buldng,sale_prc1,sale_yr1,sale_mo1,or_book1,or_page1,clerk_no1,qual_cd1,sale_prc2,sale_yr2,sale_mo2,or_book2,or_page2,clerk_no2,qual_cd2,s_legal,twn,rng,sec) FROM '$FINAL_CSV' WITH (FORMAT csv, HEADER true);" 2>&1 >> "$LOG_FILE"
    
    # Verify
    local IMPORT_COUNT=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM florida_parcels WHERE co_no = $COUNTY_CODE;" | xargs)
    
    # Clean up
    rm -f "$CSV_FILE" "$CLEAN_CSV" "$FINAL_CSV"
    
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✅ Complete! Imported $IMPORT_COUNT parcels" >> "$LOG_FILE"
    echo "✅ $COUNTY_NAME ($COUNTY_CODE): $IMPORT_COUNT parcels"
}

# Export function for parallel execution
export -f process_county
export DB_HOST DB_PORT DB_USER DB_NAME DB_PASSWORD GDB_PATH WORK_DIR LOG_DIR

# Main execution
echo "=========================================="
echo "Parallel Florida Counties Import System"
echo "=========================================="
echo "Max parallel jobs: $MAX_PARALLEL"
echo "Work directory: $WORK_DIR"
echo "Log directory: $LOG_DIR"
echo

# Get current status
echo "Current import status:"
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT co_no, COUNT(*) as parcels FROM florida_parcels GROUP BY co_no ORDER BY co_no;"

# Get already imported counties
IMPORTED_COUNTIES=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT DISTINCT co_no FROM florida_parcels;" | xargs)

# Create jobs file with remaining counties
JOBS_FILE="$WORK_DIR/counties_to_import.txt"
> "$JOBS_FILE"

# All counties (excluding already imported)
declare -a COUNTIES=(
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
    "40 INDIAN_RIVER"
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
    "60 PALM_BEACH"
    "61 PASCO"
    "62 PINELLAS"
    "63 POLK"
    "64 PUTNAM"
    "65 ST_JOHNS"
    "66 ST_LUCIE"
    "67 SANTA_ROSA"
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

# Filter out already imported counties
TO_IMPORT=0
for county in "${COUNTIES[@]}"; do
    CODE=$(echo "$county" | cut -d' ' -f1)
    NAME=$(echo "$county" | cut -d' ' -f2)
    
    if [[ ! " $IMPORTED_COUNTIES " =~ " $CODE " ]]; then
        echo "$CODE $NAME" >> "$JOBS_FILE"
        ((TO_IMPORT++))
    fi
done

echo "Counties to import: $TO_IMPORT"
echo

if [ $TO_IMPORT -eq 0 ]; then
    echo "All counties already imported!"
    exit 0
fi

# Monitor function
monitor_progress() {
    while true; do
        clear
        echo "=========================================="
        echo "Parallel Import Progress"
        echo "=========================================="
        echo "Time: $(date '+%Y-%m-%d %H:%M:%S')"
        echo
        
        # Show active jobs
        echo "Active imports:"
        ps aux | grep "[p]rocess_county" | awk '{print $NF}' | while read line; do
            echo "  - Processing: $line"
        done
        echo
        
        # Show completed counties
        echo "Recently completed:"
        tail -n 20 "$LOG_DIR"/*.log 2>/dev/null | grep "✅ Complete" | tail -5
        echo
        
        # Database status
        echo "Database status:"
        PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) as total, COUNT(DISTINCT co_no) as counties FROM florida_parcels;" 2>/dev/null || echo "Unable to connect"
        
        sleep 5
    done
}

# Start monitoring in background
monitor_progress &
MONITOR_PID=$!

# Trap to clean up monitor on exit
trap "kill $MONITOR_PID 2>/dev/null" EXIT

# Process counties in parallel
echo "Starting parallel import..."
echo "Check individual logs in: $LOG_DIR"
echo
cat "$JOBS_FILE" | xargs -n 2 -P "$MAX_PARALLEL" bash -c 'process_county "$@"' _

# Kill monitor
kill $MONITOR_PID 2>/dev/null

# Final summary
echo
echo "=========================================="
echo "Import Complete!"
echo "=========================================="

# Show final status
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
SELECT 
    COUNT(*) as total_parcels, 
    COUNT(DISTINCT co_no) as total_counties,
    string_agg(DISTINCT co_no::text, ', ' ORDER BY co_no::text) as imported_counties
FROM florida_parcels;"

echo
echo "County details:"
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT co_no, COUNT(*) as parcels FROM florida_parcels GROUP BY co_no ORDER BY co_no;"

echo
echo "Logs available in: $LOG_DIR"
echo "Completed: $(date)"