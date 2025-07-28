<!--
@fileMetadata
@purpose Provides guidance to AI models (specifically Gemini) on working with this repository.
@owner dev-ops
@status active
@notes Contains project overview, development commands, architecture details, and important patterns for AI agents.
-->
# GEMINI.md

This file provides guidance to Gemini when working with code in this repository.

## Shared Guidelines

For general project overview, development commands, architecture, and common patterns, please refer to the [Shared AI Guidelines](./.ai-context/shared/SHARED_AI_GUIDELINES.md).

## AI Assistant Instructions (Gemini Specific)

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

## CRITICAL: Development Verification Rules (Gemini Specific)

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