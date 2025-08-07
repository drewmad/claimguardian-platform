# Learning Digest System

The Learning Digest System transforms development learnings into actionable insights, quick references, and automated tools.

## Features

### 1. **Automated Parsing**

- Extracts issues, solutions, and learnings from `learnings.md`
- Categorizes by type (build, api, database, ui, auth, etc.)
- Tags issues for better searchability

### 2. **Quick Reference Generation**

- Most common issues and their fixes
- Pattern detection for recurring problems
- Prevention tips for each pattern

### 3. **Error Pattern Detection**

- Identifies common error patterns
- Tracks occurrence frequency
- Provides prevention strategies

### 4. **VS Code Integration**

- Custom snippets for common fixes
- Server action templates
- Import fix helpers

### 5. **Git Hooks**

- Pre-commit checks for known issues
- Warns about patterns that previously caused problems
- References quick solutions

### 6. **Search Index**

- JSON-based search index
- Query by category, tags, or keywords
- Structured for integration with AI assistants

## Usage

### Generate Digest

```bash
node scripts/utils/learning-digest.js
```

### View Summary

```bash
./scripts/show-learning-digest.sh
```

### Search Issues

```bash
# Search by tag
jq '.tags.typescript' .learning-digest/search-index.json

# Search by category
jq '.categories.build' .learning-digest/search-index.json

# Find specific patterns
grep -r "server-client" .learning-digest/
```

### Install VS Code Snippets

```bash
# Copy to VS Code snippets folder
cp .learning-digest/claimguardian.code-snippets .vscode/
```

### Use Pre-commit Hook

```bash
# Add to git hooks
cp .learning-digest/pre-commit-check .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

## Integration Points

### Dashboard Widget

The Learning Assistant widget is integrated into the dashboard at `/dashboard` providing:

- Real-time search of learnings
- Weekly statistics
- Quick access to guides

### Database Schema

The learning system uses Supabase tables:

- `learnings` - Main storage for issues and solutions
- `learning_categories` - Organization by type
- `learning_tags` - Searchable tags
- `error_patterns` - Pattern detection and auto-fixes

### AI Assistant

The `LearningAssistant` class provides:

- Semantic search capabilities
- Pattern detection
- Auto-fix suggestions
- Statistics tracking

## File Structure

```
.learning-digest/
├── quick-reference.md      # Most common issues and fixes
├── error-patterns.md       # Detected patterns with examples
├── build-guide.md         # Category-specific guide
├── search-index.json      # Searchable JSON index
├── pre-commit-check       # Git hook script
└── claimguardian.code-snippets  # VS Code snippets
```

## Maintenance

### Adding New Learnings

1. Update `learnings.md` with new issues
2. Run `node scripts/utils/learning-digest.js`
3. Commit both files

### Updating Patterns

Edit detection patterns in `learning-digest.js`:

```javascript
const patterns = [
  {
    pattern: /your-regex-here/i,
    type: "pattern-name",
    preventionTip: "How to prevent this",
  },
];
```

### Database Updates

Apply migrations for new features:

```bash
npx supabase migration up
```

## Benefits

1. **Faster Problem Resolution** - Quick access to previous solutions
2. **Pattern Recognition** - Identify recurring issues
3. **Knowledge Sharing** - Team-wide access to learnings
4. **Proactive Prevention** - Git hooks catch known issues
5. **Continuous Improvement** - Learning from past mistakes
