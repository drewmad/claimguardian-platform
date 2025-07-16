-- Fix log_login_activity function to have consistent signature and security
-- This consolidates multiple versions into a single, correct implementation

-- Drop existing functions (both versions)
DROP FUNCTION IF EXISTS public.log_login_activity(uuid, inet, text, boolean, text);
DROP FUNCTION IF EXISTS public.log_login_activity(uuid, text, text, boolean, text);

-- Create the correct version with text for ip_address (matching the table column type)
CREATE OR REPLACE FUNCTION public.log_login_activity(
    p_user_id uuid, 
    p_ip_address text, 
    p_user_agent text, 
    p_success boolean DEFAULT true, 
    p_failure_reason text DEFAULT NULL
)
RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER 
AS $$
BEGIN
    INSERT INTO login_activity (
        user_id,
        ip_address,
        user_agent,
        success,
        failure_reason
    ) VALUES (
        p_user_id,
        p_ip_address,
        p_user_agent,
        p_success,
        p_failure_reason
    );
END;
$$;

-- Add comment for documentation
COMMENT ON FUNCTION public.log_login_activity IS 'Logs user login attempts with IP address, user agent, and success/failure status';