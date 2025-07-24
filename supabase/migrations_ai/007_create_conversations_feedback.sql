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
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_conversations_user ON ai_conversations (user_id);
CREATE INDEX idx_conversations_context ON ai_conversations (context_type, context_id);
CREATE INDEX idx_conversations_active ON ai_conversations (is_active, last_message_at DESC);

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
    
    UNIQUE(analysis_id, user_id)
);

CREATE INDEX idx_feedback_analysis ON ai_feedback (analysis_id);
CREATE INDEX idx_feedback_user ON ai_feedback (user_id);