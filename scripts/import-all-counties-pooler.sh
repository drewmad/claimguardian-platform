#!/bin/bash

# Import all Florida counties using the pooler connection method that works
# Processes counties one by one with proper data cleaning

set -euo pipefail

# Configuration
DB_HOST="aws-0-us-east-2.pooler.supabase.com"
DB_PORT="6543"
DB_USER="postgres.tmlrvecuwgppbaynesji"
DB_NAME="postgres"
DB_PASSWORD="Hotdam2025a"
GDB_PATH="/Users/madengineering/ClaimGuardian/data/florida/Cadastral_Statewide.gdb"
WORK_DIR="/tmp/florida_parcels_import"
LOG_FILE="$WORK_DIR/import_log.txt"

# Create work directory
mkdir -p "$WORK_DIR"
echo "Florida Counties Import System (Pooler Method)" > "$LOG_FILE"
echo "Started: $(date)" >> "$LOG_FILE"
echo "================================" >> "$LOG_FILE"

# Function to process a single county
process_county() {
    local COUNTY_CODE=$1
    local COUNTY_NAME=$2
    local COUNTY_NAME_LOWER=$(echo "$COUNTY_NAME" | tr '[:upper:]' '[:lower:]')
    local CSV_FILE="$WORK_DIR/${COUNTY_NAME_LOWER}_parcels.csv"
    local CLEAN_CSV="$WORK_DIR/${COUNTY_NAME_LOWER}_clean.csv"
    local FINAL_CSV="$WORK_DIR/${COUNTY_NAME_LOWER}_final.csv"
    local START_TIME=$(date +%s)

    echo "[County $COUNTY_CODE - $COUNTY_NAME] Starting..." | tee -a "$LOG_FILE"

    # Step 1: Extract county to CSV
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

    # Step 2: Extract required columns (same as Charlotte)
    echo "[County $COUNTY_CODE - $COUNTY_NAME] Extracting required columns..." | tee -a "$LOG_FILE"
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

    # Step 3: Clean data - fix empty numeric fields
    echo "[County $COUNTY_CODE - $COUNTY_NAME] Cleaning data..." | tee -a "$LOG_FILE"
    awk -F',' -v OFS=',' '
    NR==1 { print; next }
    {
        # Clean each field
        for (i = 1; i <= NF; i++) {
            # Remove quotes that were added
            gsub(/^"/, "", $i)
            gsub(/"$/, "", $i)
            # Trim spaces
            gsub(/^[ \t]+|[ \t]+$/, "", $i)

            # Fix numeric fields
            if ((i >= 11 && i <= 22) || (i >= 33 && i <= 38) || (i >= 43 && i <= 45)) {
                if ($i == "" || $i == " " || $i == "  " || $i == "NULL") {
                    $i = "0"
                }
            }
        }
        print
    }' "$CLEAN_CSV" > "${CLEAN_CSV}.tmp" && mv "${CLEAN_CSV}.tmp" "$CLEAN_CSV"

    # Step 4: Remove duplicates
    echo "[County $COUNTY_CODE - $COUNTY_NAME] Removing duplicates..." | tee -a "$LOG_FILE"
    awk -F',' 'NR==1 || !seen[$2]++' "$CLEAN_CSV" > "$FINAL_CSV"

    local UNIQUE_COUNT=$(wc -l < "$FINAL_CSV")
    echo "[County $COUNTY_CODE - $COUNTY_NAME] Unique parcels: $((UNIQUE_COUNT - 1))" | tee -a "$LOG_FILE"

    # Step 5: Import to database using pooler
    echo "[County $COUNTY_CODE - $COUNTY_NAME] Importing to database..." | tee -a "$LOG_FILE"
    PGPASSWORD="$DB_PASSWORD" psql \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        -c "\COPY florida_parcels(co_no,parcel_id,file_t,asmnt_yr,bas_strt,atv_strt,grp_no,dor_uc,pa_uc,spass_cd,jv,jv_chng,jv_chng_cd,av_sd,av_nsd,tv_sd,tv_nsd,jv_hmstd,av_hmstd,jv_non_hms,lnd_val,imp_val,own_name,own_addr1,own_addr2,own_city,own_state,own_zipcd,phy_addr1,phy_addr2,phy_city,phy_zipcd,lnd_sqfoot,tot_lvg_ar,no_buldng,sale_prc1,sale_yr1,sale_mo1,or_book1,or_page1,clerk_no1,qual_cd1,sale_prc2,sale_yr2,sale_mo2,or_book2,or_page2,clerk_no2,qual_cd2,s_legal,twn,rng,sec) FROM '$FINAL_CSV' WITH (FORMAT csv, HEADER true);" 2>&1 | tee -a "$LOG_FILE"

    # Step 6: Verify import
    local IMPORT_COUNT=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM florida_parcels WHERE co_no = $COUNTY_CODE;" | xargs)

    # Clean up temporary files
    rm -f "$CSV_FILE" "$CLEAN_CSV" "$FINAL_CSV"

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
echo "Using pooler connection method"
echo "Work directory: $WORK_DIR"
echo

# Check current status
echo "Checking current import status..."
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT co_no, COUNT(*) as parcels FROM florida_parcels GROUP BY co_no ORDER BY co_no;"

# All Florida counties
ALL_COUNTIES=(
    "11:ALACHUA"
    "12:BAKER"
    "13:BAY"
    "14:BRADFORD"
    "15:BREVARD"
    "16:BROWARD"
    "17:CALHOUN"
    "18:CHARLOTTE"
    "19:CITRUS"
    "20:CLAY"
    "21:COLLIER"
    "22:COLUMBIA"
    "23:DESOTO"
    "24:DIXIE"
    "25:DUVAL"
    "26:ESCAMBIA"
    "27:FLAGLER"
    "28:FRANKLIN"
    "29:GADSDEN"
    "30:GILCHRIST"
    "31:GLADES"
    "32:GULF"
    "33:HAMILTON"
    "34:HARDEE"
    "35:HENDRY"
    "36:HERNANDO"
    "37:HIGHLANDS"
    "38:HILLSBOROUGH"
    "39:HOLMES"
    "40:INDIAN RIVER"
    "41:JACKSON"
    "42:JEFFERSON"
    "43:LAFAYETTE"
    "44:LAKE"
    "45:LEE"
    "46:LEON"
    "47:LEVY"
    "48:LIBERTY"
    "49:MADISON"
    "50:MANATEE"
    "51:MARION"
    "52:MARTIN"
    "53:MIAMI-DADE"
    "54:MONROE"
    "55:NASSAU"
    "56:OKALOOSA"
    "57:OKEECHOBEE"
    "58:ORANGE"
    "59:OSCEOLA"
    "60:PALM BEACH"
    "61:PASCO"
    "62:PINELLAS"
    "63:POLK"
    "64:PUTNAM"
    "65:ST. JOHNS"
    "66:ST. LUCIE"
    "67:SANTA ROSA"
    "68:SARASOTA"
    "69:SEMINOLE"
    "70:SUMTER"
    "71:SUWANNEE"
    "72:TAYLOR"
    "73:UNION"
    "74:VOLUSIA"
    "75:WAKULLA"
    "76:WALTON"
    "77:WASHINGTON"
)

# Get list of already imported counties
IMPORTED_COUNTIES=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT DISTINCT co_no FROM florida_parcels WHERE co_no IS NOT NULL;" | xargs)

# Process each county
TOTAL_COUNTIES=${#ALL_COUNTIES[@]}
PROCESSED=0
SKIPPED=0

for county_info in "${ALL_COUNTIES[@]}"; do
    IFS=':' read -r code name <<< "$county_info"

    # Check if already imported
    if [[ " $IMPORTED_COUNTIES " =~ " $code " ]]; then
        echo "⏭️  Skipping $name County ($code) - already imported"
        ((SKIPPED++))
        continue
    fi

    # Process this county
    process_county "$code" "$name"
    ((PROCESSED++))

    # Show progress
    echo "Progress: $((PROCESSED + SKIPPED))/$TOTAL_COUNTIES counties ($PROCESSED imported, $SKIPPED skipped)"
    echo
done

# Final summary
echo
echo "=========================================="
echo "Import Summary"
echo "=========================================="

# Get total counts
TOTAL_PARCELS=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM florida_parcels;" | xargs)
TOTAL_COUNTIES=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(DISTINCT co_no) FROM florida_parcels;" | xargs)

echo "Total parcels imported: $TOTAL_PARCELS"
echo "Total counties: $TOTAL_COUNTIES / 67"
echo "Processed in this run: $PROCESSED"
echo "Skipped (already imported): $SKIPPED"
echo
echo "Counties with data:"
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT co_no, COUNT(*) as parcels FROM florida_parcels GROUP BY co_no ORDER BY co_no;"
echo
echo "Log file: $LOG_FILE"
echo "Completed: $(date)"
