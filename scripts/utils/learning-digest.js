#!/usr/bin/env node

/**
 * Learning Digest System
 * Transforms learnings.md into actionable insights and quick references
 */

import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class LearningDigest {
  constructor() {
    this.learningsPath = path.join(__dirname, "../../learnings.md");
    this.outputDir = path.join(__dirname, "../../.learning-digest");
    this.categories = new Map();
    this.patterns = new Map();
    this.solutions = new Map();
  }

  async init() {
    // Create output directory
    await fs.mkdir(this.outputDir, { recursive: true });
  }

  async parseLearnins() {
    const content = await fs.readFile(this.learningsPath, "utf-8");
    const lines = content.split("\n");

    let currentSection = "";
    let currentCategory = "";
    let currentIssue = null;
    let inCodeBlock = false;
    let issueList = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Track code blocks
      if (line.trim().startsWith("```")) {
        inCodeBlock = !inCodeBlock;
        continue;
      }

      if (inCodeBlock) continue;

      // Parse headers
      if (line.startsWith("#")) {
        const level = line.match(/^#+/)[0].length;
        const header = line.replace(/^#+\s*/, "").trim();

        if (level === 2) {
          currentSection = header;
          currentCategory = this.categorizeSection(header);
          issueList = false;
        } else if (level === 3) {
          // If we have a numbered list item, this is likely part of an issue list
          currentIssue = {
            title: header,
            section: currentSection,
            category: currentCategory,
            content: [],
            solution: null,
            tags: [],
          };
          issueList = true;
        }
      }
      // Parse numbered list items (issues)
      else if (line.match(/^\d+\.\s+\*\*.*\*\*/)) {
        // Extract issue title from numbered list
        const titleMatch = line.match(/^\d+\.\s+\*\*([^*]+)\*\*/);
        if (titleMatch) {
          currentIssue = {
            title: titleMatch[1].trim(),
            section: currentSection,
            category: currentCategory,
            issue: null,
            solution: null,
            learning: null,
            tags: [],
          };

          // Check if issue description is on same line
          const issueMatch = line.match(/\*\*Issue\*\*:\s*(.+)/);
          if (issueMatch) {
            currentIssue.issue = issueMatch[1].trim();
          }
        }
      }
      // Parse issue details (indented lines)
      else if (currentIssue && line.match(/^\s+-\s+/)) {
        const content = line.replace(/^\s+-\s+/, "").trim();

        if (
          content.startsWith("**Issue**:") ||
          content.startsWith("**Issue:**")
        ) {
          currentIssue.issue = content.replace(/\*\*Issue\*\*:\s*/, "").trim();
        } else if (
          content.startsWith("**Solution**:") ||
          content.startsWith("**Solution:**")
        ) {
          currentIssue.solution = content
            .replace(/\*\*Solution\*\*:\s*/, "")
            .trim();
        } else if (
          content.startsWith("**Learning**:") ||
          content.startsWith("**Learning:**")
        ) {
          currentIssue.learning = content
            .replace(/\*\*Learning\*\*:\s*/, "")
            .trim();
          // Process the complete issue
          if (currentIssue.issue && currentIssue.solution) {
            this.processLearning(currentIssue);
          }
        }
      }
    }
  }

  categorizeSection(header) {
    const categories = {
      build: ["build", "compile", "typescript", "error"],
      api: ["api", "endpoint", "route", "edge function"],
      database: ["database", "supabase", "migration", "sql"],
      ui: ["component", "react", "ui", "frontend"],
      auth: ["auth", "authentication", "user", "session"],
      ai: ["ai", "llm", "gpt", "gemini", "claude"],
      performance: ["performance", "optimization", "cache", "speed"],
      security: ["security", "vulnerability", "protection", "safe"],
    };

    const lowerHeader = header.toLowerCase();
    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some((keyword) => lowerHeader.includes(keyword))) {
        return category;
      }
    }
    return "general";
  }

  processLearning(issue) {
    // Extract tags from content
    const tags = this.extractTags(issue);
    issue.tags = tags;

    // Store by category
    if (!this.categories.has(issue.category)) {
      this.categories.set(issue.category, []);
    }
    this.categories.get(issue.category).push(issue);

    // Detect patterns
    this.detectPatterns(issue);

    // Index solutions
    if (issue.solution) {
      const solutionKey = this.generateSolutionKey(issue.issue);
      this.solutions.set(solutionKey, issue);
    }
  }

  extractTags(issue) {
    const tags = new Set();
    const content =
      `${issue.issue} ${issue.solution} ${issue.learning}`.toLowerCase();

    // Technology tags
    const techKeywords = [
      "typescript",
      "react",
      "nextjs",
      "supabase",
      "edge function",
      "api",
      "database",
      "import",
      "export",
      "type",
      "interface",
    ];

    techKeywords.forEach((keyword) => {
      if (content.includes(keyword)) {
        tags.add(keyword.replace(" ", "-"));
      }
    });

    // Error type tags
    if (content.includes("missing")) tags.add("missing-import");
    if (content.includes("duplicate")) tags.add("duplicate-export");
    if (content.includes("type") && content.includes("mismatch"))
      tags.add("type-mismatch");
    if (content.includes("server") && content.includes("client"))
      tags.add("server-client");

    return Array.from(tags);
  }

  generateSolutionKey(issue) {
    // Create a searchable key from the issue
    return issue
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/)
      .filter((word) => word.length > 3)
      .sort()
      .join("-");
  }

  detectPatterns(issue) {
    // Common error patterns
    const patterns = [
      {
        pattern: /duplicate.*export/i,
        type: "duplicate-export",
        preventionTip: "Use barrel exports carefully and check for conflicts",
      },
      {
        pattern: /missing.*import|cannot find.*module/i,
        type: "missing-import",
        preventionTip: "Verify exact export names and paths",
      },
      {
        pattern: /type.*mismatch|expected.*but.*got/i,
        type: "type-mismatch",
        preventionTip: "Check function signatures and return types",
      },
      {
        pattern: /server.*client|client.*server/i,
        type: "server-client-mix",
        preventionTip: "Keep server operations in server components/actions",
      },
    ];

    patterns.forEach(({ pattern, type, preventionTip }) => {
      if (pattern.test(issue.issue)) {
        if (!this.patterns.has(type)) {
          this.patterns.set(type, {
            count: 0,
            examples: [],
            preventionTip,
          });
        }
        const patternData = this.patterns.get(type);
        patternData.count++;
        patternData.examples.push(issue);
      }
    });
  }

  async generateDigest() {
    // 1. Quick Reference Guide
    const quickRef = this.generateQuickReference();
    await fs.writeFile(
      path.join(this.outputDir, "quick-reference.md"),
      quickRef,
    );

    // 2. Error Pattern Guide
    const errorGuide = this.generateErrorPatternGuide();
    await fs.writeFile(
      path.join(this.outputDir, "error-patterns.md"),
      errorGuide,
    );

    // 3. Category-based Guides
    for (const [category, issues] of this.categories) {
      const guide = this.generateCategoryGuide(category, issues);
      await fs.writeFile(
        path.join(this.outputDir, `${category}-guide.md`),
        guide,
      );
    }

    // 4. Searchable JSON Index
    const searchIndex = this.generateSearchIndex();
    await fs.writeFile(
      path.join(this.outputDir, "search-index.json"),
      JSON.stringify(searchIndex, null, 2),
    );

    // 5. Git Hooks Integration
    await this.generateGitHooks();

    // 6. VS Code Snippets
    await this.generateVSCodeSnippets();

    console.log(`✅ Learning digest generated in ${this.outputDir}`);
  }

  generateQuickReference() {
    let content = "# Quick Reference Guide\n\n";
    content += "Auto-generated from learnings.md\n\n";

    // Most common issues
    content += "## 🔥 Most Common Issues\n\n";
    const sortedPatterns = Array.from(this.patterns.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5);

    sortedPatterns.forEach(([type, data]) => {
      content += `### ${type} (${data.count} occurrences)\n`;
      content += `**Prevention:** ${data.preventionTip}\n\n`;
    });

    // Quick solutions
    content += "## ⚡ Quick Solutions\n\n";
    const recentSolutions = Array.from(this.solutions.values()).slice(-10);
    recentSolutions.forEach((issue) => {
      content += `**Issue:** ${issue.issue}\n`;
      content += `**Fix:** ${issue.solution}\n\n`;
    });

    return content;
  }

  generateErrorPatternGuide() {
    let content = "# Error Pattern Guide\n\n";

    for (const [pattern, data] of this.patterns) {
      content += `## ${pattern}\n\n`;
      content += `**Occurrences:** ${data.count}\n`;
      content += `**Prevention:** ${data.preventionTip}\n\n`;

      content += "### Examples:\n";
      data.examples.slice(0, 3).forEach((example) => {
        content += `- ${example.issue}\n`;
        content += `  - **Fix:** ${example.solution}\n`;
      });
      content += "\n";
    }

    return content;
  }

  generateCategoryGuide(category, issues) {
    let content = `# ${category.charAt(0).toUpperCase() + category.slice(1)} Guide\n\n`;

    // Group by subcategory
    const grouped = {};
    issues.forEach((issue) => {
      const subcat = issue.title || "General";
      if (!grouped[subcat]) grouped[subcat] = [];
      grouped[subcat].push(issue);
    });

    Object.entries(grouped).forEach(([subcat, subIssues]) => {
      content += `## ${subcat}\n\n`;
      subIssues.forEach((issue) => {
        if (issue.issue) content += `**Problem:** ${issue.issue}\n`;
        if (issue.solution) content += `**Solution:** ${issue.solution}\n`;
        if (issue.learning) content += `**Key Learning:** ${issue.learning}\n`;
        content += "\n";
      });
    });

    return content;
  }

  generateSearchIndex() {
    const index = {
      categories: {},
      tags: {},
      solutions: [],
      patterns: {},
    };

    // Index by category
    for (const [category, issues] of this.categories) {
      index.categories[category] = issues.map((i) => ({
        issue: i.issue,
        solution: i.solution,
        tags: i.tags,
      }));
    }

    // Index by tags
    for (const [category, issues] of this.categories) {
      issues.forEach((issue) => {
        issue.tags.forEach((tag) => {
          if (!index.tags[tag]) index.tags[tag] = [];
          index.tags[tag].push({
            category,
            issue: issue.issue,
            solution: issue.solution,
          });
        });
      });
    }

    // Solutions for quick lookup
    for (const [key, issue] of this.solutions) {
      index.solutions.push({
        key,
        issue: issue.issue,
        solution: issue.solution,
        category: issue.category,
      });
    }

    return index;
  }

  async generateGitHooks() {
    const hookContent = `#!/bin/bash
# Auto-generated pre-commit hook to check for known issues

echo "🔍 Checking for known issues from learnings..."

# Check for common patterns
PATTERNS=(
  "export.*from.*['\"]\\./schema['\"]"
  "SignUpData"
  "logger\\.warn\\([^,]+,[^,]+,[^)]+\\)"
)

for pattern in "\${PATTERNS[@]}"; do
  if git diff --cached --name-only | xargs grep -l "$pattern" 2>/dev/null; then
    echo "⚠️  Warning: Found pattern that previously caused issues: $pattern"
    echo "   Check .learning-digest/quick-reference.md for solutions"
  fi
done
`;

    await fs.writeFile(
      path.join(this.outputDir, "pre-commit-check"),
      hookContent,
      { mode: 0o755 },
    );
  }

  async generateVSCodeSnippets() {
    const snippets = {
      "Fix TypeScript Import": {
        prefix: "fixImport",
        body: [
          "// Common import fixes:",
          "// 1. Check exact export name (case-sensitive)",
          "// 2. Verify path is correct",
          "// 3. Ensure module exports what you're importing",
          "import { ${1:ExactName} } from '${2:@package/name}'",
        ],
        description: "Fix common import issues",
      },
      "Server Action Template": {
        prefix: "serverAction",
        body: [
          "'use server'",
          "",
          "import { createClient } from '@/lib/supabase/server'",
          "import { logger } from '@/lib/logger'",
          "",
          "export async function ${1:actionName}(${2:params}) {",
          "  try {",
          "    const supabase = await createClient()",
          "    ${3:// Implementation}",
          "    return { success: true, data: ${4:result} }",
          "  } catch (error) {",
          "    logger.error('${1:actionName} failed', { ${2:params} }, error as Error)",
          "    return { success: false, error: error.message }",
          "  }",
          "}",
        ],
        description: "Create server action with proper error handling",
      },
    };

    await fs.writeFile(
      path.join(this.outputDir, "claimguardian.code-snippets"),
      JSON.stringify(snippets, null, 2),
    );
  }

  async run() {
    await this.init();
    await this.parseLearnins();
    await this.generateDigest();
  }
}

// Run the digest
const digest = new LearningDigest();
digest.run().catch(console.error);
