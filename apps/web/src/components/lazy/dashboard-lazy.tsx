/**
 * @fileMetadata
 * @purpose "Lazy loading components for dashboard pages to improve initial bundle size"
 * @dependencies ["next/dynamic", "react"]
 * @exports ["LazyDashboard*"]
 * @owner performance-team
 * @status stable
 */

import dynamic from 'next/dynamic'
import React from 'react'
import { ComponentType } from 'react'

// Loading components for different dashboard sections
const DashboardLoadingCard = () => (
  <div className="animate-pulse bg-gray-800 rounded-lg border border-gray-700 p-6">
    <div className="h-4 bg-gray-700 rounded w-1/4 mb-4"></div>
    <div className="h-8 bg-gray-700 rounded w-1/2 mb-2"></div>
    <div className="h-3 bg-gray-700 rounded w-3/4"></div>
  </div>
)

const DashboardLoadingGrid = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {Array.from({ length: 6 }, (_, i) => (
      <DashboardLoadingCard key={i} />
    ))}
  </div>
)

const DashboardLoadingTable = () => (
  <div className="animate-pulse bg-gray-800 rounded-lg border border-gray-700">
    <div className="p-4 border-b border-gray-700">
      <div className="h-4 bg-gray-700 rounded w-1/3"></div>
    </div>
    <div className="p-4 space-y-3">
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="flex space-x-4">
          <div className="h-3 bg-gray-700 rounded w-1/4"></div>
          <div className="h-3 bg-gray-700 rounded w-1/3"></div>
          <div className="h-3 bg-gray-700 rounded w-1/5"></div>
          <div className="h-3 bg-gray-700 rounded w-1/6"></div>
        </div>
      ))}
    </div>
  </div>
)

// Property Management Pages
export const LazyPropertiesPage = dynamic(
  () => import('@/app/dashboard/properties/page').then(mod => ({ default: mod.default })),
  {
    loading: () => <DashboardLoadingGrid />,
    ssr: false
  }
)

export const LazyPropertyDetailPage = dynamic(
  () => import('@/app/dashboard/property/[id]/page').then(mod => ({ default: mod.default })),
  {
    loading: () => <DashboardLoadingCard />,
    ssr: false
  }
)

export const LazyPersonalPropertyPage = dynamic(
  () => import('@/app/dashboard/personal-property/page').then(mod => ({ default: mod.default })),
  {
    loading: () => <DashboardLoadingGrid />,
    ssr: false
  }
)

// Claims Management Pages
export const LazyClaimsPage = dynamic(
  () => import('@/app/dashboard/claims/page').then(mod => ({ default: mod.default })),
  {
    loading: () => <DashboardLoadingTable />,
    ssr: false
  }
)

export const LazyClaimDetailPage = dynamic(
  () => import('@/app/dashboard/claims/[id]/page').then(mod => ({ default: mod.default })),
  {
    loading: () => <DashboardLoadingCard />,
    ssr: false
  }
)

// Insurance Management Pages
export const LazyInsurancePage = dynamic(
  () => import('@/app/dashboard/insurance/page').then(mod => ({ default: mod.default })),
  {
    loading: () => <DashboardLoadingGrid />,
    ssr: false
  }
)

export const LazyPoliciesPage = dynamic(
  () => import('@/app/dashboard/policies/page').then(mod => ({ default: mod.default })),
  {
    loading: () => <DashboardLoadingTable />,
    ssr: false
  }
)

// Maintenance & Systems Pages
export const LazyMaintenancePage = dynamic(
  () => import('@/app/dashboard/maintenance/page').then(mod => ({ default: mod.default })),
  {
    loading: () => <DashboardLoadingGrid />,
    ssr: false
  }
)

export const LazyHomeSystemsPage = dynamic(
  () => import('@/app/dashboard/home-systems/page').then(mod => ({ default: mod.default })),
  {
    loading: () => <DashboardLoadingGrid />,
    ssr: false
  }
)

export const LazyWarrantyWatchPage = dynamic(
  () => import('@/app/dashboard/warranty-watch/page').then(mod => ({ default: mod.default })),
  {
    loading: () => <DashboardLoadingTable />,
    ssr: false
  }
)

// Community & Disaster Pages
export const LazyCommunityPage = dynamic(
  () => import('@/app/dashboard/community/page').then(mod => ({ default: mod.default })),
  {
    loading: () => <DashboardLoadingGrid />,
    ssr: false
  }
)

export const LazyDisasterPage = dynamic(
  () => import('@/app/dashboard/disaster/page').then(mod => ({ default: mod.default })),
  {
    loading: () => <DashboardLoadingGrid />,
    ssr: false
  }
)

export const LazyContractorsPage = dynamic(
  () => import('@/app/dashboard/contractors/page').then(mod => ({ default: mod.default })),
  {
    loading: () => <DashboardLoadingTable />,
    ssr: false
  }
)

// Administrative Pages
export const LazyBillingPage = dynamic(
  () => import('@/app/dashboard/billing/page').then(mod => ({ default: mod.default })),
  {
    loading: () => <DashboardLoadingCard />,
    ssr: false
  }
)

export const LazyAPIKeysPage = dynamic(
  () => import('@/app/dashboard/api-keys/page').then(mod => ({ default: mod.default })),
  {
    loading: () => <DashboardLoadingCard />,
    ssr: false
  }
)

// AI Tools Pages (high-impact lazy loading)
export const LazyAIToolsHub = dynamic(
  () => import('@/app/ai-tools/page').then(mod => ({ default: mod.default })),
  {
    loading: () => <DashboardLoadingGrid />,
    ssr: false
  }
)

export const LazyDamageAnalyzer = dynamic(
  () => import('@/app/ai-tools/damage-analyzer/page').then(mod => ({ default: mod.default })),
  {
    loading: () => <DashboardLoadingCard />,
    ssr: false
  }
)

export const LazyPolicyChat = dynamic(
  () => import('@/app/ai-tools/policy-chat/page').then(mod => ({ default: mod.default })),
  {
    loading: () => <DashboardLoadingCard />,
    ssr: false
  }
)

export const LazyInventoryScanner = dynamic(
  () => import('@/app/ai-tools/inventory-scanner/page').then(mod => ({ default: mod.default })),
  {
    loading: () => <DashboardLoadingGrid />,
    ssr: false
  }
)

// Analytics and Reporting Pages
export const LazyExpensesPage = dynamic(
  () => import('@/app/dashboard/expenses/page').then(mod => ({ default: mod.default })),
  {
    loading: () => <DashboardLoadingTable />,
    ssr: false
  }
)

// Settings and Account Pages
export const LazyProfilePage = dynamic(
  () => import('@/app/account/profile/page').then(mod => ({ default: mod.default })),
  {
    loading: () => <DashboardLoadingCard />,
    ssr: false
  }
)

export const LazyLoginActivityPage = dynamic(
  () => import('@/app/account/login-activity/page').then(mod => ({ default: mod.default })),
  {
    loading: () => <DashboardLoadingTable />,
    ssr: false
  }
)

// Mobile-specific pages
export const LazyMobileFieldPage = dynamic(
  () => import('@/app/mobile/field/page').then(mod => ({ default: mod.default })),
  {
    loading: () => <DashboardLoadingCard />,
    ssr: false
  }
)

// Bundle splitting utility for route-based chunks
export const createLazyRoute = <P = Record<string, never>>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  fallback?: ComponentType
) => {
  return dynamic(importFn, {
    loading: () => fallback ? React.createElement(fallback) : <DashboardLoadingCard />,
    ssr: false
  })
}

// Performance monitoring helper
export const trackLazyLoadPerformance = (componentName: string) => {
  if (typeof window !== 'undefined' && window.performance) {
    const navigationStart = window.performance.timing.navigationStart
    const now = Date.now()
    const loadTime = now - navigationStart

    // Send to analytics
    console.log(`[Performance] ${componentName} lazy loaded in ${loadTime}ms`)

    // Track in production monitoring
    if (process.env.NODE_ENV === 'production') {
      // Integration with monitoring system
      window.gtag?.('event', 'lazy_load_performance', {
        component: componentName,
        load_time: loadTime,
        category: 'performance'
      })
    }
  }
}

// Export loading components for reuse
export {
  DashboardLoadingCard,
  DashboardLoadingGrid,
  DashboardLoadingTable
}
