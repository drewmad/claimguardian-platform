# Enterprise Multi-Tenant Architecture Guide

This guide covers ClaimGuardian's comprehensive enterprise multi-tenant architecture, providing complete data isolation, customization, and billing for enterprise customers.

## Overview

The multi-tenant architecture enables ClaimGuardian to serve multiple enterprise organizations with:

- **Complete Data Isolation**: Each organization has its own database schemas and storage
- **Flexible Subscription Tiers**: Standard, Professional, Enterprise, and Custom plans
- **Geographic Expansion**: Multi-state support with regulatory compliance
- **Customizable Branding**: Custom themes, logos, and CSS per organization
- **Advanced Security**: SSO, 2FA, IP whitelisting, and audit logging
- **Usage-Based Billing**: Automated billing with usage tracking and overages

## Architecture Components

### 1. Database Schema Design

#### Core Tables

**`enterprise_organizations`**
- Organization metadata, subscription details, and configuration
- Usage limits and current counters
- Geographic scope and compliance requirements
- Security settings (SSO, 2FA, IP restrictions)

**`organization_users`**
- User-organization relationships with role-based permissions
- Invitation and status management
- Activity tracking and audit trails

**`organization_customizations`**
- UI themes, branding, and custom CSS
- Feature configurations and limits
- Workflow customizations and integrations

**`organization_billing`**
- Monthly billing cycles and usage tracking
- Cost calculations and invoice management
- Overage tracking for resource limits

#### Tenant-Specific Schemas

Each organization gets its own PostgreSQL schema (`org_{code}`) containing:

```sql
-- Properties table for the tenant
org_demo.properties
org_demo.claims
org_demo.policies
org_demo.ai_usage_log
```

This provides complete data isolation while maintaining referential integrity.

### 2. Multi-Tenant Manager

The `TenantManager` class provides centralized tenant operations:

```typescript
import { tenantManager } from '@/lib/multi-tenant/tenant-manager'

// Get organization by subdomain/code
const org = await tenantManager.getOrganizationByCode('demo')

// Check user permissions
const canEdit = await tenantManager.userHasPermission(userId, 'properties.write')

// Execute tenant-specific query
const result = await tenantManager.executeTenantQuery('demo', 'properties', {
  select: '*',
  match: { user_id: userId },
  limit: 100
})
```

### 3. Middleware Layer

Tenant-aware middleware handles:

- **Subdomain/domain routing** (demo.claimguardian.ai → org_demo)
- **Authentication and authorization** per tenant
- **Feature access control** based on subscription tier
- **Rate limiting** with tier-specific limits
- **Security headers** and CSP policies

## Subscription Tiers

### Standard Tier
- **Limits**: 50 users, 1,000 properties, 5,000 claims, 10,000 AI requests/month
- **Features**: Basic claims management, damage analysis, document management
- **Geographic**: Single state (Florida)
- **Cost**: $99/month base + overages

### Professional Tier
- **Limits**: 100 users, 2,500 properties, 15,000 claims, 25,000 AI requests/month
- **Features**: + Advanced AI tools, inventory scanner, custom reports
- **Geographic**: Up to 3 states
- **Cost**: $299/month base + overages

### Enterprise Tier
- **Limits**: 500 users, 10,000 properties, 50,000 claims, 100,000 AI requests/month
- **Features**: + Predictive modeling, advanced analytics, SSO, custom integrations
- **Geographic**: Up to 10 states
- **Cost**: $999/month base + overages

### Custom Tier
- **Limits**: Negotiated per contract
- **Features**: All features + custom development
- **Geographic**: Nationwide
- **Cost**: Custom pricing

## Implementation Guide

### 1. Organization Setup

Create a new enterprise organization:

```typescript
import { createOrganization } from '@/actions/multi-tenant'

const result = await createOrganization({
  organizationName: 'Demo Insurance Corp',
  organizationCode: 'demo-corp',
  domain: 'demo-corp.com',
  primaryContactEmail: 'admin@demo-corp.com',
  subscriptionTier: 'enterprise',
  allowedStates: ['FL', 'GA', 'SC'],
  primaryState: 'FL'
})
```

This automatically:
- Creates the organization record
- Sets up the tenant-specific database schema
- Initializes default customizations
- Creates the owner user relationship

### 2. User Management

Add users to an organization:

```typescript
import { inviteUserToOrganization } from '@/actions/multi-tenant'

const result = await inviteUserToOrganization({
  organizationId: 'org-uuid',
  userEmail: 'user@demo-corp.com',
  role: 'manager'
})
```

Role hierarchy:
- **Owner**: Full control, billing access
- **Admin**: User management, settings, limited billing
- **Manager**: Properties, claims, user viewing
- **Member**: Properties, claims (own data)
- **Viewer**: Read-only access

### 3. Feature Access Control

Check feature access in components:

```typescript
import { useFeatureAccess } from '@/hooks/use-feature-access'

function AdvancedAnalytics() {
  const { hasAccess, subscriptionTier } = useFeatureAccess('advanced_analytics')

  if (!hasAccess) {
    return <UpgradePrompt feature="advanced_analytics" currentTier={subscriptionTier} />
  }

  return <AdvancedAnalyticsComponent />
}
```

### 4. Tenant-Specific Queries

Execute queries in tenant context:

```typescript
import { executeTenantQuery } from '@/actions/multi-tenant'

// Get properties for the user's organization
const { data, error } = await executeTenantQuery('demo-corp', 'properties', {
  select: 'id, property_name, address, value',
  match: { user_id: userId },
  order: { column: 'created_at', ascending: false },
  limit: 50
})
```

### 5. Custom Branding

Apply organization-specific theming:

```typescript
import { useOrganizationTheme } from '@/hooks/use-organization-theme'

function ThemedComponent() {
  const { theme, logoUrl, customCss } = useOrganizationTheme()

  return (
    <div style={{
      '--primary-color': theme.primaryColor,
      '--secondary-color': theme.secondaryColor
    }}>
      {logoUrl && <img src={logoUrl} alt="Organization Logo" />}
      {customCss && <style dangerouslySetInnerHTML={{ __html: customCss }} />}
      {/* Component content */}
    </div>
  )
}
```

## Security Features

### 1. Row Level Security (RLS)

All tenant data is protected by RLS policies:

```sql
-- Users can only access their organization's data
CREATE POLICY "Users can access own organization data" ON properties
  FOR ALL TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_users
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );
```

### 2. Single Sign-On (SSO)

Support for enterprise SSO providers:

```typescript
// Configure SSO for organization
await updateOrganization({
  organizationId: 'org-uuid',
  updates: {
    ssoEnabled: true,
    ssoProvider: 'okta',
    ssoConfiguration: {
      domain: 'demo-corp.okta.com',
      clientId: 'client-id',
      clientSecret: 'encrypted-secret'
    }
  }
})
```

### 3. IP Whitelisting

Restrict access to specific IP ranges:

```typescript
await updateOrganization({
  organizationId: 'org-uuid',
  updates: {
    ipWhitelist: ['192.168.1.0/24', '10.0.0.0/8']
  }
})
```

### 4. Audit Logging

All actions are automatically logged:

```typescript
// View audit log
const { data: auditLog } = await getOrganizationAuditLog('org-uuid', 100)

auditLog.forEach(entry => {
  console.log(`${entry.timestamp}: ${entry.action} on ${entry.resource_type}`)
})
```

## Billing System

### Usage Tracking

Usage is automatically tracked for all resources:

```typescript
// Track AI request usage
await tenantManager.updateOrganizationUsage(
  organizationId,
  'ai_requests',
  1 // increment by 1
)

// Check if within limits
const withinLimits = await tenantManager.checkOrganizationLimit(
  organizationId,
  'ai_requests'
)
```

### Billing Cycles

Monthly billing is automated:

1. **Usage Collection**: Aggregate usage data for the month
2. **Cost Calculation**: Apply base costs + overage rates
3. **Invoice Generation**: Create invoice with line items
4. **Payment Processing**: Integration with Stripe/payment processor

### Overage Handling

When limits are exceeded:

```typescript
const limits = {
  standard: {
    users: { base: 50, overage: 5 }, // $5 per additional user
    properties: { base: 1000, overage: 0.10 }, // $0.10 per additional property
    aiRequests: { base: 10000, overage: 0.01 } // $0.01 per additional request
  }
  // ... other tiers
}
```

## Geographic Expansion

### State-Based Configuration

Each organization can operate in specific states:

```typescript
const organization = {
  allowedStates: ['FL', 'GA', 'SC', 'NC'],
  primaryState: 'FL',
  stateConfigurations: {
    FL: {
      regulatoryRequirements: ['public_adjuster_license'],
      dataRetentionDays: 2555, // 7 years
      complianceStandards: ['FL_statute_627']
    },
    GA: {
      regulatoryRequirements: ['claims_adjuster_license'],
      dataRetentionDays: 2190, // 6 years
      complianceStandards: ['GA_code_33-7']
    }
  }
}
```

### Regulatory Compliance

Automatic compliance tracking:

- **Data retention** policies per state
- **License requirements** verification
- **Filing deadlines** monitoring
- **Regulatory reporting** automation

## Performance Optimization

### 1. Schema-Based Isolation

Each tenant's data is in a separate PostgreSQL schema, providing:
- **Query Performance**: Smaller tables, better indexes
- **Backup Isolation**: Selective backup/restore per tenant
- **Migration Safety**: Schema changes don't affect other tenants

### 2. Connection Pooling

Tenant-aware connection pooling:

```typescript
const pool = new Pool({
  host: 'db.example.com',
  database: 'claimguardian',
  searchPath: [`org_${organizationCode}`, 'public'],
  max: 20,
  idleTimeoutMillis: 30000
})
```

### 3. Caching Strategy

Multi-level caching:

```typescript
// Organization cache (15 minutes)
const orgCache = new Map<string, Organization>()

// User permissions cache (5 minutes)
const permissionCache = new Map<string, Permissions>()

// Feature flags cache (30 minutes)
const featureCache = new Map<string, FeatureFlags>()
```

### 4. Resource Monitoring

Per-tenant resource monitoring:

```sql
-- Monitor tenant resource usage
SELECT
  schema_name,
  pg_size_pretty(sum(pg_total_relation_size(schemaname||'.'||tablename::text))) as size,
  count(*) as table_count
FROM pg_tables
WHERE schemaname LIKE 'org_%'
GROUP BY schema_name
ORDER BY sum(pg_total_relation_size(schemaname||'.'||tablename::text)) DESC;
```

## Monitoring and Alerting

### Key Metrics

Monitor these tenant-specific metrics:

1. **Usage Metrics**
   - Active users per organization
   - Resource consumption (properties, claims, AI requests)
   - Storage usage and growth rates

2. **Performance Metrics**
   - Query response times per tenant
   - API request latency
   - Error rates by organization

3. **Business Metrics**
   - Monthly recurring revenue (MRR)
   - Customer acquisition cost (CAC)
   - Churn rate by subscription tier

### Alerting Rules

Set up alerts for:

```typescript
const alertRules = {
  // Usage approaching limits
  usageWarning: { threshold: 0.8, action: 'notify_admin' },
  usageCritical: { threshold: 0.95, action: 'notify_billing' },

  // Performance degradation
  slowQueries: { threshold: '5s', action: 'notify_engineering' },
  highErrorRate: { threshold: 0.05, action: 'page_oncall' },

  // Business metrics
  churnRisk: { threshold: 'no_activity_30d', action: 'notify_success' },
  paymentFailed: { action: 'suspend_after_7d' }
}
```

## Migration and Deployment

### New Tenant Onboarding

Automated onboarding process:

1. **Organization Creation**: Set up org record and schema
2. **Initial Data Load**: Sample data and configurations
3. **User Invitation**: Send invitation emails to initial users
4. **Integration Setup**: Configure webhooks and APIs
5. **Training Resources**: Provide onboarding materials

### Data Migration

Migrate from single-tenant to multi-tenant:

```sql
-- Migration script template
DO $$
DECLARE
  org_record RECORD;
BEGIN
  FOR org_record IN SELECT * FROM organizations_to_migrate
  LOOP
    -- Create tenant schema
    PERFORM create_organization_schema(org_record.org_code);

    -- Migrate data
    EXECUTE format('INSERT INTO org_%s.properties SELECT * FROM properties WHERE organization_id = %L',
      org_record.org_code, org_record.id);

    -- Update references
    -- ... migration logic
  END LOOP;
END
$$;
```

### Blue-Green Deployment

Deploy tenant changes safely:

1. **Schema Versioning**: Track schema versions per tenant
2. **Gradual Rollout**: Deploy to test tenants first
3. **Rollback Plan**: Quick rollback for failed deployments
4. **Health Checks**: Validate tenant functionality post-deployment

## API Design

### Tenant-Aware Endpoints

All API endpoints are tenant-aware:

```typescript
// Automatic tenant context from middleware
GET /api/properties → org_demo.properties (for demo.claimguardian.ai)
POST /api/claims → org_demo.claims
PUT /api/users/{id} → organization_users (with org filtering)
```

### Rate Limiting

Tier-based rate limiting:

```typescript
const rateLimits = {
  '/api/ai/*': {
    standard: '50/hour',
    professional: '200/hour',
    enterprise: '1000/hour'
  },
  '/api/properties': {
    standard: '100/minute',
    professional: '500/minute',
    enterprise: '2000/minute'
  }
}
```

### Webhook Support

Tenant-specific webhooks:

```typescript
// Configure webhooks per organization
const webhooks = {
  claimCreated: 'https://demo-corp.com/webhooks/claim-created',
  propertyUpdated: 'https://demo-corp.com/webhooks/property-updated',
  paymentFailed: 'https://demo-corp.com/webhooks/payment-failed'
}
```

## Compliance and Data Protection

### Data Residency

Ensure data stays in required regions:

```typescript
const dataResidency = {
  'us-east-1': ['US', 'CA'], // North America
  'eu-west-1': ['DE', 'FR', 'IT'], // European Union
  'ap-southeast-1': ['SG', 'MY'] // Asia Pacific
}
```

### GDPR Compliance

Automated GDPR compliance:

1. **Data Mapping**: Track personal data across all tenant schemas
2. **Consent Management**: Per-tenant consent tracking
3. **Right to be Forgotten**: Automated data deletion
4. **Data Portability**: Export user data in standard formats
5. **Breach Notification**: Automated incident reporting

### SOC 2 Compliance

Enterprise-ready security controls:

- **Access Controls**: Role-based permissions with audit trails
- **Encryption**: At-rest and in-transit encryption
- **Backup and Recovery**: Automated backups with retention policies
- **Incident Response**: Documented procedures and automation
- **Vendor Management**: Third-party security assessments

## Best Practices

### 1. Development

- **Schema First**: Design tenant schemas before application logic
- **Permission Checks**: Always verify user permissions at API boundaries
- **Resource Limits**: Implement and test all usage limits
- **Error Handling**: Provide tenant-specific error messages

### 2. Security

- **Principle of Least Privilege**: Users only get minimum required permissions
- **Defense in Depth**: Multiple security layers (middleware, RLS, application)
- **Regular Audits**: Automated security scans and manual reviews
- **Incident Response**: Clear procedures for security incidents

### 3. Performance

- **Connection Pooling**: Use tenant-aware connection pools
- **Query Optimization**: Index tenant-specific queries appropriately
- **Caching Strategy**: Cache tenant metadata and permissions
- **Resource Monitoring**: Track per-tenant resource usage

### 4. Operations

- **Monitoring**: Comprehensive metrics and alerting
- **Backup Strategy**: Tenant-specific backup and recovery procedures
- **Deployment**: Blue-green deployments with tenant-specific rollouts
- **Documentation**: Keep tenant configurations well-documented

## Troubleshooting

### Common Issues

#### 1. Tenant Context Not Found
```typescript
// Check middleware setup
const tenantContext = await extractTenantContext(request)
if (!tenantContext) {
  console.log('No tenant context found for:', request.headers.get('host'))
}
```

#### 2. Permission Denied Errors
```sql
-- Check user organization membership
SELECT ou.role, ou.status, eo.organization_name
FROM organization_users ou
JOIN enterprise_organizations eo ON ou.organization_id = eo.id
WHERE ou.user_id = 'user-id';
```

#### 3. Schema Not Found
```sql
-- Verify tenant schema exists
SELECT schema_name FROM information_schema.schemata
WHERE schema_name = 'org_demo';

-- Create if missing
SELECT create_organization_schema('demo');
```

#### 4. Feature Access Issues
```typescript
// Debug feature access
const hasAccess = checkFeatureAccess('advanced_analytics', tenantContext)
console.log('Feature access:', {
  feature: 'advanced_analytics',
  subscriptionTier: tenantContext.subscriptionTier,
  hasAccess,
  featureFlags: tenantContext.featureFlags
})
```

This comprehensive multi-tenant architecture provides a robust foundation for serving enterprise customers with complete isolation, security, and customization capabilities.
