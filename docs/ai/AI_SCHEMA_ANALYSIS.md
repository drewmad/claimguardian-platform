# AI-First Schema Analysis for ClaimGuardian

## Current Schema Analysis

### 1. AI-Related Tables Found

#### Limited AI Support Currently:

- **`document_extractions`** - Basic document processing tracking
  - Has `processing_status`, `error_message`, `processing_time_ms`
  - Stores extracted data in JSONB fields
  - Missing: embeddings, confidence scores, model versions

### 2. Missing AI-First Components

#### 🚫 No Vector/Embedding Support

- No pgvector extension enabled
- No embedding columns for semantic search
- No vector indexes for similarity queries

#### 🚫 No AI Processing Tables

- No AI analysis history
- No model prediction tracking
- No prompt/response logging
- No AI feedback loops

#### 🚫 No ML Pipeline Support

- No training data tables
- No model versioning
- No feature stores
- No evaluation metrics

## AI-First Schema Improvements

### 1. Core AI Infrastructure

```sql
-- Enable vector support
CREATE EXTENSION IF NOT EXISTS vector;

-- AI Models & Versions
CREATE TABLE ai_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_name TEXT NOT NULL,
    model_type TEXT NOT NULL, -- 'vision', 'language', 'embedding', 'classification'
    provider TEXT NOT NULL, -- 'openai', 'gemini', 'claude', 'local'
    version TEXT NOT NULL,
    config JSONB DEFAULT '{}',
    capabilities JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Processing History
CREATE TABLE ai_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type TEXT NOT NULL, -- 'property', 'claim', 'damage', 'document'
    entity_id UUID NOT NULL,
    model_id UUID REFERENCES ai_models(id),
    analysis_type TEXT NOT NULL, -- 'damage_assessment', 'document_extraction', 'risk_prediction'

    -- Input/Output
    input_data JSONB NOT NULL,
    output_data JSONB NOT NULL,
    confidence_score FLOAT,

    -- Embeddings
    input_embedding vector(1536), -- For semantic search
    output_embedding vector(1536),

    -- Metadata
    processing_time_ms INTEGER,
    tokens_used INTEGER,
    cost_cents INTEGER,
    error_message TEXT,

    -- Audit
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Indexes for performance
    INDEX idx_ai_analyses_entity (entity_type, entity_id),
    INDEX idx_ai_analyses_embedding USING ivfflat (input_embedding vector_cosine_ops)
);
```

### 2. Enhanced Property Schema for AI

```sql
-- Add AI fields to properties
ALTER TABLE properties ADD COLUMN IF NOT EXISTS
    ai_risk_score FLOAT,
    ai_risk_factors JSONB DEFAULT '{}',
    ai_maintenance_predictions JSONB DEFAULT '[]',
    property_embedding vector(1536),
    last_ai_analysis TIMESTAMPTZ;

-- Property AI Insights
CREATE TABLE property_ai_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    insight_type TEXT NOT NULL, -- 'risk', 'value', 'maintenance', 'market'

    -- Predictions
    predictions JSONB NOT NULL,
    confidence_scores JSONB DEFAULT '{}',

    -- Explanations
    explanation TEXT,
    factors JSONB DEFAULT '[]',

    -- Temporal
    valid_from TIMESTAMPTZ DEFAULT NOW(),
    valid_until TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3. Damage Assessment AI

```sql
-- Enhanced damage table for AI
ALTER TABLE property_damage ADD COLUMN IF NOT EXISTS
    ai_severity_score FLOAT,
    ai_repair_estimate DECIMAL(12,2),
    ai_detected_issues JSONB DEFAULT '[]',
    image_embeddings vector(1536)[],
    ai_confidence FLOAT;

-- AI Damage Detection Results
CREATE TABLE damage_ai_detections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    damage_id UUID REFERENCES property_damage(id),
    image_url TEXT NOT NULL,

    -- Detection results
    detected_objects JSONB DEFAULT '[]', -- [{type, bbox, confidence}]
    damage_classifications JSONB DEFAULT '[]',
    severity_analysis JSONB,

    -- Embeddings for similarity search
    image_embedding vector(1536),

    model_id UUID REFERENCES ai_models(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4. Document Intelligence

```sql
-- Enhanced document processing
CREATE TABLE document_ai_extractions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES policy_documents(id),

    -- Extraction results
    extracted_entities JSONB DEFAULT '{}',
    key_terms JSONB DEFAULT '[]',
    summary TEXT,

    -- Embeddings for search
    content_embedding vector(1536),
    summary_embedding vector(1536),

    -- Quality metrics
    extraction_confidence FLOAT,
    validation_status TEXT,

    model_id UUID REFERENCES ai_models(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 5. Conversational AI Support

```sql
-- AI Conversations
CREATE TABLE ai_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    context_type TEXT, -- 'claim_assistance', 'policy_review', 'damage_assessment'
    context_id UUID, -- Reference to claim, policy, etc.

    -- Conversation state
    messages JSONB DEFAULT '[]',
    context_embeddings vector(1536)[],

    -- Metadata
    total_tokens INTEGER DEFAULT 0,
    total_cost_cents INTEGER DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Prompts Library
CREATE TABLE ai_prompts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prompt_key TEXT UNIQUE NOT NULL,
    prompt_template TEXT NOT NULL,

    -- Configuration
    model_preferences JSONB DEFAULT '[]',
    parameters JSONB DEFAULT '{}',

    -- Performance
    avg_tokens INTEGER,
    avg_response_time_ms INTEGER,
    success_rate FLOAT,

    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 6. AI Training & Feedback

```sql
-- User feedback on AI results
CREATE TABLE ai_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_id UUID REFERENCES ai_analyses(id),
    user_id UUID REFERENCES auth.users(id),

    -- Feedback
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    was_helpful BOOLEAN,
    corrections JSONB,
    comments TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Training data collection
CREATE TABLE ai_training_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data_type TEXT NOT NULL, -- 'damage_photo', 'document', 'claim_text'

    -- Input/Output pairs
    input_data JSONB NOT NULL,
    expected_output JSONB NOT NULL,

    -- Metadata
    is_validated BOOLEAN DEFAULT false,
    validated_by UUID REFERENCES auth.users(id),

    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Implementation Roadmap

### Phase 1: Foundation (Week 1-2)

1. **Enable pgvector extension**

   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```

2. **Create core AI tables**
   - ai_models
   - ai_analyses
   - ai_conversations

3. **Add embedding columns to existing tables**
   - properties.property_embedding
   - property_damage.image_embeddings
   - policy_documents.content_embedding

### Phase 2: Integration (Week 3-4)

1. **Implement embedding generation**
   - On property creation/update
   - On damage photo upload
   - On document upload

2. **Create AI service layer**
   - Embedding service
   - Analysis service
   - Prediction service

3. **Build similarity search**
   - Find similar properties
   - Find similar damage patterns
   - Find relevant documents

### Phase 3: Intelligence (Week 5-6)

1. **Implement AI pipelines**
   - Damage assessment pipeline
   - Document extraction pipeline
   - Risk prediction pipeline

2. **Create feedback loops**
   - Collect user corrections
   - Track model performance
   - Improve predictions

3. **Build AI dashboards**
   - Model performance metrics
   - Prediction accuracy
   - Cost tracking

## Key Benefits of AI-First Schema

### 1. **Semantic Search**

- Find similar claims by damage pattern
- Search documents by meaning, not keywords
- Match properties with similar risks

### 2. **Predictive Analytics**

- Predict claim outcomes
- Estimate repair costs
- Identify fraud patterns

### 3. **Automated Processing**

- Auto-categorize damage
- Extract policy details
- Generate claim summaries

### 4. **Personalization**

- Tailored recommendations
- Context-aware assistance
- Learning from user behavior

### 5. **Cost Optimization**

- Track AI usage costs
- Optimize model selection
- Cache common queries

## Next Steps

### Immediate Actions

1. **Enable pgvector** in Supabase
2. **Create AI foundation tables**
3. **Add embedding columns** to core entities
4. **Implement embedding generation** for new data

### Short-term Goals

1. **Build similarity search** for properties
2. **Implement damage detection** pipeline
3. **Create document extraction** service
4. **Track AI performance** metrics

### Long-term Vision

1. **Predictive claim outcomes**
2. **Automated damage assessment**
3. **Intelligent document analysis**
4. **Personalized user assistance**

## Technical Considerations

### Performance

- Use IVFFlat indexes for vector search
- Implement embedding caching
- Batch AI operations
- Monitor query performance

### Security

- Encrypt sensitive embeddings
- Audit AI access
- Implement rate limiting
- Track AI costs per user

### Scalability

- Partition large tables
- Use materialized views
- Implement data archiving
- Plan for model updates
