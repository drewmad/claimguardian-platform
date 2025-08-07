# ML Operations Deployment Guide

## Overview

This guide documents the complete ML Operations infrastructure deployed for ClaimGuardian, including model management, federated learning, real-time monitoring, and automated data sync schedules.

## Architecture Components

### 1. Database Schema (Deployed ✅)

The ML operations schema includes:

- **ml_model_versions**: Model version control with lineage tracking
- **ml_model_deployments**: Deployment configuration and traffic management
- **ml_performance_metrics**: Real-time performance tracking
- **federated_learning_rounds**: Privacy-preserving distributed learning
- **ai_stream_processors**: Real-time streaming analytics
- **ai_explanations**: Model interpretability storage

### 2. Edge Functions (Deployed ✅)

#### ML Model Management (`/ml-model-management`)
- Model deployment and versioning
- A/B testing and canary releases
- Drift detection and monitoring
- Automated rollback capabilities

#### Federated Learning (`/federated-learning`)
- Node registration and trust scoring
- Secure aggregation with differential privacy
- Round orchestration and convergence tracking

#### Spatial AI API (`/spatial-ai-api`)
- Property analysis with AI
- Environmental risk assessment
- Embedding generation for similarity search

#### AR Drone Processor (`/ar-drone-processor`)
- Drone imagery processing
- 3D model generation
- Damage detection and analysis

#### Environmental Data Sync (`/environmental-data-sync`)
- Hazard data synchronization
- Sensor data processing
- AI-powered insights generation

### 3. Monitoring Dashboards (Deployed ✅)

#### ML Operations Dashboard (`/dashboard/ml-operations`)
- Real-time model performance metrics
- Drift detection alerts
- Federated learning status
- A/B test results

#### Component Dashboards
- **ModelMonitoringDashboard**: Detailed model metrics and drift analysis
- **ExplainabilityDashboard**: Feature importance and decision paths

### 4. Automated Schedules (Configured ✅)

| Schedule | Frequency | Purpose |
|----------|-----------|---------|
| Environmental Data Sync | Every 6 hours | Sync hazard and sensor data |
| Property AI Enrichment | Daily at 02:00 UTC | Batch process property enrichments |
| ML Metrics Aggregation | Every hour | Aggregate model performance metrics |
| Model Drift Detection | Every 4 hours | Check for distribution shifts |
| Federated Learning | Daily at 00:00 UTC | Coordinate distributed training |
| Florida Parcel Monitor | Every 30 minutes | Monitor data import health |
| AI Processing Queue | Every 5 minutes | Process pending AI tasks |
| Stream Processor Health | Every 15 minutes | Check streaming pipeline health |
| Model Auto-scaling | Every 10 minutes | Scale based on traffic |

## Deployment Steps

### 1. Database Schema Application
```bash
# Applied via Supabase migrations
supabase db push
```

### 2. Edge Functions Deployment
```bash
# Deploy all ML Edge Functions
supabase functions deploy ml-model-management
supabase functions deploy federated-learning
supabase functions deploy spatial-ai-api
supabase functions deploy ar-drone-processor
supabase functions deploy environmental-data-sync
```

### 3. Cron Schedule Deployment
```bash
# Deploy cron configuration
supabase functions deploy --legacy-bundle
```

### 4. Monitoring Setup
```bash
# Run monitoring script
./scripts/ml-ops/monitor-schedules.sh
```

## Testing

### Integration Tests
```bash
# Run ML pipeline integration tests
cd supabase/functions/tests
./run-tests.sh

# Run with detailed output
./run-tests.sh --detailed
```

### Unit Tests
```bash
# Test individual components
deno test ml-model-management.test.ts
deno test federated-learning.test.ts
```

## Monitoring and Maintenance

### Health Checks
1. Access ML Operations Dashboard: `/dashboard/ml-operations`
2. Monitor Edge Function logs in Supabase Dashboard
3. Check cron job execution logs

### Key Metrics to Monitor
- Model accuracy and drift scores
- Inference latency (p50, p95, p99)
- Federated learning convergence
- Data sync completion rates
- Error rates and alerts

### Troubleshooting

#### Edge Function Errors
```bash
# Check function logs
supabase functions logs <function-name>

# Test function directly
curl -X POST https://your-project.supabase.co/functions/v1/<function-name> \
  -H "Authorization: Bearer YOUR_SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

#### Database Issues
```sql
-- Check table existence
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name LIKE 'ml_%';

-- Verify function creation
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public' AND routine_type = 'FUNCTION';
```

## Security Considerations

1. **Service Role Key**: Only use for server-side operations
2. **Differential Privacy**: Configured with appropriate epsilon values
3. **Federated Learning**: Secure aggregation enabled by default
4. **Row Level Security**: Applied to all ML tables

## Next Steps

1. **Model Training**: Train initial models on Florida property data
2. **Performance Tuning**: Optimize based on real-world metrics
3. **Scale Testing**: Load test the infrastructure
4. **Documentation**: Create API documentation for developers

## Support

For issues or questions:
1. Check Supabase logs and monitoring
2. Review integration test results
3. Consult the ML Operations Dashboard
4. Contact the ML Engineering team
