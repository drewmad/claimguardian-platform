-- Florida parcels data and contractor information
-- Handles property parcel data and licensed contractor information

-- Create external schema for Florida data
CREATE SCHEMA IF NOT EXISTS external_florida;
GRANT USAGE ON SCHEMA external_florida TO postgres, anon, authenticated, service_role;

-- Florida parcels table
CREATE TABLE IF NOT EXISTS external_florida.parcels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parcel_id TEXT UNIQUE NOT NULL,
  county_code TEXT NOT NULL,
  county_name TEXT NOT NULL,
  owner_name TEXT,
  owner_address TEXT,
  owner_city TEXT,
  owner_state TEXT,
  owner_zip TEXT,
  property_address TEXT,
  property_city TEXT,
  property_state TEXT DEFAULT 'FL',
  property_zip TEXT,
  legal_description TEXT,
  property_use_code TEXT,
  property_use_desc TEXT,
  tax_district TEXT,
  neighborhood_code TEXT,
  subdivision TEXT,
  year_built INTEGER,
  living_area_sqft INTEGER,
  total_area_sqft INTEGER,
  bedroom_count INTEGER,
  bathroom_count INTEGER,
  story_count NUMERIC(3,1),
  building_count INTEGER,
  land_value NUMERIC(12,2),
  building_value NUMERIC(12,2),
  total_value NUMERIC(12,2),
  assessed_value NUMERIC(12,2),
  taxable_value NUMERIC(12,2),
  sale_date DATE,
  sale_price NUMERIC(12,2),
  geometry JSONB,
  raw_data JSONB,
  source TEXT,
  source_updated DATE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Contractor companies table
CREATE TABLE IF NOT EXISTS public.contractor_companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  dba_names TEXT[],
  license_number TEXT UNIQUE NOT NULL,
  license_type TEXT NOT NULL,
  license_status TEXT NOT NULL,
  address TEXT,
  city TEXT,
  state TEXT DEFAULT 'FL',
  zip TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  services TEXT[],
  insurance_info JSONB,
  rating NUMERIC(2,1),
  review_count INTEGER DEFAULT 0,
  verified BOOLEAN DEFAULT false,
  verified_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Florida contractor license raw data
CREATE TABLE IF NOT EXISTS external_florida.contractor_licenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  license_number TEXT UNIQUE NOT NULL,
  licensee_name TEXT NOT NULL,
  dba_name TEXT,
  license_type TEXT,
  license_status TEXT,
  status_effective_date DATE,
  original_license_date DATE,
  expiration_date DATE,
  primary_qualifying_individual TEXT,
  address_line_1 TEXT,
  address_line_2 TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  county TEXT,
  phone TEXT,
  email TEXT,
  insurance_general_liability BOOLEAN,
  insurance_workers_comp BOOLEAN,
  insurance_exemption BOOLEAN,
  bond_amount NUMERIC(10,2),
  bond_company TEXT,
  classifications TEXT[],
  raw_data JSONB,
  last_updated TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create parcel search function
CREATE OR REPLACE FUNCTION external_florida.search_parcels(
  p_address TEXT DEFAULT NULL,
  p_owner_name TEXT DEFAULT NULL,
  p_parcel_id TEXT DEFAULT NULL,
  p_county TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  parcel_id TEXT,
  county_name TEXT,
  owner_name TEXT,
  property_address TEXT,
  property_city TEXT,
  property_zip TEXT,
  year_built INTEGER,
  total_value NUMERIC,
  match_score REAL
) AS $$
BEGIN
  RETURN QUERY
  WITH scored_results AS (
    SELECT 
      p.parcel_id,
      p.county_name,
      p.owner_name,
      p.property_address,
      p.property_city,
      p.property_zip,
      p.year_built,
      p.total_value,
      (
        CASE WHEN p_address IS NOT NULL AND p.property_address ILIKE '%' || p_address || '%' THEN 0.4 ELSE 0 END +
        CASE WHEN p_owner_name IS NOT NULL AND p.owner_name ILIKE '%' || p_owner_name || '%' THEN 0.3 ELSE 0 END +
        CASE WHEN p_parcel_id IS NOT NULL AND p.parcel_id = p_parcel_id THEN 0.2 ELSE 0 END +
        CASE WHEN p_county IS NOT NULL AND p.county_name ILIKE '%' || p_county || '%' THEN 0.1 ELSE 0 END
      ) AS match_score
    FROM external_florida.parcels p
    WHERE (
      (p_address IS NULL OR p.property_address ILIKE '%' || p_address || '%') AND
      (p_owner_name IS NULL OR p.owner_name ILIKE '%' || p_owner_name || '%') AND
      (p_parcel_id IS NULL OR p.parcel_id = p_parcel_id) AND
      (p_county IS NULL OR p.county_name ILIKE '%' || p_county || '%')
    )
  )
  SELECT * FROM scored_results
  WHERE match_score > 0
  ORDER BY match_score DESC, property_address
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create contractor search function
CREATE OR REPLACE FUNCTION public.search_contractors(
  p_service TEXT DEFAULT NULL,
  p_city TEXT DEFAULT NULL,
  p_license_number TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  license_number TEXT,
  license_type TEXT,
  license_status TEXT,
  city TEXT,
  services TEXT[],
  rating NUMERIC,
  verified BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    c.license_number,
    c.license_type,
    c.license_status,
    c.city,
    c.services,
    c.rating,
    c.verified
  FROM public.contractor_companies c
  WHERE (
    (p_service IS NULL OR p_service = ANY(c.services)) AND
    (p_city IS NULL OR c.city ILIKE '%' || p_city || '%') AND
    (p_license_number IS NULL OR c.license_number = p_license_number) AND
    c.license_status = 'Active'
  )
  ORDER BY c.verified DESC, c.rating DESC NULLS LAST, c.name
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS policies
ALTER TABLE external_florida.parcels ENABLE ROW LEVEL SECURITY;
ALTER TABLE external_florida.contractor_licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contractor_companies ENABLE ROW LEVEL SECURITY;

-- Anyone can view parcel data
CREATE POLICY "Public read access" ON external_florida.parcels
  FOR SELECT USING (true);

-- Service role can manage parcel data
CREATE POLICY "Service role manage" ON external_florida.parcels
  USING (auth.role() = 'service_role');

-- Anyone can view contractor licenses
CREATE POLICY "Public read access" ON external_florida.contractor_licenses
  FOR SELECT USING (true);

-- Service role can manage contractor licenses
CREATE POLICY "Service role manage" ON external_florida.contractor_licenses
  USING (auth.role() = 'service_role');

-- Anyone can view verified contractors
CREATE POLICY "Public view verified contractors" ON public.contractor_companies
  FOR SELECT USING (verified = true);

-- Service role full access
CREATE POLICY "Service role manage" ON public.contractor_companies
  USING (auth.role() = 'service_role');

-- Add triggers
CREATE TRIGGER set_updated_at_parcels
  BEFORE UPDATE ON external_florida.parcels
  FOR EACH ROW
  EXECUTE FUNCTION core.set_updated_at();

CREATE TRIGGER set_updated_at_contractor_companies
  BEFORE UPDATE ON public.contractor_companies
  FOR EACH ROW
  EXECUTE FUNCTION core.set_updated_at();

-- Create indexes
CREATE INDEX idx_parcels_parcel_id ON external_florida.parcels(parcel_id);
CREATE INDEX idx_parcels_county ON external_florida.parcels(county_code, county_name);
CREATE INDEX idx_parcels_address ON external_florida.parcels(property_address, property_city);
CREATE INDEX idx_parcels_owner ON external_florida.parcels(owner_name);
CREATE INDEX idx_contractor_licenses_number ON external_florida.contractor_licenses(license_number);
CREATE INDEX idx_contractor_licenses_status ON external_florida.contractor_licenses(license_status);
CREATE INDEX idx_contractor_companies_license ON public.contractor_companies(license_number);
CREATE INDEX idx_contractor_companies_status ON public.contractor_companies(license_status);
CREATE INDEX idx_contractor_companies_services ON public.contractor_companies USING GIN(services);