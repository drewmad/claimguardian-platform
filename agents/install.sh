#!/bin/bash

# Claude Code CLI Agents Installation Script
# This script sets up all 10 production-ready agents for Claude Code

set -e

echo "🚀 Installing Claude Code CLI Agents..."

# Create agents directory
mkdir -p ~/.claude/agents

# Check if Claude Code is installed
if ! command -v claude &> /dev/null; then
    echo "❌ Claude Code CLI not found. Installing..."
    npm install -g @anthropic-ai/claude-code
fi

# Copy all agent files
echo "📁 Copying agent files..."
cp *.md ~/.claude/agents/ 2>/dev/null || true

# Setup MCP configuration if it doesn't exist
if [ ! -f ~/.claude/mcp.json ]; then
    echo "⚙️ Creating MCP configuration..."
    cat > ~/.claude/mcp.json << 'EOF'
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}"
      }
    },
    "supabase": {
      "command": "npx",
      "args": [
        "-y", 
        "@supabase/mcp-server-supabase@latest",
        "--access-token",
        "${SUPABASE_ACCESS_TOKEN}"
      ]
    }
  }
}
EOF
fi

# Install optional tools
echo "🛠️ Installing optional tools..."

# GitHub CLI
if ! command -v gh &> /dev/null; then
    echo "Installing GitHub CLI..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        brew install gh
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        sudo apt-get update && sudo apt-get install gh -y
    fi
fi

# Supabase CLI
if ! command -v supabase &> /dev/null; then
    echo "Installing Supabase CLI..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        brew install supabase/tap/supabase
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        npm install -g supabase
    fi
fi

# Visualization tools
echo "Installing visualization tools..."
npm install -g @mermaid-js/mermaid-cli

if [[ "$OSTYPE" == "darwin"* ]]; then
    brew install plantuml
fi

# Create example environment file
cat > ~/.claude/.env.example << 'EOF'
# GitHub Integration
GITHUB_TOKEN=ghp_your_github_personal_access_token

# Supabase Integration  
SUPABASE_ACCESS_TOKEN=your_supabase_access_token
SUPABASE_PROJECT_ID=your_project_id

# Optional: OpenAI for enhanced features
OPENAI_API_KEY=sk-your_openai_api_key

# Optional: Other service tokens
DATADOG_API_KEY=your_datadog_key
EOF

echo "✅ Installation complete!"
echo ""
echo "📋 Next Steps:"
echo "1. Copy ~/.claude/.env.example to ~/.claude/.env and fill in your tokens"
echo "2. Run 'claude' to start Claude Code"
echo "3. Try: 'Use the supabase-migration-debugger agent to analyze our migrations'"
echo ""
echo "📚 Available Agents:"
echo "  - supabase-migration-debugger: Database migration analysis"
echo "  - code-reviewer: Automated PR reviews"
echo "  - test-generator: Generate comprehensive tests"
echo "  - api-documenter: OpenAPI documentation generation"
echo "  - schema-visualizer: Database schema visualization"
echo "  - performance-profiler: Performance analysis"
echo "  - security-auditor: Security vulnerability scanning"
echo "  - dependency-updater: Safe dependency management"
echo "  - error-log-analyzer: Log analysis and error patterns"
echo "  - monorepo-task-runner: Turborepo optimization"
echo ""
echo "🔧 Configuration files created:"
echo "  - ~/.claude/mcp.json (MCP server configuration)"
echo "  - ~/.claude/.env.example (Environment variables template)"
echo ""
echo "🎉 Ready to boost your development workflow!"