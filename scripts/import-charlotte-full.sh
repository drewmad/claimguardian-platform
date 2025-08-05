#!/bin/bash

echo "=========================================="
echo "FULL Charlotte County Import with ALL Data"
echo "=========================================="

# First, let me check which columns in CSV match our database
echo "Analyzing CSV columns..."

# Get CSV headers
CSV_HEADERS=$(head -n 1 /tmp/charlotte_parcels.csv)

# Create mapping file
cat > /tmp/column_mapping.txt << 'EOF'
CSV_COL,DB_COL,CSV_POS
CO_NO,co_no,1
PARCEL_ID,parcel_id,2
FILE_T,file_t,3
ASMNT_YR,asmnt_yr,4
BAS_STRT,bas_strt,5
ATV_STRT,atv_strt,6
GRP_NO,grp_no,7
DOR_UC,dor_uc,8
PA_UC,pa_uc,9
SPASS_CD,spass_cd,10
JV,jv,11
JV_CHNG,jv_chng,12
JV_CHNG_CD,jv_chng_cd,13
AV_SD,av_sd,14
AV_NSD,av_nsd,15
TV_SD,tv_sd,16
TV_NSD,tv_nsd,17
JV_HMSTD,jv_hmstd,18
AV_HMSTD,av_hmstd,19
JV_NON_HMS,jv_non_hms,20
LND_VAL,lnd_val,41
IMP_VAL,imp_val,42
OWN_NAME,own_name,74
OWN_ADDR1,own_addr1,75
OWN_ADDR2,own_addr2,76
OWN_CITY,own_city,77
OWN_STATE,own_state,78
OWN_ZIPCD,own_zipcd,79
OWN_STATE_,own_state_,80
PHY_ADDR1,phy_addr1,99
PHY_ADDR2,phy_addr2,100
PHY_CITY,phy_city,101
PHY_ZIPCD,phy_zipcd,102
LND_SQFOOT,lnd_sqfoot,52
TOT_LVG_AR,tot_lvg_ar,49
NO_BULDNG,no_buldng,53
EFF_YR_BLT,eff_yr_blt,109
ACT_YR_BLT,act_yr_blt,110
S_LEGAL,s_legal,87
TWN,twn,88
RNG,rng,89
SEC,sec,90
EOF

echo "Creating comprehensive CSV extract..."

# Build awk command to extract all matching columns
awk -F',' '
BEGIN {
    # Column positions
    cols[1] = 1    # CO_NO
    cols[2] = 2    # PARCEL_ID
    cols[3] = 3    # FILE_T
    cols[4] = 4    # ASMNT_YR
    cols[5] = 5    # BAS_STRT
    cols[6] = 6    # ATV_STRT
    cols[7] = 7    # GRP_NO
    cols[8] = 8    # DOR_UC
    cols[9] = 9    # PA_UC
    cols[10] = 10  # SPASS_CD
    cols[11] = 11  # JV
    cols[12] = 12  # JV_CHNG
    cols[13] = 13  # JV_CHNG_CD
    cols[14] = 14  # AV_SD
    cols[15] = 15  # AV_NSD
    cols[16] = 16  # TV_SD
    cols[17] = 17  # TV_NSD
    cols[18] = 18  # JV_HMSTD
    cols[19] = 19  # AV_HMSTD
    cols[20] = 20  # JV_NON_HMS
    cols[21] = 41  # LND_VAL
    cols[22] = 42  # IMP_VAL
    cols[23] = 74  # OWN_NAME
    cols[24] = 75  # OWN_ADDR1
    cols[25] = 76  # OWN_ADDR2
    cols[26] = 77  # OWN_CITY
    cols[27] = 78  # OWN_STATE
    cols[28] = 79  # OWN_ZIPCD
    cols[29] = 99  # PHY_ADDR1
    cols[30] = 100 # PHY_ADDR2
    cols[31] = 101 # PHY_CITY
    cols[32] = 102 # PHY_ZIPCD
    cols[33] = 52  # LND_SQFOOT
    cols[34] = 49  # TOT_LVG_AR
    cols[35] = 53  # NO_BULDNG
}
NR==1 {
    print "co_no,parcel_id,file_t,asmnt_yr,bas_strt,atv_strt,grp_no,dor_uc,pa_uc,spass_cd,jv,jv_chng,jv_chng_cd,av_sd,av_nsd,tv_sd,tv_nsd,jv_hmstd,av_hmstd,jv_non_hms,lnd_val,imp_val,own_name,own_addr1,own_addr2,own_city,own_state,own_zipcd,phy_addr1,phy_addr2,phy_city,phy_zipcd,lnd_sqfoot,tot_lvg_ar,no_buldng"
}
NR>1 {
    output = ""
    for (i=1; i<=35; i++) {
        if (i > 1) output = output ","
        output = output $cols[i]
    }
    print output
}' /tmp/charlotte_parcels.csv > /tmp/charlotte_full.csv

echo "Sample of extracted data:"
head -n 3 /tmp/charlotte_full.csv

echo
echo "Row count:"
wc -l /tmp/charlotte_full.csv

echo
echo "Now import using:"
echo "1. Direct COPY command with the database password"
echo "2. Or use Supabase Dashboard CSV import"
echo
echo "COPY command:"
cat << 'COPYCOMMAND'
PGPASSWORD='Hotdam2025a' psql \
  -h db.tmlrvecuwgppbaynesji.supabase.co \
  -p 5432 \
  -U postgres \
  -d postgres \
  -c "\COPY florida_parcels(co_no,parcel_id,file_t,asmnt_yr,bas_strt,atv_strt,grp_no,dor_uc,pa_uc,spass_cd,jv,jv_chng,jv_chng_cd,av_sd,av_nsd,tv_sd,tv_nsd,jv_hmstd,av_hmstd,jv_non_hms,lnd_val,imp_val,own_name,own_addr1,own_addr2,own_city,own_state,own_zipcd,phy_addr1,phy_addr2,phy_city,phy_zipcd,lnd_sqfoot,tot_lvg_ar,no_buldng) FROM '/tmp/charlotte_full.csv' WITH (FORMAT csv, HEADER true);"
COPYCOMMAND