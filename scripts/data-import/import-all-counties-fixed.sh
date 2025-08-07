#!/bin/bash

# Robust Florida Counties Import System with data cleaning
# Handles empty values and data formatting issues

set -euo pipefail

# Configuration
DB_HOST="db.tmlrvecuwgppbaynesji.supabase.co"
DB_PORT="5432"
DB_USER="postgres"
DB_NAME="postgres"
DB_PASSWORD="Hotdam2025a"
GDB_PATH="/Users/madengineering/ClaimGuardian/data/florida/Cadastral_Statewide.gdb"
WORK_DIR="/tmp/florida_parcels_import"
MAX_PARALLEL=2  # Reduced for better error tracking
LOG_FILE="$WORK_DIR/import_log.txt"

# Create work directory
mkdir -p "$WORK_DIR"
echo "Florida Parcels Import System (Fixed)" > "$LOG_FILE"
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

    # Create clean CSV with required columns and handle empty values
    echo "[County $COUNTY_CODE - $COUNTY_NAME] Preparing data..." | tee -a "$LOG_FILE"
    awk -F',' '
    BEGIN {
        OFS=","
        # Define column mappings
        col_map[1] = 1    # co_no
        col_map[2] = 2    # parcel_id
        col_map[3] = 3    # file_t
        col_map[4] = 4    # asmnt_yr
        col_map[5] = 5    # bas_strt
        col_map[6] = 6    # atv_strt
        col_map[7] = 7    # grp_no
        col_map[8] = 8    # dor_uc
        col_map[9] = 9    # pa_uc
        col_map[10] = 10  # spass_cd
        col_map[11] = 11  # jv
        col_map[12] = 12  # jv_chng
        col_map[13] = 13  # jv_chng_cd
        col_map[14] = 14  # av_sd
        col_map[15] = 15  # av_nsd
        col_map[16] = 16  # tv_sd
        col_map[17] = 17  # tv_nsd
        col_map[18] = 18  # jv_hmstd
        col_map[19] = 19  # av_hmstd
        col_map[20] = 20  # jv_non_hms
        col_map[21] = 41  # lnd_val
        col_map[22] = 42  # imp_val
        col_map[23] = 74  # own_name
        col_map[24] = 75  # own_addr1
        col_map[25] = 76  # own_addr2
        col_map[26] = 77  # own_city
        col_map[27] = 78  # own_state
        col_map[28] = 79  # own_zipcd
        col_map[29] = 99  # phy_addr1
        col_map[30] = 100 # phy_addr2
        col_map[31] = 101 # phy_city
        col_map[32] = 102 # phy_zipcd
        col_map[33] = 52  # lnd_sqfoot
        col_map[34] = 49  # tot_lvg_ar
        col_map[35] = 53  # no_buldng
        col_map[36] = 57  # sale_prc1
        col_map[37] = 58  # sale_yr1
        col_map[38] = 59  # sale_mo1
        col_map[39] = 60  # or_book1
        col_map[40] = 61  # or_page1
        col_map[41] = 62  # clerk_no1
        col_map[42] = 55  # qual_cd1
        col_map[43] = 67  # sale_prc2
        col_map[44] = 68  # sale_yr2
        col_map[45] = 69  # sale_mo2
        col_map[46] = 70  # or_book2
        col_map[47] = 71  # or_page2
        col_map[48] = 72  # clerk_no2
        col_map[49] = 65  # qual_cd2
        col_map[50] = 87  # s_legal
        col_map[51] = 88  # twn
        col_map[52] = 89  # rng
        col_map[53] = 90  # sec
    }
    NR==1 {
        print "co_no,parcel_id,file_t,asmnt_yr,bas_strt,atv_strt,grp_no,dor_uc,pa_uc,spass_cd,jv,jv_chng,jv_chng_cd,av_sd,av_nsd,tv_sd,tv_nsd,jv_hmstd,av_hmstd,jv_non_hms,lnd_val,imp_val,own_name,own_addr1,own_addr2,own_city,own_state,own_zipcd,phy_addr1,phy_addr2,phy_city,phy_zipcd,lnd_sqfoot,tot_lvg_ar,no_buldng,sale_prc1,sale_yr1,sale_mo1,or_book1,or_page1,clerk_no1,qual_cd1,sale_prc2,sale_yr2,sale_mo2,or_book2,or_page2,clerk_no2,qual_cd2,s_legal,twn,rng,sec"
    }
    NR>1 {
        # Build output line with proper handling of empty values
        output = ""
        for (i = 1; i <= 53; i++) {
            if (i > 1) output = output ","

            # Get the source column
            src_col = col_map[i]
            value = $src_col

            # Clean the value
            gsub(/^[ \t]+|[ \t]+$/, "", value)  # Trim whitespace

            # Handle empty numeric fields
            if (i >= 11 && i <= 22) {  # Numeric value fields
                if (value == "" || value == " " || value == "NULL") value = "0"
            }
            else if (i >= 33 && i <= 35) {  # Numeric area/building fields
                if (value == "" || value == " " || value == "NULL") value = "0"
            }
            else if (i == 36 || i == 37 || i == 38 || i == 43 || i == 44 || i == 45) {  # Sale price/year/month
                if (value == "" || value == " " || value == "NULL") value = "0"
            }
            else if (i >= 51 && i <= 53) {  # Township/Range/Section
                if (value == "" || value == " " || value == "NULL") value = ""
            }

            # Escape quotes in text fields
            if (i >= 23 && i <= 32) {  # Text fields (names, addresses)
                gsub(/"/, "\"\"", value)
                if (index(value, ",") > 0 || index(value, "\"") > 0) {
                    value = "\"" value "\""
                }
            }
            else if (i == 50) {  # Legal description
                gsub(/"/, "\"\"", value)
                if (index(value, ",") > 0 || index(value, "\"") > 0) {
                    value = "\"" value "\""
                }
            }

            output = output value
        }
        print output
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
echo "Florida Counties Import System (Fixed)"
echo "=========================================="
echo "Work directory: $WORK_DIR"
echo

# Check current status
echo "Checking current import status..."
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT co_no, COUNT(*) as parcels FROM florida_parcels GROUP BY co_no ORDER BY co_no;"

# Export functions for parallel execution
export -f process_county
export DB_HOST DB_PORT DB_USER DB_NAME DB_PASSWORD GDB_PATH WORK_DIR LOG_FILE

# Create county list file (all counties)
cat > "$WORK_DIR/counties.txt" <<EOF
11 ALACHUA
12 BAKER
13 BAY
14 BRADFORD
15 BREVARD
16 BROWARD
17 CALHOUN
19 CITRUS
20 CLAY
21 COLLIER
22 COLUMBIA
23 DESOTO
24 DIXIE
25 DUVAL
26 ESCAMBIA
27 FLAGLER
28 FRANKLIN
29 GADSDEN
30 GILCHRIST
31 GLADES
32 GULF
33 HAMILTON
34 HARDEE
35 HENDRY
36 HERNANDO
37 HIGHLANDS
38 HILLSBOROUGH
39 HOLMES
40 INDIAN RIVER
41 JACKSON
42 JEFFERSON
43 LAFAYETTE
44 LAKE
45 LEE
46 LEON
47 LEVY
48 LIBERTY
49 MADISON
50 MANATEE
51 MARION
52 MARTIN
53 MIAMI-DADE
54 MONROE
55 NASSAU
56 OKALOOSA
57 OKEECHOBEE
58 ORANGE
59 OSCEOLA
60 PALM BEACH
61 PASCO
62 PINELLAS
63 POLK
64 PUTNAM
65 ST. JOHNS
66 ST. LUCIE
67 SANTA ROSA
68 SARASOTA
69 SEMINOLE
70 SUMTER
71 SUWANNEE
72 TAYLOR
73 UNION
74 VOLUSIA
75 WAKULLA
76 WALTON
77 WASHINGTON
EOF

# Remove already imported counties from the list
IMPORTED_COUNTIES=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT DISTINCT co_no FROM florida_parcels WHERE co_no IS NOT NULL;" | xargs)
for county in $IMPORTED_COUNTIES; do
    sed -i.bak "/^$county /d" "$WORK_DIR/counties.txt"
done

REMAINING=$(wc -l < "$WORK_DIR/counties.txt" | xargs)
echo "Counties remaining to import: $REMAINING"
echo "Maximum parallel jobs: $MAX_PARALLEL"
echo

# Run parallel imports
if [ "$REMAINING" -gt 0 ]; then
    cat "$WORK_DIR/counties.txt" | xargs -n 2 -P "$MAX_PARALLEL" bash -c 'process_county "$@"' _
fi

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
echo
echo "Counties with data:"
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT co_no, COUNT(*) as parcels FROM florida_parcels GROUP BY co_no ORDER BY co_no;"
echo
echo "Log file: $LOG_FILE"
echo "Completed: $(date)"
