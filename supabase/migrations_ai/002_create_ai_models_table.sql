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