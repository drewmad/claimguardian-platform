#!/bin/bash

# Fix broken default parameter values from ESLint auto-fix

echo "Fixing broken default parameter values..."

# Fix AnimatedSection components
find apps/web/src/components/landing -name "*.tsx" -type f -exec sed -i '' "s/className = ', delay/className = '', delay/g" {} \;

# Fix other broken className defaults
find apps/web/src/components -name "*.tsx" -type f -exec sed -i '' "s/className = ' }/className = '' }/g" {} \;
find apps/web/src/components -name "*.tsx" -type f -exec sed -i '' "s/className = ' :/className = '' :/g" {} \;

# Fix image-upload-analyzer specific issue
sed -i '' "s/<Card className={cn('p-6 bg-gray-800 border-gray-700', className)}>/<Card className={cn('p-6 bg-gray-800 border-gray-700', className)}>/" apps/web/src/components/ai/image-upload-analyzer.tsx

echo "Fixed default parameter values"