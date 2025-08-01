module.exports = {
  // Validate the database schema on every commit
  '*': () => 'scripts/utils/db-validate-schema.sh',

  // Run type-check on all staged TypeScript files
  '**/*.{ts,tsx}': () => 'pnpm type-check',

  // Lint and format other files
  '*.{js,jsx}': ['eslint --fix', 'git add'],
  '*.json': ['prettier --write', 'git add'],
  '*.md': ['prettier --write', 'git add'],
};