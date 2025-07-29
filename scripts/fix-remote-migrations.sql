-- Fix Remote Migrations
-- This script checks for existing objects before creating them

-- Check and create user_tracking table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- First visit data
  first_visit_at timestamptz DEFAULT now(),
  first_visit_ip inet,
  first_visit_user_agent text,
  first_visit_referrer text,
  first_visit_utm_source text,
  first_visit_utm_medium text,
  first_visit_utm_campaign text,
  
  -- Latest visit data
  last_visit_at timestamptz DEFAULT now(),
  last_visit_ip inet,
  total_visits integer DEFAULT 1,
  
  -- User preferences
  preferred_language text DEFAULT 'en',
  timezone text DEFAULT 'America/New_York',
  
  -- Feature usage
  features_used jsonb DEFAULT '[]',
  onboarding_completed boolean DEFAULT false,
  onboarding_completed_at timestamptz,
  
  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes only if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_tracking_user_id') THEN
    CREATE INDEX idx_user_tracking_user_id ON public.user_tracking(user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_tracking_created_at') THEN
    CREATE INDEX idx_user_tracking_created_at ON public.user_tracking(created_at);
  END IF;
END $$;

-- Create user_preferences table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  
  -- Notification preferences
  email_notifications boolean DEFAULT true,
  sms_notifications boolean DEFAULT false,
  push_notifications boolean DEFAULT false,
  
  -- Communication preferences
  marketing_emails boolean DEFAULT false,
  newsletter boolean DEFAULT false,
  
  -- App preferences
  dark_mode boolean DEFAULT true,
  language text DEFAULT 'en',
  timezone text DEFAULT 'America/New_York',
  
  -- Privacy settings
  share_data_for_improvement boolean DEFAULT true,
  
  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index only if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_preferences_user_id') THEN
    CREATE INDEX idx_user_preferences_user_id ON public.user_preferences(user_id);
  END IF;
END $$;

-- Create user_activity_log table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Activity data
  action text NOT NULL,
  resource_type text,
  resource_id text,
  details jsonb DEFAULT '{}',
  
  -- Context
  ip_address inet,
  user_agent text,
  
  -- Timestamp
  created_at timestamptz DEFAULT now()
);

-- Create indexes only if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_activity_action') THEN
    CREATE INDEX idx_user_activity_action ON public.user_activity_log(action);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_activity_created_at') THEN
    CREATE INDEX idx_user_activity_created_at ON public.user_activity_log(created_at);
  END IF;
END $$;

-- Enable RLS on tables
ALTER TABLE public.user_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity_log ENABLE ROW LEVEL SECURITY;

-- Create RLS policies only if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'user_tracking_user_access' AND tablename = 'user_tracking') THEN
    CREATE POLICY "user_tracking_user_access" ON public.user_tracking
      FOR ALL TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'user_preferences_user_access' AND tablename = 'user_preferences') THEN
    CREATE POLICY "user_preferences_user_access" ON public.user_preferences
      FOR ALL TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'user_activity_user_access' AND tablename = 'user_activity_log') THEN
    CREATE POLICY "user_activity_user_access" ON public.user_activity_log
      FOR ALL TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Create triggers only if they don't exist
CREATE OR REPLACE FUNCTION update_timestamp_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_tracking_timestamp') THEN
    CREATE TRIGGER update_user_tracking_timestamp
      BEFORE UPDATE ON public.user_tracking
      FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_preferences_timestamp') THEN
    CREATE TRIGGER update_user_preferences_timestamp
      BEFORE UPDATE ON public.user_preferences
      FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();
  END IF;
END $$;

-- Now apply policy documents migration
CREATE TABLE IF NOT EXISTS public.policy_documents_extended (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE,
  policy_id uuid REFERENCES public.policies(id) ON DELETE CASCADE,
  
  -- Document information
  file_name text NOT NULL,
  file_size bigint NOT NULL,
  file_type text NOT NULL,
  storage_path text NOT NULL,
  
  -- AI Extracted data
  extracted_data jsonb DEFAULT '{}',
  extraction_status text DEFAULT 'pending', -- pending, processing, completed, failed
  extraction_error text,
  extracted_at timestamptz,
  
  -- Policy details extracted by AI
  carrier_name text,
  policy_number text,
  policy_type text, -- HO3, HO5, DP3, etc.
  effective_date date,
  expiration_date date,
  annual_premium numeric(15,2),
  
  -- Coverage details
  dwelling_coverage numeric(15,2),
  other_structures_coverage numeric(15,2),
  personal_property_coverage numeric(15,2),
  loss_of_use_coverage numeric(15,2),
  liability_coverage numeric(15,2),
  medical_payments_coverage numeric(15,2),
  
  -- Deductibles
  standard_deductible numeric(15,2),
  hurricane_deductible text, -- Can be percentage or dollar amount
  flood_deductible numeric(15,2),
  
  -- Special coverages
  special_coverages jsonb DEFAULT '[]', -- Array of {type, limit, deductible}
  exclusions jsonb DEFAULT '[]', -- Array of excluded perils
  endorsements jsonb DEFAULT '[]', -- Array of policy endorsements
  
  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes only if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_policy_documents_user_id') THEN
    CREATE INDEX idx_policy_documents_user_id ON public.policy_documents_extended(user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_policy_documents_property_id') THEN
    CREATE INDEX idx_policy_documents_property_id ON public.policy_documents_extended(property_id);
  END IF;
END $$;

-- Enable RLS
ALTER TABLE public.policy_documents_extended ENABLE ROW LEVEL SECURITY;

-- Create RLS policy only if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'policy_documents_user_access' AND tablename = 'policy_documents_extended') THEN
    CREATE POLICY "policy_documents_user_access" ON public.policy_documents_extended
      FOR ALL TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Create trigger only if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_policy_documents_timestamp') THEN
    CREATE TRIGGER update_policy_documents_timestamp
      BEFORE UPDATE ON public.policy_documents_extended
      FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();
  END IF;
END $$;

-- Create storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('policy-documents', 'policy-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies only if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can upload their own policy documents' AND tablename = 'objects' AND schemaname = 'storage') THEN
    CREATE POLICY "Users can upload their own policy documents" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'policy-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own policy documents' AND tablename = 'objects' AND schemaname = 'storage') THEN
    CREATE POLICY "Users can view their own policy documents" ON storage.objects
    FOR SELECT TO authenticated
    USING (bucket_id = 'policy-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete their own policy documents' AND tablename = 'objects' AND schemaname = 'storage') THEN
    CREATE POLICY "Users can delete their own policy documents" ON storage.objects
    FOR DELETE TO authenticated
    USING (bucket_id = 'policy-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;
END $$;

-- Create view for active policies
CREATE OR REPLACE VIEW public.active_policy_documents AS
SELECT 
  pd.*,
  p.name as property_name,
  p.address as property_address
FROM public.policy_documents_extended pd
LEFT JOIN public.properties p ON pd.property_id = p.id
WHERE pd.extraction_status = 'completed'
  AND pd.expiration_date > CURRENT_DATE;

-- Grant permissions
GRANT SELECT ON public.active_policy_documents TO authenticated;

-- Mark migrations as completed in Supabase
INSERT INTO supabase_migrations.schema_migrations (version) 
VALUES ('20250130000002'), ('20250130000003')
ON CONFLICT (version) DO NOTHING;