-- ClaimGuardian Property Data Hierarchy Schema
-- ============================================
-- This schema implements a comprehensive property data model with:
-- - Hierarchical structure for properties and sub-entities
-- - JSONB metadata fields for flexible data storage
-- - Immutable history tables with versioning
-- - Row-Level Security (RLS) for multi-user access
-- - Optimized indexes for performance

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search

-- Create enum types
CREATE TYPE property_type AS ENUM ('residential', 'commercial', 'land', 'mixed_use');
CREATE TYPE occupancy_status AS ENUM ('owner_occupied', 'tenant_occupied', 'vacant', 'seasonal');
CREATE TYPE damage_severity AS ENUM ('minor', 'moderate', 'major', 'total_loss');
CREATE TYPE claim_status AS ENUM ('draft', 'submitted', 'acknowledged', 'investigating', 'approved', 'denied', 'settled', 'appealed', 'closed');

-- ============================================
-- ROOT ENTITY: Properties
-- ============================================
CREATE TABLE IF NOT EXISTS public.properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Core fields
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL DEFAULT 'FL',
    zip_code TEXT NOT NULL,
    county TEXT NOT NULL,
    
    -- Geospatial
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    location GEOGRAPHY(POINT, 4326),
    parcel_number TEXT,
    
    -- Property details
    property_type property_type NOT NULL,
    year_built INTEGER,
    square_footage INTEGER,
    lot_size_acres DECIMAL(10, 4),
    occupancy_status occupancy_status,
    
    -- Financial
    purchase_date DATE,
    purchase_price DECIMAL(12, 2),
    current_value DECIMAL(12, 2),
    
    -- Flexible metadata
    metadata JSONB DEFAULT '{}',
    external_ids JSONB DEFAULT '{}', -- Store IDs from various data sources
    
    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    version INTEGER DEFAULT 1,
    
    -- Constraints
    CONSTRAINT valid_location CHECK (
        (latitude IS NULL AND longitude IS NULL) OR 
        (latitude IS NOT NULL AND longitude IS NOT NULL)
    )
);

-- Create spatial index
CREATE INDEX idx_properties_location ON properties USING GIST(location);

-- ============================================
-- CHILD ENTITY: Land Information
-- ============================================
CREATE TABLE IF NOT EXISTS public.property_land (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    
    -- Zoning and use
    zoning_code TEXT,
    zoning_description TEXT,
    land_use_code TEXT,
    land_use_description TEXT,
    
    -- Environmental
    flood_zone TEXT,
    elevation_feet DECIMAL(8, 2),
    soil_type TEXT,
    wetlands_present BOOLEAN DEFAULT FALSE,
    
    -- Boundaries and survey
    legal_description TEXT,
    survey_date DATE,
    survey_document_url TEXT,
    
    -- Assessments
    assessed_land_value DECIMAL(12, 2),
    assessment_year INTEGER,
    
    -- Flexible metadata
    gis_data JSONB DEFAULT '{}',
    environmental_data JSONB DEFAULT '{}',
    
    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    version INTEGER DEFAULT 1,
    
    CONSTRAINT unique_property_land UNIQUE(property_id)
);

-- ============================================
-- CHILD ENTITY: Structures
-- ============================================
CREATE TABLE IF NOT EXISTS public.property_structures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    
    -- Structure identification
    structure_type TEXT NOT NULL, -- 'main_house', 'garage', 'shed', etc.
    structure_name TEXT,
    
    -- Physical characteristics
    square_footage INTEGER,
    stories INTEGER,
    bedrooms INTEGER,
    bathrooms DECIMAL(3, 1),
    
    -- Construction
    construction_type TEXT,
    foundation_type TEXT,
    exterior_walls TEXT,
    roof_type TEXT,
    roof_material TEXT,
    roof_age_years INTEGER,
    
    -- Condition
    overall_condition TEXT,
    last_renovation_date DATE,
    
    -- Flexible metadata
    construction_details JSONB DEFAULT '{}',
    features JSONB DEFAULT '{}',
    
    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    version INTEGER DEFAULT 1
);

-- ============================================
-- CHILD ENTITY: Systems & Components
-- ============================================
CREATE TABLE IF NOT EXISTS public.property_systems (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    structure_id UUID NOT NULL REFERENCES property_structures(id) ON DELETE CASCADE,
    
    -- System identification
    system_type TEXT NOT NULL, -- 'hvac', 'electrical', 'plumbing', etc.
    system_name TEXT,
    
    -- Details
    manufacturer TEXT,
    model_number TEXT,
    serial_number TEXT,
    install_date DATE,
    warranty_expiration DATE,
    
    -- Condition and maintenance
    last_inspection_date DATE,
    last_service_date DATE,
    condition_rating INTEGER CHECK (condition_rating BETWEEN 1 AND 10),
    
    -- Specifications
    specifications JSONB DEFAULT '{}',
    maintenance_history JSONB DEFAULT '[]',
    
    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    version INTEGER DEFAULT 1
);

-- ============================================
-- CHILD ENTITY: Insurance Policies
-- ============================================
CREATE TABLE IF NOT EXISTS public.property_insurance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    
    -- Policy identification
    carrier_name TEXT NOT NULL,
    policy_number TEXT NOT NULL,
    policy_type TEXT NOT NULL, -- 'homeowners', 'flood', 'windstorm', etc.
    
    -- Coverage periods
    effective_date DATE NOT NULL,
    expiration_date DATE NOT NULL,
    
    -- Coverage details
    dwelling_coverage DECIMAL(12, 2),
    personal_property_coverage DECIMAL(12, 2),
    liability_coverage DECIMAL(12, 2),
    deductible DECIMAL(10, 2),
    hurricane_deductible DECIMAL(10, 2),
    
    -- Premium information
    annual_premium DECIMAL(10, 2),
    payment_frequency TEXT,
    
    -- Documents and metadata
    policy_document_url TEXT,
    coverage_details JSONB DEFAULT '{}',
    exclusions JSONB DEFAULT '[]',
    endorsements JSONB DEFAULT '[]',
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    cancellation_date DATE,
    cancellation_reason TEXT,
    
    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    version INTEGER DEFAULT 1
);

-- ============================================
-- CHILD ENTITY: Claims
-- ============================================
CREATE TABLE IF NOT EXISTS public.property_claims (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    insurance_id UUID REFERENCES property_insurance(id) ON DELETE SET NULL,
    
    -- Claim identification
    claim_number TEXT,
    adjuster_name TEXT,
    adjuster_phone TEXT,
    adjuster_email TEXT,
    
    -- Claim details
    loss_date DATE NOT NULL,
    report_date DATE NOT NULL,
    claim_type TEXT NOT NULL, -- 'hurricane', 'flood', 'fire', etc.
    description TEXT,
    
    -- Status tracking
    status claim_status NOT NULL DEFAULT 'draft',
    status_history JSONB DEFAULT '[]',
    
    -- Financial
    amount_claimed DECIMAL(12, 2),
    amount_approved DECIMAL(12, 2),
    amount_paid DECIMAL(12, 2),
    deductible_applied DECIMAL(10, 2),
    
    -- Evidence and documentation
    evidence_urls JSONB DEFAULT '[]',
    correspondence JSONB DEFAULT '[]',
    notes JSONB DEFAULT '[]',
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    version INTEGER DEFAULT 1
);

-- ============================================
-- CHILD ENTITY: Damage Assessments
-- ============================================
CREATE TABLE IF NOT EXISTS public.property_damage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    claim_id UUID REFERENCES property_claims(id) ON DELETE SET NULL,
    structure_id UUID REFERENCES property_structures(id) ON DELETE SET NULL,
    
    -- Assessment details
    assessment_date DATE NOT NULL,
    assessor_name TEXT,
    assessor_type TEXT, -- 'self', 'adjuster', 'contractor', 'engineer'
    
    -- Damage information
    damage_type TEXT NOT NULL,
    damage_severity damage_severity NOT NULL,
    damage_description TEXT,
    
    -- Location within property
    location_description TEXT,
    affected_rooms JSONB DEFAULT '[]',
    affected_systems JSONB DEFAULT '[]',
    
    -- Documentation
    photo_urls JSONB DEFAULT '[]',
    video_urls JSONB DEFAULT '[]',
    report_url TEXT,
    
    -- Repair estimates
    estimated_repair_cost DECIMAL(12, 2),
    actual_repair_cost DECIMAL(12, 2),
    repair_completed_date DATE,
    
    -- Metadata
    measurements JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    
    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    version INTEGER DEFAULT 1
);

-- ============================================
-- CHILD ENTITY: Contractors & Repairs
-- ============================================
CREATE TABLE IF NOT EXISTS public.property_contractors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    claim_id UUID REFERENCES property_claims(id) ON DELETE SET NULL,
    damage_id UUID REFERENCES property_damage(id) ON DELETE SET NULL,
    
    -- Contractor information
    company_name TEXT NOT NULL,
    contact_name TEXT,
    license_number TEXT,
    phone TEXT,
    email TEXT,
    
    -- Work details
    work_type TEXT NOT NULL,
    scope_of_work TEXT,
    
    -- Timeline
    estimate_date DATE,
    start_date DATE,
    completion_date DATE,
    warranty_expiration DATE,
    
    -- Financial
    estimate_amount DECIMAL(12, 2),
    contract_amount DECIMAL(12, 2),
    paid_amount DECIMAL(12, 2),
    
    -- Documentation
    estimate_url TEXT,
    contract_url TEXT,
    invoice_urls JSONB DEFAULT '[]',
    permit_urls JSONB DEFAULT '[]',
    
    -- Quality and satisfaction
    work_quality_rating INTEGER CHECK (work_quality_rating BETWEEN 1 AND 5),
    notes TEXT,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    version INTEGER DEFAULT 1
);

-- ============================================
-- HISTORY TABLES (Immutable audit trail)
-- ============================================

-- Properties history
CREATE TABLE IF NOT EXISTS public.properties_history (
    history_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id UUID NOT NULL,
    operation TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
    changed_by UUID,
    changed_at TIMESTAMPTZ DEFAULT NOW(),
    version_from INTEGER NOT NULL,
    version_to INTEGER NOT NULL,
    data JSONB NOT NULL
);

-- Land history
CREATE TABLE IF NOT EXISTS public.property_land_history (
    history_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id UUID NOT NULL,
    property_id UUID NOT NULL,
    operation TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
    changed_by UUID,
    changed_at TIMESTAMPTZ DEFAULT NOW(),
    version_from INTEGER NOT NULL,
    version_to INTEGER NOT NULL,
    data JSONB NOT NULL
);

-- Structures history
CREATE TABLE IF NOT EXISTS public.property_structures_history (
    history_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id UUID NOT NULL,
    property_id UUID NOT NULL,
    operation TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
    changed_by UUID,
    changed_at TIMESTAMPTZ DEFAULT NOW(),
    version_from INTEGER NOT NULL,
    version_to INTEGER NOT NULL,
    data JSONB NOT NULL
);

-- Insurance history
CREATE TABLE IF NOT EXISTS public.property_insurance_history (
    history_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id UUID NOT NULL,
    property_id UUID NOT NULL,
    operation TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
    changed_by UUID,
    changed_at TIMESTAMPTZ DEFAULT NOW(),
    version_from INTEGER NOT NULL,
    version_to INTEGER NOT NULL,
    data JSONB NOT NULL
);

-- Claims history
CREATE TABLE IF NOT EXISTS public.property_claims_history (
    history_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id UUID NOT NULL,
    property_id UUID NOT NULL,
    operation TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
    changed_by UUID,
    changed_at TIMESTAMPTZ DEFAULT NOW(),
    version_from INTEGER NOT NULL,
    version_to INTEGER NOT NULL,
    data JSONB NOT NULL
);

-- ============================================
-- INDEXES for Performance
-- ============================================

-- Properties indexes
CREATE INDEX idx_properties_user_id ON properties(user_id);
CREATE INDEX idx_properties_location_geo ON properties USING GIST(location);
CREATE INDEX idx_properties_parcel ON properties(parcel_number);
CREATE INDEX idx_properties_county_zip ON properties(county, zip_code);
CREATE INDEX idx_properties_metadata ON properties USING GIN(metadata);
CREATE INDEX idx_properties_external_ids ON properties USING GIN(external_ids);

-- Land indexes
CREATE INDEX idx_property_land_property ON property_land(property_id);
CREATE INDEX idx_property_land_flood_zone ON property_land(flood_zone);
CREATE INDEX idx_property_land_gis ON property_land USING GIN(gis_data);

-- Structures indexes
CREATE INDEX idx_property_structures_property ON property_structures(property_id);
CREATE INDEX idx_property_structures_type ON property_structures(structure_type);
CREATE INDEX idx_property_structures_features ON property_structures USING GIN(features);

-- Systems indexes
CREATE INDEX idx_property_systems_structure ON property_systems(structure_id);
CREATE INDEX idx_property_systems_type ON property_systems(system_type);
CREATE INDEX idx_property_systems_warranty ON property_systems(warranty_expiration);

-- Insurance indexes
CREATE INDEX idx_property_insurance_property ON property_insurance(property_id);
CREATE INDEX idx_property_insurance_active ON property_insurance(is_active, expiration_date);
CREATE INDEX idx_property_insurance_carrier ON property_insurance(carrier_name);

-- Claims indexes
CREATE INDEX idx_property_claims_property ON property_claims(property_id);
CREATE INDEX idx_property_claims_status ON property_claims(status);
CREATE INDEX idx_property_claims_dates ON property_claims(loss_date, report_date);

-- Damage indexes
CREATE INDEX idx_property_damage_property ON property_damage(property_id);
CREATE INDEX idx_property_damage_claim ON property_damage(claim_id);
CREATE INDEX idx_property_damage_severity ON property_damage(damage_severity);

-- Contractors indexes
CREATE INDEX idx_property_contractors_property ON property_contractors(property_id);
CREATE INDEX idx_property_contractors_claim ON property_contractors(claim_id);

-- History table indexes
CREATE INDEX idx_properties_history_id ON properties_history(id);
CREATE INDEX idx_properties_history_changed ON properties_history(changed_at);
CREATE INDEX idx_property_land_history_id ON property_land_history(id);
CREATE INDEX idx_property_structures_history_id ON property_structures_history(id);
CREATE INDEX idx_property_insurance_history_id ON property_insurance_history(id);
CREATE INDEX idx_property_claims_history_id ON property_claims_history(id);

-- ============================================
-- Updated timestamp triggers
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON properties
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_property_land_updated_at BEFORE UPDATE ON property_land
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_property_structures_updated_at BEFORE UPDATE ON property_structures
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_property_systems_updated_at BEFORE UPDATE ON property_systems
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_property_insurance_updated_at BEFORE UPDATE ON property_insurance
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_property_claims_updated_at BEFORE UPDATE ON property_claims
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_property_damage_updated_at BEFORE UPDATE ON property_damage
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_property_contractors_updated_at BEFORE UPDATE ON property_contractors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Comments for documentation
-- ============================================
COMMENT ON TABLE properties IS 'Root entity for all property data in ClaimGuardian';
COMMENT ON TABLE property_land IS 'Land-specific information including zoning, environmental data';
COMMENT ON TABLE property_structures IS 'Individual structures on a property';
COMMENT ON TABLE property_systems IS 'Major systems and components within structures';
COMMENT ON TABLE property_insurance IS 'Insurance policies covering the property';
COMMENT ON TABLE property_claims IS 'Insurance claims filed for the property';
COMMENT ON TABLE property_damage IS 'Detailed damage assessments';
COMMENT ON TABLE property_contractors IS 'Contractor work and repairs';

COMMENT ON COLUMN properties.metadata IS 'Flexible JSONB field for additional property data';
COMMENT ON COLUMN properties.external_ids IS 'IDs from external data sources (FGIO, county systems, etc.)';
COMMENT ON COLUMN property_land.gis_data IS 'Raw GIS data from various Florida sources';
COMMENT ON COLUMN property_claims.status_history IS 'Array of status changes with timestamps and notes';-- ClaimGuardian Property Data Versioning System
-- ============================================
-- Implements comprehensive versioning and history tracking for all property entities

-- ============================================
-- Generic History Tracking Function
-- ============================================
CREATE OR REPLACE FUNCTION track_history()
RETURNS TRIGGER AS $$
DECLARE
    history_table TEXT;
    old_data JSONB;
    new_data JSONB;
    changed_by UUID;
BEGIN
    -- Determine the history table name
    history_table := TG_TABLE_NAME || '_history';
    
    -- Get the user who made the change (from JWT if available)
    changed_by := COALESCE(
        current_setting('request.jwt.claims', true)::json->>'sub',
        auth.uid()
    )::UUID;
    
    -- Handle different operations
    IF TG_OP = 'INSERT' THEN
        new_data := to_jsonb(NEW);
        
        -- Increment version for new records
        NEW.version := 1;
        
        -- Insert history record
        EXECUTE format(
            'INSERT INTO %I.%I (id, property_id, operation, changed_by, changed_at, version_from, version_to, data) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
            TG_TABLE_SCHEMA, history_table
        ) USING 
            NEW.id,
            COALESCE(NEW.property_id, NEW.id), -- For properties table, use id
            TG_OP,
            changed_by,
            NOW(),
            0,
            NEW.version,
            new_data;
            
    ELSIF TG_OP = 'UPDATE' THEN
        old_data := to_jsonb(OLD);
        new_data := to_jsonb(NEW);
        
        -- Only track if data actually changed
        IF old_data != new_data THEN
            -- Increment version
            NEW.version := OLD.version + 1;
            
            -- Insert history record
            EXECUTE format(
                'INSERT INTO %I.%I (id, property_id, operation, changed_by, changed_at, version_from, version_to, data) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
                TG_TABLE_SCHEMA, history_table
            ) USING 
                NEW.id,
                COALESCE(NEW.property_id, NEW.id),
                TG_OP,
                changed_by,
                NOW(),
                OLD.version,
                NEW.version,
                new_data;
        END IF;
        
    ELSIF TG_OP = 'DELETE' THEN
        old_data := to_jsonb(OLD);
        
        -- Insert history record for deletion
        EXECUTE format(
            'INSERT INTO %I.%I (id, property_id, operation, changed_by, changed_at, version_from, version_to, data) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
            TG_TABLE_SCHEMA, history_table
        ) USING 
            OLD.id,
            COALESCE(OLD.property_id, OLD.id),
            TG_OP,
            changed_by,
            NOW(),
            OLD.version,
            OLD.version,
            old_data;
            
        RETURN OLD;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Create History Triggers for All Tables
-- ============================================

-- Properties
CREATE TRIGGER track_properties_history
    BEFORE INSERT OR UPDATE OR DELETE ON properties
    FOR EACH ROW EXECUTE FUNCTION track_history();

-- Property Land
CREATE TRIGGER track_property_land_history
    BEFORE INSERT OR UPDATE OR DELETE ON property_land
    FOR EACH ROW EXECUTE FUNCTION track_history();

-- Property Structures
CREATE TRIGGER track_property_structures_history
    BEFORE INSERT OR UPDATE OR DELETE ON property_structures
    FOR EACH ROW EXECUTE FUNCTION track_history();

-- Property Systems
DROP TRIGGER IF EXISTS track_property_systems_history ON property_systems;
CREATE TRIGGER track_property_systems_history
    BEFORE INSERT OR UPDATE OR DELETE ON property_systems
    FOR EACH ROW EXECUTE FUNCTION track_history();

-- Property Insurance
CREATE TRIGGER track_property_insurance_history
    BEFORE INSERT OR UPDATE OR DELETE ON property_insurance
    FOR EACH ROW EXECUTE FUNCTION track_history();

-- Property Claims
CREATE TRIGGER track_property_claims_history
    BEFORE INSERT OR UPDATE OR DELETE ON property_claims
    FOR EACH ROW EXECUTE FUNCTION track_history();

-- Property Damage
DROP TRIGGER IF EXISTS track_property_damage_history ON property_damage;
CREATE TRIGGER track_property_damage_history
    BEFORE INSERT OR UPDATE OR DELETE ON property_damage
    FOR EACH ROW EXECUTE FUNCTION track_history();

-- Property Contractors
DROP TRIGGER IF EXISTS track_property_contractors_history ON property_contractors;
CREATE TRIGGER track_property_contractors_history
    BEFORE INSERT OR UPDATE OR DELETE ON property_contractors
    FOR EACH ROW EXECUTE FUNCTION track_history();

-- ============================================
-- History Query Functions
-- ============================================

-- Get full history for a property
CREATE OR REPLACE FUNCTION get_property_history(
    p_property_id UUID,
    p_include_children BOOLEAN DEFAULT TRUE
)
RETURNS TABLE (
    entity_type TEXT,
    entity_id UUID,
    operation TEXT,
    changed_by UUID,
    changed_at TIMESTAMPTZ,
    version_from INTEGER,
    version_to INTEGER,
    data JSONB
) AS $$
BEGIN
    -- Property history
    RETURN QUERY
    SELECT 
        'property'::TEXT as entity_type,
        h.id as entity_id,
        h.operation,
        h.changed_by,
        h.changed_at,
        h.version_from,
        h.version_to,
        h.data
    FROM properties_history h
    WHERE h.id = p_property_id;
    
    -- Include child entity history if requested
    IF p_include_children THEN
        -- Land history
        RETURN QUERY
        SELECT 
            'land'::TEXT,
            h.id,
            h.operation,
            h.changed_by,
            h.changed_at,
            h.version_from,
            h.version_to,
            h.data
        FROM property_land_history h
        WHERE h.property_id = p_property_id;
        
        -- Structures history
        RETURN QUERY
        SELECT 
            'structure'::TEXT,
            h.id,
            h.operation,
            h.changed_by,
            h.changed_at,
            h.version_from,
            h.version_to,
            h.data
        FROM property_structures_history h
        WHERE h.property_id = p_property_id;
        
        -- Insurance history
        RETURN QUERY
        SELECT 
            'insurance'::TEXT,
            h.id,
            h.operation,
            h.changed_by,
            h.changed_at,
            h.version_from,
            h.version_to,
            h.data
        FROM property_insurance_history h
        WHERE h.property_id = p_property_id;
        
        -- Claims history
        RETURN QUERY
        SELECT 
            'claim'::TEXT,
            h.id,
            h.operation,
            h.changed_by,
            h.changed_at,
            h.version_from,
            h.version_to,
            h.data
        FROM property_claims_history h
        WHERE h.property_id = p_property_id;
    END IF;
    
    RETURN;
END;
$$ LANGUAGE plpgsql STABLE;

-- Get entity state at specific version
CREATE OR REPLACE FUNCTION get_entity_at_version(
    p_table_name TEXT,
    p_entity_id UUID,
    p_version INTEGER
)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
    history_table TEXT;
BEGIN
    history_table := p_table_name || '_history';
    
    EXECUTE format(
        'SELECT data FROM %I.%I 
         WHERE id = $1 AND version_to = $2 
         ORDER BY changed_at DESC 
         LIMIT 1',
        'public', history_table
    ) INTO result USING p_entity_id, p_version;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql STABLE;

-- Compare two versions of an entity
CREATE OR REPLACE FUNCTION compare_entity_versions(
    p_table_name TEXT,
    p_entity_id UUID,
    p_version_from INTEGER,
    p_version_to INTEGER
)
RETURNS TABLE (
    field TEXT,
    old_value JSONB,
    new_value JSONB
) AS $$
DECLARE
    old_data JSONB;
    new_data JSONB;
    key TEXT;
BEGIN
    -- Get data for both versions
    old_data := get_entity_at_version(p_table_name, p_entity_id, p_version_from);
    new_data := get_entity_at_version(p_table_name, p_entity_id, p_version_to);
    
    -- Compare fields
    FOR key IN SELECT jsonb_object_keys(old_data) UNION SELECT jsonb_object_keys(new_data)
    LOOP
        IF old_data->key IS DISTINCT FROM new_data->key THEN
            field := key;
            old_value := old_data->key;
            new_value := new_data->key;
            RETURN NEXT;
        END IF;
    END LOOP;
    
    RETURN;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- Audit Trail Views
-- ============================================

-- Comprehensive audit trail view
CREATE OR REPLACE VIEW property_audit_trail AS
SELECT 
    'property' as entity_type,
    h.id as entity_id,
    p.address as entity_name,
    h.operation,
    h.changed_by,
    u.email as changed_by_email,
    h.changed_at,
    h.version_from,
    h.version_to,
    h.data
FROM properties_history h
LEFT JOIN properties p ON p.id = h.id
LEFT JOIN auth.users u ON u.id = h.changed_by

UNION ALL

SELECT 
    'land' as entity_type,
    h.id as entity_id,
    'Land: ' || COALESCE(h.data->>'zoning_code', 'Unknown') as entity_name,
    h.operation,
    h.changed_by,
    u.email as changed_by_email,
    h.changed_at,
    h.version_from,
    h.version_to,
    h.data
FROM property_land_history h
LEFT JOIN auth.users u ON u.id = h.changed_by

UNION ALL

SELECT 
    'structure' as entity_type,
    h.id as entity_id,
    COALESCE(h.data->>'structure_name', h.data->>'structure_type', 'Unknown') as entity_name,
    h.operation,
    h.changed_by,
    u.email as changed_by_email,
    h.changed_at,
    h.version_from,
    h.version_to,
    h.data
FROM property_structures_history h
LEFT JOIN auth.users u ON u.id = h.changed_by

UNION ALL

SELECT 
    'insurance' as entity_type,
    h.id as entity_id,
    h.data->>'carrier_name' || ' - ' || h.data->>'policy_number' as entity_name,
    h.operation,
    h.changed_by,
    u.email as changed_by_email,
    h.changed_at,
    h.version_from,
    h.version_to,
    h.data
FROM property_insurance_history h
LEFT JOIN auth.users u ON u.id = h.changed_by

UNION ALL

SELECT 
    'claim' as entity_type,
    h.id as entity_id,
    'Claim: ' || COALESCE(h.data->>'claim_number', 'Draft') as entity_name,
    h.operation,
    h.changed_by,
    u.email as changed_by_email,
    h.changed_at,
    h.version_from,
    h.version_to,
    h.data
FROM property_claims_history h
LEFT JOIN auth.users u ON u.id = h.changed_by

ORDER BY changed_at DESC;

-- ============================================
-- Maintenance Functions
-- ============================================

-- Archive old history records (keep last N versions)
CREATE OR REPLACE FUNCTION archive_old_history(
    p_table_name TEXT,
    p_keep_versions INTEGER DEFAULT 10,
    p_older_than INTERVAL DEFAULT '1 year'
)
RETURNS INTEGER AS $$
DECLARE
    archived_count INTEGER;
    history_table TEXT;
    archive_table TEXT;
BEGIN
    history_table := p_table_name || '_history';
    archive_table := p_table_name || '_history_archive';
    
    -- Create archive table if it doesn't exist
    EXECUTE format(
        'CREATE TABLE IF NOT EXISTS %I.%I (LIKE %I.%I INCLUDING ALL)',
        'public', archive_table, 'public', history_table
    );
    
    -- Archive old records
    EXECUTE format(
        'WITH records_to_archive AS (
            SELECT history_id
            FROM (
                SELECT 
                    history_id,
                    ROW_NUMBER() OVER (PARTITION BY id ORDER BY version_to DESC) as rn
                FROM %I.%I
                WHERE changed_at < NOW() - $1
            ) ranked
            WHERE rn > $2
        )
        INSERT INTO %I.%I
        SELECT * FROM %I.%I
        WHERE history_id IN (SELECT history_id FROM records_to_archive)',
        'public', history_table,
        'public', archive_table,
        'public', history_table
    ) USING p_older_than, p_keep_versions;
    
    GET DIAGNOSTICS archived_count = ROW_COUNT;
    
    -- Delete archived records from main history table
    EXECUTE format(
        'WITH records_to_archive AS (
            SELECT history_id
            FROM (
                SELECT 
                    history_id,
                    ROW_NUMBER() OVER (PARTITION BY id ORDER BY version_to DESC) as rn
                FROM %I.%I
                WHERE changed_at < NOW() - $1
            ) ranked
            WHERE rn > $2
        )
        DELETE FROM %I.%I
        WHERE history_id IN (SELECT history_id FROM records_to_archive)',
        'public', history_table,
        'public', history_table
    ) USING p_older_than, p_keep_versions;
    
    RETURN archived_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Grants for history tables
-- ============================================
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON property_audit_trail TO authenticated;-- ClaimGuardian Property Data RLS Policies
-- ============================================
-- Implements Row-Level Security for all property-related tables

-- ============================================
-- Enable RLS on all tables
-- ============================================
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_land ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_systems ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_insurance ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_damage ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_contractors ENABLE ROW LEVEL SECURITY;

-- History tables
ALTER TABLE properties_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_land_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_structures_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_insurance_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_claims_history ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Helper Functions for RLS
-- ============================================

-- Check if user owns a property
CREATE OR REPLACE FUNCTION user_owns_property(property_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM properties 
        WHERE id = property_id 
        AND user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Check if user has shared access to a property
CREATE OR REPLACE FUNCTION user_has_property_access(property_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Owner always has access
    IF user_owns_property(property_id) THEN
        RETURN TRUE;
    END IF;
    
    -- Check for shared access (future feature)
    -- This can be extended to support property sharing between users
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Get all property IDs accessible to current user
CREATE OR REPLACE FUNCTION get_user_accessible_properties()
RETURNS SETOF UUID AS $$
BEGIN
    RETURN QUERY
    SELECT id FROM properties WHERE user_id = auth.uid();
    
    -- Future: Add shared properties
    -- UNION
    -- SELECT property_id FROM property_shares WHERE shared_with_user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================
-- Properties Table Policies
-- ============================================

-- Users can only see their own properties
CREATE POLICY "Users can view own properties" ON properties
    FOR SELECT USING (user_id = auth.uid());

-- Users can create their own properties
CREATE POLICY "Users can create own properties" ON properties
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can update their own properties
CREATE POLICY "Users can update own properties" ON properties
    FOR UPDATE USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Users can delete their own properties
CREATE POLICY "Users can delete own properties" ON properties
    FOR DELETE USING (user_id = auth.uid());

-- ============================================
-- Property Land Table Policies
-- ============================================

-- View policy
CREATE POLICY "Users can view land for their properties" ON property_land
    FOR SELECT USING (user_has_property_access(property_id));

-- Insert policy
CREATE POLICY "Users can add land data to their properties" ON property_land
    FOR INSERT WITH CHECK (user_owns_property(property_id));

-- Update policy
CREATE POLICY "Users can update land data for their properties" ON property_land
    FOR UPDATE USING (user_owns_property(property_id))
    WITH CHECK (user_owns_property(property_id));

-- Delete policy
CREATE POLICY "Users can delete land data for their properties" ON property_land
    FOR DELETE USING (user_owns_property(property_id));

-- ============================================
-- Property Structures Table Policies
-- ============================================

-- View policy
CREATE POLICY "Users can view structures for their properties" ON property_structures
    FOR SELECT USING (user_has_property_access(property_id));

-- Insert policy
CREATE POLICY "Users can add structures to their properties" ON property_structures
    FOR INSERT WITH CHECK (user_owns_property(property_id));

-- Update policy
CREATE POLICY "Users can update structures for their properties" ON property_structures
    FOR UPDATE USING (user_owns_property(property_id))
    WITH CHECK (user_owns_property(property_id));

-- Delete policy
CREATE POLICY "Users can delete structures for their properties" ON property_structures
    FOR DELETE USING (user_owns_property(property_id));

-- ============================================
-- Property Systems Table Policies
-- ============================================

-- View policy
CREATE POLICY "Users can view systems for their structures" ON property_systems
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM property_structures s
            WHERE s.id = property_systems.structure_id
            AND user_has_property_access(s.property_id)
        )
    );

-- Insert policy
CREATE POLICY "Users can add systems to their structures" ON property_systems
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM property_structures s
            WHERE s.id = structure_id
            AND user_owns_property(s.property_id)
        )
    );

-- Update policy
CREATE POLICY "Users can update systems for their structures" ON property_systems
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM property_structures s
            WHERE s.id = property_systems.structure_id
            AND user_owns_property(s.property_id)
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM property_structures s
            WHERE s.id = structure_id
            AND user_owns_property(s.property_id)
        )
    );

-- Delete policy
CREATE POLICY "Users can delete systems for their structures" ON property_systems
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM property_structures s
            WHERE s.id = property_systems.structure_id
            AND user_owns_property(s.property_id)
        )
    );

-- ============================================
-- Property Insurance Table Policies
-- ============================================

-- View policy
CREATE POLICY "Users can view insurance for their properties" ON property_insurance
    FOR SELECT USING (user_has_property_access(property_id));

-- Insert policy
CREATE POLICY "Users can add insurance to their properties" ON property_insurance
    FOR INSERT WITH CHECK (user_owns_property(property_id));

-- Update policy
CREATE POLICY "Users can update insurance for their properties" ON property_insurance
    FOR UPDATE USING (user_owns_property(property_id))
    WITH CHECK (user_owns_property(property_id));

-- Delete policy
CREATE POLICY "Users can delete insurance for their properties" ON property_insurance
    FOR DELETE USING (user_owns_property(property_id));

-- ============================================
-- Property Claims Table Policies
-- ============================================

-- View policy
CREATE POLICY "Users can view claims for their properties" ON property_claims
    FOR SELECT USING (user_has_property_access(property_id));

-- Insert policy
CREATE POLICY "Users can create claims for their properties" ON property_claims
    FOR INSERT WITH CHECK (user_owns_property(property_id));

-- Update policy
CREATE POLICY "Users can update claims for their properties" ON property_claims
    FOR UPDATE USING (user_owns_property(property_id))
    WITH CHECK (user_owns_property(property_id));

-- Delete policy
CREATE POLICY "Users can delete claims for their properties" ON property_claims
    FOR DELETE USING (user_owns_property(property_id));

-- ============================================
-- Property Damage Table Policies
-- ============================================

-- View policy
CREATE POLICY "Users can view damage for their properties" ON property_damage
    FOR SELECT USING (user_has_property_access(property_id));

-- Insert policy
CREATE POLICY "Users can add damage records to their properties" ON property_damage
    FOR INSERT WITH CHECK (user_owns_property(property_id));

-- Update policy
CREATE POLICY "Users can update damage records for their properties" ON property_damage
    FOR UPDATE USING (user_owns_property(property_id))
    WITH CHECK (user_owns_property(property_id));

-- Delete policy
CREATE POLICY "Users can delete damage records for their properties" ON property_damage
    FOR DELETE USING (user_owns_property(property_id));

-- ============================================
-- Property Contractors Table Policies
-- ============================================

-- View policy
CREATE POLICY "Users can view contractors for their properties" ON property_contractors
    FOR SELECT USING (user_has_property_access(property_id));

-- Insert policy
CREATE POLICY "Users can add contractors to their properties" ON property_contractors
    FOR INSERT WITH CHECK (user_owns_property(property_id));

-- Update policy
CREATE POLICY "Users can update contractors for their properties" ON property_contractors
    FOR UPDATE USING (user_owns_property(property_id))
    WITH CHECK (user_owns_property(property_id));

-- Delete policy
CREATE POLICY "Users can delete contractors for their properties" ON property_contractors
    FOR DELETE USING (user_owns_property(property_id));

-- ============================================
-- History Table Policies
-- ============================================

-- Properties history
CREATE POLICY "Users can view history for their properties" ON properties_history
    FOR SELECT USING (
        id IN (SELECT id FROM properties WHERE user_id = auth.uid())
    );

-- Property land history
CREATE POLICY "Users can view land history for their properties" ON property_land_history
    FOR SELECT USING (
        property_id IN (SELECT id FROM properties WHERE user_id = auth.uid())
    );

-- Property structures history
CREATE POLICY "Users can view structures history for their properties" ON property_structures_history
    FOR SELECT USING (
        property_id IN (SELECT id FROM properties WHERE user_id = auth.uid())
    );

-- Property insurance history
CREATE POLICY "Users can view insurance history for their properties" ON property_insurance_history
    FOR SELECT USING (
        property_id IN (SELECT id FROM properties WHERE user_id = auth.uid())
    );

-- Property claims history
CREATE POLICY "Users can view claims history for their properties" ON property_claims_history
    FOR SELECT USING (
        property_id IN (SELECT id FROM properties WHERE user_id = auth.uid())
    );

-- ============================================
-- Service Role Bypass Policies
-- ============================================
-- These allow service role to bypass RLS for admin operations

-- Properties
CREATE POLICY "Service role bypass" ON properties
    USING (auth.jwt() ->> 'role' = 'service_role');

-- Property land
CREATE POLICY "Service role bypass" ON property_land
    USING (auth.jwt() ->> 'role' = 'service_role');

-- Property structures
CREATE POLICY "Service role bypass" ON property_structures
    USING (auth.jwt() ->> 'role' = 'service_role');

-- Property systems
CREATE POLICY "Service role bypass" ON property_systems
    USING (auth.jwt() ->> 'role' = 'service_role');

-- Property insurance
CREATE POLICY "Service role bypass" ON property_insurance
    USING (auth.jwt() ->> 'role' = 'service_role');

-- Property claims
CREATE POLICY "Service role bypass" ON property_claims
    USING (auth.jwt() ->> 'role' = 'service_role');

-- Property damage
CREATE POLICY "Service role bypass" ON property_damage
    USING (auth.jwt() ->> 'role' = 'service_role');

-- Property contractors
CREATE POLICY "Service role bypass" ON property_contractors
    USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================
-- Future: Property Sharing Functionality
-- ============================================
-- Uncomment and modify when implementing property sharing

-- CREATE TABLE property_shares (
--     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
--     property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
--     shared_by_user_id UUID NOT NULL REFERENCES auth.users(id),
--     shared_with_user_id UUID NOT NULL REFERENCES auth.users(id),
--     permission_level TEXT NOT NULL CHECK (permission_level IN ('view', 'edit')),
--     shared_at TIMESTAMPTZ DEFAULT NOW(),
--     expires_at TIMESTAMPTZ,
--     UNIQUE(property_id, shared_with_user_id)
-- );

-- ALTER TABLE property_shares ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY "Users can view shares they created" ON property_shares
--     FOR SELECT USING (shared_by_user_id = auth.uid());

-- CREATE POLICY "Users can view shares they received" ON property_shares
--     FOR SELECT USING (shared_with_user_id = auth.uid());

-- CREATE POLICY "Users can create shares for their properties" ON property_shares
--     FOR INSERT WITH CHECK (
--         user_owns_property(property_id) AND
--         shared_by_user_id = auth.uid()
--     );

-- CREATE POLICY "Users can revoke shares they created" ON property_shares
--     FOR DELETE USING (shared_by_user_id = auth.uid());-- ClaimGuardian Property Data Performance Optimizations
-- =====================================================
-- Additional indexes, materialized views, and helper functions for optimal performance

-- ============================================
-- Additional Performance Indexes
-- ============================================

-- Text search indexes for address and location matching
CREATE INDEX idx_properties_address_search ON properties USING GIN (to_tsvector('english', address));
CREATE INDEX idx_properties_city_search ON properties USING GIN (to_tsvector('english', city));

-- Composite indexes for common query patterns
CREATE INDEX idx_properties_user_county ON properties(user_id, county);
CREATE INDEX idx_properties_user_type ON properties(user_id, property_type);
CREATE INDEX idx_properties_user_created ON properties(user_id, created_at DESC);

-- Partial indexes for active records
CREATE INDEX idx_insurance_active_policies ON property_insurance(property_id, expiration_date) 
    WHERE is_active = TRUE;
CREATE INDEX idx_claims_open_status ON property_claims(property_id, status) 
    WHERE status NOT IN ('closed', 'settled');

-- JSONB specific indexes for common paths
CREATE INDEX idx_properties_external_parcel ON properties((external_ids->>'parcel_id'));
CREATE INDEX idx_properties_external_fgio ON properties((external_ids->>'fgio_id'));
CREATE INDEX idx_claims_status_history_time ON property_claims 
    USING GIN ((status_history) jsonb_path_ops);

-- ============================================
-- Materialized Views for Complex Queries
-- ============================================

-- Property overview with latest claim and insurance status
CREATE MATERIALIZED VIEW property_overview AS
SELECT 
    p.id,
    p.user_id,
    p.address,
    p.city,
    p.state,
    p.zip_code,
    p.county,
    p.property_type,
    p.square_footage,
    p.current_value,
    p.location,
    
    -- Latest insurance info
    ins.carrier_name as current_carrier,
    ins.policy_number as current_policy,
    ins.expiration_date as policy_expires,
    ins.dwelling_coverage,
    
    -- Active claims count
    COALESCE(claims.active_count, 0) as active_claims_count,
    claims.latest_claim_date,
    claims.total_claimed,
    claims.total_paid,
    
    -- Damage assessment summary
    COALESCE(damage.total_assessments, 0) as damage_assessments_count,
    damage.total_repair_estimate,
    
    -- Metadata
    p.created_at,
    p.updated_at
FROM properties p
LEFT JOIN LATERAL (
    SELECT *
    FROM property_insurance
    WHERE property_id = p.id
    AND is_active = TRUE
    AND expiration_date > CURRENT_DATE
    ORDER BY effective_date DESC
    LIMIT 1
) ins ON TRUE
LEFT JOIN LATERAL (
    SELECT 
        COUNT(*) FILTER (WHERE status NOT IN ('closed', 'settled')) as active_count,
        MAX(loss_date) as latest_claim_date,
        SUM(amount_claimed) as total_claimed,
        SUM(amount_paid) as total_paid
    FROM property_claims
    WHERE property_id = p.id
) claims ON TRUE
LEFT JOIN LATERAL (
    SELECT 
        COUNT(*) as total_assessments,
        SUM(estimated_repair_cost) as total_repair_estimate
    FROM property_damage
    WHERE property_id = p.id
) damage ON TRUE;

-- Create indexes on materialized view
CREATE UNIQUE INDEX idx_property_overview_id ON property_overview(id);
CREATE INDEX idx_property_overview_user ON property_overview(user_id);
CREATE INDEX idx_property_overview_county ON property_overview(county);
CREATE INDEX idx_property_overview_active_claims ON property_overview(active_claims_count) 
    WHERE active_claims_count > 0;

-- Refresh function for materialized view
CREATE OR REPLACE FUNCTION refresh_property_overview()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY property_overview;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Helper Functions for Common Operations
-- ============================================

-- Get property summary with all related data
CREATE OR REPLACE FUNCTION get_property_complete(p_property_id UUID)
RETURNS TABLE (
    property JSONB,
    land JSONB,
    structures JSONB,
    insurance JSONB,
    claims JSONB,
    damage JSONB,
    contractors JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        to_jsonb(p.*) as property,
        to_jsonb(l.*) as land,
        COALESCE(
            jsonb_agg(DISTINCT to_jsonb(s.*)) FILTER (WHERE s.id IS NOT NULL),
            '[]'::jsonb
        ) as structures,
        COALESCE(
            jsonb_agg(DISTINCT to_jsonb(i.*)) FILTER (WHERE i.id IS NOT NULL),
            '[]'::jsonb
        ) as insurance,
        COALESCE(
            jsonb_agg(DISTINCT to_jsonb(c.*)) FILTER (WHERE c.id IS NOT NULL),
            '[]'::jsonb
        ) as claims,
        COALESCE(
            jsonb_agg(DISTINCT to_jsonb(d.*)) FILTER (WHERE d.id IS NOT NULL),
            '[]'::jsonb
        ) as damage,
        COALESCE(
            jsonb_agg(DISTINCT to_jsonb(con.*)) FILTER (WHERE con.id IS NOT NULL),
            '[]'::jsonb
        ) as contractors
    FROM properties p
    LEFT JOIN property_land l ON l.property_id = p.id
    LEFT JOIN property_structures s ON s.property_id = p.id
    LEFT JOIN property_insurance i ON i.property_id = p.id
    LEFT JOIN property_claims c ON c.property_id = p.id
    LEFT JOIN property_damage d ON d.property_id = p.id
    LEFT JOIN property_contractors con ON con.property_id = p.id
    WHERE p.id = p_property_id
    AND user_has_property_access(p_property_id)
    GROUP BY p.id, l.id;
END;
$$ LANGUAGE plpgsql STABLE;

-- Search properties by address with fuzzy matching
CREATE OR REPLACE FUNCTION search_properties_by_address(
    p_search_term TEXT,
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    address TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    similarity REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.address,
        p.city,
        p.state,
        p.zip_code,
        similarity(p.address || ' ' || p.city, p_search_term) as sim
    FROM properties p
    WHERE p.user_id = auth.uid()
    AND (
        p.address || ' ' || p.city ILIKE '%' || p_search_term || '%'
        OR similarity(p.address || ' ' || p.city, p_search_term) > 0.3
    )
    ORDER BY sim DESC, p.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- Get properties near a location
CREATE OR REPLACE FUNCTION get_properties_nearby(
    p_latitude DECIMAL,
    p_longitude DECIMAL,
    p_radius_meters INTEGER DEFAULT 1000
)
RETURNS TABLE (
    id UUID,
    address TEXT,
    distance_meters FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.address,
        ST_Distance(
            p.location::geography,
            ST_MakePoint(p_longitude, p_latitude)::geography
        ) as distance_meters
    FROM properties p
    WHERE p.user_id = auth.uid()
    AND ST_DWithin(
        p.location::geography,
        ST_MakePoint(p_longitude, p_latitude)::geography,
        p_radius_meters
    )
    ORDER BY distance_meters;
END;
$$ LANGUAGE plpgsql STABLE;

-- Calculate claim statistics for a property
CREATE OR REPLACE FUNCTION get_property_claim_stats(p_property_id UUID)
RETURNS TABLE (
    total_claims INTEGER,
    open_claims INTEGER,
    total_claimed DECIMAL,
    total_approved DECIMAL,
    total_paid DECIMAL,
    approval_rate DECIMAL,
    average_processing_days DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_claims,
        COUNT(*) FILTER (WHERE status NOT IN ('closed', 'settled'))::INTEGER as open_claims,
        COALESCE(SUM(amount_claimed), 0) as total_claimed,
        COALESCE(SUM(amount_approved), 0) as total_approved,
        COALESCE(SUM(amount_paid), 0) as total_paid,
        CASE 
            WHEN COUNT(*) FILTER (WHERE amount_claimed > 0) > 0 
            THEN (SUM(amount_approved) / NULLIF(SUM(amount_claimed), 0) * 100)
            ELSE 0 
        END as approval_rate,
        AVG(
            CASE 
                WHEN status IN ('settled', 'closed') 
                THEN EXTRACT(EPOCH FROM (updated_at - report_date)) / 86400
                ELSE NULL
            END
        ) as average_processing_days
    FROM property_claims
    WHERE property_id = p_property_id
    AND user_has_property_access(p_property_id);
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- Automated Maintenance
-- ============================================

-- Function to update property location from lat/lng
CREATE OR REPLACE FUNCTION update_property_location()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
        NEW.location = ST_MakePoint(NEW.longitude, NEW.latitude)::geography;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_property_location_trigger
    BEFORE INSERT OR UPDATE OF latitude, longitude ON properties
    FOR EACH ROW EXECUTE FUNCTION update_property_location();

-- Function to auto-expire insurance policies
CREATE OR REPLACE FUNCTION check_insurance_expiration()
RETURNS void AS $$
BEGIN
    UPDATE property_insurance
    SET is_active = FALSE
    WHERE is_active = TRUE
    AND expiration_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Scheduled Jobs (using pg_cron)
-- ============================================

-- Schedule daily insurance expiration check
-- Note: pg_cron must be enabled in Supabase
-- SELECT cron.schedule('check-insurance-expiration', '0 0 * * *', 'SELECT check_insurance_expiration();');

-- Schedule hourly materialized view refresh
-- SELECT cron.schedule('refresh-property-overview', '0 * * * *', 'SELECT refresh_property_overview();');

-- ============================================
-- Performance Monitoring
-- ============================================

-- View to monitor slow queries on property tables
CREATE OR REPLACE VIEW property_slow_queries AS
SELECT 
    query,
    calls,
    mean_exec_time,
    total_exec_time,
    stddev_exec_time
FROM pg_stat_statements
WHERE query LIKE '%properties%'
   OR query LIKE '%property_%'
ORDER BY mean_exec_time DESC
LIMIT 20;

-- Function to analyze table sizes and bloat
CREATE OR REPLACE FUNCTION analyze_property_tables()
RETURNS TABLE (
    table_name TEXT,
    table_size TEXT,
    indexes_size TEXT,
    total_size TEXT,
    row_estimate BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        schemaname||'.'||tablename as table_name,
        pg_size_pretty(pg_table_size(schemaname||'.'||tablename)) as table_size,
        pg_size_pretty(pg_indexes_size(schemaname||'.'||tablename)) as indexes_size,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
        n_live_tup as row_estimate
    FROM pg_stat_user_tables
    WHERE schemaname = 'public'
    AND tablename LIKE 'property%'
    ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Data Quality Functions
-- ============================================

-- Validate property data completeness
CREATE OR REPLACE FUNCTION validate_property_data(p_property_id UUID)
RETURNS TABLE (
    check_name TEXT,
    status TEXT,
    details TEXT
) AS $$
BEGIN
    -- Check basic property data
    RETURN QUERY
    SELECT 
        'Basic Property Data'::TEXT,
        CASE 
            WHEN p.latitude IS NOT NULL AND p.longitude IS NOT NULL THEN 'PASS'
            ELSE 'WARN'
        END,
        CASE 
            WHEN p.latitude IS NULL THEN 'Missing coordinates'
            ELSE 'Complete'
        END
    FROM properties p
    WHERE p.id = p_property_id;
    
    -- Check insurance coverage
    RETURN QUERY
    SELECT 
        'Insurance Coverage'::TEXT,
        CASE 
            WHEN EXISTS (
                SELECT 1 FROM property_insurance i 
                WHERE i.property_id = p_property_id 
                AND i.is_active = TRUE 
                AND i.expiration_date > CURRENT_DATE
            ) THEN 'PASS'
            ELSE 'FAIL'
        END,
        CASE 
            WHEN EXISTS (
                SELECT 1 FROM property_insurance i 
                WHERE i.property_id = p_property_id 
                AND i.is_active = TRUE 
                AND i.expiration_date > CURRENT_DATE
            ) THEN 'Active policy found'
            ELSE 'No active insurance policy'
        END;
    
    -- Check for structure data
    RETURN QUERY
    SELECT 
        'Structure Information'::TEXT,
        CASE 
            WHEN EXISTS (
                SELECT 1 FROM property_structures s 
                WHERE s.property_id = p_property_id
            ) THEN 'PASS'
            ELSE 'WARN'
        END,
        CASE 
            WHEN EXISTS (
                SELECT 1 FROM property_structures s 
                WHERE s.property_id = p_property_id
            ) THEN 'Structure data exists'
            ELSE 'No structure information'
        END;
END;
$$ LANGUAGE plpgsql STABLE;-- ClaimGuardian Property Data Integration
-- =======================================
-- Integrates the new property schema with existing Florida parcel data sources

-- ============================================
-- Integration Functions
-- ============================================

-- Function to link property with Florida parcel data
CREATE OR REPLACE FUNCTION link_property_to_parcel(
    p_property_id UUID,
    p_parcel_number TEXT,
    p_county TEXT
)
RETURNS VOID AS $$
DECLARE
    v_parcel_data RECORD;
    v_external_ids JSONB;
BEGIN
    -- Find matching parcel in florida_parcels
    SELECT * INTO v_parcel_data
    FROM public.florida_parcels
    WHERE parcel_id = p_parcel_number
    AND county_name ILIKE p_county
    LIMIT 1;
    
    IF FOUND THEN
        -- Update property with parcel data
        UPDATE properties
        SET 
            parcel_number = COALESCE(parcel_number, p_parcel_number),
            external_ids = external_ids || jsonb_build_object(
                'florida_parcels_id', v_parcel_data.id,
                'parcel_id', v_parcel_data.parcel_id,
                'source', v_parcel_data.source
            ),
            metadata = metadata || jsonb_build_object(
                'parcel_data_linked', NOW(),
                'parcel_source', v_parcel_data.source
            )
        WHERE id = p_property_id;
        
        -- Create or update land record with parcel data
        INSERT INTO property_land (
            property_id,
            zoning_code,
            land_use_code,
            assessed_land_value,
            assessment_year,
            gis_data
        )
        VALUES (
            p_property_id,
            v_parcel_data.metadata->>'zoning',
            v_parcel_data.metadata->>'land_use_code',
            (v_parcel_data.metadata->>'assessed_value')::DECIMAL,
            EXTRACT(YEAR FROM NOW())::INTEGER,
            v_parcel_data.metadata
        )
        ON CONFLICT (property_id) DO UPDATE
        SET 
            gis_data = property_land.gis_data || EXCLUDED.gis_data,
            updated_at = NOW();
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to import property from contractor connection
CREATE OR REPLACE FUNCTION import_property_from_contractor(
    p_user_id UUID,
    p_contractor_data JSONB
)
RETURNS UUID AS $$
DECLARE
    v_property_id UUID;
    v_address JSONB;
BEGIN
    v_address := p_contractor_data->'property_address';
    
    -- Create property
    INSERT INTO properties (
        user_id,
        address,
        city,
        state,
        zip_code,
        county,
        metadata,
        external_ids
    )
    VALUES (
        p_user_id,
        v_address->>'street',
        v_address->>'city',
        COALESCE(v_address->>'state', 'FL'),
        v_address->>'zip',
        v_address->>'county',
        jsonb_build_object(
            'imported_from', 'contractor_connection',
            'import_date', NOW()
        ),
        jsonb_build_object(
            'contractor_connection_id', p_contractor_data->>'id'
        )
    )
    RETURNING id INTO v_property_id;
    
    -- Link to parcel data if available
    IF v_address->>'parcel_number' IS NOT NULL THEN
        PERFORM link_property_to_parcel(
            v_property_id,
            v_address->>'parcel_number',
            v_address->>'county'
        );
    END IF;
    
    RETURN v_property_id;
END;
$$ LANGUAGE plpgsql;

-- Function to sync property with external scraped data
CREATE OR REPLACE FUNCTION sync_property_with_scraped_data(
    p_property_id UUID
)
RETURNS VOID AS $$
DECLARE
    v_property RECORD;
    v_scraped_data RECORD;
BEGIN
    -- Get property details
    SELECT * INTO v_property
    FROM properties
    WHERE id = p_property_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Property not found';
    END IF;
    
    -- Find matching scraped property data
    SELECT * INTO v_scraped_data
    FROM public.scraped_properties
    WHERE parcel_number = v_property.parcel_number
    AND source_county = v_property.county
    ORDER BY scraped_at DESC
    LIMIT 1;
    
    IF FOUND THEN
        -- Update property with scraped data
        UPDATE properties
        SET 
            metadata = metadata || jsonb_build_object(
                'last_scraped_sync', NOW(),
                'scraped_data', v_scraped_data.data
            ),
            current_value = COALESCE(
                (v_scraped_data.data->>'market_value')::DECIMAL,
                current_value
            )
        WHERE id = p_property_id;
        
        -- Update or create structures from scraped data
        IF v_scraped_data.data->'structures' IS NOT NULL THEN
            -- Handle structure updates
            INSERT INTO property_structures (
                property_id,
                structure_type,
                square_footage,
                year_built,
                construction_details
            )
            SELECT 
                p_property_id,
                COALESCE(struct->>'type', 'main_house'),
                (struct->>'square_feet')::INTEGER,
                (struct->>'year_built')::INTEGER,
                struct
            FROM jsonb_array_elements(v_scraped_data.data->'structures') as struct
            ON CONFLICT (property_id, structure_type) DO UPDATE
            SET 
                construction_details = property_structures.construction_details || EXCLUDED.construction_details,
                updated_at = NOW();
        END IF;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Views for Data Integration
-- ============================================

-- View combining property data with Florida parcels
CREATE OR REPLACE VIEW property_parcel_data AS
SELECT 
    p.id as property_id,
    p.user_id,
    p.address,
    p.city,
    p.state,
    p.zip_code,
    p.county,
    p.parcel_number,
    p.location,
    
    -- Parcel data
    fp.id as florida_parcel_id,
    fp.source as parcel_source,
    fp.geometry as parcel_geometry,
    fp.metadata as parcel_metadata,
    
    -- Calculated fields
    ST_Area(fp.geometry::geography) / 43560 as calculated_acres,
    fp.metadata->>'owner_name' as county_owner_name,
    fp.metadata->>'assessed_value' as county_assessed_value,
    
    p.created_at,
    p.updated_at
FROM properties p
LEFT JOIN florida_parcels fp ON 
    fp.parcel_id = p.parcel_number
    AND fp.county_name ILIKE p.county;

-- View for properties with insurance carrier data
CREATE OR REPLACE VIEW property_insurance_carriers AS
SELECT 
    pi.*,
    p.address,
    p.city,
    p.county,
    
    -- Carrier details (would join with carrier table when available)
    CASE 
        WHEN pi.carrier_name ILIKE '%citizens%' THEN 'state'
        WHEN pi.carrier_name IN (
            SELECT name FROM unnest(ARRAY[
                'Lloyd''s of London',
                'Scottsdale Insurance Company',
                'Lexington Insurance Company'
            ]) as name
        ) THEN 'surplus'
        ELSE 'private'
    END as carrier_type
FROM property_insurance pi
JOIN properties p ON p.id = pi.property_id;

-- ============================================
-- Triggers for Automatic Data Sync
-- ============================================

-- Trigger to auto-link properties with parcels on insert/update
CREATE OR REPLACE FUNCTION auto_link_parcel()
RETURNS TRIGGER AS $$
BEGIN
    -- Only proceed if we have a parcel number and county
    IF NEW.parcel_number IS NOT NULL AND NEW.county IS NOT NULL THEN
        -- Check if not already linked
        IF NEW.external_ids->>'florida_parcels_id' IS NULL THEN
            PERFORM link_property_to_parcel(NEW.id, NEW.parcel_number, NEW.county);
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_link_property_parcel
    AFTER INSERT OR UPDATE OF parcel_number, county ON properties
    FOR EACH ROW EXECUTE FUNCTION auto_link_parcel();

-- ============================================
-- Data Import Helpers
-- ============================================

-- Bulk import properties from GIS data
CREATE OR REPLACE FUNCTION bulk_import_properties_from_parcels(
    p_user_id UUID,
    p_county TEXT,
    p_limit INTEGER DEFAULT 100
)
RETURNS TABLE (
    property_id UUID,
    address TEXT,
    parcel_number TEXT,
    status TEXT
) AS $$
DECLARE
    v_parcel RECORD;
    v_property_id UUID;
    v_address TEXT;
    v_status TEXT;
BEGIN
    FOR v_parcel IN 
        SELECT *
        FROM florida_parcels fp
        WHERE fp.county_name ILIKE p_county
        AND fp.metadata->>'owner_address' IS NOT NULL
        AND NOT EXISTS (
            SELECT 1 FROM properties p
            WHERE p.parcel_number = fp.parcel_id
            AND p.user_id = p_user_id
        )
        LIMIT p_limit
    LOOP
        BEGIN
            -- Parse address from metadata
            v_address := v_parcel.metadata->>'site_address';
            IF v_address IS NULL THEN
                v_address := v_parcel.metadata->>'owner_address';
            END IF;
            
            -- Create property
            INSERT INTO properties (
                user_id,
                address,
                city,
                state,
                zip_code,
                county,
                parcel_number,
                latitude,
                longitude,
                metadata,
                external_ids
            )
            VALUES (
                p_user_id,
                split_part(v_address, ',', 1),
                COALESCE(v_parcel.metadata->>'site_city', split_part(v_address, ',', 2)),
                'FL',
                v_parcel.metadata->>'site_zip',
                p_county,
                v_parcel.parcel_id,
                ST_Y(ST_Centroid(v_parcel.geometry))::DECIMAL(10, 8),
                ST_X(ST_Centroid(v_parcel.geometry))::DECIMAL(11, 8),
                jsonb_build_object(
                    'imported_from_gis', TRUE,
                    'import_date', NOW()
                ),
                jsonb_build_object(
                    'florida_parcels_id', v_parcel.id,
                    'source', v_parcel.source
                )
            )
            RETURNING id INTO v_property_id;
            
            v_status := 'imported';
            
            -- Create land record
            INSERT INTO property_land (
                property_id,
                legal_description,
                gis_data
            )
            VALUES (
                v_property_id,
                v_parcel.metadata->>'legal_description',
                v_parcel.metadata
            );
            
        EXCEPTION WHEN OTHERS THEN
            v_property_id := NULL;
            v_status := 'error: ' || SQLERRM;
        END;
        
        property_id := v_property_id;
        address := v_address;
        parcel_number := v_parcel.parcel_id;
        status := v_status;
        RETURN NEXT;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Monitoring and Analytics
-- ============================================

-- View for data source coverage
CREATE OR REPLACE VIEW property_data_coverage AS
SELECT 
    p.county,
    COUNT(DISTINCT p.id) as property_count,
    COUNT(DISTINCT p.parcel_number) as properties_with_parcel,
    COUNT(DISTINCT fp.id) as linked_parcels,
    COUNT(DISTINCT pi.id) as properties_with_insurance,
    COUNT(DISTINCT pc.id) as properties_with_claims,
    
    -- Coverage percentages
    ROUND(COUNT(DISTINCT p.parcel_number)::NUMERIC / COUNT(DISTINCT p.id) * 100, 2) as parcel_coverage_pct,
    ROUND(COUNT(DISTINCT pi.property_id)::NUMERIC / COUNT(DISTINCT p.id) * 100, 2) as insurance_coverage_pct
FROM properties p
LEFT JOIN florida_parcels fp ON fp.parcel_id = p.parcel_number AND fp.county_name = p.county
LEFT JOIN property_insurance pi ON pi.property_id = p.id AND pi.is_active = TRUE
LEFT JOIN property_claims pc ON pc.property_id = p.id
GROUP BY p.county
ORDER BY property_count DESC;

-- Function to analyze data quality
CREATE OR REPLACE FUNCTION analyze_property_data_quality()
RETURNS TABLE (
    metric TEXT,
    count BIGINT,
    percentage NUMERIC
) AS $$
DECLARE
    v_total_properties BIGINT;
BEGIN
    SELECT COUNT(*) INTO v_total_properties FROM properties;
    
    RETURN QUERY
    SELECT 'Total Properties'::TEXT, v_total_properties, 100.0;
    
    RETURN QUERY
    SELECT 
        'With Coordinates'::TEXT,
        COUNT(*)::BIGINT,
        ROUND(COUNT(*)::NUMERIC / v_total_properties * 100, 2)
    FROM properties
    WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
    
    RETURN QUERY
    SELECT 
        'With Parcel Number'::TEXT,
        COUNT(*)::BIGINT,
        ROUND(COUNT(*)::NUMERIC / v_total_properties * 100, 2)
    FROM properties
    WHERE parcel_number IS NOT NULL;
    
    RETURN QUERY
    SELECT 
        'Linked to GIS Data'::TEXT,
        COUNT(*)::BIGINT,
        ROUND(COUNT(*)::NUMERIC / v_total_properties * 100, 2)
    FROM properties
    WHERE external_ids->>'florida_parcels_id' IS NOT NULL;
    
    RETURN QUERY
    SELECT 
        'With Active Insurance'::TEXT,
        COUNT(DISTINCT property_id)::BIGINT,
        ROUND(COUNT(DISTINCT property_id)::NUMERIC / v_total_properties * 100, 2)
    FROM property_insurance
    WHERE is_active = TRUE AND expiration_date > CURRENT_DATE;
    
    RETURN QUERY
    SELECT 
        'With Claims History'::TEXT,
        COUNT(DISTINCT property_id)::BIGINT,
        ROUND(COUNT(DISTINCT property_id)::NUMERIC / v_total_properties * 100, 2)
    FROM property_claims;
END;
$$ LANGUAGE plpgsql;