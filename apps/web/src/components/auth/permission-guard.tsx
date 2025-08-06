/**
 * @fileMetadata
 * @owner frontend-team
 * @purpose "Component for protecting features based on permissions"
 * @dependencies ["react"]
 * @status stable
 */

'use client'

import { ReactNode } from 'react'
import { Loader2, Lock, AlertCircle } from 'lucide-react'
import { usePermission, useHasAnyPermission, useHasAllPermissions } from '@/hooks/use-permissions'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'

interface PermissionGuardProps {
  permission?: string
  permissions?: string[]
  requireAll?: boolean // If true, requires all permissions. If false, requires any permission
  children: ReactNode
  fallback?: ReactNode
  showUpgradePrompt?: boolean
  featureName?: string
}

export function PermissionGuard({
  permission,
  permissions = [],
  requireAll = false,
  children,
  fallback,
  showUpgradePrompt = true,
  featureName = 'This feature'
}: PermissionGuardProps) {
  // Handle single permission
  const singlePermissionCheck = usePermission(permission || '')
  
  // Handle multiple permissions
  const anyPermissionCheck = useHasAnyPermission(permissions)
  const allPermissionsCheck = useHasAllPermissions(permissions)

  // Determine which check to use
  let hasPermission = false
  let isLoading = false

  if (permission) {
    hasPermission = singlePermissionCheck.hasPermission
    isLoading = singlePermissionCheck.isLoading
  } else if (permissions.length > 0) {
    if (requireAll) {
      hasPermission = allPermissionsCheck.hasAllPermissions
      isLoading = allPermissionsCheck.isLoading
    } else {
      hasPermission = anyPermissionCheck.hasAnyPermission
      isLoading = anyPermissionCheck.isLoading
    }
  } else {
    // No permissions specified, allow access
    hasPermission = true
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    )
  }

  if (!hasPermission) {
    if (fallback) {
      return <>{fallback}</>
    }

    if (showUpgradePrompt) {
      return (
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-8 text-center">
            <div className="max-w-md mx-auto">
              <Lock className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                Upgrade Required
              </h3>
              <p className="text-gray-400 mb-6">
                {featureName} requires a higher subscription tier. Upgrade your plan to unlock this and many other premium features.
              </p>
              <div className="flex gap-3 justify-center">
                <Link href="/pricing">
                  <Button className="bg-cyan-600 hover:bg-cyan-700 text-white">
                    View Plans
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700">
                    Go Back
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )
    }

    return null
  }

  return <>{children}</>
}

// Inline permission check component
interface InlinePermissionProps {
  permission?: string
  permissions?: string[]
  requireAll?: boolean
  children: ReactNode
  fallback?: ReactNode
}

export function InlinePermission({
  permission,
  permissions = [],
  requireAll = false,
  children,
  fallback = null
}: InlinePermissionProps) {
  return (
    <PermissionGuard
      permission={permission}
      permissions={permissions}
      requireAll={requireAll}
      fallback={fallback}
      showUpgradePrompt={false}
    >
      {children}
    </PermissionGuard>
  )
}

// Feature lock overlay component
interface FeatureLockProps {
  isLocked: boolean
  featureName?: string
  children: ReactNode
}

export function FeatureLock({ 
  isLocked, 
  featureName = 'This feature',
  children 
}: FeatureLockProps) {
  if (!isLocked) {
    return <>{children}</>
  }

  return (
    <div className="relative">
      <div className="opacity-50 pointer-events-none">
        {children}
      </div>
      <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center rounded-lg">
        <div className="text-center p-4">
          <Lock className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
          <p className="text-sm font-medium text-white mb-2">{featureName} Locked</p>
          <Link href="/pricing">
            <Button size="sm" className="bg-cyan-600 hover:bg-cyan-700 text-white">
              Upgrade to Unlock
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}