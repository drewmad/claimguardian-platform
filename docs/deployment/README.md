# Deployment Documentation

This directory contains deployment guides, maintenance reports, and infrastructure documentation.

## Contents

### Maintenance Reports
- **[REPOSITORY_CLEANUP_SUMMARY.md](./REPOSITORY_CLEANUP_SUMMARY.md)** - Recent repository cleanup actions
- **[UNUSED_FILES_REPORT.md](./UNUSED_FILES_REPORT.md)** - Analysis of unused files in the codebase

### Deployment Guides

#### Vercel Deployment
The application is configured for automatic deployment on Vercel:
1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy with `pnpm install --no-frozen-lockfile`

#### Supabase Setup
See [Supabase Setup Guide](../setup/SUPABASE_SETUP.md) for detailed instructions.

## Quick Deployment Checklist

### Pre-deployment
- [ ] All tests passing (`pnpm test`)
- [ ] Type checking passes (`pnpm type-check`)
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Edge functions deployed

### Production Environment Variables
```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Recommended
NEXT_PUBLIC_SITE_URL=https://claimguardianai.com
SENTRY_AUTH_TOKEN=
NEXT_PUBLIC_SENTRY_DSN=

# AI Features
NEXT_PUBLIC_GEMINI_API_KEY=
NEXT_PUBLIC_OPENAI_API_KEY=

# Services
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
```

### Post-deployment
- [ ] Verify all pages load correctly
- [ ] Test authentication flow
- [ ] Check AI features functionality
- [ ] Monitor error tracking (Sentry)
- [ ] Verify database connections

## Deployment Scripts

```bash
# Build for production
pnpm build

# Deploy Supabase functions
supabase functions deploy --project-ref YOUR_PROJECT_REF

# Apply database migrations
supabase db push

# Generate TypeScript types
pnpm db:types
```

## Monitoring

- **Vercel Analytics** - Performance monitoring
- **Sentry** - Error tracking and performance
- **Supabase Dashboard** - Database and API monitoring
- **Custom Dashboards** - FLOIR and Parcel data monitoring

## Rollback Procedures

1. **Frontend Rollback** - Use Vercel's instant rollback feature
2. **Database Rollback** - Keep migration backups before major changes
3. **Edge Function Rollback** - Redeploy previous function version

## Security Considerations

- All secrets stored in environment variables
- Database Row Level Security (RLS) enabled
- API rate limiting implemented
- Regular security audits scheduled

## Support

For deployment issues:
- Check [Vercel Status](https://vercel-status.com/)
- Check [Supabase Status](https://status.supabase.com/)
- Contact: devops@claimguardianai.com