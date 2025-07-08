<!--
@fileMetadata
@purpose Provides shared guidance for all AI models working with this repository.
@owner dev-ops
@status active
@notes Contains common project overview, development commands, architecture details, and important patterns for AI agents.
-->
# Shared AI Guidelines

This file provides common guidance for all AI models working with code in this repository.

## Project Overview

ClaimGuardian is a Turborepo-based monorepo for an AI-powered insurance claim advocacy platform focused on Florida property owners. The project uses Next.js 15.3.5 with TypeScript and a custom component library.

## Quick Start

This is a pnpm workspace monorepo using Turborepo. Always use `pnpm` commands, never npm or yarn.

```bash
# Initial setup
pnpm install
cp .env.example .env.local  # Configure environment variables

# Development
pnpm dev                    # Start all apps
pnpm dev --filter= @apps/web/** # Start only web app

# Before committing
pnpm validate              # Run all checks
pnpm cz                    # Commit with conventional format
```

## Monorepo Commands

### Development

```bash
pnpm dev              # Start all apps in development mode
pnpm dev --filter= @apps/web/**  # Start only the web app
pnpm setup            # Initial project setup
```

### Building & Testing

```bash
pnpm build            # Build all packages with Turborepo
pnpm build:ci         # Optimized CI build
pnpm test             # Run all tests (vitest + e2e)
pnpm test:unit        # Run unit tests only
pnpm e2e              # Run Playwright tests
pnpm e2e:headed       # Run Playwright tests with browser UI
pnpm typecheck        # TypeScript validation across all packages
```

### Code Quality

```bash
pnpm lint             # ESLint all packages
pnpm lint:ci          # ESLint without caching (for CI)
pnpm format           # Prettier format all files
pnpm validate         # Run all validation checks before commit
pnpm validate:deploy  # Validate before deployment
pnpm validate:imports # Check for import issues
pnpm fix:imports      # Automatically fix @apps/web/src/types/ui.d.ts and @mad/db imports
pnpm cz               # Commit with conventional commit format
```

### Package-Specific Testing

```bash
# Run tests for a specific package
pnpm --filter= @apps/web/** test
pnpm --filter= @mad/db test
```

## Critical Monorepo Import Rules

ALWAYS import from package root:
```typescript
// ✅ CORRECT
import { Button, Card } from ' @ui'
import { db, User } from ' @mad/db'
import { ActivityType } from ' @types'

// ❌ WRONG - Never import from subpaths
import { Button } from ' @ui/Button'
import { db } from ' @mad/db/client'
import { ActivityType } from ' @types/activity'
```

## Architecture Overview

### Package Structure

- **/apps/web** - Next.js 15.3.5 application with App Router
- **/apps/docs** - Storybook documentation
- **/packages/ui** - Shared React components (transpiled by Next.js)
- **/packages/db** - Database models and Supabase client (built to dist/)
- **/packages/types** - Shared TypeScript types
- **/packages/sidecar-submenu** - VS Code extension

### Key Architectural Patterns

1.  **Data Flow**: User → Server Action → Supabase → Server Action → UI
2.  **State Management**:
    -   Server state: Server Actions + React Query
    -   Client state: React Context for global UI state
    -   Local state: useState for component-specific state
3.  **File Organization in apps/web**:
    -   `actions/`     # Server actions (business logic)
    -   `components/`  # UI components
    -   `app/`         # App Router pages
    -   `lib/`         # Utilities and helpers
    -   `hooks/`       # Custom React hooks
    -   `contexts/`    # React contexts
    -   `services/`    # External service integrations
4.  **Authentication Pattern**:
    -   Supabase Auth with Google OAuth
    -   Server-side session validation
    -   Middleware for protected routes
    -   Token refresh handled automatically
5.  **Database Access Pattern**:
    -   Always use Server Actions for mutations
    -   Direct Supabase queries only in server components
    -   RLS policies enforce security
    -   Types generated from database schema

## TypeScript Path Configuration

When working in apps/web, these path mappings are configured:
- `@apps/web/package.json` → Internal app imports
- `@apps/web/src/types/ui.d.ts` → UI package exports
- `@mad/db` → Database package exports
- `@types` → Shared types
- `@.env.example` → Environment configuration

## Adding New Components

1.  Create component: `packages/ui/src/NewComponent.tsx`
2.  Export from index: Add to `packages/ui/src/index.ts`
3.  Import in app: `import { NewComponent } from ' @ui'`

## Environment Variables

Required for development:
```
# Supabase (Required)
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Next.js (Required)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
BASE_URL=http://localhost:3000

# Google OAuth (Optional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# AI Features (Optional)
GEMINI_API_KEY=
```
Check `.env.example` for the full list.

## Common Development Tasks

### Fix import errors:
```bash
pnpm fix:imports
```

### Update dependencies:
```bash
pnpm update --interactive --recursive
```

### Create new package:
1.  Create folder under `packages/` or `apps/`
2.  Add `package.json` with workspace dependencies using `workspace:*`
3.  Update root `package.json` if needed
4.  Add to `transpilePackages` in Next.js config if it's a UI package

### Run specific commands:
```bash
# Run command in specific package
pnpm --filter= @apps/web/** <command>
pnpm --filter= @mad/db <command>

# Run tests for changed files only
pnpm test -- --changed

# Debug build issues
pnpm build --no-cache
```

## Testing Strategy

### Unit Tests (Vitest):
-   Test files alongside code (`*.test.ts`, `*.test.tsx`)
-   Use React Testing Library for components
-   Mock Supabase interactions
-   Run specific test: `pnpm test path/to/file.test.ts`

### E2E Tests (Playwright):
-   Tests in `tests/e2e/` and `apps/web/__tests__/e2e/`
-   Runs on `http://localhost:3000`
-   Chromium-only configuration
-   Run specific test: `pnpm e2e path/to/test.spec.ts`

## Database Migrations

### Creating Migrations:
```bash
# Create a new migration file
supabase migration new <descriptive_name>

# Apply migrations locally
supabase db push

# Generate TypeScript types after schema changes
pnpm db:generate-types
```

### Migration Guidelines:
-   Follow naming convention: `YYYYMMDDHHMMSS_descriptive_name.sql`
-   Always include both up and down migrations
-   Test migrations locally before committing
-   Include RLS policies in migration files
-   See `docs/database-migration-workflow.md` for detailed workflow

## Deployment & CI/CD

### Vercel Configuration:
-   Build command: `cd ../.. && pnpm build --filter= @apps/web/**`
-   Install command: `pnpm install --frozen-lockfile --prefer-offline`
-   Cron job: Gmail sync runs hourly

### GitHub Actions:
-   Runs on all PRs: lint, typecheck, tests
-   Database migrations validated against schema
-   Deployment preview on each PR

### Troubleshooting Deployment:
-   ESLint is disabled during production builds
-   Ensure all environment variables are set in Vercel
-   Check Turborepo cache if builds are failing

## Common Pitfalls & Solutions

### Import Errors:
```bash
# DO: Use the fix script
pnpm fix:imports

# DON'T: Manually edit imports one by one
```

### Package Not Found:
```bash
# DO: Check if package is in transpilePackages (Next.js config)
# DO: Ensure package exports from its index.ts

# DON'T: Import from package subpaths
```

### Type Errors:
```bash
# DO: Run typecheck before committing
pnpm typecheck

# DON'T: Use 'any' type to bypass errors
```

## Project Implementation Priority

1.  Phase 1: Core Features - Project management, task tracking, time tracking
2.  Phase 2: Integrations - Google Calendar, Gmail sync
3.  Phase 3: Advanced - Invoicing, analytics, file management
4.  Phase 4: Enterprise - Team collaboration, advanced reporting

## Important Notes

-   This is a pnpm workspace - always use pnpm not npm or yarn
-   Packages use `workspace:*` protocol for internal dependencies
-   UI packages are transpiled by Next.js, not pre-built
-   Run commands from root directory unless targeting specific packages
-   All commits should follow conventional commit format (use `pnpm cz`)
-   Never commit sensitive information (API keys, tokens)
-   Always validate before pushing: `pnpm validate`

## AI Assistant Instructions

When implementing features:
1.  Always check existing patterns in the codebase first
2.  Follow the established file organization structure
3.  Use Server Actions for data mutations
4.  Implement proper error handling with try-catch blocks
5.  Add loading states for better UX
6.  Use TypeScript strictly - no any types
7.  Follow the component composition patterns from existing code
8.  Test your changes with `pnpm test` and `pnpm typecheck`
9.  Use the established import patterns - never import from subpaths
10. Check for existing utilities before creating new ones

## CRITICAL: Development Verification Rules

### 1. Function Signatures
**NEVER** change a function call without first:
-   Reading the actual function definition
-   Checking all parameters and their types
-   Verifying the return type

Example workflow:
```bash
# Before changing getTasks(undefined, workspaceId)
# First check: grep -n "function getTasks" or read the file
# Verify the actual signature before making changes
```

### 2. Type Definitions

**NEVER** assume types without checking:
-   Always read the actual type definitions from `@mad/db`
-   Check Supabase query return types before assertions
-   Use proper type imports rather than inline definitions

Example workflow:
```bash
# Before assuming a type
# Check: find . -name "*.ts" -type f | xargs grep -l "type TaskRow"
# Or read the database types directly
```

### 3. Component Interfaces

**NEVER** change component props without verifying:
-   Check the component's actual prop types
-   Verify available variants/options
-   Look for existing usage patterns

Example workflow:
```bash
# Before using variant="outline"
# Check: grep -r "variant=" --include="*.tsx" | grep Button
# See what variants are actually used
```

### 4. Import Patterns

**ALWAYS** check existing import patterns:
-   Look at neighboring files for import style
-   Check if imports are from package root or subpaths
-   Verify the package exports

### 5. Before Making Changes

#### A. Search First

```bash
# Search for existing patterns
grep -r "pattern" --include="*.ts" --include="*.tsx"

# Find type definitions
find . -name "*.d.ts" -o -name "types.ts" | xargs grep "TypeName"

# Check function signatures
grep -A5 -B5 "function functionName"
```

#### B. Read Dependencies

-   Always check `package.json` for available dependencies
-   Don't assume a package exists
-   Check the actual version and its API

#### C. Test Assumptions

```bash
# Run type checking on specific files before committing
pnpm tsc --noEmit path/to/file.ts

# Run linting on specific files
pnpm eslint path/to/file.ts
```

### 6. Git Operations

**ALWAYS** check git status after operations:
-   Verify no duplicate files are created
-   Check for unintended changes
-   Review the full diff before committing

### 7. Type Safety Rules

#### Never Use `any`

Instead of:
```typescript
const data = result as any;
```

Do:
```typescript
// First, check the actual type
const data = result as unknown;
// Then assert to the verified type
const typedData = data as VerifiedType;
```

#### Always Handle Union Types

Instead of:
```typescript
data.property.value // Assuming it exists
```

Do:
```typescript
// Check if it's an array or object first
if (Array.isArray(data.property)) {
  data.property[0]?.value
} else {
  data.property?.value
}
```

### 8. Development Workflow

1.  **Understand Before Changing**
    -   Read the existing code thoroughly
    -   Check related files for patterns
    -   Verify all assumptions
2.  **Make Incremental Changes**
    -   Change one thing at a time
    -   Run type checking after each change
    -   Commit working states frequently
3.  **Verify Changes**
    -   Run `pnpm typecheck` after changes
    -   Run `pnpm lint` to catch issues
    -   Check `git diff` carefully
4.  **Document Assumptions**
    -   Comment why you're making specific type assertions
    -   Note any discovered patterns for future reference

## Common Patterns in This Codebase

### Server Actions

-   All use object parameters, not positional
-   Return `{ data/result, error }` pattern
-   Require proper error handling

### Supabase Queries

-   Joins can return arrays OR single objects
-   Always handle both cases
-   Check RLS policies affect on returns

### Component Libraries

-   `@apps/web/src/types/ui.d.ts` components have specific, limited variants
-   Always import from package root, not subpaths
-   Check existing usage for patterns

## Verification Commands

```bash
# Check function signature
ast-grep --pattern 'function $FUNC($_) { $$$ }'

# Find all usages of a function
grep -r "functionName(" --include="*.ts" --include="*.tsx"

# Check type definitions
find . -name "*.d.ts" -exec grep -l "TypeName" {} \;

# Verify imports
grep -r "from ' @ui" --include="*.tsx" | sort | uniq
```

## Remember

-   Never assume - always verify
-   Read first - change second
-   Test incrementally - catch errors early
-   Check patterns - follow existing conventions

## Git and File Management

### Duplicate File Prevention

```bash
# Check for duplicates before committing
find . -name "*[0-9].tsx" -o -name "*[0-9].ts" | grep -E "[0-9]\.(ts|tsx)$"

# Clean up duplicates
git clean -fd  # Remove untracked files
```

### Git Operations

-   Always check `git status` after file moves
-   Use `HUSKY=0` sparingly and only after understanding what's being skipped
-   Make atomic commits - don't mix cleanup with features

## Next.js Specific Rules

### Server Actions (`'use server'`)

-   ALL exports must be async functions
-   No helper functions, constants, or synchronous exports
-   Helper functions go in `lib/_utils/` instead

### File Organization

-   `actions/`          # Server actions only (all async)
-   `lib/`
    -   `_utils/`        # Pure utility functions
    -   `*.ts`           # Client utilities
-   `components/`      # React components

## Error Resolution Pattern

1.  Read the FULL error message including stack traces
2.  Check import traces in build errors
3.  Verify actual code - don't assume
4.  Make minimal targeted fixes
5.  Test with `pnpm typecheck` before committing
