# Deployment Instructions for ClaimGuardian Improvements

## 1. Apply Database Optimizations

### Option A: Via Supabase Dashboard (Recommended)

1. Navigate to your Supabase project dashboard
2. Go to SQL Editor
3. Copy the contents of `supabase/migrations/20240729_optimize_indexes_partitioning.sql`
4. Paste and execute the SQL
5. Monitor the execution for any errors

### Option B: Via Supabase CLI

```bash
# Link to your project (if not already linked)
supabase link --project-ref tmlrvecuwgppbaynesji

# Apply the migration
supabase db push --file supabase/migrations/20240729_optimize_indexes_partitioning.sql
```

## 2. Environment Variables Setup

Add these to your `.env.local` file:

```bash
# AI Services (Server-side only)
GEMINI_API_KEY=your_gemini_api_key
OPENAI_API_KEY=your_openai_api_key

# Monitoring
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
SENTRY_AUTH_TOKEN=your_sentry_auth_token
SENTRY_ORG=your_sentry_org
SENTRY_PROJECT=your_sentry_project

# CI/CD (GitHub Secrets)
VERCEL_TOKEN=your_vercel_token
VERCEL_ORG_ID=your_vercel_org_id
VERCEL_PROJECT_ID=your_vercel_project_id
```

## 3. GitHub Actions Setup

Add these secrets to your GitHub repository:
- Go to Settings → Secrets and variables → Actions
- Add the following repository secrets:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SENTRY_AUTH_TOKEN`
  - `NEXT_PUBLIC_SENTRY_DSN`
  - `VERCEL_TOKEN`
  - `VERCEL_ORG_ID`
  - `VERCEL_PROJECT_ID`
  - `SLACK_WEBHOOK` (optional)

## 4. Initialize Monitoring

Add to your `apps/web/src/app/layout.tsx`:

```typescript
import { initializeSentry, createPerformanceObserver } from '@claimguardian/monitoring'

// In your root layout
if (typeof window !== 'undefined') {
  initializeSentry({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN!,
    environment: process.env.NODE_ENV
  })
  
  createPerformanceObserver({
    enableResourceTiming: true,
    enableLongTasks: true,
    enableLayoutShift: true
  })
}
```

## 5. Using the New Packages

### AI Services Example

```typescript
import { getDocumentExtractor, getClaimAssistant } from '@claimguardian/ai-services'

// Document extraction
const extractor = getDocumentExtractor()
const result = await extractor.extract({
  fileUrl: 'https://storage.example.com/policy.pdf',
  fileName: 'policy.pdf'
})

// Claim assistance
const assistant = getClaimAssistant()
const guidance = await assistant.getClaimGuidance({
  userId: 'user-123',
  claimId: 'claim-456'
})
```

### Real-time Features Example

```typescript
import { useRealtimeTable, useNotifications } from '@claimguardian/realtime'
import { createClient } from '@claimguardian/db'

function ClaimsDashboard() {
  const supabase = createClient()
  
  // Real-time claims updates
  const { events, isConnected } = useRealtimeTable(supabase, 'claims', {
    onInsert: (claim) => toast.success('New claim created!'),
    onUpdate: ({ new: claim }) => toast.info(`Claim ${claim.id} updated`)
  })
  
  // User notifications
  const { notifications, unreadCount } = useNotifications(supabase, userId)
  
  return (
    <div>
      {/* Your UI */}
    </div>
  )
}
```

### Performance Monitoring Example

```typescript
import { recordMetric, trackFeatureUsage } from '@claimguardian/monitoring'

// Track custom metrics
recordMetric('claim-submission-time', 1500, {
  claimType: 'hurricane',
  success: true
})

// Track feature usage
trackFeatureUsage('ai-document-extraction', {
  documentType: 'policy',
  provider: 'gemini'
})
```

## 6. Testing

Run the test suite:

```bash
# All tests
pnpm test

# Specific package
pnpm --filter=@claimguardian/ai-services test

# With coverage
pnpm test -- --coverage
```

## 7. CI/CD Pipeline

The GitHub Actions workflow will automatically:
1. Run on push to `main` and `develop` branches
2. Run on all pull requests
3. Execute linting, type checking, and tests
4. Perform security scans
5. Deploy previews for PRs
6. Deploy to production on merge to `main`

## 8. Monitoring Dashboard

After deployment, monitor your application:
1. **Sentry**: Error tracking and performance monitoring
2. **Vercel Analytics**: Web vitals and user analytics
3. **Supabase Dashboard**: Database performance and real-time connections

## Next Steps

1. Configure alerts in Sentry for error thresholds
2. Set up Slack notifications for deployments
3. Configure database backup schedules
4. Set up monitoring dashboards for key metrics