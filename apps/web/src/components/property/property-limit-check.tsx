/**
 * @fileMetadata
 * @owner frontend-team
 * @purpose "Component to check property creation limits based on subscription"
 * @dependencies ["react"]
 * @status stable
 */

'use client'

import { useEffect, useState } from 'react'
import { AlertCircle, Home } from 'lucide-react'
import { usePermissionLimit } from '@/hooks/use-permissions'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface PropertyLimitCheckProps {
  currentPropertyCount: number
  onCanCreate: (canCreate: boolean) => void
  showMessage?: boolean
}

export function PropertyLimitCheck({ 
  currentPropertyCount, 
  onCanCreate,
  showMessage = true 
}: PropertyLimitCheckProps) {
  const { limit } = usePermissionLimit('properties.create')
  const [canCreate, setCanCreate] = useState(true)
  const [remainingProperties, setRemainingProperties] = useState<number | null>(null)

  useEffect(() => {
    if (limit === null) {
      // No limit (unlimited)
      setCanCreate(true)
      setRemainingProperties(null)
    } else {
      // Has limit
      const remaining = limit - currentPropertyCount
      setCanCreate(remaining > 0)
      setRemainingProperties(remaining)
    }
    
    onCanCreate(canCreate)
  }, [limit, currentPropertyCount, canCreate, onCanCreate])

  if (!showMessage) {
    return null
  }

  if (canCreate && remainingProperties !== null && remainingProperties <= 3) {
    // Show warning when approaching limit
    return (
      <Card className="bg-yellow-900/20 border-yellow-600/50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-400">
                Property Limit Warning
              </p>
              <p className="text-sm text-yellow-300/80 mt-1">
                You have {remainingProperties} {remainingProperties === 1 ? 'property' : 'properties'} remaining in your current plan.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!canCreate) {
    return (
      <Card className="bg-red-900/20 border-red-600/50">
        <CardContent className="p-6">
          <div className="flex flex-col items-center text-center">
            <div className="p-3 bg-red-500/20 rounded-full mb-4">
              <Home className="w-8 h-8 text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Property Limit Reached
            </h3>
            <p className="text-sm text-gray-400 mb-4">
              You've reached the maximum number of properties ({limit}) for your current plan.
            </p>
            <Link href="/pricing">
              <Button className="bg-cyan-600 hover:bg-cyan-700">
                Upgrade Plan
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  return null
}

// Hook to check if user can create more properties
export function useCanCreateProperty(currentPropertyCount: number): {
  canCreate: boolean
  remaining: number | null
  isLoading: boolean
} {
  const { limit } = usePermissionLimit('properties.create')
  const [state, setState] = useState({
    canCreate: true,
    remaining: null as number | null,
    isLoading: true
  })

  useEffect(() => {
    if (limit === null) {
      setState({
        canCreate: true,
        remaining: null,
        isLoading: false
      })
    } else {
      const remaining = limit - currentPropertyCount
      setState({
        canCreate: remaining > 0,
        remaining,
        isLoading: false
      })
    }
  }, [limit, currentPropertyCount])

  return state
}