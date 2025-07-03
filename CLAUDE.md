# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ClaimGuardian is a Turborepo-based monorepo for an AI-powered insurance claim advocacy platform focused on Florida property owners. The project uses Next.js 14 with TypeScript and a custom component library.

## Development Commands

All commands must be run from the repository root using pnpm:

```bash
# Install dependencies
pnpm install

# Development
pnpm dev          # Start all dev servers (Next.js on port 3000)
pnpm build        # Build all packages in dependency order
pnpm lint         # Run linting across all packages
pnpm test         # Run tests (test infrastructure not yet implemented)
pnpm type-check   # TypeScript type checking
pnpm clean        # Remove build artifacts and node_modules
```

## Architecture

### Monorepo Structure
- **apps/web**: Next.js 14 application using App Router
- **packages/ui**: Shared React component library (Button, Modal, Input, Card, etc.)
- **packages/utils**: Shared utilities (validation, formatting functions)
- **packages/config**: Shared configuration (minimal setup)

### Key Technologies
- **Build System**: Turborepo with PNPM workspaces
- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS with custom dark theme
- **Components**: Custom library built on Radix UI primitives
- **Package Manager**: PNPM 8.15.0 (enforced)

### Important Patterns

1. **Component Imports**: Always import UI components from `@claimguardian/ui`:
   ```tsx
   import { Button, Modal, Input } from '@claimguardian/ui'
   ```

2. **Internal Package References**: Use `workspace:*` protocol in package.json for internal dependencies

3. **Styling**: Use the `cn` utility from UI package for conditional classes:
   ```tsx
   import { cn } from '@claimguardian/ui'
   className={cn('base-classes', conditional && 'conditional-classes')}
   ```

4. **File Organization**:
   - Components: `apps/web/src/components/{layout|sections|modals|ui}/`
   - Hooks: `apps/web/src/hooks/`
   - Utils: `apps/web/src/utils/` (app-specific) or `packages/utils/src/` (shared)

### Turborepo Pipeline

The build pipeline (defined in `turbo.json`) ensures proper dependency ordering:
- `build` tasks run upstream dependencies first
- `dev` runs without caching for hot reload
- Environment variables prefixed with `NEXT_PUBLIC_` are included in builds

### Next.js Configuration

- Transpiles `@claimguardian/ui` package
- Optimizes `lucide-react` imports
- Uses App Router (not Pages Router)

### Current Implementation Status

**Implemented**:
- Landing page with Hero, FAQ, and service sections
- Signup/Login modals with form validation
- Dark theme with Tailwind CSS
- Basic component library

**Placeholders** (need implementation):
- Who We Fight For section
- How It Works section
- Features section
- Testimonials section
- CTA section
- API integration
- Authentication logic
- Testing infrastructure