-- AI Foundation Migration for ClaimGuardian
-- =========================================
-- This migration adds AI-first capabilities to the schema

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm; -- For text similarity

-- ============================================
-- Core AI Infrastructure Tables
-- ============================================

-- AI Models Registry
CREATE TABLE IF NOT EXISTS ai_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_name TEXT NOT NULL,
    model_type TEXT NOT NULL CHECK (model_type IN ('vision', 'language', 'embedding', 'classification', 'generation')),
    provider TEXT NOT NULL CHECK (provider IN ('openai', 'anthropic', 'google', 'replicate', 'huggingface', 'local')),
    model_version TEXT NOT NULL,
    
    -- Configuration
    config JSONB DEFAULT '{}',
    capabilities JSONB DEFAULT '[]',
    context_window INTEGER,
    max_tokens INTEGER,
    
    -- Cost tracking
    cost_per_1k_tokens DECIMAL(10,4),
    cost_per_image DECIMAL(10,4),
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    deprecated_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT unique_model_version UNIQUE(model_name, model_version)
);

-- AI Analysis History
CREATE TABLE IF NOT EXISTS ai_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Entity reference
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    analysis_type TEXT NOT NULL,
    
    -- Model info
    model_id UUID REFERENCES ai_models(id),
    
    -- Input/Output
    input_data JSONB NOT NULL,
    output_data JSONB NOT NULL,
    
    -- Quality metrics
    confidence_score FLOAT CHECK (confidence_score >= 0 AND confidence_score <= 1),
    processing_time_ms INTEGER,
    
    -- Embeddings for semantic search
    input_embedding vector(1536),
    output_embedding vector(1536),
    
    -- Cost tracking
    tokens_used INTEGER,
    cost_cents INTEGER,
    
    -- Error handling
    status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    
    -- Audit
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Indexes
    INDEX idx_ai_analyses_entity (entity_type, entity_id),
    INDEX idx_ai_analyses_created (created_at DESC),
    INDEX idx_ai_analyses_user (user_id)
);

-- Create vector similarity index
CREATE INDEX idx_ai_analyses_input_embedding ON ai_analyses 
USING ivfflat (input_embedding vector_cosine_ops)
WITH (lists = 100);

-- ============================================
-- Enhance Existing Tables with AI Capabilities
-- ============================================

-- Add AI fields to properties
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS ai_risk_score FLOAT CHECK (ai_risk_score >= 0 AND ai_risk_score <= 100),
ADD COLUMN IF NOT EXISTS ai_risk_factors JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS ai_market_analysis JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS property_embedding vector(1536),
ADD COLUMN IF NOT EXISTS last_ai_analysis_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS ai_insights JSONB DEFAULT '[]';

-- Add AI fields to claims
ALTER TABLE claims
ADD COLUMN IF NOT EXISTS ai_complexity_score FLOAT,
ADD COLUMN IF NOT EXISTS ai_fraud_risk_score FLOAT,
ADD COLUMN IF NOT EXISTS ai_settlement_prediction JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS claim_embedding vector(1536),
ADD COLUMN IF NOT EXISTS ai_recommended_actions JSONB DEFAULT '[]';

-- Add AI fields to property_damage
ALTER TABLE property_damage
ADD COLUMN IF NOT EXISTS ai_severity_score FLOAT CHECK (ai_severity_score >= 0 AND ai_severity_score <= 10),
ADD COLUMN IF NOT EXISTS ai_repair_estimate_low DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS ai_repair_estimate_high DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS ai_detected_materials JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS ai_detected_damages JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS damage_embedding vector(1536);

-- ============================================
-- AI-Specific Tables
-- ============================================

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
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    INDEX idx_property_insights_property (property_id),
    INDEX idx_property_insights_type (insight_type),
    INDEX idx_property_insights_active (is_active, expires_at)
);

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
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    INDEX idx_damage_detections_damage (damage_id)
);

-- Document AI Processing
CREATE TABLE IF NOT EXISTS document_ai_extractions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES policy_documents(id),
    
    -- Extraction results
    document_type TEXT,
    extracted_fields JSONB DEFAULT '{}',
    key_terms JSONB DEFAULT '[]',
    important_dates JSONB DEFAULT '[]',
    coverage_items JSONB DEFAULT '[]',
    exclusions JSONB DEFAULT '[]',
    
    -- Summaries
    summary TEXT,
    key_points JSONB DEFAULT '[]',
    
    -- Embeddings
    content_embedding vector(1536),
    summary_embedding vector(1536),
    
    -- Quality
    extraction_confidence FLOAT,
    requires_review BOOLEAN DEFAULT false,
    review_notes TEXT,
    
    -- Model tracking
    model_id UUID REFERENCES ai_models(id),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    INDEX idx_document_extractions_document (document_id)
);

-- AI Conversations
CREATE TABLE IF NOT EXISTS ai_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    
    -- Context
    context_type TEXT NOT NULL CHECK (context_type IN ('general', 'claim', 'property', 'policy', 'damage')),
    context_id UUID,
    
    -- Conversation
    title TEXT,
    messages JSONB DEFAULT '[]', -- [{role, content, timestamp, tokens}]
    
    -- State
    is_active BOOLEAN DEFAULT true,
    last_message_at TIMESTAMPTZ,
    
    -- Usage
    total_messages INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,
    total_cost_cents INTEGER DEFAULT 0,
    
    -- Embeddings for context
    context_embedding vector(1536),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    INDEX idx_conversations_user (user_id),
    INDEX idx_conversations_context (context_type, context_id),
    INDEX idx_conversations_active (is_active, last_message_at DESC)
);

-- AI Feedback
CREATE TABLE IF NOT EXISTS ai_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Reference
    analysis_id UUID REFERENCES ai_analyses(id),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    
    -- Feedback
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    was_accurate BOOLEAN,
    was_helpful BOOLEAN,
    
    -- Corrections
    corrections JSONB DEFAULT '{}',
    additional_info JSONB DEFAULT '{}',
    comments TEXT,
    
    -- Impact
    resulted_in_model_update BOOLEAN DEFAULT false,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    INDEX idx_feedback_analysis (analysis_id),
    INDEX idx_feedback_user (user_id),
    UNIQUE(analysis_id, user_id)
);

-- ============================================
-- AI Functions
-- ============================================

-- Function to find similar properties
CREATE OR REPLACE FUNCTION find_similar_properties(
    p_property_id UUID,
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    property_id UUID,
    similarity FLOAT,
    address TEXT,
    property_type property_type,
    square_footage INTEGER
) AS $$
DECLARE
    v_embedding vector(1536);
BEGIN
    -- Get the embedding for the source property
    SELECT property_embedding INTO v_embedding
    FROM properties
    WHERE id = p_property_id;
    
    IF v_embedding IS NULL THEN
        RETURN;
    END IF;
    
    -- Find similar properties
    RETURN QUERY
    SELECT 
        p.id,
        1 - (p.property_embedding <=> v_embedding) as similarity,
        p.address,
        p.property_type,
        p.square_footage
    FROM properties p
    WHERE p.id != p_property_id
    AND p.property_embedding IS NOT NULL
    ORDER BY p.property_embedding <=> v_embedding
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to get AI usage stats
CREATE OR REPLACE FUNCTION get_ai_usage_stats(
    p_user_id UUID DEFAULT NULL,
    p_start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days',
    p_end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (
    total_analyses BIGINT,
    total_tokens BIGINT,
    total_cost_cents BIGINT,
    avg_confidence FLOAT,
    analyses_by_type JSONB,
    models_used JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as total_analyses,
        COALESCE(SUM(tokens_used), 0)::BIGINT as total_tokens,
        COALESCE(SUM(cost_cents), 0)::BIGINT as total_cost_cents,
        AVG(confidence_score)::FLOAT as avg_confidence,
        jsonb_object_agg(
            analysis_type, 
            type_count
        ) FILTER (WHERE analysis_type IS NOT NULL) as analyses_by_type,
        jsonb_object_agg(
            model_name,
            model_count
        ) FILTER (WHERE model_name IS NOT NULL) as models_used
    FROM (
        SELECT 
            a.*,
            m.model_name,
            COUNT(*) OVER (PARTITION BY a.analysis_type) as type_count,
            COUNT(*) OVER (PARTITION BY m.model_name) as model_count
        FROM ai_analyses a
        LEFT JOIN ai_models m ON a.model_id = m.id
        WHERE a.created_at BETWEEN p_start_date AND p_end_date
        AND (p_user_id IS NULL OR a.user_id = p_user_id)
    ) stats;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Triggers
-- ============================================

-- Update embedding when property changes
CREATE OR REPLACE FUNCTION update_property_embedding()
RETURNS TRIGGER AS $$
BEGIN
    -- Mark for embedding update (handled by application)
    NEW.property_embedding = NULL;
    NEW.last_ai_analysis_at = NULL;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_property_embedding_update
BEFORE UPDATE ON properties
FOR EACH ROW
WHEN (
    OLD.address IS DISTINCT FROM NEW.address OR
    OLD.property_type IS DISTINCT FROM NEW.property_type OR
    OLD.square_footage IS DISTINCT FROM NEW.square_footage OR
    OLD.year_built IS DISTINCT FROM NEW.year_built
)
EXECUTE FUNCTION update_property_embedding();

-- ============================================
-- RLS Policies
-- ============================================

-- Enable RLS on AI tables
ALTER TABLE ai_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE damage_ai_detections ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_ai_extractions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_feedback ENABLE ROW LEVEL SECURITY;

-- AI analyses policies
CREATE POLICY "Users can view their own AI analyses" ON ai_analyses
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create AI analyses" ON ai_analyses
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Conversations policies  
CREATE POLICY "Users can view their own conversations" ON ai_conversations
    FOR ALL USING (user_id = auth.uid());

-- Feedback policies
CREATE POLICY "Users can manage their own feedback" ON ai_feedback
    FOR ALL USING (user_id = auth.uid());

-- ============================================
-- Initial AI Models Seed Data
-- ============================================
INSERT INTO ai_models (model_name, model_type, provider, model_version, config, capabilities, cost_per_1k_tokens) VALUES
('gpt-4-vision-preview', 'vision', 'openai', '2024-04-09', '{"temperature": 0.7}', '["image_analysis", "damage_detection", "text_extraction"]', 0.01),
('claude-3-opus', 'language', 'anthropic', '20240229', '{"max_tokens": 4096}', '["document_analysis", "summarization", "extraction"]', 0.015),
('gemini-1.5-pro', 'language', 'google', 'latest', '{"temperature": 0.7}', '["document_processing", "long_context", "multimodal"]', 0.007),
('text-embedding-3-large', 'embedding', 'openai', '3', '{"dimensions": 1536}', '["semantic_search", "similarity"]', 0.0001)
ON CONFLICT (model_name, model_version) DO NOTHING;