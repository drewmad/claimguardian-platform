-- Phase 6: ML Model Operations and Governance
-- Enhanced AI/ML infrastructure for production-grade model management

-- ==============================================
-- ML MODEL VERSION CONTROL
-- ==============================================

-- Comprehensive model versioning with lineage tracking
CREATE TABLE public.ml_model_versions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    model_family text NOT NULL, -- property_risk, damage_detection, etc.
    version_tag text NOT NULL, -- semantic versioning: v1.2.3

    -- Model architecture and training
    architecture jsonb NOT NULL, -- full model architecture spec
    hyperparameters jsonb NOT NULL,
    training_config jsonb NOT NULL, -- optimizer, loss, metrics
    framework text NOT NULL, -- tensorflow, pytorch, xgboost

    -- Training data provenance
    training_dataset_id uuid REFERENCES public.ai_training_datasets(id),
    training_data_hash text NOT NULL, -- hash of training data
    feature_importance jsonb DEFAULT '{}', -- feature contribution scores

    -- Model artifacts
    model_artifacts jsonb DEFAULT '{}', -- URLs to model files, weights
    model_size_mb numeric(10,2),
    inference_optimization jsonb DEFAULT '{}', -- quantization, pruning details

    -- Performance benchmarks
    validation_metrics jsonb NOT NULL, -- accuracy, precision, recall, F1
    test_metrics jsonb NOT NULL,
    production_metrics jsonb DEFAULT '{}', -- real-world performance
    latency_p50_ms numeric(8,2),
    latency_p95_ms numeric(8,2),
    latency_p99_ms numeric(8,2),

    -- Deployment readiness
    passed_validation boolean DEFAULT false,
    passed_ab_testing boolean DEFAULT false,
    production_ready boolean DEFAULT false,
    deployment_checklist jsonb DEFAULT '{}',

    -- Model governance
    approved_by uuid REFERENCES auth.users(id),
    approval_date timestamp with time zone,
    ethical_review jsonb DEFAULT '{}', -- bias analysis, fairness metrics
    regulatory_compliance jsonb DEFAULT '{}', -- GDPR, CCPA compliance

    -- Lineage tracking
    parent_model_id uuid REFERENCES public.ml_model_versions(id),
    derived_from jsonb DEFAULT '[]', -- array of source model IDs
    improvement_notes text,

    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- ==============================================
-- MODEL DEPLOYMENT TRACKING
-- ==============================================

CREATE TABLE public.ml_deployments (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    model_version_id uuid REFERENCES public.ml_model_versions(id) NOT NULL,

    -- Deployment configuration
    deployment_name text NOT NULL,
    environment text NOT NULL, -- development, staging, production
    deployment_type text NOT NULL, -- edge_function, api_endpoint, batch

    -- Infrastructure details
    compute_resources jsonb DEFAULT '{}', -- CPU, memory, GPU specs
    scaling_config jsonb DEFAULT '{}', -- auto-scaling rules
    load_balancer_config jsonb DEFAULT '{}',

    -- Deployment status
    status text DEFAULT 'pending', -- pending, deploying, active, stopped
    health_status text DEFAULT 'unknown', -- healthy, degraded, unhealthy
    deployed_at timestamp with time zone,
    stopped_at timestamp with time zone,

    -- Traffic management
    traffic_percentage numeric(5,2) DEFAULT 0, -- for A/B testing
    request_routing_rules jsonb DEFAULT '{}',
    feature_flags jsonb DEFAULT '{}',

    -- Monitoring configuration
    monitoring_enabled boolean DEFAULT true,
    alert_thresholds jsonb DEFAULT '{}',
    sla_targets jsonb DEFAULT '{}', -- latency, availability targets

    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- ==============================================
-- FEDERATED LEARNING INFRASTRUCTURE
-- ==============================================

-- Track federated learning participants and contributions
CREATE TABLE public.federated_learning_nodes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    node_identifier text UNIQUE NOT NULL, -- anonymized node ID

    -- Node characteristics
    node_type text NOT NULL, -- property_owner, contractor, municipality
    geographic_region text, -- for geographic diversity
    data_volume_estimate integer, -- number of properties/claims

    -- Participation metrics
    total_rounds_participated integer DEFAULT 0,
    successful_updates integer DEFAULT 0,
    failed_updates integer DEFAULT 0,
    average_update_quality numeric(4,3) DEFAULT 0,

    -- Privacy guarantees
    differential_privacy_epsilon numeric(6,4), -- privacy budget
    secure_aggregation_enabled boolean DEFAULT true,
    homomorphic_encryption_enabled boolean DEFAULT false,

    -- Node health
    last_heartbeat timestamp with time zone,
    connection_quality text DEFAULT 'unknown', -- excellent, good, poor
    compute_capability jsonb DEFAULT '{}',

    -- Contribution tracking
    total_contribution_score numeric(10,3) DEFAULT 0,
    model_improvements jsonb DEFAULT '[]', -- array of improvement metrics

    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Federated learning rounds and aggregation
CREATE TABLE public.federated_learning_rounds (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    model_family text NOT NULL,
    round_number integer NOT NULL,

    -- Round configuration
    target_nodes integer NOT NULL,
    minimum_nodes integer NOT NULL,
    aggregation_algorithm text NOT NULL, -- fedavg, fedprox, fedopt

    -- Privacy settings
    noise_multiplier numeric(6,4), -- for differential privacy
    clipping_threshold numeric(8,4),
    secure_aggregation_protocol text,

    -- Round execution
    status text DEFAULT 'initializing', -- initializing, active, aggregating, completed
    started_at timestamp with time zone,
    completed_at timestamp with time zone,

    -- Participation
    invited_nodes jsonb DEFAULT '[]',
    participating_nodes jsonb DEFAULT '[]',
    completed_nodes jsonb DEFAULT '[]',

    -- Model updates
    base_model_version uuid REFERENCES public.ml_model_versions(id),
    aggregated_update jsonb DEFAULT '{}', -- aggregated gradients/weights
    model_improvement_metrics jsonb DEFAULT '{}',

    -- Quality metrics
    convergence_metric numeric(8,6),
    validation_improvement numeric(6,4),

    created_at timestamp with time zone DEFAULT now()
);

-- ==============================================
-- REAL-TIME STREAMING ANALYTICS
-- ==============================================

-- Stream processing pipeline configuration
CREATE TABLE public.stream_processing_pipelines (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    pipeline_name text UNIQUE NOT NULL,

    -- Pipeline definition
    input_streams jsonb NOT NULL, -- array of data sources
    processing_stages jsonb NOT NULL, -- array of transformation steps
    output_sinks jsonb NOT NULL, -- where processed data goes

    -- Processing configuration
    window_type text NOT NULL, -- tumbling, sliding, session
    window_duration_seconds integer,
    watermark_delay_seconds integer,

    -- AI/ML integration
    ml_models jsonb DEFAULT '[]', -- models used in pipeline
    feature_extraction jsonb DEFAULT '{}',
    anomaly_detection_config jsonb DEFAULT '{}',

    -- Performance settings
    parallelism integer DEFAULT 1,
    checkpoint_interval_seconds integer DEFAULT 60,
    max_out_of_orderness_seconds integer DEFAULT 30,

    -- Pipeline state
    status text DEFAULT 'inactive', -- inactive, running, paused, failed
    last_checkpoint timestamp with time zone,
    processed_events_count bigint DEFAULT 0,

    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Real-time analytics results
CREATE TABLE public.stream_analytics_results (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    pipeline_id uuid REFERENCES public.stream_processing_pipelines(id),

    -- Time windows
    window_start timestamp with time zone NOT NULL,
    window_end timestamp with time zone NOT NULL,

    -- Aggregated metrics
    event_count integer NOT NULL,
    unique_properties integer,

    -- AI insights
    anomaly_scores jsonb DEFAULT '{}', -- per-property anomaly scores
    risk_alerts jsonb DEFAULT '[]', -- real-time risk alerts
    trend_analysis jsonb DEFAULT '{}', -- detected trends

    -- Spatial analytics
    hotspot_clusters jsonb DEFAULT '[]', -- geographic risk clusters
    spatial_correlations jsonb DEFAULT '{}',

    -- Model predictions
    aggregate_predictions jsonb DEFAULT '{}',
    confidence_intervals jsonb DEFAULT '{}',

    created_at timestamp with time zone DEFAULT now()
);

-- ==============================================
-- AI EXPLAINABILITY AND INTERPRETABILITY
-- ==============================================

-- Model explanation storage
CREATE TABLE public.model_explanations (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,

    -- Context
    model_version_id uuid REFERENCES public.ml_model_versions(id),
    prediction_id uuid, -- reference to specific prediction
    property_id uuid REFERENCES public.properties(id),

    -- Explanation methods
    explanation_method text NOT NULL, -- shap, lime, attention, gradcam

    -- Feature attributions
    feature_importance jsonb NOT NULL, -- feature -> importance score
    feature_interactions jsonb DEFAULT '{}', -- pairwise interactions

    -- Visual explanations
    attention_maps jsonb DEFAULT '{}', -- for vision models
    saliency_maps jsonb DEFAULT '{}',

    -- Natural language explanations
    text_explanation text, -- human-readable explanation
    confidence_breakdown jsonb DEFAULT '{}',
    decision_path jsonb DEFAULT '[]', -- sequence of decision steps

    -- Counterfactual analysis
    counterfactuals jsonb DEFAULT '[]', -- what-if scenarios
    minimum_change_required jsonb DEFAULT '{}', -- smallest change for different outcome

    created_at timestamp with time zone DEFAULT now()
);

-- AI decision audit trail
CREATE TABLE public.ai_decision_audit (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,

    -- Decision context
    decision_type text NOT NULL, -- risk_assessment, damage_detection, etc.
    property_id uuid REFERENCES public.properties(id),
    user_id uuid REFERENCES auth.users(id),

    -- Model information
    model_version_id uuid REFERENCES public.ml_model_versions(id),
    model_confidence numeric(4,3),

    -- Decision details
    input_data jsonb NOT NULL, -- sanitized input data
    prediction jsonb NOT NULL, -- model output
    decision_made text NOT NULL, -- final decision

    -- Human oversight
    human_review_required boolean DEFAULT false,
    reviewed_by uuid REFERENCES auth.users(id),
    review_outcome text, -- approved, modified, rejected
    review_notes text,

    -- Impact assessment
    decision_impact jsonb DEFAULT '{}', -- estimated impact
    affected_parties jsonb DEFAULT '[]',

    -- Compliance tracking
    gdpr_compliant boolean DEFAULT true,
    right_to_explanation_requested boolean DEFAULT false,
    explanation_provided boolean DEFAULT false,

    created_at timestamp with time zone DEFAULT now()
);

-- ==============================================
-- ADVANCED AI MONITORING AND ALERTING
-- ==============================================

-- Model drift detection
CREATE TABLE public.model_drift_monitoring (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    model_version_id uuid REFERENCES public.ml_model_versions(id),

    -- Drift metrics
    feature_drift jsonb DEFAULT '{}', -- per-feature drift scores
    prediction_drift numeric(6,4),
    concept_drift numeric(6,4),

    -- Statistical tests
    kolmogorov_smirnov_results jsonb DEFAULT '{}',
    chi_square_results jsonb DEFAULT '{}',
    wasserstein_distance jsonb DEFAULT '{}',

    -- Drift detection
    drift_detected boolean DEFAULT false,
    drift_severity text, -- none, low, medium, high, critical
    affected_segments jsonb DEFAULT '[]', -- which data segments show drift

    -- Recommendations
    retraining_recommended boolean DEFAULT false,
    suggested_actions jsonb DEFAULT '[]',

    monitoring_window_start timestamp with time zone,
    monitoring_window_end timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);

-- ==============================================
-- OPTIMIZED INDEXES FOR AI OPERATIONS
-- ==============================================

-- Model versioning indexes
CREATE INDEX idx_ml_versions_family ON public.ml_model_versions (model_family);
CREATE INDEX idx_ml_versions_production ON public.ml_model_versions (production_ready) WHERE production_ready = true;
CREATE INDEX idx_ml_versions_performance ON public.ml_model_versions ((validation_metrics->>'accuracy')::numeric DESC);

-- Deployment indexes
CREATE INDEX idx_deployments_active ON public.ml_deployments (environment, status) WHERE status = 'active';
CREATE INDEX idx_deployments_model ON public.ml_deployments (model_version_id);

-- Federated learning indexes
CREATE INDEX idx_fed_nodes_active ON public.federated_learning_nodes (last_heartbeat DESC) WHERE last_heartbeat > now() - interval '24 hours';
CREATE INDEX idx_fed_rounds_status ON public.federated_learning_rounds (status, model_family);

-- Streaming analytics indexes
CREATE INDEX idx_stream_pipelines_active ON public.stream_processing_pipelines (status) WHERE status = 'running';
CREATE INDEX idx_stream_results_window ON public.stream_analytics_results (window_start DESC, pipeline_id);

-- Explainability indexes
CREATE INDEX idx_explanations_model ON public.model_explanations (model_version_id);
CREATE INDEX idx_audit_decisions ON public.ai_decision_audit (decision_type, created_at DESC);
CREATE INDEX idx_audit_review ON public.ai_decision_audit (human_review_required) WHERE human_review_required = true;

-- Monitoring indexes
CREATE INDEX idx_drift_detected ON public.model_drift_monitoring (drift_detected, drift_severity) WHERE drift_detected = true;

-- ==============================================
-- AUTOMATED ML OPERATIONS FUNCTIONS
-- ==============================================

-- Function to promote model to production
CREATE OR REPLACE FUNCTION promote_model_to_production(
    p_model_version_id uuid,
    p_approver_id uuid,
    p_deployment_config jsonb DEFAULT '{}'
) RETURNS uuid AS $$
DECLARE
    v_deployment_id uuid;
    v_previous_deployment record;
BEGIN
    -- Validate model is production ready
    IF NOT EXISTS (
        SELECT 1 FROM ml_model_versions
        WHERE id = p_model_version_id
        AND production_ready = true
    ) THEN
        RAISE EXCEPTION 'Model version is not marked as production ready';
    END IF;

    -- Find current production deployment
    SELECT * INTO v_previous_deployment
    FROM ml_deployments
    WHERE model_version_id IN (
        SELECT id FROM ml_model_versions
        WHERE model_family = (
            SELECT model_family FROM ml_model_versions WHERE id = p_model_version_id
        )
    )
    AND environment = 'production'
    AND status = 'active'
    LIMIT 1;

    -- Create new deployment
    INSERT INTO ml_deployments (
        model_version_id,
        deployment_name,
        environment,
        deployment_type,
        compute_resources,
        scaling_config,
        traffic_percentage,
        status,
        deployed_at
    ) VALUES (
        p_model_version_id,
        p_deployment_config->>'name',
        'production',
        COALESCE(p_deployment_config->>'type', 'api_endpoint'),
        COALESCE(p_deployment_config->'compute_resources', '{"cpu": 2, "memory": "4Gi"}'),
        COALESCE(p_deployment_config->'scaling_config', '{"min_replicas": 2, "max_replicas": 10}'),
        CASE WHEN v_previous_deployment.id IS NULL THEN 100 ELSE 10 END, -- Start with 10% traffic if replacing
        'deploying',
        now()
    ) RETURNING id INTO v_deployment_id;

    -- Update model approval
    UPDATE ml_model_versions
    SET
        approved_by = p_approver_id,
        approval_date = now()
    WHERE id = p_model_version_id;

    -- Log deployment in audit
    INSERT INTO ai_decision_audit (
        decision_type,
        model_version_id,
        user_id,
        decision_made,
        input_data
    ) VALUES (
        'model_deployment',
        p_model_version_id,
        p_approver_id,
        'promoted_to_production',
        jsonb_build_object(
            'deployment_id', v_deployment_id,
            'previous_deployment', v_previous_deployment.id
        )
    );

    RETURN v_deployment_id;
END;
$$ LANGUAGE plpgsql;

-- Function to detect model drift
CREATE OR REPLACE FUNCTION check_model_drift(
    p_model_version_id uuid,
    p_monitoring_window interval DEFAULT '7 days'
) RETURNS jsonb AS $$
DECLARE
    v_drift_metrics jsonb;
    v_baseline_metrics jsonb;
    v_current_metrics jsonb;
    v_drift_detected boolean := false;
    v_drift_severity text := 'none';
BEGIN
    -- Get baseline metrics from model training
    SELECT validation_metrics INTO v_baseline_metrics
    FROM ml_model_versions
    WHERE id = p_model_version_id;

    -- Calculate current metrics from recent predictions
    WITH recent_predictions AS (
        SELECT
            jsonb_agg(prediction) as predictions,
            jsonb_agg(input_data) as inputs
        FROM ai_decision_audit
        WHERE model_version_id = p_model_version_id
        AND created_at > now() - p_monitoring_window
    )
    SELECT
        jsonb_build_object(
            'prediction_distribution', predictions,
            'feature_distributions', inputs
        ) INTO v_current_metrics
    FROM recent_predictions;

    -- Calculate drift scores (simplified example)
    v_drift_metrics := jsonb_build_object(
        'feature_drift', jsonb_build_object(),
        'prediction_drift', 0.0,
        'concept_drift', 0.0
    );

    -- Determine drift severity
    IF (v_drift_metrics->>'prediction_drift')::numeric > 0.15 THEN
        v_drift_detected := true;
        v_drift_severity := 'high';
    ELSIF (v_drift_metrics->>'prediction_drift')::numeric > 0.10 THEN
        v_drift_detected := true;
        v_drift_severity := 'medium';
    ELSIF (v_drift_metrics->>'prediction_drift')::numeric > 0.05 THEN
        v_drift_detected := true;
        v_drift_severity := 'low';
    END IF;

    -- Record drift monitoring results
    INSERT INTO model_drift_monitoring (
        model_version_id,
        feature_drift,
        prediction_drift,
        drift_detected,
        drift_severity,
        monitoring_window_start,
        monitoring_window_end,
        retraining_recommended
    ) VALUES (
        p_model_version_id,
        v_drift_metrics->'feature_drift',
        (v_drift_metrics->>'prediction_drift')::numeric,
        v_drift_detected,
        v_drift_severity,
        now() - p_monitoring_window,
        now(),
        v_drift_severity IN ('high', 'critical')
    );

    RETURN jsonb_build_object(
        'drift_detected', v_drift_detected,
        'severity', v_drift_severity,
        'metrics', v_drift_metrics,
        'recommendation', CASE
            WHEN v_drift_severity IN ('high', 'critical') THEN 'immediate_retraining'
            WHEN v_drift_severity = 'medium' THEN 'monitor_closely'
            ELSE 'continue_monitoring'
        END
    );
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- TRIGGERS FOR AUTOMATED ML OPERATIONS
-- ==============================================

-- Trigger to check model performance after deployment
CREATE OR REPLACE FUNCTION trigger_post_deployment_validation() RETURNS trigger AS $$
BEGIN
    IF NEW.status = 'active' AND OLD.status = 'deploying' THEN
        -- Schedule performance validation after 1 hour
        PERFORM pg_notify('ml_ops_tasks', jsonb_build_object(
            'task', 'validate_deployment',
            'deployment_id', NEW.id,
            'scheduled_for', now() + interval '1 hour'
        )::text);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_deployment_performance
AFTER UPDATE ON ml_deployments
FOR EACH ROW EXECUTE FUNCTION trigger_post_deployment_validation();

-- ==============================================
-- INITIAL ML OPERATIONS DATA
-- ==============================================

-- Create example ML pipelines
INSERT INTO stream_processing_pipelines (pipeline_name, input_streams, processing_stages, output_sinks, window_type, window_duration_seconds) VALUES
('property_risk_monitoring',
 '["environmental_sensors", "weather_alerts", "property_updates"]',
 '[{"stage": "feature_extraction"}, {"stage": "anomaly_detection"}, {"stage": "risk_scoring"}]',
 '["property_digital_twins", "risk_alerts"]',
 'sliding', 300),
('damage_detection_stream',
 '["drone_imagery", "ar_captures", "satellite_feeds"]',
 '[{"stage": "image_preprocessing"}, {"stage": "object_detection"}, {"stage": "damage_classification"}]',
 '["ai_enhanced_imagery", "damage_reports"]',
 'tumbling', 600);
