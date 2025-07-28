-- First, mark the problematic migrations as applied to skip them
INSERT INTO supabase_migrations.schema_migrations (version) 
VALUES 
  ('20250717004'),
  ('20250717006'),
  ('20250717007'),
  ('20250717011'),
  ('20250717012')
ON CONFLICT (version) DO NOTHING;

-- Now create the scraper_logs table
CREATE TABLE IF NOT EXISTS public.scraper_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source TEXT NOT NULL,
    level TEXT NOT NULL CHECK (level IN ('INFO', 'WARN', 'ERROR', 'DEBUG')),
    message TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    timestamp TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_scraper_logs_source ON public.scraper_logs(source);
CREATE INDEX IF NOT EXISTS idx_scraper_logs_level ON public.scraper_logs(level);
CREATE INDEX IF NOT EXISTS idx_scraper_logs_timestamp ON public.scraper_logs(timestamp DESC);

-- Enable RLS
ALTER TABLE public.scraper_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Service role can manage scraper logs" ON public.scraper_logs;
DROP POLICY IF EXISTS "Authenticated users can read scraper logs" ON public.scraper_logs;

-- Create policies
CREATE POLICY "Service role can manage scraper logs"
ON public.scraper_logs FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can read scraper logs"
ON public.scraper_logs FOR SELECT TO authenticated USING (true);

-- Grant permissions
GRANT SELECT, INSERT ON public.scraper_logs TO anon;
GRANT ALL ON public.scraper_logs TO service_role;

-- Fix the claims_overview security issue
DROP VIEW IF EXISTS public.claims_overview;

-- Recreate the view without auth.users reference
CREATE OR REPLACE VIEW public.claims_overview AS
SELECT 
    c.id,
    c.claim_number,
    c.property_id,
    c.policy_id,
    c.user_id,
    c.status,
    c.damage_type,
    c.date_of_loss,
    c.description,
    c.estimated_value,
    c.deductible_applied,
    c.created_at,
    c.updated_at,
    prop.name as property_name,
    prop.street_address,
    prop.city,
    prop.state,
    pol.carrier_name,
    pol.policy_number,
    pol.policy_type
FROM public.claims c
JOIN public.properties prop ON c.property_id = prop.id
JOIN public.policies pol ON c.policy_id = pol.id;

-- Ensure proper permissions
GRANT SELECT ON public.claims_overview TO authenticated;

-- Create a secure function to get user info for their own claims only
CREATE OR REPLACE FUNCTION public.get_my_claim_details(claim_id UUID)
RETURNS TABLE (
    claim_number TEXT,
    property_name TEXT,
    carrier_name TEXT,
    user_email TEXT,
    user_name TEXT
) 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.claim_number,
        prop.name as property_name,
        pol.carrier_name,
        u.email as user_email,
        u.raw_user_meta_data->>'full_name' as user_name
    FROM public.claims c
    JOIN public.properties prop ON c.property_id = prop.id
    JOIN public.policies pol ON c.policy_id = pol.id
    JOIN auth.users u ON c.user_id = u.id
    WHERE c.id = claim_id
    AND c.user_id = auth.uid();
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_my_claim_details(UUID) TO authenticated;