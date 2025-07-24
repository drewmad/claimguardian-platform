-- Add UPPERCASE column aliases to florida_parcels table
-- =====================================================
-- This creates a view that maps uppercase column names to lowercase columns
-- allowing CSV imports with uppercase headers to work directly

-- Drop the view if it exists
DROP VIEW IF EXISTS florida_parcels_uppercase CASCADE;

-- Create a view with UPPERCASE column names that maps to lowercase columns
CREATE VIEW florida_parcels_uppercase AS
SELECT 
    co_no as "CO_NO",
    parcel_id as "PARCEL_ID",
    file_t as "FILE_T",
    asmnt_yr as "ASMNT_YR",
    bas_strt as "BAS_STRT",
    atv_strt as "ATV_STRT",
    grp_no as "GRP_NO",
    dor_uc as "DOR_UC",
    pa_uc as "PA_UC",
    spass_cd as "SPASS_CD",
    jv as "JV",
    jv_chng as "JV_CHNG",
    jv_chng_cd as "JV_CHNG_CD",
    av_sd as "AV_SD",
    av_nsd as "AV_NSD",
    tv_sd as "TV_SD",
    tv_nsd as "TV_NSD",
    jv_hmstd as "JV_HMSTD",
    av_hmstd as "AV_HMSTD",
    jv_non_hms as "JV_NON_HMS",
    av_non_hms as "AV_NON_HMS",
    jv_resd_no as "JV_RESD_NO",
    av_resd_no as "AV_RESD_NO",
    jv_class_u as "JV_CLASS_U",
    av_class_u as "AV_CLASS_U",
    jv_h2o_rec as "JV_H2O_REC",
    av_h2o_rec as "AV_H2O_REC",
    jv_consrv_ as "JV_CONSRV_",
    av_consrv_ as "AV_CONSRV_",
    jv_hist_co as "JV_HIST_CO",
    av_hist_co as "AV_HIST_CO",
    jv_hist_si as "JV_HIST_SI",
    av_hist_si as "AV_HIST_SI",
    jv_wrkng_w as "JV_WRKNG_W",
    av_wrkng_w as "AV_WRKNG_W",
    nconst_val as "NCONST_VAL",
    del_val as "DEL_VAL",
    par_splt as "PAR_SPLT",
    distr_cd as "DISTR_CD",
    distr_yr as "DISTR_YR",
    lnd_val as "LND_VAL",
    lnd_unts_c as "LND_UNTS_C",
    no_lnd_unt as "NO_LND_UNT",
    lnd_sqfoot as "LND_SQFOOT",
    dt_last_in as "DT_LAST_IN",
    imp_qual as "IMP_QUAL",
    const_clas as "CONST_CLAS",
    eff_yr_blt as "EFF_YR_BLT",
    act_yr_blt as "ACT_YR_BLT",
    tot_lvg_ar as "TOT_LVG_AR",
    no_buldng as "NO_BULDNG",
    no_res_unt as "NO_RES_UNT",
    spec_feat_ as "SPEC_FEAT_",
    m_par_sal1 as "M_PAR_SAL1",
    qual_cd1 as "QUAL_CD1",
    vi_cd1 as "VI_CD1",
    sale_prc1 as "SALE_PRC1",
    sale_yr1 as "SALE_YR1",
    sale_mo1 as "SALE_MO1",
    or_book1 as "OR_BOOK1",
    or_page1 as "OR_PAGE1",
    clerk_no1 as "CLERK_NO1",
    s_chng_cd1 as "S_CHNG_CD1",
    m_par_sal2 as "M_PAR_SAL2",
    qual_cd2 as "QUAL_CD2",
    vi_cd2 as "VI_CD2",
    sale_prc2 as "SALE_PRC2",
    sale_yr2 as "SALE_YR2",
    sale_mo2 as "SALE_MO2",
    or_book2 as "OR_BOOK2",
    or_page2 as "OR_PAGE2",
    clerk_no2 as "CLERK_NO2",
    s_chng_cd2 as "S_CHNG_CD2",
    own_name as "OWN_NAME",
    own_addr1 as "OWN_ADDR1",
    own_addr2 as "OWN_ADDR2",
    own_city as "OWN_CITY",
    own_state as "OWN_STATE",
    own_zipcd as "OWN_ZIPCD",
    own_state_ as "OWN_STATE_",
    fidu_name as "FIDU_NAME",
    fidu_addr1 as "FIDU_ADDR1",
    fidu_addr2 as "FIDU_ADDR2",
    fidu_city as "FIDU_CITY",
    fidu_state as "FIDU_STATE",
    fidu_zipcd as "FIDU_ZIPCD",
    fidu_cd as "FIDU_CD",
    s_legal as "S_LEGAL",
    app_stat as "APP_STAT",
    co_app_sta as "CO_APP_STA",
    mkt_ar as "MKT_AR",
    nbrhd_cd as "NBRHD_CD",
    public_lnd as "PUBLIC_LND",
    tax_auth_c as "TAX_AUTH_C",
    twn as "TWN",
    rng as "RNG",
    sec as "SEC",
    census_bk as "CENSUS_BK",
    phy_addr1 as "PHY_ADDR1",
    phy_addr2 as "PHY_ADDR2",
    phy_city as "PHY_CITY",
    phy_zipcd as "PHY_ZIPCD",
    alt_key as "ALT_KEY",
    ass_trnsfr as "ASS_TRNSFR",
    prev_hmstd as "PREV_HMSTD",
    ass_dif_tr as "ASS_DIF_TR",
    cono_prv_h as "CONO_PRV_H",
    parcel_id_ as "PARCEL_ID_",
    yr_val_trn as "YR_VAL_TRN",
    seq_no as "SEQ_NO",
    rs_id as "RS_ID",
    mp_id as "MP_ID",
    state_par_ as "STATE_PAR_",
    spc_cir_cd as "SPC_CIR_CD",
    spc_cir_yr as "SPC_CIR_YR",
    spc_cir_tx as "SPC_CIR_TX",
    shape_length as "Shape_Length",
    shape_area as "Shape_Area",
    geometry_wkt,
    county_fips,
    county_id,
    id,
    created_at,
    updated_at
FROM florida_parcels;

-- Create INSTEAD OF trigger to handle inserts through the view
CREATE OR REPLACE FUNCTION insert_florida_parcels_uppercase()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO florida_parcels (
        co_no, parcel_id, file_t, asmnt_yr, bas_strt, atv_strt,
        grp_no, dor_uc, pa_uc, spass_cd, jv, jv_chng, jv_chng_cd,
        av_sd, av_nsd, tv_sd, tv_nsd, jv_hmstd, av_hmstd, jv_non_hms,
        av_non_hms, jv_resd_no, av_resd_no, jv_class_u, av_class_u,
        jv_h2o_rec, av_h2o_rec, jv_consrv_, av_consrv_, jv_hist_co,
        av_hist_co, jv_hist_si, av_hist_si, jv_wrkng_w, av_wrkng_w,
        nconst_val, del_val, par_splt, distr_cd, distr_yr, lnd_val,
        lnd_unts_c, no_lnd_unt, lnd_sqfoot, dt_last_in, imp_qual,
        const_clas, eff_yr_blt, act_yr_blt, tot_lvg_ar, no_buldng,
        no_res_unt, spec_feat_, m_par_sal1, qual_cd1, vi_cd1,
        sale_prc1, sale_yr1, sale_mo1, or_book1, or_page1, clerk_no1,
        s_chng_cd1, m_par_sal2, qual_cd2, vi_cd2, sale_prc2, sale_yr2,
        sale_mo2, or_book2, or_page2, clerk_no2, s_chng_cd2, own_name,
        own_addr1, own_addr2, own_city, own_state, own_zipcd, own_state_,
        fidu_name, fidu_addr1, fidu_addr2, fidu_city, fidu_state,
        fidu_zipcd, fidu_cd, s_legal, app_stat, co_app_sta, mkt_ar,
        nbrhd_cd, public_lnd, tax_auth_c, twn, rng, sec, census_bk,
        phy_addr1, phy_addr2, phy_city, phy_zipcd, alt_key, ass_trnsfr,
        prev_hmstd, ass_dif_tr, cono_prv_h, parcel_id_, yr_val_trn,
        seq_no, rs_id, mp_id, state_par_, spc_cir_cd, spc_cir_yr,
        spc_cir_tx, shape_length, shape_area, geometry_wkt,
        county_fips
    ) VALUES (
        NEW."CO_NO", NEW."PARCEL_ID", NEW."FILE_T", NEW."ASMNT_YR", NEW."BAS_STRT", NEW."ATV_STRT",
        NEW."GRP_NO", NEW."DOR_UC", NEW."PA_UC", NEW."SPASS_CD", NEW."JV", NEW."JV_CHNG", NEW."JV_CHNG_CD",
        NEW."AV_SD", NEW."AV_NSD", NEW."TV_SD", NEW."TV_NSD", NEW."JV_HMSTD", NEW."AV_HMSTD", NEW."JV_NON_HMS",
        NEW."AV_NON_HMS", NEW."JV_RESD_NO", NEW."AV_RESD_NO", NEW."JV_CLASS_U", NEW."AV_CLASS_U",
        NEW."JV_H2O_REC", NEW."AV_H2O_REC", NEW."JV_CONSRV_", NEW."AV_CONSRV_", NEW."JV_HIST_CO",
        NEW."AV_HIST_CO", NEW."JV_HIST_SI", NEW."AV_HIST_SI", NEW."JV_WRKNG_W", NEW."AV_WRKNG_W",
        NEW."NCONST_VAL", NEW."DEL_VAL", NEW."PAR_SPLT", NEW."DISTR_CD", NEW."DISTR_YR", NEW."LND_VAL",
        NEW."LND_UNTS_C", NEW."NO_LND_UNT", NEW."LND_SQFOOT", NEW."DT_LAST_IN", NEW."IMP_QUAL",
        NEW."CONST_CLAS", NEW."EFF_YR_BLT", NEW."ACT_YR_BLT", NEW."TOT_LVG_AR", NEW."NO_BULDNG",
        NEW."NO_RES_UNT", NEW."SPEC_FEAT_", NEW."M_PAR_SAL1", NEW."QUAL_CD1", NEW."VI_CD1",
        NEW."SALE_PRC1", NEW."SALE_YR1", NEW."SALE_MO1", NEW."OR_BOOK1", NEW."OR_PAGE1", NEW."CLERK_NO1",
        NEW."S_CHNG_CD1", NEW."M_PAR_SAL2", NEW."QUAL_CD2", NEW."VI_CD2", NEW."SALE_PRC2", NEW."SALE_YR2",
        NEW."SALE_MO2", NEW."OR_BOOK2", NEW."OR_PAGE2", NEW."CLERK_NO2", NEW."S_CHNG_CD2", NEW."OWN_NAME",
        NEW."OWN_ADDR1", NEW."OWN_ADDR2", NEW."OWN_CITY", NEW."OWN_STATE", NEW."OWN_ZIPCD", NEW."OWN_STATE_",
        NEW."FIDU_NAME", NEW."FIDU_ADDR1", NEW."FIDU_ADDR2", NEW."FIDU_CITY", NEW."FIDU_STATE",
        NEW."FIDU_ZIPCD", NEW."FIDU_CD", NEW."S_LEGAL", NEW."APP_STAT", NEW."CO_APP_STA", NEW."MKT_AR",
        NEW."NBRHD_CD", NEW."PUBLIC_LND", NEW."TAX_AUTH_C", NEW."TWN", NEW."RNG", NEW."SEC", NEW."CENSUS_BK",
        NEW."PHY_ADDR1", NEW."PHY_ADDR2", NEW."PHY_CITY", NEW."PHY_ZIPCD", NEW."ALT_KEY", NEW."ASS_TRNSFR",
        NEW."PREV_HMSTD", NEW."ASS_DIF_TR", NEW."CONO_PRV_H", NEW."PARCEL_ID_", NEW."YR_VAL_TRN",
        NEW."SEQ_NO", NEW."RS_ID", NEW."MP_ID", NEW."STATE_PAR_", NEW."SPC_CIR_CD", NEW."SPC_CIR_YR",
        NEW."SPC_CIR_TX", NEW."Shape_Length", NEW."Shape_Area", NEW.geometry_wkt,
        -- Derive county_fips from CO_NO if not provided
        CASE 
            WHEN NEW.county_fips IS NOT NULL THEN NEW.county_fips
            WHEN NEW."CO_NO" IS NOT NULL AND NEW."CO_NO" >= 1 AND NEW."CO_NO" <= 67 
            THEN 12000 + (NEW."CO_NO"::INTEGER * 2) - 1
            ELSE NULL
        END
    )
    ON CONFLICT (parcel_id) DO UPDATE SET
        co_no = EXCLUDED.co_no,
        county_fips = EXCLUDED.county_fips,
        jv = EXCLUDED.jv,
        lnd_val = EXCLUDED.lnd_val,
        own_name = EXCLUDED.own_name,
        phy_addr1 = EXCLUDED.phy_addr1,
        updated_at = NOW()
    RETURNING *;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for insert operations on the view
CREATE TRIGGER insert_uppercase_parcels
INSTEAD OF INSERT ON florida_parcels_uppercase
FOR EACH ROW
EXECUTE FUNCTION insert_florida_parcels_uppercase();

-- Grant permissions on the view
GRANT SELECT, INSERT ON florida_parcels_uppercase TO anon, authenticated;

-- Add comment
COMMENT ON VIEW florida_parcels_uppercase IS 'View with UPPERCASE column names for CSV import compatibility. Import your CSV files to this view instead of the main table.';