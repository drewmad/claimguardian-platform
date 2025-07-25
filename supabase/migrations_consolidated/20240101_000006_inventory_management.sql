-- Inventory management system
-- Handles personal property inventory for insurance claims

-- Create inventory categories enum
CREATE TYPE inventory_category AS ENUM (
  'electronics', 'furniture', 'appliances', 'clothing', 'jewelry',
  'tools', 'sports', 'collectibles', 'documents', 'other'
);

-- Create inventory condition enum
CREATE TYPE item_condition AS ENUM (
  'new', 'like_new', 'good', 'fair', 'poor', 'damaged', 'destroyed'
);

-- Inventory items table
CREATE TABLE IF NOT EXISTS public.inventory_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category inventory_category DEFAULT 'other',
  brand TEXT,
  model TEXT,
  serial_number TEXT,
  purchase_date DATE,
  purchase_price NUMERIC(10,2),
  current_value NUMERIC(10,2),
  quantity INTEGER DEFAULT 1,
  condition item_condition DEFAULT 'good',
  location_in_home TEXT,
  receipt_url TEXT,
  notes TEXT,
  barcode TEXT,
  ai_detected_info JSONB,
  is_deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Inventory item photos table
CREATE TABLE IF NOT EXISTS public.inventory_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id UUID REFERENCES public.inventory_items(id) ON DELETE CASCADE NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  storage_path TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  ai_analysis JSONB,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Inventory import batches for bulk imports
CREATE TABLE IF NOT EXISTS public.inventory_import_batches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  import_type TEXT NOT NULL, -- 'manual', 'csv', 'ai_scan', 'receipt_scan'
  file_name TEXT,
  total_items INTEGER DEFAULT 0,
  processed_items INTEGER DEFAULT 0,
  successful_items INTEGER DEFAULT 0,
  failed_items INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  error_log JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create storage bucket for inventory photos
INSERT INTO storage.buckets (id, name, public, avif_autodetection, allowed_mime_types)
VALUES 
  ('inventory-photos', 'inventory-photos', false, true, 
   ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif'])
ON CONFLICT (id) DO NOTHING;

-- Function to calculate total inventory value
CREATE OR REPLACE FUNCTION public.calculate_inventory_value(p_property_id UUID)
RETURNS TABLE (
  total_items INTEGER,
  total_value NUMERIC,
  category_breakdown JSONB
) AS $$
BEGIN
  RETURN QUERY
  WITH category_totals AS (
    SELECT 
      category::TEXT,
      COUNT(*)::INTEGER as item_count,
      COALESCE(SUM(current_value * quantity), 0)::NUMERIC as category_value
    FROM public.inventory_items
    WHERE property_id = p_property_id
      AND is_deleted = false
    GROUP BY category
  )
  SELECT 
    COALESCE(SUM(item_count), 0)::INTEGER,
    COALESCE(SUM(category_value), 0)::NUMERIC,
    COALESCE(
      jsonb_object_agg(
        category,
        jsonb_build_object(
          'count', item_count,
          'value', category_value
        )
      ),
      '{}'::jsonb
    )
  FROM category_totals;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to process AI-detected inventory info
CREATE OR REPLACE FUNCTION public.process_ai_inventory_detection(
  p_item_id UUID,
  p_detected_info JSONB
)
RETURNS VOID AS $$
BEGIN
  UPDATE public.inventory_items
  SET 
    name = COALESCE(p_detected_info->>'name', name),
    brand = COALESCE(p_detected_info->>'brand', brand),
    model = COALESCE(p_detected_info->>'model', model),
    category = COALESCE(
      (p_detected_info->>'category')::inventory_category,
      category
    ),
    ai_detected_info = ai_detected_info || p_detected_info,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = p_item_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS policies
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_import_batches ENABLE ROW LEVEL SECURITY;

-- Inventory items policies
CREATE POLICY "Users manage own inventory" ON public.inventory_items
  USING (auth.uid() = user_id);

-- Inventory photos policies
CREATE POLICY "Users manage own photos" ON public.inventory_photos
  USING (
    EXISTS (
      SELECT 1 FROM public.inventory_items
      WHERE id = inventory_photos.item_id
      AND user_id = auth.uid()
    )
  );

-- Import batches policies
CREATE POLICY "Users manage own imports" ON public.inventory_import_batches
  USING (auth.uid() = user_id);

-- Storage policies for inventory photos
CREATE POLICY "Users can upload inventory photos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'inventory-photos' AND
    (auth.uid())::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view own inventory photos" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'inventory-photos' AND
    (auth.uid())::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update own inventory photos" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'inventory-photos' AND
    (auth.uid())::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own inventory photos" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'inventory-photos' AND
    (auth.uid())::text = (storage.foldername(name))[1]
  );

-- Add triggers
CREATE TRIGGER set_updated_at_inventory_items
  BEFORE UPDATE ON public.inventory_items
  FOR EACH ROW
  EXECUTE FUNCTION core.set_updated_at();

-- Add audit triggers
CREATE TRIGGER audit_inventory_items
  AFTER INSERT OR UPDATE OR DELETE ON public.inventory_items
  FOR EACH ROW
  EXECUTE FUNCTION core.audit_trigger();

-- Create indexes
CREATE INDEX idx_inventory_items_user_property ON public.inventory_items(user_id, property_id);
CREATE INDEX idx_inventory_items_category ON public.inventory_items(category) WHERE is_deleted = false;
CREATE INDEX idx_inventory_items_deleted ON public.inventory_items(is_deleted);
CREATE INDEX idx_inventory_photos_item ON public.inventory_photos(item_id);
CREATE INDEX idx_inventory_photos_primary ON public.inventory_photos(item_id, is_primary);
CREATE INDEX idx_inventory_import_batches_user ON public.inventory_import_batches(user_id);
CREATE INDEX idx_inventory_import_batches_status ON public.inventory_import_batches(status);