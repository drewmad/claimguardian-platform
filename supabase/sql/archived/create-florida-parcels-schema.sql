-- Create comprehensive Florida parcels schema
-- Based on Florida Department of Revenue cadastral data structure

-- Create extension for PostGIS if not exists
CREATE EXTENSION IF NOT EXISTS postgis;

-- Drop existing table if needed for clean setup
DROP TABLE IF EXISTS public.florida_parcels CASCADE;

-- Create main parcels table
CREATE TABLE public.florida_parcels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identifiers
    objectid BIGINT,
    parcel_id VARCHAR(30),
    co_no INTEGER, -- County FIPS code
    
    -- Assessment data
    asmnt_yr INTEGER,
    jv NUMERIC, -- Just Value
    av_sd NUMERIC, -- Assessed Value School District
    av_nsd NUMERIC, -- Assessed Value Non-School District
    tv_sd NUMERIC, -- Taxable Value School District
    tv_nsd NUMERIC, -- Taxable Value Non-School District
    
    -- Property characteristics
    dor_uc VARCHAR(4), -- Department of Revenue Use Code
    pa_uc VARCHAR(2), -- Property Appraiser Use Code
    land_val NUMERIC,
    bldg_val NUMERIC,
    tot_val NUMERIC,
    
    -- Physical attributes
    act_yr_blt INTEGER, -- Actual Year Built
    eff_yr_blt INTEGER, -- Effective Year Built
    tot_lvg_ar NUMERIC, -- Total Living Area
    land_sqfoot NUMERIC,
    no_buldng INTEGER, -- Number of Buildings
    no_res_unt INTEGER, -- Number of Residential Units
    
    -- Owner information
    own_name VARCHAR(255),
    own_addr1 VARCHAR(255),
    own_addr2 VARCHAR(255),
    own_city VARCHAR(255),
    own_state VARCHAR(50),
    own_zipcd VARCHAR(10),
    
    -- Property location
    phy_addr1 VARCHAR(255),
    phy_addr2 VARCHAR(255),
    phy_city VARCHAR(255),
    phy_zipcd VARCHAR(10),
    
    -- Legal description
    s_legal TEXT,
    twn VARCHAR(3), -- Township
    rng VARCHAR(3), -- Range
    sec VARCHAR(3), -- Section
    
    -- Sales data
    sale_prc1 NUMERIC,
    sale_yr1 INTEGER,
    sale_mo1 VARCHAR(2),
    sale_prc2 NUMERIC,
    sale_yr2 INTEGER,
    sale_mo2 VARCHAR(2),
    
    -- Additional fields
    nbrhd_cd VARCHAR(10), -- Neighborhood Code
    census_bk VARCHAR(16), -- Census Block
    mkt_ar VARCHAR(3), -- Market Area
    
    -- Geometry
    geom GEOMETRY(MultiPolygon, 4326),
    
    -- Metadata
    raw_data JSONB, -- Store complete raw record
    data_source VARCHAR(50) DEFAULT 'FDOR_2025',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    -- Constraints
    CONSTRAINT unique_parcel_county UNIQUE (parcel_id, co_no)
);

-- Create indexes for performance
CREATE INDEX idx_florida_parcels_parcel_id ON public.florida_parcels(parcel_id);
CREATE INDEX idx_florida_parcels_co_no ON public.florida_parcels(co_no);
CREATE INDEX idx_florida_parcels_owner_name ON public.florida_parcels(own_name);
CREATE INDEX idx_florida_parcels_phy_city ON public.florida_parcels(phy_city);
CREATE INDEX idx_florida_parcels_phy_zipcd ON public.florida_parcels(phy_zipcd);
CREATE INDEX idx_florida_parcels_dor_uc ON public.florida_parcels(dor_uc);
CREATE INDEX idx_florida_parcels_jv ON public.florida_parcels(jv);
CREATE INDEX idx_florida_parcels_sale_yr1 ON public.florida_parcels(sale_yr1);

-- Spatial index
CREATE INDEX idx_florida_parcels_geom ON public.florida_parcels USING GIST(geom);

-- Enable RLS
ALTER TABLE public.florida_parcels ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public read access to florida parcels"
ON public.florida_parcels FOR SELECT
TO public
USING (true);

CREATE POLICY "Service role full access to florida parcels"
ON public.florida_parcels FOR ALL
TO service_role
USING (true) WITH CHECK (true);

-- Grant permissions
GRANT SELECT ON public.florida_parcels TO anon, authenticated;
GRANT ALL ON public.florida_parcels TO service_role;

-- Create helper function to get county name from FIPS code
CREATE OR REPLACE FUNCTION get_county_name(fips_code INTEGER)
RETURNS TEXT AS $$
BEGIN
    RETURN CASE fips_code
        WHEN 1 THEN 'Alachua'
        WHEN 3 THEN 'Baker'
        WHEN 5 THEN 'Bay'
        WHEN 7 THEN 'Bradford'
        WHEN 9 THEN 'Brevard'
        WHEN 11 THEN 'Broward'
        WHEN 13 THEN 'Calhoun'
        WHEN 15 THEN 'Charlotte'
        WHEN 17 THEN 'Citrus'
        WHEN 19 THEN 'Clay'
        WHEN 21 THEN 'Collier'
        WHEN 23 THEN 'Columbia'
        WHEN 27 THEN 'DeSoto'
        WHEN 29 THEN 'Dixie'
        WHEN 31 THEN 'Duval'
        WHEN 33 THEN 'Escambia'
        WHEN 35 THEN 'Flagler'
        WHEN 37 THEN 'Franklin'
        WHEN 39 THEN 'Gadsden'
        WHEN 41 THEN 'Gilchrist'
        WHEN 43 THEN 'Glades'
        WHEN 45 THEN 'Gulf'
        WHEN 47 THEN 'Hamilton'
        WHEN 49 THEN 'Hardee'
        WHEN 51 THEN 'Hendry'
        WHEN 53 THEN 'Hernando'
        WHEN 55 THEN 'Highlands'
        WHEN 57 THEN 'Hillsborough'
        WHEN 59 THEN 'Holmes'
        WHEN 61 THEN 'Indian River'
        WHEN 63 THEN 'Jackson'
        WHEN 65 THEN 'Jefferson'
        WHEN 67 THEN 'Lafayette'
        WHEN 69 THEN 'Lake'
        WHEN 71 THEN 'Lee'
        WHEN 73 THEN 'Leon'
        WHEN 75 THEN 'Levy'
        WHEN 77 THEN 'Liberty'
        WHEN 79 THEN 'Madison'
        WHEN 81 THEN 'Manatee'
        WHEN 83 THEN 'Marion'
        WHEN 85 THEN 'Martin'
        WHEN 86 THEN 'Miami-Dade'
        WHEN 87 THEN 'Monroe'
        WHEN 89 THEN 'Nassau'
        WHEN 91 THEN 'Okaloosa'
        WHEN 93 THEN 'Okeechobee'
        WHEN 95 THEN 'Orange'
        WHEN 97 THEN 'Osceola'
        WHEN 99 THEN 'Palm Beach'
        WHEN 101 THEN 'Pasco'
        WHEN 103 THEN 'Pinellas'
        WHEN 105 THEN 'Polk'
        WHEN 107 THEN 'Putnam'
        WHEN 109 THEN 'St. Johns'
        WHEN 111 THEN 'St. Lucie'
        WHEN 113 THEN 'Santa Rosa'
        WHEN 115 THEN 'Sarasota'
        WHEN 117 THEN 'Seminole'
        WHEN 119 THEN 'Sumter'
        WHEN 121 THEN 'Suwannee'
        WHEN 123 THEN 'Taylor'
        WHEN 125 THEN 'Union'
        WHEN 127 THEN 'Volusia'
        WHEN 129 THEN 'Wakulla'
        WHEN 131 THEN 'Walton'
        WHEN 133 THEN 'Washington'
        ELSE 'Unknown'
    END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create summary view
CREATE OR REPLACE VIEW florida_parcels_summary AS
SELECT 
    co_no,
    get_county_name(co_no) as county_name,
    COUNT(*) as parcel_count,
    SUM(jv) as total_just_value,
    AVG(jv) as avg_just_value,
    COUNT(DISTINCT own_name) as unique_owners
FROM florida_parcels
GROUP BY co_no
ORDER BY co_no;

-- Grant access to view
GRANT SELECT ON florida_parcels_summary TO anon, authenticated;

COMMENT ON TABLE florida_parcels IS 'Florida statewide cadastral parcel data from Department of Revenue';
COMMENT ON COLUMN florida_parcels.co_no IS 'County FIPS code (e.g., 15 for Charlotte)';
COMMENT ON COLUMN florida_parcels.jv IS 'Just Value - market value assessment';
COMMENT ON COLUMN florida_parcels.dor_uc IS 'Department of Revenue Use Code';
COMMENT ON COLUMN florida_parcels.tot_lvg_ar IS 'Total Living Area in square feet';