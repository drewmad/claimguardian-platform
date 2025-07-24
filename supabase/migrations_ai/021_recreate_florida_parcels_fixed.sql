-- Handle Florida Parcels Table with Complete Schema (Fixed)
-- =========================================================

-- Drop backup table if exists from previous attempts
DROP TABLE IF EXISTS florida_parcels_backup CASCADE;

-- Drop the existing table
DROP TABLE IF EXISTS florida_parcels CASCADE;

-- Create the complete florida_parcels table with all columns
CREATE TABLE florida_parcels (
    id BIGSERIAL PRIMARY KEY,
    county_fips INTEGER,
    co_no FLOAT,
    parcel_id VARCHAR(50) UNIQUE,
    file_t VARCHAR(10),
    asmnt_yr FLOAT,
    bas_strt VARCHAR(10),
    atv_strt VARCHAR(10),
    grp_no FLOAT,
    dor_uc VARCHAR(10),
    pa_uc VARCHAR(10),
    spass_cd VARCHAR(10),
    jv FLOAT,
    jv_chng FLOAT,
    jv_chng_cd FLOAT,
    av_sd FLOAT,
    av_nsd FLOAT,
    tv_sd FLOAT,
    tv_nsd FLOAT,
    jv_hmstd FLOAT,
    av_hmstd FLOAT,
    jv_non_hms FLOAT,
    av_non_hms FLOAT,
    jv_resd_no FLOAT,
    av_resd_no FLOAT,
    jv_class_u FLOAT,
    av_class_u FLOAT,
    jv_h2o_rec FLOAT,
    av_h2o_rec FLOAT,
    jv_consrv_ FLOAT,
    av_consrv_ FLOAT,
    jv_hist_co FLOAT,
    av_hist_co FLOAT,
    jv_hist_si FLOAT,
    av_hist_si FLOAT,
    jv_wrkng_w FLOAT,
    av_wrkng_w FLOAT,
    nconst_val FLOAT,
    del_val FLOAT,
    par_splt FLOAT,
    distr_cd VARCHAR(10),
    distr_yr FLOAT,
    lnd_val FLOAT,
    lnd_unts_c FLOAT,
    no_lnd_unt FLOAT,
    lnd_sqfoot FLOAT,
    dt_last_in FLOAT,
    imp_qual FLOAT,
    const_clas FLOAT,
    eff_yr_blt FLOAT,
    act_yr_blt FLOAT,
    tot_lvg_ar FLOAT,
    no_buldng FLOAT,
    no_res_unt FLOAT,
    spec_feat_ FLOAT,
    m_par_sal1 VARCHAR(50),
    qual_cd1 VARCHAR(10),
    vi_cd1 VARCHAR(10),
    sale_prc1 FLOAT,
    sale_yr1 FLOAT,
    sale_mo1 FLOAT,
    or_book1 VARCHAR(20),
    or_page1 VARCHAR(20),
    clerk_no1 VARCHAR(20),
    s_chng_cd1 VARCHAR(10),
    m_par_sal2 VARCHAR(50),
    qual_cd2 VARCHAR(10),
    vi_cd2 VARCHAR(10),
    sale_prc2 FLOAT,
    sale_yr2 FLOAT,
    sale_mo2 FLOAT,
    or_book2 VARCHAR(20),
    or_page2 VARCHAR(20),
    clerk_no2 VARCHAR(20),
    s_chng_cd2 VARCHAR(10),
    own_name TEXT,
    own_addr1 TEXT,
    own_addr2 TEXT,
    own_city VARCHAR(100),
    own_state VARCHAR(10),
    own_zipcd FLOAT,
    own_state_ VARCHAR(10),
    fidu_name TEXT,
    fidu_addr1 TEXT,
    fidu_addr2 TEXT,
    fidu_city VARCHAR(100),
    fidu_state VARCHAR(10),
    fidu_zipcd FLOAT,
    fidu_cd FLOAT,
    s_legal TEXT,
    app_stat VARCHAR(50),
    co_app_sta VARCHAR(50),
    mkt_ar VARCHAR(50),
    nbrhd_cd VARCHAR(50),
    public_lnd VARCHAR(50),
    tax_auth_c VARCHAR(50),
    twn VARCHAR(10),
    rng VARCHAR(10),
    sec FLOAT,
    census_bk VARCHAR(50),
    phy_addr1 TEXT,
    phy_addr2 TEXT,
    phy_city VARCHAR(100),
    phy_zipcd FLOAT,
    alt_key VARCHAR(100),
    ass_trnsfr VARCHAR(50),
    prev_hmstd FLOAT,
    ass_dif_tr FLOAT,
    cono_prv_h FLOAT,
    parcel_id_ VARCHAR(50),
    yr_val_trn FLOAT,
    seq_no FLOAT,
    rs_id VARCHAR(50),
    mp_id VARCHAR(50),
    state_par_ VARCHAR(50),
    spc_cir_cd FLOAT,
    spc_cir_yr FLOAT,
    spc_cir_tx VARCHAR(50),
    shape_length FLOAT,
    shape_area FLOAT,
    geometry_wkt TEXT,
    
    -- Add connection to florida_counties
    county_id UUID REFERENCES florida_counties(id),
    
    -- Add timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Add constraint to ensure county_fips matches florida_counties
    CONSTRAINT fk_county_fips CHECK (county_fips >= 12001 AND county_fips <= 12133)
);

-- Create indexes for performance
CREATE INDEX idx_florida_parcels_county_fips ON florida_parcels(county_fips);
CREATE INDEX idx_florida_parcels_parcel_id ON florida_parcels(parcel_id);
CREATE INDEX idx_florida_parcels_own_name ON florida_parcels(own_name);
CREATE INDEX idx_florida_parcels_phy_city ON florida_parcels(phy_city);
CREATE INDEX idx_florida_parcels_jv ON florida_parcels(jv);
CREATE INDEX idx_florida_parcels_county_id ON florida_parcels(county_id);
CREATE INDEX idx_florida_parcels_phy_addr ON florida_parcels(phy_addr1);
CREATE INDEX idx_florida_parcels_sale_prc ON florida_parcels(sale_prc1) WHERE sale_prc1 > 0;
CREATE INDEX idx_florida_parcels_asmnt_yr ON florida_parcels(asmnt_yr);

-- Enable RLS
ALTER TABLE florida_parcels ENABLE ROW LEVEL SECURITY;

-- Create read policy
CREATE POLICY "Enable read access for all users" ON florida_parcels
    FOR SELECT USING (true);

-- Create write policy for authenticated users only
CREATE POLICY "Enable write for authenticated users" ON florida_parcels
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Create update policy for admin only
CREATE POLICY "Enable update for admin users" ON florida_parcels
    FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');

-- Function to automatically link parcels to counties
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
    
    -- Update timestamp
    NEW.updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-link counties
CREATE TRIGGER trigger_link_parcel_to_county
BEFORE INSERT OR UPDATE ON florida_parcels
FOR EACH ROW
EXECUTE FUNCTION link_parcel_to_county();

-- Function to get parcel with county info
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
        p.parcel_id,
        p.own_name as owner_name,
        CONCAT(p.phy_addr1, ' ', p.phy_city) as physical_address,
        p.jv as just_value,
        p.lnd_val as land_value,
        c.county_name,
        c.property_search_url as property_appraiser_url,
        c.gis_url
    FROM florida_parcels p
    LEFT JOIN florida_counties c ON p.county_id = c.id
    WHERE p.parcel_id = p_parcel_id;
END;
$$ LANGUAGE plpgsql;

-- Function to search parcels by owner name
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
        p.parcel_id,
        p.own_name as owner_name,
        p.phy_addr1 as physical_address,
        p.phy_city as city,
        c.county_name,
        p.jv as just_value,
        p.asmnt_yr as assessment_year
    FROM florida_parcels p
    LEFT JOIN florida_counties c ON p.county_id = c.id
    WHERE UPPER(p.own_name) LIKE UPPER('%' || p_owner_name || '%')
    AND (p_county_fips IS NULL OR p.county_fips = p_county_fips)
    ORDER BY p.own_name, p.jv DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to get parcel statistics by county
CREATE OR REPLACE FUNCTION get_parcel_stats_by_county(p_county_code TEXT DEFAULT NULL)
RETURNS TABLE (
    county_name TEXT,
    total_parcels BIGINT,
    total_just_value NUMERIC,
    avg_just_value NUMERIC,
    total_land_value NUMERIC,
    residential_units BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.county_name,
        COUNT(p.id) as total_parcels,
        SUM(p.jv) as total_just_value,
        AVG(p.jv) as avg_just_value,
        SUM(p.lnd_val) as total_land_value,
        SUM(p.no_res_unt::BIGINT) as residential_units
    FROM florida_parcels p
    JOIN florida_counties c ON p.county_id = c.id
    WHERE p_county_code IS NULL OR c.county_code = p_county_code
    GROUP BY c.county_name
    ORDER BY c.county_name;
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON TABLE florida_parcels IS 'Florida statewide parcel data from Department of Revenue';
COMMENT ON COLUMN florida_parcels.jv IS 'Just Value - Market value as determined by Property Appraiser';
COMMENT ON COLUMN florida_parcels.av_sd IS 'Assessed Value - School District';
COMMENT ON COLUMN florida_parcels.av_nsd IS 'Assessed Value - Non-School District';
COMMENT ON COLUMN florida_parcels.tv_sd IS 'Taxable Value - School District';
COMMENT ON COLUMN florida_parcels.tv_nsd IS 'Taxable Value - Non-School District';
COMMENT ON COLUMN florida_parcels.lnd_val IS 'Land Value';
COMMENT ON COLUMN florida_parcels.dor_uc IS 'Department of Revenue Use Code';
COMMENT ON COLUMN florida_parcels.pa_uc IS 'Property Appraiser Use Code';

-- Create a summary view for easy access
CREATE OR REPLACE VIEW florida_parcels_summary AS
SELECT 
    p.parcel_id,
    p.own_name,
    p.phy_addr1,
    p.phy_city,
    c.county_name,
    p.jv as just_value,
    p.lnd_val as land_value,
    p.no_buldng as building_count,
    p.tot_lvg_ar as total_living_area,
    p.act_yr_blt as year_built,
    p.sale_prc1 as last_sale_price,
    p.sale_yr1 as last_sale_year,
    c.property_search_url,
    c.gis_url
FROM florida_parcels p
LEFT JOIN florida_counties c ON p.county_id = c.id;

-- Grant appropriate permissions
GRANT SELECT ON florida_parcels TO anon, authenticated;
GRANT SELECT ON florida_parcels_summary TO anon, authenticated;
GRANT INSERT, UPDATE ON florida_parcels TO authenticated;
GRANT DELETE ON florida_parcels TO service_role;