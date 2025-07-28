# Code Style for ClaimGuardian

Consistent style for readability and AI delegation, per Agent OS standards.

## General
- **Indentation**: 2 spaces for TS/JS; 4 for Python.
- **Line Length**: 80 chars max.
- **Naming**: camelCase for variables/functions; PascalCase for components.
- **Quotes**: Single quotes.
- **Semicolons**: Always in TS.

## TypeScript/Next.js
- Imports: Group external/internal; alphabetical.
- Components: Export from root index.
- Server Actions: Use object params; return {data, error}.
- JSDoc: For all functions; include @param, @returns.

Example:
```typescript
// Consistent import
import { Button } from '@claimguardian/ui';

// Function with JSDoc
/**
 * @param {string} input - Input string.
 * @returns {string} Uppercased string.
 */
function upper(input: string): string {
  return input.toUpperCase();
}
```

## Python (for scripts/agents)
- PEP8: 4-space indent, no trailing whitespace.
- Docstrings: Triple-quoted with args/returns.

Refine: Update based on learnings (e.g., 2025-07-28: Added JSDoc mandate).