-- Property AI Insights
CREATE TABLE IF NOT EXISTS property_ai_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    
    -- Insight details
    insight_type TEXT NOT NULL CHECK (insight_type IN ('risk', 'value', 'maintenance', 'market', 'insurance')),
    title TEXT NOT NULL,
    description TEXT,
    
    -- Predictions and recommendations
    predictions JSONB DEFAULT '{}',
    recommendations JSONB DEFAULT '[]',
    confidence_score FLOAT,
    
    -- Supporting data
    data_sources JSONB DEFAULT '[]',
    calculations JSONB DEFAULT '{}',
    
    -- Validity
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    
    -- Model tracking
    model_id UUID REFERENCES ai_models(id),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_property_insights_property ON property_ai_insights (property_id);
CREATE INDEX idx_property_insights_type ON property_ai_insights (insight_type);
CREATE INDEX idx_property_insights_active ON property_ai_insights (is_active, expires_at);

-- Damage AI Detections
CREATE TABLE IF NOT EXISTS damage_ai_detections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    damage_id UUID NOT NULL REFERENCES property_damage(id) ON DELETE CASCADE,
    
    -- Image analysis
    image_url TEXT NOT NULL,
    image_embedding vector(1536),
    
    -- Detection results
    detected_objects JSONB DEFAULT '[]', -- [{type, bbox, confidence, description}]
    damage_types JSONB DEFAULT '[]',
    material_types JSONB DEFAULT '[]',
    
    -- Measurements
    estimated_area_sqft FLOAT,
    severity_score FLOAT,
    
    -- Model info
    model_id UUID REFERENCES ai_models(id),
    analysis_id UUID REFERENCES ai_analyses(id),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_damage_detections_damage ON damage_ai_detections (damage_id);