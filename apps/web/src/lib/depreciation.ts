/**
 * @fileMetadata
 * @purpose "Depreciation calculation utilities for personal property"
 * @dependencies []
 * @owner frontend-team
 * @status stable
 */

export interface DepreciationSchedule {
  category: string
  method: 'straight-line' | 'declining-balance' | 'custom'
  lifeYears: number
  salvagePercent: number // Percentage of original value at end of life
  alertThresholds: {
    maintenanceYears?: number[]
    replacementYear?: number
    valueThresholds?: number[] // Alert when value drops below these percentages
  }
}

// Standard depreciation schedules by category
export const DEPRECIATION_SCHEDULES: Record<string, DepreciationSchedule> = {
  electronics: {
    category: 'electronics',
    method: 'declining-balance',
    lifeYears: 5,
    salvagePercent: 10,
    alertThresholds: {
      maintenanceYears: [2, 4],
      replacementYear: 5,
      valueThresholds: [50, 25]
    }
  },
  jewelry: {
    category: 'jewelry',
    method: 'custom', // Jewelry often appreciates or holds value
    lifeYears: 50,
    salvagePercent: 80,
    alertThresholds: {
      maintenanceYears: [5, 10, 15, 20],
      valueThresholds: []
    }
  },
  furniture: {
    category: 'furniture',
    method: 'straight-line',
    lifeYears: 10,
    salvagePercent: 20,
    alertThresholds: {
      maintenanceYears: [3, 6, 9],
      replacementYear: 10,
      valueThresholds: [50]
    }
  },
  clothing: {
    category: 'clothing',
    method: 'declining-balance',
    lifeYears: 3,
    salvagePercent: 5,
    alertThresholds: {
      replacementYear: 3,
      valueThresholds: [30]
    }
  },
  collectibles: {
    category: 'collectibles',
    method: 'custom', // Often appreciates
    lifeYears: 100,
    salvagePercent: 120, // Can appreciate
    alertThresholds: {
      maintenanceYears: [10, 20, 30]
    }
  },
  vehicles: {
    category: 'vehicles',
    method: 'declining-balance',
    lifeYears: 10,
    salvagePercent: 15,
    alertThresholds: {
      maintenanceYears: [1, 2, 3, 4, 5],
      replacementYear: 10,
      valueThresholds: [70, 50, 30]
    }
  },
  instruments: {
    category: 'instruments',
    method: 'straight-line',
    lifeYears: 20,
    salvagePercent: 40,
    alertThresholds: {
      maintenanceYears: [2, 5, 10, 15],
      valueThresholds: [75, 50]
    }
  },
  sports: {
    category: 'sports',
    method: 'declining-balance',
    lifeYears: 5,
    salvagePercent: 10,
    alertThresholds: {
      maintenanceYears: [2, 4],
      replacementYear: 5,
      valueThresholds: [50]
    }
  },
  kitchen: {
    category: 'kitchen',
    method: 'straight-line',
    lifeYears: 8,
    salvagePercent: 10,
    alertThresholds: {
      maintenanceYears: [3, 6],
      replacementYear: 8,
      valueThresholds: [50, 25]
    }
  },
  tools: {
    category: 'tools',
    method: 'straight-line',
    lifeYears: 15,
    salvagePercent: 25,
    alertThresholds: {
      maintenanceYears: [5, 10],
      replacementYear: 15,
      valueThresholds: [50]
    }
  }
}

export function calculateDepreciation(
  purchasePrice: number,
  purchaseDate: string,
  category: string,
  customSchedule?: DepreciationSchedule
): {
  currentValue: number
  depreciationAmount: number
  depreciationPercent: number
  ageYears: number
  remainingLifeYears: number
} {
  const schedule = customSchedule || DEPRECIATION_SCHEDULES[category] || DEPRECIATION_SCHEDULES.electronics
  const purchaseDateObj = new Date(purchaseDate)
  const now = new Date()
  const ageMonths = (now.getFullYear() - purchaseDateObj.getFullYear()) * 12 +
                    (now.getMonth() - purchaseDateObj.getMonth())
  const ageYears = ageMonths / 12

  let currentValue = purchasePrice
  const salvageValue = purchasePrice * (schedule.salvagePercent / 100)

  if (schedule.method === 'straight-line') {
    // Straight-line depreciation
    const annualDepreciation = (purchasePrice - salvageValue) / schedule.lifeYears
    const totalDepreciation = Math.min(annualDepreciation * ageYears, purchasePrice - salvageValue)
    currentValue = purchasePrice - totalDepreciation
  } else if (schedule.method === 'declining-balance') {
    // Declining balance depreciation (accelerated)
    const rate = 2 / schedule.lifeYears // Double declining balance
    for (let year = 0; year < Math.floor(ageYears); year++) {
      currentValue = Math.max(currentValue * (1 - rate), salvageValue)
    }
    // Handle partial year
    const partialYear = ageYears % 1
    if (partialYear > 0) {
      currentValue = Math.max(currentValue * (1 - rate * partialYear), salvageValue)
    }
  } else if (schedule.method === 'custom') {
    // Custom depreciation (for items that may appreciate)
    if (schedule.salvagePercent > 100) {
      // Appreciating asset
      const appreciationRate = (schedule.salvagePercent - 100) / 100 / schedule.lifeYears
      currentValue = purchasePrice * (1 + appreciationRate * ageYears)
    } else {
      // Use straight-line for custom
      const annualDepreciation = (purchasePrice - salvageValue) / schedule.lifeYears
      const totalDepreciation = Math.min(annualDepreciation * ageYears, purchasePrice - salvageValue)
      currentValue = purchasePrice - totalDepreciation
    }
  }

  const depreciationAmount = purchasePrice - currentValue
  const depreciationPercent = (depreciationAmount / purchasePrice) * 100
  const remainingLifeYears = Math.max(0, schedule.lifeYears - ageYears)

  return {
    currentValue: Math.round(currentValue * 100) / 100,
    depreciationAmount: Math.round(depreciationAmount * 100) / 100,
    depreciationPercent: Math.round(depreciationPercent * 10) / 10,
    ageYears: Math.round(ageYears * 10) / 10,
    remainingLifeYears: Math.round(remainingLifeYears * 10) / 10
  }
}

export interface DepreciationAlert {
  type: 'maintenance' | 'replacement' | 'value-threshold'
  severity: 'info' | 'warning' | 'critical'
  title: string
  description: string
  actionRequired?: string
  dueDate?: Date
}

export function getDepreciationAlerts(
  item: {
    purchasePrice: number
    purchaseDate: string
    category: string
    name: string
  },
  customSchedule?: DepreciationSchedule
): DepreciationAlert[] {
  const alerts: DepreciationAlert[] = []
  const schedule = customSchedule || DEPRECIATION_SCHEDULES[item.category] || DEPRECIATION_SCHEDULES.electronics
  const depreciation = calculateDepreciation(item.purchasePrice, item.purchaseDate, item.category, customSchedule)

  // Check maintenance alerts
  if (schedule.alertThresholds.maintenanceYears) {
    for (const year of schedule.alertThresholds.maintenanceYears) {
      const monthsUntil = (year * 12) - (depreciation.ageYears * 12)
      if (monthsUntil > -3 && monthsUntil <= 3) { // Within 3 months
        alerts.push({
          type: 'maintenance',
          severity: monthsUntil <= 0 ? 'warning' : 'info',
          title: `${item.name} Maintenance Due`,
          description: `This item is ${year} years old and may need maintenance or inspection`,
          actionRequired: 'Schedule maintenance check',
          dueDate: new Date(new Date(item.purchaseDate).setFullYear(new Date(item.purchaseDate).getFullYear() + year))
        })
      }
    }
  }

  // Check replacement alerts
  if (schedule.alertThresholds.replacementYear) {
    const yearsUntilReplacement = schedule.alertThresholds.replacementYear - depreciation.ageYears
    if (yearsUntilReplacement <= 1 && yearsUntilReplacement > -1) {
      alerts.push({
        type: 'replacement',
        severity: yearsUntilReplacement <= 0 ? 'critical' : 'warning',
        title: `${item.name} Replacement Recommended`,
        description: `This item has reached its expected ${schedule.alertThresholds.replacementYear}-year lifespan`,
        actionRequired: 'Consider replacement to maintain coverage'
      })
    }
  }

  // Check value threshold alerts
  if (schedule.alertThresholds.valueThresholds) {
    const currentValuePercent = (depreciation.currentValue / item.purchasePrice) * 100
    for (const threshold of schedule.alertThresholds.valueThresholds) {
      if (currentValuePercent <= threshold && currentValuePercent > threshold - 10) {
        alerts.push({
          type: 'value-threshold',
          severity: threshold <= 25 ? 'warning' : 'info',
          title: `${item.name} Value Alert`,
          description: `Item value has depreciated to ${currentValuePercent.toFixed(0)}% of original price`,
          actionRequired: 'Update insurance coverage if needed'
        })
        break // Only show one value alert
      }
    }
  }

  return alerts
}
