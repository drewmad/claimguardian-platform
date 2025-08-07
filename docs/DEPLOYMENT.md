# ClaimGuardian Deployment Guide

## Overview

This guide covers the complete deployment process for the ClaimGuardian AI-first platform, from local development to production deployment on Vercel and Supabase.

## Prerequisites

### Required Accounts
- [Vercel Account](https://vercel.com) for web app hosting
- [Supabase Account](https://supabase.io) for database and Edge Functions
- [Mapbox Account](https://mapbox.com) for mapping services
- [OpenAI Account](https://openai.com) for AI services
- [Google Cloud Account](https://cloud.google.com) for Gemini API
- [Anthropic Account](https://console.anthropic.com) for Claude API
- [Stripe Account](https://stripe.com) for payments (optional)

### Development Tools
- Node.js 20+
- pnpm 10.14.0+
- Git
- Docker (for local development)
- Supabase CLI
- Vercel CLI

## Local Development Setup

### 1. Clone Repository
```bash
git clone https://github.com/your-org/claimguardian.git
cd claimguardian
```

### 2. Install Dependencies
```bash
# Install pnpm globally if not already installed
npm install -g pnpm@10.14.0

# Install all dependencies
pnpm install
```

### 3. Environment Configuration

#### Web App Environment (.env.local)
```bash
# Copy the example environment file
cp apps/web/.env.example apps/web/.env.local

# Edit with your values
cat > apps/web/.env.local << EOF
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Mapbox Configuration
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_public_token

# AI Service Configuration
OPENAI_API_KEY=your_openai_api_key
GOOGLE_API_KEY=your_google_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key

# Stripe Configuration (Optional)
STRIPE_SECRET_KEY=your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key

# Site Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3000
EOF
```

#### Supabase Edge Functions Environment
```bash
# Create Edge Functions environment
cat > supabase/.env << EOF
OPENAI_API_KEY=your_openai_api_key
GOOGLE_API_KEY=your_google_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
EOF
```

### 4. Database Setup

#### Start Local Supabase
```bash
# Initialize Supabase (first time only)
supabase init

# Start local Supabase
supabase start
```

#### Run Database Migrations
```bash
# Apply all migrations
supabase db push

# Generate TypeScript types
supabase gen types typescript --local > packages/db/src/types.ts
```

#### Seed Database (Optional)
```bash
# Run database seeding script
pnpm db:seed
```

### 5. Start Development Servers

#### Start All Services
```bash
# Start all development servers
pnpm dev
```

This will start:
- Web app: http://localhost:3000
- Mobile app: Expo development server
- Supabase Studio: http://localhost:54323

#### Individual Services
```bash
# Web app only
pnpm --filter web dev

# Mobile app only
pnpm --filter mobile dev

# Edge Functions only
supabase functions serve
```

## Production Deployment

### 1. Supabase Setup

#### Create Project
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Click "New Project"
3. Choose organization and enter project details
4. Note your project URL and API keys

#### Configure Database
```bash
# Link local project to remote
supabase link --project-ref your-project-ref

# Push schema to production
supabase db push

# Deploy Edge Functions
supabase functions deploy
```

#### Setup Storage Buckets
```sql
-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('documents', 'documents', false),
  ('images', 'images', false);

-- Setup RLS policies for storage
CREATE POLICY "Users can upload their own documents" ON storage.objects
FOR INSERT WITH CHECK (auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own documents" ON storage.objects
FOR SELECT USING (auth.uid()::text = (storage.foldername(name))[1]);
```

#### Configure Authentication
1. Go to Authentication > Settings
2. Enable Email authentication
3. Configure OAuth providers (Google, etc.)
4. Set up custom SMTP (optional)

### 2. Vercel Deployment

#### Install Vercel CLI
```bash
npm install -g vercel
```

#### Link Project
```bash
# Navigate to web app
cd apps/web

# Link to Vercel project
vercel link
```

#### Configure Environment Variables
```bash
# Add production environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add NEXT_PUBLIC_MAPBOX_TOKEN production
vercel env add OPENAI_API_KEY production
vercel env add GOOGLE_API_KEY production
vercel env add ANTHROPIC_API_KEY production
vercel env add NEXT_PUBLIC_SITE_URL production

# Or upload from file
vercel env pull .env.production
```

#### Deploy to Production
```bash
# Deploy to production
vercel --prod

# Or use GitHub integration (recommended)
git push origin main
```

### 3. Domain Configuration

#### Custom Domain Setup
1. Go to Vercel Dashboard > Project Settings > Domains
2. Add your custom domain (e.g., claimguardianai.com)
3. Configure DNS records as shown
4. Wait for SSL certificate provisioning

#### Update Environment Variables
```bash
# Update site URL to custom domain
vercel env add NEXT_PUBLIC_SITE_URL https://claimguardianai.com production
```

## Environment-Specific Configurations

### Staging Environment

#### Vercel Configuration
```bash
# Create staging branch deployment
git checkout -b staging
git push origin staging

# Configure staging environment
vercel env add NEXT_PUBLIC_SITE_URL https://staging.claimguardianai.com preview
```

#### Supabase Branch Database
```bash
# Create branch database
supabase branches create staging

# Deploy to branch
supabase functions deploy --branch staging
```

### Production Environment

#### Performance Optimization
```bash
# Build with production optimizations
NODE_ENV=production pnpm build

# Enable analytics
vercel analytics enable

# Configure monitoring
vercel monitoring enable
```

#### Security Configuration
```bash
# Enable security headers in next.config.js
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  }
];
```

## Mobile App Deployment

### iOS Deployment

#### Prerequisites
- Apple Developer Account ($99/year)
- Xcode installed on macOS
- iOS device or simulator for testing

#### EAS Build Setup
```bash
# Install EAS CLI
npm install -g eas-cli

# Configure EAS
cd apps/mobile
eas build:configure

# Create build profiles in eas.json
{
  "build": {
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "distribution": "store"
    }
  }
}
```

#### Build and Deploy
```bash
# Build for TestFlight
eas build --platform ios --profile production

# Submit to App Store
eas submit --platform ios
```

### Android Deployment

#### Prerequisites
- Google Play Developer Account ($25 one-time)
- Android Studio (optional)

#### Build and Deploy
```bash
# Build for Google Play
eas build --platform android --profile production

# Submit to Play Store
eas submit --platform android
```

## Monitoring and Maintenance

### Application Monitoring

#### Vercel Analytics
```bash
# Enable Vercel Analytics
vercel analytics enable

# View analytics dashboard
vercel analytics view
```

#### Sentry Error Tracking
```bash
# Install Sentry
pnpm add @sentry/nextjs @sentry/react

# Configure in next.config.js
const { withSentry } = require('@sentry/nextjs');

module.exports = withSentry({
  // Your existing config
});
```

### Database Monitoring

#### Supabase Metrics
- Monitor database performance in Supabase Dashboard
- Set up alerts for high CPU/memory usage
- Monitor API usage and rate limits

#### Custom Monitoring
```sql
-- Monitor query performance
SELECT query, mean_exec_time, calls, total_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Monitor database size
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Performance Monitoring

#### Lighthouse CI
```yaml
# .lighthouserc.json
{
  "ci": {
    "collect": {
      "url": ["http://localhost:3000"],
      "startServerCommand": "pnpm start"
    },
    "assert": {
      "assertions": {
        "categories:performance": ["warn", {"minScore": 0.9}],
        "categories:accessibility": ["error", {"minScore": 0.9}]
      }
    }
  }
}
```

#### Bundle Analysis
```bash
# Analyze bundle size
pnpm analyze

# Check bundle size limits
npx bundlesize
```

## Backup and Recovery

### Database Backups

#### Automated Backups
Supabase automatically creates daily backups for paid plans.

#### Manual Backups
```bash
# Create database backup
supabase db dump > backup.sql

# Restore from backup
supabase db reset
psql -h db.your-project.supabase.co -U postgres < backup.sql
```

### File Storage Backups
```bash
# Backup storage files
supabase storage download bucket_name .

# Restore storage files
supabase storage upload bucket_name ./backup_folder
```

## Troubleshooting

### Common Issues

#### Build Failures
```bash
# Clear cache and reinstall
rm -rf node_modules .next
pnpm install
pnpm build
```

#### Database Connection Issues
```bash
# Check connection
supabase status

# Restart local services
supabase stop
supabase start
```

#### Environment Variable Issues
```bash
# Verify environment variables
vercel env ls

# Pull latest environment variables
vercel env pull .env.local
```

### Support Channels
- GitHub Issues: Bug reports and feature requests
- Discord: Community support and discussions
- Documentation: Comprehensive guides and API reference
- Email: Direct support for enterprise customers

## Security Best Practices

### API Security
- Use HTTPS for all connections
- Implement rate limiting
- Validate all inputs
- Use parameterized queries
- Log security events

### Database Security
- Enable Row Level Security (RLS)
- Use least privilege access
- Regularly update dependencies
- Monitor for unauthorized access
- Encrypt sensitive data

### Infrastructure Security
- Use environment variables for secrets
- Enable two-factor authentication
- Regular security audits
- Automated dependency updates
- Secure CI/CD pipelines

This deployment guide provides comprehensive instructions for setting up and maintaining the ClaimGuardian platform across all environments. Follow these steps carefully and refer to the troubleshooting section if you encounter any issues.