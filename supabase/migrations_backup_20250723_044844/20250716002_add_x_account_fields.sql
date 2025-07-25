-- Add X (Twitter) account fields to user_profiles table
-- Date: 2025-07-16

-- Add X account fields to user_profiles table
ALTER TABLE public.user_profiles 
    ADD COLUMN IF NOT EXISTS x_handle TEXT,
    ADD COLUMN IF NOT EXISTS is_x_connected BOOLEAN DEFAULT false;

-- Add comments for clarity
COMMENT ON COLUMN public.user_profiles.x_handle IS 'X (Twitter) handle without @ symbol';
COMMENT ON COLUMN public.user_profiles.is_x_connected IS 'Whether user has connected their X account';

-- Update existing profiles with default values if needed
UPDATE public.user_profiles 
SET is_x_connected = false 
WHERE is_x_connected IS NULL;