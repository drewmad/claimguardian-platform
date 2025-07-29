# Analyze Error Command

Analyze the error provided in $ARGUMENTS and perform comprehensive root cause analysis. Follow these steps:

## Step 1: Log the Error
First use the `/log_error` command format to create the basic error entry in `.claude/errors/error_log.md`.

## Step 2: Root Cause Analysis
Analyze the error by examining:
- Error message and stack trace from $ARGUMENTS
- Affected code (use Read tool to examine file contents if needed)
- Dependencies and related systems
- Edge cases that might cause this error
- Environment factors (Node.js version, browser, etc.)

## Step 3: Agent-Based Learnings (if applicable)
For errors handled by subagents, include:
- **Subagent**: Name of the agent that should handle this type of error
- **Insight**: Key learning or pattern identified
- **Fix Recipe**: Specific steps to resolve similar errors
- **Optimization**: Preventive measures or improvements

## Step 4: Update Error Log
Add the **Root Cause Analysis** and **Agent-Based Learnings** sections to the error entry created in Step 1.

## Instructions:
1. Create comprehensive analysis covering cause, edge cases, and dependencies
2. Identify which ClaimGuardian subagent (ui-developer, api-developer, database-admin, etc.) should handle this error type
3. Provide actionable fix recipes and optimization suggestions
4. Update the error entry in `.claude/errors/error_log.md` with analysis
5. Ensure all existing entries remain unchanged
6. Prompt for user approval before saving changes

## Example Usage:
```
/analyze_error TypeError: Cannot read property 'map' of undefined at ClaimsList.tsx:45 - occurred during claims rendering
```