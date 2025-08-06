/**
 * Cost tracking dashboard component
 * Shows user's AI usage, costs, and budget status
 */

'use client'

import React from 'react'
import { useAICostTracking, useBudgetMonitor, costTrackingUtils } from '@/hooks/use-ai-cost-tracking'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  DollarSign, 
  TrendingUp, 
  Clock, 
  AlertTriangle, 
  CheckCircle2,
  Zap
} from 'lucide-react'

export function CostTrackingDashboard() {
  const { usage, loading, error, refreshUsage } = useAICostTracking()
  const { budgetStatus, alerts, dismissAllAlerts } = useBudgetMonitor()

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-32 bg-gray-800/50 rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-24 bg-gray-800/50 rounded-lg animate-pulse" />
          <div className="h-24 bg-gray-800/50 rounded-lg animate-pulse" />
          <div className="h-24 bg-gray-800/50 rounded-lg animate-pulse" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Alert className="border-red-500 bg-red-500/10">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Failed to load cost tracking data: {error}
          <Button 
            variant="outline" 
            size="sm" 
            className="ml-2"
            onClick={refreshUsage}
          >
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  if (!usage) {
    return (
      <div className="text-center py-8 text-gray-400">
        No usage data available
      </div>
    )
  }

  const budgetColor = budgetStatus ? 
    costTrackingUtils.getBudgetColor(budgetStatus.percentageUsed) : 'green'

  return (
    <div className="space-y-6">
      {/* Budget Alerts */}
      {alerts.length > 0 && (
        <Alert className="border-orange-500 bg-orange-500/10">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <div>
              <strong>Budget Alert:</strong> {alerts[0]}
              {alerts.length > 1 && ` (+${alerts.length - 1} more)`}
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={dismissAllAlerts}
            >
              Dismiss
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Budget Status Card */}
      {budgetStatus && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Monthly Budget Status
                </CardTitle>
                <CardDescription>
                  {costTrackingUtils.formatCost(budgetStatus.currentSpend)} of{' '}
                  {costTrackingUtils.formatCost(budgetStatus.budgetAmount)} used
                </CardDescription>
              </div>
              <Badge 
                variant={budgetColor === 'green' ? 'default' : 'destructive'}
                className={
                  budgetColor === 'green' ? 'bg-green-500' : 
                  budgetColor === 'yellow' ? 'bg-yellow-500' : 
                  'bg-red-500'
                }
              >
                {budgetStatus.percentageUsed.toFixed(1)}%
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <Progress 
              value={Math.min(budgetStatus.percentageUsed, 100)} 
              className="h-2"
            />
          </CardContent>
        </Card>
      )}

      {/* Usage Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">
              Total Cost (This Month)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {costTrackingUtils.formatCost(usage.totalCost)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">
              Total Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {costTrackingUtils.formatUsage(usage.totalRequests)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">
              Avg Cost per Request
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {usage.totalRequests > 0 
                ? costTrackingUtils.formatCost(usage.totalCost / usage.totalRequests)
                : '$0.000000'
              }
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cost by Tool */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Cost by AI Tool
          </CardTitle>
          <CardDescription>
            Breakdown of costs across different AI features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(usage.costByTool).map(([tool, cost]) => {
              const percentage = usage.totalCost > 0 ? (cost / usage.totalCost) * 100 : 0
              return (
                <div key={tool} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-300 capitalize">
                      {tool.replace(/-/g, ' ')}
                    </span>
                    <div className="text-right">
                      <div className="text-white font-medium">
                        {costTrackingUtils.formatCost(cost)}
                      </div>
                      <div className="text-gray-400 text-xs">
                        {percentage.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                  <Progress value={percentage} className="h-1" />
                </div>
              )
            })}
            
            {Object.keys(usage.costByTool).length === 0 && (
              <div className="text-center py-4 text-gray-400">
                No AI tools used this month
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Daily Usage Chart */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Daily Usage Trend
          </CardTitle>
          <CardDescription>
            Daily costs and request counts for this month
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(usage.dailyUsage)
              .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
              .slice(-7) // Show last 7 days
              .map(([date, data]) => (
                <div key={date} className="flex items-center justify-between p-3 rounded bg-gray-700/50">
                  <div className="flex items-center gap-3">
                    <div className="text-sm text-gray-300">
                      {new Date(date).toLocaleDateString()}
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {data.requests} requests
                    </Badge>
                  </div>
                  <div className="text-white font-medium">
                    {costTrackingUtils.formatCost(data.cost)}
                  </div>
                </div>
              ))}
            
            {Object.keys(usage.dailyUsage).length === 0 && (
              <div className="text-center py-4 text-gray-400">
                No daily usage data available
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Subscription Info */}
      {usage?.budgetStatus && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              Subscription Status
            </CardTitle>
            <CardDescription>
              Current plan limits and usage
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-sm text-gray-400">Plan</div>
              <div className="text-white font-medium capitalize">
                Free
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-gray-400">Monthly Budget</div>
              <div className="text-white font-medium">
                {costTrackingUtils.formatCost(usage.budgetStatus?.budgetAmount || 0)}
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-gray-400">Current Spend</div>
              <div className="text-white font-medium">
                {costTrackingUtils.formatCost(usage.budgetStatus?.currentSpend || 0)}
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-gray-400">Budget Used</div>
              <div className="text-white font-medium">
                {Math.round(usage.budgetStatus?.percentageUsed || 0)}%
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Refresh Button */}
      <div className="flex justify-end">
        <Button 
          variant="outline" 
          onClick={refreshUsage}
          className="flex items-center gap-2"
        >
          <Clock className="h-4 w-4" />
          Refresh Data
        </Button>
      </div>
    </div>
  )
}

export default CostTrackingDashboard