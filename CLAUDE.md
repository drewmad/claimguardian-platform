<!--
@fileMetadata
@purpose Provides guidance to AI models (specifically Claude) on working with this repository.
@owner dev-ops
@lastModifiedBy Drew Madison
@lastModifiedDate 2025-07-03T19:43:12-04:00
@status active
@notes Contains project overview, development commands, architecture details, and important patterns for AI agents.
-->
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Shared Guidelines

For general project overview, development commands, architecture, and common patterns, please refer to the [Shared AI Guidelines](./.ai-context/shared/SHARED_AI_GUIDELINES.md).

## Project-Specific Commands

### Root-level Commands
```bash
# Development
pnpm dev            # Start all apps (runs turbo dev)
pnpm setup          # Initial project setup
pnpm build          # Build all packages
pnpm test           # Run all tests
pnpm lint           # Lint all packages
pnpm type-check     # TypeScript validation
pnpm validate       # Run all checks before commit
pnpm cz             # Commit with conventional format

# Dependency Management
pnpm deps:check     # Check lockfile validity
pnpm deps:update    # Interactive dependency updates
pnpm deps:clean     # Clean and reinstall dependencies

# Git Hooks
pnpm prepare        # Setup git hooks
HUSKY=0 git commit  # Skip pre-commit hooks when necessary
```

### Web App Commands
```bash
# From apps/web/
pnpm dev            # Start Next.js dev server (port 3000)
pnpm build          # Build production bundle
pnpm start          # Start production server
pnpm lint           # ESLint with --fix
pnpm type-check     # TypeScript validation
```

## Environment Requirements

- Node.js: >=22.0.0
- pnpm: 10.12.4
- TypeScript: 5.8.3
- Next.js: 15.3.5
- React: 18.2.0

## Testing Configuration

- Testing Framework: Jest (configured in `apps/web/jest.config.mjs`)
- Test Environment: jsdom
- Module mappings configured for @/ imports
- Run specific test: `pnpm test path/to/file.test.ts`

## Package Structure

The monorepo includes these internal packages:
- `@claimguardian/ui` - Shared React components
- `@claimguardian/utils` - Shared utilities
- `@claimguardian/config` - Shared configuration
- `@claimguardian/ai-config` - AI agent configurations

## Turbo Configuration

Turborepo is configured with:
- Task pipeline: lint → type-check → build → test
- Caching enabled for all tasks
- UI mode available: `pnpm dev --ui`

## Git Hooks

Pre-commit hooks run automatically:
1. `pnpm deps:check` - Validates lockfile
2. `pnpm lint` - ESLint check
3. `pnpm type-check` - TypeScript validation

Skip with: `HUSKY=0 git commit -m "message"`

## Environment Requirements

- **Node.js**: >= 22.0.0 (enforced via engines)
- **Package Manager**: pnpm 10.12.4 (enforced)
- **TypeScript**: 5.8.3
- **Next.js**: 15.3.5
- **React**: 18.2.0

## Testing Configuration

### Jest Setup
- Configuration: `/jest.config.js`
- Test environment: `jest-environment-jsdom`
- Setup file: `apps/web/__tests__/setup.ts`
- Module mappings configured for:
  - `@/` → `apps/web/`
  - `@ui` → `packages/ui/src/index.ts`
  - `@mad/db` → `packages/db/src/index.ts` (if exists)

### Running Tests
```bash
# All tests
pnpm test

# Specific package
pnpm --filter=web test

# Watch mode
pnpm --filter=web test:watch

# Specific file
pnpm test path/to/file.test.ts
```

## Package Structure Details

### Available Packages
- **@claimguardian/ui** - React components (workspace:*)
- **@claimguardian/utils** - Shared utilities (workspace:*)
- **@claimguardian/config** - Configuration files (workspace:*)
- **@claimguardian/ai-config** - AI configuration (workspace:*)

### Import Rules Reminder
```typescript
// ✅ CORRECT - Always from package root
import { Button, Card } from '@claimguardian/ui'
import { formatDate } from '@claimguardian/utils'

// ❌ WRONG - Never from subpaths
import { Button } from '@claimguardian/ui/button'
```

## Turbo Configuration

The project uses Turborepo with the following task pipeline:
- **build**: Depends on upstream builds, includes env vars for Supabase
- **dev**: No cache, persistent mode
- **lint**: Depends on upstream lints
- **test**: Depends on upstream builds
- **type-check**: Depends on upstream builds
- **clean**: No cache

## Git Hooks (Husky)

Pre-commit hooks run automatically:
1. `pnpm deps:check` - Validates lockfile integrity
2. `pnpm lint` - ESLint checks
3. `pnpm type-check` - TypeScript validation

To skip hooks (use sparingly):
```bash
HUSKY=0 git commit -m "message"
```

## AI Assistant Instructions (Claude Specific)

### Automated Learning & Logging

**IMPORTANT**: Always log discoveries and patterns using these commands:

```bash
# Source the learning functions
source scripts/claude-learn.sh

# Log discoveries
claude_error "TypeError: Cannot read property 'x' of undefined" "Add null check" "src/components/Widget.tsx"
claude_command "pnpm fix:imports" "Automatically fixes import paths"
claude_pattern "import {Button} from '@ui/Button'" "import {Button} from '@ui'" "src/app/page.tsx"
claude_log "Discovered that TypeScript strict mode is disabled in web app"
```

Run these commands automatically when you:
1. Fix an error (use `claude_error`)
2. Discover a useful command (use `claude_command`)
3. Find a pattern that should be different (use `claude_pattern`)
4. Learn something new about the codebase (use `claude_log`)

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

## CRITICAL: Development Verification Rules (Claude Specific)

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

### Lockfile Validation

The project includes automatic lockfile validation to prevent dependency issues:
```bash
# Manual validation
pnpm deps:check

# Auto-runs in pre-commit hook
# Validates pnpm-lock.yaml hasn't been manually edited
```

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

# Important Claude-Specific Reminders

## Project Context
- This is a ClaimGuardian platform - AI-powered insurance claim advocacy for Florida property owners
- Focus on property insurance claims, not general project management
- The platform helps users navigate complex insurance processes

## Code Assistance Guidelines
- Do what has been asked; nothing more, nothing less
- NEVER create files unless they're absolutely necessary for achieving your goal
- ALWAYS prefer editing an existing file to creating a new one
- NEVER proactively create documentation files (*.md) or README files unless explicitly requested

## Package Usage Notes
- The project uses `@claimguardian/*` namespace, not `@mad/*`
- UI components are in `@claimguardian/ui`
- Utilities are in `@claimguardian/utils`
- AI configurations are in `@claimguardian/ai-config`

## Testing Reminders
- Jest is configured for testing, not Vitest
- Test files use `*.test.ts` or `*.test.tsx` pattern
- Run tests with `pnpm test` or `pnpm --filter=web test`
- Type checking is currently disabled in the web app build

## Common Gotchas
1. **Import paths**: Always use package names, never relative imports across packages
2. **Type-check disabled**: The web app has `type-check` disabled in build
3. **Node version**: Requires Node.js >= 22.0.0
4. **Husky hooks**: Pre-commit runs deps:check, lint, and type-check automatically

## ClaimGuardian-Specific Architecture

### Core Domain Models
- **Properties**: Digital twins of physical properties
- **Systems**: Home systems (HVAC, electrical, plumbing, etc.)
- **Inventory**: Items and assets within properties
- **Claims**: Insurance claim tracking and management
- **Damage Assessments**: Documentation of property damage
- **Service Records**: Maintenance and repair history

### Key Features
1. **AI Chat Integration**: Gemini-powered assistant for property management
2. **Damage Documentation**: Photo uploads and assessment tools
3. **Claim Preparation**: Automated claim package generation
4. **Florida-Specific**: Hurricane preparedness and flood zone features

### Database Schema Patterns
- Extensive use of JSONB for flexible data storage
- Comprehensive audit fields (created_at, updated_at, created_by)
- Soft deletes with is_deleted/deleted_at fields
- Row-level security ready structure

### Important Context
ClaimGuardian is focused on helping Florida residents manage property insurance claims, with special emphasis on hurricane and flood damage documentation. Keep this context in mind when implementing features or making architectural decisions.
