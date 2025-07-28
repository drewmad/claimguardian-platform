#!/usr/bin/env bash
set -euo pipefail
echo " Initializing unified AI context system..."

# Resolve repo root even when run from subdir
REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$REPO_ROOT"

# Create directory structure for all agents
mkdir -p .ai-context/{shared,claude,gemini,chatgpt,retrospectives}
mkdir -p .gemini/templates
mkdir -p docs/{context,engineering,architecture}

### Shared project context ####################################################
cat > .ai-context/shared/project-context.yaml <<'YAML'
project:
  name: ClaimGuardian
  description: AI-powered insurance-claim advocacy platform
  stage: development
  version: 1.0.0

key_principles:
  - "User-first design for Florida property owners"
  - "AI augmentation, not replacement"
  - "Transparency in claim processing"
  - "Mobile-first responsive design"

technical_constraints:
  - "Next.js 14 App Router only"
  - "TypeScript strict mode"
  - "Tailwind CSS for styling"
  - "Supabase for backend"
  - "Turborepo for monorepo management"
  - "Node.js 22.x runtime"
  - "pnpm 10.12.4 package manager"

business_context:
  target: "Florida property owners"
  problem: "Complex insurance-claim process"
  solution: "AI-powered assistance and automation"

coding_standards:
  imports: "Use @claimguardian/* for internal packages"
  components: "Functional components with TypeScript"
  styling: "Tailwind utility classes only"
  testing: "Jest + React Testing Library"
  documentation: "JSDoc with @fileMetadata headers"
YAML

### Sync manifest (tracks agent-specific edits) ###############################
cat > .ai-context/sync-manifest.json <<'JSON'
{
  "version": "1.0.0",
  "lastSync": null,
  "agents": ["claude", "gemini", "chatgpt"],
  "modifications": {
    "claude": [],
    "gemini": [],
    "chatgpt": []
  },
  "conflicts": [],
  "resolutions": []
}
JSON

### Agent capability registry ##################################################
cat > .ai-context/shared/agent-capabilities.json <<'JSON'
{
  "claude": {
    "strengths": ["complex reasoning", "code architecture", "documentation"],
    "preferred_tasks": ["system design", "refactoring", "code review"]
  },
  "gemini": {
    "strengths": ["pattern recognition", "bulk analysis", "automation"],
    "preferred_tasks": ["codebase analysis", "dependency updates", "test generation"]
  },
  "chatgpt": {
    "strengths": ["user experience", "api design", "integration"],
    "preferred_tasks": ["feature implementation", "api development", "debugging"]
  }
}
JSON

### Retrospective schema #######################################################
cat > .ai-context/retrospectives/schema.json <<'JSON'
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["timestamp", "agent", "task", "duration", "outcome"],
  "properties": {
    "timestamp": {"type": "string", "format": "date-time"},
    "agent": {"enum": ["claude", "gemini", "chatgpt", "system"]},
    "task": {"type": "string"},
    "duration": {"type": "number"},
    "outcome": {"enum": ["success", "partial", "failure"]},
    "errors": {"type": "array", "items": {"type": "string"}},
    "warnings": {"type": "array", "items": {"type": "string"}},
    "lessons": {"type": "array", "items": {"type": "string"}},
    "improvements": {"type": "array", "items": {"type": "string"}},
    "metrics": {"type": "object"}
  }
}
JSON

### Template registry ##########################################################
cat > .ai-context/shared/template-registry.yaml <<'YAML'
templates:
  code_review:
    id: "tmpl_001"
    purpose: "Standardized code review across all agents"
    variables: ["file_path", "pr_number", "author"]
    
  feature_implementation:
    id: "tmpl_002"
    purpose: "Consistent feature development approach"
    variables: ["feature_name", "requirements", "constraints"]
    
  bug_analysis:
    id: "tmpl_003"
    purpose: "Systematic bug investigation"
    variables: ["error_message", "stack_trace", "context"]
YAML

echo "✅ AI context system initialized at $REPO_ROOT/.ai-context"
