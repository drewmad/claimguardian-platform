-- Create table for tracking batch imports from AI inventory analysis
CREATE TABLE IF NOT EXISTS public.inventory_import_batches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  
  -- Batch details
  batch_name TEXT NOT NULL,
  import_source TEXT CHECK (import_source IN ('ai_photo_scan', 'csv_upload', 'manual_entry', 'api_import')) NOT NULL,
  
  -- Processing status
  status TEXT CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'partial')) DEFAULT 'pending',
  total_items INTEGER DEFAULT 0,
  processed_items INTEGER DEFAULT 0,
  failed_items INTEGER DEFAULT 0,
  
  -- AI processing metadata
  ai_provider TEXT CHECK (ai_provider IN ('openai', 'gemini', 'claude', 'none')),
  ai_model TEXT,
  ai_processing_time_ms INTEGER,
  
  -- Results
  import_results JSONB,
  error_log JSONB,
  
  -- Export formats
  csv_export_url TEXT,
  json_export_url TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- Create indexes
CREATE INDEX idx_inventory_batches_user_id ON public.inventory_import_batches(user_id);
CREATE INDEX idx_inventory_batches_property_id ON public.inventory_import_batches(property_id);
CREATE INDEX idx_inventory_batches_status ON public.inventory_import_batches(status);
CREATE INDEX idx_inventory_batches_created_at ON public.inventory_import_batches(created_at DESC);

-- Enable RLS
ALTER TABLE public.inventory_import_batches ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own import batches"
  ON public.inventory_import_batches FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own import batches"
  ON public.inventory_import_batches FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own import batches"
  ON public.inventory_import_batches FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create function to generate Florida-compliant inventory export
CREATE OR REPLACE FUNCTION public.export_inventory_florida_format(
  p_user_id UUID,
  p_property_id UUID DEFAULT NULL,
  p_format TEXT DEFAULT 'csv'
) RETURNS TEXT AS $$
DECLARE
  v_result TEXT;
  v_header TEXT;
  v_rows TEXT;
BEGIN
  -- CSV Header
  v_header := 'photo_id,item_id,category,description,brand,model,serial_number,purchase_date,purchase_price_usd,condition_grade,estimated_replacement_cost,depreciation_%,location_in_home,warranty_status,warranty_expiration_date,proof_of_purchase,florida_tax_included,notes';
  
  IF p_format = 'csv' THEN
    -- Generate CSV
    SELECT string_agg(
      CONCAT_WS(',',
        COALESCE('"' || REPLACE(photo_id, '"', '""') || '"', '""'),
        item_id::TEXT,
        '"' || category || '"',
        '"' || REPLACE(description, '"', '""') || '"',
        '"' || REPLACE(brand, '"', '""') || '"',
        '"' || REPLACE(model, '"', '""') || '"',
        '"' || REPLACE(serial_number, '"', '""') || '"',
        COALESCE(TO_CHAR(purchase_date, 'YYYY-MM-DD'), 'UNKNOWN'),
        COALESCE(purchase_price_usd::TEXT, 'UNKNOWN'),
        '"' || condition_grade || '"',
        estimated_replacement_cost::TEXT,
        depreciation_percent::TEXT,
        '"' || REPLACE(location_in_home, '"', '""') || '"',
        '"' || warranty_status || '"',
        COALESCE(TO_CHAR(warranty_expiration_date, 'YYYY-MM-DD'), 'UNKNOWN'),
        CASE WHEN proof_of_purchase THEN 'YES' ELSE 'NO' END,
        CASE 
          WHEN florida_tax_included IS TRUE THEN 'YES'
          WHEN florida_tax_included IS FALSE THEN 'NO'
          ELSE 'UNK'
        END,
        '"' || REPLACE(COALESCE(notes, ''), '"', '""') || '"'
      ),
      E'\n'
    ) INTO v_rows
    FROM public.inventory_items
    WHERE user_id = p_user_id
      AND (p_property_id IS NULL OR property_id = p_property_id)
    ORDER BY created_at, item_id;
    
    v_result := v_header || E'\n' || COALESCE(v_rows, '');
    
  ELSIF p_format = 'json' THEN
    -- Generate JSON
    SELECT json_agg(
      json_build_object(
        'photo_id', photo_id,
        'item_id', item_id,
        'category', category,
        'description', description,
        'brand', brand,
        'model', model,
        'serial_number', serial_number,
        'purchase_date', COALESCE(TO_CHAR(purchase_date, 'YYYY-MM-DD'), 'UNKNOWN'),
        'purchase_price_usd', COALESCE(purchase_price_usd::TEXT, 'UNKNOWN'),
        'condition_grade', condition_grade,
        'estimated_replacement_cost', estimated_replacement_cost,
        'depreciation_%', depreciation_percent,
        'location_in_home', location_in_home,
        'warranty_status', warranty_status,
        'warranty_expiration_date', COALESCE(TO_CHAR(warranty_expiration_date, 'YYYY-MM-DD'), 'UNKNOWN'),
        'proof_of_purchase', CASE WHEN proof_of_purchase THEN 'YES' ELSE 'NO' END,
        'florida_tax_included', CASE 
          WHEN florida_tax_included IS TRUE THEN 'YES'
          WHEN florida_tax_included IS FALSE THEN 'NO'
          ELSE 'UNK'
        END,
        'notes', notes
      )
    )::TEXT INTO v_result
    FROM public.inventory_items
    WHERE user_id = p_user_id
      AND (p_property_id IS NULL OR property_id = p_property_id)
    ORDER BY created_at, item_id;
    
  END IF;
  
  RETURN COALESCE(v_result, CASE WHEN p_format = 'json' THEN '[]' ELSE v_header END);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.export_inventory_florida_format TO authenticated;

-- Create function to validate inventory data completeness for insurance claims
CREATE OR REPLACE FUNCTION public.validate_inventory_for_claims(
  p_user_id UUID,
  p_property_id UUID DEFAULT NULL
) RETURNS TABLE (
  total_items BIGINT,
  items_with_photos BIGINT,
  items_with_receipts BIGINT,
  items_with_serial_numbers BIGINT,
  items_with_purchase_info BIGINT,
  items_missing_critical_data BIGINT,
  total_declared_value DECIMAL,
  total_replacement_value DECIMAL,
  validation_score DECIMAL,
  recommendations JSONB
) AS $$
DECLARE
  v_recommendations JSONB := '[]'::JSONB;
BEGIN
  -- Analyze inventory completeness
  RETURN QUERY
  WITH inventory_analysis AS (
    SELECT 
      COUNT(*) as total,
      COUNT(CASE WHEN id IN (SELECT DISTINCT inventory_item_id FROM public.inventory_documents WHERE document_type = 'photo') THEN 1 END) as with_photos,
      COUNT(CASE WHEN proof_of_purchase = TRUE THEN 1 END) as with_receipts,
      COUNT(CASE WHEN serial_number != 'UNKNOWN' THEN 1 END) as with_serials,
      COUNT(CASE WHEN purchase_price_usd IS NOT NULL THEN 1 END) as with_purchase,
      COUNT(CASE WHEN 
        (photo_id IS NULL AND id NOT IN (SELECT inventory_item_id FROM public.inventory_documents WHERE document_type = 'photo'))
        OR (purchase_price_usd IS NULL AND estimated_replacement_cost IS NULL)
        OR (category = 'Electronics' AND serial_number = 'UNKNOWN')
        OR (category = 'Appliance' AND model = 'UNKNOWN')
      THEN 1 END) as missing_critical,
      COALESCE(SUM(purchase_price_usd * quantity), 0) as total_purchase,
      COALESCE(SUM(estimated_replacement_cost * quantity), 0) as total_replacement
    FROM public.inventory_items
    WHERE user_id = p_user_id
      AND (p_property_id IS NULL OR property_id = p_property_id)
  )
  SELECT 
    a.total,
    a.with_photos,
    a.with_receipts,
    a.with_serials,
    a.with_purchase,
    a.missing_critical,
    a.total_purchase,
    a.total_replacement,
    CASE 
      WHEN a.total = 0 THEN 0
      ELSE ROUND(
        (
          (a.with_photos::DECIMAL / a.total * 0.3) +
          (a.with_receipts::DECIMAL / a.total * 0.2) +
          (a.with_serials::DECIMAL / a.total * 0.2) +
          (a.with_purchase::DECIMAL / a.total * 0.3)
        ) * 100, 2
      )
    END as score,
    CASE
      WHEN a.total = 0 THEN '["No items in inventory. Start by adding items or using the AI scanner."]'::JSONB
      ELSE json_build_array(
        CASE WHEN a.with_photos < a.total * 0.8 THEN 'Add photos for more items - insurers require visual proof' END,
        CASE WHEN a.with_receipts < a.total * 0.5 THEN 'Upload more receipts to prove purchase value' END,
        CASE WHEN a.with_serials < a.total * 0.3 THEN 'Record serial numbers for electronics and appliances' END,
        CASE WHEN a.missing_critical > 0 THEN 'Complete missing information for ' || a.missing_critical || ' items' END
      ) - 'null'
    END
  FROM inventory_analysis a;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.validate_inventory_for_claims TO authenticated;

-- Add comments
COMMENT ON TABLE public.inventory_import_batches IS 'Tracks batch imports of inventory items from various sources';
COMMENT ON FUNCTION public.export_inventory_florida_format IS 'Exports inventory in Florida insurance-compliant CSV or JSON format';
COMMENT ON FUNCTION public.validate_inventory_for_claims IS 'Validates inventory completeness for insurance claim readiness';