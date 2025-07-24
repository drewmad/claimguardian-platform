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
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes separately
CREATE INDEX idx_ai_analyses_entity ON ai_analyses (entity_type, entity_id);
CREATE INDEX idx_ai_analyses_created ON ai_analyses (created_at DESC);
CREATE INDEX idx_ai_analyses_user ON ai_analyses (user_id);

-- Create vector similarity index
CREATE INDEX idx_ai_analyses_input_embedding ON ai_analyses 
USING ivfflat (input_embedding vector_cosine_ops)
WITH (lists = 100);