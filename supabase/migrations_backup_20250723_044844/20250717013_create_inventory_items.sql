-- Create inventory_items table for Florida insurance-grade home inventory
CREATE TABLE IF NOT EXISTS public.inventory_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  
  -- Photo reference
  photo_id TEXT,
  photo_url TEXT,
  
  -- Item identification
  item_id SERIAL,
  category TEXT CHECK (category IN ('Electronics', 'Appliance', 'Furniture', 'Tool', 'Jewelry', 'Collectible', 'Other')),
  description TEXT NOT NULL,
  
  -- Manufacturer details
  brand TEXT DEFAULT 'UNKNOWN',
  model TEXT DEFAULT 'UNKNOWN',
  serial_number TEXT DEFAULT 'UNKNOWN',
  
  -- Purchase information
  purchase_date DATE,
  purchase_price_usd DECIMAL(10, 2),
  proof_of_purchase BOOLEAN DEFAULT FALSE,
  florida_tax_included BOOLEAN,
  
  -- Condition and valuation
  condition_grade TEXT CHECK (condition_grade IN ('NEW', 'GOOD', 'FAIR', 'POOR', 'DAMAGED')),
  estimated_replacement_cost DECIMAL(10, 2),
  depreciation_percent DECIMAL(5, 2) DEFAULT 0,
  
  -- Location and warranty
  location_in_home TEXT DEFAULT 'UNKNOWN',
  warranty_status TEXT CHECK (warranty_status IN ('IN_WARRANTY', 'OUT_OF_WARRANTY', 'UNKNOWN')) DEFAULT 'UNKNOWN',
  warranty_expiration_date DATE,
  
  -- Additional details
  quantity INTEGER DEFAULT 1,
  notes TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Search optimization
  search_vector tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(description, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(brand, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(model, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(notes, '')), 'C')
  ) STORED
);

-- Create indexes for performance
CREATE INDEX idx_inventory_items_user_id ON public.inventory_items(user_id);
CREATE INDEX idx_inventory_items_property_id ON public.inventory_items(property_id);
CREATE INDEX idx_inventory_items_category ON public.inventory_items(category);
CREATE INDEX idx_inventory_items_condition ON public.inventory_items(condition_grade);
CREATE INDEX idx_inventory_items_warranty_status ON public.inventory_items(warranty_status);
CREATE INDEX idx_inventory_items_search ON public.inventory_items USING GIN(search_vector);
CREATE INDEX idx_inventory_items_purchase_date ON public.inventory_items(purchase_date);
CREATE INDEX idx_inventory_items_created_at ON public.inventory_items(created_at DESC);

-- Enable RLS
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own inventory items"
  ON public.inventory_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own inventory items"
  ON public.inventory_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own inventory items"
  ON public.inventory_items FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own inventory items"
  ON public.inventory_items FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_inventory_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER inventory_items_updated_at
  BEFORE UPDATE ON public.inventory_items
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_inventory_updated_at();

-- Create view for inventory statistics by property
CREATE OR REPLACE VIEW public.inventory_statistics AS
SELECT 
  property_id,
  user_id,
  COUNT(*) as total_items,
  COUNT(DISTINCT category) as unique_categories,
  SUM(quantity) as total_quantity,
  SUM(purchase_price_usd * quantity) as total_purchase_value,
  SUM(estimated_replacement_cost * quantity) as total_replacement_value,
  SUM(CASE WHEN warranty_status = 'IN_WARRANTY' THEN 1 ELSE 0 END) as items_in_warranty,
  SUM(CASE WHEN condition_grade = 'DAMAGED' THEN 1 ELSE 0 END) as damaged_items,
  AVG(depreciation_percent) as avg_depreciation
FROM public.inventory_items
GROUP BY property_id, user_id;

-- Grant permissions on the view
GRANT SELECT ON public.inventory_statistics TO authenticated;

-- Create function to calculate depreciation based on category and age
CREATE OR REPLACE FUNCTION public.calculate_depreciation(
  p_category TEXT,
  p_purchase_date DATE
) RETURNS DECIMAL AS $$
DECLARE
  v_useful_life INTEGER;
  v_age_years DECIMAL;
  v_depreciation DECIMAL;
BEGIN
  -- Determine useful life based on category
  v_useful_life := CASE p_category
    WHEN 'Electronics' THEN 5
    WHEN 'Appliance' THEN 10
    WHEN 'Furniture' THEN 15
    WHEN 'Tool' THEN 7
    WHEN 'Jewelry' THEN 0  -- No depreciation
    WHEN 'Collectible' THEN 0  -- No depreciation
    ELSE 10  -- Default for 'Other'
  END;
  
  -- If no depreciation (useful life = 0), return 0
  IF v_useful_life = 0 THEN
    RETURN 0;
  END IF;
  
  -- Calculate age in years
  IF p_purchase_date IS NULL THEN
    RETURN NULL;  -- Cannot calculate without purchase date
  END IF;
  
  v_age_years := EXTRACT(EPOCH FROM (CURRENT_DATE - p_purchase_date)) / (365.25 * 86400);
  
  -- Calculate straight-line depreciation percentage
  v_depreciation := LEAST((v_age_years / v_useful_life) * 100, 100);
  
  RETURN ROUND(v_depreciation, 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create function to estimate replacement cost with Florida pricing
CREATE OR REPLACE FUNCTION public.estimate_replacement_cost(
  p_purchase_price DECIMAL,
  p_depreciation_percent DECIMAL,
  p_category TEXT
) RETURNS DECIMAL AS $$
DECLARE
  v_inflation_factor DECIMAL;
  v_replacement_cost DECIMAL;
BEGIN
  -- Apply category-specific inflation factors for Florida market
  v_inflation_factor := CASE p_category
    WHEN 'Electronics' THEN 0.95  -- Electronics typically decrease in price
    WHEN 'Appliance' THEN 1.15    -- Appliances have moderate inflation
    WHEN 'Furniture' THEN 1.20    -- Furniture has higher inflation
    WHEN 'Tool' THEN 1.10         -- Tools have moderate inflation
    WHEN 'Jewelry' THEN 1.25      -- Jewelry/precious metals increase
    WHEN 'Collectible' THEN 1.30  -- Collectibles can appreciate significantly
    ELSE 1.10  -- Default inflation factor
  END;
  
  IF p_purchase_price IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Calculate replacement cost considering inflation but not depreciation
  -- (Insurance typically covers replacement cost, not depreciated value)
  v_replacement_cost := p_purchase_price * v_inflation_factor;
  
  RETURN ROUND(v_replacement_cost, 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add comments for documentation
COMMENT ON TABLE public.inventory_items IS 'Florida insurance-grade home inventory items with warranty tracking';
COMMENT ON COLUMN public.inventory_items.photo_id IS 'Reference to the photo filename or ID containing this item';
COMMENT ON COLUMN public.inventory_items.item_id IS 'Sequential ID unique within user inventory';
COMMENT ON COLUMN public.inventory_items.depreciation_percent IS 'Straight-line depreciation based on category-specific useful life';
COMMENT ON COLUMN public.inventory_items.estimated_replacement_cost IS 'Current Florida retail replacement cost in USD';
COMMENT ON COLUMN public.inventory_items.florida_tax_included IS 'Whether purchase price includes FL state tax (6%) plus county surtax';