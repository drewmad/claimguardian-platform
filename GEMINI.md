<!--
@fileMetadata
@purpose Documents the repository tracking and metadata system for the Gemini CLI.
@owner dev-ops
@lastModifiedBy Drew Madison
@lastModifiedDate 2025-07-03T20:39:13-04:00
@status active
@notes Details automated documentation, file metadata, generator scripts, knowledge base, validation, IDE integration, and monitoring.
-->
# Repository Tracking & Metadata System

## 1. Automated Documentation Tracking

### Git Hooks Implementation
**Pre-commit Hook** (`/.git/hooks/pre-commit`):
```bash
#!/bin/bash
# Auto-update documentation on changes
node scripts/update-docs.js
git add docs/structure.md docs/metadata.json
```

**Post-merge Hook** (`/.git/hooks/post-merge`):
```bash
#!/bin/bash
# Update after merges
npm run docs:update
```

### GitHub Actions Workflow
**`.github/workflows/docs-update.yml`**:
```yaml
name: Update Documentation
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  update-docs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout @v3
      - name: Setup Node.js
        uses: actions/setup-node @v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Update documentation
        run: npm run docs:generate
      - name: Commit changes
        uses: stefanzweifel/git-auto-commit-action @v4
        with:
          commit_message: 'docs: auto-update repository structure'
          file_pattern: 'docs/*.md docs/*.json'
```

## 2. File Metadata System

### Metadata Schema
**`docs/metadata-schema.json`**:
```json
{
  "fileMetadata": {
    "type": "object",
    "properties": {
      "purpose": {"type": "string"},
      "owner": {"type": "string"},
      "dependencies": {"type": "array"},
      "exports": {"type": "array"},
      "lastModified": {"type": "string"},
      "complexity": {"type": "string", "enum": ["low", "medium", "high"]},
      "tags": {"type": "array"},
      "status": {"type": "string", "enum": ["active", "deprecated", "experimental"]}
    }
  }
}
```

### Metadata Injection Methods

#### Option 1: Comment-Based Metadata
```javascript
/**
 * @fileMetadata
 * @purpose Authentication service for user management
 * @owner backend-team
 * @dependencies ["crypto", "jwt", "../models/User"]
 * @exports ["authenticate", "generateToken", "validateToken"]
 * @complexity high
 * @tags ["auth", "security", "core"]
 * @status active
 */
```

#### Option 2: Sidecar Files
**`src/auth/service.js.meta`**:
```json
{
  "purpose": "Authentication service for user management",
  "owner": "backend-team",
  "dependencies": ["crypto", "jwt", "../models/User"],
  "exports": ["authenticate", "generateToken", "validateToken"],
  "complexity": "high",
  "tags": ["auth", "security", "core"],
  "status": "active"
}
```

#### Option 3: Centralized Metadata
**`docs/file-registry.json`**:
```json
{
  "files": {
    "src/auth/service.js": {
      "purpose": "Authentication service for user management",
      "owner": "backend-team",
      "dependencies": ["crypto", "jwt", "../models/User"],
      "exports": ["authenticate", "generateToken", "validateToken"],
      "complexity": "high",
      "tags": ["auth", "security", "core"],
      "status": "active",
      "lastAnalyzed": "2025-07-03T10:00:00Z"
    }
  }
}
```

## 3. Documentation Generator Scripts

### Main Documentation Script
**`scripts/update-docs.js`**:
```javascript
const fs = require('fs');
const path = require('path');
const glob = require('glob');

class RepoDocGenerator {
  constructor() {
    this.metadata = {};
    this.structure = {};
  }

  async generateAll() {
    await this.scanRepository();
    await this.extractMetadata();
    await this.generateStructureDoc();
    await this.generateMetadataDoc();
    await this.updateKnowledgeBase();
  }

  async scanRepository() {
    const files = glob.sync('**/*', { 
      ignore: ['node_modules/**', '.git/**', 'dist/**'] 
    });
    
    this.structure = this.buildFileTree(files);
  }

  async extractMetadata() {
    // Extract from comments, sidecar files, or centralized registry
    // Implementation depends on chosen approach
  }

  async generateStructureDoc() {
    const content = this.buildStructureMarkdown();
    fs.writeFileSync('docs/structure.md', content);
  }

  buildStructureMarkdown() {
    return `# Repository Structure

## Overview
- **Last Updated**: ${new Date().toISOString()}
- **Total Files**: ${this.getTotalFiles()}
- **Languages**: ${this.getLanguageBreakdown()}

## Directory Structure
${this.renderFileTree()}

## File Inventory
${this.renderFileInventory()}

## Architecture Analysis
${this.renderArchitectureAnalysis()}
`;
  }
}

module.exports = RepoDocGenerator;
```

### Package.json Scripts
```json
{
  "scripts": {
    "docs:generate": "node scripts/update-docs.js",
    "docs:validate": "node scripts/validate-metadata.js",
    "docs:watch": "nodemon --watch src --exec 'npm run docs:generate'"
  }
}
```

## 4. Living Knowledge Base

### Knowledge Base Structure
**`docs/knowledge-base.md`**:
```markdown
# Repository Knowledge Base

## Coding Standards
- File naming conventions
- Directory structure rules
- Import/export patterns
- Documentation requirements

## Architecture Principles
- Module boundaries
- Dependency management
- Data flow patterns
- Error handling approaches

## File Organization Rules
- Where to place new files
- How to structure modules
- When to create new directories
- Refactoring guidelines

## Metadata Requirements
- Required fields for all files
- Tagging conventions
- Owner assignment rules
- Status lifecycle management
```

### Template Generator
**`scripts/generate-template.js`**:
```javascript
const templates = {
  component: `/**
 * @fileMetadata
 * @purpose [PLACEHOLDER: Component purpose]
 * @owner [PLACEHOLDER: Team name]
 * @dependencies []
 * @exports ["default"]
 * @complexity low
 * @tags ["component", "ui"]
 * @status active
 */`,
  service: `/**
 * @fileMetadata
 * @purpose [PLACEHOLDER: Service purpose]
 * @owner [PLACEHOLDER: Team name]
 * @dependencies []
 * @exports []
 * @complexity medium
 * @tags ["service", "business-logic"]
 * @status active
 */`,
  utility: `/**
 * @fileMetadata
 * @purpose [PLACEHOLDER: Utility purpose]
 * @owner [PLACEHOLDER: Team name]
 * @dependencies []
 * @exports []
 * @complexity low
 * @tags ["utility", "helper"]
 * @status active
 */`
};
```

## 5. Validation & Enforcement

### Metadata Validation
**`scripts/validate-metadata.js`**:
```javascript
const Ajv = require('ajv');
const schema = require('../docs/metadata-schema.json');

class MetadataValidator {
  validate(filePath, metadata) {
    const ajv = new Ajv();
    const validate = ajv.compile(schema.fileMetadata);
    
    if (!validate(metadata)) {
      throw new Error(`Invalid metadata for ${filePath}: ${validate.errors}`);
    }
  }

  checkRequiredFields(metadata) {
    const required = ['purpose', 'owner', 'status'];
    const missing = required.filter(field => !metadata[field]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required fields: ${missing.join(', ')}`);
    }
  }
}
```

### Pre-commit Validation
```bash
#!/bin/bash
# Validate metadata before commit
node scripts/validate-metadata.js
if [ $? -ne 0 ]; then
  echo "Metadata validation failed. Please fix errors before committing."
  exit 1
fi
```

## 6. IDE Integration

### VSCode Extension Configuration
**`.vscode/settings.json`**:
```json
{
  "files.associations": {
    "*.meta": "json"
  },
  "editor.snippets": {
    "javascript": {
      "File Metadata": {
        "prefix": "fmeta",
        "body": [
          "/**",
          " * @fileMetadata",
          " * @purpose ${1:Description}",
          " * @owner ${2:team-name}",
          " * @dependencies [${3:dependencies}]",
          " * @exports [${4:exports}]",
          " * @complexity ${5|low,medium,high|}",
          " * @tags [${6:tags}]",
          " * @status ${7|active,deprecated,experimental|}",
          " */"
        ]
      }
    }
  }
}
```

## 7. Monitoring & Reporting

### Documentation Health Check
**`scripts/health-check.js`**:
```javascript
class DocumentationHealthChecker {
  async checkHealth() {
    const issues = [];
    
    // Check for files without metadata
    const filesWithoutMeta = await this.findFilesWithoutMetadata();
    if (filesWithoutMeta.length > 0) {
      issues.push(`Files missing metadata: ${filesWithoutMeta.length}`);
    }
    
    // Check for outdated documentation
    const lastUpdate = await this.getLastDocumentationUpdate();
    if (this.isOutdated(lastUpdate)) {
      issues.push('Documentation is outdated');
    }
    
    return issues;
  }
}
```

## Implementation Recommendations

### Best Practices
1. **Start with comment-based metadata** - easiest to implement and maintain
2. **Use GitHub Actions** for automated updates on main branch
3. **Implement pre-commit hooks** for validation
4. **Create templates** for common file types
5. **Establish clear ownership** for documentation maintenance

### Rollout Strategy
1. **Phase 1**: Set up basic structure documentation
2. **Phase 2**: Add metadata schema and validation
3. **Phase 3**: Implement automation hooks
4. **Phase 4**: Create living knowledge base
5. **Phase 5**: Add monitoring and reporting

### Required Tools
- **Node.js scripts** for documentation generation
- **GitHub Actions** for CI/CD integration
- **JSON Schema** for metadata validation
- **Git hooks** for automatic updates
- **VSCode snippets** for developer experience

This system provides comprehensive tracking with minimal developer overhead while maintaining up-to-date documentation automatically.
