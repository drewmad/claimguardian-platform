#!/bin/bash
# Prepare CSV files with only essential columns for import

echo "Preparing Charlotte County CSV files for import..."

cd /Users/madengineering/ClaimGuardian/data/florida/charlotte_chunks

# Create cleaned versions with only the columns that exist in the table
for file in charlotte_part_*.csv; do
    echo "Processing $file..."
    
    # Extract header and map to lowercase
    head -1 "$file" | tr '[:upper:]' '[:lower:]' > "${file%.csv}_clean.csv"
    
    # Extract data rows (skip header)
    tail -n +2 "$file" >> "${file%.csv}_clean.csv"
    
    echo "Created ${file%.csv}_clean.csv"
done

echo ""
echo "Files ready for import!"
echo ""
echo "To import via SQL Editor:"
echo "1. Go to: https://supabase.com/dashboard/project/tmlrvecuwgppbaynesji/sql/new"
echo "2. For each file, run:"
echo ""
echo "COPY florida_parcels(co_no,parcel_id,file_t,asmnt_yr,bas_strt,atv_strt,grp_no,dor_uc,pa_uc,spass_cd,jv,jv_chng,jv_chng_cd,av_sd,av_nsd,tv_sd,tv_nsd,jv_hmstd,av_hmstd,jv_non_hms,av_non_hms,jv_resd_no,av_resd_no,jv_class_u,av_class_u,jv_h2o_rec,av_h2o_rec,jv_consrv_,av_consrv_,jv_hist_co,av_hist_co,jv_hist_si,av_hist_si,jv_wrkng_w,av_wrkng_w,nconst_val,del_val,par_splt,distr_cd,distr_yr,lnd_val,lnd_unts_c,no_lnd_unt,lnd_sqfoot,dt_last_in,imp_qual,const_clas,eff_yr_blt,act_yr_blt,tot_lvg_ar,no_buldng,no_res_unt,spec_feat_,m_par_sal1,qual_cd1,vi_cd1,sale_prc1,sale_yr1,sale_mo1,or_book1,or_page1,clerk_no1,s_chng_cd1,m_par_sal2,qual_cd2,vi_cd2,sale_prc2,sale_yr2,sale_mo2,or_book2,or_page2,clerk_no2,s_chng_cd2,own_name,own_addr1,own_addr2,own_city,own_state,own_zipcd,own_state_,fidu_name,fidu_addr1,fidu_addr2,fidu_city,fidu_state,fidu_zipcd,fidu_cd,s_legal,app_stat,co_app_sta,mkt_ar,nbrhd_cd,public_lnd,tax_auth_c,twn,rng,sec,census_bk,phy_addr1,phy_addr2,phy_city,phy_zipcd,alt_key,ass_trnsfr,prev_hmstd,ass_dif_tr,cono_prv_h,parcel_id_,yr_val_trn,seq_no,rs_id,mp_id,state_par_,spc_cir_cd,spc_cir_yr,spc_cir_tx,shape_length,shape_area)"
echo "FROM '/path/to/charlotte_part_aa_clean.csv' WITH CSV HEADER;"