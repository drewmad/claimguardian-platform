# Cleanup Commands Guide

This guide explains all the cleanup and CI/CD simulation commands available in ClaimGuardian.

## Quick Start

```bash
# Full cleanup (recommended)
pnpm clean:all

# Quick fix and build
pnpm clean:quick

# Just fix what you can
pnpm fix:all
```

## Available Commands

### 🧹 Clean Commands

#### `pnpm clean:all`

Runs the complete cleanup pipeline:

1. Install dependencies with lockfile
2. Fix all lint issues
3. Generate database types
4. Check TypeScript
5. Build all packages

#### `pnpm clean:quick`

Quick cleanup for development:

- Fix lint issues
- Build packages

#### `pnpm clean:deps`

Clean install dependencies:

```bash
pnpm install --frozen-lockfile
```

#### `pnpm clean:lint`

Fix all auto-fixable lint issues:

```bash
pnpm lint:fix:all
```

#### `pnpm clean:types`

Generate types and validate:

```bash
pnpm db:generate-types && pnpm type-check
```

#### `pnpm clean:build`

Build all packages:

```bash
pnpm build
```

### 🔧 Fix Commands

#### `pnpm fix:all`

Smart fix everything possible:

- Smart lint fixes
- Generate database types
- Build packages

### 🏭 CI/CD Simulation

#### `pnpm ci:local`

Run full CI/CD pipeline locally:

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm type-check
pnpm test
pnpm build
```

#### `pnpm ci:validate`

Validation only (no build):

```bash
pnpm deps:check
pnpm lint
pnpm type-check
```

### 📊 Health Check

#### `pnpm health:check`

Quick health status:

- Count lint issues
- Count type errors

### 🚀 Using the Clean Script

For more control, use the bash script directly:

```bash
# Show all options
./scripts/clean.sh help

# Run full cleanup
./scripts/clean.sh all

# Quick cleanup
./scripts/clean.sh quick

# Just fix lint
./scripts/clean.sh lint

# Check health
./scripts/clean.sh health

# Simulate CI/CD
./scripts/clean.sh ci
```

## Common Workflows

### Before Committing

```bash
pnpm clean:quick
```

### After Pulling Changes

```bash
pnpm clean:deps
pnpm db:generate-types
```

### Before Major Push

```bash
pnpm clean:all
```

### Debug Build Issues

```bash
./scripts/clean.sh health
./scripts/clean.sh validate
```

## What Each Step Fixes

1. **Dependency Clean**: Ensures exact versions match
2. **Lint Fix**: Formatting, semicolons, imports
3. **Type Generation**: Syncs database types
4. **Type Check**: Reports (doesn't fix) type errors
5. **Build**: Compiles TypeScript, generates .d.ts files

## Notes

- Type errors don't block builds in Next.js
- Some lint rules can't be auto-fixed
- Tests might fail - that's separate from cleanup
- Database types need Supabase connection
