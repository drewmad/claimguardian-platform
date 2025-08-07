#!/bin/bash

echo "=========================================="
echo "COMPLETE Charlotte County Import"
echo "=========================================="

# Extract ALL available columns including sales data
echo "Creating comprehensive extract with sales data..."

awk -F',' '
BEGIN {
    # Define all column mappings
    cols["co_no"] = 1
    cols["parcel_id"] = 2
    cols["file_t"] = 3
    cols["asmnt_yr"] = 4
    cols["bas_strt"] = 5
    cols["atv_strt"] = 6
    cols["grp_no"] = 7
    cols["dor_uc"] = 8
    cols["pa_uc"] = 9
    cols["spass_cd"] = 10
    cols["jv"] = 11
    cols["jv_chng"] = 12
    cols["jv_chng_cd"] = 13
    cols["av_sd"] = 14
    cols["av_nsd"] = 15
    cols["tv_sd"] = 16
    cols["tv_nsd"] = 17
    cols["jv_hmstd"] = 18
    cols["av_hmstd"] = 19
    cols["jv_non_hms"] = 20
    cols["lnd_val"] = 41
    cols["imp_val"] = 42
    cols["own_name"] = 74
    cols["own_addr1"] = 75
    cols["own_addr2"] = 76
    cols["own_city"] = 77
    cols["own_state"] = 78
    cols["own_zipcd"] = 79
    cols["phy_addr1"] = 99
    cols["phy_addr2"] = 100
    cols["phy_city"] = 101
    cols["phy_zipcd"] = 102
    cols["lnd_sqfoot"] = 52
    cols["tot_lvg_ar"] = 49
    cols["no_buldng"] = 53
    cols["sale_prc1"] = 57
    cols["sale_yr1"] = 58
    cols["sale_mo1"] = 59
    cols["or_book1"] = 60
    cols["or_page1"] = 61
    cols["clerk_no1"] = 62
    cols["qual_cd1"] = 55
    cols["sale_prc2"] = 67
    cols["sale_yr2"] = 68
    cols["sale_mo2"] = 69
    cols["or_book2"] = 70
    cols["or_page2"] = 71
    cols["clerk_no2"] = 72
    cols["qual_cd2"] = 65
    cols["s_legal"] = 87
    cols["twn"] = 88
    cols["rng"] = 89
    cols["sec"] = 90
}
NR==1 {
    print "co_no,parcel_id,file_t,asmnt_yr,bas_strt,atv_strt,grp_no,dor_uc,pa_uc,spass_cd,jv,jv_chng,jv_chng_cd,av_sd,av_nsd,tv_sd,tv_nsd,jv_hmstd,av_hmstd,jv_non_hms,lnd_val,imp_val,own_name,own_addr1,own_addr2,own_city,own_state,own_zipcd,phy_addr1,phy_addr2,phy_city,phy_zipcd,lnd_sqfoot,tot_lvg_ar,no_buldng,sale_prc1,sale_yr1,sale_mo1,or_book1,or_page1,clerk_no1,qual_cd1,sale_prc2,sale_yr2,sale_mo2,or_book2,or_page2,clerk_no2,qual_cd2,s_legal,twn,rng,sec"
}
NR>1 {
    printf "%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s\n",
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,
        $41,$42,$74,$75,$76,$77,$78,$79,$99,$100,$101,$102,$52,$49,$53,
        $57,$58,$59,$60,$61,$62,$55,$67,$68,$69,$70,$71,$72,$65,$87,$88,$89,$90
}' /tmp/charlotte_parcels.csv > /tmp/charlotte_complete.csv

echo "Data prepared. Row count:"
wc -l /tmp/charlotte_complete.csv

echo
echo "Removing duplicates..."
# Sort by parcel_id and keep first occurrence
awk -F',' 'NR==1 || !seen[$2]++' /tmp/charlotte_complete.csv > /tmp/charlotte_unique.csv

echo "Unique rows:"
wc -l /tmp/charlotte_unique.csv

echo
echo "Ready to import! Use this command:"
echo
cat << 'EOF'
PGPASSWORD='Hotdam2025a' psql \
  -h db.tmlrvecuwgppbaynesji.supabase.co \
  -p 5432 \
  -U postgres \
  -d postgres \
  -c "\COPY florida_parcels(co_no,parcel_id,file_t,asmnt_yr,bas_strt,atv_strt,grp_no,dor_uc,pa_uc,spass_cd,jv,jv_chng,jv_chng_cd,av_sd,av_nsd,tv_sd,tv_nsd,jv_hmstd,av_hmstd,jv_non_hms,lnd_val,imp_val,own_name,own_addr1,own_addr2,own_city,own_state,own_zipcd,phy_addr1,phy_addr2,phy_city,phy_zipcd,lnd_sqfoot,tot_lvg_ar,no_buldng,sale_prc1,sale_yr1,sale_mo1,or_book1,or_page1,clerk_no1,qual_cd1,sale_prc2,sale_yr2,sale_mo2,or_book2,or_page2,clerk_no2,qual_cd2,s_legal,twn,rng,sec) FROM '/tmp/charlotte_unique.csv' WITH (FORMAT csv, HEADER true);"
EOF

echo
echo "This imports 53 columns of data including:"
echo "- Basic parcel info (ID, year, type)"
echo "- Values (JV, land, improvement, assessed)"
echo "- Owner information"
echo "- Physical address"
echo "- Property details (size, buildings)"
echo "- Sales history (2 sales with prices, dates, book/page)"
echo "- Legal description (section, township, range)"
