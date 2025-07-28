# ClaimGuardian Platform

AI-powered insurance claim advocacy platform for Florida property owners.

## Tech Stack

- Next.js 15.3.5
- TypeScript 5.8.3
- Supabase
- Turborepo
- pnpm 10.13.1

## Getting Started

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build
```

## Development Workflow

### Pre-commit Checks
The project includes automated pre-commit checks that:
- Sync lockfiles automatically
- Auto-fix common lint issues
- Validate dependencies
- Run type checks (non-blocking)

### Common Commands
```bash
# Run all validation checks
pnpm validate

# Fix lint issues
pnpm lint:fix

# Type check
pnpm type-check

# Update dependencies
pnpm deps:update
```

## Deployment

This project is configured for automatic deployment with Vercel. The deployment uses `pnpm install --no-frozen-lockfile` to handle lockfile synchronization automatically.

---

Last updated: January 28, 2025