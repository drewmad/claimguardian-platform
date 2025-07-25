-- Fix security issue: Remove direct auth.users reference from claims_overview
-- This prevents exposing sensitive user data to authenticated users

-- Drop the existing view that exposes auth.users data
DROP VIEW IF EXISTS public.claims_overview;

-- Recreate the view without auth.users reference
-- User information should be accessed through RLS policies, not directly
CREATE OR REPLACE VIEW public.claims_overview AS
SELECT 
    c.id,
    c.claim_number,
    c.property_id,
    c.policy_id,
    c.user_id,  -- Keep user_id for RLS filtering, but don't expose user data
    c.status,
    c.type,
    c.date_of_loss,
    c.description,
    c.estimated_amount,
    c.deductible,
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

-- Add comment explaining the security consideration
COMMENT ON VIEW public.claims_overview IS 'Claims overview without exposing auth.users data. User information should be accessed through proper authentication context.';

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
    -- Only return user info if the claim belongs to the requesting user
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
    AND c.user_id = auth.uid(); -- Only return data for the authenticated user
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_my_claim_details(UUID) TO authenticated;

-- Add comment explaining the function
COMMENT ON FUNCTION public.get_my_claim_details IS 'Securely returns claim details including user information, but only for claims owned by the authenticated user.';