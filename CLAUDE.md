# CLAUDE.md - ClaimGuardian Development Guide

**Mission:** AI-first insurance claim advocacy platform for Florida property owners. Live at https://claimguardianai.com

**Quick Start:** `pnpm dev` → `pnpm type-check` → `pnpm build`

## 🧠 Claude Learning System - USE FIRST

**CRITICAL**: Use learning system for ALL significant tasks

### **Preferred Method - Complete Learning System:**
```typescript
import { withCompleteLearning } from '@/lib/claude/claude-complete-learning-system'
const result = await withCompleteLearning(
  'code-generation', 'Create component', 'Build UI', 'User request',
  { filePath: 'src/file.tsx', codeLanguage: 'typescript' },
  async () => { /* your work */ }
)()
```

### **Manual Learning Workflow:**

**BEFORE every major task:**
1. Query learning context: `claudeLearningContext.analyzeTask(context)`
2. Review recommendations and warnings
3. Apply suggested approaches from previous learnings

**DURING task execution:**
1. Log errors with full context using `claudeErrorHelpers`
2. Use appropriate helper functions for task type

**AFTER task completion/error resolution:**
1. Mark errors as resolved with `claudeErrorLogger.resolveError()`
2. Record lessons learned for future improvement

### **Key Integration Points:**
```typescript
// Error logging
import { claudeErrorHelpers, claudeErrorLogger } from '@/lib/claude/claude-error-logger'

// Pre-task analysis
import { claudeLearningContext, withLearningContext } from '@/lib/claude/claude-learning-context'

// Self-reflection
import { claudeSelfReflection } from '@/lib/claude/claude-self-reflection'
```

### **Required Usage Patterns**

**1. Code Generation Tasks:**
```typescript
// BEFORE: Check for learnings
const analysis = await claudeLearningContext.analyzeTask({
  taskType: 'code-generation',
  description: 'Create React component',
  codeLanguage: 'typescript',
  framework: 'react',
  tools: ['Write', 'Edit'],
  userIntent: 'Build functional component'
})

// Log recommendations
if (analysis.recommendations.length > 0) {
  console.log('🧠 Applying previous learnings:')
  analysis.recommendations.forEach(r => console.log(`- ${r.summary}`))
}

// DURING: If error occurs
try {
  // Code generation
} catch (error) {
  await claudeErrorHelpers.codeGeneration.syntaxError(
    error, filePath, 'typescript', taskDescription
  )
}
```

**2. File Modification Tasks:**
```typescript
// BEFORE: Always check context
const analysis = await claudeLearningContext.analyzeTask({
  taskType: 'file-modification',
  description: 'Edit component props',
  filePath: 'src/components/MyComponent.tsx',
  tools: ['Read', 'Edit'],
  userIntent: 'Fix prop types'
})

// DURING: Log edit failures
try {
  // File editing
} catch (error) {
  await claudeErrorHelpers.fileModification.editError(
    error, filePath, taskDescription, ['Read', 'Edit']
  )
}
```

**3. Analysis Tasks:**
```typescript
// Log analysis mistakes
await claudeErrorHelpers.analysis.misunderstanding(
  'Analyze user requirements',
  'Build correct solution',
  'assumption-based-error'
)
```

### **Error Resolution Protocol:**
```typescript
await claudeErrorLogger.resolveError(
  errorId,
  'Specific solution that worked',
  'General lesson learned for future tasks'
)
```

### **🔍 Self-Reflection System - AUTOMATIC IMPROVEMENT**

Claude has advanced self-reflection capabilities that automatically analyze approach efficiency:

**Core Self-Reflection Features:**
- **Efficiency Metrics**: Execution time, tool usage, error rates, resource utilization
- **Approach Analysis**: Identifies inefficiencies, better approaches, wasted steps
- **Learning Insights**: Extracts patterns, confirms/challenges assumptions
- **Automatic Triggers**: Reflects when errors > 2, time > 5min, tools > 5, etc.
- **Meta Learning**: Learns about learning - how to improve improvement

**Required Integration:**
```typescript
// METHOD 1: Complete Learning System (RECOMMENDED)
import { withCompleteLearning } from '@/lib/claude/claude-complete-learning-system'

const smartFunction = withCompleteLearning(
  'code-generation',
  'Create React component',
  'Build functional component',
  'User wants new component',
  { filePath: 'src/components/MyComponent.tsx', codeLanguage: 'typescript' },
  async () => {
    // Your code here
  }
)

// METHOD 2: Manual Reflection
import { claudeSelfReflection } from '@/lib/claude/claude-self-reflection'

const taskId = claudeSelfReflection.startReflection(
  'code-generation',
  'Create component',
  'Build UI',
  'User request',
  'Standard React approach'
)

// ... do work, log steps and errors ...

await claudeSelfReflection.completeReflection(true, 'excellent', 'high')

// METHOD 3: Auto-Reflection Triggers
import { autoReflect } from '@/lib/claude/claude-reflection-triggers'

const autoFunction = autoReflect('debugging', 'complex', originalFunction)
```

**Automatic Reflection Triggers:**
- High error rate (>2 errors)
- Long execution time (>5 minutes)  
- Many tools used (>5 tools)
- Complex task failures
- Excessive file access (>10 files)
- Successful but inefficient tasks

### **Learning Database Schema**

The system uses these database tables (already deployed):
- `claude_errors` - All Claude errors with full context
- `claude_learnings` - Learned patterns and solutions

### **Quick Commands**

```typescript
// Check recent learnings before any task
const learnings = await claudeErrorLogger.getRelevantLearnings({
  taskType: 'code-generation',
  codeLanguage: 'typescript'
})

// Get error patterns to understand common mistakes
const patterns = await claudeErrorLogger.getErrorPatterns('week')

// Wrap functions with automatic learning context
const smartFunction = withLearningContext(taskContext, originalFunction)
```

### **Dashboard Access**

Admin can monitor Claude's learning progress at:
```typescript
import { ClaudeLearningDashboard } from '@/components/admin/claude-learning-dashboard'
```

**Learning Categories**: Task types (code-generation, file-modification, debugging, analysis), Error types (syntax, logic, type, runtime), Severity (low, medium, high, critical)

## File Metadata Standard

**Required for all new files:**
```typescript
/**
 * @fileMetadata
 * @owner @ai-team
 * @purpose "Brief description of file purpose"
 * @dependencies ["package1", "package2"]
 * @status stable
 * @ai-integration multi-provider
 * @insurance-context claims
 * @supabase-integration edge-functions
 */
```

**Key Tags**: `@owner`, `@purpose`, `@dependencies`, `@status`, `@ai-integration`, `@insurance-context`, `@florida-specific`, `@supabase-integration`

**Commands**: `pnpm metadata:audit`, `pnpm metadata:generate`, `pnpm metadata:validate`

## User Preferences for AI Assistant

**Holistic Solution Approach**: 
- Stack multiple improvements together - don't provide single solutions, combine optimizations
- Consider the entire workflow, not just immediate issues  
- Layer optimizations: speed + parallelization + monitoring + verification
- Include automation scripts, progress tracking, and error handling
- Build in resilience with recovery options and clear status reporting

## Core Technology Stack

| Component | Technology | Version |
|-----------|------------|----------|
| **Runtime** | Node.js | 24.3.0 |
| **Frontend** | Next.js (App Router) | 15.3.5 |
| **Language** | TypeScript | 5.8.3 |
| **Database** | Supabase (PostgreSQL + PostGIS) | 17.4.1.064 |
| **AI** | OpenAI, Google Generative AI | 4.73.0, 0.24.1 |
| **Build** | Turborepo + pnpm | 2.5.4, 10.13.1 |

## Essential Commands

**Development:**
```bash
pnpm dev                    # Start dev server
pnpm build                  # Build all packages
pnpm type-check            # TypeScript validation
pnpm lint                  # ESLint with auto-fix
pnpm test                  # Run all tests
```

**Database:**
```bash
./scripts/db.sh schema dump    # Export schema
./scripts/db.sh schema apply   # Apply changes
pnpm db:generate-types        # Generate TS types
```

**Data Management:**
```bash
./scripts/data.sh import      # Parallel data import
./scripts/data.sh verify      # Verify completion
```

**Testing:**
```bash
pnpm test                     # All tests (Vitest)
pnpm --filter=web test        # Web app tests (Jest)
pnpm --filter=web test:watch  # Watch mode
pnpm --filter=ai-services test # AI services tests
pnpm test path/to/file.test.ts # Specific test file
```

### Extended Development Commands

**Dependency Management:**
```bash
pnpm deps:check               # Validate lockfile integrity
pnpm deps:update              # Update dependencies interactively
pnpm deps:clean               # Clean reinstall all dependencies
pnpm clean:all                # Complete cleanup and rebuild
```

**Git Operations:**
```bash
pnpm cz                       # Commit with conventional format
HUSKY=0 git commit            # Skip pre-commit hooks (use sparingly)
pnpm prepare                  # Setup git hooks
pnpm lint:smart-fix           # Auto-fix lint issues before commit
pnpm pre-commit:test          # Test pre-commit hooks manually
```

**File Metadata Management:**
```bash
pnpm metadata:audit           # Audit metadata coverage across codebase
pnpm metadata:generate        # Generate metadata templates for missing files
pnpm metadata:validate        # Validate metadata format and required fields
pnpm metadata:sync-deps       # Update dependency lists automatically
pnpm metadata:report          # Generate metadata coverage report
```

## Repository Structure

```
ClaimGuardian/
├── apps/web/              # Next.js application
├── packages/              # Shared packages (ui, utils, db, ai-services)
├── supabase/              # Database & backend (schema.sql is source of truth)
├── scripts/               # Core automation scripts
└── data/                  # Florida-specific datasets
```

## Domain Context

ClaimGuardian helps Florida property owners with insurance claims:
- **Properties**: Digital twins of physical properties with AI analysis
- **Claims**: Insurance claim tracking and optimization
- **AI Tools**: Damage analysis, document processing, policy chat
- **Florida-specific**: Hurricane/flood damage, state regulations

## Data Processing Pipeline

**Florida-Specific Data Integration**:
- **Cadastral Data**: Large-scale GIS dataset processing with parallel imports
- **Property Scraping**: Automated collection of Florida property information
- **Processing Patterns**: Batch processing, parallel execution, progress tracking, error recovery

## Architecture Patterns

**Import Rules:**
```typescript
// ✅ CORRECT - Always from package root
import { Button, Card } from '@claimguardian/ui'
import { formatDate } from '@claimguardian/utils'

// ❌ WRONG - Never from subpaths  
import { Button } from '@claimguardian/ui/button'
```

**Server Actions Pattern:**
```typescript
export async function createClaim({ propertyId, damageType }: CreateClaimParams) {
  try {
    return { data: result, error: null }
  } catch (error) {
    return { data: null, error: error.message }
  }
}
```

**Component Patterns:**
- Dark theme: `bg-gray-800` cards with `border-gray-700`
- Consistent spacing: `p-6` for page containers
- Use `@claimguardian/ui` components from root index

## AI Tools Suite

**Hub**: `/ai-tools/` with API key status indicators

**Analysis Tools**: Damage Analyzer, Settlement Analyzer, 3D Model Generator
**Assistance Tools**: Policy Chat, Claim Assistant, Communication Helper  
**Documentation Tools**: Document Generator, Receipt Scanner, AR Documenter

**Camera Integration**: `CameraCapture` component with permissions handling

## Environment Variables

**Required:**
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# AI Features  
OPENAI_API_KEY=              # OpenAI API
GEMINI_API_KEY=              # Google Gemini API

# Email
RESEND_API_KEY=              # Email service
```

## Development Workflow

**Setup**: `./scripts/dev.sh setup` → `pnpm dev` → `pnpm type-check` → `pnpm build`

**Process**:
1. **Before Changes**: 🧠 Query Claude learning context, verify types
2. **During Development**: 🧠 Log errors with `claudeErrorHelpers`, incremental changes
3. **Before Committing**: 🧠 Resolve errors, validate with `pnpm ci:validate`

**Quick Commands**:
```bash
pnpm clean:all              # Complete cleanup and rebuild
pnpm fix:all                # Fix lint issues and rebuild
ANALYZE=true pnpm build     # Bundle analysis
```

## Supabase Architecture & Backend Setup

### Architecture Overview
ClaimGuardian uses Supabase's open-source architecture with these core components:

#### Core Services
- **PostgreSQL 17.4.1.064**: Primary database with full privileges and Row Level Security (RLS)
- **PostgREST 12.2.12**: Auto-generated RESTful API from database schema
- **GoTrue 2.177.0**: JWT-based authentication with PostgreSQL RLS integration  
- **Storage API**: S3-compatible object storage for property images and documents
- **Edge Functions**: Deno runtime for AI processing and custom business logic
- **Kong Gateway**: API gateway managing all service access

#### Integration Pattern
```typescript
// Next.js app connects via @supabase/supabase-js
import { createClient } from '@supabase/supabase-js'

// Direct PostgreSQL access for complex GIS queries
// Real-time subscriptions for live updates
// Server actions for database operations
```

### Database Management

#### Single Schema File Approach
We use a single `supabase/schema.sql` file instead of migrations to avoid CLI conflicts.

```bash
# View current schema
cat supabase/schema.sql

# Update schema from production
./scripts/db.sh schema dump

# Apply schema changes
./scripts/db.sh schema apply

# Backup database
./scripts/db.sh backup

# Generate TypeScript types
pnpm db:generate-types
```

#### Database Architecture
- **Project ID**: `tmlrvecuwgppbaynesji` (US East region)
- **Schema Management**: Single `supabase/schema.sql` file (no migrations)
- **Security**: Row Level Security (RLS) for user-based access control
- **Real-time**: WebSocket subscriptions for live updates
- **GIS**: PostGIS extension for Florida parcel processing
- **Search**: Full-text indexing for documents and claims

#### PostgreSQL Extensions
ClaimGuardian leverages 35+ PostgreSQL extensions for advanced functionality:

**Core Extensions:**
- **`uuid-ossp`**: UUID generation for primary keys
- **`pgcrypto`**: Cryptographic functions for security
- **`pgsodium`**: Supabase Vault encryption functions
- **`plpgsql`**: Stored procedure language

**Spatial & GIS:**
- **`postgis`** + **`postgis_topology`** + **`postgis_raster`** + **`postgis_sfcgal`**: Complete spatial analysis
- **`postgis_tiger_geocoder`**: US address geocoding
- **`address_standardizer`** + **`address_standardizer_data_us`**: Address normalization
- **`fuzzystrmatch`**: String similarity for address matching

**Search & Text Processing:**
- **`pgroonga`** + **`pgroonga_database`**: Multi-language full-text search
- **`pg_trgm`**: Trigram-based text similarity and indexing
- **`unaccent`**: Accent-insensitive text search
- **`rum`**: Advanced full-text search with ranking
- **`citext`**: Case-insensitive text columns

**Performance & Monitoring:**
- **`pg_stat_statements`** + **`pg_stat_monitor`**: Query performance monitoring
- **`index_advisor`** + **`hypopg`**: Index optimization tools
- **`pg_repack`**: Table reorganization without locks
- **`btree_gin`** + **`btree_gist`**: Enhanced indexing options

**Testing & Development:**
- **`pgtap`**: Unit testing for database functions
- **`plpgsql_check`**: Static analysis for PL/pgSQL functions

**AI & Vector Operations:**
- **`vector`**: Vector similarity search for AI embeddings
- **`hstore`**: Key-value data storage
- **`pg_jsonschema`**: JSON schema validation

**Supabase Integration:**
- **`pg_graphql`**: GraphQL API generation
- **`pg_net`**: HTTP client for webhooks
- **`pg_cron`**: Job scheduling
- **`pgmq`**: Message queue system
- **`wrappers`**: Foreign data wrappers

**Security & Audit:**
- **`pgaudit`**: Database auditing
- **`moddatetime`**: Automatic timestamp updates
- **`http`**: HTTP requests from database

### Edge Functions Architecture
ClaimGuardian leverages Deno Edge Functions for:

#### AI Processing Functions
1. **`ai-document-extraction`**: Extract data from insurance documents securely
2. **`analyze-damage-with-policy`**: AI-powered damage analysis with policy context
3. **ar-drone-processor`**: AR/drone imagery processing for property damage
4. **`extract-policy-data`**: Extract structured data from insurance policies
5. **`ocr-document`**: OCR processing for document digitization
6. **`policy-chat`**: Interactive chat with insurance policy documents
7. **`property-ai-enrichment`**: Enhance property data with AI insights
8. **`spatial-ai-api`**: Spatial analysis and GIS AI processing

#### Florida-Specific Functions
1. **`floir-extractor`**: Extract data from Florida insurance documents
2. **`floir-rag-search`**: RAG-based search across insurance regulations
3. **`florida-parcel-ingest`**: Process large-scale cadastral data imports
4. **`florida-parcel-monitor`**: Monitor and validate data import status
5. **`scrape-florida-parcels`**: County-specific parcel data scraping

#### ML Operations Functions
1. **`federated-learning`**: Distributed machine learning coordination
2. **`ml-model-management`**: Model versioning and deployment
3. **`environmental-data-sync`**: Environmental data integration
4. **`fetch-disaster-alerts`**: Real-time disaster monitoring
5. **`fetch-tidal-data`**: Coastal flood risk data integration
6. **`model_3d_generation`**: 3D model generation from photogrammetry

#### Security & Compliance Updates
- **Enhanced Input Validation**: All Edge Functions now include comprehensive input sanitization
- **Rate Limiting**: Implemented across all AI processing functions
- **CORS Security**: Strict origin validation for production environment
- **Audit Logging**: All AI operations logged with user context and IP tracking

#### Function Development Pattern
```typescript
// Edge Function structure
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

Deno.serve(async (req: Request) => {
  // AI processing logic
  // Database operations via service role
  // Return structured responses
})
```

### Schema Change Workflow
1. **Development**: Test changes in local environment
2. **Schema Update**: Run `./scripts/db.sh schema dump` to capture changes
3. **Version Control**: Commit updated `schema.sql` file
4. **Type Generation**: Run `pnpm db:generate-types` to update TypeScript definitions
5. **Deployment**: Apply via Supabase Dashboard to production
6. **Verification**: Validate with database lint checks

### Data Architecture Principles
Following Supabase's design philosophy:
- **PostgreSQL as Single Source of Truth**: All data in one ACID-compliant database
- **API Auto-generation**: Schema drives API structure automatically  
- **Real-time by Default**: Live updates without additional infrastructure
- **Security via RLS**: Row-level permissions enforce data access rules
- **Extensibility**: Custom functions for Florida-specific business logic

## Performance & Monitoring

### Bundle Analysis
- Run `ANALYZE=true pnpm build` to generate bundle analysis report
- View interactive visualization at http://localhost:8888
- Identifies large dependencies and opportunities for code splitting

### Code Splitting & Lazy Loading
- Heavy components use dynamic imports with lazy loading
- AI tools and feature-specific pages load on demand
- Reduces initial bundle size by ~40%

### Data Management
- React Query (TanStack Query) integrated for caching
- Automatic cache invalidation and background refetching
- Optimistic updates for better perceived performance

### Build Performance
- Bundle analyzer integrated in next.config.js (ANALYZE=true pnpm build)
- Optimized package imports for lucide-react, Radix UI, Framer Motion
- Image optimization with AVIF/WebP formats
- Turborepo caching for incremental builds
- Standalone Next.js output for optimal Vercel deployment

### Error Monitoring & Analytics
- **Sentry Integration**: Full-stack error tracking and performance monitoring
- **Custom Error Logging**: Database-backed error tracking with status management
- **Web Vitals**: Performance metrics collection
- **Security Headers**: HSTS, CSP, X-Frame-Options via Next.js middleware
- **Monitoring Package**: `@claimguardian/monitoring` for centralized analytics

### Deployment & CI/CD
- **Platform**: Vercel with optimized standalone builds
- **Build Command**: `turbo build` (monorepo-aware)
- **Install Strategy**: `pnpm install --no-frozen-lockfile`
- **Environment**: Production domain at claimguardianai.com
- **Database**: Hosted Supabase with connection pooling

## Pre-commit Hooks

Husky automatically runs:
- `pnpm deps:check` - Validates lockfile integrity
- Progressive lint fixes - Auto-fixes code style issues  
- Type checking - Warns but doesn't block
- Database validation - Checks Supabase state

## Agent OS Integration

**Standards**: Global `standards/` folder (best-practices.md, code-style.md, tech-stack.md)
**Product Docs**: Mission, roadmap in `.agent-os/product/`
**Specs**: Feature specifications in `.agent-os/specs/`
**Subagents**: Native .md files in `.claude/agents/`

**Available Subagents**: ui-developer, api-developer, database-admin, ai-developer, test-engineer

## Claude.md File Maintenance

### Periodic Update System
This main CLAUDE.md file should be updated to synchronize with package-specific claude.md files periodically to maintain consistency and capture latest architectural changes.

#### Update Triggers
- **Weekly**: Review and sync package-specific claude.md files during development cycles
- **After major features**: When significant changes are made to any package architecture
- **Before releases**: Ensure all documentation reflects current state before deployment
- **When tests are updated**: After major test infrastructure changes or new test patterns

#### Package Claude.md Files to Monitor
- `packages/ui/CLAUDE.md` - UI component patterns, design system updates
- `packages/ai-services/CLAUDE.md` - AI orchestration patterns, provider configurations
- `packages/realtime/CLAUDE.md` - Real-time subscription patterns, WebSocket management
- `packages/db/CLAUDE.md` - Database patterns, schema management, migration strategies
- `apps/web/src/app/auth/CLAUDE.md` - Authentication patterns, security practices
- `supabase/functions/CLAUDE.md` - Edge function patterns, deployment strategies

#### Update Process
1. **Scan package claude.md files** for architectural changes or new patterns
2. **Identify inconsistencies** between main file and package-specific documentation
3. **Merge updates** from packages into relevant sections of main CLAUDE.md
4. **Update version references** and dependency information if packages were updated
5. **Refresh examples** to reflect current best practices and patterns
6. **Validate against current codebase** to ensure accuracy

#### Maintenance Commands
```bash
# Check for claude.md files that need syncing
find . -name "CLAUDE.md" -o -name "claude.md" | head -10

# Review recent changes to package documentation
git log --oneline --since="1 week ago" -- "*/CLAUDE.md" "*/claude.md"

# Quick consistency check - look for version mismatches
grep -r "Next.js\|TypeScript\|Node.js" */CLAUDE.md */claude.md | sort | uniq
```

#### Auto-Sync Integration
Consider integrating periodic updates into the development workflow:
- Add claude.md sync check to pre-commit hooks for major changes
- Create monthly maintenance tasks to review and update documentation
- Use subagents to detect when package documentation drifts from main file

## Enhanced Adaptive Agent System (Claude Code CLI Optimized)

### Claude Code CLI Setup & Extensions
- Install: `pip install claude-code` (Python SDK).
- Config: Set `ANTHROPIC_API_KEY` env var.
- Init: `claude-code init --repo . --hooks` (auto-installs Git hooks).
- Subagents: Defined as native .md files in `.claude/agents/` (project-level).
- Management: Use `/agents` command for create/edit/delete; auto-delegates based on descriptions.
- Agent OS Setup: Run installation scripts from Agent OS repo; customize standards/.

### Hooks Integration
Triggers for automation:
- Pre-commit: Invoke plan-orchestrator subagent to validate/optimize changes.
- Post-merge: Spawn data-import for schema sync.
- Error Detection: Auto-log errors during development and testing.

Setup: `claude-code hooks install`  # Adds to .git/hooks

### Local Docs as Dynamic Memory
- Subagents use Read tool to query sections of this file, standards/, and `.claude/errors/error_log.md` for context.
- Error learnings cached and filtered by agent type for relevant context.
- Learnings appended to error log via Write tool; queried on init for adaptation.

### Sub-Agents with Parallelism
- Native delegation: Automatic based on task match; explicit via "Use [name] subagent".
- Parallelism: Chain subagents for non-conflicting tasks.
- Conflict Avoidance: Prompts include checks via Grep/Glob and error log consultation.

### Learning Layer
- Record: Subagents use Write to append {task, mistake, learning} to error log.
- Retrieve: Use Read to query error log at start; adapt behavior based on previous failures.
- Refinement: Suggest updates to standards/ based on error patterns and learnings.

## Centralized Error Log System

ClaimGuardian implements a comprehensive error tracking and learning system:

**Error Handling Workflow:**
1. **Error Logging**: Use `/log_error <error_details>` to log errors in `.claude/errors/error_log.md`
2. **Error Analysis**: Use `/analyze_error <error_details>` for root cause analysis  
3. **Learning Retrieval**: Subagents automatically load relevant learnings at startup

**Database Tables** (already deployed):
- `claude_errors` - All Claude errors with full context
- `claude_learnings` - Learned patterns and solutions

**Usage Examples:**
```bash
# Start subagent with error context
python subagent_error_system.py ui-developer "Fix Claims component rendering issue"

# Log an error manually  
/log_error TypeError: Cannot read property 'map' of undefined at ClaimsList.tsx:45

# Analyze error with context
/analyze_error TypeError in ClaimsList during claims loading - API returned null
```

## Common Issues & Solutions

**TypeScript Errors**: Database types auto-generated, use type assertions sparingly
**Missing Components**: Create in local `components/ui/` if not in UI package
**Build Errors**: Type-check and ESLint enabled in production (will fail build)

## Known Issues & Quick Fixes

**React Three Fiber SSR**: Use dynamic imports with `{ ssr: false }`
```typescript
const Canvas = dynamic(() => import('@react-three/fiber').then(mod => mod.Canvas), { ssr: false })
```

**Build Errors**: Type-check and ESLint enabled in production builds
**Import Issues**: Always import from `@claimguardian/ui` root, not subpaths

## Current Status

**Deployment**: ✅ Live at https://claimguardianai.com (Aug 4, 2025)
**Recent**: ML Operations, AI Services Unification, 20+ Edge Functions, Claude Learning System v2.0
**Focus**: Type safety, testing coverage, bundle optimization

## FUTURE TO DO

### High-Priority AI Enhancements

#### 1. AI Emotional Support Companion 💝
- **Priority**: P0 (Next Sprint)
- **Problem**: Claim process is extremely stressful for homeowners
- **Solution**: Claude-based empathetic AI companion providing emotional support, encouragement, and stress management during the claims journey
- **Implementation**: 
  - Integrate Claude 3 with emotional intelligence prompting
  - Crisis intervention capabilities with escalation protocols
  - Personalized support based on claim complexity and user stress indicators
  - Multi-modal support (text, voice, video chat)
- **Investment**: $85K
- **Expected Revenue**: $180K annually  
- **ROI**: 212%
- **Success Metrics**: User satisfaction +40%, completion rate +25%, support ticket reduction -30%
- **Technical Requirements**: 
  - New Edge Function for emotional AI processing
  - Integration with existing user journey tracking
  - Crisis intervention webhook system
  - HIPAA-compliant conversation logging

#### 2. Automated Evidence Workflows 🔄
- **Priority**: P0 (Sprint 1)
- **Problem**: Users still have manual tasks in evidence collection
- **Solution**: AI workflows that automatically trigger next steps and reminders
- **Implementation**:
  - Smart automation engine with context-aware task orchestration
  - Automatic evidence gap detection and prompting
  - Deadline-aware collection scheduling
  - Integration with Zero-Touch Evidence Locker
- **Investment**: $65K
- **Expected Revenue**: $120K annually
- **ROI**: 185%
- **Success Metrics**: 67% faster claim preparation, 45% reduction in missing documents
- **Technical Requirements**:
  - Workflow orchestration engine
  - Event-driven architecture
  - Integration with notification system

#### 3. Smart Notification Engine 📱
- **Priority**: P0 (Sprint 1)
- **Problem**: Users miss critical deadlines and opportunities
- **Solution**: AI-powered notifications that understand context and urgency
- **Implementation**:
  - Predictive notification system with multi-channel delivery
  - Context-aware urgency scoring
  - Optimal timing algorithm for maximum engagement
  - SMS, push, email, and in-app notification channels
- **Investment**: $35K
- **Expected Revenue**: $65K annually
- **ROI**: 314%
- **Success Metrics**: 60% increase in engagement, 94% deadline compliance
- **Technical Requirements**:
  - Multi-channel notification service
  - ML-based timing optimization
  - User preference learning system

#### 4. Community Intelligence Network 🌐
- **Priority**: P1 (Sprint 2)
- **Problem**: Users fight alone against insurance companies
- **Solution**: AI-powered community sharing of anonymized successful strategies
- **Implementation**:
  - Federated learning system with privacy-preserving insights
  - Anonymous outcome sharing with differential privacy
  - Pattern recognition across similar claims
  - Verified contractor and adjuster ratings
- **Investment**: $180K
- **Expected Revenue**: $320K annually
- **ROI**: 178%
- **Success Metrics**: 58% faster claim resolution, 35% better settlements
- **Technical Requirements**:
  - Federated learning infrastructure
  - Privacy-preserving analytics
  - Community data aggregation system

### Florida-Specific Intelligence Upgrades 🌴

#### Hurricane & Weather Intelligence
- **NOAA/NHC Integration**: Real-time hurricane tracking with proactive claim preparation
- **Storm Surge Modeling**: AI-powered flood risk assessment before storms
- **Post-Storm Damage Prediction**: ML models trained on historical hurricane damage
- **Implementation**: Weather API integration, predictive models, alert system
- **Investment**: $55K
- **ROI**: 145%

#### Property Value & Risk Analytics
- **Zestimate Integration**: Automated property value tracking for coverage optimization
- **FEMA Flood Zone Analysis**: Real-time flood risk assessment and insurance recommendations
- **Market Trend Analysis**: AI-powered property value predictions for settlement negotiations
- **Implementation**: Zillow API, FEMA data integration, ML valuation models
- **Investment**: $45K
- **ROI**: 167%

### Revenue Expansion Opportunities 💰

#### Insurance Carrier API Services
- **Settlement Prediction API**: $0.50/call for AI-powered settlement predictions
- **Damage Assessment API**: Professional damage analysis for carriers
- **Fraud Detection Service**: AI-powered claim validation
- **Target Market**: Ethical insurance carriers seeking fair settlements
- **Projected Revenue**: $250K annually

#### Professional Network Monetization
- **Legal Referral Network**: Partnership fees for complex claims requiring attorneys
- **Insurance Broker Referrals**: Commission for users switching insurers (non-affiliated)
- **Contractor Marketplace**: Transaction fees for verified contractor connections
- **Projected Revenue**: $180K annually

#### Data Licensing & Insights
- **Anonymized Claims Intelligence**: Industry insights for insurance companies
- **Market Research Data**: Trends and patterns for industry analysts
- **Academic Research Partnerships**: De-identified data for insurance studies
- **Projected Revenue**: $500K annually

### Gamification & Engagement Features 🎮

#### Achievement System
- **Claim Progress Tracking**: Visual progress bars with milestone celebrations
- **Knowledge Badges**: Rewards for learning about claims process
- **Community Leaderboard**: Anonymous sharing of settlement victories
- **Document Collection Achievements**: Recognition for evidence completeness
- **Implementation**: Gamification engine, achievement tracking, reward system
- **Investment**: $45K
- **ROI**: 200%

#### Mobile-First Optimization
- **Touch-Optimized Interface**: Redesigned for smartphone-primary users
- **Offline Mode**: Essential features available without connection
- **Voice Commands**: Hands-free claim documentation
- **One-Tap Actions**: Simplified workflows for mobile users
- **Investment**: $80K
- **ROI**: 140%

## Guidelines
- Use Claude Learning System for ALL significant tasks
- Add `@fileMetadata` headers to new files
- Prefer editing existing files over creating new ones
- Never create documentation files unless requested