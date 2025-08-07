#!/bin/bash

# Import large counties in batches to avoid timeouts
# Usage: ./import-large-county-batched.sh <county_code> <county_name>

COUNTY_CODE=$1
COUNTY_NAME=$2
BATCH_SIZE=50000  # Process 50k records at a time

if [ -z "$COUNTY_CODE" ] || [ -z "$COUNTY_NAME" ]; then
    echo "Usage: $0 <county_code> <county_name>"
    echo "Example: $0 16 BROWARD"
    exit 1
fi

# Configuration
DB_HOST="aws-0-us-east-2.pooler.supabase.com"
DB_PORT="6543"
DB_USER="postgres.tmlrvecuwgppbaynesji"
DB_NAME="postgres"

# Security: Use environment variable or secure prompt
DB_PASSWORD="${DB_PASSWORD:-}"
if [ -z "$DB_PASSWORD" ]; then
    echo "Database password required. Set DB_PASSWORD environment variable or enter now:"
    read -sp "Password: " DB_PASSWORD
    echo
fi

GDB_PATH="/Users/madengineering/ClaimGuardian/data/florida/Cadastral_Statewide.gdb"
WORK_DIR="/tmp/florida_parcels_import"

echo "=========================================="
echo "Importing $COUNTY_NAME County ($COUNTY_CODE) in batches"
echo "=========================================="

# Step 1: Extract county (if not already done)
CSV_FILE="$WORK_DIR/${COUNTY_NAME}_parcels.csv"
if [ ! -f "$CSV_FILE" ]; then
    echo "Extracting from GDB..."
    ogr2ogr -f CSV "$CSV_FILE" \
        "$GDB_PATH" \
        CADASTRAL_DOR \
        -where "CO_NO = $COUNTY_CODE" \
        -progress 2>&1 | grep -v "Warning" || true
fi

TOTAL_ROWS=$(wc -l < "$CSV_FILE")
echo "Total rows: $TOTAL_ROWS"

# Step 2: Extract required columns
COMPLETE_CSV="$WORK_DIR/${COUNTY_NAME}_complete.csv"
if [ ! -f "$COMPLETE_CSV" ]; then
    echo "Extracting required columns..."
    awk -F',' '
    NR==1 {
        print "co_no,parcel_id,file_t,asmnt_yr,bas_strt,atv_strt,grp_no,dor_uc,pa_uc,spass_cd,jv,jv_chng,jv_chng_cd,av_sd,av_nsd,tv_sd,tv_nsd,jv_hmstd,av_hmstd,jv_non_hms,lnd_val,imp_val,own_name,own_addr1,own_addr2,own_city,own_state,own_zipcd,phy_addr1,phy_addr2,phy_city,phy_zipcd,lnd_sqfoot,tot_lvg_ar,no_buldng,sale_prc1,sale_yr1,sale_mo1,or_book1,or_page1,clerk_no1,qual_cd1,sale_prc2,sale_yr2,sale_mo2,or_book2,or_page2,clerk_no2,qual_cd2,s_legal,twn,rng,sec"
    }
    NR>1 {
        printf "%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s\n",
            $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,
            $41,$42,$74,$75,$76,$77,$78,$79,$99,$100,$101,$102,$52,$49,$53,
            $57,$58,$59,$60,$61,$62,$55,$67,$68,$69,$70,$71,$72,$65,$87,$88,$89,$90
    }' "$CSV_FILE" > "$COMPLETE_CSV"
fi

# Step 3: Clean and deduplicate
CLEAN_CSV="$WORK_DIR/${COUNTY_NAME}_clean.csv"
if [ ! -f "$CLEAN_CSV" ]; then
    echo "Cleaning data..."
    awk -F',' -v OFS=',' '
    NR==1 { print; next }
    {
        # Clean each field
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
    }' "$COMPLETE_CSV" | awk -F',' '!seen[$2]++' > "$CLEAN_CSV"
fi

CLEAN_ROWS=$(wc -l < "$CLEAN_CSV")
echo "Clean rows: $CLEAN_ROWS"

# Step 4: Split into batches and import
echo "Splitting into batches of $BATCH_SIZE..."

# Get header
head -n 1 "$CLEAN_CSV" > "$WORK_DIR/header.csv"

# Split data (skip header)
tail -n +2 "$CLEAN_CSV" | split -l $BATCH_SIZE - "$WORK_DIR/${COUNTY_NAME}_batch_"

# Import each batch
BATCH_NUM=1
TOTAL_IMPORTED=0

for batch_file in "$WORK_DIR/${COUNTY_NAME}_batch_"*; do
    echo "Processing batch $BATCH_NUM..."

    # Add header to batch
    BATCH_WITH_HEADER="$batch_file.csv"
    cat "$WORK_DIR/header.csv" "$batch_file" > "$BATCH_WITH_HEADER"

    # Import batch
    echo "Importing batch $BATCH_NUM ($(wc -l < "$BATCH_WITH_HEADER") rows)..."
    PGPASSWORD="$DB_PASSWORD" psql \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        -c "\COPY florida_parcels(co_no,parcel_id,file_t,asmnt_yr,bas_strt,atv_strt,grp_no,dor_uc,pa_uc,spass_cd,jv,jv_chng,jv_chng_cd,av_sd,av_nsd,tv_sd,tv_nsd,jv_hmstd,av_hmstd,jv_non_hms,lnd_val,imp_val,own_name,own_addr1,own_addr2,own_city,own_state,own_zipcd,phy_addr1,phy_addr2,phy_city,phy_zipcd,lnd_sqfoot,tot_lvg_ar,no_buldng,sale_prc1,sale_yr1,sale_mo1,or_book1,or_page1,clerk_no1,qual_cd1,sale_prc2,sale_yr2,sale_mo2,or_book2,or_page2,clerk_no2,qual_cd2,s_legal,twn,rng,sec) FROM '$BATCH_WITH_HEADER' WITH (FORMAT csv, HEADER true);"

    # Clean up batch files
    rm -f "$batch_file" "$BATCH_WITH_HEADER"

    ((BATCH_NUM++))
done

# Verify total import
echo "Verifying import..."
IMPORTED=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM florida_parcels WHERE co_no = $COUNTY_CODE;" | xargs)
echo "✅ Successfully imported $IMPORTED parcels for $COUNTY_NAME County!"

# Cleanup
echo "Cleaning up temporary files..."
rm -f "$CSV_FILE" "$COMPLETE_CSV" "$CLEAN_CSV" "$WORK_DIR/header.csv"

echo "=========================================="
echo "$COUNTY_NAME County import complete!"
echo "=========================================="
