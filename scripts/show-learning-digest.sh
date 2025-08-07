#!/bin/bash

# Display learning digest information
DIGEST_DIR=".learning-digest"

echo "🧠 ClaimGuardian Learning Digest"
echo "================================"
echo ""

if [ ! -d "$DIGEST_DIR" ]; then
    echo "❌ Learning digest not found. Run: node scripts/utils/learning-digest.js"
    exit 1
fi

# Show quick stats
if [ -f "$DIGEST_DIR/search-index.json" ]; then
    TOTAL_ISSUES=$(jq -r '.solutions | length' "$DIGEST_DIR/search-index.json" 2>/dev/null || echo "0")
    TOTAL_TAGS=$(jq -r '.tags | keys | length' "$DIGEST_DIR/search-index.json" 2>/dev/null || echo "0")
    echo "📊 Statistics:"
    echo "   - Total Issues Documented: $TOTAL_ISSUES"
    echo "   - Unique Tags: $TOTAL_TAGS"
    echo ""
fi

# Show quick reference preview
if [ -f "$DIGEST_DIR/quick-reference.md" ]; then
    echo "📚 Quick Reference (Preview):"
    echo "----------------------------"
    head -n 20 "$DIGEST_DIR/quick-reference.md" | grep -v "^#" | grep -v "^$" | head -n 10
    echo ""
fi

# Show available guides
echo "📖 Available Guides:"
echo "   - Quick Reference: $DIGEST_DIR/quick-reference.md"
echo "   - Error Patterns: $DIGEST_DIR/error-patterns.md"
echo "   - VS Code Snippets: $DIGEST_DIR/claimguardian.code-snippets"

# Check for category guides
for guide in "$DIGEST_DIR"/*-guide.md; do
    if [ -f "$guide" ]; then
        basename "$guide" | sed 's/-guide.md//' | awk '{print "   - " toupper(substr($0,1,1)) substr($0,2) " Guide: " "'$guide'"}'
    fi
done

echo ""
echo "💡 Tips:"
echo "   - Copy VS Code snippets to .vscode/ folder for auto-completion"
echo "   - Use pre-commit-check script to catch known issues"
echo "   - Search learnings with: jq '.tags.typescript' $DIGEST_DIR/search-index.json"
echo ""
