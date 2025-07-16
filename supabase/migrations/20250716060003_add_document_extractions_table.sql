-- Add document_extractions table for AI processing results

-- Create processing status enum
DO $$ BEGIN
    CREATE TYPE public.processing_status_enum AS ENUM (
        'pending',
        'processing',
        'completed',
        'failed'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create document_extractions table
CREATE TABLE IF NOT EXISTS public.document_extractions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id uuid NOT NULL REFERENCES public.policy_documents(id) ON DELETE CASCADE,
    property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    processed_by uuid NOT NULL REFERENCES auth.users(id),
    
    -- Processing status
    processing_status public.processing_status_enum NOT NULL DEFAULT 'pending',
    error_message text,
    processing_time_ms integer,
    
    -- Extracted data
    extracted_data jsonb DEFAULT '{}',
    confidence_score decimal(3,2) DEFAULT 0.0 CHECK (confidence_score >= 0.0 AND confidence_score <= 1.0),
    
    -- Application tracking
    applied_to_property boolean DEFAULT false,
    applied_at timestamptz,
    
    -- Timestamps
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    
    -- Constraints
    UNIQUE (document_id),
    CHECK (processing_time_ms >= 0)
);

-- Create indexes for performance
CREATE INDEX idx_document_extractions_document_id ON public.document_extractions(document_id);
CREATE INDEX idx_document_extractions_property_id ON public.document_extractions(property_id);
CREATE INDEX idx_document_extractions_processed_by ON public.document_extractions(processed_by);
CREATE INDEX idx_document_extractions_status ON public.document_extractions(processing_status);
CREATE INDEX idx_document_extractions_confidence ON public.document_extractions(confidence_score DESC);
CREATE INDEX idx_document_extractions_created_at ON public.document_extractions(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.document_extractions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for document_extractions
CREATE POLICY "Users can view their own extractions" ON public.document_extractions
    FOR SELECT USING (processed_by = auth.uid());

CREATE POLICY "Users can insert their own extractions" ON public.document_extractions
    FOR INSERT WITH CHECK (processed_by = auth.uid());

CREATE POLICY "Users can update their own extractions" ON public.document_extractions
    FOR UPDATE USING (processed_by = auth.uid());

CREATE POLICY "Users can delete their own extractions" ON public.document_extractions
    FOR DELETE USING (processed_by = auth.uid());

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_document_extractions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER trigger_update_document_extractions_updated_at
    BEFORE UPDATE ON public.document_extractions
    FOR EACH ROW
    EXECUTE FUNCTION update_document_extractions_updated_at();

-- Add helpful comments
COMMENT ON TABLE public.document_extractions IS 'Stores AI extraction results from policy documents';
COMMENT ON COLUMN public.document_extractions.extracted_data IS 'JSON object containing extracted policy data';
COMMENT ON COLUMN public.document_extractions.confidence_score IS 'AI confidence score between 0.0 and 1.0';
COMMENT ON COLUMN public.document_extractions.processing_status IS 'Current status of AI processing';
COMMENT ON COLUMN public.document_extractions.applied_to_property IS 'Whether extracted data has been applied to property/policy';