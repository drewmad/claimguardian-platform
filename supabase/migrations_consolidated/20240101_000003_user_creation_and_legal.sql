-- User creation triggers and legal compliance
-- Handles automatic user profile creation and legal document tracking

-- Legal documents table
CREATE TABLE IF NOT EXISTS public.legal_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL CHECK (type IN ('terms_of_service', 'privacy_policy')),
  version TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  effective_date TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT false,
  summary_of_changes TEXT,
  UNIQUE(type, version)
);

-- User legal acceptances table
CREATE TABLE IF NOT EXISTS public.user_legal_acceptances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  document_id UUID REFERENCES public.legal_documents(id) NOT NULL,
  accepted_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
  ip_address INET,
  user_agent TEXT,
  acceptance_method TEXT DEFAULT 'click',
  parent_acceptance_id UUID REFERENCES public.user_legal_acceptances(id),
  UNIQUE(user_id, document_id)
);

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_default_name TEXT;
BEGIN
  -- Extract default name from email
  v_default_name := split_part(NEW.email, '@', 1);
  
  -- Log the user creation attempt
  RAISE LOG 'Creating profile for user % with email %', NEW.id, NEW.email;
  
  -- Insert user profile
  INSERT INTO public.user_profiles (
    id,
    email,
    display_name,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    v_default_name,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  );
  
  -- Log successful creation
  INSERT INTO security.audit_logs (
    table_name,
    operation,
    user_id,
    record_id,
    new_data
  ) VALUES (
    'user_profiles',
    'INSERT',
    NEW.id,
    NEW.id,
    jsonb_build_object(
      'id', NEW.id,
      'email', NEW.email,
      'display_name', v_default_name,
      'trigger_source', 'handle_new_user'
    )
  );
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE LOG 'Error creating profile for user %: %', NEW.id, SQLERRM;
  RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user needs to accept legal documents
CREATE OR REPLACE FUNCTION public.check_legal_acceptance(p_user_id UUID)
RETURNS TABLE (
  needs_acceptance BOOLEAN,
  missing_documents JSONB
) AS $$
DECLARE
  v_missing JSONB := '[]'::JSONB;
  v_needs BOOLEAN := false;
BEGIN
  -- Check for missing acceptances
  WITH active_docs AS (
    SELECT id, type, version, title
    FROM public.legal_documents
    WHERE is_active = true
  ),
  user_acceptances AS (
    SELECT document_id
    FROM public.user_legal_acceptances
    WHERE user_id = p_user_id
  )
  SELECT 
    COUNT(*) > 0,
    COALESCE(jsonb_agg(
      jsonb_build_object(
        'id', ad.id,
        'type', ad.type,
        'version', ad.version,
        'title', ad.title
      )
    ), '[]'::jsonb)
  INTO v_needs, v_missing
  FROM active_docs ad
  LEFT JOIN user_acceptances ua ON ad.id = ua.document_id
  WHERE ua.document_id IS NULL;
  
  RETURN QUERY SELECT v_needs, v_missing;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- RLS policies
ALTER TABLE public.legal_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_legal_acceptances ENABLE ROW LEVEL SECURITY;

-- Legal documents policies
CREATE POLICY "Anyone can view active legal documents" ON public.legal_documents
  FOR SELECT USING (is_active = true);

CREATE POLICY "Service role can manage legal documents" ON public.legal_documents
  USING (auth.role() = 'service_role');

-- User legal acceptances policies
CREATE POLICY "Users can view own acceptances" ON public.user_legal_acceptances
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own acceptances" ON public.user_legal_acceptances
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role full access" ON public.user_legal_acceptances
  USING (auth.role() = 'service_role');

-- Indexes
CREATE INDEX idx_legal_documents_active ON public.legal_documents(is_active, type);
CREATE INDEX idx_user_legal_acceptances_user ON public.user_legal_acceptances(user_id);
CREATE INDEX idx_user_legal_acceptances_document ON public.user_legal_acceptances(document_id);

-- Insert initial legal documents
INSERT INTO public.legal_documents (type, version, title, content, effective_date, is_active)
VALUES 
  ('terms_of_service', '1.0', 'Terms of Service', 'Initial terms of service content', CURRENT_TIMESTAMP, true),
  ('privacy_policy', '1.0', 'Privacy Policy', 'Initial privacy policy content', CURRENT_TIMESTAMP, true)
ON CONFLICT (type, version) DO NOTHING;