-- Claims and insurance policies management
-- Handles insurance claims, policies, and related documents

-- Create enums
CREATE TYPE claim_status AS ENUM (
  'draft', 'submitted', 'acknowledged', 'investigating', 
  'approved', 'denied', 'appealed', 'closed', 'reopened'
);

CREATE TYPE damage_type AS ENUM (
  'hurricane', 'flood', 'fire', 'theft', 'vandalism', 
  'wind', 'hail', 'water', 'structural', 'other'
);

CREATE TYPE policy_type AS ENUM (
  'homeowners', 'flood', 'windstorm', 'umbrella', 'other'
);

CREATE TYPE document_type AS ENUM (
  'policy', 'declaration', 'claim_form', 'estimate', 
  'invoice', 'photo', 'video', 'report', 'correspondence', 'other'
);

-- Insurance policies table
CREATE TABLE IF NOT EXISTS public.insurance_policies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  policy_number TEXT NOT NULL,
  policy_type policy_type NOT NULL,
  carrier_name TEXT NOT NULL,
  carrier_phone TEXT,
  carrier_email TEXT,
  agent_name TEXT,
  agent_phone TEXT,
  agent_email TEXT,
  effective_date DATE NOT NULL,
  expiration_date DATE NOT NULL,
  annual_premium NUMERIC(10,2),
  deductible NUMERIC(10,2),
  coverage_limit NUMERIC(12,2),
  is_active BOOLEAN DEFAULT true,
  policy_document_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
  UNIQUE(policy_number, carrier_name)
);

-- Insurance claims table
CREATE TABLE IF NOT EXISTS public.insurance_claims (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  policy_id UUID REFERENCES public.insurance_policies(id),
  claim_number TEXT,
  status claim_status DEFAULT 'draft' NOT NULL,
  damage_type damage_type NOT NULL,
  damage_date DATE NOT NULL,
  damage_description TEXT NOT NULL,
  estimated_loss NUMERIC(12,2),
  deductible_amount NUMERIC(10,2),
  submitted_date TIMESTAMPTZ,
  adjuster_name TEXT,
  adjuster_phone TEXT,
  adjuster_email TEXT,
  settlement_amount NUMERIC(12,2),
  settlement_date DATE,
  appeal_deadline DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Policy documents storage
CREATE TABLE IF NOT EXISTS public.policy_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
  property_id UUID REFERENCES public.properties(id),
  policy_id UUID REFERENCES public.insurance_policies(id),
  claim_id UUID REFERENCES public.insurance_claims(id),
  document_type document_type NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  storage_path TEXT NOT NULL,
  description TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
  metadata JSONB DEFAULT '{}',
  is_verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
  CHECK (policy_id IS NOT NULL OR claim_id IS NOT NULL)
);

-- Document extractions table for AI processing
CREATE TABLE IF NOT EXISTS public.document_extractions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID REFERENCES public.policy_documents(id) ON DELETE CASCADE NOT NULL,
  extraction_type TEXT NOT NULL,
  extracted_data JSONB NOT NULL,
  confidence_score NUMERIC(3,2),
  ai_model TEXT,
  processing_time_ms INTEGER,
  status TEXT DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create storage bucket for policy documents
INSERT INTO storage.buckets (id, name, public, avif_autodetection, allowed_mime_types)
VALUES 
  ('policy-documents', 'policy-documents', false, false, 
   ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 
         'application/pdf', 'video/mp4', 'video/quicktime'])
ON CONFLICT (id) DO NOTHING;

-- RLS policies
ALTER TABLE public.insurance_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insurance_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.policy_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_extractions ENABLE ROW LEVEL SECURITY;

-- Insurance policies RLS
CREATE POLICY "Users manage own policies" ON public.insurance_policies
  USING (auth.uid() = user_id);

-- Insurance claims RLS
CREATE POLICY "Users manage own claims" ON public.insurance_claims
  USING (auth.uid() = user_id);

-- Policy documents RLS
CREATE POLICY "Users manage own documents" ON public.policy_documents
  USING (auth.uid() = user_id);

-- Document extractions RLS
CREATE POLICY "Users view own extractions" ON public.document_extractions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.policy_documents pd
      WHERE pd.id = document_extractions.document_id
      AND pd.user_id = auth.uid()
    )
  );

-- Storage policies for policy documents
CREATE POLICY "Users can upload own documents" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'policy-documents' AND
    (auth.uid())::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view own documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'policy-documents' AND
    (auth.uid())::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update own documents" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'policy-documents' AND
    (auth.uid())::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own documents" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'policy-documents' AND
    (auth.uid())::text = (storage.foldername(name))[1]
  );

-- Add triggers
CREATE TRIGGER set_updated_at_insurance_policies
  BEFORE UPDATE ON public.insurance_policies
  FOR EACH ROW
  EXECUTE FUNCTION core.set_updated_at();

CREATE TRIGGER set_updated_at_insurance_claims
  BEFORE UPDATE ON public.insurance_claims
  FOR EACH ROW
  EXECUTE FUNCTION core.set_updated_at();

CREATE TRIGGER set_updated_at_document_extractions
  BEFORE UPDATE ON public.document_extractions
  FOR EACH ROW
  EXECUTE FUNCTION core.set_updated_at();

-- Create indexes
CREATE INDEX idx_insurance_policies_user_property ON public.insurance_policies(user_id, property_id);
CREATE INDEX idx_insurance_policies_active ON public.insurance_policies(is_active, expiration_date);
CREATE INDEX idx_insurance_claims_user_property ON public.insurance_claims(user_id, property_id);
CREATE INDEX idx_insurance_claims_status ON public.insurance_claims(status);
CREATE INDEX idx_policy_documents_user ON public.policy_documents(user_id);
CREATE INDEX idx_policy_documents_references ON public.policy_documents(policy_id, claim_id);
CREATE INDEX idx_document_extractions_document ON public.document_extractions(document_id);
CREATE INDEX idx_document_extractions_status ON public.document_extractions(status);