# GitHub Actions CI/CD Setup

This repository uses GitHub Actions for continuous integration and deployment. Here's what you need to configure:

## Required GitHub Secrets

Set these secrets in your GitHub repository settings (Settings → Secrets and variables → Actions):

### Core Application Secrets
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key (for migrations)

### AI API Keys
- `GEMINI_API_KEY` - Google Gemini API key (for AI features)
- `OPENAI_API_KEY` - OpenAI API key (optional, for AI features)

### Deployment Secrets (Vercel)
- `VERCEL_TOKEN` - Your Vercel API token
- `VERCEL_ORG_ID` - Your Vercel organization ID
- `VERCEL_PROJECT_ID` - Your Vercel project ID

### Monitoring & Analytics
- `SENTRY_AUTH_TOKEN` - Sentry authentication token
- `SENTRY_ORG` - Your Sentry organization slug
- `SENTRY_PROJECT` - Your Sentry project slug
- `NEXT_PUBLIC_SENTRY_DSN` - Your Sentry DSN

### Notifications (Optional)
- `SLACK_WEBHOOK` - Slack webhook URL for deployment notifications

## Workflows

### Main CI/CD Pipeline (`main.yml`)
- **Triggers**: Push to main/develop, Pull requests
- **Jobs**:
  1. Lint & Type Check
  2. Test (with coverage)
  3. Security Scan
  4. Build
  5. Database Migrations Check
  6. Performance Check
  7. Deploy Preview (PRs only)
  8. Deploy Production (main branch only)
  9. E2E Tests (after preview deploy)

### Other Workflows
- `lockfile-check.yml` - Validates pnpm lockfile integrity
- `type-check.yml` - Runs TypeScript type checking
- `lint-fix.yml` - Auto-fixes linting issues on PRs
- `database-types.yml` - Generates TypeScript types from database
- `update-database-types.yml` - Updates database types on schedule

## Setting Up Vercel

1. Install Vercel CLI: `npm i -g vercel`
2. Link your project: `vercel link`
3. Get your token: `vercel tokens create`
4. Get org and project IDs from `.vercel/project.json`

## Setting Up Sentry

1. Create a Sentry project
2. Get your DSN from Project Settings → Client Keys
3. Create an auth token: Settings → Auth Tokens
4. Note your org slug and project slug

## Local Testing

Test workflows locally with [act](https://github.com/nektos/act):

```bash
# Install act
brew install act

# Test the main workflow
act -W .github/workflows/main.yml

# Test with secrets
act -W .github/workflows/main.yml --secret-file .env.local
```

## Troubleshooting

### Common Issues

1. **Lockfile out of sync**: Run `pnpm install` locally and commit the updated lockfile
2. **Type errors**: Run `pnpm type-check` locally to see detailed errors
3. **Build failures**: Check that all environment variables are set in GitHub Secrets
4. **Vercel deployment fails**: Ensure Vercel project settings match local configuration

### Debugging Tips

- Check workflow run logs in the Actions tab
- Use `continue-on-error: true` to debug failing steps
- Add `ACTIONS_STEP_DEBUG: true` as a repository secret for verbose logs
