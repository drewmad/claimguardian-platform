-- Reference Data, Constraints, and Additional Schema Components
-- This migration adds lookup tables, reference data, and missing constraints

-- ============================================================================
-- PART 1: REFERENCE DATA TABLES
-- ============================================================================

-- Insurance carriers reference table
CREATE TABLE IF NOT EXISTS reference.insurance_carrier (
    id UUID PRIMARY KEY DEFAULT core.generate_uuid(),
    name TEXT NOT NULL UNIQUE,
    phone TEXT,
    email TEXT,
    website TEXT,
    claims_phone TEXT,
    claims_email TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Common insurance carriers in Florida
-- Skipping - data already exists in production

-- Damage categories with typical items
CREATE TABLE IF NOT EXISTS reference.damage_category (
    id UUID PRIMARY KEY DEFAULT core.generate_uuid(),
    category damage_type_enum NOT NULL,
    subcategory TEXT NOT NULL,
    description TEXT,
    typical_items TEXT[],
    UNIQUE(category, subcategory)
);

-- Damage category data - skipping, already exists

-- Florida counties reference
CREATE TABLE IF NOT EXISTS reference.florida_county (
    id UUID PRIMARY KEY DEFAULT core.generate_uuid(),
    county_name TEXT NOT NULL UNIQUE,
    county_code TEXT NOT NULL UNIQUE,
    region TEXT NOT NULL,
    fips_code TEXT,
    population INTEGER,
    coastal BOOLEAN DEFAULT false
);

-- Florida counties - skipping, already exists

-- ============================================================================
-- PART 2: CONTRACTOR AND VENDOR IMPROVEMENTS
-- ============================================================================

-- Standardize contractor companies table
ALTER TABLE contractor_connection.contractor_companies
    ALTER COLUMN id SET DEFAULT core.generate_uuid(),
    ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS rating DECIMAL(3,2) CHECK (rating BETWEEN 0 AND 5),
    ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS specialties TEXT[],
    ADD COLUMN IF NOT EXISTS service_areas TEXT[],
    ADD COLUMN IF NOT EXISTS insurance_verified BOOLEAN DEFAULT false;

-- Contractor specialties reference
CREATE TABLE IF NOT EXISTS reference.contractor_specialty (
    id UUID PRIMARY KEY DEFAULT core.generate_uuid(),
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    license_required BOOLEAN DEFAULT true
);

-- Contractor specialties - skipping, already exists

-- ============================================================================
-- PART 3: FINANCIAL TRACKING
-- ============================================================================

-- Payment tracking for claims
CREATE TABLE IF NOT EXISTS core.claim_payment (
    id UUID PRIMARY KEY DEFAULT core.generate_uuid(),
    claim_id UUID NOT NULL REFERENCES core.claim(id) ON DELETE CASCADE,
    payment_type TEXT NOT NULL CHECK (payment_type IN ('deductible', 'advance', 'settlement', 'supplement')),
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    payment_date DATE NOT NULL,
    check_number TEXT,
    payment_method TEXT CHECK (payment_method IN ('check', 'eft', 'wire', 'other')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL REFERENCES auth.users(id)
);

-- Expense tracking for properties
CREATE TABLE IF NOT EXISTS core.property_expense (
    id UUID PRIMARY KEY DEFAULT core.generate_uuid(),
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    expense_type TEXT NOT NULL,
    vendor_name TEXT,
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    expense_date DATE NOT NULL,
    description TEXT,
    receipt_url TEXT,
    claim_id UUID REFERENCES core.claim(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- PART 4: COMMUNICATION TRACKING
-- ============================================================================

-- Universal communication log
CREATE TABLE IF NOT EXISTS core.communication_log (
    id UUID PRIMARY KEY DEFAULT core.generate_uuid(),
    entity_type TEXT NOT NULL CHECK (entity_type IN ('claim', 'property', 'policy')),
    entity_id UUID NOT NULL,
    direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
    communication_type TEXT NOT NULL CHECK (communication_type IN ('phone', 'email', 'letter', 'text', 'portal')),
    subject TEXT,
    summary TEXT NOT NULL,
    contact_name TEXT,
    contact_phone TEXT,
    contact_email TEXT,
    attachments JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL REFERENCES auth.users(id)
);

-- Email templates
CREATE TABLE IF NOT EXISTS reference.email_template (
    id UUID PRIMARY KEY DEFAULT core.generate_uuid(),
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    subject TEXT NOT NULL,
    body_html TEXT NOT NULL,
    body_text TEXT,
    variables JSONB DEFAULT '[]'::jsonb,
    category TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- PART 5: PROPERTY ENHANCEMENTS
-- ============================================================================

-- Property features for insurance purposes
CREATE TABLE IF NOT EXISTS core.property_feature (
    id UUID PRIMARY KEY DEFAULT core.generate_uuid(),
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    feature_type TEXT NOT NULL,
    feature_value TEXT,
    installed_date DATE,
    wind_mitigation_credit BOOLEAN DEFAULT false,
    notes TEXT,
    UNIQUE(property_id, feature_type)
);

-- Email templates - skipping, already exists

-- ============================================================================
-- PART 6: ENHANCED CONSTRAINTS AND VALIDATIONS
-- ============================================================================

-- Add missing foreign key constraints
-- Note: Commented out as it requires matching data types and existing carrier names
-- ALTER TABLE public.properties
--     ADD CONSTRAINT fk_properties_carrier 
--     FOREIGN KEY (insurance_carrier) 
--     REFERENCES reference.insurance_carrier(name) 
--     ON UPDATE CASCADE;

-- Add check constraints for data quality
ALTER TABLE core.claim
    ADD CONSTRAINT claim_number_format 
    CHECK (claim_number ~ '^CLM-[0-9]{4}-[0-9]{6}$');

ALTER TABLE core.insurance_policy
    ADD CONSTRAINT policy_number_not_empty 
    CHECK (length(trim(policy_number)) > 0);

-- Add computed columns
-- Note: days_open cannot be a generated column because CURRENT_DATE is not immutable
-- This will need to be calculated at query time or via a view

-- ============================================================================
-- PART 7: MATERIALIZED VIEWS FOR REPORTING
-- ============================================================================

-- Claims summary by property
CREATE MATERIALIZED VIEW IF NOT EXISTS core.property_claims_summary AS
SELECT 
    p.id as property_id,
    p.name as property_name,
    COUNT(DISTINCT c.id) as total_claims,
    COUNT(DISTINCT c.id) FILTER (WHERE c.status = 'settled') as settled_claims,
    COUNT(DISTINCT c.id) FILTER (WHERE c.status IN ('draft', 'submitted', 'under_review')) as open_claims,
    SUM(c.claimed_amount) as total_claimed,
    SUM(c.settlement_amount) as total_settled,
    MAX(c.incident_date) as last_incident_date,
    AVG(
        CASE 
            WHEN c.status IN ('settled', 'closed') AND c.settlement_date IS NOT NULL THEN 
                (c.settlement_date - c.reported_date::date)::integer
            ELSE NULL
        END
    ) as avg_days_to_close
FROM public.properties p
LEFT JOIN core.claim c ON p.id = c.property_id
GROUP BY p.id, p.name;

CREATE UNIQUE INDEX idx_property_claims_summary_property 
ON core.property_claims_summary(property_id);

-- Policy coverage summary
CREATE MATERIALIZED VIEW IF NOT EXISTS core.policy_coverage_summary AS
SELECT 
    ip.id as policy_id,
    ip.user_id,
    ip.property_id,
    ip.policy_type,
    ip.carrier_name,
    (ip.coverage_dwelling + 
     COALESCE(ip.coverage_other_structures, 0) + 
     COALESCE(ip.coverage_personal_property, 0)) as total_property_coverage,
    ip.coverage_liability as liability_coverage,
    LEAST(
        COALESCE(ip.deductible_hurricane, ip.deductible_other),
        COALESCE(ip.deductible_wind, ip.deductible_other),
        ip.deductible_other
    ) as min_deductible,
    ip.premium_amount,
    ip.expiration_date,
    CASE 
        WHEN ip.expiration_date < NOW()::date THEN 'expired'
        WHEN ip.expiration_date < NOW()::date + INTERVAL '30 days' THEN 'expiring_soon'
        ELSE 'active'
    END as status
FROM core.insurance_policy ip
WHERE ip.is_current = true;

CREATE UNIQUE INDEX idx_policy_coverage_summary 
ON core.policy_coverage_summary(policy_id);

-- ============================================================================
-- PART 8: TRIGGERS FOR DATA INTEGRITY
-- ============================================================================

-- Ensure claim timeline entries match claim status
CREATE OR REPLACE FUNCTION core.validate_claim_timeline()
RETURNS TRIGGER AS $$
BEGIN
    -- Update claim status when timeline entry is added
    IF TG_OP = 'INSERT' THEN
        UPDATE core.claim 
        SET status = NEW.status 
        WHERE id = NEW.claim_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_claim_status_from_timeline
AFTER INSERT ON core.claim_timeline
FOR EACH ROW EXECUTE FUNCTION core.validate_claim_timeline();

-- Auto-generate claim number
CREATE OR REPLACE FUNCTION core.set_claim_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.claim_number IS NULL THEN
        NEW.claim_number := core.generate_claim_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_claim_number
BEFORE INSERT ON core.claim
FOR EACH ROW EXECUTE FUNCTION core.set_claim_number();

-- ============================================================================
-- PART 9: PERFORMANCE TUNING
-- ============================================================================

-- Add missing indexes
CREATE INDEX IF NOT EXISTS idx_claim_payment_claim ON core.claim_payment(claim_id);
CREATE INDEX IF NOT EXISTS idx_property_expense_property ON core.property_expense(property_id);
CREATE INDEX IF NOT EXISTS idx_property_expense_claim ON core.property_expense(claim_id);
CREATE INDEX IF NOT EXISTS idx_communication_log_entity ON core.communication_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_property_feature_property ON core.property_feature(property_id);

-- Partial indexes for common queries
CREATE INDEX IF NOT EXISTS idx_active_policies 
ON core.insurance_policy(user_id, property_id) 
WHERE is_current = true;

CREATE INDEX IF NOT EXISTS idx_open_claims 
ON core.claim(property_id, status) 
WHERE status NOT IN ('settled', 'closed', 'denied');

-- ============================================================================
-- PART 10: RLS POLICIES FOR NEW TABLES
-- ============================================================================

-- Enable RLS
ALTER TABLE core.claim_payment ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.property_expense ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.communication_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.property_feature ENABLE ROW LEVEL SECURITY;

-- Claim payment policies
CREATE POLICY "Users can view payments for own claims" ON core.claim_payment
FOR SELECT USING (
    claim_id IN (
        SELECT c.id FROM core.claim c
        JOIN public.properties p ON c.property_id = p.id
        WHERE p.user_id = auth.uid()
    )
);

-- Property expense policies
CREATE POLICY "Users can manage own property expenses" ON core.property_expense
FOR ALL USING (
    property_id IN (
        SELECT id FROM public.properties WHERE user_id = auth.uid()
    )
);

-- Communication log policies
CREATE POLICY "Users can view own communications" ON core.communication_log
FOR SELECT USING (
    (entity_type = 'claim' AND entity_id IN (
        SELECT c.id FROM core.claim c
        JOIN public.properties p ON c.property_id = p.id
        WHERE p.user_id = auth.uid()
    )) OR
    (entity_type = 'property' AND entity_id IN (
        SELECT id FROM public.properties WHERE user_id = auth.uid()
    )) OR
    (entity_type = 'policy' AND entity_id IN (
        SELECT id FROM core.insurance_policy WHERE user_id = auth.uid()
    ))
);

-- Property feature policies
CREATE POLICY "Users can manage own property features" ON core.property_feature
FOR ALL USING (
    property_id IN (
        SELECT id FROM public.properties WHERE user_id = auth.uid()
    )
);

-- ============================================================================
-- PART 11: REFRESH FUNCTIONS FOR MATERIALIZED VIEWS
-- ============================================================================

CREATE OR REPLACE FUNCTION core.refresh_summaries()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY core.property_claims_summary;
    REFRESH MATERIALIZED VIEW CONCURRENTLY core.policy_coverage_summary;
END;
$$;

-- Schedule refresh (requires pg_cron)
-- SELECT cron.schedule('refresh-summaries', '0 */6 * * *', 'SELECT core.refresh_summaries()');

-- ============================================================================
-- PART 12: DATA QUALITY FUNCTIONS
-- ============================================================================

-- Validate phone numbers
CREATE OR REPLACE FUNCTION core.validate_phone(phone TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN phone ~ '^\+?[1-9]\d{1,14}$';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Validate email
CREATE OR REPLACE FUNCTION core.validate_email(email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add constraints using validation functions
ALTER TABLE reference.insurance_carrier
    ADD CONSTRAINT valid_phone CHECK (phone IS NULL OR core.validate_phone(phone)),
    ADD CONSTRAINT valid_claims_phone CHECK (claims_phone IS NULL OR core.validate_phone(claims_phone)),
    ADD CONSTRAINT valid_email CHECK (email IS NULL OR core.validate_email(email));

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE reference.insurance_carrier IS 'Master list of insurance carriers';
COMMENT ON TABLE reference.damage_category IS 'Standardized damage categories and subcategories';
COMMENT ON TABLE reference.florida_county IS 'Florida county reference data';
COMMENT ON TABLE core.claim_payment IS 'Payment tracking for insurance claims';
COMMENT ON TABLE core.property_expense IS 'Expense tracking for property maintenance and repairs';
COMMENT ON TABLE core.communication_log IS 'Universal communication tracking';
COMMENT ON MATERIALIZED VIEW core.property_claims_summary IS 'Aggregated claims data by property';
COMMENT ON MATERIALIZED VIEW core.policy_coverage_summary IS 'Current policy coverage summary';