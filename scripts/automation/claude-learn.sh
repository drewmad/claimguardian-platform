#!/bin/bash

# Claude Learning Helper Functions
# Source this file or add to .bashrc/.zshrc

LEARNING_LOG=".ai-context/LEARNING_LOG.md"

# Log a discovery
claude_learn() {
    local type="$1"
    local description="$2"
    local context="$3"
    local priority="${4:-Medium}"
    
    cat >> "$LEARNING_LOG" << EOF

## $(date +'%Y-%m-%d %H:%M') - $type
**Discovery**: $description
**Context**: $context
**Priority**: $priority
**Session**: $(pwd)
EOF
    
    echo "✅ Logged to $LEARNING_LOG"
}

# Log an error pattern
claude_error() {
    local error="$1"
    local solution="$2"
    local file="${3:-Unknown}"
    
    claude_learn "Error Pattern" "$error" "File: $file, Solution: $solution" "High"
}

# Log a command usage
claude_command() {
    local cmd="$1"
    local purpose="$2"
    
    claude_learn "Command" "$cmd" "Purpose: $purpose" "Low"
}

# Log a code pattern
claude_pattern() {
    local pattern="$1"
    local better="$2"
    local file="${3:-General}"
    
    claude_learn "Code Pattern" "$pattern → $better" "Found in: $file" "Medium"
}

# Quick log for any discovery
claude_log() {
    echo -e "\n## $(date +'%Y-%m-%d %H:%M') - Quick Note\n$1\n" >> "$LEARNING_LOG"
    echo "✅ Logged quick note"
}

# Show recent learnings
claude_recent() {
    echo "📚 Recent learnings:"
    tail -n 30 "$LEARNING_LOG"
}

# Search learnings
claude_search() {
    echo "🔍 Searching for: $1"
    grep -i "$1" "$LEARNING_LOG" -A 3 -B 1
}

echo "🤖 Claude learning functions loaded!"
echo "Commands: claude_learn, claude_error, claude_command, claude_pattern, claude_log"