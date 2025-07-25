-- Add missing columns to florida_parcels table for CSV import compatibility
-- These columns are required by the Florida Department of Revenue dataset

ALTER TABLE florida_parcels
    -- Additional owner fields
    ADD COLUMN IF NOT EXISTS own_state2 VARCHAR(10),
    ADD COLUMN IF NOT EXISTS own_zipcda VARCHAR(20),
    
    -- Multiple neighborhood codes
    ADD COLUMN IF NOT EXISTS nbrhd_cd1 VARCHAR(50),
    ADD COLUMN IF NOT EXISTS nbrhd_cd2 VARCHAR(50),
    ADD COLUMN IF NOT EXISTS nbrhd_cd3 VARCHAR(50),
    ADD COLUMN IF NOT EXISTS nbrhd_cd4 VARCHAR(50),
    
    -- Multiple DOR codes
    ADD COLUMN IF NOT EXISTS dor_cd1 VARCHAR(10),
    ADD COLUMN IF NOT EXISTS dor_cd2 VARCHAR(10),
    ADD COLUMN IF NOT EXISTS dor_cd3 VARCHAR(10),
    ADD COLUMN IF NOT EXISTS dor_cd4 VARCHAR(10),
    
    -- Agricultural value
    ADD COLUMN IF NOT EXISTS ag_val FLOAT,
    
    -- Additional sale fields with underscore suffix
    ADD COLUMN IF NOT EXISTS qual_cd2_ VARCHAR(10),
    ADD COLUMN IF NOT EXISTS vi_cd2_ VARCHAR(10),
    ADD COLUMN IF NOT EXISTS sale_prc2_ FLOAT,
    ADD COLUMN IF NOT EXISTS sale_yr2_ FLOAT,
    ADD COLUMN IF NOT EXISTS sale_mo2_ FLOAT,
    ADD COLUMN IF NOT EXISTS or_book2_ VARCHAR(20),
    ADD COLUMN IF NOT EXISTS or_page2_ VARCHAR(20),
    ADD COLUMN IF NOT EXISTS clerk_n_2 VARCHAR(20),
    
    -- Additional valuation fields
    ADD COLUMN IF NOT EXISTS imp_val FLOAT,
    ADD COLUMN IF NOT EXISTS const_val FLOAT,
    
    -- District and lot information
    ADD COLUMN IF NOT EXISTS distr_no VARCHAR(20),
    ADD COLUMN IF NOT EXISTS front FLOAT,
    ADD COLUMN IF NOT EXISTS depth FLOAT,
    ADD COLUMN IF NOT EXISTS cap FLOAT,
    ADD COLUMN IF NOT EXISTS cape_shpa FLOAT,
    
    -- Geographic coordinates
    ADD COLUMN IF NOT EXISTS latitude FLOAT,
    ADD COLUMN IF NOT EXISTS longitude FLOAT,
    
    -- PIN fields
    ADD COLUMN IF NOT EXISTS pin_1 VARCHAR(50),
    ADD COLUMN IF NOT EXISTS pin_2 VARCHAR(50),
    
    -- Additional location fields
    ADD COLUMN IF NOT EXISTS half_cd VARCHAR(10),
    ADD COLUMN IF NOT EXISTS twp VARCHAR(10),  -- Additional township field
    ADD COLUMN IF NOT EXISTS sub VARCHAR(50),
    ADD COLUMN IF NOT EXISTS blk VARCHAR(20),
    ADD COLUMN IF NOT EXISTS lot VARCHAR(20),
    ADD COLUMN IF NOT EXISTS plat_book VARCHAR(20),
    ADD COLUMN IF NOT EXISTS plat_page VARCHAR(20);

-- Create indexes for new searchable fields
CREATE INDEX IF NOT EXISTS idx_florida_parcels_nbrhd_cd1 ON florida_parcels(nbrhd_cd1);
CREATE INDEX IF NOT EXISTS idx_florida_parcels_latitude ON florida_parcels(latitude);
CREATE INDEX IF NOT EXISTS idx_florida_parcels_longitude ON florida_parcels(longitude);
CREATE INDEX IF NOT EXISTS idx_florida_parcels_pin_1 ON florida_parcels(pin_1);

-- Add comments for new columns
COMMENT ON COLUMN florida_parcels.own_state2 IS 'Secondary owner state';
COMMENT ON COLUMN florida_parcels.own_zipcda IS 'Owner ZIP code with additional digits';
COMMENT ON COLUMN florida_parcels.nbrhd_cd1 IS 'Neighborhood code 1';
COMMENT ON COLUMN florida_parcels.nbrhd_cd2 IS 'Neighborhood code 2';
COMMENT ON COLUMN florida_parcels.nbrhd_cd3 IS 'Neighborhood code 3';
COMMENT ON COLUMN florida_parcels.nbrhd_cd4 IS 'Neighborhood code 4';
COMMENT ON COLUMN florida_parcels.dor_cd1 IS 'Department of Revenue code 1';
COMMENT ON COLUMN florida_parcels.dor_cd2 IS 'Department of Revenue code 2';
COMMENT ON COLUMN florida_parcels.dor_cd3 IS 'Department of Revenue code 3';
COMMENT ON COLUMN florida_parcels.dor_cd4 IS 'Department of Revenue code 4';
COMMENT ON COLUMN florida_parcels.ag_val IS 'Agricultural value';
COMMENT ON COLUMN florida_parcels.imp_val IS 'Improvement value';
COMMENT ON COLUMN florida_parcels.const_val IS 'Construction value';
COMMENT ON COLUMN florida_parcels.distr_no IS 'District number';
COMMENT ON COLUMN florida_parcels.front IS 'Property frontage in feet';
COMMENT ON COLUMN florida_parcels.depth IS 'Property depth in feet';
COMMENT ON COLUMN florida_parcels.cap IS 'Capitalization rate';
COMMENT ON COLUMN florida_parcels.cape_shpa IS 'Cape shape area';
COMMENT ON COLUMN florida_parcels.latitude IS 'Property latitude coordinate';
COMMENT ON COLUMN florida_parcels.longitude IS 'Property longitude coordinate';
COMMENT ON COLUMN florida_parcels.pin_1 IS 'Parcel identification number 1';
COMMENT ON COLUMN florida_parcels.pin_2 IS 'Parcel identification number 2';
COMMENT ON COLUMN florida_parcels.half_cd IS 'Half code';
COMMENT ON COLUMN florida_parcels.twp IS 'Township (additional field)';
COMMENT ON COLUMN florida_parcels.sub IS 'Subdivision';
COMMENT ON COLUMN florida_parcels.blk IS 'Block';
COMMENT ON COLUMN florida_parcels.lot IS 'Lot';
COMMENT ON COLUMN florida_parcels.plat_book IS 'Plat book reference';
COMMENT ON COLUMN florida_parcels.plat_page IS 'Plat page reference';

-- Update the staging table to include these new columns
ALTER TABLE florida_parcels_staging
    ADD COLUMN IF NOT EXISTS own_state2 TEXT,
    ADD COLUMN IF NOT EXISTS own_zipcda TEXT,
    ADD COLUMN IF NOT EXISTS nbrhd_cd1 TEXT,
    ADD COLUMN IF NOT EXISTS nbrhd_cd2 TEXT,
    ADD COLUMN IF NOT EXISTS nbrhd_cd3 TEXT,
    ADD COLUMN IF NOT EXISTS nbrhd_cd4 TEXT,
    ADD COLUMN IF NOT EXISTS dor_cd1 TEXT,
    ADD COLUMN IF NOT EXISTS dor_cd2 TEXT,
    ADD COLUMN IF NOT EXISTS dor_cd3 TEXT,
    ADD COLUMN IF NOT EXISTS dor_cd4 TEXT,
    ADD COLUMN IF NOT EXISTS ag_val TEXT,
    ADD COLUMN IF NOT EXISTS qual_cd2_ TEXT,
    ADD COLUMN IF NOT EXISTS vi_cd2_ TEXT,
    ADD COLUMN IF NOT EXISTS sale_prc2_ TEXT,
    ADD COLUMN IF NOT EXISTS sale_yr2_ TEXT,
    ADD COLUMN IF NOT EXISTS sale_mo2_ TEXT,
    ADD COLUMN IF NOT EXISTS or_book2_ TEXT,
    ADD COLUMN IF NOT EXISTS or_page2_ TEXT,
    ADD COLUMN IF NOT EXISTS clerk_n_2 TEXT,
    ADD COLUMN IF NOT EXISTS imp_val TEXT,
    ADD COLUMN IF NOT EXISTS const_val TEXT,
    ADD COLUMN IF NOT EXISTS distr_no TEXT,
    ADD COLUMN IF NOT EXISTS front TEXT,
    ADD COLUMN IF NOT EXISTS depth TEXT,
    ADD COLUMN IF NOT EXISTS cap TEXT,
    ADD COLUMN IF NOT EXISTS cape_shpa TEXT,
    ADD COLUMN IF NOT EXISTS latitude TEXT,
    ADD COLUMN IF NOT EXISTS longitude TEXT,
    ADD COLUMN IF NOT EXISTS pin_1 TEXT,
    ADD COLUMN IF NOT EXISTS pin_2 TEXT,
    ADD COLUMN IF NOT EXISTS half_cd TEXT,
    ADD COLUMN IF NOT EXISTS twp TEXT,
    ADD COLUMN IF NOT EXISTS sub TEXT,
    ADD COLUMN IF NOT EXISTS blk TEXT,
    ADD COLUMN IF NOT EXISTS lot TEXT,
    ADD COLUMN IF NOT EXISTS plat_book TEXT,
    ADD COLUMN IF NOT EXISTS plat_page TEXT;

-- Drop and recreate the CSV import view to include new columns
DROP VIEW IF EXISTS florida_parcels_csv_import;

CREATE VIEW florida_parcels_csv_import AS
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
    -- New columns
    own_state2 AS "OWN_STATE2",
    own_zipcda AS "OWN_ZIPCDA",
    nbrhd_cd1 AS "NBRHD_CD1",
    nbrhd_cd2 AS "NBRHD_CD2",
    nbrhd_cd3 AS "NBRHD_CD3",
    nbrhd_cd4 AS "NBRHD_CD4",
    dor_cd1 AS "DOR_CD1",
    dor_cd2 AS "DOR_CD2",
    dor_cd3 AS "DOR_CD3",
    dor_cd4 AS "DOR_CD4",
    ag_val AS "AG_VAL",
    qual_cd2_ AS "QUAL_CD2_",
    vi_cd2_ AS "VI_CD2_",
    sale_prc2_ AS "SALE_PRC2_",
    sale_yr2_ AS "SALE_YR2_",
    sale_mo2_ AS "SALE_MO2_",
    or_book2_ AS "OR_BOOK2_",
    or_page2_ AS "OR_PAGE2_",
    clerk_n_2 AS "CLERK_N_2",
    imp_val AS "IMP_VAL",
    const_val AS "CONST_VAL",
    distr_no AS "DISTR_NO",
    front AS "FRONT",
    depth AS "DEPTH",
    cap AS "CAP",
    cape_shpa AS "CAPE_SHPA",
    latitude AS "LATITUDE",
    longitude AS "LONGITUDE",
    pin_1 AS "PIN_1",
    pin_2 AS "PIN_2",
    half_cd AS "HALF_CD",
    twp AS "TWP",
    sub AS "SUB",
    blk AS "BLK",
    lot AS "LOT",
    plat_book AS "PLAT_BOOK",
    plat_page AS "PLAT_PAGE"
FROM florida_parcels_staging;

-- Update the transfer function to handle new columns
CREATE OR REPLACE FUNCTION transfer_florida_parcels_staging()
RETURNS void AS $$
BEGIN
    INSERT INTO florida_parcels (
        objectid, parcel_id, co_no, asmnt_yr, jv, av_sd, av_nsd, tv_sd, tv_nsd,
        dor_uc, pa_uc, land_val, bldg_val, tot_val, act_yr_blt, eff_yr_blt,
        tot_lvg_ar, land_sqfoot, no_buldng, no_res_unt, own_name, own_addr1,
        own_addr2, own_city, own_state, own_zipcd, phy_addr1, phy_addr2,
        phy_city, phy_zipcd, s_legal, twn, rng, sec, sale_prc1, sale_yr1,
        sale_mo1, sale_prc2, sale_yr2, sale_mo2, nbrhd_cd, census_bk, mkt_ar,
        data_source, own_state2, own_zipcda, nbrhd_cd1, nbrhd_cd2, nbrhd_cd3,
        nbrhd_cd4, dor_cd1, dor_cd2, dor_cd3, dor_cd4, ag_val, qual_cd2_,
        vi_cd2_, sale_prc2_, sale_yr2_, sale_mo2_, or_book2_, or_page2_,
        clerk_n_2, imp_val, const_val, distr_no, front, depth, cap, cape_shpa,
        latitude, longitude, pin_1, pin_2, half_cd, twp, sub, blk, lot,
        plat_book, plat_page
    )
    SELECT
        CASE WHEN trim(objectid) IN ('', ' ') THEN NULL ELSE objectid::bigint END,
        NULLIF(trim(parcel_id), ''),
        CASE WHEN trim(co_no) IN ('', ' ') THEN NULL ELSE co_no::integer END,
        CASE WHEN trim(asmnt_yr) IN ('', ' ') THEN NULL ELSE asmnt_yr::integer END,
        CASE WHEN trim(jv) IN ('', ' ') THEN NULL ELSE jv::numeric END,
        CASE WHEN trim(av_sd) IN ('', ' ') THEN NULL ELSE av_sd::numeric END,
        CASE WHEN trim(av_nsd) IN ('', ' ') THEN NULL ELSE av_nsd::numeric END,
        CASE WHEN trim(tv_sd) IN ('', ' ') THEN NULL ELSE tv_sd::numeric END,
        CASE WHEN trim(tv_nsd) IN ('', ' ') THEN NULL ELSE tv_nsd::numeric END,
        NULLIF(trim(dor_uc), ''),
        NULLIF(trim(pa_uc), ''),
        CASE WHEN trim(land_val) IN ('', ' ') THEN NULL ELSE land_val::numeric END,
        CASE WHEN trim(bldg_val) IN ('', ' ') THEN NULL ELSE bldg_val::numeric END,
        CASE WHEN trim(tot_val) IN ('', ' ') THEN NULL ELSE tot_val::numeric END,
        CASE WHEN trim(act_yr_blt) IN ('', ' ') THEN NULL ELSE act_yr_blt::integer END,
        CASE WHEN trim(eff_yr_blt) IN ('', ' ') THEN NULL ELSE eff_yr_blt::integer END,
        CASE WHEN trim(tot_lvg_ar) IN ('', ' ') THEN NULL ELSE tot_lvg_ar::numeric END,
        CASE WHEN trim(land_sqfoot) IN ('', ' ') THEN NULL ELSE land_sqfoot::numeric END,
        CASE WHEN trim(no_buldng) IN ('', ' ') THEN NULL ELSE no_buldng::integer END,
        CASE WHEN trim(no_res_unt) IN ('', ' ') THEN NULL ELSE no_res_unt::integer END,
        NULLIF(trim(own_name), ''),
        NULLIF(trim(own_addr1), ''),
        NULLIF(trim(own_addr2), ''),
        NULLIF(trim(own_city), ''),
        NULLIF(trim(own_state), ''),
        NULLIF(trim(own_zipcd), ''),
        NULLIF(trim(phy_addr1), ''),
        NULLIF(trim(phy_addr2), ''),
        NULLIF(trim(phy_city), ''),
        NULLIF(trim(phy_zipcd), ''),
        NULLIF(trim(s_legal), ''),
        NULLIF(trim(twn), ''),
        NULLIF(trim(rng), ''),
        NULLIF(trim(sec), ''),
        CASE WHEN trim(sale_prc1) IN ('', ' ') THEN NULL ELSE sale_prc1::numeric END,
        CASE WHEN trim(sale_yr1) IN ('', ' ') THEN NULL ELSE sale_yr1::integer END,
        NULLIF(trim(sale_mo1), ''),
        CASE WHEN trim(sale_prc2) IN ('', ' ') THEN NULL ELSE sale_prc2::numeric END,
        CASE WHEN trim(sale_yr2) IN ('', ' ') THEN NULL ELSE sale_yr2::integer END,
        NULLIF(trim(sale_mo2), ''),
        NULLIF(trim(nbrhd_cd), ''),
        NULLIF(trim(census_bk), ''),
        NULLIF(trim(mkt_ar), ''),
        data_source,
        -- New columns
        NULLIF(trim(own_state2), ''),
        NULLIF(trim(own_zipcda), ''),
        NULLIF(trim(nbrhd_cd1), ''),
        NULLIF(trim(nbrhd_cd2), ''),
        NULLIF(trim(nbrhd_cd3), ''),
        NULLIF(trim(nbrhd_cd4), ''),
        NULLIF(trim(dor_cd1), ''),
        NULLIF(trim(dor_cd2), ''),
        NULLIF(trim(dor_cd3), ''),
        NULLIF(trim(dor_cd4), ''),
        CASE WHEN trim(ag_val) IN ('', ' ') THEN NULL ELSE ag_val::numeric END,
        NULLIF(trim(qual_cd2_), ''),
        NULLIF(trim(vi_cd2_), ''),
        CASE WHEN trim(sale_prc2_) IN ('', ' ') THEN NULL ELSE sale_prc2_::numeric END,
        CASE WHEN trim(sale_yr2_) IN ('', ' ') THEN NULL ELSE sale_yr2_::integer END,
        CASE WHEN trim(sale_mo2_) IN ('', ' ') THEN NULL ELSE sale_mo2_::integer END,
        NULLIF(trim(or_book2_), ''),
        NULLIF(trim(or_page2_), ''),
        NULLIF(trim(clerk_n_2), ''),
        CASE WHEN trim(imp_val) IN ('', ' ') THEN NULL ELSE imp_val::numeric END,
        CASE WHEN trim(const_val) IN ('', ' ') THEN NULL ELSE const_val::numeric END,
        NULLIF(trim(distr_no), ''),
        CASE WHEN trim(front) IN ('', ' ') THEN NULL ELSE front::numeric END,
        CASE WHEN trim(depth) IN ('', ' ') THEN NULL ELSE depth::numeric END,
        CASE WHEN trim(cap) IN ('', ' ') THEN NULL ELSE cap::numeric END,
        CASE WHEN trim(cape_shpa) IN ('', ' ') THEN NULL ELSE cape_shpa::numeric END,
        CASE WHEN trim(latitude) IN ('', ' ') THEN NULL ELSE latitude::numeric END,
        CASE WHEN trim(longitude) IN ('', ' ') THEN NULL ELSE longitude::numeric END,
        NULLIF(trim(pin_1), ''),
        NULLIF(trim(pin_2), ''),
        NULLIF(trim(half_cd), ''),
        NULLIF(trim(twp), ''),
        NULLIF(trim(sub), ''),
        NULLIF(trim(blk), ''),
        NULLIF(trim(lot), ''),
        NULLIF(trim(plat_book), ''),
        NULLIF(trim(plat_page), '')
    FROM florida_parcels_staging
    WHERE parcel_id IS NOT NULL AND trim(parcel_id) != ''
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
        own_state2 = EXCLUDED.own_state2,
        own_zipcda = EXCLUDED.own_zipcda,
        nbrhd_cd1 = EXCLUDED.nbrhd_cd1,
        nbrhd_cd2 = EXCLUDED.nbrhd_cd2,
        nbrhd_cd3 = EXCLUDED.nbrhd_cd3,
        nbrhd_cd4 = EXCLUDED.nbrhd_cd4,
        dor_cd1 = EXCLUDED.dor_cd1,
        dor_cd2 = EXCLUDED.dor_cd2,
        dor_cd3 = EXCLUDED.dor_cd3,
        dor_cd4 = EXCLUDED.dor_cd4,
        ag_val = EXCLUDED.ag_val,
        qual_cd2_ = EXCLUDED.qual_cd2_,
        vi_cd2_ = EXCLUDED.vi_cd2_,
        sale_prc2_ = EXCLUDED.sale_prc2_,
        sale_yr2_ = EXCLUDED.sale_yr2_,
        sale_mo2_ = EXCLUDED.sale_mo2_,
        or_book2_ = EXCLUDED.or_book2_,
        or_page2_ = EXCLUDED.or_page2_,
        clerk_n_2 = EXCLUDED.clerk_n_2,
        imp_val = EXCLUDED.imp_val,
        const_val = EXCLUDED.const_val,
        distr_no = EXCLUDED.distr_no,
        front = EXCLUDED.front,
        depth = EXCLUDED.depth,
        cap = EXCLUDED.cap,
        cape_shpa = EXCLUDED.cape_shpa,
        latitude = EXCLUDED.latitude,
        longitude = EXCLUDED.longitude,
        pin_1 = EXCLUDED.pin_1,
        pin_2 = EXCLUDED.pin_2,
        half_cd = EXCLUDED.half_cd,
        twp = EXCLUDED.twp,
        sub = EXCLUDED.sub,
        blk = EXCLUDED.blk,
        lot = EXCLUDED.lot,
        plat_book = EXCLUDED.plat_book,
        plat_page = EXCLUDED.plat_page,
        updated_at = CURRENT_TIMESTAMP;
    
    -- Clear staging table after successful transfer
    TRUNCATE florida_parcels_staging;
END;
$$ LANGUAGE plpgsql;

-- Update comment on the view
COMMENT ON VIEW florida_parcels_csv_import IS 'Use this view to import CSV files with uppercase headers. Supports all Florida DOR columns. After import, run: SELECT transfer_florida_parcels_staging();';