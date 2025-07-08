# Claude Automation Hooks

## Auto-Learning Patterns

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
echo "$(date): Discovered command: pnpm fix:imports" >> .ai-context/LEARNING_LOG.md
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
   echo "## $(date +'%Y-%m-%d') - Command Discovery\n**Command**: $COMMAND\n**Purpose**: $PURPOSE\n**Context**: $CONTEXT\n" >> .ai-context/LEARNING_LOG.md
   ```

2. **Error Pattern Found**
   ```bash
   echo "## $(date +'%Y-%m-%d') - Error Pattern\n**Error**: $ERROR\n**Solution**: $SOLUTION\n**Prevention**: $PREVENTION\n" >> .ai-context/LEARNING_LOG.md
   ```

3. **Code Pattern Identified**
   ```bash
   echo "## $(date +'%Y-%m-%d') - Code Pattern\n**Pattern**: $PATTERN\n**Better Approach**: $BETTER\n**File**: $FILE\n" >> .ai-context/LEARNING_LOG.md
   ```