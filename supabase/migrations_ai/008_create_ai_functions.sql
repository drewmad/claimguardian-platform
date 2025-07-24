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
    WITH stats_data AS (
        SELECT 
            a.*,
            m.model_name,
            COUNT(*) OVER (PARTITION BY a.analysis_type) as type_count,
            COUNT(*) OVER (PARTITION BY m.model_name) as model_count
        FROM ai_analyses a
        LEFT JOIN ai_models m ON a.model_id = m.id
        WHERE a.created_at BETWEEN p_start_date AND p_end_date
        AND (p_user_id IS NULL OR a.user_id = p_user_id)
    ),
    type_agg AS (
        SELECT jsonb_object_agg(analysis_type, type_count) as analyses_by_type
        FROM (SELECT DISTINCT analysis_type, type_count FROM stats_data WHERE analysis_type IS NOT NULL) t
    ),
    model_agg AS (
        SELECT jsonb_object_agg(model_name, model_count) as models_used  
        FROM (SELECT DISTINCT model_name, model_count FROM stats_data WHERE model_name IS NOT NULL) m
    )
    SELECT 
        COUNT(*)::BIGINT as total_analyses,
        COALESCE(SUM(tokens_used), 0)::BIGINT as total_tokens,
        COALESCE(SUM(cost_cents), 0)::BIGINT as total_cost_cents,
        AVG(confidence_score)::FLOAT as avg_confidence,
        COALESCE((SELECT analyses_by_type FROM type_agg), '{}'::jsonb),
        COALESCE((SELECT models_used FROM model_agg), '{}'::jsonb)
    FROM stats_data;
END;
$$ LANGUAGE plpgsql;