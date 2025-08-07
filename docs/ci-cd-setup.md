# CI/CD Setup Guide

## Quick Start

1. **Set up GitHub Secrets**

   ```bash
   # Run the automated setup script
   ./scripts/setup-github-secrets.sh
   ```

2. **Verify Setup**
   - Push a commit to trigger the workflow
   - Check the Actions tab in GitHub
   - Look for green checkmarks ✅

## Manual Setup

If you prefer to set up secrets manually:

1. Go to your repository settings
2. Navigate to Settings → Secrets and variables → Actions
3. Add each secret listed in `.github/workflows/README.md`

## Environment Variables

### Required for CI/CD

```env
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AI Features (Required)
GEMINI_API_KEY=your-gemini-api-key

# Optional but Recommended
VERCEL_TOKEN=your-vercel-token
VERCEL_ORG_ID=your-org-id
VERCEL_PROJECT_ID=your-project-id
```

## Workflow Features

### Automatic Features

- ✅ Linting and type checking on every PR
- ✅ Unit tests with coverage reporting
- ✅ Security vulnerability scanning
- ✅ Bundle size analysis
- ✅ Preview deployments for PRs
- ✅ Automatic production deployment on merge to main

### Branch Protection

Enable these rules for the `main` branch:

1. Require PR reviews before merging
2. Require status checks to pass:
   - lint
   - test
   - build
   - security
3. Require branches to be up to date
4. Include administrators

## Monitoring CI/CD

### Status Badge

Add this to your README.md:

```markdown
[![CI/CD](https://github.com/YOUR_USERNAME/ClaimGuardian/actions/workflows/main.yml/badge.svg)](https://github.com/YOUR_USERNAME/ClaimGuardian/actions/workflows/main.yml)
```

### Slack Notifications

Set up the `SLACK_WEBHOOK` secret to get deployment notifications.

### Sentry Release Tracking

Configure Sentry secrets to track releases and source maps.

## Troubleshooting

### Common Issues

1. **"pnpm: command not found"**
   - The CI uses pnpm 10.13.1
   - Check `package.json` for the exact version

2. **"Type error in CI but not locally"**
   - Run `pnpm type-check` locally
   - Ensure TypeScript versions match

3. **"Build fails with missing env vars"**
   - Check all secrets are set in GitHub
   - Verify secret names match exactly

4. **"Lockfile out of sync"**
   - Run `pnpm install` locally
   - Commit the updated `pnpm-lock.yaml`

### Debug Mode

Enable debug logging by adding this secret:

- Name: `ACTIONS_STEP_DEBUG`
- Value: `true`

## Local CI Testing

Test workflows locally with act:

```bash
# Install act
brew install act # macOS
# or
curl https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash # Linux

# Test main workflow
act push -W .github/workflows/main.yml

# Test with secrets
act push -W .github/workflows/main.yml --secret-file .env.local
```

## Cost Optimization

### GitHub Actions Minutes

- Free tier: 2,000 minutes/month
- Our average workflow: ~10 minutes
- Estimated: ~200 runs/month

### Cost Saving Tips

1. Use workflow conditions to skip unnecessary jobs
2. Cache dependencies aggressively
3. Run E2E tests only on important PRs
4. Use matrix strategy for parallel testing

## Next Steps

1. ✅ Run `./scripts/setup-github-secrets.sh`
2. ✅ Create a test PR to verify setup
3. ✅ Enable branch protection rules
4. ✅ Add status badge to README
5. 📝 Configure Slack/Discord notifications (optional)
6. 📝 Set up Sentry release tracking (optional)
