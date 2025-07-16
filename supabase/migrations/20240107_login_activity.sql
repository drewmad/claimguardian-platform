-- Create login activity table
CREATE TABLE IF NOT EXISTS public.login_activity (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ip_address INET,
  user_agent TEXT,
  device_type TEXT,
  browser TEXT,
  os TEXT,
  location_city TEXT,
  location_country TEXT,
  location_region TEXT,
  success BOOLEAN NOT NULL DEFAULT true,
  failure_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_login_activity_user_id ON public.login_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_login_activity_created_at ON public.login_activity(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_login_activity_user_created ON public.login_activity(user_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.login_activity ENABLE ROW LEVEL SECURITY;

-- Users can only view their own login activity
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'login_activity' 
        AND policyname = 'Users can view own login activity'
    ) THEN
        CREATE POLICY "Users can view own login activity" ON public.login_activity
          FOR SELECT USING (auth.uid() = user_id);
    END IF;
END $$;

-- Create function to log login activity
CREATE OR REPLACE FUNCTION public.log_login_activity(
  p_user_id UUID,
  p_ip_address INET,
  p_user_agent TEXT,
  p_success BOOLEAN DEFAULT true,
  p_failure_reason TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_activity_id UUID;
BEGIN
  INSERT INTO public.login_activity (
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
  ) RETURNING id INTO v_activity_id;
  
  RETURN v_activity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create view for recent login activity
CREATE OR REPLACE VIEW public.recent_login_activity AS
SELECT 
  la.*,
  COUNT(*) OVER (PARTITION BY la.user_id) as total_logins,
  COUNT(*) FILTER (WHERE la.success = false) OVER (PARTITION BY la.user_id) as failed_attempts
FROM public.login_activity la
WHERE la.created_at > NOW() - INTERVAL '30 days';

-- Grant access to the view
DO $$
BEGIN
    GRANT SELECT ON public.recent_login_activity TO authenticated;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;