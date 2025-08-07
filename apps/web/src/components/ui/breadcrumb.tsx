/**
 * @fileMetadata
 * @owner @ui-team
 * @purpose "Enhanced breadcrumb navigation with accessibility and insurance context"
 * @dependencies ["react", "next", "lucide-react"]
 * @status stable
 * @insurance-context navigation
 */
'use client'

import { ChevronRight, Home, Shield, FileText, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import React from 'react'

export interface BreadcrumbItem {
  label: string
  href?: string
  icon?: React.ComponentType<{ className?: string }>
  current?: boolean
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[]
  className?: string
  separator?: React.ReactNode
  'aria-label'?: string
  showHome?: boolean
}

export function Breadcrumb({
  items,
  className = '',
  separator = <ChevronRight className="h-4 w-4 mx-1 text-gray-500" />,
  'aria-label': ariaLabel = 'Breadcrumb navigation',
  showHome = true
}: BreadcrumbProps) {
  const pathname = usePathname()

  return (
    <nav
      aria-label={ariaLabel}
      className={cn('flex items-center space-x-1 text-sm text-gray-400', className)}
    >
      <ol className="flex items-center space-x-1" role="list">
        {showHome && (
          <>
            <li>
              <Link
                href="/dashboard"
                className="flex items-center hover:text-white transition-colors"
                aria-label="Home"
              >
                <Home className="h-4 w-4" />
              </Link>
            </li>
            {items.length > 0 && separator}
          </>
        )}

        {items.map((item, index) => {
          const isLast = index === items.length - 1
          const isCurrent = item.current || isLast || item.href === pathname

          return (
            <React.Fragment key={index}>
              {index > 0 && separator}
              <li>
                {item.href && !isCurrent ? (
                  <Link
                    href={item.href}
                    className="hover:text-white transition-colors flex items-center gap-1"
                    aria-current={isCurrent ? 'page' : undefined}
                  >
                    {item.icon && <item.icon className="h-4 w-4" />}
                    {item.label}
                  </Link>
                ) : (
                  <span
                    className="text-white flex items-center gap-1"
                    aria-current={isCurrent ? 'page' : undefined}
                  >
                    {item.icon && <item.icon className="h-4 w-4" />}
                    {item.label}
                  </span>
                )}
              </li>
            </React.Fragment>
          )
        })}
      </ol>
    </nav>
  )
}

// AI-specific breadcrumb helper
export function AIBreadcrumb({
  section,
  page,
  className = ''
}: {
  section: string
  page: string
  className?: string
}) {
  const items: BreadcrumbItem[] = [
    { label: 'AI Tools', href: '/ai-tools' },
    { label: section },
    { label: page }
  ]

  return <Breadcrumb items={items} className={className} />
}

// Insurance-specific breadcrumb helper
export function InsuranceBreadcrumb({
  property,
  propertyId,
  policy,
  policyId,
  claim,
  claimId,
  className = ''
}: {
  property?: string
  propertyId?: string
  policy?: string
  policyId?: string
  claim?: string
  claimId?: string
  className?: string
}) {
  const items: BreadcrumbItem[] = [
    { label: 'Insurance', href: '/dashboard/insurance', icon: Shield }
  ]

  if (property && propertyId) {
    items.push({
      label: property,
      href: `/dashboard/property/${propertyId}`,
      icon: Home
    })
  }

  if (policy && policyId) {
    items.push({
      label: policy,
      href: `/dashboard/insurance/policy/${policyId}`,
      icon: FileText
    })
  }

  if (claim && claimId) {
    items.push({
      label: claim,
      href: `/dashboard/claims/${claimId}`,
      icon: AlertTriangle,
      current: true
    })
  }

  return <Breadcrumb items={items} className={className} />
}
