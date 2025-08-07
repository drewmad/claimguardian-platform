# Best Practices for ClaimGuardian Development

Inspired by Agent OS, these are evolving guidelines for efficient, resilient coding with AI agents.

## Development Philosophy

- **TDD First**: Write tests before code; use Jest for all features.
- **Commit Patterns**: Use conventional commits (pnpm cz); small, atomic changes.
- **Refinement Loop**: After tasks, review for patterns; update this file/others.
- **Resilience**: Add error handling, fallbacks (e.g., HUSKY=0 sparingly).
- **Holistic Solving**: Consider workflow; stack speed + parallel + verification per claude.md prefs.
- **Florida Focus**: Prioritize hurricane/flood features; comply with regulations.
- **Team Reviews**: Schedule to consensus on updates.

## Workflow

- Plan product/roadmap before features.
- Create specs before execution.
- Execute with TDD; update learnings.md.

Examples:

- For data imports: Parallelize with verification scripts.
- For AI tools: Simulate integrations; check API keys.

Version changes: Date updates (e.g., 2025-07-28: Added TDD emphasis).
