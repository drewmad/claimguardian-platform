-- Create table for inventory item photos and documents
CREATE TABLE IF NOT EXISTS public.inventory_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  inventory_item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Document details
  document_type TEXT CHECK (document_type IN ('photo', 'receipt', 'warranty', 'manual', 'appraisal', 'other')) NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  
  -- Photo-specific metadata
  is_primary_photo BOOLEAN DEFAULT FALSE,
  contains_serial_number BOOLEAN DEFAULT FALSE,
  contains_model_info BOOLEAN DEFAULT FALSE,
  
  -- AI analysis results
  ai_extracted_text TEXT,
  ai_detected_items JSONB,
  ai_confidence_score DECIMAL(3, 2),
  
  -- Metadata
  uploaded_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  CONSTRAINT valid_file_path CHECK (file_path ~ '^inventory/[a-zA-Z0-9-]+/[a-zA-Z0-9-]+/[a-zA-Z0-9._-]+$')
);

-- Create indexes
CREATE INDEX idx_inventory_documents_item_id ON public.inventory_documents(inventory_item_id);
CREATE INDEX idx_inventory_documents_user_id ON public.inventory_documents(user_id);
CREATE INDEX idx_inventory_documents_type ON public.inventory_documents(document_type);
CREATE INDEX idx_inventory_documents_primary ON public.inventory_documents(is_primary_photo) WHERE is_primary_photo = TRUE;

-- Enable RLS
ALTER TABLE public.inventory_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own inventory documents"
  ON public.inventory_documents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own inventory documents"
  ON public.inventory_documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own inventory documents"
  ON public.inventory_documents FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own inventory documents"
  ON public.inventory_documents FOR DELETE
  USING (auth.uid() = user_id);

-- Create storage bucket for inventory documents
INSERT INTO storage.buckets (id, name, public, avif_autodetection, allowed_mime_types)
VALUES (
  'inventory',
  'inventory',
  false,
  true,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'application/pdf']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for inventory bucket
CREATE POLICY "Users can view their own inventory files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'inventory' AND
    auth.uid()::text = (string_to_array(name, '/'))[1]
  );

CREATE POLICY "Users can upload their own inventory files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'inventory' AND
    auth.uid()::text = (string_to_array(name, '/'))[1] AND
    (CASE 
      WHEN storage.extension(name) IN ('jpg', 'jpeg', 'png', 'webp', 'heic', 'heif') THEN 
        (octet_length(owner) / 1024 / 1024) <= 10  -- 10MB limit for images
      WHEN storage.extension(name) = 'pdf' THEN 
        (octet_length(owner) / 1024 / 1024) <= 25  -- 25MB limit for PDFs
      ELSE false
    END)
  );

CREATE POLICY "Users can update their own inventory files"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'inventory' AND
    auth.uid()::text = (string_to_array(name, '/'))[1]
  )
  WITH CHECK (
    bucket_id = 'inventory' AND
    auth.uid()::text = (string_to_array(name, '/'))[1]
  );

CREATE POLICY "Users can delete their own inventory files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'inventory' AND
    auth.uid()::text = (string_to_array(name, '/'))[1]
  );

-- Create function to ensure only one primary photo per item
CREATE OR REPLACE FUNCTION public.ensure_single_primary_photo()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_primary_photo = TRUE THEN
    UPDATE public.inventory_documents
    SET is_primary_photo = FALSE
    WHERE inventory_item_id = NEW.inventory_item_id
      AND id != NEW.id
      AND is_primary_photo = TRUE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for primary photo constraint
CREATE TRIGGER ensure_single_primary_photo_trigger
  BEFORE INSERT OR UPDATE ON public.inventory_documents
  FOR EACH ROW
  WHEN (NEW.is_primary_photo = TRUE)
  EXECUTE FUNCTION public.ensure_single_primary_photo();

-- Add comments
COMMENT ON TABLE public.inventory_documents IS 'Photos and documents associated with inventory items';
COMMENT ON COLUMN public.inventory_documents.ai_detected_items IS 'JSON array of items detected by AI in this photo';
COMMENT ON COLUMN public.inventory_documents.ai_confidence_score IS 'AI confidence score for item detection (0-1)';