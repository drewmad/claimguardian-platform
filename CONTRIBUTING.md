# Contributing to ClaimGuardian

Thank you for your interest in contributing to ClaimGuardian! We're excited to have you join our mission to empower Florida homeowners with AI-powered property intelligence.

## 📋 Table of Contents
- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Process](#development-process)
- [Code Standards](#code-standards)
- [Testing Guidelines](#testing-guidelines)
- [Pull Request Process](#pull-request-process)
- [Documentation](#documentation)
- [Community](#community)

## 🤝 Code of Conduct

We are committed to providing a welcoming and inclusive environment. All contributors must adhere to our code of conduct:

- **Be respectful** - Value each other's ideas, styles, and viewpoints
- **Be inclusive** - Welcome newcomers and help them get started
- **Be collaborative** - Work together to solve problems
- **Be professional** - Disagree respectfully and avoid personal attacks

## 🚀 Getting Started

### Prerequisites
- Node.js 22+ and pnpm 10.13.1
- Git with configured user name and email
- A GitHub account
- Familiarity with TypeScript and React

### Setup Process

1. **Fork the Repository**
   ```bash
   # Fork via GitHub UI, then clone:
   git clone https://github.com/YOUR_USERNAME/claimguardian.git
   cd claimguardian
   ```

2. **Install Dependencies**
   ```bash
   pnpm install
   ```

3. **Set Up Environment**
   ```bash
   cp .env.example .env.local
   # Configure your environment variables
   ```

4. **Run Development Server**
   ```bash
   pnpm dev
   ```

5. **Verify Setup**
   ```bash
   pnpm validate  # Should pass all checks
   ```

## 💻 Development Process

### 1. Find or Create an Issue
- Check existing issues or create a new one
- Comment on the issue to claim it
- Wait for maintainer approval before starting major work

### 2. Create a Feature Branch
```bash
git checkout -b feature/issue-number-description
# Example: feature/123-add-policy-upload
```

### 3. Make Your Changes
- Write clean, documented code
- Follow existing patterns and conventions
- Keep changes focused and atomic

### 4. Test Your Changes
```bash
pnpm test          # Run tests
pnpm lint          # Check linting
pnpm type-check    # TypeScript validation
pnpm validate      # Run all checks
```

### 5. Commit Your Work
```bash
# Use conventional commits
pnpm cz            # Interactive commit helper

# Or manually:
git commit -m "feat: add policy document upload"
git commit -m "fix: resolve date parsing in claims"
git commit -m "docs: update API documentation"
```

#### Commit Types:
- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `style:` Code style changes (formatting, semicolons, etc.)
- `refactor:` Code refactoring
- `perf:` Performance improvements
- `test:` Test additions or corrections
- `chore:` Maintenance tasks

## 📏 Code Standards

### TypeScript
```typescript
// ✅ Good: Explicit types, no any
interface UserProfile {
  id: string
  email: string
  properties: Property[]
}

// ❌ Bad: Using any
const processData = (data: any) => { ... }
```

### React Components
```typescript
// ✅ Good: Typed props, clear naming
interface DamageAnalyzerProps {
  propertyId: string
  onComplete: (analysis: DamageAnalysis) => void
}

export function DamageAnalyzer({ propertyId, onComplete }: DamageAnalyzerProps) {
  // Component logic
}
```

### File Organization
```
src/
  components/      # React components
    ui/           # Reusable UI components
    features/     # Feature-specific components
  hooks/          # Custom React hooks
  lib/            # Utilities and helpers
  actions/        # Server actions
  types/          # TypeScript types
```

### Import Rules
```typescript
// ✅ Good: Import from package root
import { Button, Card } from '@claimguardian/ui'

// ❌ Bad: Import from subpaths
import { Button } from '@claimguardian/ui/button'
```

## 🧪 Testing Guidelines

### Writing Tests
```typescript
describe('PropertyAnalyzer', () => {
  it('should detect hurricane damage correctly', async () => {
    const result = await analyzeProperty(mockProperty)
    expect(result.risks).toContain('hurricane')
  })
})
```

### Test Coverage
- Aim for >80% coverage on new code
- Focus on critical business logic
- Test edge cases and error scenarios

### Running Tests
```bash
pnpm test                        # All tests
pnpm test:watch                  # Watch mode
pnpm test path/to/file.test.ts   # Specific file
```

## 🔄 Pull Request Process

### 1. Pre-submission Checklist
- [ ] Code follows project style guide
- [ ] All tests pass (`pnpm validate`)
- [ ] Documentation updated if needed
- [ ] Commits follow conventional format
- [ ] Branch is up-to-date with main

### 2. Create Pull Request
- Use a clear, descriptive title
- Reference the issue number (#123)
- Provide detailed description of changes
- Include screenshots for UI changes
- List any breaking changes

### 3. PR Template
```markdown
## Description
Brief description of changes

## Related Issue
Fixes #123

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Manual testing completed
- [ ] No regressions identified

## Screenshots (if applicable)
[Add screenshots here]
```

### 4. Review Process
- Maintainers will review within 48 hours
- Address feedback promptly
- Keep PR updated with main branch
- Be patient and respectful

## 📚 Documentation

### Code Documentation
```typescript
/**
 * Analyzes property images for potential damage using AI
 * @param images - Array of property images
 * @param propertyId - Unique property identifier
 * @returns Analysis results with confidence scores
 */
export async function analyzeDamage(
  images: PropertyImage[],
  propertyId: string
): Promise<DamageAnalysis> {
  // Implementation
}
```

### File Headers
```typescript
/**
 * @fileMetadata
 * @purpose Damage analysis using computer vision
 * @owner ai-team
 * @status active
 */
```

### Updating Documentation
- Keep README.md current
- Update API docs for new endpoints
- Document new environment variables
- Add examples for complex features

## 👥 Community

### Getting Help
- **Discord**: [Join our community](https://discord.gg/claimguardian)
- **Issues**: Check existing issues or create new ones
- **Discussions**: Use GitHub Discussions for questions

### Ways to Contribute
- **Code**: Features, bug fixes, optimizations
- **Documentation**: Guides, API docs, examples
- **Testing**: Write tests, report bugs
- **Design**: UI/UX improvements
- **Translation**: Help internationalize the platform

### Recognition
We value all contributions! Contributors will be:
- Listed in our contributors page
- Mentioned in release notes
- Invited to contributor-only events

## 🎯 Priority Areas

Current areas where we especially need help:
1. **AI Model Integration** - Implementing new AI features
2. **Florida Data Sources** - Adding county-specific integrations
3. **Mobile Responsiveness** - Improving mobile experience
4. **Performance** - Optimizing large dataset handling
5. **Accessibility** - WCAG compliance improvements

## 📞 Contact

- **General Questions**: support@claimguardianai.com
- **Security Issues**: security@claimguardianai.com
- **Partnership**: partners@claimguardianai.com

---

Thank you for contributing to ClaimGuardian! Together, we're building a more resilient future for Florida property owners. 🏠🛡️
