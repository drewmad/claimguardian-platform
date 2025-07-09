-- Legal Documents and Consent Tracking
-- Provides immutable proof of user consent to legal documents

-- Master list of externally facing legal docs
CREATE TABLE IF NOT EXISTS public.legal_documents (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug             TEXT NOT NULL,                -- 'privacy-policy', 'terms-of-service'
  title            TEXT NOT NULL,                -- 'Privacy Policy'
  version          TEXT NOT NULL,                -- '2025-07-01' or 'v2.3.0'
  effective_date   DATE NOT NULL,
  sha256_hash      TEXT NOT NULL,                -- hex digest of html/md file
  storage_url      TEXT NOT NULL,                -- Supabase Storage URL
  is_active        BOOLEAN DEFAULT true,         -- current version flag
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(slug, version),                         -- prevent duplicate versions
  UNIQUE(slug, effective_date),                  -- one version per date
  CHECK(effective_date >= CURRENT_DATE)          -- prevent backdating
);

-- Each individual user acceptance event
CREATE TABLE IF NOT EXISTS public.user_legal_acceptance (
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  legal_id         UUID NOT NULL REFERENCES public.legal_documents(id),
  accepted_at      TIMESTAMPTZ DEFAULT NOW(),
  ip_address       INET,
  user_agent       TEXT,
  signature_data   JSONB,                        -- additional signature metadata
  revoked_at       TIMESTAMPTZ,                  -- for GDPR withdrawal
  
  PRIMARY KEY (user_id, legal_id)
);

-- Indexes for performance
CREATE INDEX idx_legal_documents_slug_active ON public.legal_documents(slug, is_active) WHERE is_active = true;
CREATE INDEX idx_legal_documents_effective_date ON public.legal_documents(effective_date DESC);
CREATE INDEX idx_user_legal_acceptance_user_id ON public.user_legal_acceptance(user_id);
CREATE INDEX idx_user_legal_acceptance_accepted_at ON public.user_legal_acceptance(accepted_at DESC);

-- Enable RLS
ALTER TABLE public.legal_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_legal_acceptance ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Legal documents are viewable by everyone (public)
CREATE POLICY "Legal documents are viewable by everyone" ON public.legal_documents
  FOR SELECT USING (true);

-- Users can only view their own acceptances
CREATE POLICY "Users can view own legal acceptances" ON public.user_legal_acceptance
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own acceptances
CREATE POLICY "Users can insert own legal acceptances" ON public.user_legal_acceptance
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Function to get documents needing acceptance by user
CREATE OR REPLACE FUNCTION public.needs_reaccept(uid UUID)
RETURNS SETOF public.legal_documents AS $$
  SELECT ld.*
  FROM public.legal_documents ld
  WHERE ld.is_active = true
    AND NOT EXISTS (
      SELECT 1
      FROM public.user_legal_acceptance ula
      WHERE ula.user_id = uid
        AND ula.legal_id = ld.id
        AND ula.revoked_at IS NULL
    )
$$ LANGUAGE sql SECURITY DEFINER;

-- Function to get current active legal documents
CREATE OR REPLACE FUNCTION public.get_active_legal_documents()
RETURNS SETOF public.legal_documents AS $$
  SELECT *
  FROM public.legal_documents
  WHERE is_active = true
  ORDER BY slug, effective_date DESC
$$ LANGUAGE sql SECURITY DEFINER;

-- Function to record legal acceptance
CREATE OR REPLACE FUNCTION public.record_legal_acceptance(
  p_user_id UUID,
  p_legal_id UUID,
  p_ip_address INET,
  p_user_agent TEXT,
  p_signature_data JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_acceptance_id UUID;
BEGIN
  INSERT INTO public.user_legal_acceptance (
    user_id,
    legal_id,
    ip_address,
    user_agent,
    signature_data
  ) VALUES (
    p_user_id,
    p_legal_id,
    p_ip_address,
    p_user_agent,
    p_signature_data
  ) ON CONFLICT (user_id, legal_id) 
  DO UPDATE SET
    accepted_at = NOW(),
    ip_address = EXCLUDED.ip_address,
    user_agent = EXCLUDED.user_agent,
    signature_data = EXCLUDED.signature_data,
    revoked_at = NULL
  RETURNING user_id INTO v_acceptance_id;
  
  RETURN v_acceptance_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to prevent backdating effective_date
CREATE OR REPLACE FUNCTION prevent_backdating()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.effective_date < CURRENT_DATE THEN
    RAISE EXCEPTION 'Cannot set effective_date in the past';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_prevent_backdating
  BEFORE INSERT OR UPDATE ON public.legal_documents
  FOR EACH ROW
  EXECUTE FUNCTION prevent_backdating();

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_legal_documents_updated_at
  BEFORE UPDATE ON public.legal_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT SELECT ON public.legal_documents TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.user_legal_acceptance TO authenticated;
GRANT EXECUTE ON FUNCTION public.needs_reaccept(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_active_legal_documents() TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_legal_acceptance(UUID, UUID, INET, TEXT, JSONB) TO authenticated;

-- Insert default legal documents (examples)
INSERT INTO public.legal_documents (slug, title, version, effective_date, sha256_hash, storage_url) VALUES
  ('privacy-policy', 'Privacy Policy', 'v1.0.0', CURRENT_DATE, 'placeholder_hash_1', 'https://placeholder.url/privacy-policy.html'),
  ('terms-of-service', 'Terms of Service', 'v1.0.0', CURRENT_DATE, 'placeholder_hash_2', 'https://placeholder.url/terms-of-service.html'),
  ('cookie-policy', 'Cookie Policy', 'v1.0.0', CURRENT_DATE, 'placeholder_hash_3', 'https://placeholder.url/cookie-policy.html')
ON CONFLICT (slug, version) DO NOTHING;