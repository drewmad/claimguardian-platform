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