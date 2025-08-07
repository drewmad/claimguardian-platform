/**
 * @fileMetadata
 * @purpose "Component to gate features based on subscription plan"
 * @dependencies ["@/components","@/config","@/hooks","lucide-react","next"]
 * @owner billing-team
 * @status stable
 */

'use client'

import { ReactNode } from 'react'
import { useSubscription } from '@/hooks/use-subscription'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Lock } from 'lucide-react'
import Link from 'next/link'
import { PRICING_PLANS } from '@/config/pricing'

interface SubscriptionGateProps {
  requiredPlan?: 'homeowner' | 'landlord' | 'enterprise'
  feature?: keyof ReturnType<typeof useSubscription>['limits']
  children: ReactNode
  fallback?: ReactNode
}

export function SubscriptionGate({
  requiredPlan,
  feature,
  children,
  fallback
}: SubscriptionGateProps) {
  const subscription = useSubscription()

  if (subscription.loading) {
    return <div className="animate-pulse h-32 bg-gray-100 rounded-lg" />
  }

  // Check if user has required plan
  if (requiredPlan) {
    const planHierarchy = ['free', 'homeowner', 'landlord', 'enterprise']
    const currentIndex = planHierarchy.indexOf(subscription.plan)
    const requiredIndex = planHierarchy.indexOf(requiredPlan)

    if (currentIndex < requiredIndex) {
      const targetPlan = PRICING_PLANS[requiredPlan]

      return fallback || (
        <Card className="text-center">
          <CardHeader>
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
              <Lock className="h-6 w-6 text-gray-600" />
            </div>
            <CardTitle>Upgrade Required</CardTitle>
            <CardDescription>
              This feature requires the {targetPlan.name} plan or higher
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Unlock this feature and more with our {targetPlan.name} plan
            </p>
            <Link href="/pricing">
              <Button>View Plans</Button>
            </Link>
          </CardContent>
        </Card>
      )
    }
  }

  // Check if user has hit usage limit
  if (feature) {
    const access = subscription.checkFeatureAccess(feature, 0)

    if (!access.allowed) {
      return fallback || (
        <Card className="text-center">
          <CardHeader>
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center">
              <Lock className="h-6 w-6 text-yellow-600" />
            </div>
            <CardTitle>Limit Reached</CardTitle>
            <CardDescription>{access.message}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Upgrade your plan to increase your limits
            </p>
            <div className="flex gap-3 justify-center">
              <Link href="/dashboard/billing">
                <Button variant="outline">View Usage</Button>
              </Link>
              <Link href="/pricing">
                <Button>Upgrade Plan</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )
    }
  }

  return <>{children}</>
}

// Example usage component for quick limit checks
export function FeatureLimitBadge({
  feature,
  className
}: {
  feature: keyof ReturnType<typeof useSubscription>['limits']
  className?: string
}) {
  const subscription = useSubscription()

  if (subscription.loading || subscription.limits[feature] === -1) {
    return null
  }

  const usage = subscription.usage[feature]
  const limit = subscription.limits[feature]
  const percentage = (usage / limit) * 100

  return (
    <div className={`text-xs ${className}`}>
      <span className={percentage > 80 ? 'text-red-600' : 'text-gray-600'}>
        {usage} / {limit} used
      </span>
    </div>
  )
}
