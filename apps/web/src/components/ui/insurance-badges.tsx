/**
 * @fileMetadata
 * @owner @ui-team
 * @purpose "Insurance-specific badge components with standardized variants"
 * @dependencies ["react", "lucide-react", "clsx"]
 * @status stable
 */
'use client'

import { cn } from '@/lib/utils'
import { Badge as BaseBadge } from './badge'
import { Shield, AlertTriangle, CheckCircle, XCircle, Clock, TrendingUp, TrendingDown } from 'lucide-react'
import React from 'react'

export type InsuranceBadgeVariant = 
  | 'active' 
  | 'expired' 
  | 'pending'
  | 'cancelled'
  | 'insurability-high'
  | 'insurability-medium' 
  | 'insurability-low'
  | 'coverage-adequate'
  | 'coverage-partial'
  | 'coverage-insufficient'
  | 'premium-paid'
  | 'premium-due'
  | 'premium-overdue'
  | 'claim-open'
  | 'claim-closed'
  | 'claim-approved'
  | 'claim-denied'
  | 'deductible-standard'
  | 'deductible-wind'

interface InsuranceBadgeProps {
  variant: InsuranceBadgeVariant
  children: React.ReactNode
  showIcon?: boolean
  className?: string
}

const badgeConfig = {
  // Policy Status
  active: {
    className: 'bg-green-600/20 text-green-400 border-green-600/30',
    icon: CheckCircle,
    label: 'Active'
  },
  expired: {
    className: 'bg-red-600/20 text-red-400 border-red-600/30',
    icon: XCircle,
    label: 'Expired'
  },
  pending: {
    className: 'bg-yellow-600/20 text-yellow-400 border-yellow-600/30',
    icon: Clock,
    label: 'Pending'
  },
  cancelled: {
    className: 'bg-gray-600/20 text-gray-400 border-gray-600/30',
    icon: XCircle,
    label: 'Cancelled'
  },
  
  // Insurability Levels
  'insurability-high': {
    className: 'bg-green-600/20 text-green-400 border-green-600/30',
    icon: TrendingUp,
    label: 'High Insurability'
  },
  'insurability-medium': {
    className: 'bg-yellow-600/20 text-yellow-400 border-yellow-600/30',
    icon: AlertTriangle,
    label: 'Medium Risk'
  },
  'insurability-low': {
    className: 'bg-red-600/20 text-red-400 border-red-600/30',
    icon: TrendingDown,
    label: 'High Risk'
  },
  
  // Coverage Status
  'coverage-adequate': {
    className: 'bg-green-600/20 text-green-400 border-green-600/30',
    icon: Shield,
    label: 'Adequate Coverage'
  },
  'coverage-partial': {
    className: 'bg-yellow-600/20 text-yellow-400 border-yellow-600/30',
    icon: Shield,
    label: 'Partial Coverage'
  },
  'coverage-insufficient': {
    className: 'bg-red-600/20 text-red-400 border-red-600/30',
    icon: AlertTriangle,
    label: 'Insufficient Coverage'
  },
  
  // Premium Status
  'premium-paid': {
    className: 'bg-green-600/20 text-green-400 border-green-600/30',
    icon: CheckCircle,
    label: 'Paid'
  },
  'premium-due': {
    className: 'bg-yellow-600/20 text-yellow-400 border-yellow-600/30',
    icon: Clock,
    label: 'Due'
  },
  'premium-overdue': {
    className: 'bg-red-600/20 text-red-400 border-red-600/30',
    icon: AlertTriangle,
    label: 'Overdue'
  },
  
  // Claim Status
  'claim-open': {
    className: 'bg-blue-600/20 text-blue-400 border-blue-600/30',
    icon: Clock,
    label: 'Open'
  },
  'claim-closed': {
    className: 'bg-gray-600/20 text-gray-400 border-gray-600/30',
    icon: CheckCircle,
    label: 'Closed'
  },
  'claim-approved': {
    className: 'bg-green-600/20 text-green-400 border-green-600/30',
    icon: CheckCircle,
    label: 'Approved'
  },
  'claim-denied': {
    className: 'bg-red-600/20 text-red-400 border-red-600/30',
    icon: XCircle,
    label: 'Denied'
  },
  
  // Deductible Types
  'deductible-standard': {
    className: 'bg-gray-600/20 text-gray-300 border-gray-600/30',
    icon: Shield,
    label: 'Standard'
  },
  'deductible-wind': {
    className: 'bg-yellow-600/20 text-yellow-400 border-yellow-600/30',
    icon: AlertTriangle,
    label: 'Wind/Hurricane'
  }
}

export function InsuranceBadge({ variant, children, showIcon = true, className }: InsuranceBadgeProps) {
  const config = badgeConfig[variant]
  const Icon = config.icon

  return (
    <BaseBadge className={cn(config.className, 'flex items-center gap-1', className)}>
      {showIcon && <Icon className="w-3 h-3" />}
      {children || config.label}
    </BaseBadge>
  )
}

// Convenience exports for common use cases
export function PolicyStatusBadge({ status }: { status: 'active' | 'expired' | 'pending' | 'cancelled' }) {
  return <InsuranceBadge variant={status}>{badgeConfig[status].label}</InsuranceBadge>
}

export function InsurabilityBadge({ level }: { level: 'high' | 'medium' | 'low' }) {
  const variant = `insurability-${level}` as InsuranceBadgeVariant
  return <InsuranceBadge variant={variant}>{badgeConfig[variant].label}</InsuranceBadge>
}

export function CoverageBadge({ level }: { level: 'adequate' | 'partial' | 'insufficient' }) {
  const variant = `coverage-${level}` as InsuranceBadgeVariant
  return <InsuranceBadge variant={variant}>{badgeConfig[variant].label}</InsuranceBadge>
}

export function ClaimStatusBadge({ status }: { status: 'open' | 'closed' | 'approved' | 'denied' }) {
  const variant = `claim-${status}` as InsuranceBadgeVariant
  return <InsuranceBadge variant={variant}>{badgeConfig[variant].label}</InsuranceBadge>
}