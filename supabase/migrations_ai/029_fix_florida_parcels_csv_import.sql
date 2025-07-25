-- Fix CSV import for florida_parcels table
-- This handles empty strings and spaces in numeric columns

-- Create a function to clean numeric values before insert
CREATE OR REPLACE FUNCTION clean_florida_parcels_import()
RETURNS TRIGGER AS $$
BEGIN
  -- Clean numeric columns that might contain empty strings or spaces
  -- JV column
  IF NEW.jv IS NOT NULL AND trim(NEW.jv::text) IN ('', ' ') THEN
    NEW.jv := NULL;
  END IF;
  
  -- AV columns
  IF NEW.av_sd IS NOT NULL AND trim(NEW.av_sd::text) IN ('', ' ') THEN
    NEW.av_sd := NULL;
  END IF;
  
  IF NEW.av_nsd IS NOT NULL AND trim(NEW.av_nsd::text) IN ('', ' ') THEN
    NEW.av_nsd := NULL;
  END IF;
  
  -- TV columns
  IF NEW.tv_sd IS NOT NULL AND trim(NEW.tv_sd::text) IN ('', ' ') THEN
    NEW.tv_sd := NULL;
  END IF;
  
  IF NEW.tv_nsd IS NOT NULL AND trim(NEW.tv_nsd::text) IN ('', ' ') THEN
    NEW.tv_nsd := NULL;
  END IF;
  
  -- Land and building values
  IF NEW.land_val IS NOT NULL AND trim(NEW.land_val::text) IN ('', ' ') THEN
    NEW.land_val := NULL;
  END IF;
  
  IF NEW.bldg_val IS NOT NULL AND trim(NEW.bldg_val::text) IN ('', ' ') THEN
    NEW.bldg_val := NULL;
  END IF;
  
  IF NEW.tot_val IS NOT NULL AND trim(NEW.tot_val::text) IN ('', ' ') THEN
    NEW.tot_val := NULL;
  END IF;
  
  -- Living area and square footage
  IF NEW.tot_lvg_ar IS NOT NULL AND trim(NEW.tot_lvg_ar::text) IN ('', ' ') THEN
    NEW.tot_lvg_ar := NULL;
  END IF;
  
  IF NEW.land_sqfoot IS NOT NULL AND trim(NEW.land_sqfoot::text) IN ('', ' ') THEN
    NEW.land_sqfoot := NULL;
  END IF;
  
  -- Sale prices
  IF NEW.sale_prc1 IS NOT NULL AND trim(NEW.sale_prc1::text) IN ('', ' ') THEN
    NEW.sale_prc1 := NULL;
  END IF;
  
  IF NEW.sale_prc2 IS NOT NULL AND trim(NEW.sale_prc2::text) IN ('', ' ') THEN
    NEW.sale_prc2 := NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS clean_florida_parcels_import_trigger ON florida_parcels;

-- Create the trigger
CREATE TRIGGER clean_florida_parcels_import_trigger
  BEFORE INSERT OR UPDATE ON florida_parcels
  FOR EACH ROW
  EXECUTE FUNCTION clean_florida_parcels_import();

-- Create a view with uppercase column names for CSV import compatibility
CREATE OR REPLACE VIEW florida_parcels_import AS
SELECT
  id,
  objectid AS "OBJECTID",
  parcel_id AS "PARCEL_ID",
  co_no AS "CO_NO",
  asmnt_yr AS "ASMNT_YR",
  jv AS "JV",
  av_sd AS "AV_SD",
  av_nsd AS "AV_NSD",
  tv_sd AS "TV_SD",
  tv_nsd AS "TV_NSD",
  dor_uc AS "DOR_UC",
  pa_uc AS "PA_UC",
  land_val AS "LAND_VAL",
  bldg_val AS "BLDG_VAL",
  tot_val AS "TOT_VAL",
  act_yr_blt AS "ACT_YR_BLT",
  eff_yr_blt AS "EFF_YR_BLT",
  tot_lvg_ar AS "TOT_LVG_AR",
  land_sqfoot AS "LAND_SQFOOT",
  no_buldng AS "NO_BULDNG",
  no_res_unt AS "NO_RES_UNT",
  own_name AS "OWN_NAME",
  own_addr1 AS "OWN_ADDR1",
  own_addr2 AS "OWN_ADDR2",
  own_city AS "OWN_CITY",
  own_state AS "OWN_STATE",
  own_zipcd AS "OWN_ZIPCD",
  phy_addr1 AS "PHY_ADDR1",
  phy_addr2 AS "PHY_ADDR2",
  phy_city AS "PHY_CITY",
  phy_zipcd AS "PHY_ZIPCD",
  s_legal AS "S_LEGAL",
  twn AS "TWN",
  rng AS "RNG",
  sec AS "SEC",
  sale_prc1 AS "SALE_PRC1",
  sale_yr1 AS "SALE_YR1",
  sale_mo1 AS "SALE_MO1",
  sale_prc2 AS "SALE_PRC2",
  sale_yr2 AS "SALE_YR2",
  sale_mo2 AS "SALE_MO2",
  nbrhd_cd AS "NBRHD_CD",
  census_bk AS "CENSUS_BK",
  mkt_ar AS "MKT_AR",
  geom,
  raw_data,
  data_source,
  created_at,
  updated_at
FROM florida_parcels;

-- Create an INSTEAD OF trigger for the view to handle inserts
CREATE OR REPLACE FUNCTION florida_parcels_import_insert()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO florida_parcels (
    objectid, parcel_id, co_no, asmnt_yr, jv, av_sd, av_nsd, tv_sd, tv_nsd,
    dor_uc, pa_uc, land_val, bldg_val, tot_val, act_yr_blt, eff_yr_blt,
    tot_lvg_ar, land_sqfoot, no_buldng, no_res_unt, own_name, own_addr1,
    own_addr2, own_city, own_state, own_zipcd, phy_addr1, phy_addr2,
    phy_city, phy_zipcd, s_legal, twn, rng, sec, sale_prc1, sale_yr1,
    sale_mo1, sale_prc2, sale_yr2, sale_mo2, nbrhd_cd, census_bk, mkt_ar
  ) VALUES (
    NEW."OBJECTID", NEW."PARCEL_ID", NEW."CO_NO", NEW."ASMNT_YR", 
    NEW."JV", NEW."AV_SD", NEW."AV_NSD", NEW."TV_SD", NEW."TV_NSD",
    NEW."DOR_UC", NEW."PA_UC", NEW."LAND_VAL", NEW."BLDG_VAL", NEW."TOT_VAL",
    NEW."ACT_YR_BLT", NEW."EFF_YR_BLT", NEW."TOT_LVG_AR", NEW."LAND_SQFOOT",
    NEW."NO_BULDNG", NEW."NO_RES_UNT", NEW."OWN_NAME", NEW."OWN_ADDR1",
    NEW."OWN_ADDR2", NEW."OWN_CITY", NEW."OWN_STATE", NEW."OWN_ZIPCD",
    NEW."PHY_ADDR1", NEW."PHY_ADDR2", NEW."PHY_CITY", NEW."PHY_ZIPCD",
    NEW."S_LEGAL", NEW."TWN", NEW."RNG", NEW."SEC", NEW."SALE_PRC1",
    NEW."SALE_YR1", NEW."SALE_MO1", NEW."SALE_PRC2", NEW."SALE_YR2",
    NEW."SALE_MO2", NEW."NBRHD_CD", NEW."CENSUS_BK", NEW."MKT_AR"
  )
  ON CONFLICT (parcel_id) DO UPDATE SET
    objectid = EXCLUDED.objectid,
    co_no = EXCLUDED.co_no,
    asmnt_yr = EXCLUDED.asmnt_yr,
    jv = EXCLUDED.jv,
    av_sd = EXCLUDED.av_sd,
    av_nsd = EXCLUDED.av_nsd,
    tv_sd = EXCLUDED.tv_sd,
    tv_nsd = EXCLUDED.tv_nsd,
    dor_uc = EXCLUDED.dor_uc,
    pa_uc = EXCLUDED.pa_uc,
    land_val = EXCLUDED.land_val,
    bldg_val = EXCLUDED.bldg_val,
    tot_val = EXCLUDED.tot_val,
    act_yr_blt = EXCLUDED.act_yr_blt,
    eff_yr_blt = EXCLUDED.eff_yr_blt,
    tot_lvg_ar = EXCLUDED.tot_lvg_ar,
    land_sqfoot = EXCLUDED.land_sqfoot,
    no_buldng = EXCLUDED.no_buldng,
    no_res_unt = EXCLUDED.no_res_unt,
    own_name = EXCLUDED.own_name,
    own_addr1 = EXCLUDED.own_addr1,
    own_addr2 = EXCLUDED.own_addr2,
    own_city = EXCLUDED.own_city,
    own_state = EXCLUDED.own_state,
    own_zipcd = EXCLUDED.own_zipcd,
    phy_addr1 = EXCLUDED.phy_addr1,
    phy_addr2 = EXCLUDED.phy_addr2,
    phy_city = EXCLUDED.phy_city,
    phy_zipcd = EXCLUDED.phy_zipcd,
    s_legal = EXCLUDED.s_legal,
    twn = EXCLUDED.twn,
    rng = EXCLUDED.rng,
    sec = EXCLUDED.sec,
    sale_prc1 = EXCLUDED.sale_prc1,
    sale_yr1 = EXCLUDED.sale_yr1,
    sale_mo1 = EXCLUDED.sale_mo1,
    sale_prc2 = EXCLUDED.sale_prc2,
    sale_yr2 = EXCLUDED.sale_yr2,
    sale_mo2 = EXCLUDED.sale_mo2,
    nbrhd_cd = EXCLUDED.nbrhd_cd,
    census_bk = EXCLUDED.census_bk,
    mkt_ar = EXCLUDED.mkt_ar,
    updated_at = CURRENT_TIMESTAMP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the INSTEAD OF trigger on the view
DROP TRIGGER IF EXISTS florida_parcels_import_insert_trigger ON florida_parcels_import;
CREATE TRIGGER florida_parcels_import_insert_trigger
  INSTEAD OF INSERT ON florida_parcels_import
  FOR EACH ROW
  EXECUTE FUNCTION florida_parcels_import_insert();

-- Add a comment to help users
COMMENT ON VIEW florida_parcels_import IS 'Use this view for CSV imports with uppercase column headers. It automatically handles empty strings in numeric fields.';