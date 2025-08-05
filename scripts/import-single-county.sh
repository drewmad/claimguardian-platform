#!/bin/bash

# Import a single Florida county using the exact Charlotte County approach
# Usage: ./import-single-county.sh <county_code> <county_name>

COUNTY_CODE=$1
COUNTY_NAME=$2

if [ -z "$COUNTY_CODE" ] || [ -z "$COUNTY_NAME" ]; then
    echo "Usage: $0 <county_code> <county_name>"
    echo "Example: $0 12 BAKER"
    exit 1
fi

echo "=========================================="
echo "Importing $COUNTY_NAME County ($COUNTY_CODE)"
echo "=========================================="

# Step 1: Extract from GDB
echo "Step 1: Extracting from GDB..."
CSV_FILE="/tmp/${COUNTY_NAME,,}_parcels.csv"
ogr2ogr -f CSV "$CSV_FILE" \
    "/Users/madengineering/ClaimGuardian/data/florida/Cadastral_Statewide.gdb" \
    CADASTRAL_DOR \
    -where "CO_NO = $COUNTY_CODE" \
    -progress 2>&1 | grep -v "Warning" || true

if [ ! -f "$CSV_FILE" ]; then
    echo "ERROR: Failed to extract data"
    exit 1
fi

TOTAL_ROWS=$(wc -l < "$CSV_FILE")
echo "Extracted $TOTAL_ROWS rows"

# Step 2: Extract required columns using sed and awk (more robust)
echo "Step 2: Extracting required columns..."
COMPLETE_CSV="/tmp/${COUNTY_NAME,,}_complete.csv"

# First, create header
echo "co_no,parcel_id,file_t,asmnt_yr,bas_strt,atv_strt,grp_no,dor_uc,pa_uc,spass_cd,jv,jv_chng,jv_chng_cd,av_sd,av_nsd,tv_sd,tv_nsd,jv_hmstd,av_hmstd,jv_non_hms,lnd_val,imp_val,own_name,own_addr1,own_addr2,own_city,own_state,own_zipcd,phy_addr1,phy_addr2,phy_city,phy_zipcd,lnd_sqfoot,tot_lvg_ar,no_buldng,sale_prc1,sale_yr1,sale_mo1,or_book1,or_page1,clerk_no1,qual_cd1,sale_prc2,sale_yr2,sale_mo2,or_book2,or_page2,clerk_no2,qual_cd2,s_legal,twn,rng,sec" > "$COMPLETE_CSV"

# Process data rows
tail -n +2 "$CSV_FILE" | awk -F',' -v OFS=',' '{
    # Extract columns in the right order
    # Handle empty numeric fields by replacing with 0
    for (i = 1; i <= NF; i++) {
        gsub(/^[ \t]+|[ \t]+$/, "", $i)  # Trim spaces
    }
    
    # Numeric fields - replace empty with 0
    for (i in a) { a[i] = $i }
    if (a[11] == "" || a[11] == " ") a[11] = "0"  # jv
    if (a[12] == "" || a[12] == " ") a[12] = "0"  # jv_chng
    if (a[13] == "" || a[13] == " ") a[13] = "0"  # jv_chng_cd
    if (a[14] == "" || a[14] == " ") a[14] = "0"  # av_sd
    if (a[15] == "" || a[15] == " ") a[15] = "0"  # av_nsd
    if (a[16] == "" || a[16] == " ") a[16] = "0"  # tv_sd
    if (a[17] == "" || a[17] == " ") a[17] = "0"  # tv_nsd
    if (a[18] == "" || a[18] == " ") a[18] = "0"  # jv_hmstd
    if (a[19] == "" || a[19] == " ") a[19] = "0"  # av_hmstd
    if (a[20] == "" || a[20] == " ") a[20] = "0"  # jv_non_hms
    if (a[41] == "" || a[41] == " ") a[41] = "0"  # lnd_val
    if (a[42] == "" || a[42] == " ") a[42] = "0"  # imp_val
    if (a[52] == "" || a[52] == " ") a[52] = "0"  # lnd_sqfoot
    if (a[49] == "" || a[49] == " ") a[49] = "0"  # tot_lvg_ar
    if (a[53] == "" || a[53] == " ") a[53] = "0"  # no_buldng
    if (a[57] == "" || a[57] == " ") a[57] = "0"  # sale_prc1
    if (a[58] == "" || a[58] == " ") a[58] = "0"  # sale_yr1
    if (a[59] == "" || a[59] == " ") a[59] = "0"  # sale_mo1
    if (a[67] == "" || a[67] == " ") a[67] = "0"  # sale_prc2
    if (a[68] == "" || a[68] == " ") a[68] = "0"  # sale_yr2
    if (a[69] == "" || a[69] == " ") a[69] = "0"  # sale_mo2
    
    # Output in correct order
    print $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$41,$42,$74,$75,$76,$77,$78,$79,$99,$100,$101,$102,$52,$49,$53,$57,$58,$59,$60,$61,$62,$55,$67,$68,$69,$70,$71,$72,$65,$87,$88,$89,$90
}' | sed 's/ ,/0,/g' | sed 's/, /,0/g' | sed 's/  */ /g' >> "$COMPLETE_CSV"

COMPLETE_ROWS=$(wc -l < "$COMPLETE_CSV")
echo "Complete CSV has $COMPLETE_ROWS rows"

# Step 3: Remove duplicates
echo "Step 3: Removing duplicates..."
UNIQUE_CSV="/tmp/${COUNTY_NAME,,}_unique.csv"
awk -F',' 'NR==1 || !seen[$2]++' "$COMPLETE_CSV" > "$UNIQUE_CSV"

UNIQUE_ROWS=$(wc -l < "$UNIQUE_CSV")
echo "Unique parcels: $((UNIQUE_ROWS - 1))"

# Step 4: Final cleaning pass - ensure no empty numeric fields
echo "Step 4: Final data cleaning..."
FINAL_CSV="/tmp/${COUNTY_NAME,,}_final.csv"
awk -F',' -v OFS=',' '
NR==1 { print; next }
{
    # Clean numeric fields one more time
    for (i = 11; i <= 22; i++) if ($i == "" || $i == " ") $i = "0"
    for (i = 33; i <= 38; i++) if ($i == "" || $i == " ") $i = "0"
    for (i = 43; i <= 45; i++) if ($i == "" || $i == " ") $i = "0"
    print
}' "$UNIQUE_CSV" > "$FINAL_CSV"

# Step 5: Import to database
echo "Step 5: Importing to database..."
PGPASSWORD='Hotdam2025a' psql \
    -h db.tmlrvecuwgppbaynesji.supabase.co \
    -p 5432 \
    -U postgres \
    -d postgres \
    -c "\COPY florida_parcels(co_no,parcel_id,file_t,asmnt_yr,bas_strt,atv_strt,grp_no,dor_uc,pa_uc,spass_cd,jv,jv_chng,jv_chng_cd,av_sd,av_nsd,tv_sd,tv_nsd,jv_hmstd,av_hmstd,jv_non_hms,lnd_val,imp_val,own_name,own_addr1,own_addr2,own_city,own_state,own_zipcd,phy_addr1,phy_addr2,phy_city,phy_zipcd,lnd_sqfoot,tot_lvg_ar,no_buldng,sale_prc1,sale_yr1,sale_mo1,or_book1,or_page1,clerk_no1,qual_cd1,sale_prc2,sale_yr2,sale_mo2,or_book2,or_page2,clerk_no2,qual_cd2,s_legal,twn,rng,sec) FROM '$FINAL_CSV' WITH (FORMAT csv, HEADER true);"

# Step 6: Verify
echo "Step 6: Verifying import..."
IMPORTED=$(PGPASSWORD='Hotdam2025a' psql -h db.tmlrvecuwgppbaynesji.supabase.co -p 5432 -U postgres -d postgres -t -c "SELECT COUNT(*) FROM florida_parcels WHERE co_no = $COUNTY_CODE;" | xargs)
echo "✅ Successfully imported $IMPORTED parcels for $COUNTY_NAME County!"

# Cleanup
rm -f "$CSV_FILE" "$COMPLETE_CSV" "$UNIQUE_CSV" "$FINAL_CSV"

echo "=========================================="
echo "$COUNTY_NAME County import complete!"
echo "==========================================