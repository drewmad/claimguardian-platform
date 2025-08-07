# Environment Variables Setup Guide

## Required Environment Variables for Production

### 🔐 Authentication (Supabase)
```bash
# Supabase Project Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...your-anon-key
SUPABASE_SERVICE_ROLE_KEY=eyJ...your-service-role-key

# Site Configuration
NEXT_PUBLIC_SITE_URL=https://claimguardianai.com
```

### 🗺️ MapBox Integration
```bash
# MapBox Access Token
NEXT_PUBLIC_MAPBOX_TOKEN=pk.your_mapbox_token_here
```

### 💳 Stripe Payments
```bash
# Stripe API Keys
STRIPE_SECRET_KEY=sk_live_your_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Stripe Price IDs (after creating products)
STRIPE_PRICE_HOMEOWNER=price_xxx  # $19/month
STRIPE_PRICE_LANDLORD=price_xxx   # $49/month
STRIPE_PRICE_ENTERPRISE=price_xxx # $199/month
```

### 🤖 AI Services
```bash
# OpenAI API
OPENAI_API_KEY=sk-your-openai-api-key

# Google Gemini API
GEMINI_API_KEY=your-gemini-api-key

# Anthropic Claude (if integrated)
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key
```

### 📍 Google Services
```bash
# Google Maps API (for address autocomplete)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-key
```

### 📊 Analytics & Monitoring
```bash
# Sentry Error Tracking
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
SENTRY_AUTH_TOKEN=your-sentry-auth-token
SENTRY_ORG=your-org
SENTRY_PROJECT=claimguardian

# PostHog Analytics (optional)
NEXT_PUBLIC_POSTHOG_KEY=phc_your_posthog_key
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

### 📧 Email Services (optional)
```bash
# SendGrid
SENDGRID_API_KEY=SG.your_sendgrid_key
SENDGRID_FROM_EMAIL=noreply@claimguardianai.com

# OR Resend
RESEND_API_KEY=re_your_resend_key
```

### 🔒 Security & Session
```bash
# NextAuth (if using)
NEXTAUTH_SECRET=your-random-secret-string
NEXTAUTH_URL=https://claimguardianai.com

# Rate Limiting (Redis)
REDIS_URL=redis://your-redis-url:6379
```

### 🌐 External APIs
```bash
# Weather.gov API (no key required, but set base URL)
WEATHER_API_BASE_URL=https://api.weather.gov

# FEMA API (no key required)
FEMA_API_BASE_URL=https://www.fema.gov/api/open/v2

# Florida Department of Revenue
FDOR_API_KEY=your-fdor-key-if-required
```

## Setting Environment Variables

### Local Development (.env.local)
1. Copy `.env.example` to `.env.local`
2. Fill in your development values
3. Never commit `.env.local` to Git

### Vercel Production

#### Method 1: Vercel Dashboard
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Navigate to Settings → Environment Variables
4. Add each variable with appropriate environment scope

#### Method 2: Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Add variables one by one
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add STRIPE_SECRET_KEY

# Or import from .env file
vercel env pull .env.production
```

## Environment Variable Validation

Create a validation script at `scripts/validate-env.js`:

```javascript
const required = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'NEXT_PUBLIC_SITE_URL'
];

const missing = required.filter(key => !process.env[key]);

if (missing.length > 0) {
  console.error('❌ Missing required environment variables:');
  missing.forEach(key => console.error(`  - ${key}`));
  process.exit(1);
}

console.log('✅ All required environment variables are set');
```

## Security Best Practices

### DO:
- ✅ Use different API keys for dev/staging/production
- ✅ Rotate keys periodically
- ✅ Use Vercel's environment variable UI for production
- ✅ Prefix client-side variables with `NEXT_PUBLIC_`
- ✅ Keep service keys server-side only

### DON'T:
- ❌ Commit `.env.local` or any `.env` files with real values
- ❌ Share API keys in Slack/Discord/Email
- ❌ Use production keys in development
- ❌ Expose server-side keys to the client
- ❌ Store keys in your code

## Troubleshooting

### Variable not available in app:
- Client-side: Must start with `NEXT_PUBLIC_`
- Server-side: Should NOT have `NEXT_PUBLIC_` prefix
- Restart dev server after adding variables
- Clear `.next` cache if issues persist

### Build fails on Vercel:
- Check all required variables are set in Vercel dashboard
- Verify variable names match exactly (case-sensitive)
- Check for typos in variable values
- Review build logs for specific errors

### API calls failing:
- Verify API keys are valid and not expired
- Check API key permissions/scopes
- Ensure proper domain restrictions are set
- Monitor rate limits

## Quick Setup Commands

```bash
# Verify all environment variables
node scripts/validate-env.js

# Test Stripe webhook
./scripts/verify-stripe-setup.sh

# Check Supabase connection
pnpm supabase status

# Test AI services
curl -H "Authorization: Bearer $OPENAI_API_KEY" \
  https://api.openai.com/v1/models
```

## Support

For environment-specific issues:
- Vercel: Check deployment logs
- Supabase: Dashboard → Settings → API
- Stripe: Dashboard → Developers → API keys
- MapBox: Account → Tokens