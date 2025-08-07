/**
 * Client-side hook for AI cost tracking and budget monitoring
 */

import { useState, useEffect, useCallback } from 'react'
import type { CostAnalytics, UserBudgetStatus } from '@/services/cost-tracking'

interface AIUsageSummary {
  totalCost: number
  totalRequests: number
  costByTool: Record<string, number>
  dailyUsage: Record<string, { cost: number; requests: number }>
  budgetStatus?: UserBudgetStatus
}

export function useAICostTracking() {
  const [usage, setUsage] = useState<AIUsageSummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchUsage = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/ai/usage', {
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch usage: ${response.statusText}`)
      }

      const data = await response.json()
      setUsage(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      console.error('Failed to fetch AI usage:', errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const checkBudgetStatus = useCallback(async (): Promise<UserBudgetStatus | null> => {
    try {
      const response = await fetch('/api/ai/budget-status', {
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to check budget: ${response.statusText}`)
      }

      const budgetStatus = await response.json()
      return budgetStatus
    } catch (err) {
      console.error('Failed to check budget status:', err)
      return null
    }
  }, [])

  const canMakeRequest = useCallback(async (toolName: string): Promise<{
    allowed: boolean
    reason?: string
    upgradeRequired?: boolean
  }> => {
    try {
      const response = await fetch('/api/ai/can-make-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ toolName })
      })

      if (!response.ok) {
        return {
          allowed: false,
          reason: 'Unable to verify request limits'
        }
      }

      return await response.json()
    } catch (err) {
      console.error('Failed to check request limits:', err)
      return {
        allowed: false,
        reason: 'Unable to verify request limits'
      }
    }
  }, [])

  const getEstimatedCost = useCallback(async (
    toolName: string,
    inputLength: number,
    outputLength: number = 300,
    imageCount: number = 0
  ): Promise<number> => {
    try {
      const response = await fetch('/api/ai/estimate-cost', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          toolName,
          inputLength,
          outputLength,
          imageCount
        })
      })

      if (!response.ok) {
        return 0
      }

      const { estimatedCost } = await response.json()
      return estimatedCost || 0
    } catch (err) {
      console.error('Failed to estimate cost:', err)
      return 0
    }
  }, [])

  // Auto-fetch usage on mount
  useEffect(() => {
    fetchUsage()
  }, [fetchUsage])

  return {
    usage,
    loading,
    error,
    refreshUsage: fetchUsage,
    checkBudgetStatus,
    canMakeRequest,
    getEstimatedCost
  }
}

/**
 * Hook for admin cost analytics
 */
export function useAdminCostAnalytics() {
  const [analytics, setAnalytics] = useState<CostAnalytics | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAnalytics = useCallback(async (
    startDate?: string,
    endDate?: string
  ) => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (startDate) params.set('startDate', startDate)
      if (endDate) params.set('endDate', endDate)

      const response = await fetch(`/api/admin/ai-costs/analytics?${params}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch analytics: ${response.statusText}`)
      }

      const data = await response.json()
      setAnalytics(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      console.error('Failed to fetch cost analytics:', errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    analytics,
    loading,
    error,
    fetchAnalytics
  }
}

/**
 * Hook for real-time cost monitoring with budget alerts
 */
export function useBudgetMonitor() {
  const [budgetStatus, setBudgetStatus] = useState<UserBudgetStatus | null>(null)
  const [alerts, setAlerts] = useState<string[]>([])

  const checkBudget = useCallback(async () => {
    try {
      const response = await fetch('/api/ai/budget-status')
      if (response.ok) {
        const status = await response.json()
        setBudgetStatus(status)

        // Show alerts if budget thresholds are exceeded
        if (status.alertsNeeded && status.alertsNeeded.length > 0) {
          setAlerts(status.alertsNeeded)
        }
      }
    } catch (err) {
      console.error('Failed to check budget:', err)
    }
  }, [])

  // Check budget every 5 minutes
  useEffect(() => {
    checkBudget()
    const interval = setInterval(checkBudget, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [checkBudget])

  const dismissAlert = useCallback((index: number) => {
    setAlerts(prev => prev.filter((_, i) => i !== index))
  }, [])

  const dismissAllAlerts = useCallback(() => {
    setAlerts([])
  }, [])

  return {
    budgetStatus,
    alerts,
    dismissAlert,
    dismissAllAlerts,
    refreshBudget: checkBudget
  }
}

/**
 * Utility functions for cost tracking
 */
export const costTrackingUtils = {
  formatCost: (cost: number): string => {
    return `$${cost.toFixed(6)}`
  },

  formatUsage: (usage: number): string => {
    if (usage >= 1000000) {
      return `${(usage / 1000000).toFixed(1)}M`
    } else if (usage >= 1000) {
      return `${(usage / 1000).toFixed(1)}K`
    } else {
      return usage.toString()
    }
  },

  getBudgetColor: (percentageUsed: number): 'green' | 'yellow' | 'red' => {
    if (percentageUsed < 50) return 'green'
    if (percentageUsed < 80) return 'yellow'
    return 'red'
  },

  calculateSavings: (currentCost: number, previousCost: number): {
    amount: number
    percentage: number
    isSaving: boolean
  } => {
    const difference = previousCost - currentCost
    const percentage = previousCost > 0 ? (difference / previousCost) * 100 : 0

    return {
      amount: Math.abs(difference),
      percentage: Math.abs(percentage),
      isSaving: difference > 0
    }
  }
}
