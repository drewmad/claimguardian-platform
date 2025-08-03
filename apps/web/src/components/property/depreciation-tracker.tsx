/**
 * @fileMetadata
 * @purpose Depreciation tracking component for personal property items
 * @owner frontend-team
 * @status active
 */
'use client'

import { TrendingDown, TrendingUp, DollarSign, Calendar, Info } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { calculateDepreciation, DEPRECIATION_SCHEDULES } from '@/lib/depreciation'
import { cn } from '@/lib/utils'

interface DepreciationTrackerProps {
  purchasePrice: number
  purchaseDate: string
  category: string
  compact?: boolean
  showDetails?: boolean
}

export function DepreciationTracker({ 
  purchasePrice, 
  purchaseDate, 
  category,
  compact = false,
  showDetails = true
}: DepreciationTrackerProps) {
  const depreciation = calculateDepreciation(purchasePrice, purchaseDate, category)
  const schedule = DEPRECIATION_SCHEDULES[category] || DEPRECIATION_SCHEDULES.electronics
  
  const valueRetentionPercent = (depreciation.currentValue / purchasePrice) * 100
  const isAppreciating = depreciation.currentValue > purchasePrice

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2">
              {isAppreciating ? (
                <TrendingUp className="h-4 w-4 text-green-400" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-400" />
              )}
              <span className={cn(
                "font-medium",
                isAppreciating ? "text-green-400" : "text-white"
              )}>
                {formatCurrency(depreciation.currentValue)}
              </span>
              <Badge variant="outline" className={cn(
                "text-xs",
                isAppreciating ? "border-green-600 text-green-400" : "border-gray-600 text-gray-400"
              )}>
                {isAppreciating ? '+' : ''}{Math.abs(depreciation.depreciationPercent).toFixed(0)}%
              </Badge>
            </div>
          </TooltipTrigger>
          <TooltipContent className="bg-gray-900 border-gray-700">
            <div className="space-y-2 p-2">
              <p className="text-sm">Original: {formatCurrency(purchasePrice)}</p>
              <p className="text-sm">Current: {formatCurrency(depreciation.currentValue)}</p>
              <p className="text-sm">Age: {depreciation.ageYears} years</p>
              <p className="text-sm">Method: {schedule.method}</p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <div className="space-y-4">
      {/* Value Overview */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-400">Current Value</p>
          <p className="text-2xl font-bold text-white flex items-center gap-2">
            {formatCurrency(depreciation.currentValue)}
            {isAppreciating ? (
              <TrendingUp className="h-5 w-5 text-green-400" />
            ) : (
              <TrendingDown className="h-5 w-5 text-red-400" />
            )}
          </p>
        </div>
        <Badge 
          variant="outline" 
          className={cn(
            "mt-2",
            isAppreciating ? "border-green-600 text-green-400" : "border-gray-600 text-gray-400"
          )}
        >
          {isAppreciating ? 'Appreciated' : 'Depreciated'} {Math.abs(depreciation.depreciationPercent).toFixed(1)}%
        </Badge>
      </div>

      {/* Depreciation Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Value Retention</span>
          <span className="text-white font-medium">{valueRetentionPercent.toFixed(0)}%</span>
        </div>
        <div className="relative h-2 w-full overflow-hidden rounded-full bg-gray-700">
          <div 
            className={cn(
              "h-full w-full flex-1 transition-all",
              valueRetentionPercent > 75 ? "bg-green-500" :
              valueRetentionPercent > 50 ? "bg-yellow-500" :
              valueRetentionPercent > 25 ? "bg-orange-500" :
              "bg-red-500"
            )}
            style={{ transform: `translateX(-${100 - valueRetentionPercent}%)` }}
          />
        </div>
      </div>

      {showDetails && (
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-700">
          <div>
            <p className="text-xs text-gray-400 flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              Original Price
            </p>
            <p className="text-sm font-medium text-white">{formatCurrency(purchasePrice)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Item Age
            </p>
            <p className="text-sm font-medium text-white">{depreciation.ageYears} years</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 flex items-center gap-1">
              <Info className="h-3 w-3" />
              Expected Life
            </p>
            <p className="text-sm font-medium text-white">{schedule.lifeYears} years</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 flex items-center gap-1">
              <TrendingDown className="h-3 w-3" />
              Salvage Value
            </p>
            <p className="text-sm font-medium text-white">{formatCurrency(purchasePrice * schedule.salvagePercent / 100)}</p>
          </div>
        </div>
      )}
    </div>
  )
}