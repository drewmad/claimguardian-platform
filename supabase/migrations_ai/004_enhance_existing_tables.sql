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