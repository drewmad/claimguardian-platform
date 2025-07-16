-- Add claims and policies tables with enhanced schema improvements

-- Create enum types for claims and policies (if not exists)
DO $$ BEGIN
    CREATE TYPE public.claim_status_enum AS ENUM (
        'draft',
        'submitted',
        'under_review',
        'approved',
        'denied',
        'settled',
        'closed',
        'reopened'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.damage_type_enum AS ENUM (
        'hurricane',
        'flood',
        'wind',
        'hail',
        'fire',
        'water_damage',
        'mold',
        'theft',
        'vandalism',
        'lightning',
        'fallen_tree',
        'other'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.policy_type_enum AS ENUM (
        'HO3',      -- Homeowners (Special Form)
        'HO5',      -- Comprehensive
        'HO6',      -- Condo
        'HO8',      -- Older Home
        'DP1',      -- Basic Dwelling
        'DP3',      -- Special Dwelling
        'FLOOD',    -- Flood Insurance
        'WIND',     -- Wind/Hurricane Only
        'UMBRELLA', -- Umbrella Policy
        'OTHER'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create policies table
CREATE TABLE public.policies (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    carrier_name text NOT NULL,
    policy_number text NOT NULL,
    policy_type public.policy_type_enum NOT NULL,
    effective_date date NOT NULL,
    expiration_date date NOT NULL,
    coverage_details jsonb DEFAULT '{}',
    premium_amount numeric(10, 2),
    deductible_amount numeric(10, 2),
    wind_deductible_percentage numeric(5, 2),
    flood_deductible_amount numeric(10, 2),
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    created_by uuid REFERENCES auth.users(id),
    UNIQUE (property_id, policy_number, policy_type)
);

-- Create claims table
CREATE TABLE public.claims (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    claim_number text UNIQUE,
    property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    policy_id uuid NOT NULL REFERENCES public.policies(id) ON DELETE RESTRICT,
    user_id uuid NOT NULL REFERENCES auth.users(id),
    status public.claim_status_enum NOT NULL DEFAULT 'draft',
    damage_type public.damage_type_enum NOT NULL,
    date_of_loss date NOT NULL,
    date_reported date DEFAULT CURRENT_DATE,
    description text,
    estimated_value numeric(15, 2),
    deductible_applied numeric(15, 2),
    settled_value numeric(15, 2),
    settlement_date date,
    adjuster_name text,
    adjuster_phone text,
    adjuster_email text,
    claim_notes text,
    supporting_documents jsonb DEFAULT '[]',
    metadata jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create claim status history table for tracking status changes
CREATE TABLE public.claim_status_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    claim_id uuid NOT NULL REFERENCES public.claims(id) ON DELETE CASCADE,
    previous_status public.claim_status_enum,
    new_status public.claim_status_enum NOT NULL,
    changed_by uuid NOT NULL REFERENCES auth.users(id),
    reason text,
    created_at timestamptz DEFAULT now()
);

-- Create claim communications table
CREATE TABLE public.claim_communications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    claim_id uuid NOT NULL REFERENCES public.claims(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id),
    communication_type text NOT NULL CHECK (communication_type IN ('email', 'phone', 'letter', 'meeting', 'other')),
    direction text NOT NULL CHECK (direction IN ('incoming', 'outgoing')),
    subject text,
    content text NOT NULL,
    attachments jsonb DEFAULT '[]',
    created_at timestamptz DEFAULT now()
);

-- Skip data migration for now - will be handled when users create new properties
-- Existing properties will use the new property wizard to add insurance information
-- 
-- INSERT INTO public.policies (
--     property_id,
--     carrier_name,
--     policy_number,
--     policy_type,
--     effective_date,
--     expiration_date,
--     coverage_details,
--     created_by
-- )
-- SELECT 
--     p.id as property_id,
--     COALESCE(p.details->>'insurance_carrier', 'Unknown') as carrier_name,
--     COALESCE(p.details->>'policy_number', 'LEGACY-' || p.id::text) as policy_number,
--     'HO3'::public.policy_type_enum as policy_type,
--     CURRENT_DATE - interval '1 year' as effective_date,
--     CURRENT_DATE + interval '1 year' as expiration_date,
--     '{}' as coverage_details,
--     p.user_id as created_by
-- FROM public.properties p
-- WHERE p.details->>'insurance_carrier' IS NOT NULL
--    OR p.details->>'policy_number' IS NOT NULL
-- ON CONFLICT (property_id, policy_number, policy_type) DO NOTHING;

-- Add structured address columns to properties table
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS street_address text,
ADD COLUMN IF NOT EXISTS city text,
ADD COLUMN IF NOT EXISTS state text,
ADD COLUMN IF NOT EXISTS postal_code text,
ADD COLUMN IF NOT EXISTS county text,
ADD COLUMN IF NOT EXISTS country text DEFAULT 'USA';

-- Migrate existing address data to structured columns
UPDATE public.properties
SET 
    street_address = TRIM(CONCAT(
        COALESCE(address->>'street1', ''),
        CASE 
            WHEN address->>'street2' IS NOT NULL AND address->>'street2' != '' 
            THEN ', ' || (address->>'street2')
            ELSE ''
        END
    )),
    city = address->>'city',
    state = address->>'state',
    postal_code = address->>'zip',
    county = address->>'county',
    country = COALESCE(address->>'country', 'USA')
WHERE address IS NOT NULL;

-- Add foreign key for parcel_id if parcels table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'parcels') THEN
        ALTER TABLE public.properties
        ADD CONSTRAINT fk_properties_parcel_id 
        FOREIGN KEY (parcel_id) 
        REFERENCES public.parcels(parcel_id)
        ON DELETE SET NULL;
    END IF;
END $$;

-- Remove redundant property type column
-- First, consolidate data into property_type
UPDATE public.properties
SET property_type = COALESCE(property_type, type, 'Single Family Home')
WHERE property_type IS NULL AND type IS NOT NULL;

-- Drop the redundant type column
ALTER TABLE public.properties
DROP COLUMN IF EXISTS type;

-- Create indexes for better query performance
CREATE INDEX idx_policies_property_id ON public.policies(property_id);
CREATE INDEX idx_policies_carrier_name ON public.policies(carrier_name);
CREATE INDEX idx_policies_expiration_date ON public.policies(expiration_date);
CREATE INDEX idx_policies_is_active ON public.policies(is_active);

CREATE INDEX idx_claims_property_id ON public.claims(property_id);
CREATE INDEX idx_claims_policy_id ON public.claims(policy_id);
CREATE INDEX idx_claims_user_id ON public.claims(user_id);
CREATE INDEX idx_claims_status ON public.claims(status);
CREATE INDEX idx_claims_date_of_loss ON public.claims(date_of_loss);
CREATE INDEX idx_claims_claim_number ON public.claims(claim_number);

CREATE INDEX idx_claim_status_history_claim_id ON public.claim_status_history(claim_id);
CREATE INDEX idx_claim_communications_claim_id ON public.claim_communications(claim_id);

CREATE INDEX idx_properties_street_address ON public.properties(street_address);
CREATE INDEX idx_properties_city_state ON public.properties(city, state);
CREATE INDEX idx_properties_postal_code ON public.properties(postal_code);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_policies_updated_at BEFORE UPDATE ON public.policies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_claims_updated_at BEFORE UPDATE ON public.claims
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create view for active policies
CREATE OR REPLACE VIEW public.active_policies AS
SELECT 
    p.*,
    prop.name as property_name,
    prop.street_address,
    prop.city,
    prop.state,
    prop.postal_code
FROM public.policies p
JOIN public.properties prop ON p.property_id = prop.id
WHERE p.is_active = true
  AND p.expiration_date >= CURRENT_DATE;

-- Create view for claims with property and policy details
CREATE OR REPLACE VIEW public.claims_overview AS
SELECT 
    c.*,
    prop.name as property_name,
    prop.street_address,
    prop.city,
    prop.state,
    pol.carrier_name,
    pol.policy_number,
    pol.policy_type,
    u.email as user_email,
    u.raw_user_meta_data->>'full_name' as user_name
FROM public.claims c
JOIN public.properties prop ON c.property_id = prop.id
JOIN public.policies pol ON c.policy_id = pol.id
JOIN auth.users u ON c.user_id = u.id;

-- Add Row Level Security (RLS) policies
ALTER TABLE public.policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claim_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claim_communications ENABLE ROW LEVEL SECURITY;

-- Policies RLS: Users can only see policies for their properties
CREATE POLICY "Users can view policies for their properties"
    ON public.policies FOR SELECT
    USING (
        property_id IN (
            SELECT id FROM public.properties 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create policies for their properties"
    ON public.policies FOR INSERT
    WITH CHECK (
        property_id IN (
            SELECT id FROM public.properties 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update policies for their properties"
    ON public.policies FOR UPDATE
    USING (
        property_id IN (
            SELECT id FROM public.properties 
            WHERE user_id = auth.uid()
        )
    );

-- Claims RLS: Users can only see their own claims
CREATE POLICY "Users can view their own claims"
    ON public.claims FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can create their own claims"
    ON public.claims FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own claims"
    ON public.claims FOR UPDATE
    USING (user_id = auth.uid());

-- Claim status history RLS: Users can view history for their claims
CREATE POLICY "Users can view status history for their claims"
    ON public.claim_status_history FOR SELECT
    USING (
        claim_id IN (
            SELECT id FROM public.claims 
            WHERE user_id = auth.uid()
        )
    );

-- Claim communications RLS: Users can view communications for their claims
CREATE POLICY "Users can view communications for their claims"
    ON public.claim_communications FOR SELECT
    USING (
        claim_id IN (
            SELECT id FROM public.claims 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create communications for their claims"
    ON public.claim_communications FOR INSERT
    WITH CHECK (
        user_id = auth.uid() AND
        claim_id IN (
            SELECT id FROM public.claims 
            WHERE user_id = auth.uid()
        )
    );

-- Create function to generate claim numbers
CREATE OR REPLACE FUNCTION generate_claim_number()
RETURNS TRIGGER AS $$
DECLARE
    year_prefix text;
    sequence_number int;
    new_claim_number text;
BEGIN
    -- Get current year
    year_prefix := to_char(CURRENT_DATE, 'YYYY');
    
    -- Get the next sequence number for this year
    SELECT COALESCE(MAX(
        CAST(
            SUBSTRING(claim_number FROM 6 FOR 6) AS INTEGER
        )
    ), 0) + 1
    INTO sequence_number
    FROM public.claims
    WHERE claim_number LIKE year_prefix || '-%';
    
    -- Generate claim number: YYYY-NNNNNN
    new_claim_number := year_prefix || '-' || LPAD(sequence_number::text, 6, '0');
    
    NEW.claim_number := new_claim_number;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to auto-generate claim numbers
CREATE TRIGGER generate_claim_number_trigger
    BEFORE INSERT ON public.claims
    FOR EACH ROW
    WHEN (NEW.claim_number IS NULL)
    EXECUTE FUNCTION generate_claim_number();

-- Add helpful comments
COMMENT ON TABLE public.policies IS 'Insurance policies associated with properties';
COMMENT ON TABLE public.claims IS 'Insurance claims filed for property damage';
COMMENT ON TABLE public.claim_status_history IS 'Audit trail of claim status changes';
COMMENT ON TABLE public.claim_communications IS 'Communications log for claims';
COMMENT ON COLUMN public.policies.coverage_details IS 'JSONB field for flexible storage of coverage limits, exclusions, and special conditions';
COMMENT ON COLUMN public.claims.supporting_documents IS 'Array of document references (URLs or file paths)';
COMMENT ON COLUMN public.claims.metadata IS 'Flexible JSONB field for additional claim data';

-- Grant permissions for authenticated users
GRANT ALL ON public.policies TO authenticated;
GRANT ALL ON public.claims TO authenticated;
GRANT ALL ON public.claim_status_history TO authenticated;
GRANT ALL ON public.claim_communications TO authenticated;
GRANT SELECT ON public.active_policies TO authenticated;
GRANT SELECT ON public.claims_overview TO authenticated;

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;