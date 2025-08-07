# Monitoring Package - Claude.md

## Overview

The `@claimguardian/monitoring` package provides comprehensive application monitoring, performance tracking, error reporting, and analytics for the ClaimGuardian platform.

## Architecture

- **Sentry Integration**: Full-stack error tracking and performance monitoring
- **Web Vitals**: Core web performance metrics collection
- **Custom Analytics**: Business metrics and user behavior tracking
- **Supabase Monitoring**: Database performance and query optimization
- **Real-time Dashboards**: Live monitoring and alerting

## Key Components

### Error Monitoring with Sentry

```typescript
import {
  initMonitoring,
  captureError,
  captureMessage,
} from "@claimguardian/monitoring";

// Initialize monitoring (call once in app startup)
initMonitoring({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  profilesSampleRate: 0.1,
});

// Capture errors with context
try {
  await processClaimData(claimId);
} catch (error) {
  captureError(error, {
    tags: {
      section: "claim-processing",
      claimId: claimId,
    },
    user: {
      id: user.id,
      email: user.email,
    },
    extra: {
      claimData: sanitizedClaimData,
    },
  });
}
```

### Performance Monitoring

```typescript
import { trackPerformance, measureFunction } from "@claimguardian/monitoring";

// Track Web Vitals automatically
trackPerformance({
  trackWebVitals: true,
  trackPageLoads: true,
  trackUserInteractions: true,
});

// Measure function performance
const optimizedFunction = measureFunction(expensiveOperation, {
  name: "claim-calculation",
  tags: { version: "v2" },
});

const result = await optimizedFunction(claimData);
```

### Custom Analytics

```typescript
import { analytics } from "@claimguardian/monitoring";

// Track business events
analytics.track("claim_submitted", {
  claimId: "claim-123",
  claimType: "property-damage",
  estimatedValue: 25000,
  userId: user.id,
  timestamp: new Date().toISOString(),
});

// Track user engagement
analytics.track("ai_tool_used", {
  toolName: "damage-analyzer",
  processingTime: 2300,
  accuracy: 0.94,
  costIncurred: 0.23,
});

// Track feature adoption
analytics.track("feature_enabled", {
  featureName: "ar-damage-documenter",
  userId: user.id,
  planType: "premium",
});
```

### Supabase Database Monitoring

```typescript
import { supabaseMonitor } from "@claimguardian/monitoring";

// Monitor query performance
const monitoredSupabase = supabaseMonitor.wrap(supabase, {
  trackQueries: true,
  trackSlowQueries: true,
  slowQueryThreshold: 1000, // 1 second
  includeQueryText: false, // For security
});

// Use monitored client normally
const { data, error } = await monitoredSupabase
  .from("claims")
  .select("*")
  .eq("user_id", userId);

// Automatically tracks:
// - Query execution time
// - Number of rows returned
// - Error rates
// - Connection pool usage
```

## Performance Metrics

### Web Vitals Tracking

```typescript
import { trackWebVitals } from "@claimguardian/monitoring";

// Automatically track Core Web Vitals
trackWebVitals({
  onCLS: (metric) => {
    // Cumulative Layout Shift
    console.log("CLS:", metric.value);
  },
  onFCP: (metric) => {
    // First Contentful Paint
    console.log("FCP:", metric.value);
  },
  onLCP: (metric) => {
    // Largest Contentful Paint
    console.log("LCP:", metric.value);
  },
  onINP: (metric) => {
    // Interaction to Next Paint (replaces FID)
    console.log("INP:", metric.value);
  },
  onTTFB: (metric) => {
    // Time to First Byte
    console.log("TTFB:", metric.value);
  },
});
```

### Custom Performance Metrics

```typescript
import { PerformanceObserver } from "@claimguardian/monitoring";

const performanceObserver = new PerformanceObserver();

// Track AI processing performance
performanceObserver.measure("ai-damage-analysis", async () => {
  const analysis = await aiService.analyzeDamage(images);
  return analysis;
});

// Track page load performance
performanceObserver.trackPageLoad("claim-details", {
  includeResources: true,
  includeNavigation: true,
});

// Track user interactions
performanceObserver.trackInteraction("form-submission", {
  formType: "claim-creation",
  fieldCount: 12,
});
```

## Business Analytics

### Claim Processing Metrics

```typescript
import { BusinessMetrics } from "@claimguardian/monitoring";

const metrics = new BusinessMetrics();

// Track claim lifecycle
await metrics.trackClaimEvent("created", {
  claimId: claim.id,
  value: claim.estimatedValue,
  type: claim.damageType,
  source: "web-app",
});

await metrics.trackClaimEvent("processed", {
  claimId: claim.id,
  processingTime: endTime - startTime,
  aiAnalysisUsed: true,
  approvalStatus: "approved",
});

// Generate business reports
const report = await metrics.generateReport("monthly", {
  includeAIUsage: true,
  includeCostAnalysis: true,
  includeUserSegmentation: true,
});
```

### AI Usage Analytics

```typescript
// Track AI service usage and costs
analytics.trackAIUsage({
  service: "damage-analyzer",
  provider: "openai",
  model: "gpt-4-vision",
  tokenCount: 1500,
  cost: 0.045,
  processingTime: 2300,
  cacheHit: false,
  userId: user.id,
});

// Monitor AI performance
analytics.trackAIPerformance({
  service: "policy-chat",
  accuracy: 0.94,
  userSatisfaction: 4.2,
  completionRate: 0.87,
});
```

## Real-time Monitoring

### Dashboard Components

```typescript
import { MonitoringDashboard, MetricCard } from '@claimguardian/monitoring'

const AdminDashboard = () => {
  return (
    <MonitoringDashboard>
      <MetricCard
        title="Active Users"
        metric="realtime-users"
        refreshInterval={5000}
        format="number"
      />

      <MetricCard
        title="Error Rate"
        metric="error-rate"
        threshold={{ warning: 0.05, critical: 0.1 }}
        format="percentage"
      />

      <MetricCard
        title="AI Processing Queue"
        metric="ai-queue-length"
        refreshInterval={1000}
        format="number"
      />

      <MetricCard
        title="Database Response Time"
        metric="db-response-time"
        format="duration"
      />
    </MonitoringDashboard>
  )
}
```

### Alert System

```typescript
import { AlertManager } from "@claimguardian/monitoring";

const alertManager = new AlertManager({
  channels: {
    email: process.env.ALERT_EMAIL,
    slack: process.env.SLACK_WEBHOOK,
    sms: process.env.TWILIO_PHONE,
  },
});

// Define alert rules
alertManager.addRule({
  name: "high-error-rate",
  condition: "error_rate > 0.1",
  severity: "critical",
  channels: ["email", "slack"],
  cooldown: 300, // 5 minutes
});

alertManager.addRule({
  name: "slow-database",
  condition: "avg_db_response_time > 2000",
  severity: "warning",
  channels: ["slack"],
});
```

## Error Handling & Logging

### Structured Logging

```typescript
import { logger } from "@claimguardian/monitoring";

// Different log levels
logger.info("User logged in", {
  userId: user.id,
  loginMethod: "email",
  timestamp: new Date().toISOString(),
});

logger.warn("Slow database query detected", {
  query: "SELECT * FROM claims WHERE...",
  duration: 2500,
  threshold: 1000,
});

logger.error("Payment processing failed", {
  error: error.message,
  userId: user.id,
  amount: paymentAmount,
  paymentId: payment.id,
});
```

### Error Boundaries

```typescript
import { ErrorBoundary } from '@claimguardian/monitoring'

const App = () => {
  return (
    <ErrorBoundary
      fallback={<ErrorFallback />}
      onError={(error, errorInfo) => {
        captureError(error, {
          tags: { section: 'app-root' },
          extra: errorInfo
        })
      }}
    >
      <Router>
        <Routes>
          {/* App routes */}
        </Routes>
      </Router>
    </ErrorBoundary>
  )
}
```

## Security Monitoring

### Security Events

```typescript
import { securityMonitor } from "@claimguardian/monitoring";

// Track authentication events
securityMonitor.trackAuth({
  event: "login_attempt",
  userId: user?.id,
  ipAddress: req.ip,
  userAgent: req.headers["user-agent"],
  success: true,
});

// Monitor suspicious activity
securityMonitor.trackSuspiciousActivity({
  event: "multiple_failed_logins",
  ipAddress: req.ip,
  attemptCount: 5,
  timeWindow: "5min",
});

// Track data access
securityMonitor.trackDataAccess({
  resource: "claim-documents",
  userId: user.id,
  action: "download",
  claimId: claim.id,
});
```

## Configuration

### Environment Setup

```bash
# Sentry Configuration
NEXT_PUBLIC_SENTRY_DSN=https://your-dsn@sentry.io/project-id
SENTRY_AUTH_TOKEN=your-auth-token

# Analytics Configuration
ANALYTICS_API_KEY=your-analytics-key
ANALYTICS_ENDPOINT=https://analytics.claimguardian.ai

# Alert Configuration
ALERT_EMAIL=alerts@claimguardian.ai
SLACK_WEBHOOK=https://hooks.slack.com/...
```

### Monitoring Configuration

```typescript
// monitoring.config.ts
export const monitoringConfig = {
  sentry: {
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
    beforeSend: (event) => {
      // Filter sensitive data
      if (event.extra?.password) {
        delete event.extra.password;
      }
      return event;
    },
  },
  analytics: {
    trackPageViews: true,
    trackUserInteractions: true,
    trackBusinessEvents: true,
    sessionRecording: false, // Disabled for privacy
  },
  performance: {
    trackWebVitals: true,
    trackLongTasks: true,
    trackResourceLoading: true,
  },
};
```

## Testing

### Mock Monitoring

```typescript
// For testing environments
import { createMockMonitoring } from "@claimguardian/monitoring/testing";

const mockMonitoring = createMockMonitoring();

// Verify events are tracked
test("should track claim submission", () => {
  submitClaim(claimData);

  expect(mockMonitoring.events).toContainEqual({
    name: "claim_submitted",
    properties: expect.objectContaining({
      claimType: "property-damage",
    }),
  });
});
```

## Performance Considerations

### Sampling and Throttling

```typescript
// Sample errors to reduce noise
const shouldCaptureError = (error: Error) => {
  // Don't capture network errors from ad blockers
  if (error.message.includes("Failed to fetch")) {
    return Math.random() < 0.1; // 10% sampling
  }
  return true;
};

// Throttle high-frequency events
const throttledTrackUserAction = throttle((action: string) => {
  analytics.track("user_action", { action });
}, 1000); // Max once per second
```

### Resource Management

```typescript
// Clean up monitoring resources
export const cleanupMonitoring = () => {
  performanceObserver.disconnect();
  alertManager.close();
  analytics.flush();
};

// Use in app cleanup
window.addEventListener("beforeunload", cleanupMonitoring);
```

## Dependencies

- `@sentry/nextjs ^10.1.0` - Error monitoring
- `web-vitals ^5.1.0` - Performance metrics (INP replaces FID)
- `react ^18.3.1` - React integration

## Build Configuration

```json
{
  "scripts": {
    "build": "tsup src/index.ts --format esm --dts",
    "test": "vitest"
  }
}
```

## Best Practices

### Privacy and Security

- Never log sensitive user data (passwords, SSNs, etc.)
- Sanitize error messages before sending to external services
- Use data retention policies to automatically delete old monitoring data
- Implement user consent for analytics tracking

### Performance Impact

- Use sampling for high-volume events
- Batch analytics events to reduce network requests
- Monitor the monitoring system itself for performance impact
- Use async processing for non-critical tracking

### Alert Fatigue Prevention

- Set appropriate alert thresholds
- Use alert grouping and deduplication
- Implement escalation policies
- Regular review and tuning of alert rules
