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
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_document_extractions_document ON document_ai_extractions (document_id);