-- Prepare Florida Parcels Table for CSV Import
-- ============================================
-- This SQL helps you import CSV files with uppercase headers

-- Option 1: Create a temporary import table with uppercase columns
-- ================================================================

-- Drop temporary table if exists
DROP TABLE IF EXISTS florida_parcels_import_temp;

-- Create temporary table with UPPERCASE column names matching your CSV
CREATE TABLE florida_parcels_import_temp (
    CO_NO FLOAT,
    PARCEL_ID VARCHAR(50),
    FILE_T VARCHAR(10),
    ASMNT_YR FLOAT,
    BAS_STRT VARCHAR(10),
    ATV_STRT VARCHAR(10),
    GRP_NO FLOAT,
    DOR_UC VARCHAR(10),
    PA_UC VARCHAR(10),
    SPASS_CD VARCHAR(10),
    JV FLOAT,
    JV_CHNG FLOAT,
    JV_CHNG_CD FLOAT,
    AV_SD FLOAT,
    AV_NSD FLOAT,
    TV_SD FLOAT,
    TV_NSD FLOAT,
    JV_HMSTD FLOAT,
    AV_HMSTD FLOAT,
    JV_NON_HMS FLOAT,
    AV_NON_HMS FLOAT,
    JV_RESD_NO FLOAT,
    AV_RESD_NO FLOAT,
    JV_CLASS_U FLOAT,
    AV_CLASS_U FLOAT,
    JV_H2O_REC FLOAT,
    AV_H2O_REC FLOAT,
    JV_CONSRV_ FLOAT,
    AV_CONSRV_ FLOAT,
    JV_HIST_CO FLOAT,
    AV_HIST_CO FLOAT,
    JV_HIST_SI FLOAT,
    AV_HIST_SI FLOAT,
    JV_WRKNG_W FLOAT,
    AV_WRKNG_W FLOAT,
    NCONST_VAL FLOAT,
    DEL_VAL FLOAT,
    PAR_SPLT FLOAT,
    DISTR_CD VARCHAR(10),
    DISTR_YR FLOAT,
    LND_VAL FLOAT,
    LND_UNTS_C FLOAT,
    NO_LND_UNT FLOAT,
    LND_SQFOOT FLOAT,
    DT_LAST_IN FLOAT,
    IMP_QUAL FLOAT,
    CONST_CLAS FLOAT,
    EFF_YR_BLT FLOAT,
    ACT_YR_BLT FLOAT,
    TOT_LVG_AR FLOAT,
    NO_BULDNG FLOAT,
    NO_RES_UNT FLOAT,
    SPEC_FEAT_ FLOAT,
    M_PAR_SAL1 VARCHAR(50),
    QUAL_CD1 VARCHAR(10),
    VI_CD1 VARCHAR(10),
    SALE_PRC1 FLOAT,
    SALE_YR1 FLOAT,
    SALE_MO1 FLOAT,
    OR_BOOK1 VARCHAR(20),
    OR_PAGE1 VARCHAR(20),
    CLERK_NO1 VARCHAR(20),
    S_CHNG_CD1 VARCHAR(10),
    M_PAR_SAL2 VARCHAR(50),
    QUAL_CD2 VARCHAR(10),
    VI_CD2 VARCHAR(10),
    SALE_PRC2 FLOAT,
    SALE_YR2 FLOAT,
    SALE_MO2 FLOAT,
    OR_BOOK2 VARCHAR(20),
    OR_PAGE2 VARCHAR(20),
    CLERK_NO2 VARCHAR(20),
    S_CHNG_CD2 VARCHAR(10),
    OWN_NAME TEXT,
    OWN_ADDR1 TEXT,
    OWN_ADDR2 TEXT,
    OWN_CITY VARCHAR(100),
    OWN_STATE VARCHAR(10),
    OWN_ZIPCD FLOAT,
    OWN_STATE_ VARCHAR(10),
    FIDU_NAME TEXT,
    FIDU_ADDR1 TEXT,
    FIDU_ADDR2 TEXT,
    FIDU_CITY VARCHAR(100),
    FIDU_STATE VARCHAR(10),
    FIDU_ZIPCD FLOAT,
    FIDU_CD FLOAT,
    S_LEGAL TEXT,
    APP_STAT VARCHAR(50),
    CO_APP_STA VARCHAR(50),
    MKT_AR VARCHAR(50),
    NBRHD_CD VARCHAR(50),
    PUBLIC_LND VARCHAR(50),
    TAX_AUTH_C VARCHAR(50),
    TWN VARCHAR(10),
    RNG VARCHAR(10),
    SEC FLOAT,
    CENSUS_BK VARCHAR(50),
    PHY_ADDR1 TEXT,
    PHY_ADDR2 TEXT,
    PHY_CITY VARCHAR(100),
    PHY_ZIPCD FLOAT,
    ALT_KEY VARCHAR(100),
    ASS_TRNSFR VARCHAR(50),
    PREV_HMSTD FLOAT,
    ASS_DIF_TR FLOAT,
    CONO_PRV_H FLOAT,
    PARCEL_ID_ VARCHAR(50),
    YR_VAL_TRN FLOAT,
    SEQ_NO FLOAT,
    RS_ID VARCHAR(50),
    MP_ID VARCHAR(50),
    STATE_PAR_ VARCHAR(50),
    SPC_CIR_CD FLOAT,
    SPC_CIR_YR FLOAT,
    SPC_CIR_TX VARCHAR(50),
    Shape_Length FLOAT,
    Shape_Area FLOAT,
    geometry_wkt TEXT
);

-- After importing your CSV into florida_parcels_import_temp,
-- transfer the data to the main table with this query:

-- Function to derive county_fips from CO_NO
CREATE OR REPLACE FUNCTION derive_county_fips(co_no FLOAT)
RETURNS INTEGER AS $$
BEGIN
    IF co_no IS NULL OR co_no < 1 OR co_no > 67 THEN
        RETURN NULL;
    END IF;
    -- Florida FIPS codes: 12001 to 12133 (odd numbers only)
    -- CO_NO appears to be county number 1-67
    RETURN 12000 + (co_no::INTEGER * 2) - 1;
END;
$$ LANGUAGE plpgsql;

-- Transfer data from temp table to main table
-- This query maps UPPERCASE columns to lowercase columns
CREATE OR REPLACE FUNCTION import_parcels_from_temp(batch_size INTEGER DEFAULT 1000)
RETURNS TABLE (
    total_imported INTEGER,
    duplicates_updated INTEGER,
    errors INTEGER
) AS $$
DECLARE
    v_total_imported INTEGER := 0;
    v_duplicates INTEGER := 0;
    v_errors INTEGER := 0;
    v_batch_count INTEGER;
BEGIN
    -- Process in batches
    LOOP
        -- Insert batch with ON CONFLICT handling
        WITH batch AS (
            SELECT * FROM florida_parcels_import_temp
            WHERE PARCEL_ID IS NOT NULL
            LIMIT batch_size
        ),
        inserted AS (
            INSERT INTO florida_parcels (
                county_fips, co_no, parcel_id, file_t, asmnt_yr, bas_strt, atv_strt,
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
                spc_cir_tx, shape_length, shape_area, geometry_wkt
            )
            SELECT 
                derive_county_fips(CO_NO),
                CO_NO, PARCEL_ID, FILE_T, ASMNT_YR, BAS_STRT, ATV_STRT,
                GRP_NO, DOR_UC, PA_UC, SPASS_CD, JV, JV_CHNG, JV_CHNG_CD,
                AV_SD, AV_NSD, TV_SD, TV_NSD, JV_HMSTD, AV_HMSTD, JV_NON_HMS,
                AV_NON_HMS, JV_RESD_NO, AV_RESD_NO, JV_CLASS_U, AV_CLASS_U,
                JV_H2O_REC, AV_H2O_REC, JV_CONSRV_, AV_CONSRV_, JV_HIST_CO,
                AV_HIST_CO, JV_HIST_SI, AV_HIST_SI, JV_WRKNG_W, AV_WRKNG_W,
                NCONST_VAL, DEL_VAL, PAR_SPLT, DISTR_CD, DISTR_YR, LND_VAL,
                LND_UNTS_C, NO_LND_UNT, LND_SQFOOT, DT_LAST_IN, IMP_QUAL,
                CONST_CLAS, EFF_YR_BLT, ACT_YR_BLT, TOT_LVG_AR, NO_BULDNG,
                NO_RES_UNT, SPEC_FEAT_, M_PAR_SAL1, QUAL_CD1, VI_CD1,
                SALE_PRC1, SALE_YR1, SALE_MO1, OR_BOOK1, OR_PAGE1, CLERK_NO1,
                S_CHNG_CD1, M_PAR_SAL2, QUAL_CD2, VI_CD2, SALE_PRC2, SALE_YR2,
                SALE_MO2, OR_BOOK2, OR_PAGE2, CLERK_NO2, S_CHNG_CD2, OWN_NAME,
                OWN_ADDR1, OWN_ADDR2, OWN_CITY, OWN_STATE, OWN_ZIPCD, OWN_STATE_,
                FIDU_NAME, FIDU_ADDR1, FIDU_ADDR2, FIDU_CITY, FIDU_STATE,
                FIDU_ZIPCD, FIDU_CD, S_LEGAL, APP_STAT, CO_APP_STA, MKT_AR,
                NBRHD_CD, PUBLIC_LND, TAX_AUTH_C, TWN, RNG, SEC, CENSUS_BK,
                PHY_ADDR1, PHY_ADDR2, PHY_CITY, PHY_ZIPCD, ALT_KEY, ASS_TRNSFR,
                PREV_HMSTD, ASS_DIF_TR, CONO_PRV_H, PARCEL_ID_, YR_VAL_TRN,
                SEQ_NO, RS_ID, MP_ID, STATE_PAR_, SPC_CIR_CD, SPC_CIR_YR,
                SPC_CIR_TX, Shape_Length, Shape_Area, geometry_wkt
            FROM batch
            ON CONFLICT (parcel_id) DO UPDATE SET
                co_no = EXCLUDED.co_no,
                county_fips = EXCLUDED.county_fips,
                jv = EXCLUDED.jv,
                lnd_val = EXCLUDED.lnd_val,
                own_name = EXCLUDED.own_name,
                phy_addr1 = EXCLUDED.phy_addr1,
                updated_at = NOW()
            RETURNING 1
        )
        SELECT COUNT(*) INTO v_batch_count FROM inserted;
        
        -- Delete processed records from temp table
        DELETE FROM florida_parcels_import_temp
        WHERE PARCEL_ID IN (
            SELECT PARCEL_ID FROM florida_parcels_import_temp
            WHERE PARCEL_ID IS NOT NULL
            LIMIT batch_size
        );
        
        v_total_imported := v_total_imported + v_batch_count;
        
        -- Exit if no more records
        EXIT WHEN v_batch_count = 0;
        
        -- Progress update every 10 batches
        IF v_total_imported % (batch_size * 10) = 0 THEN
            RAISE NOTICE 'Imported % records so far...', v_total_imported;
        END IF;
    END LOOP;
    
    RETURN QUERY SELECT v_total_imported, v_duplicates, v_errors;
END;
$$ LANGUAGE plpgsql;

-- Usage Instructions:
-- ==================
-- 1. Import your CSV into florida_parcels_import_temp using Supabase dashboard
-- 2. Run the import function:
--    SELECT * FROM import_parcels_from_temp(1000);
-- 3. Check the results:
--    SELECT COUNT(*) FROM florida_parcels;
-- 4. Clean up:
--    DROP TABLE florida_parcels_import_temp;

-- Quick check query to verify import
CREATE OR REPLACE VIEW florida_parcels_import_summary AS
SELECT 
    county_fips,
    COUNT(*) as parcel_count,
    COUNT(DISTINCT own_name) as unique_owners,
    SUM(jv) as total_just_value,
    AVG(jv) as avg_just_value,
    MIN(created_at) as first_imported,
    MAX(created_at) as last_imported
FROM florida_parcels
GROUP BY county_fips
ORDER BY county_fips;