# Claude Code CLI Agents - Quick Start Guide

## 🚀 Installation (30 seconds)

```bash
# Clone or navigate to the agents directory
cd /path/to/ClaimGuardian/agents

# Run the installation script
./install.sh

# Copy and configure environment variables
cp ~/.claude/.env.example ~/.claude/.env
# Edit ~/.claude/.env with your actual tokens
```

## 🔧 Essential Setup

### 1. Configure GitHub Integration
```bash
# Login to GitHub CLI
gh auth login

# Add token to environment
echo "GITHUB_TOKEN=$(gh auth token)" >> ~/.claude/.env
```

### 2. Configure Supabase Integration
```bash
# Get your access token from https://supabase.com/dashboard/account/tokens
echo "SUPABASE_ACCESS_TOKEN=your_token_here" >> ~/.claude/.env
echo "SUPABASE_PROJECT_ID=your_project_id" >> ~/.claude/.env
```

## 🎯 Quick Test - Start Here

```bash
# Start Claude Code
claude

# Test the most useful agent first
> Use the supabase-migration-debugger agent to check our database migration status

# Or try code review
> Use the code-reviewer agent to review the latest changes in src/

# Generate tests
> Use the test-generator agent to create tests for the UserService class
```

## 📊 Agent Priority Guide

### **Immediate Impact (Use First)**
1. **supabase-migration-debugger** - Fix database issues instantly
2. **code-reviewer** - Improve code quality immediately  
3. **error-log-analyzer** - Solve production issues faster

### **Development Acceleration**
4. **test-generator** - Automate test writing
5. **api-documenter** - Generate API docs automatically
6. **dependency-updater** - Keep dependencies secure

### **Optimization & Monitoring**  
7. **performance-profiler** - Identify bottlenecks
8. **security-auditor** - Find vulnerabilities
9. **schema-visualizer** - Document database structure
10. **monorepo-task-runner** - Optimize build pipelines

## 💡 Power User Tips

### Chain Multiple Agents
```bash
> Use the code-reviewer agent to analyze PR #123, then use the test-generator to create tests for any issues found

> Use the security-auditor to scan for vulnerabilities, then use the dependency-updater to fix any package issues
```

### Project-Specific Workflows
```bash
# Database workflow
> Use supabase-migration-debugger to analyze pending migrations, then use schema-visualizer to document the updated schema

# Release workflow  
> Use dependency-updater to check for security updates, then use test-generator to ensure coverage, then use performance-profiler to validate performance
```

### Context Management
```bash
# Clear context between major tasks
/clear

# Check context usage
/usage

# Use focused agents for specific domains
> Use the api-documenter agent for just the /api/users endpoint
```

## 🔍 Troubleshooting

### Common Issues

**Agent not found:**
```bash
# Check agents directory
ls ~/.claude/agents/

# Reinstall if needed
./install.sh
```

**MCP server issues:**
```bash
# Check MCP configuration
cat ~/.claude/mcp.json

# Test GitHub connection
gh auth status

# Test Supabase connection  
supabase projects list
```

**Permission errors:**
```bash
# Check environment variables
cat ~/.claude/.env

# Verify tokens have correct permissions
# GitHub: repo, read:org, read:user
# Supabase: full access or specific project access
```

## 📈 Measuring Success

### Before/After Metrics
- **Code Review Time**: Manual reviews vs automated analysis
- **Bug Detection**: Issues caught pre-deployment
- **Test Coverage**: Automated test generation impact
- **Documentation**: API docs completeness
- **Security**: Vulnerabilities found and fixed

### Weekly Workflow Optimization
1. **Monday**: Use dependency-updater for weekly security scan
2. **Wednesday**: Use performance-profiler on critical paths
3. **Friday**: Use code-reviewer for weekly code quality check

## 🎉 Advanced Workflows

### Full Stack Development
```bash
# 1. Plan database changes
> Use schema-visualizer to document current state

# 2. Create migration  
> Use supabase-migration-debugger to validate migration

# 3. Update API
> Use api-documenter to generate new endpoint docs

# 4. Add tests
> Use test-generator for new endpoints

# 5. Security check
> Use security-auditor to validate changes

# 6. Performance validation
> Use performance-profiler to check impact
```

### Production Incident Response
```bash
# 1. Analyze logs
> Use error-log-analyzer to identify error patterns in the last 2 hours

# 2. Check recent changes
> Use code-reviewer to analyze commits from the last deployment

# 3. Database issues?
> Use supabase-migration-debugger to check migration status

# 4. Performance impact?
> Use performance-profiler to identify bottlenecks
```

## 🤝 Team Collaboration

### Share Agent Configurations
```bash
# Add agents to your project
mkdir -p .claude/agents
cp ~/.claude/agents/* .claude/agents/

# Commit to version control
git add .claude/
git commit -m "Add Claude Code agents for team"
```

### Custom Team Agents
```bash
# Create project-specific agent
cat > .claude/agents/project-specific.md << 'EOF'
---
name: claimguardian-reviewer
description: Custom reviewer for ClaimGuardian insurance platform
tools: Bash, Read, Edit
---

You are a ClaimGuardian code reviewer focusing on:
- Insurance industry compliance
- HIPAA data handling
- Florida insurance regulations
- Property damage assessment accuracy
EOF
```

## 📚 Next Steps

1. **Start with one agent** - Pick supabase-migration-debugger or code-reviewer
2. **Integrate into daily workflow** - Use during regular development tasks
3. **Customize for your needs** - Modify agent prompts for your domain
4. **Scale team adoption** - Share successful workflows with teammates
5. **Measure impact** - Track time saved and issues prevented

## 🆘 Need Help?

- **Documentation**: Check individual agent `.md` files for detailed instructions
- **Examples**: Each agent includes usage examples in the README
- **Issues**: Report problems via GitHub issues
- **Community**: Share workflows and custom agents with the team

**Happy coding with AI assistance! 🚀**