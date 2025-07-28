-- Fix permissions for scraper_logs table
-- Allow anon users to insert logs (for your Node.js scrapers)

-- First check if RLS policies exist and drop them
DROP POLICY IF EXISTS "Service role can manage scraper logs" ON public.scraper_logs;
DROP POLICY IF EXISTS "Authenticated users can read scraper logs" ON public.scraper_logs;
DROP POLICY IF EXISTS "Anon users can insert scraper logs" ON public.scraper_logs;

-- Create new policies
-- Allow service role full access
CREATE POLICY "Service role can manage scraper logs"
ON public.scraper_logs FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- Allow authenticated users to read
CREATE POLICY "Authenticated users can read scraper logs"
ON public.scraper_logs FOR SELECT 
TO authenticated 
USING (true);

-- Allow anon users to insert logs (for scrapers)
CREATE POLICY "Anon users can insert scraper logs"
ON public.scraper_logs FOR INSERT 
TO anon 
WITH CHECK (true);

-- Grant proper permissions
GRANT SELECT, INSERT ON public.scraper_logs TO anon;
GRANT ALL ON public.scraper_logs TO authenticated;
GRANT ALL ON public.scraper_logs TO service_role;

-- Also fix the function parameter name issue
DROP FUNCTION IF EXISTS public.get_my_claim_details(UUID);

CREATE OR REPLACE FUNCTION public.get_my_claim_details(p_claim_id UUID)
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
    -- Only return data if the user is authenticated
    IF auth.uid() IS NULL THEN
        RETURN;
    END IF;
    
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
    WHERE c.id = p_claim_id
    AND c.user_id = auth.uid();
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_my_claim_details(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_claim_details(UUID) TO anon;