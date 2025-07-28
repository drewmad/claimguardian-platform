#!/usr/bin/env node

/**
 * Script to help maintain CLAUDE.md with new discoveries
 * Usage: node scripts/update-claude-md.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const CLAUDE_MD_PATH = path.join(__dirname, '..', 'CLAUDE.md');
const SUGGESTIONS_PATH = path.join(__dirname, '..', '.ai-context', 'claude-suggestions.json');

// Read existing suggestions
function readSuggestions() {
  if (!fs.existsSync(SUGGESTIONS_PATH)) {
    return [];
  }
  return JSON.parse(fs.readFileSync(SUGGESTIONS_PATH, 'utf8'));
}

// Add new suggestion
function addSuggestion(suggestion) {
  const suggestions = readSuggestions();
  suggestions.push({
    ...suggestion,
    date: new Date().toISOString(),
    status: 'pending'
  });
  fs.writeFileSync(SUGGESTIONS_PATH, JSON.stringify(suggestions, null, 2));
  console.log('✅ Suggestion added to', SUGGESTIONS_PATH);
}

// Review and apply suggestions
async function reviewSuggestions() {
  const suggestions = readSuggestions();
  const pending = suggestions.filter(s => s.status === 'pending');
  
  if (pending.length === 0) {
    console.log('No pending suggestions');
    return;
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log(`\n📋 ${pending.length} pending suggestions:\n`);
  
  for (const suggestion of pending) {
    console.log(`Date: ${suggestion.date}`);
    console.log(`Type: ${suggestion.type}`);
    console.log(`Description: ${suggestion.description}`);
    console.log(`Content to add:\n${suggestion.content}\n`);
    
    const answer = await new Promise(resolve => {
      rl.question('Apply this suggestion? (y/n/skip): ', resolve);
    });

    if (answer.toLowerCase() === 'y') {
      // Apply the suggestion
      applyToClaudeMd(suggestion);
      suggestion.status = 'applied';
    } else if (answer.toLowerCase() === 'n') {
      suggestion.status = 'rejected';
    }
  }

  rl.close();
  fs.writeFileSync(SUGGESTIONS_PATH, JSON.stringify(suggestions, null, 2));
}

function applyToClaudeMd(suggestion) {
  const content = fs.readFileSync(CLAUDE_MD_PATH, 'utf8');
  // Add logic to insert content in appropriate section
  console.log('✅ Applied suggestion to CLAUDE.md');
}

// CLI interface
const command = process.argv[2];

if (command === 'add') {
  // Example: node update-claude-md.js add "command" "pnpm fix:imports - Fix import paths"
  addSuggestion({
    type: process.argv[3],
    description: process.argv[4],
    content: process.argv[5]
  });
} else if (command === 'review') {
  reviewSuggestions();
} else {
  console.log(`
Usage:
  node scripts/update-claude-md.js add <type> <description> <content>
  node scripts/update-claude-md.js review
  `);
}