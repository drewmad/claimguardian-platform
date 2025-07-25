-- Add ALL missing columns to florida_parcels_staging table
-- This ensures the staging table can accept all columns from the CSV files

ALTER TABLE florida_parcels_staging
    -- Original columns that might be missing
    ADD COLUMN IF NOT EXISTS county_fips TEXT,
    ADD COLUMN IF NOT EXISTS file_t TEXT,
    ADD COLUMN IF NOT EXISTS bas_strt TEXT,
    ADD COLUMN IF NOT EXISTS atv_strt TEXT,
    ADD COLUMN IF NOT EXISTS grp_no TEXT,
    ADD COLUMN IF NOT EXISTS spass_cd TEXT,
    ADD COLUMN IF NOT EXISTS jv_chng TEXT,
    ADD COLUMN IF NOT EXISTS jv_chng_cd TEXT,
    ADD COLUMN IF NOT EXISTS jv_hmstd TEXT,
    ADD COLUMN IF NOT EXISTS av_hmstd TEXT,
    ADD COLUMN IF NOT EXISTS jv_non_hms TEXT,
    ADD COLUMN IF NOT EXISTS av_non_hms TEXT,
    ADD COLUMN IF NOT EXISTS jv_resd_no TEXT,
    ADD COLUMN IF NOT EXISTS av_resd_no TEXT,
    ADD COLUMN IF NOT EXISTS jv_class_u TEXT,
    ADD COLUMN IF NOT EXISTS av_class_u TEXT,
    ADD COLUMN IF NOT EXISTS jv_h2o_rec TEXT,
    ADD COLUMN IF NOT EXISTS av_h2o_rec TEXT,
    ADD COLUMN IF NOT EXISTS jv_consrv_ TEXT,
    ADD COLUMN IF NOT EXISTS av_consrv_ TEXT,
    ADD COLUMN IF NOT EXISTS jv_hist_co TEXT,
    ADD COLUMN IF NOT EXISTS av_hist_co TEXT,
    ADD COLUMN IF NOT EXISTS jv_hist_si TEXT,
    ADD COLUMN IF NOT EXISTS av_hist_si TEXT,
    ADD COLUMN IF NOT EXISTS jv_wrkng_w TEXT,
    ADD COLUMN IF NOT EXISTS av_wrkng_w TEXT,
    ADD COLUMN IF NOT EXISTS nconst_val TEXT,
    ADD COLUMN IF NOT EXISTS del_val TEXT,
    ADD COLUMN IF NOT EXISTS par_splt TEXT,
    ADD COLUMN IF NOT EXISTS distr_cd TEXT,
    ADD COLUMN IF NOT EXISTS distr_yr TEXT,
    ADD COLUMN IF NOT EXISTS lnd_val TEXT,
    ADD COLUMN IF NOT EXISTS lnd_unts_c TEXT,
    ADD COLUMN IF NOT EXISTS no_lnd_unt TEXT,
    ADD COLUMN IF NOT EXISTS lnd_sqfoot TEXT,
    ADD COLUMN IF NOT EXISTS dt_last_in TEXT,
    ADD COLUMN IF NOT EXISTS imp_qual TEXT,
    ADD COLUMN IF NOT EXISTS const_clas TEXT,
    ADD COLUMN IF NOT EXISTS spec_feat_ TEXT,
    ADD COLUMN IF NOT EXISTS m_par_sal1 TEXT,
    ADD COLUMN IF NOT EXISTS qual_cd1 TEXT,
    ADD COLUMN IF NOT EXISTS vi_cd1 TEXT,
    ADD COLUMN IF NOT EXISTS or_book1 TEXT,
    ADD COLUMN IF NOT EXISTS or_page1 TEXT,
    ADD COLUMN IF NOT EXISTS clerk_no1 TEXT,
    ADD COLUMN IF NOT EXISTS s_chng_cd1 TEXT,
    ADD COLUMN IF NOT EXISTS m_par_sal2 TEXT,
    ADD COLUMN IF NOT EXISTS qual_cd2 TEXT,
    ADD COLUMN IF NOT EXISTS vi_cd2 TEXT,
    ADD COLUMN IF NOT EXISTS or_book2 TEXT,
    ADD COLUMN IF NOT EXISTS or_page2 TEXT,
    ADD COLUMN IF NOT EXISTS clerk_no2 TEXT,
    ADD COLUMN IF NOT EXISTS s_chng_cd2 TEXT,
    ADD COLUMN IF NOT EXISTS own_state_ TEXT,
    ADD COLUMN IF NOT EXISTS fidu_name TEXT,
    ADD COLUMN IF NOT EXISTS fidu_addr1 TEXT,
    ADD COLUMN IF NOT EXISTS fidu_addr2 TEXT,
    ADD COLUMN IF NOT EXISTS fidu_city TEXT,
    ADD COLUMN IF NOT EXISTS fidu_state TEXT,
    ADD COLUMN IF NOT EXISTS fidu_zipcd TEXT,
    ADD COLUMN IF NOT EXISTS fidu_cd TEXT,
    ADD COLUMN IF NOT EXISTS app_stat TEXT,
    ADD COLUMN IF NOT EXISTS co_app_sta TEXT,
    ADD COLUMN IF NOT EXISTS public_lnd TEXT,
    ADD COLUMN IF NOT EXISTS tax_auth_c TEXT,
    ADD COLUMN IF NOT EXISTS alt_key TEXT,
    ADD COLUMN IF NOT EXISTS ass_trnsfr TEXT,
    ADD COLUMN IF NOT EXISTS prev_hmstd TEXT,
    ADD COLUMN IF NOT EXISTS ass_dif_tr TEXT,
    ADD COLUMN IF NOT EXISTS cono_prv_h TEXT,
    ADD COLUMN IF NOT EXISTS parcel_id_ TEXT,
    ADD COLUMN IF NOT EXISTS yr_val_trn TEXT,
    ADD COLUMN IF NOT EXISTS seq_no TEXT,
    ADD COLUMN IF NOT EXISTS rs_id TEXT,
    ADD COLUMN IF NOT EXISTS mp_id TEXT,
    ADD COLUMN IF NOT EXISTS state_par_ TEXT,
    ADD COLUMN IF NOT EXISTS spc_cir_cd TEXT,
    ADD COLUMN IF NOT EXISTS spc_cir_yr TEXT,
    ADD COLUMN IF NOT EXISTS spc_cir_tx TEXT,
    ADD COLUMN IF NOT EXISTS shape_length TEXT,
    ADD COLUMN IF NOT EXISTS shape_area TEXT,
    ADD COLUMN IF NOT EXISTS geometry_wkt TEXT;

-- Also ensure the CSV import view exists with all columns
DROP VIEW IF EXISTS florida_parcels_csv_import CASCADE;

CREATE VIEW florida_parcels_csv_import AS
SELECT * FROM florida_parcels_staging;

-- Grant permissions
GRANT ALL ON florida_parcels_staging TO authenticated;
GRANT ALL ON florida_parcels_csv_import TO authenticated;