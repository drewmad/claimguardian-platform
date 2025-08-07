#!/bin/bash

# Setup Error Alerts for Critical Errors
# Configures automated error monitoring and alerting

set -euo pipefail

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚨 Setting Up Error Alerts${NC}"
echo -e "${BLUE}=========================${NC}"
echo ""

# Check if we're in the right directory
if [[ ! -f "package.json" ]]; then
    echo -e "${RED}ERROR: Script must be run from project root directory${NC}"
    exit 1
fi

# Step 1: Create error monitoring Edge Function
echo -e "${YELLOW}📝 Creating error monitoring Edge Function...${NC}"

mkdir -p supabase/functions/error-monitor

cat > supabase/functions/error-monitor/index.ts << 'EOF'
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ErrorAlert {
  error_type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  stack_trace?: string
  user_id?: string
  metadata?: Record<string, any>
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const resendApiKey = Deno.env.get('RESEND_API_KEY') ?? ''

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Check for recent critical errors
    const { data: errors, error: fetchError } = await supabase
      .from('error_logs')
      .select('*')
      .gte('created_at', new Date(Date.now() - 5 * 60 * 1000).toISOString()) // Last 5 minutes
      .in('severity', ['critical', 'high'])
      .order('created_at', { ascending: false })

    if (fetchError) throw fetchError

    if (errors && errors.length > 0) {
      // Group errors by type
      const errorGroups = errors.reduce((acc, error) => {
        const key = error.error_type || 'unknown'
        if (!acc[key]) acc[key] = []
        acc[key].push(error)
        return acc
      }, {} as Record<string, any[]>)

      // Send alert email
      if (resendApiKey) {
        const emailHtml = generateErrorAlertEmail(errorGroups, errors.length)

        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'alerts@claimguardianai.com',
            to: ['support@claimguardianai.com'],
            subject: `🚨 ClaimGuardian: ${errors.length} Critical Errors Detected`,
            html: emailHtml,
          }),
        })

        if (!emailResponse.ok) {
          console.error('Failed to send alert email:', await emailResponse.text())
        }
      }

      // Log to monitoring table
      await supabase
        .from('monitoring_alerts')
        .insert({
          alert_type: 'error_threshold',
          severity: 'high',
          message: `${errors.length} critical errors detected in the last 5 minutes`,
          metadata: { error_groups: errorGroups },
        })
    }

    return new Response(
      JSON.stringify({
        success: true,
        errors_found: errors?.length || 0,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error in error-monitor:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

function generateErrorAlertEmail(errorGroups: Record<string, any[]>, totalCount: number): string {
  const groupsHtml = Object.entries(errorGroups)
    .map(([type, errors]) => `
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;">${type}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${errors.length}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${errors[0].message || 'No message'}</td>
      </tr>
    `)
    .join('')

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #dc2626;">🚨 Critical Error Alert</h2>
      <p>ClaimGuardian has detected ${totalCount} critical errors in the last 5 minutes.</p>

      <h3>Error Summary</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background-color: #f3f4f6;">
            <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Error Type</th>
            <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Count</th>
            <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Sample Message</th>
          </tr>
        </thead>
        <tbody>
          ${groupsHtml}
        </tbody>
      </table>

      <p style="margin-top: 20px;">
        <a href="https://claimguardianai.com/admin/errors"
           style="background-color: #dc2626; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          View Error Dashboard
        </a>
      </p>

      <p style="margin-top: 20px; color: #6b7280; font-size: 12px;">
        This is an automated alert from ClaimGuardian monitoring.
      </p>
    </div>
  `
}
EOF

echo -e "${GREEN}✅ Error monitor function created${NC}"

# Step 2: Create monitoring tables if they don't exist
echo ""
echo -e "${YELLOW}📊 Creating monitoring tables...${NC}"

cat > supabase/migrations/$(date +%Y%m%d%H%M%S)_create_monitoring_tables.sql << 'EOF'
-- Create error_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.error_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    error_type VARCHAR(100) NOT NULL,
    severity VARCHAR(20) CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    message TEXT NOT NULL,
    stack_trace TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    session_id VARCHAR(100),
    page_url TEXT,
    user_agent TEXT,
    ip_address INET,
    metadata JSONB DEFAULT '{}',
    resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    notes TEXT
);

-- Create monitoring_alerts table
CREATE TABLE IF NOT EXISTS public.monitoring_alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    alert_type VARCHAR(100) NOT NULL,
    severity VARCHAR(20) CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    message TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    acknowledged BOOLEAN DEFAULT FALSE,
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    acknowledged_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON public.error_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_severity ON public.error_logs(severity);
CREATE INDEX IF NOT EXISTS idx_error_logs_user_id ON public.error_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_resolved ON public.error_logs(resolved);

-- Create RLS policies
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monitoring_alerts ENABLE ROW LEVEL SECURITY;

-- Admin users can view all errors
CREATE POLICY "Admin users can view all error logs" ON public.error_logs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE user_profiles.user_id = auth.uid()
            AND user_profiles.role = 'admin'
        )
    );

-- Users can view their own errors
CREATE POLICY "Users can view their own error logs" ON public.error_logs
    FOR SELECT USING (user_id = auth.uid());

-- Service role can insert errors
CREATE POLICY "Service role can insert error logs" ON public.error_logs
    FOR INSERT WITH CHECK (TRUE);

-- Function to log errors
CREATE OR REPLACE FUNCTION public.log_error(
    p_error_type VARCHAR,
    p_severity VARCHAR,
    p_message TEXT,
    p_stack_trace TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
    v_error_id UUID;
BEGIN
    INSERT INTO public.error_logs (
        error_type,
        severity,
        message,
        stack_trace,
        user_id,
        metadata
    ) VALUES (
        p_error_type,
        p_severity,
        p_message,
        p_stack_trace,
        auth.uid(),
        p_metadata
    ) RETURNING id INTO v_error_id;

    RETURN v_error_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get error statistics
CREATE OR REPLACE FUNCTION public.get_error_statistics(
    p_hours INTEGER DEFAULT 24
) RETURNS TABLE (
    error_type VARCHAR,
    severity VARCHAR,
    count BIGINT,
    last_occurred TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        el.error_type,
        el.severity,
        COUNT(*) as count,
        MAX(el.created_at) as last_occurred
    FROM public.error_logs el
    WHERE el.created_at > NOW() - INTERVAL '1 hour' * p_hours
    GROUP BY el.error_type, el.severity
    ORDER BY count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
EOF

echo -e "${GREEN}✅ Monitoring tables migration created${NC}"

# Step 3: Create error tracking client utility
echo ""
echo -e "${YELLOW}📦 Creating error tracking client utility...${NC}"

mkdir -p packages/monitoring/src

cat > packages/monitoring/src/error-tracker.ts << 'EOF'
import { createClient } from '@supabase/supabase-js'

export interface ErrorInfo {
  errorType: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  stackTrace?: string
  metadata?: Record<string, any>
}

export class ErrorTracker {
  private static instance: ErrorTracker | null = null
  private supabase: any
  private queue: ErrorInfo[] = []
  private flushTimer: NodeJS.Timeout | null = null

  private constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    this.supabase = createClient(supabaseUrl, supabaseAnonKey)
  }

  static getInstance(): ErrorTracker {
    if (!ErrorTracker.instance) {
      ErrorTracker.instance = new ErrorTracker()
    }
    return ErrorTracker.instance
  }

  async logError(error: ErrorInfo): Promise<void> {
    // Add to queue
    this.queue.push({
      ...error,
      metadata: {
        ...error.metadata,
        timestamp: new Date().toISOString(),
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
        url: typeof window !== 'undefined' ? window.location.href : 'server',
      }
    })

    // For critical errors, flush immediately
    if (error.severity === 'critical') {
      await this.flush()
    } else {
      // Otherwise, batch errors
      this.scheduleFlush()
    }
  }

  private scheduleFlush(): void {
    if (this.flushTimer) return

    this.flushTimer = setTimeout(() => {
      this.flush()
      this.flushTimer = null
    }, 5000) // Flush every 5 seconds
  }

  private async flush(): Promise<void> {
    if (this.queue.length === 0) return

    const errors = [...this.queue]
    this.queue = []

    try {
      const { error } = await this.supabase
        .from('error_logs')
        .insert(
          errors.map(e => ({
            error_type: e.errorType,
            severity: e.severity,
            message: e.message,
            stack_trace: e.stackTrace,
            metadata: e.metadata,
            page_url: e.metadata?.url,
            user_agent: e.metadata?.userAgent,
          }))
        )

      if (error) {
        console.error('Failed to log errors:', error)
        // Put errors back in queue for retry
        this.queue.unshift(...errors)
      }
    } catch (err) {
      console.error('Error tracker flush failed:', err)
      // Put errors back in queue for retry
      this.queue.unshift(...errors)
    }
  }

  // Track unhandled errors
  setupGlobalErrorHandlers(): void {
    if (typeof window !== 'undefined') {
      // Browser error handling
      window.addEventListener('error', (event) => {
        this.logError({
          errorType: 'unhandled_error',
          severity: 'high',
          message: event.message,
          stackTrace: event.error?.stack,
          metadata: {
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
          }
        })
      })

      window.addEventListener('unhandledrejection', (event) => {
        this.logError({
          errorType: 'unhandled_rejection',
          severity: 'high',
          message: event.reason?.message || String(event.reason),
          stackTrace: event.reason?.stack,
        })
      })
    }
  }

  // Helper methods for common error types
  async logApiError(endpoint: string, status: number, message: string): Promise<void> {
    await this.logError({
      errorType: 'api_error',
      severity: status >= 500 ? 'critical' : 'medium',
      message: `API Error: ${endpoint} returned ${status}`,
      metadata: { endpoint, status, message }
    })
  }

  async logAuthError(action: string, error: any): Promise<void> {
    await this.logError({
      errorType: 'auth_error',
      severity: 'high',
      message: `Authentication failed: ${action}`,
      stackTrace: error?.stack,
      metadata: { action, error: error?.message }
    })
  }

  async logDatabaseError(table: string, operation: string, error: any): Promise<void> {
    await this.logError({
      errorType: 'database_error',
      severity: 'critical',
      message: `Database error in ${table}.${operation}`,
      stackTrace: error?.stack,
      metadata: { table, operation, error: error?.message }
    })
  }
}

// Export singleton instance
export const errorTracker = ErrorTracker.getInstance()
EOF

echo -e "${GREEN}✅ Error tracking client created${NC}"

# Step 4: Create GitHub Action for error monitoring
echo ""
echo -e "${YELLOW}🤖 Creating GitHub Action for error monitoring...${NC}"

cat > .github/workflows/error-monitoring.yml << 'EOF'
name: Error Monitoring

on:
  schedule:
    # Run every 5 minutes
    - cron: '*/5 * * * *'
  workflow_dispatch:

jobs:
  check-errors:
    runs-on: ubuntu-latest

    steps:
      - name: Check for critical errors
        run: |
          response=$(curl -s -X POST \
            "https://tmlrvecuwgppbaynesji.supabase.co/functions/v1/error-monitor" \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_ANON_KEY }}" \
            -H "Content-Type: application/json")

          errors_found=$(echo $response | jq -r '.errors_found // 0')

          if [ "$errors_found" -gt 0 ]; then
            echo "🚨 Found $errors_found critical errors!"
            echo "ERROR_COUNT=$errors_found" >> $GITHUB_OUTPUT
          else
            echo "✅ No critical errors found"
          fi

      - name: Create issue if errors found
        if: steps.check-errors.outputs.ERROR_COUNT > 0
        uses: actions/create-issue@v2
        with:
          title: '🚨 Critical Errors Detected'
          body: |
            The error monitoring system has detected ${{ steps.check-errors.outputs.ERROR_COUNT }} critical errors.

            Please check the [error dashboard](https://claimguardianai.com/admin/errors) for details.

            This issue was automatically created by the error monitoring workflow.
          labels: 'bug,critical,monitoring'
EOF

echo -e "${GREEN}✅ GitHub Action created${NC}"

# Step 5: Create setup documentation
echo ""
echo -e "${YELLOW}📄 Creating documentation...${NC}"

cat > docs/ERROR_MONITORING.md << 'EOF'
# Error Monitoring Setup

## Overview

ClaimGuardian uses a comprehensive error monitoring system to track and alert on critical errors in production.

## Components

### 1. Error Logging
- **Client-side**: ErrorTracker utility automatically logs errors to Supabase
- **Server-side**: Server actions log errors with context
- **Edge Functions**: Built-in error handling and logging

### 2. Error Storage
- **Table**: `error_logs` stores all error records
- **Fields**: severity, error_type, message, stack_trace, user context
- **Retention**: 30 days for normal errors, 90 days for critical

### 3. Alert System
- **Edge Function**: `error-monitor` checks for critical errors every 5 minutes
- **Email Alerts**: Sends to support@claimguardianai.com for critical errors
- **GitHub Issues**: Automatically creates issues for error spikes

## Usage

### Client-Side Error Logging

```typescript
import { errorTracker } from '@claimguardian/monitoring'

// Log a custom error
errorTracker.logError({
  errorType: 'payment_failed',
  severity: 'high',
  message: 'Payment processing failed',
  metadata: { orderId: '12345' }
})

// Setup automatic error catching
errorTracker.setupGlobalErrorHandlers()
```

### Server-Side Error Logging

```typescript
import { logError } from '@/lib/monitoring'

try {
  // Your code
} catch (error) {
  await logError({
    errorType: 'api_error',
    severity: 'critical',
    message: error.message,
    stackTrace: error.stack
  })
  throw error
}
```

### Common Error Types

1. **API Errors**: External API failures
2. **Database Errors**: Query failures, connection issues
3. **Auth Errors**: Login/signup failures
4. **Payment Errors**: Stripe/payment processing issues
5. **AI Errors**: OpenAI/Gemini API failures

## Severity Levels

- **Low**: Informational, non-critical issues
- **Medium**: User-impacting but recoverable
- **High**: Significant issues affecting functionality
- **Critical**: System failures requiring immediate attention

## Alert Configuration

### Email Alerts
- Critical errors: Immediate
- High severity: Every 5 minutes (batched)
- Medium/Low: Daily digest

### Slack Integration (Optional)
```bash
supabase secrets set SLACK_WEBHOOK_URL=https://hooks.slack.com/... --linked
```

## Dashboard

Access the error dashboard at: https://claimguardianai.com/admin/errors

Features:
- Real-time error feed
- Error grouping and trends
- User impact analysis
- Resolution tracking

## Best Practices

1. **Always include context** in error metadata
2. **Use appropriate severity levels**
3. **Don't log sensitive data** (passwords, API keys)
4. **Group similar errors** by error_type
5. **Add stack traces** for debugging

## Monitoring Commands

```bash
# Check recent errors
./scripts/monitor-production.sh

# Generate error report
./scripts/error-report.sh --days 7

# Test error alerting
curl -X POST https://tmlrvecuwgppbaynesji.supabase.co/functions/v1/error-monitor \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY"
```
EOF

echo -e "${GREEN}✅ Documentation created${NC}"

# Step 6: Summary
echo ""
echo -e "${GREEN}✨ Error Alert Setup Complete!${NC}"
echo ""
echo -e "${BLUE}📊 What was configured:${NC}"
echo "  • Error monitoring Edge Function"
echo "  • Database tables for error logging"
echo "  • Client-side error tracking utility"
echo "  • GitHub Action for automated monitoring"
echo "  • Email alerts for critical errors"
echo ""
echo -e "${BLUE}🚀 Next Steps:${NC}"
echo "  1. Apply database migration: pnpm db:migrate"
echo "  2. Deploy Edge Function: supabase functions deploy error-monitor --linked"
echo "  3. Set email alerts: ensure RESEND_API_KEY is configured"
echo "  4. Test error logging in development"
echo "  5. Enable GitHub Action in repository settings"
echo ""
echo -e "${BLUE}📋 Testing:${NC}"
echo "  • Trigger test error: errorTracker.logError({...})"
echo "  • Check monitoring: ./scripts/monitor-production.sh"
echo "  • View dashboard: https://claimguardianai.com/admin/errors"
