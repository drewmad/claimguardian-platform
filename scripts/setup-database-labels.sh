#!/bin/bash

# Script to create GitHub labels for database CI/CD workflow

echo "Creating GitHub labels for database workflow..."

# Create labels using GitHub CLI
gh label create "database-auto-approved" \
  --description "Schema changes automatically approved by CI" \
  --color "0E8A16" \
  --repo drewmad/claimguardian-platform

gh label create "database-migration-approved" \
  --description "Breaking schema changes manually approved" \
  --color "D93F0B" \
  --repo drewmad/claimguardian-platform

gh label create "database-changes" \
  --description "PR contains database schema modifications" \
  --color "1D76DB" \
  --repo drewmad/claimguardian-platform

echo "✅ Labels created successfully!"