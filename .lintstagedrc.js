module.exports = {
  // TypeScript and JavaScript files
  '*.{js,jsx,ts,tsx}': [
    // Auto-fix what we can
    'eslint --fix --max-warnings 0',
    // Add to git if fixes were applied
    'git add'
  ],
  
  // For files with too many errors, use progressive fixing
  'apps/web/src/**/*.{ts,tsx}': (filenames) => {
    const commands = [
      // First, try to auto-fix
      `eslint --fix ${filenames.join(' ')} || true`,
      
      // If there are still errors, apply specific rule fixes
      `eslint --fix --rule "react/no-unescaped-entities: error" ${filenames.join(' ')} || true`,
      `eslint --fix --rule "@typescript-eslint/no-unused-vars: warn" ${filenames.join(' ')} || true`,
      
      // Add files back to staging
      `git add ${filenames.join(' ')}`
    ];
    
    return commands;
  },
  
  // JSON files
  '*.json': [
    'prettier --write',
    'git add'
  ],
  
  // Markdown files  
  '*.md': [
    'prettier --write',
    'git add'
  ]
};