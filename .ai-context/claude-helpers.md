# Claude Helpers - Consolidated Guide

This file combines automation hooks and pattern tracking for Claude AI assistance.

## Automation Hooks

### 1. Error Pattern Detection
When Claude encounters an error, it should automatically log it:

```typescript
// Pattern Claude should follow
try {
  // ... code
} catch (error) {
  // Automatically append to learning log
  await appendToLearningLog({
    type: 'error',
    pattern: error.message,
    context: 'Current file and line',
    suggestion: 'How to prevent this error'
  });
}
```

### 2. Command Discovery
When Claude uses a command successfully, log it:

```bash
# After running a new command
echo "$(date): Discovered command: pnpm fix:imports" >> .ai-context/retrospectives/learning-log.md
```

### 3. Pattern Recognition
When Claude fixes the same issue multiple times:

```markdown
# Trigger: Same fix applied 3+ times
# Action: Auto-append to patterns file
```

## Implementation Instructions for Claude

When you encounter these situations, automatically run the logging command:

1. **New Command Discovered**
   ```bash
   echo "## $(date +'%Y-%m-%d') - Command Discovery\n**Command**: $COMMAND\n**Purpose**: $PURPOSE\n**Context**: $CONTEXT\n" >> .ai-context/retrospectives/learning-log.md
   ```

2. **Error Pattern Found**
   ```bash
   echo "## $(date +'%Y-%m-%d') - Error Pattern\n**Error**: $ERROR\n**Solution**: $SOLUTION\n**Prevention**: $PREVENTION\n" >> .ai-context/retrospectives/learning-log.md
   ```

3. **Code Pattern Identified**
   ```bash
   echo "## $(date +'%Y-%m-%d') - Code Pattern\n**Pattern**: $PATTERN\n**Better Approach**: $BETTER\n**File**: $FILE\n" >> .ai-context/retrospectives/learning-log.md
   ```

## Recurring Patterns

### 1. Import Path Corrections
**Frequency**: High
**Pattern**: Developers often use subpath imports like `@claimguardian/ui/Button`
**Correct**: Always import from package root: `@claimguardian/ui`
**Auto-fix**: `pnpm fix:imports`

### 2. Type Assertions
**Frequency**: Medium  
**Pattern**: Using `as any` to bypass type errors
**Correct**: Use proper type assertions with `as unknown` first
**Solution**: Add to pre-commit hooks

### 3. Missing Environment Variables
**Frequency**: Medium
**Pattern**: Errors due to missing env vars
**Solution**: Add validation script

### 4. Missing Components
**Frequency**: High
**Pattern**: Component not exported from UI package
**Solution**: Create in local `components/ui/` first if not in UI package

### 5. Build Errors
**Frequency**: Medium
**Pattern**: Type-check fails but build succeeds
**Solution**: Use `HUSKY=0` to bypass pre-commit if build passes but lint has warnings

## Suggested Improvements

### For CLAUDE.md
- [ ] Add troubleshooting section for common errors
- [ ] Include decision tree for choosing between similar patterns
- [ ] Add examples of DO/DON'T for each major pattern

### For Automation
- [ ] Create `pnpm claude:learn` command that appends to learning log
- [ ] Add metrics tracking for error types
- [ ] Create weekly summary of patterns

## Metrics to Track
- Error types encountered
- Commands used most frequently  
- Files edited most often
- Time spent on different task types

## Pattern Tracker Purpose
1. When Claude encounters an issue multiple times, document it here
2. Periodically review and update CLAUDE.md with frequent patterns
3. Use git commits to track when patterns were discovered

## Quick Reference Commands
```bash
# Fix imports
pnpm fix:imports

# Skip pre-commit hooks
HUSKY=0 git commit -m "message"

# Validate before commit
pnpm validate

# Smart lint fix
pnpm lint:smart-fix

# Check lockfile integrity
pnpm deps:check
```