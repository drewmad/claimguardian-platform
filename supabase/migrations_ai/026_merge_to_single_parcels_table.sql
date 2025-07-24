-- Merge florida_parcels to accept both UPPERCASE and lowercase columns
-- ====================================================================

-- First, drop the uppercase view as we'll merge everything into one table
DROP VIEW IF EXISTS florida_parcels_uppercase CASCADE;

-- Add uppercase column aliases to the main table
-- PostgreSQL doesn't support column aliases in tables, so we'll use a different approach
-- We'll rename all columns to UPPERCASE to match the CSV format

-- Start transaction
BEGIN;

-- Rename all columns to UPPERCASE
ALTER TABLE florida_parcels 
  RENAME COLUMN co_no TO "CO_NO";
ALTER TABLE florida_parcels 
  RENAME COLUMN parcel_id TO "PARCEL_ID";
ALTER TABLE florida_parcels 
  RENAME COLUMN file_t TO "FILE_T";
ALTER TABLE florida_parcels 
  RENAME COLUMN asmnt_yr TO "ASMNT_YR";
ALTER TABLE florida_parcels 
  RENAME COLUMN bas_strt TO "BAS_STRT";
ALTER TABLE florida_parcels 
  RENAME COLUMN atv_strt TO "ATV_STRT";
ALTER TABLE florida_parcels 
  RENAME COLUMN grp_no TO "GRP_NO";
ALTER TABLE florida_parcels 
  RENAME COLUMN dor_uc TO "DOR_UC";
ALTER TABLE florida_parcels 
  RENAME COLUMN pa_uc TO "PA_UC";
ALTER TABLE florida_parcels 
  RENAME COLUMN spass_cd TO "SPASS_CD";
ALTER TABLE florida_parcels 
  RENAME COLUMN jv TO "JV";
ALTER TABLE florida_parcels 
  RENAME COLUMN jv_chng TO "JV_CHNG";
ALTER TABLE florida_parcels 
  RENAME COLUMN jv_chng_cd TO "JV_CHNG_CD";
ALTER TABLE florida_parcels 
  RENAME COLUMN av_sd TO "AV_SD";
ALTER TABLE florida_parcels 
  RENAME COLUMN av_nsd TO "AV_NSD";
ALTER TABLE florida_parcels 
  RENAME COLUMN tv_sd TO "TV_SD";
ALTER TABLE florida_parcels 
  RENAME COLUMN tv_nsd TO "TV_NSD";
ALTER TABLE florida_parcels 
  RENAME COLUMN jv_hmstd TO "JV_HMSTD";
ALTER TABLE florida_parcels 
  RENAME COLUMN av_hmstd TO "AV_HMSTD";
ALTER TABLE florida_parcels 
  RENAME COLUMN jv_non_hms TO "JV_NON_HMS";
ALTER TABLE florida_parcels 
  RENAME COLUMN av_non_hms TO "AV_NON_HMS";
ALTER TABLE florida_parcels 
  RENAME COLUMN jv_resd_no TO "JV_RESD_NO";
ALTER TABLE florida_parcels 
  RENAME COLUMN av_resd_no TO "AV_RESD_NO";
ALTER TABLE florida_parcels 
  RENAME COLUMN jv_class_u TO "JV_CLASS_U";
ALTER TABLE florida_parcels 
  RENAME COLUMN av_class_u TO "AV_CLASS_U";
ALTER TABLE florida_parcels 
  RENAME COLUMN jv_h2o_rec TO "JV_H2O_REC";
ALTER TABLE florida_parcels 
  RENAME COLUMN av_h2o_rec TO "AV_H2O_REC";
ALTER TABLE florida_parcels 
  RENAME COLUMN jv_consrv_ TO "JV_CONSRV_";
ALTER TABLE florida_parcels 
  RENAME COLUMN av_consrv_ TO "AV_CONSRV_";
ALTER TABLE florida_parcels 
  RENAME COLUMN jv_hist_co TO "JV_HIST_CO";
ALTER TABLE florida_parcels 
  RENAME COLUMN av_hist_co TO "AV_HIST_CO";
ALTER TABLE florida_parcels 
  RENAME COLUMN jv_hist_si TO "JV_HIST_SI";
ALTER TABLE florida_parcels 
  RENAME COLUMN av_hist_si TO "AV_HIST_SI";
ALTER TABLE florida_parcels 
  RENAME COLUMN jv_wrkng_w TO "JV_WRKNG_W";
ALTER TABLE florida_parcels 
  RENAME COLUMN av_wrkng_w TO "AV_WRKNG_W";
ALTER TABLE florida_parcels 
  RENAME COLUMN nconst_val TO "NCONST_VAL";
ALTER TABLE florida_parcels 
  RENAME COLUMN del_val TO "DEL_VAL";
ALTER TABLE florida_parcels 
  RENAME COLUMN par_splt TO "PAR_SPLT";
ALTER TABLE florida_parcels 
  RENAME COLUMN distr_cd TO "DISTR_CD";
ALTER TABLE florida_parcels 
  RENAME COLUMN distr_yr TO "DISTR_YR";
ALTER TABLE florida_parcels 
  RENAME COLUMN lnd_val TO "LND_VAL";
ALTER TABLE florida_parcels 
  RENAME COLUMN lnd_unts_c TO "LND_UNTS_C";
ALTER TABLE florida_parcels 
  RENAME COLUMN no_lnd_unt TO "NO_LND_UNT";
ALTER TABLE florida_parcels 
  RENAME COLUMN lnd_sqfoot TO "LND_SQFOOT";
ALTER TABLE florida_parcels 
  RENAME COLUMN dt_last_in TO "DT_LAST_IN";
ALTER TABLE florida_parcels 
  RENAME COLUMN imp_qual TO "IMP_QUAL";
ALTER TABLE florida_parcels 
  RENAME COLUMN const_clas TO "CONST_CLAS";
ALTER TABLE florida_parcels 
  RENAME COLUMN eff_yr_blt TO "EFF_YR_BLT";
ALTER TABLE florida_parcels 
  RENAME COLUMN act_yr_blt TO "ACT_YR_BLT";
ALTER TABLE florida_parcels 
  RENAME COLUMN tot_lvg_ar TO "TOT_LVG_AR";
ALTER TABLE florida_parcels 
  RENAME COLUMN no_buldng TO "NO_BULDNG";
ALTER TABLE florida_parcels 
  RENAME COLUMN no_res_unt TO "NO_RES_UNT";
ALTER TABLE florida_parcels 
  RENAME COLUMN spec_feat_ TO "SPEC_FEAT_";
ALTER TABLE florida_parcels 
  RENAME COLUMN m_par_sal1 TO "M_PAR_SAL1";
ALTER TABLE florida_parcels 
  RENAME COLUMN qual_cd1 TO "QUAL_CD1";
ALTER TABLE florida_parcels 
  RENAME COLUMN vi_cd1 TO "VI_CD1";
ALTER TABLE florida_parcels 
  RENAME COLUMN sale_prc1 TO "SALE_PRC1";
ALTER TABLE florida_parcels 
  RENAME COLUMN sale_yr1 TO "SALE_YR1";
ALTER TABLE florida_parcels 
  RENAME COLUMN sale_mo1 TO "SALE_MO1";
ALTER TABLE florida_parcels 
  RENAME COLUMN or_book1 TO "OR_BOOK1";
ALTER TABLE florida_parcels 
  RENAME COLUMN or_page1 TO "OR_PAGE1";
ALTER TABLE florida_parcels 
  RENAME COLUMN clerk_no1 TO "CLERK_NO1";
ALTER TABLE florida_parcels 
  RENAME COLUMN s_chng_cd1 TO "S_CHNG_CD1";
ALTER TABLE florida_parcels 
  RENAME COLUMN m_par_sal2 TO "M_PAR_SAL2";
ALTER TABLE florida_parcels 
  RENAME COLUMN qual_cd2 TO "QUAL_CD2";
ALTER TABLE florida_parcels 
  RENAME COLUMN vi_cd2 TO "VI_CD2";
ALTER TABLE florida_parcels 
  RENAME COLUMN sale_prc2 TO "SALE_PRC2";
ALTER TABLE florida_parcels 
  RENAME COLUMN sale_yr2 TO "SALE_YR2";
ALTER TABLE florida_parcels 
  RENAME COLUMN sale_mo2 TO "SALE_MO2";
ALTER TABLE florida_parcels 
  RENAME COLUMN or_book2 TO "OR_BOOK2";
ALTER TABLE florida_parcels 
  RENAME COLUMN or_page2 TO "OR_PAGE2";
ALTER TABLE florida_parcels 
  RENAME COLUMN clerk_no2 TO "CLERK_NO2";
ALTER TABLE florida_parcels 
  RENAME COLUMN s_chng_cd2 TO "S_CHNG_CD2";
ALTER TABLE florida_parcels 
  RENAME COLUMN own_name TO "OWN_NAME";
ALTER TABLE florida_parcels 
  RENAME COLUMN own_addr1 TO "OWN_ADDR1";
ALTER TABLE florida_parcels 
  RENAME COLUMN own_addr2 TO "OWN_ADDR2";
ALTER TABLE florida_parcels 
  RENAME COLUMN own_city TO "OWN_CITY";
ALTER TABLE florida_parcels 
  RENAME COLUMN own_state TO "OWN_STATE";
ALTER TABLE florida_parcels 
  RENAME COLUMN own_zipcd TO "OWN_ZIPCD";
ALTER TABLE florida_parcels 
  RENAME COLUMN own_state_ TO "OWN_STATE_";
ALTER TABLE florida_parcels 
  RENAME COLUMN fidu_name TO "FIDU_NAME";
ALTER TABLE florida_parcels 
  RENAME COLUMN fidu_addr1 TO "FIDU_ADDR1";
ALTER TABLE florida_parcels 
  RENAME COLUMN fidu_addr2 TO "FIDU_ADDR2";
ALTER TABLE florida_parcels 
  RENAME COLUMN fidu_city TO "FIDU_CITY";
ALTER TABLE florida_parcels 
  RENAME COLUMN fidu_state TO "FIDU_STATE";
ALTER TABLE florida_parcels 
  RENAME COLUMN fidu_zipcd TO "FIDU_ZIPCD";
ALTER TABLE florida_parcels 
  RENAME COLUMN fidu_cd TO "FIDU_CD";
ALTER TABLE florida_parcels 
  RENAME COLUMN s_legal TO "S_LEGAL";
ALTER TABLE florida_parcels 
  RENAME COLUMN app_stat TO "APP_STAT";
ALTER TABLE florida_parcels 
  RENAME COLUMN co_app_sta TO "CO_APP_STA";
ALTER TABLE florida_parcels 
  RENAME COLUMN mkt_ar TO "MKT_AR";
ALTER TABLE florida_parcels 
  RENAME COLUMN nbrhd_cd TO "NBRHD_CD";
ALTER TABLE florida_parcels 
  RENAME COLUMN public_lnd TO "PUBLIC_LND";
ALTER TABLE florida_parcels 
  RENAME COLUMN tax_auth_c TO "TAX_AUTH_C";
ALTER TABLE florida_parcels 
  RENAME COLUMN twn TO "TWN";
ALTER TABLE florida_parcels 
  RENAME COLUMN rng TO "RNG";
ALTER TABLE florida_parcels 
  RENAME COLUMN sec TO "SEC";
ALTER TABLE florida_parcels 
  RENAME COLUMN census_bk TO "CENSUS_BK";
ALTER TABLE florida_parcels 
  RENAME COLUMN phy_addr1 TO "PHY_ADDR1";
ALTER TABLE florida_parcels 
  RENAME COLUMN phy_addr2 TO "PHY_ADDR2";
ALTER TABLE florida_parcels 
  RENAME COLUMN phy_city TO "PHY_CITY";
ALTER TABLE florida_parcels 
  RENAME COLUMN phy_zipcd TO "PHY_ZIPCD";
ALTER TABLE florida_parcels 
  RENAME COLUMN alt_key TO "ALT_KEY";
ALTER TABLE florida_parcels 
  RENAME COLUMN ass_trnsfr TO "ASS_TRNSFR";
ALTER TABLE florida_parcels 
  RENAME COLUMN prev_hmstd TO "PREV_HMSTD";
ALTER TABLE florida_parcels 
  RENAME COLUMN ass_dif_tr TO "ASS_DIF_TR";
ALTER TABLE florida_parcels 
  RENAME COLUMN cono_prv_h TO "CONO_PRV_H";
ALTER TABLE florida_parcels 
  RENAME COLUMN parcel_id_ TO "PARCEL_ID_";
ALTER TABLE florida_parcels 
  RENAME COLUMN yr_val_trn TO "YR_VAL_TRN";
ALTER TABLE florida_parcels 
  RENAME COLUMN seq_no TO "SEQ_NO";
ALTER TABLE florida_parcels 
  RENAME COLUMN rs_id TO "RS_ID";
ALTER TABLE florida_parcels 
  RENAME COLUMN mp_id TO "MP_ID";
ALTER TABLE florida_parcels 
  RENAME COLUMN state_par_ TO "STATE_PAR_";
ALTER TABLE florida_parcels 
  RENAME COLUMN spc_cir_cd TO "SPC_CIR_CD";
ALTER TABLE florida_parcels 
  RENAME COLUMN spc_cir_yr TO "SPC_CIR_YR";
ALTER TABLE florida_parcels 
  RENAME COLUMN spc_cir_tx TO "SPC_CIR_TX";
ALTER TABLE florida_parcels 
  RENAME COLUMN shape_length TO "Shape_Length";
ALTER TABLE florida_parcels 
  RENAME COLUMN shape_area TO "Shape_Area";

-- Keep these columns lowercase as they are system columns
-- geometry_wkt, county_fips, county_id, id, created_at, updated_at

-- Update the unique constraint to use the new column name
ALTER TABLE florida_parcels DROP CONSTRAINT IF EXISTS florida_parcels_parcel_id_key;
ALTER TABLE florida_parcels ADD CONSTRAINT florida_parcels_parcel_id_key UNIQUE ("PARCEL_ID");

-- Update the trigger function to use uppercase columns
DROP FUNCTION IF EXISTS link_parcel_to_county() CASCADE;

CREATE OR REPLACE FUNCTION link_parcel_to_county()
RETURNS TRIGGER AS $$
BEGIN
    -- Link to county based on county_fips
    IF NEW.county_fips IS NOT NULL AND NEW.county_id IS NULL THEN
        SELECT id INTO NEW.county_id
        FROM florida_counties
        WHERE county_code = LPAD(NEW.county_fips::TEXT, 5, '0')
        LIMIT 1;
    END IF;
    
    -- Derive county_fips from CO_NO if not provided
    IF NEW.county_fips IS NULL AND NEW."CO_NO" IS NOT NULL THEN
        IF NEW."CO_NO" >= 1 AND NEW."CO_NO" <= 67 THEN
            NEW.county_fips := 12000 + (NEW."CO_NO"::INTEGER * 2) - 1;
            -- Also link to county
            SELECT id INTO NEW.county_id
            FROM florida_counties
            WHERE county_code = LPAD(NEW.county_fips::TEXT, 5, '0')
            LIMIT 1;
        END IF;
    END IF;
    
    -- Update timestamp
    NEW.updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
CREATE TRIGGER trigger_link_parcel_to_county
BEFORE INSERT OR UPDATE ON florida_parcels
FOR EACH ROW
EXECUTE FUNCTION link_parcel_to_county();

-- Update functions to use new column names
DROP FUNCTION IF EXISTS get_parcel_with_county(VARCHAR);
CREATE OR REPLACE FUNCTION get_parcel_with_county(p_parcel_id VARCHAR)
RETURNS TABLE (
    parcel_id VARCHAR,
    owner_name TEXT,
    physical_address TEXT,
    just_value FLOAT,
    land_value FLOAT,
    county_name TEXT,
    property_appraiser_url TEXT,
    gis_url TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p."PARCEL_ID",
        p."OWN_NAME" as owner_name,
        CONCAT(p."PHY_ADDR1", ' ', p."PHY_CITY") as physical_address,
        p."JV" as just_value,
        p."LND_VAL" as land_value,
        c.county_name,
        c.property_search_url as property_appraiser_url,
        c.gis_url
    FROM florida_parcels p
    LEFT JOIN florida_counties c ON p.county_id = c.id
    WHERE p."PARCEL_ID" = p_parcel_id;
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS search_parcels_by_owner(TEXT, INTEGER, INTEGER);
CREATE OR REPLACE FUNCTION search_parcels_by_owner(
    p_owner_name TEXT,
    p_county_fips INTEGER DEFAULT NULL,
    p_limit INTEGER DEFAULT 100
)
RETURNS TABLE (
    parcel_id VARCHAR,
    owner_name TEXT,
    physical_address TEXT,
    city VARCHAR,
    county_name TEXT,
    just_value FLOAT,
    assessment_year FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p."PARCEL_ID",
        p."OWN_NAME" as owner_name,
        p."PHY_ADDR1" as physical_address,
        p."PHY_CITY" as city,
        c.county_name,
        p."JV" as just_value,
        p."ASMNT_YR" as assessment_year
    FROM florida_parcels p
    LEFT JOIN florida_counties c ON p.county_id = c.id
    WHERE UPPER(p."OWN_NAME") LIKE UPPER('%' || p_owner_name || '%')
    AND (p_county_fips IS NULL OR p.county_fips = p_county_fips)
    ORDER BY p."OWN_NAME", p."JV" DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Update the summary view
DROP VIEW IF EXISTS florida_parcels_summary;
CREATE OR REPLACE VIEW florida_parcels_summary AS
SELECT 
    p."PARCEL_ID" as parcel_id,
    p."OWN_NAME" as owner_name,
    p."PHY_ADDR1" as physical_address,
    p."PHY_CITY" as city,
    c.county_name,
    p."JV" as just_value,
    p."LND_VAL" as land_value,
    p."NO_BULDNG" as building_count,
    p."TOT_LVG_AR" as total_living_area,
    p."ACT_YR_BLT" as year_built,
    p."SALE_PRC1" as last_sale_price,
    p."SALE_YR1" as last_sale_year,
    c.property_search_url,
    c.gis_url
FROM florida_parcels p
LEFT JOIN florida_counties c ON p.county_id = c.id;

-- Update column comments
COMMENT ON COLUMN florida_parcels."JV" IS 'Just Value - Market value as determined by Property Appraiser';
COMMENT ON COLUMN florida_parcels."AV_SD" IS 'Assessed Value - School District';
COMMENT ON COLUMN florida_parcels."AV_NSD" IS 'Assessed Value - Non-School District';
COMMENT ON COLUMN florida_parcels."TV_SD" IS 'Taxable Value - School District';
COMMENT ON COLUMN florida_parcels."TV_NSD" IS 'Taxable Value - Non-School District';
COMMENT ON COLUMN florida_parcels."LND_VAL" IS 'Land Value';
COMMENT ON COLUMN florida_parcels."DOR_UC" IS 'Department of Revenue Use Code';
COMMENT ON COLUMN florida_parcels."PA_UC" IS 'Property Appraiser Use Code';

COMMIT;

-- Add final comment
COMMENT ON TABLE florida_parcels IS 'Florida statewide parcel data with UPPERCASE column names matching CSV import format. Automatically derives county_fips from CO_NO field.';