-- Add missing fields to properties table for frontend compatibility
-- Date: 2025-07-16

-- Add value and insurability_score fields to properties table
ALTER TABLE public.properties 
    ADD COLUMN IF NOT EXISTS value DECIMAL(15,2),
    ADD COLUMN IF NOT EXISTS insurability_score INTEGER DEFAULT 0 CHECK (insurability_score >= 0 AND insurability_score <= 100);

-- Add comments for clarity
COMMENT ON COLUMN public.properties.value IS 'Estimated property value in USD';
COMMENT ON COLUMN public.properties.insurability_score IS 'Property insurability score (0-100)';

-- Update existing properties with default values if needed
UPDATE public.properties 
SET value = 0 
WHERE value IS NULL;

UPDATE public.properties 
SET insurability_score = 0 
WHERE insurability_score IS NULL;