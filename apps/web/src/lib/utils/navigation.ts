/**
 * @fileMetadata
 * @owner @platform-team
 * @purpose "Navigation utilities for proper module-based routing"
 * @dependencies []
 * @status stable
 * @ai-integration none
 * @insurance-context navigation
 * @supabase-integration none
 */

import { useRouter } from 'next/navigation'

/**
 * Navigation utility to handle proper back navigation to parent modules
 * instead of using browser history
 */
export const navigationPaths = {
  // Property details -> Property list
  propertyDetail: {
    parentPath: '/dashboard/property',
    parentLabel: 'Properties'
  },

  // Claim details -> Claims list
  claimDetail: {
    parentPath: '/dashboard/claims',
    parentLabel: 'Claims'
  },

  // Claim evidence -> Claim details
  claimEvidence: (claimId: string) => ({
    parentPath: `/dashboard/claims/${claimId}`,
    parentLabel: 'Claim Details'
  }),

  // Personal property item -> Personal property list
  personalPropertyItem: {
    parentPath: '/dashboard/personal-property',
    parentLabel: 'Personal Property'
  },

  // Insurance policy detail -> Insurance dashboard
  insuranceDetail: {
    parentPath: '/dashboard/insurance',
    parentLabel: 'Insurance'
  },

  // AI tool pages -> AI tools hub
  aiTool: {
    parentPath: '/ai-tools',
    parentLabel: 'AI Tools'
  },

  // New claim -> Claims list
  newClaim: {
    parentPath: '/dashboard/claims',
    parentLabel: 'Claims'
  },

  // Home systems detail -> Property detail (with tab)
  homeSystemsDetail: (propertyId: string) => ({
    parentPath: `/dashboard/property/${propertyId}?tab=home-systems`,
    parentLabel: 'Property Details'
  }),

  // Maintenance task -> Maintenance dashboard
  maintenanceTask: {
    parentPath: '/dashboard/maintenance',
    parentLabel: 'Maintenance'
  },

  // Contractor detail -> Contractors list
  contractorDetail: {
    parentPath: '/dashboard/contractors',
    parentLabel: 'Contractors'
  }
}

/**
 * Hook for navigation with proper parent tracking
 */
export function useNavigateToParent(routeType: keyof typeof navigationPaths, params?: any) {
  const router = useRouter()

  const navigateToParent = () => {
    const route = typeof navigationPaths[routeType] === 'function'
      ? navigationPaths[routeType](params)
      : navigationPaths[routeType]

    router.push(route.parentPath)
  }

  const getParentInfo = () => {
    const route = typeof navigationPaths[routeType] === 'function'
      ? navigationPaths[routeType](params)
      : navigationPaths[routeType]

    return route
  }

  return { navigateToParent, getParentInfo }
}
