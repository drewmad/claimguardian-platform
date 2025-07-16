-- Fix document enum and create policy_documents table

-- First, drop the existing enum if it exists (safely)
DO $$ 
BEGIN
    -- Check if the enum exists and drop it
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'document_type_enum') THEN
        DROP TYPE public.document_type_enum CASCADE;
    END IF;
END $$;

-- Create the correct document type enum
CREATE TYPE public.document_type_enum AS ENUM (
    'policy',
    'claim', 
    'evidence'
);

-- Create policy_documents table (drop first if exists)
DROP TABLE IF EXISTS public.policy_documents CASCADE;

CREATE TABLE public.policy_documents (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    policy_id uuid REFERENCES public.policies(id) ON DELETE SET NULL,
    file_path text NOT NULL,
    file_name text NOT NULL,
    file_size integer NOT NULL,
    file_type text NOT NULL,
    document_type public.document_type_enum NOT NULL DEFAULT 'policy',
    description text,
    uploaded_at timestamptz DEFAULT now(),
    uploaded_by uuid NOT NULL REFERENCES auth.users(id),
    
    -- Constraints
    CONSTRAINT valid_file_size CHECK (file_size > 0 AND file_size <= 52428800), -- 50MB limit
    CONSTRAINT valid_file_type CHECK (file_type IN (
        'application/pdf',
        'image/png', 
        'image/jpeg',
        'image/jpg'
    ))
);

-- Create indexes for performance
CREATE INDEX idx_policy_documents_property_id ON public.policy_documents(property_id);
CREATE INDEX idx_policy_documents_policy_id ON public.policy_documents(policy_id);
CREATE INDEX idx_policy_documents_uploaded_by ON public.policy_documents(uploaded_by);
CREATE INDEX idx_policy_documents_document_type ON public.policy_documents(document_type);
CREATE INDEX idx_policy_documents_uploaded_at ON public.policy_documents(uploaded_at DESC);

-- Enable Row Level Security
ALTER TABLE public.policy_documents ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for policy_documents
CREATE POLICY "Users can view their own documents" ON public.policy_documents
    FOR SELECT USING (uploaded_by = auth.uid());

CREATE POLICY "Users can insert their own documents" ON public.policy_documents
    FOR INSERT WITH CHECK (uploaded_by = auth.uid());

CREATE POLICY "Users can update their own documents" ON public.policy_documents
    FOR UPDATE USING (uploaded_by = auth.uid());

CREATE POLICY "Users can delete their own documents" ON public.policy_documents
    FOR DELETE USING (uploaded_by = auth.uid());

-- Add helpful comments
COMMENT ON TABLE public.policy_documents IS 'Stores metadata for uploaded policy documents';
COMMENT ON COLUMN public.policy_documents.file_path IS 'Path to file in Supabase Storage bucket';
COMMENT ON COLUMN public.policy_documents.file_size IS 'File size in bytes (max 50MB)';
COMMENT ON COLUMN public.policy_documents.document_type IS 'Type of document: policy, claim, or evidence';