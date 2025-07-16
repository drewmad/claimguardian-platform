-- Enable storage for policy documents
-- Create storage bucket for policy documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('policy-documents', 'policy-documents', false);

-- Create policy for authenticated users to upload their own files
CREATE POLICY "Users can upload their own policy documents" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'policy-documents' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Create policy for authenticated users to view their own files
CREATE POLICY "Users can view their own policy documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'policy-documents' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Create policy for authenticated users to delete their own files
CREATE POLICY "Users can delete their own policy documents" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'policy-documents' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Create policy for authenticated users to update their own files
CREATE POLICY "Users can update their own policy documents" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'policy-documents' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

COMMENT ON TABLE storage.objects IS 'Policy documents are stored with user ID as folder name: /policy-documents/{user_id}/{filename}';