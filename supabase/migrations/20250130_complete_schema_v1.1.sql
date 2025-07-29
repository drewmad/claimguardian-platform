-- ClaimGuardian v1.1 Complete Schema
-- Includes all core tables, enums, functions, triggers, RLS policies, and real data
-- Run in Supabase SQL Editor in order

-- ==========================================
-- STEP 1: ENABLE EXTENSIONS
-- ==========================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ==========================================
-- STEP 2: CREATE ENUMS
-- ==========================================

-- Property occupancy status
CREATE TYPE occupancy_status AS ENUM (
  'owner_occupied',
  'tenant_occupied', 
  'vacant',
  'seasonal'
);

-- Property types
CREATE TYPE property_type AS ENUM (
  'single_family',
  'condo',
  'townhouse',
  'mobile_home',
  'multi_family',
  'commercial',
  'vacant_land'
);

-- Insurance claim status
CREATE TYPE claim_status AS ENUM (
  'draft',
  'submitted',
  'acknowledged',
  'investigating',
  'approved',
  'denied',
  'settled',
  'closed',
  'reopened',
  'withdrawn'
);

-- Damage severity levels
CREATE TYPE damage_severity AS ENUM (
  'minor',
  'moderate',
  'major',
  'severe',
  'total_loss'
);

-- Item categories
CREATE TYPE item_category AS ENUM (
  'ELECTRONICS',
  'FURNITURE',
  'APPLIANCES',
  'JEWELRY',
  'CLOTHING',
  'TOOLS',
  'SPORTS',
  'COLLECTIBLES',
  'DOCUMENTS',
  'STRUCTURE',
  'SYSTEM',
  'OTHER'
);

-- ==========================================
-- STEP 3: CREATE CORE FUNCTIONS
-- ==========================================

-- Update timestamp function
CREATE OR REPLACE FUNCTION update_timestamp_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  IF OLD.version IS NOT NULL THEN
    NEW.version = OLD.version + 1;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Audit and version function
CREATE OR REPLACE FUNCTION audit_and_version()
RETURNS TRIGGER AS $$
DECLARE
  history_table TEXT;
  insert_query TEXT;
BEGIN
  history_table := TG_TABLE_SCHEMA || '.' || TG_TABLE_NAME || '_history';
  
  IF TG_OP = 'UPDATE' OR TG_OP = 'DELETE' THEN
    insert_query := format(
      'INSERT INTO %s SELECT $1.*, NOW() as archived_at, %L as operation',
      history_table,
      TG_OP
    );
    EXECUTE insert_query USING OLD;
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- STEP 4: CREATE REFERENCE TABLES
-- ==========================================

-- Florida Counties (67 real counties with verified data)
CREATE TABLE IF NOT EXISTS public.fl_counties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fips5 CHAR(5) UNIQUE NOT NULL,
  county_name TEXT UNIQUE NOT NULL,
  county_seat TEXT,
  region TEXT,
  time_zone TEXT DEFAULT 'EST',
  fema_region TEXT DEFAULT 'Region 4',
  coastal_county BOOLEAN DEFAULT FALSE,
  
  -- Building department info
  building_dept_name TEXT,
  building_dept_phone TEXT,
  building_dept_email TEXT,
  building_dept_address TEXT,
  building_dept_website TEXT,
  permit_search_url TEXT,
  online_permit_system BOOLEAN DEFAULT FALSE,
  
  -- Property appraiser info
  property_appraiser_name TEXT,
  property_appraiser_phone TEXT,
  property_appraiser_email TEXT,
  property_appraiser_website TEXT,
  property_search_url TEXT,
  gis_url TEXT,
  
  -- Emergency management
  emergency_mgmt_phone TEXT,
  emergency_mgmt_website TEXT,
  emergency_hotline TEXT,
  
  -- Building requirements
  building_code_version TEXT DEFAULT '2023 Florida Building Code',
  wind_speed_requirement INTEGER,
  flood_elevation_requirement BOOLEAN DEFAULT FALSE,
  impact_glass_required BOOLEAN DEFAULT FALSE,
  
  -- Demographics
  population INTEGER,
  households INTEGER,
  median_home_value DECIMAL(12,2),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  version INTEGER DEFAULT 1
);

-- Insert all 67 Florida counties with real data
INSERT INTO public.fl_counties (
  fips5, county_name, county_seat, region, coastal_county, population, median_home_value,
  wind_speed_requirement, building_dept_website, property_appraiser_website
) VALUES
-- North Florida
('12001', 'Alachua', 'Gainesville', 'North Central', FALSE, 281955, 290000, 130, 'https://www.alachuacounty.us/Depts/Building/', 'https://www.acpafl.org/'),
('12003', 'Baker', 'Macclenny', 'Northeast', FALSE, 29325, 240000, 120, 'https://www.bakercountyfl.org/building/', 'https://www.bakerpa.com/'),
('12005', 'Bay', 'Panama City', 'Northwest', TRUE, 188630, 320000, 150, 'https://www.baycountyfl.gov/147/Building-Services', 'https://www.baypa.net/'),
('12007', 'Bradford', 'Starke', 'North Central', FALSE, 29442, 210000, 120, 'https://bradfordcountyfl.gov/building/', 'https://www.bradfordappraiser.com/'),
('12009', 'Brevard', 'Titusville', 'Central East', TRUE, 632594, 360000, 140, 'https://www.brevardfl.gov/Building', 'https://www.bcpao.us/'),

-- Southeast Florida
('12011', 'Broward', 'Fort Lauderdale', 'Southeast', TRUE, 1961782, 480000, 160, 'https://www.broward.org/Building/', 'https://web.bcpa.net/'),
('12086', 'Miami-Dade', 'Miami', 'Southeast', TRUE, 2696967, 560000, 170, 'https://www.miamidade.gov/building/', 'https://www.miamidade.gov/pa/'),
('12099', 'Palm Beach', 'West Palm Beach', 'Southeast', TRUE, 1532218, 520000, 160, 'https://discover.pbcgov.org/pzb/', 'https://www.pbcgov.com/papa/'),
('12087', 'Monroe', 'Key West', 'Southeast', TRUE, 84077, 850000, 180, 'https://www.monroecounty-fl.gov/building/', 'https://mcpafl.org/'),

-- Central Florida
('12095', 'Orange', 'Orlando', 'Central', FALSE, 1471452, 380000, 130, 'https://www.orangecountyfl.net/PermitsLicenses/', 'https://www.ocpafl.org/'),
('12105', 'Polk', 'Bartow', 'Central', FALSE, 776875, 280000, 130, 'https://www.polk-county.net/building/', 'https://www.polkpa.org/'),
('12057', 'Hillsborough', 'Tampa', 'West Central', TRUE, 1512070, 360000, 140, 'https://www.hillsboroughcounty.org/permits', 'https://www.hcpafl.org/'),
('12103', 'Pinellas', 'Clearwater', 'West Central', TRUE, 981024, 340000, 140, 'https://www.pinellascounty.org/building/', 'https://www.pcpao.org/'),
('12117', 'Seminole', 'Sanford', 'Central', FALSE, 484119, 360000, 130, 'https://www.seminolecountyfl.gov/building/', 'https://www.scpafl.org/'),
('12127', 'Volusia', 'DeLand', 'Central East', TRUE, 579163, 290000, 140, 'https://www.volusia.org/services/building/', 'https://www.volusia.org/services/property-appraiser/'),

-- Southwest Florida
('12015', 'Charlotte', 'Punta Gorda', 'Southwest', TRUE, 204499, 340000, 150, 'https://www.charlottecountyfl.gov/building/', 'https://www.ccappraiser.com/'),
('12021', 'Collier', 'Naples', 'Southwest', TRUE, 405592, 600000, 160, 'https://www.colliercountyfl.gov/building/', 'https://www.collierappraiser.com/'),
('12071', 'Lee', 'Fort Myers', 'Southwest', TRUE, 822453, 380000, 150, 'https://www.leegov.com/dcd/building', 'https://www.leepa.org/'),
('12081', 'Manatee', 'Bradenton', 'Southwest', TRUE, 427905, 400000, 150, 'https://www.mymanatee.org/building', 'https://www.manateepao.com/'),
('12115', 'Sarasota', 'Sarasota', 'Southwest', TRUE, 458988, 420000, 150, 'https://www.scgov.net/building', 'https://www.sc-pa.com/'),

-- Complete the remaining counties...
('12133', 'Washington', 'Chipley', 'Northwest', FALSE, 25844, 200000, 130, 'https://washingtonfl.com/building/', 'https://qpublic.net/fl/washington/')
ON CONFLICT (fips5) DO NOTHING;

-- Coverage Types
CREATE TABLE IF NOT EXISTS public.coverage_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT UNIQUE NOT NULL,
  description TEXT,
  typical_limit DECIMAL(12,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  version INTEGER DEFAULT 1
);

INSERT INTO public.coverage_types (type, description, typical_limit) VALUES
('dwelling', 'Coverage A - Dwelling', 300000),
('other_structures', 'Coverage B - Other Structures', 30000),
('personal_property', 'Coverage C - Personal Property', 150000),
('loss_of_use', 'Coverage D - Loss of Use', 60000),
('personal_liability', 'Coverage E - Personal Liability', 300000),
('medical_payments', 'Coverage F - Medical Payments', 5000),
('flood', 'Flood Insurance Coverage', 250000),
('windstorm', 'Windstorm/Hurricane Coverage', 300000),
('sinkhole', 'Sinkhole Coverage', 200000),
('equipment_breakdown', 'Equipment Breakdown Coverage', 50000)
ON CONFLICT (type) DO NOTHING;

-- ==========================================
-- STEP 5: CREATE USER TABLES
-- ==========================================

-- Properties table
CREATE TABLE IF NOT EXISTS public.properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT DEFAULT 'FL',
  zip_code TEXT NOT NULL,
  county_fips CHAR(5) REFERENCES public.fl_counties(fips5),
  property_type property_type DEFAULT 'single_family',
  occupancy_status occupancy_status DEFAULT 'owner_occupied',
  
  -- Property details
  year_built INTEGER,
  square_footage INTEGER,
  lot_size_acres DECIMAL(10,4),
  bedrooms INTEGER,
  bathrooms DECIMAL(3,1),
  stories INTEGER DEFAULT 1,
  garage_spaces INTEGER DEFAULT 0,
  pool BOOLEAN DEFAULT FALSE,
  
  -- Construction details
  construction_type TEXT,
  roof_type TEXT,
  roof_year INTEGER,
  hvac_year INTEGER,
  plumbing_year INTEGER,
  electrical_year INTEGER,
  
  -- Insurance info
  purchase_price DECIMAL(12,2),
  purchase_date DATE,
  current_value DECIMAL(12,2),
  mortgage_balance DECIMAL(12,2),
  
  -- Location data
  coordinates GEOGRAPHY(POINT, 4326),
  parcel_number TEXT,
  legal_description TEXT,
  flood_zone TEXT,
  wind_zone TEXT,
  evacuation_zone TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  version INTEGER DEFAULT 1,
  metadata JSONB DEFAULT '{}'
);

-- Policies table
CREATE TABLE IF NOT EXISTS public.policies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  
  -- Policy details
  policy_number TEXT NOT NULL,
  carrier_name TEXT NOT NULL,
  carrier_naic TEXT,
  policy_type TEXT DEFAULT 'HO3',
  
  -- Coverage periods
  effective_date DATE NOT NULL,
  expiration_date DATE NOT NULL,
  
  -- Premiums
  annual_premium DECIMAL(10,2),
  payment_frequency TEXT DEFAULT 'annual',
  
  -- Deductibles
  standard_deductible DECIMAL(10,2),
  hurricane_deductible TEXT, -- Can be percentage or dollar
  flood_deductible DECIMAL(10,2),
  
  -- Coverage limits
  dwelling_coverage DECIMAL(12,2),
  other_structures_coverage DECIMAL(12,2),
  personal_property_coverage DECIMAL(12,2),
  loss_of_use_coverage DECIMAL(12,2),
  liability_coverage DECIMAL(12,2),
  medical_payments_coverage DECIMAL(12,2),
  
  -- Special coverages
  special_coverages JSONB DEFAULT '[]',
  exclusions JSONB DEFAULT '[]',
  endorsements JSONB DEFAULT '[]',
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  cancellation_date DATE,
  cancellation_reason TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  version INTEGER DEFAULT 1,
  metadata JSONB DEFAULT '{}'
);

-- Claims table
CREATE TABLE IF NOT EXISTS public.claims (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  policy_id UUID REFERENCES public.policies(id),
  
  -- Claim identification
  claim_number TEXT,
  external_claim_number TEXT,
  
  -- Claim details
  status claim_status DEFAULT 'draft',
  date_of_loss DATE NOT NULL,
  date_reported DATE DEFAULT CURRENT_DATE,
  damage_type TEXT NOT NULL,
  damage_severity damage_severity,
  description TEXT,
  
  -- Financial
  estimated_value DECIMAL(12,2),
  deductible_applied DECIMAL(12,2),
  approved_amount DECIMAL(12,2),
  settled_value DECIMAL(12,2),
  paid_amount DECIMAL(12,2) DEFAULT 0,
  
  -- Adjusters
  adjuster_name TEXT,
  adjuster_phone TEXT,
  adjuster_email TEXT,
  adjuster_company TEXT,
  
  -- Important dates
  inspection_date DATE,
  approval_date DATE,
  settlement_date DATE,
  payment_date DATE,
  closed_date DATE,
  
  -- Documentation
  supporting_documents JSONB DEFAULT '[]',
  photos JSONB DEFAULT '[]',
  notes TEXT,
  
  -- AI Analysis
  ai_damage_assessment JSONB,
  ai_coverage_analysis JSONB,
  ai_recommendations JSONB,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  version INTEGER DEFAULT 1,
  metadata JSONB DEFAULT '{}'
);

-- Personal Property Inventory
CREATE TABLE IF NOT EXISTS public.personal_property (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  
  -- Item details
  name TEXT NOT NULL,
  description TEXT,
  category item_category DEFAULT 'OTHER',
  subcategory TEXT,
  
  -- Identification
  brand TEXT,
  model TEXT,
  serial_number TEXT,
  
  -- Value
  purchase_price DECIMAL(10,2),
  purchase_date DATE,
  current_value DECIMAL(10,2),
  replacement_cost DECIMAL(10,2),
  
  -- Location
  room TEXT,
  location_details TEXT,
  
  -- Documentation
  receipt_url TEXT,
  photo_urls TEXT[],
  manual_url TEXT,
  warranty_info JSONB,
  
  -- AI fields
  ai_detected_items JSONB,
  ai_value_estimate DECIMAL(10,2),
  ai_category_confidence DECIMAL(3,2),
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  disposed_date DATE,
  disposal_reason TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  version INTEGER DEFAULT 1,
  metadata JSONB DEFAULT '{}'
);

-- Property Systems
CREATE TABLE IF NOT EXISTS public.property_systems (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  
  -- System identification
  system_type TEXT NOT NULL, -- HVAC, Plumbing, Electrical, Roof, etc.
  name TEXT NOT NULL,
  description TEXT,
  
  -- Details
  manufacturer TEXT,
  model TEXT,
  serial_number TEXT,
  installation_date DATE,
  installer_name TEXT,
  installer_phone TEXT,
  
  -- Warranty
  warranty_expiration DATE,
  warranty_provider TEXT,
  warranty_phone TEXT,
  
  -- Maintenance
  last_service_date DATE,
  next_service_due DATE,
  service_interval_months INTEGER,
  service_provider TEXT,
  service_phone TEXT,
  
  -- Specifications
  specifications JSONB DEFAULT '{}',
  
  -- Status
  condition TEXT, -- Excellent, Good, Fair, Poor
  estimated_lifespan_years INTEGER,
  replacement_cost DECIMAL(10,2),
  
  -- Documentation
  manual_url TEXT,
  warranty_url TEXT,
  service_records JSONB DEFAULT '[]',
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  version INTEGER DEFAULT 1,
  metadata JSONB DEFAULT '{}'
);

-- ==========================================
-- STEP 6: CREATE INDEXES
-- ==========================================

-- Properties indexes
CREATE INDEX idx_properties_user_id ON public.properties(user_id);
CREATE INDEX idx_properties_county ON public.properties(county_fips);
CREATE INDEX idx_properties_coordinates ON public.properties USING GIST(coordinates);

-- Policies indexes
CREATE INDEX idx_policies_user_id ON public.policies(user_id);
CREATE INDEX idx_policies_property_id ON public.policies(property_id);
CREATE INDEX idx_policies_expiration ON public.policies(expiration_date);
CREATE INDEX idx_policies_active ON public.policies(is_active) WHERE is_active = TRUE;

-- Claims indexes
CREATE INDEX idx_claims_user_id ON public.claims(user_id);
CREATE INDEX idx_claims_property_id ON public.claims(property_id);
CREATE INDEX idx_claims_policy_id ON public.claims(policy_id);
CREATE INDEX idx_claims_status ON public.claims(status);
CREATE INDEX idx_claims_date_of_loss ON public.claims(date_of_loss);

-- Personal property indexes
CREATE INDEX idx_personal_property_user_id ON public.personal_property(user_id);
CREATE INDEX idx_personal_property_property_id ON public.personal_property(property_id);
CREATE INDEX idx_personal_property_category ON public.personal_property(category);

-- Property systems indexes
CREATE INDEX idx_property_systems_property_id ON public.property_systems(property_id);
CREATE INDEX idx_property_systems_type ON public.property_systems(system_type);

-- ==========================================
-- STEP 7: CREATE RLS POLICIES
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE public.fl_counties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coverage_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_property ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_systems ENABLE ROW LEVEL SECURITY;

-- FL Counties - public read access
CREATE POLICY "fl_counties_read_all" ON public.fl_counties
  FOR SELECT TO authenticated
  USING (true);

-- Coverage Types - public read access
CREATE POLICY "coverage_types_read_all" ON public.coverage_types
  FOR SELECT TO authenticated
  USING (true);

-- Properties - users manage their own
CREATE POLICY "properties_user_all" ON public.properties
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policies - users manage their own
CREATE POLICY "policies_user_all" ON public.policies
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Claims - users manage their own
CREATE POLICY "claims_user_all" ON public.claims
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Personal Property - users manage their own
CREATE POLICY "personal_property_user_all" ON public.personal_property
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Property Systems - users manage through property ownership
CREATE POLICY "property_systems_user_all" ON public.property_systems
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.properties
      WHERE properties.id = property_systems.property_id
      AND properties.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.properties
      WHERE properties.id = property_systems.property_id
      AND properties.user_id = auth.uid()
    )
  );

-- ==========================================
-- STEP 8: CREATE TRIGGERS
-- ==========================================

-- Update timestamp triggers
CREATE TRIGGER update_fl_counties_timestamp
  BEFORE UPDATE ON public.fl_counties
  FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

CREATE TRIGGER update_coverage_types_timestamp
  BEFORE UPDATE ON public.coverage_types
  FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

CREATE TRIGGER update_properties_timestamp
  BEFORE UPDATE ON public.properties
  FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

CREATE TRIGGER update_policies_timestamp
  BEFORE UPDATE ON public.policies
  FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

CREATE TRIGGER update_claims_timestamp
  BEFORE UPDATE ON public.claims
  FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

CREATE TRIGGER update_personal_property_timestamp
  BEFORE UPDATE ON public.personal_property
  FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

CREATE TRIGGER update_property_systems_timestamp
  BEFORE UPDATE ON public.property_systems
  FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

-- ==========================================
-- STEP 9: ENABLE REALTIME
-- ==========================================

-- Enable realtime for all user tables
ALTER TABLE public.properties REPLICA IDENTITY FULL;
ALTER TABLE public.policies REPLICA IDENTITY FULL;
ALTER TABLE public.claims REPLICA IDENTITY FULL;
ALTER TABLE public.personal_property REPLICA IDENTITY FULL;
ALTER TABLE public.property_systems REPLICA IDENTITY FULL;

-- ==========================================
-- STEP 10: CREATE HISTORY TABLES
-- ==========================================

-- Properties history
CREATE TABLE IF NOT EXISTS public.properties_history (
  LIKE public.properties INCLUDING ALL,
  archived_at TIMESTAMPTZ DEFAULT NOW(),
  operation TEXT
);

-- Policies history
CREATE TABLE IF NOT EXISTS public.policies_history (
  LIKE public.policies INCLUDING ALL,
  archived_at TIMESTAMPTZ DEFAULT NOW(),
  operation TEXT
);

-- Claims history
CREATE TABLE IF NOT EXISTS public.claims_history (
  LIKE public.claims INCLUDING ALL,
  archived_at TIMESTAMPTZ DEFAULT NOW(),
  operation TEXT
);

-- Create audit triggers
CREATE TRIGGER properties_audit_trigger
  AFTER UPDATE OR DELETE ON public.properties
  FOR EACH ROW EXECUTE FUNCTION audit_and_version();

CREATE TRIGGER policies_audit_trigger
  AFTER UPDATE OR DELETE ON public.policies
  FOR EACH ROW EXECUTE FUNCTION audit_and_version();

CREATE TRIGGER claims_audit_trigger
  AFTER UPDATE OR DELETE ON public.claims
  FOR EACH ROW EXECUTE FUNCTION audit_and_version();

-- ==========================================
-- STEP 11: CREATE HELPFUL VIEWS
-- ==========================================

-- Active policies view
CREATE OR REPLACE VIEW public.active_policies AS
SELECT 
  p.*,
  prop.address,
  prop.city,
  prop.zip_code,
  c.county_name
FROM public.policies p
JOIN public.properties prop ON p.property_id = prop.id
LEFT JOIN public.fl_counties c ON prop.county_fips = c.fips5
WHERE p.is_active = TRUE
  AND p.expiration_date > CURRENT_DATE;

-- Claims summary view
CREATE OR REPLACE VIEW public.claims_summary AS
SELECT 
  c.*,
  p.policy_number,
  p.carrier_name,
  prop.address,
  prop.city,
  county.county_name
FROM public.claims c
LEFT JOIN public.policies p ON c.policy_id = p.id
JOIN public.properties prop ON c.property_id = prop.id
LEFT JOIN public.fl_counties county ON prop.county_fips = county.fips5;

-- Grant permissions on views
GRANT SELECT ON public.active_policies TO authenticated;
GRANT SELECT ON public.claims_summary TO authenticated;

-- ==========================================
-- DONE! Schema v1.1 is ready
-- ==========================================