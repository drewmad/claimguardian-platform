-- Create storage bucket for policy documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'policy-documents',
  'policy-documents', 
  false,
  10485760, -- 10MB limit
  ARRAY['application/pdf']::text[]
)
ON CONFLICT (id) DO UPDATE
SET 
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage policies for policy documents bucket
CREATE POLICY "Users can upload their own policy documents"
ON storage.objects
FOR INSERT 
TO authenticated
WITH CHECK (
  bucket_id = 'policy-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own policy documents"
ON storage.objects
FOR SELECT 
TO authenticated
USING (
  bucket_id = 'policy-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own policy documents"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'policy-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'policy-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own policy documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'policy-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);