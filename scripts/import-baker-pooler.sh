#!/bin/bash

# Import Baker County using pooler connection (which worked for Charlotte)

echo "Starting Baker County import using pooler connection..."

# Clean the data first
echo "Cleaning Baker County data..."
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
        
        # Fix numeric fields - these columns should be numbers
        if ((i >= 11 && i <= 22) || (i >= 33 && i <= 38) || (i >= 43 && i <= 45)) {
            if ($i == "" || $i == " " || $i == "  " || $i == "NULL") {
                $i = "0"
            }
        }
    }
    print
}' /tmp/baker_complete.csv > /tmp/baker_clean_pooler.csv

# Remove duplicates
awk -F',' 'NR==1 || !seen[$2]++' /tmp/baker_clean_pooler.csv > /tmp/baker_final_pooler.csv

ROWS=$(wc -l < /tmp/baker_final_pooler.csv)
echo "Prepared $ROWS rows for import"

# Import using pooler connection
echo "Importing to database via pooler..."
PGPASSWORD='Hotdam2025a' psql \
    -h aws-0-us-east-2.pooler.supabase.com \
    -p 6543 \
    -U postgres.tmlrvecuwgppbaynesji \
    -d postgres \
    -c "\COPY florida_parcels(co_no,parcel_id,file_t,asmnt_yr,bas_strt,atv_strt,grp_no,dor_uc,pa_uc,spass_cd,jv,jv_chng,jv_chng_cd,av_sd,av_nsd,tv_sd,tv_nsd,jv_hmstd,av_hmstd,jv_non_hms,lnd_val,imp_val,own_name,own_addr1,own_addr2,own_city,own_state,own_zipcd,phy_addr1,phy_addr2,phy_city,phy_zipcd,lnd_sqfoot,tot_lvg_ar,no_buldng,sale_prc1,sale_yr1,sale_mo1,or_book1,or_page1,clerk_no1,qual_cd1,sale_prc2,sale_yr2,sale_mo2,or_book2,or_page2,clerk_no2,qual_cd2,s_legal,twn,rng,sec) FROM '/tmp/baker_final_pooler.csv' WITH (FORMAT csv, HEADER true);"

# Verify
echo "Verifying import..."
COUNT=$(PGPASSWORD='Hotdam2025a' psql -h aws-0-us-east-2.pooler.supabase.com -p 6543 -U postgres.tmlrvecuwgppbaynesji -d postgres -t -c "SELECT COUNT(*) FROM florida_parcels WHERE co_no = 12;" | xargs)
echo "✅ Baker County: $COUNT parcels imported"