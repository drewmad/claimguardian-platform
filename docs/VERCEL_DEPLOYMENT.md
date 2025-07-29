# Deploying ClaimGuardian to Vercel

## Prerequisites
- Vercel account (free tier works)
- GitHub repository connected
- Environment variables ready

## Step 1: Install Vercel CLI
```bash
npm i -g vercel
```

## Step 2: Deploy to Vercel

### Option A: Deploy via CLI
```bash
npx vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? Select your account
# - Link to existing project? No (first time)
# - Project name? claimguardian
# - Directory? ./
# - Override settings? No
```

### Option B: Deploy via GitHub Integration
1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Configure project:
   - Framework Preset: Next.js
   - Root Directory: ./
   - Build Command: `turbo build`
   - Install Command: `pnpm install --no-frozen-lockfile`

## Step 3: Configure Environment Variables

### Required Variables
Go to Project Settings → Environment Variables and add:

```bash
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=https://tmlrvecuwgppbaynesji.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[Your anon key from .env.local]
SUPABASE_SERVICE_ROLE_KEY=[Your service role key from .env.local]

# AI Features (Required for AI tools)
GEMINI_API_KEY=[Your Gemini API key]
OPENAI_API_KEY=[Your OpenAI API key]

# App URL (Update after deployment)
NEXT_PUBLIC_APP_URL=https://[your-project].vercel.app
```

### Optional Variables
```bash
# Google Maps (for address autocomplete)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=[Your Google Maps key]

# Monitoring
SENTRY_AUTH_TOKEN=[Your Sentry auth token]
NEXT_PUBLIC_SENTRY_DSN=[Your Sentry DSN]

# Feature Flags
NEXT_PUBLIC_ENABLE_AI_FEATURES=true
NEXT_PUBLIC_ENABLE_ANALYTICS=true
```

## Step 4: Configure Supabase for Production

### Update Redirect URLs
1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Add your Vercel URLs:
   - Site URL: `https://[your-project].vercel.app`
   - Redirect URLs:
     ```
     https://[your-project].vercel.app/**
     https://[your-project].vercel.app/auth/callback
     https://[your-project].vercel.app/auth/verify
     https://[your-project].vercel.app/auth/reset-password
     ```

### Enable Row Level Security
Ensure all tables have RLS enabled (already done in migrations)

## Step 5: Deploy and Test

### Initial Deployment
```bash
# Deploy to production
npx vercel --prod

# Deploy to preview (for testing)
npx vercel
```

### Post-Deployment Testing
1. **Test Signup Flow**
   - Visit `https://[your-project].vercel.app`
   - Click Sign Up
   - Complete registration
   - Check email confirmation works

2. **Test AI Features**
   - Navigate to `/ai-tools`
   - Test each AI tool
   - Verify API keys are working

3. **Check Error Monitoring**
   - If using Sentry, verify errors are being tracked
   - Check Vercel Functions logs

## Step 6: Custom Domain (Optional)

### Add Custom Domain
1. Go to Project Settings → Domains
2. Add your domain: `claimguardian.com`
3. Update DNS records as instructed
4. Update environment variables:
   ```bash
   NEXT_PUBLIC_APP_URL=https://claimguardian.com
   ```

## Troubleshooting

### Build Errors
- Check build logs in Vercel dashboard
- Common issues:
  - Missing environment variables
  - TypeScript errors (run `pnpm type-check` locally)
  - Package version conflicts

### Runtime Errors
- Check Function logs in Vercel dashboard
- Verify all environment variables are set
- Check Supabase connection

### AI Features Not Working
- Verify API keys are set correctly
- Check usage limits on AI services
- Review Edge Function logs

## Performance Optimization

### Enable Caching
Already configured in `next.config.js`:
- Static assets cached
- API routes have appropriate cache headers
- Images optimized automatically

### Monitor Performance
- Use Vercel Analytics (free tier available)
- Check Core Web Vitals
- Monitor API response times

## Continuous Deployment

### Automatic Deployments
- Every push to `main` triggers production deployment
- Pull requests create preview deployments
- Branch deployments available for testing

### Deployment Notifications
1. Go to Project Settings → Integrations
2. Add Slack/Discord notifications
3. Configure deployment status updates

## Security Checklist

- [ ] All sensitive keys in environment variables
- [ ] Supabase RLS policies active
- [ ] API routes have proper authentication
- [ ] CORS configured correctly
- [ ] Rate limiting enabled
- [ ] Security headers configured

## Monitoring Setup

### Vercel Analytics
- Automatically enabled
- Check Web Vitals dashboard
- Monitor user geography

### Error Tracking (Sentry)
- Configure alerts for critical errors
- Set up release tracking
- Monitor performance metrics

## Cost Considerations

### Vercel Free Tier Includes
- 100GB bandwidth/month
- Unlimited deployments
- SSL certificates
- Edge Functions

### Potential Costs
- Additional bandwidth: $0.15/GB
- Additional build minutes
- Team features
- Analytics Pro

## Next Steps

1. **Set up staging environment**
   ```bash
   npx vercel --prod --env=staging
   ```

2. **Configure GitHub Actions**
   - Add `.github/workflows/deploy.yml`
   - Set up automated testing before deploy

3. **Enable monitoring**
   - Set up Sentry
   - Configure uptime monitoring
   - Add performance budgets

4. **Optimize for production**
   - Enable ISR for dynamic pages
   - Configure CDN caching
   - Optimize images and fonts