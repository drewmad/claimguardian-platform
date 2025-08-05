#!/bin/bash

# Deploy Claude Error Monitoring System to Production
# Usage: ./scripts/deploy-monitoring.sh

set -e

echo "🚀 Deploying Claude Error Monitoring System to Production"
echo "=================================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Check if required environment variables are set
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
    echo "⚠️  Warning: Supabase environment variables not detected"
    echo "   Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set"
fi

echo "📋 Pre-deployment Checks"
echo "------------------------"

# Check if TypeScript compiles
echo "🔍 Checking TypeScript compilation..."
if ! pnpm type-check > /dev/null 2>&1; then
    echo "❌ TypeScript compilation failed. Please fix type errors first."
    exit 1
fi
echo "✅ TypeScript compilation successful"

# Check if monitoring files exist
echo "🔍 Verifying monitoring system files..."
monitoring_files=(
    "apps/web/src/lib/claude/production-error-monitor.ts"
    "apps/web/src/lib/claude/log-processor.ts"
    "apps/web/src/lib/claude/monitoring-deployment.ts"
    "apps/web/src/components/admin/claude-learning-dashboard.tsx"
)

for file in "${monitoring_files[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ Missing required file: $file"
        exit 1
    fi
done
echo "✅ All monitoring system files present"

# Build the application
echo "🏗️  Building application..."
if ! pnpm build > /dev/null 2>&1; then
    echo "❌ Build failed. Please fix build errors first."
    exit 1
fi
echo "✅ Build successful"

echo ""
echo "🚀 Deploying Monitoring System"
echo "------------------------------"

# Deploy monitoring system using Node.js
cat > deploy-monitoring.mjs << 'EOF'
import { deployProductionMonitoring, getMonitoringStatus } from './apps/web/src/lib/claude/monitoring-deployment.js'

console.log('🔄 Initializing monitoring deployment...')

try {
    await deployProductionMonitoring()
    
    console.log('')
    console.log('📊 Final Status Check:')
    console.log('======================')
    getMonitoringStatus()
    
    console.log('')
    console.log('🎉 Deployment Complete!')
    console.log('📱 Access monitoring dashboard at: /admin')
    console.log('📊 View "Production Monitoring" tab for real-time status')
    console.log('')
    console.log('🔍 Monitoring Features Now Active:')
    console.log('  - Database health checks every 30 minutes')
    console.log('  - Error pattern analysis every 15 minutes')
    console.log('  - Proactive alerting for critical issues')
    console.log('  - Learning integration from production errors')
    console.log('')
    console.log('📝 Next Steps:')
    console.log('  1. Monitor dashboard for any initial alerts')
    console.log('  2. Test policy upload functionality')
    console.log('  3. Review learning patterns as they develop')
    
} catch (error) {
    console.error('❌ Deployment failed:', error.message)
    process.exit(1)
}
EOF

# Run the deployment
echo "🚀 Executing deployment..."
node deploy-monitoring.mjs

# Cleanup temporary file
rm -f deploy-monitoring.mjs

echo ""
echo "✅ Monitoring System Deployment Complete!"
echo "========================================="
echo ""
echo "🔗 Quick Links:"
echo "  Admin Dashboard: /admin"
echo "  Production Monitoring Tab: /admin (select 'Production Monitoring')"
echo ""
echo "📈 What's Now Active:"
echo "  ✅ Automated database health checks"
echo "  ✅ Real-time error pattern detection"
echo "  ✅ Production error learning integration"
echo "  ✅ Proactive alerting system"
echo ""
echo "🎯 Next Recommended Actions:"
echo "  1. Visit admin dashboard to verify monitoring status"
echo "  2. Test policy document upload functionality"
echo "  3. Monitor for any new error patterns"
echo "  4. Review Claude learning improvements over time"
echo ""
echo "📞 Support:"
echo "  - Check logs: pnpm logs or browser console"
echo "  - Health status: Available in admin dashboard"
echo "  - Manual checks: Use monitoring API endpoints"