# Repository Structure Guidelines

## Overview

This document defines the organizational structure and development guidelines for the ClaimGuardian repository.

## Directory Structure

```
claimguardian/
├── apps/                    # Application code
│   └── web/                 # Next.js web application
│       ├── app/             # App Router pages
│       ├── components/      # React components
│       ├── actions/         # Server actions
│       └── lib/             # Utilities and helpers
├── packages/                # Shared packages
│   ├── ui/                  # Shared UI components
│   ├── db/                  # Database types and client
│   ├── utils/               # Shared utilities
│   ├── config/              # Shared configuration
│   └── ai-config/           # AI service configurations
├── supabase/                # Database and backend
│   ├── migrations/          # Active database migrations
│   ├── functions/           # Edge functions
│   ├── sql/                 # SQL utilities and scripts
│   └── config.toml          # Supabase configuration
├── scripts/                 # Development and automation scripts
│   ├── data-import/         # Data import utilities
│   ├── database/            # Database management
│   ├── automation/          # CI/CD and automation
│   ├── analysis/            # Data analysis scripts
│   └── _archive/            # Deprecated scripts
└── docs/                    # Documentation
    ├── api/                 # API documentation
    ├── development/         # Development guides
    └── deployment/          # Deployment guides
```

## File Organization Rules

### 1. No Data Files in Repository
- Large data files (`.gdb`, `.csv`, `.shp`) should use external storage (S3, CDN)
- Use `.gitignore` to exclude data directories
- For necessary data files, use Git LFS

### 2. Script Organization
Scripts must be categorized by purpose:
- `data-import/`: ETL and data processing scripts
- `database/`: Schema management and migrations
- `automation/`: Build, test, and deployment scripts
- `analysis/`: Data analysis and reporting
- `_archive/`: Old/deprecated scripts (periodically clean)

### 3. SQL File Management
- All SQL files must be in `supabase/sql/`
- Organize by type: `schemas/`, `views/`, `functions/`
- No SQL files at repository root

### 4. Test File Location
- Unit tests: Next to source files (`*.test.ts`, `*.spec.ts`)
- Integration tests: In `__tests__/` directories
- E2E tests: In `apps/web/e2e/`

### 5. Documentation Structure
- All documentation in `/docs` directory only
- No scattered `*.md` files throughout codebase
- Exception: `README.md` at root and in major directories

## Import Guidelines

### Package Imports
```typescript
// ✅ CORRECT - Import from package root
import { Button, Card } from '@claimguardian/ui'
import { formatDate } from '@claimguardian/utils'
import { createSupabaseServerClient } from '@claimguardian/db'

// ❌ WRONG - Never import from subpaths
import { Button } from '@claimguardian/ui/button'
import { formatDate } from '@claimguardian/utils/date'
```

### File Imports
```typescript
// ✅ CORRECT - Use path aliases
import { MyComponent } from '@/components/my-component'
import { myAction } from '@/actions/my-action'

// ❌ WRONG - Avoid relative paths for cross-directory imports
import { MyComponent } from '../../../components/my-component'
```

## Naming Conventions

### Files and Directories
- Components: `kebab-case` (e.g., `claim-form.tsx`)
- Utilities: `kebab-case` (e.g., `format-date.ts`)
- Types: `kebab-case` (e.g., `database.types.ts`)
- Constants: `UPPER_SNAKE_CASE` files (e.g., `API_CONSTANTS.ts`)

### Code
- Components: `PascalCase` (e.g., `ClaimForm`)
- Functions: `camelCase` (e.g., `formatDate`)
- Constants: `UPPER_SNAKE_CASE` (e.g., `API_BASE_URL`)
- Types/Interfaces: `PascalCase` (e.g., `ClaimData`)

## Environment Variables

### Naming
- Always prefix with `NEXT_PUBLIC_` for client-side variables
- Use `UPPER_SNAKE_CASE`
- Group by service (e.g., `SUPABASE_`, `GEMINI_`, `SENTRY_`)

### Management
- Never commit `.env` files
- Use `.env.example` for documentation
- Document all variables in `README.md`

## Git Workflow

### Branch Naming
- Feature: `feature/description-of-feature`
- Bug fix: `fix/description-of-bug`
- Hotfix: `hotfix/critical-issue`
- Chore: `chore/description-of-task`

### Commit Messages
Use conventional commits:
```
type(scope): description

[optional body]

[optional footer]
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

### Pull Requests
- Link to issue/ticket
- Include description of changes
- Add screenshots for UI changes
- Ensure all checks pass

## Security Guidelines

### Never Commit
- API keys or tokens
- Passwords or secrets
- `.env` files
- Customer data
- Large binary files

### Always Do
- Use environment variables for secrets
- Validate and sanitize user input
- Use HTTPS for external requests
- Keep dependencies updated

## Performance Guidelines

### Code Splitting
- Lazy load heavy components
- Use dynamic imports for optional features
- Split vendor bundles appropriately

### Asset Optimization
- Optimize images before committing
- Use appropriate image formats (WebP, AVIF)
- Implement lazy loading for images

### Bundle Size
- Monitor bundle size in PRs
- Tree-shake unused code
- Avoid large dependencies when possible

## Maintenance Tasks

### Weekly
- Review and archive old scripts
- Check for security updates
- Clean up temporary files

### Monthly
- Audit dependencies
- Review and update documentation
- Clean up old branches

### Quarterly
- Major dependency updates
- Performance audit
- Security audit

## Monitoring and Observability

### Required for Production
- Error tracking (Sentry)
- Performance monitoring
- Uptime monitoring
- Log aggregation

### Metrics to Track
- Page load times
- API response times
- Error rates
- User engagement

## Deployment Checklist

### Before Deployment
- [ ] All tests passing
- [ ] Lint checks passing
- [ ] Type checks passing
- [ ] Environment variables configured
- [ ] Database migrations reviewed
- [ ] Performance impact assessed

### After Deployment
- [ ] Smoke tests passing
- [ ] Monitoring dashboards checked
- [ ] Error rates normal
- [ ] Performance metrics acceptable

## Contact

For questions about these guidelines:
- Create an issue in the repository
- Contact the platform team
- Refer to `CONTRIBUTING.md` for more details