#!/usr/bin/env node

import { glob } from 'glob';
import { readFile } from 'fs/promises';
import path from 'path';

const directoriesToScan = ['apps', 'packages'];
const fileExtensions = ['.js', '.jsx', '.ts', '.tsx'];
const ignorePatterns = ['**/node_modules/**', '**/dist/**', '**/build/**', '**/.next/**'];

// Required tags for validation
const requiredTags = ['@owner', '@purpose', '@dependencies'];

// Valid values for specific tags
const validValues = {
  '@status': ['experimental', 'stable', 'deprecated', 'refactoring'],
  '@ai-integration': ['openai', 'gemini', 'multi-provider', 'none'],
  '@insurance-context': ['claims', 'policies', 'underwriting', 'fraud-detection'],
  '@florida-specific': ['true', 'false'],
  '@supabase-integration': ['auth', 'database', 'storage', 'edge-functions'],
  '@review-policy': ['strict', 'standard', 'ai-assisted'],
  '@test-strategy': ['unit-only', 'e2e-required', 'property-based', 'integration'],
  '@data-sensitivity': ['public', 'internal', 'confidential', 'restricted']
};

async function validateMetadata() {
  console.log('🔍 Starting metadata validation...\n');
  
  const filesToScan = await glob(`{${directoriesToScan.join(',')}}/**/*.{js,jsx,ts,tsx}`, {
    ignore: ignorePatterns,
  });

  const validationErrors = [];
  const warnings = [];
  let validFiles = 0;

  for (const file of filesToScan) {
    if (!fileExtensions.includes(path.extname(file))) {
      continue;
    }
    
    const content = await readFile(file, 'utf-8');
    
    // Skip files without metadata (they should be caught by audit)
    if (!content.includes('@fileMetadata')) {
      continue;
    }

    const fileErrors = [];
    const fileWarnings = [];

    // Extract metadata block
    const metadataMatch = content.match(/\/\*\*[\s\S]*?@fileMetadata[\s\S]*?\*\//);
    if (!metadataMatch) {
      fileErrors.push('Invalid metadata block format');
      continue;
    }

    const metadata = metadataMatch[0];

    // Check required tags
    for (const tag of requiredTags) {
      if (!metadata.includes(tag)) {
        fileErrors.push(`Missing required tag: ${tag}`);
      }
    }

    // Validate tag values
    for (const [tag, validOptions] of Object.entries(validValues)) {
      const tagMatch = metadata.match(new RegExp(`${tag.replace('@', '\\@')}\\s+([^\\s\\n]+)`));
      if (tagMatch) {
        const value = tagMatch[1].replace(/['"]/g, '');
        if (!validOptions.includes(value)) {
          fileErrors.push(`Invalid value "${value}" for ${tag}. Valid options: ${validOptions.join(', ')}`);
        }
      }
    }

    // Check for proper purpose format (should be quoted string)
    const purposeMatch = metadata.match(/@purpose\s+(.+)/);
    if (purposeMatch) {
      const purpose = purposeMatch[1].trim();
      if (!purpose.startsWith('"') || !purpose.endsWith('"')) {
        fileWarnings.push('@purpose should be a quoted string');
      } else {
        const purposeText = purpose.slice(1, -1);
        if (purposeText.length < 10) {
          fileWarnings.push('@purpose description is too short (minimum 10 characters)');
        }
        if (purposeText.length > 100) {
          fileWarnings.push('@purpose description is too long (maximum 100 characters)');
        }
      }
    }

    // Check dependencies format
    const depsMatch = metadata.match(/@dependencies\s+(\[.*?\])/);
    if (depsMatch) {
      try {
        const deps = JSON.parse(depsMatch[1].replace(/'/g, '"'));
        if (!Array.isArray(deps)) {
          fileErrors.push('@dependencies must be an array');
        }
      } catch (e) {
        fileErrors.push('@dependencies has invalid JSON format');
      }
    }

    if (fileErrors.length > 0) {
      validationErrors.push({ file, errors: fileErrors });
    }
    if (fileWarnings.length > 0) {
      warnings.push({ file, warnings: fileWarnings });
    }
    if (fileErrors.length === 0) {
      validFiles++;
    }
  }

  // Report results
  console.log(`📊 Validation Results:`);
  console.log(`✅ Valid files: ${validFiles}`);
  console.log(`❌ Files with errors: ${validationErrors.length}`);
  console.log(`⚠️  Files with warnings: ${warnings.length}\n`);

  if (validationErrors.length > 0) {
    console.log('❌ VALIDATION ERRORS:\n');
    for (const { file, errors } of validationErrors) {
      console.log(`📄 ${file}`);
      for (const error of errors) {
        console.log(`   ❌ ${error}`);
      }
      console.log('');
    }
  }

  if (warnings.length > 0) {
    console.log('⚠️  WARNINGS:\n');
    for (const { file, warnings: fileWarnings } of warnings) {
      console.log(`📄 ${file}`);
      for (const warning of fileWarnings) {
        console.log(`   ⚠️  ${warning}`);
      }
      console.log('');
    }
  }

  if (validationErrors.length === 0 && warnings.length === 0) {
    console.log('🎉 All metadata is valid!');
    process.exit(0);
  } else if (validationErrors.length === 0) {
    console.log('✅ No validation errors found, only warnings');
    process.exit(0);
  } else {
    console.log(`❌ Found ${validationErrors.length} files with validation errors`);
    process.exit(1);
  }
}

validateMetadata().catch(err => {
  console.error('❌ Validation failed:', err);
  process.exit(1);
});