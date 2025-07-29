# Centralized Error Log
This file stores all errors, root cause analyses, and agent-based learnings for ClaimGuardian.

## Error Entry Format
Each entry follows this structure:
- **Timestamp**: YYYY-MM-DD HH:MM
- **Error**: Error message and stack trace
- **File**: Affected file(s) and line numbers
- **Context**: Brief description of the scenario
- **Root Cause Analysis**: Cause, edge cases, dependencies
- **Agent-Based Learnings**: Subagent insights, fix recipes, or optimizations (if applicable)

## Entries

### Example Entry (Template)
- **Timestamp**: 2025-07-29 17:31
- **Error**: TypeError: Cannot read property 'map' of undefined
- **File**: apps/web/src/components/claims/ClaimsList.tsx, line 45
- **Context**: Occurred during claims data rendering when API returned null
- **Root Cause Analysis**:
  - **Cause**: Missing null check for claims array from API
  - **Edge Cases**: API returns null/undefined during loading states
  - **Dependencies**: Claims API endpoint, React rendering cycle
- **Agent-Based Learnings**:
  - Subagent: ui-developer
  - Insight: Always provide fallback for array operations
  - Fix Recipe: Use `claims?.map()` or `claims || []`
  - Optimization: Add loading state handling in component

---
<!-- New entries will be added below this line -->