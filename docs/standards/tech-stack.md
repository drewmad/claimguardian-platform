# Tech Stack for ClaimGuardian

Default tools/libraries per Agent OS, for consistency in AI-generated code.

## Core
- Framework: Next.js 15.3.5 (App Router)
- Language: TypeScript 5.8.3
- Monorepo: Turborepo
- Backend/DB: Supabase (Postgres 17.4.1)
- Package Manager: pnpm 10.13.1
- Runtime: Node.js 22+

## UI/Components
- Shared: @claimguardian/ui (export from root)
- Theme: Dark (bg-gray-800, etc.)
- Icons: Lucide React

## AI/Integrations
- APIs: Gemini, OpenAI (optional keys)
- Camera: CameraCapture component
- Maps: Google Maps API (optional)

## Testing/Dev Tools
- Tests: Jest
- Lint: ESLint
- Type Check: tsc
- Hooks: Husky

## Data Processing
- GIS: Parallel imports with scripts
- Python: biopython for bio-inspired if needed; rdkit for chem if extended

Alternatives: Evaluate per spec; update with decisions (e.g., 2025-07-28: Added Supabase version).
