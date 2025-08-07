# Time-Series Analytics for AI Performance Tracking

This guide covers ClaimGuardian's comprehensive time-series analytics system for AI performance monitoring, anomaly detection, and forecasting.

## Overview

The time-series analytics system provides:

- **Real-time metrics collection** from all AI operations
- **Statistical analysis** with trends, seasonality, and anomaly detection
- **Forecasting capabilities** for capacity planning
- **Performance insights** with actionable recommendations
- **Comparative analysis** for A/B testing validation

## Architecture

### Core Components

#### 1. Data Collection (`ai-performance-metrics` table)

```sql
-- Partitioned by timestamp for optimal performance
CREATE TABLE ai_performance_metrics (
  timestamp TIMESTAMPTZ NOT NULL,
  metric_name TEXT NOT NULL,
  metric_value DECIMAL(15,6) NOT NULL,
  feature_id TEXT,
  model_name TEXT,
  provider TEXT,
  -- ... additional fields
) PARTITION BY RANGE (timestamp);
```

#### 2. Aggregation Engine (`ai-metrics-aggregated` table)

Pre-computed statistics for different time windows:

- 1-minute, 5-minute, 15-minute, 1-hour, 1-day intervals
- Statistical measures: mean, median, percentiles, standard deviation
- Grouped by feature, model, and provider

#### 3. Anomaly Detection (`ai-anomalies` table)

- Z-score based statistical outlier detection
- Pattern break detection using moving averages
- Configurable sensitivity levels
- Automatic severity classification (low/medium/high/critical)

#### 4. Forecasting (`ai-forecasts` table)

- Linear regression and exponential smoothing models
- Multiple time horizons (1 hour, 1 day, 1 week)
- Confidence intervals and accuracy metrics

#### 5. Performance Insights (`ai-performance-insights` table)

- Automated insight generation from trends and anomalies
- Actionable recommendations
- Status tracking for review workflows

## Key Metrics Tracked

### Response Time Metrics

- `response_time`: End-to-end API response time in milliseconds
- Percentiles: P50, P95, P99 for tail latency analysis
- Trends and seasonality detection

### Cost Metrics

- `cost`: Per-request cost in USD
- Provider-specific cost tracking
- Budget alerting and cost optimization insights

### Reliability Metrics

- `success_rate`: Percentage of successful requests
- `error_rate`: Error frequency and patterns
- Error classification and root cause analysis

### Throughput Metrics

- `request_count`: Requests per minute/hour
- Capacity utilization and scaling insights
- Load pattern analysis

### Accuracy Metrics

- `accuracy`: Model prediction accuracy (0-1 scale)
- Accuracy drift detection over time
- Model performance comparisons

## Usage Guide

### 1. Automatic Tracking

All AI operations are automatically tracked through the enhanced AI client:

```typescript
import { enhancedAIClient } from '@/lib/ai/enhanced-client'

// Metrics are automatically tracked for all requests
const response = await enhancedAIClient.enhancedChat({
  messages: [...],
  featureId: 'damage-analyzer',
  userId: user.id
})
// Tracks: response_time, cost, success_rate, error_rate
```

### 2. Manual Metric Tracking

For custom metrics or external integrations:

```typescript
import { trackAIMetric } from "@/actions/ai-analytics";

await trackAIMetric({
  metricName: "custom_accuracy",
  metricValue: 0.94,
  featureId: "policy-chat",
  modelName: "gpt-4",
  provider: "openai",
  metadata: {
    testSet: "insurance_policies_v2",
    evaluationMethod: "human_review",
  },
});
```

### 3. Analytics Dashboard

Access comprehensive analytics through the admin panel:

```
/admin?tab=time-series
```

Features:

- **Interactive time-series charts** with zoom and filtering
- **Anomaly visualization** with severity indicators
- **Trend analysis** with statistical significance
- **Forecasting views** for capacity planning
- **Comparison mode** for A/B test analysis

### 4. Programmatic Analysis

Use the time-series analyzer for custom analysis:

```typescript
import { aiTimeSeriesAnalyzer } from "@/lib/analytics/time-series-analyzer";

const analysis = await aiTimeSeriesAnalyzer.analyzeAIPerformance({
  startTime: new Date(Date.now() - 24 * 60 * 60 * 1000),
  endTime: new Date(),
  resolution: "15m",
  features: ["damage-analyzer", "policy-chat"],
  includeForecasting: true,
  includeAnomalyDetection: true,
});

console.log("Performance Analysis:", {
  metrics: analysis.metrics,
  trends: analysis.trends,
  anomalies: analysis.anomalies,
  recommendations: analysis.recommendations,
});
```

## Background Processing

### Analytics Worker

The system includes a background worker for automated processing:

```bash
# Start the analytics worker daemon
node scripts/analytics-worker.js start

# Run specific operations
node scripts/analytics-worker.js run aggregate
node scripts/analytics-worker.js run anomalies
node scripts/analytics-worker.js run insights
```

### Scheduled Tasks

- **Metric Aggregation**: Every 5 minutes
- **Anomaly Detection**: Every 15 minutes
- **Insight Generation**: Every hour
- **Data Cleanup**: Daily at 2 AM

## Advanced Features

### 1. Comparative Analysis

Compare performance between different time periods:

```typescript
const comparison = await aiTimeSeriesAnalyzer.comparePerformance(
  baselineStart, // Previous week
  baselineEnd,
  comparisonStart, // Current week
  comparisonEnd,
  {
    features: ["damage-analyzer"],
    confidenceLevel: 0.95,
  },
);

// Statistical significance testing with p-values
comparison.significantChanges.forEach((change) => {
  if (change.isSignificant) {
    console.log(
      `${change.metric}: ${change.percentChange}% change (p=${change.pValue})`,
    );
  }
});
```

### 2. Custom Benchmarks

Set performance targets and SLA thresholds:

```typescript
import { createPerformanceBenchmark } from "@/actions/ai-analytics";

await createPerformanceBenchmark({
  benchmarkName: "damage_analyzer_response_time",
  metricName: "response_time",
  targetValue: 2000, // 2 seconds target
  warningThreshold: 3000, // Warning at 3 seconds
  criticalThreshold: 5000, // Critical at 5 seconds
  featureId: "damage-analyzer",
  benchmarkType: "sla",
  description: "Response time SLA for damage analysis",
});
```

### 3. Anomaly Configuration

Customize anomaly detection sensitivity:

```typescript
// Conservative detection (fewer false positives)
await triggerAnomalyDetection({
  lookbackHours: 24,
  sensitivity: 4.0, // 4-sigma threshold
});

// Sensitive detection (catch smaller deviations)
await triggerAnomalyDetection({
  lookbackHours: 12,
  sensitivity: 2.5, // 2.5-sigma threshold
});
```

## Data Retention Policy

- **Raw metrics**: 7 days (partitioned by day)
- **Aggregated data**: 30 days
- **Anomalies**: 90 days (resolved), indefinite (unresolved)
- **Insights**: 1 year
- **Forecasts**: 30 days

## Performance Optimization

### Database Optimization

- **Partitioning**: Time-based partitioning for metrics tables
- **Indexing**: Optimized indexes on timestamp, metric_name, feature_id
- **Aggregation**: Pre-computed aggregations reduce query load
- **Compression**: Automatic compression for older partitions

### Query Optimization

- **Time-based filtering**: Always include time bounds in queries
- **Metric filtering**: Filter by specific metrics when possible
- **Pagination**: Use LIMIT/OFFSET for large result sets
- **Caching**: Results cached for 15 minutes (configurable)

## Monitoring and Alerting

### Built-in Alerts

The system generates alerts for:

- **Critical anomalies**: Immediate attention required
- **Cost spikes**: Budget overruns or unusual spend patterns
- **Performance degradation**: Response time or accuracy issues
- **System issues**: High error rates or service unavailability

### Integration Points

- **Slack notifications**: Via webhook integration
- **Email alerts**: For critical issues
- **Dashboard badges**: Real-time status indicators
- **API endpoints**: For custom integrations

## Troubleshooting

### Common Issues

#### 1. Missing Metrics

```sql
-- Check if metrics are being inserted
SELECT COUNT(*), MAX(timestamp)
FROM ai_performance_metrics
WHERE timestamp > NOW() - INTERVAL '1 hour';
```

#### 2. Aggregation Problems

```sql
-- Verify aggregation function is working
SELECT aggregate_ai_metrics('15 minutes', '1 hour');
```

#### 3. Anomaly Detection Issues

```sql
-- Check anomaly detection results
SELECT * FROM ai_anomalies
WHERE detected_at > NOW() - INTERVAL '1 day'
ORDER BY detected_at DESC;
```

### Debug Commands

```bash
# Test aggregation
node scripts/analytics-worker.js run aggregate

# Test anomaly detection
node scripts/analytics-worker.js run anomalies

# Generate insights
node scripts/analytics-worker.js run insights

# Check worker status
node scripts/analytics-worker.js status
```

## API Reference

### Server Actions

- `trackAIMetric(params)`: Record a metric data point
- `getAIMetrics(query)`: Retrieve raw metrics
- `getAggregatedAIMetrics(query)`: Get pre-aggregated data
- `getAIAnomalies(options)`: Fetch detected anomalies
- `getAIInsights(options)`: Retrieve performance insights
- `triggerMetricAggregation(options)`: Manual aggregation
- `triggerAnomalyDetection(options)`: Manual anomaly detection

### Time-Series Analyzer

- `analyzeAIPerformance(options)`: Comprehensive performance analysis
- `comparePerformance(...)`: Statistical comparison between periods
- `calculateMetrics(values)`: Statistical calculations
- `detectAnomalies(data)`: Anomaly detection algorithms
- `generateForecasts(data)`: Forecasting with multiple models

## Best Practices

### 1. Metric Design

- Use consistent naming conventions
- Include relevant metadata
- Set appropriate data types and precision
- Consider cardinality impact on storage

### 2. Query Optimization

- Always filter by time range
- Use appropriate aggregation levels
- Limit result sets for dashboards
- Cache frequently accessed data

### 3. Anomaly Management

- Set appropriate sensitivity levels
- Review and classify anomalies regularly
- Document resolution actions
- Update detection parameters based on feedback

### 4. Capacity Planning

- Monitor storage growth
- Plan for partition management
- Scale aggregation processing as needed
- Optimize retention policies

## Examples

### Dashboard Integration

```typescript
// Real-time metrics widget
const MetricsWidget = () => {
  const [metrics, setMetrics] = useState(null)

  useEffect(() => {
    const loadMetrics = async () => {
      const analysis = await aiTimeSeriesAnalyzer.analyzeAIPerformance({
        startTime: new Date(Date.now() - 60 * 60 * 1000), // Last hour
        endTime: new Date(),
        resolution: '5m'
      })
      setMetrics(analysis)
    }

    loadMetrics()
    const interval = setInterval(loadMetrics, 30000) // Refresh every 30s
    return () => clearInterval(interval)
  }, [])

  return (
    <Card>
      <CardHeader>AI Performance</CardHeader>
      <CardContent>
        {metrics && (
          <div>
            <div>Avg Response Time: {metrics.metrics.responseTime.mean}ms</div>
            <div>Success Rate: {(metrics.metrics.successRate.mean * 100).toFixed(1)}%</div>
            <div>Cost per Hour: ${metrics.metrics.cost.sum.toFixed(2)}</div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
```

### Custom Analysis

```typescript
// Weekly performance report
const generateWeeklyReport = async () => {
  const endTime = new Date();
  const startTime = new Date(endTime.getTime() - 7 * 24 * 60 * 60 * 1000);

  const analysis = await aiTimeSeriesAnalyzer.analyzeAIPerformance({
    startTime,
    endTime,
    resolution: "1h",
    includeForecasting: true,
  });

  const report = {
    period: { start: startTime, end: endTime },
    summary: {
      totalRequests: analysis.metrics.throughput.sum,
      avgResponseTime: analysis.metrics.responseTime.mean,
      totalCost: analysis.metrics.cost.sum,
      successRate: analysis.metrics.successRate.mean,
    },
    trends: analysis.trends.map((t) => ({
      metric: t.metric,
      direction: t.direction,
      rate: t.rate,
    })),
    anomalies: analysis.anomalies.length,
    recommendations: analysis.recommendations,
  };

  return report;
};
```

This comprehensive time-series analytics system provides deep insights into AI performance, enabling data-driven optimization and proactive issue resolution.
