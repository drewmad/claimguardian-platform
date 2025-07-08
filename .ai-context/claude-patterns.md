# Claude Pattern Tracker

## Purpose
Track recurring patterns, issues, and improvements that Claude encounters.

## How to Use
1. When Claude encounters an issue multiple times, document it here
2. Periodically review and update CLAUDE.md with frequent patterns
3. Use git commits to track when patterns were discovered

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