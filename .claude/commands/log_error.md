# Log Error Command

Log the error provided in $ARGUMENTS in `.claude/errors/error_log.md`. Follow this format:

- **Timestamp**: Current date and time (YYYY-MM-DD HH:MM)
- **Error**: Full error message and stack trace from $ARGUMENTS
- **File**: Affected file(s) and line numbers (extract from $ARGUMENTS or ask user)
- **Context**: Brief description of the scenario when error occurred

## Instructions:
1. Parse the error details from $ARGUMENTS
2. Generate current timestamp in YYYY-MM-DD HH:MM format
3. Extract file path and line numbers if available in stack trace
4. Ask user for context if not clear from error message
5. Append the new entry to `.claude/errors/error_log.md` after the "<!-- New entries will be added below this line -->" comment
6. Preserve all existing entries - only add, never modify existing content
7. Use proper Markdown formatting with ### header for timestamp
8. Prompt for user approval before saving changes

## Example Usage:
```
/log_error TypeError: Cannot read property 'map' of undefined at ClaimsList.tsx:45
```