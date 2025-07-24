-- Initial AI Models Seed Data
INSERT INTO ai_models (model_name, model_type, provider, model_version, config, capabilities, cost_per_1k_tokens) VALUES
('gpt-4-vision-preview', 'vision', 'openai', '2024-04-09', '{"temperature": 0.7}', '["image_analysis", "damage_detection", "text_extraction"]', 0.01),
('claude-3-opus', 'language', 'anthropic', '20240229', '{"max_tokens": 4096}', '["document_analysis", "summarization", "extraction"]', 0.015),
('gemini-1.5-pro', 'language', 'google', 'latest', '{"temperature": 0.7}', '["document_processing", "long_context", "multimodal"]', 0.007),
('text-embedding-3-large', 'embedding', 'openai', '3', '{"dimensions": 1536}', '["semantic_search", "similarity"]', 0.0001)
ON CONFLICT (model_name, model_version) DO NOTHING;