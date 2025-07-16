# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ClaimGuardian is an AI-powered insurance claim advocacy platform for Florida property owners built with:
- Next.js 15.3.5 (App Router)
- TypeScript 5.8.3
- Turborepo monorepo structure
- Supabase for backend
- pnpm 10.12.4 package manager

## Essential Commands

### Development
```bash
pnpm dev            # Start all apps (port 3000)
pnpm build          # Build all packages
pnpm test           # Run all tests (Jest)
pnpm lint           # ESLint all packages
pnpm type-check     # TypeScript validation
```

### Dependency Management
```bash
pnpm deps:check     # Validate lockfile integrity
pnpm deps:update    # Update dependencies interactively
pnpm deps:clean     # Clean reinstall all dependencies
```

### Git Operations
```bash
HUSKY=0 git commit  # Skip pre-commit hooks (use sparingly)
pnpm prepare        # Setup git hooks
```

### Testing
```bash
pnpm test                          # All tests
pnpm --filter=web test             # Web app tests only
pnpm --filter=web test:watch       # Watch mode
pnpm test path/to/file.test.ts     # Specific test file
```

## Architecture & Code Patterns

### Monorepo Structure
```
/apps/web           # Next.js application
/packages/ui        # Shared React components
/packages/utils     # Shared utilities
/packages/config    # Shared configuration
/packages/ai-config # AI configurations
```

### Import Rules
```typescript
// ✅ CORRECT - Always from package root
import { Button, Card } from '@claimguardian/ui'
import { formatDate } from '@claimguardian/utils'

// ❌ WRONG - Never from subpaths
import { Button } from '@claimguardian/ui/button'
```

### File Organization (apps/web)
```
/actions/           # Server actions ('use server' - async only)
/lib/               # Client utilities
  /_utils/          # Pure utility functions
/components/        # React components
/app/               # App Router pages
  /ai-tools/        # AI feature pages
  /ai-augmented/    # Legacy AI pages
```

### Server Actions Pattern
```typescript
// All server actions use object parameters
export async function createClaim({ 
  propertyId, 
  damageType 
}: CreateClaimParams) {
  try {
    // Implementation
    return { data: result, error: null }
  } catch (error) {
    return { data: null, error: error.message }
  }
}
```

### Component Patterns
- Components from `@claimguardian/ui` export from root index
- Use `CardContent, CardHeader` from local components when not in UI package
- Dark theme: bg-gray-800 cards with border-gray-700
- Consistent spacing: p-6 for page containers

## AI Features Architecture

### Main AI Tools Hub
- `/ai-tools/` - Central hub for all AI features
- Status indicators for API key availability
- Categories: analysis, assistance, documentation, communication

### AI Tools Pages
1. **Damage Analyzer** (`/ai-augmented/damage-analyzer/`)
   - Camera capture integration
   - Image upload with AI analysis
   
2. **Policy Chat** (`/ai-augmented/policy-chat/`)
   - PDF parsing
   - Gemini integration

3. **Claim Assistant** (`/ai-tools/claim-assistant/`)
   - Step-by-step guidance
   - Progress tracking

4. **Document Generator** (`/ai-tools/document-generator/`)
   - Template-based generation
   - AI content assistance

5. **Communication Helper** (`/ai-tools/communication-helper/`)
   - Email/message templates
   - Tone selection

6. **Settlement Analyzer** (`/ai-tools/settlement-analyzer/`)
   - Offer analysis
   - Market comparisons

7. **Evidence Organizer** (`/ai-tools/evidence-organizer/`)
   - Drag-and-drop upload
   - Auto-categorization

8. **3D Model Generator** (`/ai-augmented/3d-model-generator/`)
   - Photogrammetry simulation
   - Multi-image processing

### Camera Integration
- `CameraCapture` component for vision features
- Handles permissions and stream management
- Supports front/back camera switching

## Environment Variables

Required for development:
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# AI Features (Optional)
NEXT_PUBLIC_GEMINI_API_KEY=
NEXT_PUBLIC_OPENAI_API_KEY=
```

## Common Issues & Solutions

### Build Errors
- Type-check is disabled in web app build
- Tests may have type errors but build succeeds
- Use `HUSKY=0` to bypass pre-commit if build passes but lint has warnings

### Import Issues
- Always import UI components from `@claimguardian/ui` root
- Local components for CardContent, CardHeader when needed
- Check `packages/ui/src/index.tsx` for available exports

### Missing Components
- Create in local `components/ui/` first if not in UI package
- Follow existing patterns (e.g., Label component)

## Development Workflow

1. **Before Making Changes**
   - Check existing patterns in similar files
   - Verify function signatures before modifying calls
   - Read actual type definitions, don't assume

2. **During Development**
   - Make incremental changes
   - Run `pnpm type-check` frequently
   - Test with `pnpm dev` to see changes

3. **Before Committing**
   - Run `pnpm lint` and fix issues
   - Ensure `pnpm build` succeeds
   - Use `HUSKY=0` only if build passes but lint has minor warnings

## Domain Context

ClaimGuardian helps Florida property owners with insurance claims:
- **Properties**: Digital twins of physical properties
- **Claims**: Insurance claim tracking
- **Damage Assessments**: Photo documentation
- **AI Tools**: Automated assistance for claim processes

Focus areas:
- Hurricane and flood damage documentation
- Florida-specific insurance regulations
- Property damage assessment and documentation
- Claims negotiation support

## Supabase Connection

- Always connect to supabase with supabase login --token "$SUPABASE_ACCESS_TOKEN" and link to project tmlrvecuwgppbaynesji