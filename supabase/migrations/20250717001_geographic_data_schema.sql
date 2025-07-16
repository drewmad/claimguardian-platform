-- Geographic data schema for standardized address handling
-- Date: 2025-07-16
-- Focus: Florida counties, cities, and ZIP codes with FIPS integration

-- States table (for future expansion, but initially Florida-only)
CREATE TABLE IF NOT EXISTS public.states (
    id SERIAL PRIMARY KEY,
    code CHAR(2) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    fips_code CHAR(2) NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Counties table with FIPS codes
CREATE TABLE IF NOT EXISTS public.counties (
    id SERIAL PRIMARY KEY,
    state_id INTEGER REFERENCES public.states(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    fips_code CHAR(5) NOT NULL, -- State + County FIPS (e.g., "12001" for Alachua, FL)
    state_fips CHAR(2) NOT NULL,
    county_fips CHAR(3) NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(state_id, fips_code)
);

-- Cities table
CREATE TABLE IF NOT EXISTS public.cities (
    id SERIAL PRIMARY KEY,
    county_id INTEGER REFERENCES public.counties(id) ON DELETE CASCADE,
    state_id INTEGER REFERENCES public.states(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ZIP codes table with geographic relationships
CREATE TABLE IF NOT EXISTS public.zip_codes (
    id SERIAL PRIMARY KEY,
    zip_code CHAR(5) NOT NULL,
    city_id INTEGER REFERENCES public.cities(id) ON DELETE CASCADE,
    county_id INTEGER REFERENCES public.counties(id) ON DELETE CASCADE,
    state_id INTEGER REFERENCES public.states(id) ON DELETE CASCADE,
    primary_city VARCHAR(100) NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(zip_code, city_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_counties_state_id ON public.counties(state_id);
CREATE INDEX IF NOT EXISTS idx_counties_fips ON public.counties(fips_code);
CREATE INDEX IF NOT EXISTS idx_cities_county_id ON public.cities(county_id);
CREATE INDEX IF NOT EXISTS idx_cities_state_id ON public.cities(state_id);
CREATE INDEX IF NOT EXISTS idx_zip_codes_zip ON public.zip_codes(zip_code);
CREATE INDEX IF NOT EXISTS idx_zip_codes_county_id ON public.zip_codes(county_id);
CREATE INDEX IF NOT EXISTS idx_zip_codes_state_id ON public.zip_codes(state_id);

-- Insert Florida state data
INSERT INTO public.states (code, name, fips_code) 
VALUES ('FL', 'Florida', '12')
ON CONFLICT (code) DO NOTHING;

-- Insert Florida counties with FIPS codes
INSERT INTO public.counties (state_id, name, fips_code, state_fips, county_fips) 
SELECT 
    s.id,
    county_data.name,
    county_data.fips_code,
    '12',
    county_data.county_fips
FROM public.states s,
(VALUES 
    ('Alachua County', '12001', '001'),
    ('Baker County', '12003', '003'),
    ('Bay County', '12005', '005'),
    ('Bradford County', '12007', '007'),
    ('Brevard County', '12009', '009'),
    ('Broward County', '12011', '011'),
    ('Calhoun County', '12013', '013'),
    ('Charlotte County', '12015', '015'),
    ('Citrus County', '12017', '017'),
    ('Clay County', '12019', '019'),
    ('Collier County', '12021', '021'),
    ('Columbia County', '12023', '023'),
    ('DeSoto County', '12027', '027'),
    ('Dixie County', '12029', '029'),
    ('Duval County', '12031', '031'),
    ('Escambia County', '12033', '033'),
    ('Flagler County', '12035', '035'),
    ('Franklin County', '12037', '037'),
    ('Gadsden County', '12039', '039'),
    ('Gilchrist County', '12041', '041'),
    ('Glades County', '12043', '043'),
    ('Gulf County', '12045', '045'),
    ('Hamilton County', '12047', '047'),
    ('Hardee County', '12049', '049'),
    ('Hendry County', '12051', '051'),
    ('Hernando County', '12053', '053'),
    ('Highlands County', '12055', '055'),
    ('Hillsborough County', '12057', '057'),
    ('Holmes County', '12059', '059'),
    ('Indian River County', '12061', '061'),
    ('Jackson County', '12063', '063'),
    ('Jefferson County', '12065', '065'),
    ('Lafayette County', '12067', '067'),
    ('Lake County', '12069', '069'),
    ('Lee County', '12071', '071'),
    ('Leon County', '12073', '073'),
    ('Levy County', '12075', '075'),
    ('Liberty County', '12077', '077'),
    ('Madison County', '12079', '079'),
    ('Manatee County', '12081', '081'),
    ('Marion County', '12083', '083'),
    ('Martin County', '12085', '085'),
    ('Miami-Dade County', '12086', '086'),
    ('Monroe County', '12087', '087'),
    ('Nassau County', '12089', '089'),
    ('Okaloosa County', '12091', '091'),
    ('Okeechobee County', '12093', '093'),
    ('Orange County', '12095', '095'),
    ('Osceola County', '12097', '097'),
    ('Palm Beach County', '12099', '099'),
    ('Pasco County', '12101', '101'),
    ('Pinellas County', '12103', '103'),
    ('Polk County', '12105', '105'),
    ('Putnam County', '12107', '107'),
    ('Santa Rosa County', '12113', '113'),
    ('Sarasota County', '12115', '115'),
    ('Seminole County', '12117', '117'),
    ('St. Johns County', '12109', '109'),
    ('St. Lucie County', '12111', '111'),
    ('Sumter County', '12119', '119'),
    ('Suwannee County', '12121', '121'),
    ('Taylor County', '12123', '123'),
    ('Union County', '12125', '125'),
    ('Volusia County', '12127', '127'),
    ('Wakulla County', '12129', '129'),
    ('Walton County', '12131', '131'),
    ('Washington County', '12133', '133')
) AS county_data(name, fips_code, county_fips)
WHERE s.code = 'FL'
ON CONFLICT (state_id, fips_code) DO NOTHING;

-- Insert some major Florida cities (focused on property-relevant areas)
INSERT INTO public.cities (county_id, state_id, name)
SELECT 
    c.id,
    s.id,
    city_data.name
FROM public.states s
JOIN public.counties c ON c.state_id = s.id
JOIN (VALUES 
    ('Miami', 'Miami-Dade County'),
    ('Jacksonville', 'Duval County'),
    ('Tampa', 'Hillsborough County'),
    ('Orlando', 'Orange County'),
    ('St. Petersburg', 'Pinellas County'),
    ('Hialeah', 'Miami-Dade County'),
    ('Port Charlotte', 'Charlotte County'),
    ('Tallahassee', 'Leon County'),
    ('Fort Lauderdale', 'Broward County'),
    ('Cape Coral', 'Lee County'),
    ('Pembroke Pines', 'Broward County'),
    ('Hollywood', 'Broward County'),
    ('Gainesville', 'Alachua County'),
    ('Coral Springs', 'Broward County'),
    ('Clearwater', 'Pinellas County'),
    ('Miami Beach', 'Miami-Dade County'),
    ('Pompano Beach', 'Broward County'),
    ('West Palm Beach', 'Palm Beach County'),
    ('Lakeland', 'Polk County'),
    ('Davie', 'Broward County'),
    ('Miami Gardens', 'Miami-Dade County'),
    ('Boca Raton', 'Palm Beach County'),
    ('Sunrise', 'Broward County'),
    ('Brandon', 'Hillsborough County'),
    ('Palm Bay', 'Brevard County'),
    ('Deerfield Beach', 'Broward County'),
    ('Melbourne', 'Brevard County'),
    ('Boynton Beach', 'Palm Beach County'),
    ('Lauderhill', 'Broward County'),
    ('Weston', 'Broward County'),
    ('Kissimmee', 'Osceola County'),
    ('Homestead', 'Miami-Dade County'),
    ('Delray Beach', 'Palm Beach County'),
    ('Tamarac', 'Broward County'),
    ('Daytona Beach', 'Volusia County'),
    ('North Miami', 'Miami-Dade County'),
    ('Wellington', 'Palm Beach County'),
    ('Jupiter', 'Palm Beach County'),
    ('North Port', 'Sarasota County'),
    ('Ocala', 'Marion County'),
    ('Coconut Creek', 'Broward County'),
    ('Sanford', 'Seminole County'),
    ('Sarasota', 'Sarasota County'),
    ('Pensacola', 'Escambia County'),
    ('Bradenton', 'Manatee County'),
    ('Palm Beach Gardens', 'Palm Beach County'),
    ('Pinellas Park', 'Pinellas County'),
    ('Coral Gables', 'Miami-Dade County'),
    ('Doral', 'Miami-Dade County'),
    ('Bonita Springs', 'Lee County'),
    ('Apopka', 'Orange County'),
    ('Titusville', 'Brevard County'),
    ('North Miami Beach', 'Miami-Dade County'),
    ('Fort Myers', 'Lee County'),
    ('Aventura', 'Miami-Dade County'),
    ('Greenacres', 'Palm Beach County'),
    ('Largo', 'Pinellas County'),
    ('Lake Worth', 'Palm Beach County'),
    ('Sanford', 'Seminole County'),
    ('Altamonte Springs', 'Seminole County'),
    ('St. Cloud', 'Osceola County'),
    ('Margate', 'Broward County'),
    ('Ocoee', 'Orange County'),
    ('Winter Haven', 'Polk County'),
    ('Deltona', 'Volusia County'),
    ('Palm Coast', 'Flagler County'),
    ('Ormond Beach', 'Volusia County'),
    ('Port Orange', 'Volusia County'),
    ('Winter Park', 'Orange County'),
    ('Casselberry', 'Seminole County'),
    ('Winter Springs', 'Seminole County'),
    ('Clermont', 'Lake County'),
    ('Leesburg', 'Lake County'),
    ('Eustis', 'Lake County'),
    ('Mount Dora', 'Lake County')
) AS city_data(name, county_name) 
ON c.name = city_data.county_name
WHERE s.code = 'FL'
ON CONFLICT DO NOTHING;

-- Insert some key ZIP codes for Charlotte County (demo area)
INSERT INTO public.zip_codes (zip_code, city_id, county_id, state_id, primary_city, latitude, longitude)
SELECT 
    zip_data.zip_code,
    ci.id,
    co.id,
    s.id,
    zip_data.primary_city,
    zip_data.latitude,
    zip_data.longitude
FROM public.states s
JOIN public.counties co ON co.state_id = s.id AND co.name = 'Charlotte County'
JOIN public.cities ci ON ci.county_id = co.id AND ci.name = 'Port Charlotte'
CROSS JOIN (VALUES 
    ('33948', 'Port Charlotte', 26.9759, -82.0909),
    ('33952', 'Port Charlotte', 26.9870, -82.1101),
    ('33953', 'Port Charlotte', 26.9542, -82.0637),
    ('33954', 'Port Charlotte', 26.9734, -82.1234),
    ('33980', 'Port Charlotte', 26.9298, -82.0454),
    ('33981', 'Port Charlotte', 26.9876, -82.0789)
) AS zip_data(zip_code, primary_city, latitude, longitude)
WHERE s.code = 'FL'
ON CONFLICT (zip_code, city_id) DO NOTHING;

-- Enable RLS on geographic tables
ALTER TABLE public.states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.counties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zip_codes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for public read access (these are reference data)
CREATE POLICY "Public read access to states" ON public.states
    FOR SELECT USING (true);

CREATE POLICY "Public read access to counties" ON public.counties
    FOR SELECT USING (true);

CREATE POLICY "Public read access to cities" ON public.cities
    FOR SELECT USING (true);

CREATE POLICY "Public read access to zip codes" ON public.zip_codes
    FOR SELECT USING (true);

-- Grant SELECT permissions to authenticated users
GRANT SELECT ON public.states TO authenticated;
GRANT SELECT ON public.counties TO authenticated;
GRANT SELECT ON public.cities TO authenticated;
GRANT SELECT ON public.zip_codes TO authenticated;

-- Grant SELECT permissions to anonymous users (for forms)
GRANT SELECT ON public.states TO anon;
GRANT SELECT ON public.counties TO anon;
GRANT SELECT ON public.cities TO anon;
GRANT SELECT ON public.zip_codes TO anon;

-- Add helpful comments
COMMENT ON TABLE public.states IS 'US states with FIPS codes';
COMMENT ON TABLE public.counties IS 'Counties with FIPS codes for geographic standardization';
COMMENT ON TABLE public.cities IS 'Cities linked to counties and states';
COMMENT ON TABLE public.zip_codes IS 'ZIP codes with geographic relationships';

COMMENT ON COLUMN public.counties.fips_code IS 'Full 5-digit FIPS code (state + county)';
COMMENT ON COLUMN public.counties.state_fips IS '2-digit state FIPS code';
COMMENT ON COLUMN public.counties.county_fips IS '3-digit county FIPS code';