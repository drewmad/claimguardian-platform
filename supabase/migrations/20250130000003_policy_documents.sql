-- Create policy documents table for storing uploaded insurance policies
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

-- Create indexes
CREATE INDEX idx_policy_documents_user_id ON public.policy_documents_extended(user_id);
CREATE INDEX idx_policy_documents_property_id ON public.policy_documents_extended(property_id);
CREATE INDEX idx_policy_documents_policy_id ON public.policy_documents_extended(policy_id);
CREATE INDEX idx_policy_documents_extraction_status ON public.policy_documents_extended(extraction_status);

-- Enable RLS
ALTER TABLE public.policy_documents_extended ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own policy documents"
  ON public.policy_documents_extended
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can upload policy documents"
  ON public.policy_documents_extended
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own policy documents"
  ON public.policy_documents_extended
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own policy documents"
  ON public.policy_documents_extended
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to process policy document
CREATE OR REPLACE FUNCTION public.process_policy_document(
  p_document_id uuid,
  p_file_content text
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_extracted_data jsonb;
BEGIN
  -- This function will be called by Edge Functions after AI processing
  -- For now, just mark as processing
  UPDATE public.policy_documents_extended
  SET 
    extraction_status = 'processing',
    updated_at = now()
  WHERE id = p_document_id;
  
  RETURN jsonb_build_object('status', 'processing', 'document_id', p_document_id);
END;
$$;

-- Create function to update extracted data
CREATE OR REPLACE FUNCTION public.update_policy_extraction(
  p_document_id uuid,
  p_extracted_data jsonb
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.policy_documents_extended
  SET 
    extracted_data = p_extracted_data,
    extraction_status = 'completed',
    extracted_at = now(),
    -- Update individual fields from extracted data
    carrier_name = p_extracted_data->>'carrier',
    policy_number = p_extracted_data->>'policyNumber',
    policy_type = p_extracted_data->>'policyType',
    effective_date = (p_extracted_data->>'effectiveDate')::date,
    expiration_date = (p_extracted_data->>'expirationDate')::date,
    annual_premium = (p_extracted_data->>'premium')::numeric,
    dwelling_coverage = (p_extracted_data->>'coverageDwelling')::numeric,
    other_structures_coverage = (p_extracted_data->>'coverageOtherStructures')::numeric,
    personal_property_coverage = (p_extracted_data->>'coveragePersonalProperty')::numeric,
    loss_of_use_coverage = (p_extracted_data->>'coverageLossOfUse')::numeric,
    liability_coverage = (p_extracted_data->>'coverageLiability')::numeric,
    medical_payments_coverage = (p_extracted_data->>'coverageMedicalPayments')::numeric,
    standard_deductible = (p_extracted_data->>'standardDeductible')::numeric,
    hurricane_deductible = p_extracted_data->>'hurricaneDeductible',
    flood_deductible = (p_extracted_data->>'floodDeductible')::numeric,
    special_coverages = COALESCE(p_extracted_data->'specialCoverages', '[]'::jsonb),
    exclusions = COALESCE(p_extracted_data->'exclusions', '[]'::jsonb),
    endorsements = COALESCE(p_extracted_data->'endorsements', '[]'::jsonb),
    updated_at = now()
  WHERE id = p_document_id;
END;
$$;

-- Note: property_damage table doesn't exist yet, skipping this ALTER
-- This can be added later when the property_damage table is created

-- Create view for active policies
CREATE OR REPLACE VIEW public.active_policy_documents AS
SELECT 
  pd.*,
  p.address as property_address,
  p.city as property_city,
  p.state as property_state,
  p.zip_code as property_zip
FROM public.policy_documents_extended pd
JOIN public.properties p ON pd.property_id = p.id
WHERE pd.extraction_status = 'completed'
  AND pd.expiration_date > CURRENT_DATE;

-- Grant permissions
GRANT SELECT ON public.active_policy_documents TO authenticated;