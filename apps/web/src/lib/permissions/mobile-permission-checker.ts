/**
 * @fileMetadata
 * @purpose "Mobile-specific permission checking with offline capability"
 * @dependencies []
 * @owner mobile-team
 * @status stable
 */

import { UserTier } from './permission-checker'

interface MobilePermissionConfig {
  requiresOnline: boolean
  requiresCamera: boolean
  requiresLocation: boolean
  requiresMicrophone: boolean
  storageRequired: number // MB
  aiRequestsRequired: number
}

interface DeviceCapabilities {
  hasCamera: boolean
  hasGPS: boolean
  hasMicrophone: boolean
  isOnline: boolean
  storageAvailable: number
  batteryLevel: number
}

const MOBILE_FEATURE_PERMISSIONS: Record<string, MobilePermissionConfig> = {
  // Damage Documentation
  'mobile_damage_photo': {
    requiresOnline: false,
    requiresCamera: true,
    requiresLocation: true,
    requiresMicrophone: false,
    storageRequired: 5, // 5MB per photo session
    aiRequestsRequired: 0
  },
  'mobile_damage_analysis': {
    requiresOnline: true,
    requiresCamera: true,
    requiresLocation: true,
    requiresMicrophone: false,
    storageRequired: 10,
    aiRequestsRequired: 1
  },

  // Property Inspection
  'mobile_property_inspection': {
    requiresOnline: false,
    requiresCamera: true,
    requiresLocation: true,
    requiresMicrophone: true,
    storageRequired: 20, // Video + photos
    aiRequestsRequired: 0
  },
  'mobile_inspection_report': {
    requiresOnline: true,
    requiresCamera: false,
    requiresLocation: false,
    requiresMicrophone: false,
    storageRequired: 5,
    aiRequestsRequired: 2 // Generate report + analysis
  },

  // Inventory Management
  'mobile_inventory_scan': {
    requiresOnline: false,
    requiresCamera: true,
    requiresLocation: false,
    requiresMicrophone: false,
    storageRequired: 3,
    aiRequestsRequired: 0
  },
  'mobile_barcode_scan': {
    requiresOnline: true,
    requiresCamera: true,
    requiresLocation: false,
    requiresMicrophone: false,
    storageRequired: 1,
    aiRequestsRequired: 1 // Product lookup
  },

  // Maintenance Logs
  'mobile_maintenance_log': {
    requiresOnline: false,
    requiresCamera: true,
    requiresLocation: true,
    requiresMicrophone: true,
    storageRequired: 15,
    aiRequestsRequired: 0
  },
  'mobile_maintenance_schedule': {
    requiresOnline: true,
    requiresCamera: false,
    requiresLocation: false,
    requiresMicrophone: false,
    storageRequired: 1,
    aiRequestsRequired: 1 // Smart scheduling
  },

  // Advanced Features
  'mobile_video_documentation': {
    requiresOnline: false,
    requiresCamera: true,
    requiresLocation: true,
    requiresMicrophone: true,
    storageRequired: 50, // Video files are large
    aiRequestsRequired: 0
  },
  'mobile_offline_sync': {
    requiresOnline: false,
    requiresCamera: false,
    requiresLocation: false,
    requiresMicrophone: false,
    storageRequired: 100, // Cache for offline work
    aiRequestsRequired: 0
  },
  'mobile_bulk_upload': {
    requiresOnline: true,
    requiresCamera: false,
    requiresLocation: false,
    requiresMicrophone: false,
    storageRequired: 0,
    aiRequestsRequired: 0
  }
}

// Tier-based mobile feature access
const TIER_MOBILE_FEATURES: Record<UserTier, string[]> = {
  free: [
    'mobile_damage_photo',
    'mobile_inventory_scan',
    'mobile_maintenance_log'
  ],
  renter: [
    'mobile_damage_photo',
    'mobile_damage_analysis',
    'mobile_inventory_scan',
    'mobile_barcode_scan',
    'mobile_maintenance_log'
  ],
  essential: [
    'mobile_damage_photo',
    'mobile_damage_analysis',
    'mobile_property_inspection',
    'mobile_inspection_report',
    'mobile_inventory_scan',
    'mobile_barcode_scan',
    'mobile_maintenance_log',
    'mobile_maintenance_schedule',
    'mobile_offline_sync'
  ],
  plus: [
    'mobile_damage_photo',
    'mobile_damage_analysis',
    'mobile_property_inspection',
    'mobile_inspection_report',
    'mobile_inventory_scan',
    'mobile_barcode_scan',
    'mobile_maintenance_log',
    'mobile_maintenance_schedule',
    'mobile_video_documentation',
    'mobile_offline_sync',
    'mobile_bulk_upload'
  ],
  pro: [
    // All features available
    ...Object.keys(MOBILE_FEATURE_PERMISSIONS)
  ]
}

export interface MobilePermissionResult {
  allowed: boolean
  reason?: string
  requirements: {
    deviceCapabilities: string[]
    userUpgrades: string[]
    resourceLimits: string[]
  }
  fallbackOptions: string[]
}

export class MobilePermissionChecker {
  /**
   * Check if user can access a mobile feature
   */
  static canAccessMobileFeature(
    userTier: UserTier,
    feature: string,
    deviceCapabilities: DeviceCapabilities,
    currentUsage: {
      storageUsedMB: number
      aiRequestsThisMonth: number
      storageLimit: number
      aiRequestsLimit: number
    }
  ): MobilePermissionResult {
    const result: MobilePermissionResult = {
      allowed: false,
      requirements: {
        deviceCapabilities: [],
        userUpgrades: [],
        resourceLimits: []
      },
      fallbackOptions: []
    }

    // Check if tier has access to this feature
    const tierFeatures = TIER_MOBILE_FEATURES[userTier] || []
    if (!tierFeatures.includes(feature)) {
      result.reason = `${feature} requires a higher tier subscription`
      result.requirements.userUpgrades.push(`Upgrade from ${userTier} to access this feature`)
      result.fallbackOptions.push('View pricing plans')
      return result
    }

    const config = MOBILE_FEATURE_PERMISSIONS[feature]
    if (!config) {
      result.reason = 'Unknown mobile feature'
      return result
    }

    // Check device capabilities
    if (config.requiresCamera && !deviceCapabilities.hasCamera) {
      result.requirements.deviceCapabilities.push('Camera access required')
    }

    if (config.requiresLocation && !deviceCapabilities.hasGPS) {
      result.requirements.deviceCapabilities.push('Location access required')
    }

    if (config.requiresMicrophone && !deviceCapabilities.hasMicrophone) {
      result.requirements.deviceCapabilities.push('Microphone access required')
    }

    if (config.requiresOnline && !deviceCapabilities.isOnline) {
      result.requirements.deviceCapabilities.push('Internet connection required')
      result.fallbackOptions.push('Save for offline sync when online')
    }

    // Check resource limits
    const storageNeeded = currentUsage.storageUsedMB + config.storageRequired
    if (storageNeeded > currentUsage.storageLimit) {
      result.requirements.resourceLimits.push(
        `Storage: Need ${config.storageRequired}MB, but only ${currentUsage.storageLimit - currentUsage.storageUsedMB}MB available`
      )
      result.fallbackOptions.push('Upgrade storage plan')
      result.fallbackOptions.push('Clear some existing files')
    }

    const aiRequestsNeeded = currentUsage.aiRequestsThisMonth + config.aiRequestsRequired
    if (aiRequestsNeeded > currentUsage.aiRequestsLimit) {
      result.requirements.resourceLimits.push(
        `AI requests: Need ${config.aiRequestsRequired} more, but limit reached (${currentUsage.aiRequestsLimit}/month)`
      )
      result.fallbackOptions.push('Upgrade AI requests limit')
      result.fallbackOptions.push('Wait until next month')
    }

    // Battery check for intensive operations
    if ((config.requiresCamera || config.storageRequired > 20) && deviceCapabilities.batteryLevel < 20) {
      result.requirements.deviceCapabilities.push('Low battery - charge device for intensive operations')
      result.fallbackOptions.push('Use power-saving mode')
    }

    // Determine if allowed
    const hasAllRequirements =
      result.requirements.deviceCapabilities.length === 0 &&
      result.requirements.userUpgrades.length === 0 &&
      result.requirements.resourceLimits.length === 0

    result.allowed = hasAllRequirements

    if (!result.allowed && !result.reason) {
      result.reason = 'Missing required capabilities or resources'
    }

    return result
  }

  /**
   * Get recommended features for a user's tier and device
   */
  static getRecommendedFeatures(
    userTier: UserTier,
    deviceCapabilities: DeviceCapabilities
  ): { available: string[], upgrade_required: string[] } {
    const tierFeatures = TIER_MOBILE_FEATURES[userTier] || []
    const available: string[] = []
    const upgrade_required: string[] = []

    // Check available features
    tierFeatures.forEach(feature => {
      const config = MOBILE_FEATURE_PERMISSIONS[feature]
      if (!config) return

      const deviceSupported =
        (!config.requiresCamera || deviceCapabilities.hasCamera) &&
        (!config.requiresLocation || deviceCapabilities.hasGPS) &&
        (!config.requiresMicrophone || deviceCapabilities.hasMicrophone) &&
        (!config.requiresOnline || deviceCapabilities.isOnline)

      if (deviceSupported) {
        available.push(feature)
      }
    })

    // Check features available in higher tiers
    const allTiers: UserTier[] = ['free', 'renter', 'essential', 'plus', 'pro']
    const currentTierIndex = allTiers.indexOf(userTier)

    for (let i = currentTierIndex + 1; i < allTiers.length; i++) {
      const higherTier = allTiers[i]
      const higherTierFeatures = TIER_MOBILE_FEATURES[higherTier] || []

      higherTierFeatures.forEach(feature => {
        if (!tierFeatures.includes(feature) && !upgrade_required.includes(feature)) {
          upgrade_required.push(feature)
        }
      })
    }

    return { available, upgrade_required }
  }

  /**
   * Get storage requirements for a feature set
   */
  static calculateStorageRequirements(features: string[]): number {
    return features.reduce((total, feature) => {
      const config = MOBILE_FEATURE_PERMISSIONS[feature]
      return total + (config?.storageRequired || 0)
    }, 0)
  }

  /**
   * Get AI request requirements for a feature set
   */
  static calculateAIRequirements(features: string[]): number {
    return features.reduce((total, feature) => {
      const config = MOBILE_FEATURE_PERMISSIONS[feature]
      return total + (config?.aiRequestsRequired || 0)
    }, 0)
  }

  /**
   * Check if feature can work offline
   */
  static canWorkOffline(feature: string): boolean {
    const config = MOBILE_FEATURE_PERMISSIONS[feature]
    return config ? !config.requiresOnline : false
  }

  /**
   * Get offline-capable features for a tier
   */
  static getOfflineFeatures(userTier: UserTier): string[] {
    const tierFeatures = TIER_MOBILE_FEATURES[userTier] || []
    return tierFeatures.filter(feature => this.canWorkOffline(feature))
  }
}

export { MOBILE_FEATURE_PERMISSIONS, TIER_MOBILE_FEATURES }
