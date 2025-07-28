# Claude Learning Log

This file tracks discoveries and patterns that should be added to CLAUDE.md.

## Format for entries:
```
## [Date] - [Session Topic]
**Discovery**: What was learned
**Context**: Where/how it was discovered
**Recommendation**: What should be added to CLAUDE.md
**Priority**: High/Medium/Low
```

## Entries

## 2025-01-08 - CLAUDE.md Analysis
**Discovery**: CLAUDE.md references SHARED_AI_GUIDELINES.md but it's not automatically loaded
**Context**: During init command analysis
**Recommendation**: Add critical commands directly to CLAUDE.md
**Priority**: High

## 2025-01-08 - Testing Framework
**Discovery**: Project uses Jest, not Vitest (despite some references)
**Context**: Found in package.json and jest.config.mjs
**Recommendation**: Clarify testing setup in CLAUDE.md
**Priority**: Medium

## 2025-01-08 - Package Namespace
**Discovery**: Uses @claimguardian/* not @mad/*
**Context**: Package.json analysis across monorepo
**Recommendation**: Already added to CLAUDE.md
**Priority**: Completed

---
*Instructions: When Claude discovers new patterns or issues, append to this file*
## 2025-07-08 03:08 - Quick Note
Created automated learning system with shell functions for logging discoveries


## 2025-07-08 03:09 - Command
**Discovery**: pnpm typecheck
**Context**: Purpose: Validates TypeScript across entire monorepo
**Priority**: Low
**Session**: /Users/madengineering/ClaimGuardian

## 2025-07-08 03:14 - Error Pattern
**Discovery**: ESLint config import error: Package subpath './dist/eslintrc.cjs' is not defined by exports
**Context**: File: apps/web/eslint.config.mjs, Solution: Fix ESLint config import path
**Priority**: High
**Session**: /Users/madengineering/ClaimGuardian

## 2025-07-08 03:43 - Quick Note
Successfully fixed ALL TypeScript and ESLint errors across the entire ClaimGuardian monorepo. Project now passes full validation.

