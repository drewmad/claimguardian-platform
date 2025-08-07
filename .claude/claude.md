# ClaimGuardian Project - Claude.md

## Project Overview

ClaimGuardian is an AI-powered insurance claim advocacy platform for Florida property owners, built with Next.js 15, Supabase, and a comprehensive monorepo architecture.

**Production Domain**: https://claimguardianai.com

## Quick Reference Links

- [Main Documentation](../CLAUDE.md) - Primary project documentation
- [Authentication System](../apps/web/src/app/auth/claude.md)
- [AI Tools System](../apps/web/src/app/ai-tools/claude.md)
- [Database Package](../packages/db/claude.md)
- [UI Package](../packages/ui/claude.md)
- [Supabase Functions](../supabase/functions/claude.md)

## Architecture Overview

### Technology Stack

- **Frontend**: Next.js 15.3.5 with App Router, TypeScript 5.8.3
- **Backend**: Supabase (PostgreSQL 17, PostgREST, GoTrue Auth)
- **AI Integration**: OpenAI GPT-4, Google Gemini via Edge Functions
- **Build System**: Turborepo 2.5.4 with pnpm 10.13.1
- **Runtime**: Node.js 24.3.0 (production)

### Monorepo Structure

```
ClaimGuardian/
├── apps/web/              # Next.js application
├── packages/              # Shared packages
│   ├── ui/                # Design system & components
│   ├── db/                # Database client & types
│   ├── utils/             # Shared utilities
│   ├── ai-services/       # AI orchestration
│   └── monitoring/        # Analytics & tracking
├── supabase/              # Backend & database
│   ├── functions/         # Edge Functions (Deno)
│   ├── migrations/        # Database migrations
│   └── schema.sql         # Source of truth schema
├── scripts/               # Development & deployment scripts
└── standards/             # Development standards & guidelines
```

## Development Workflow

### Essential Commands

```bash
# Development
pnpm dev            # Start all apps (port 3000)
pnpm build          # Build all packages
pnpm test           # Run all tests
pnpm type-check     # TypeScript validation
pnpm lint           # ESLint all packages
pnpm ci:validate    # Full validation before commit

# Database
./scripts/db.sh schema dump    # Export current schema
./scripts/db.sh schema apply   # Apply schema changes
pnpm db:generate-types         # Generate TypeScript types

# Deployment
pnpm build --filter=web        # Build web app for deployment
git add -A && git commit       # Triggers pre-commit hooks
```

### Pre-commit Workflow

1. **Dependency Check**: Validates lockfile integrity
2. **Auto-fix**: ESLint fixes applied automatically
3. **Type Check**: TypeScript validation (warns, doesn't block)
4. **Database Validation**: Checks if Supabase is running
5. **Commit**: Proceeds if all checks pass

## Critical System Patterns

### Database Access

```typescript
// ✅ Correct patterns
import { createBrowserSupabaseClient } from "@claimguardian/db";
import { createClient } from "@/lib/supabase/server";

// Client-side
const supabase = createBrowserSupabaseClient();

// Server-side (server actions)
const supabase = await createClient();
```

### Component Imports

```typescript
// ✅ Always import from package root
import { Button, Card, Input } from "@claimguardian/ui";
import { formatDate, cn } from "@claimguardian/utils";

// ❌ Never import from subpaths
import { Button } from "@claimguardian/ui/button";
```

### Authentication Flow

```typescript
// ✅ Profile creation handled by database triggers
const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: { data: { first_name, last_name } },
});
// Profile automatically created - no manual insertion needed
```

### AI Tool Integration

```typescript
// ✅ Correct AI service invocation
const { data, error } = await supabase.functions.invoke(
  "ai-document-extraction",
  {
    body: { documentData, propertyId, userId },
  },
);
```

## Common Issues & Solutions

### Build Errors

- **TypeScript**: Run `pnpm type-check` to identify issues
- **Import Errors**: Ensure imports from package roots
- **Missing Dependencies**: Run `pnpm install` in affected package

### Database Issues

- **"Database error saving new user"**: Profile creation handled by triggers
- **RLS Violations**: Check user authentication and policies
- **Schema Mismatch**: Update types with `pnpm db:generate-types`

### Authentication Problems

- **Session Loops**: Check middleware public pages configuration
- **Profile Creation**: Remove manual inserts, rely on triggers
- **Route Protection**: Use `ProtectedRoute` wrapper component

### Performance Issues

- **Bundle Size**: Check imports, use root imports only
- **Build Time**: Use Turborepo caching, selective package builds
- **Database**: Optimize queries, check indexing

## Development Standards

### Code Style

- **TypeScript**: Strict mode enabled
- **ESLint**: Auto-fix enabled in pre-commit hooks
- **Imports**: Always from package roots
- **Components**: Functional components with hooks

### Git Workflow

```bash
# Use conventional commits
pnpm cz  # Interactive commit message helper

# Or manual conventional format
git commit -m "feat: add new AI tool for damage analysis"
git commit -m "fix: resolve authentication session issues"
git commit -m "docs: update API documentation"
```

### Testing Strategy

- **Unit Tests**: Jest (web app), Vitest (packages)
- **Integration**: End-to-end user flows
- **Database**: Test with real Supabase instance
- **AI Functions**: Mock external API calls

## Environment Configuration

### Required Variables

```bash
# Supabase Core
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AI Services (Edge Functions)
OPENAI_API_KEY=your-openai-key
GEMINI_API_KEY=your-gemini-key

# Email
RESEND_API_KEY=your-resend-key
RESEND_FROM_EMAIL=noreply@claimguardianai.com

# Optional
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-maps-key
SENTRY_AUTH_TOKEN=your-sentry-token
```

### Development Setup

1. Clone repository
2. Run `pnpm install`
3. Copy `.env.example` to `.env.local`
4. Configure Supabase environment variables
5. Run `pnpm dev` to start development server

## Deployment Process

### Vercel Deployment

- **Build Command**: `turbo build`
- **Install Command**: `pnpm install --no-frozen-lockfile`
- **Output Directory**: `apps/web/.next`
- **Node Version**: 24.x

### Database Deployment

1. Apply schema changes in Supabase Dashboard
2. Export schema: `./scripts/db.sh schema dump`
3. Generate types: `pnpm db:generate-types`
4. Deploy Edge Functions: `supabase functions deploy`

## Monitoring & Analytics

### Error Tracking

- **Sentry**: Full-stack error monitoring
- **Custom Logging**: Database-backed error logs
- **Performance**: Web Vitals collection

### Analytics

- **User Behavior**: Custom event tracking
- **AI Usage**: Token consumption and costs
- **Performance**: Build times, bundle sizes

## Security Considerations

### Data Protection

- **RLS**: Row Level Security on all user data
- **Authentication**: JWT-based with automatic refresh
- **API Keys**: Stored in Supabase secrets
- **CORS**: Proper headers for Edge Functions

### Compliance

- **GDPR**: Consent tracking and data export
- **Florida Law**: Insurance regulation compliance
- **Privacy**: Minimal data collection, user control

## Getting Help

### Documentation Priority

1. This file for quick reference
2. `../CLAUDE.md` for comprehensive documentation
3. Area-specific claude.md files for detailed guidance
4. Package README files for API documentation

### Common Debugging Steps

1. Check browser console for client-side errors
2. Review server logs for API errors
3. Validate environment variables
4. Test database connectivity
5. Check Supabase dashboard for backend issues

### Support Channels

- GitHub Issues for bug reports
- Documentation for common problems
- Code comments for implementation details

## Project Status

### Recently Completed

- ✅ TypeScript error resolution
- ✅ Liquid glass design system
- ✅ AI tools consolidation (/ai-augmented → /ai-tools)
- ✅ Authentication database schema fixes
- ✅ Comprehensive claude.md documentation

### Active Development

- Performance optimization
- AI cost management
- Testing coverage expansion
- Documentation improvements

### Future Roadmap

- Mobile application
- Advanced AI features
- Multi-state expansion
- Enterprise features
