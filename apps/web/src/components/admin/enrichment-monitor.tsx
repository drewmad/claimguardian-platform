/**
 * @fileMetadata
 * @purpose "Admin component to monitor property enrichment status"
 * @dependencies ["@/actions","@/components","@/lib","@claimguardian/ui","react"]
 * @owner admin-team
 * @status stable
 */

'use client'

import { Card } from '@claimguardian/ui'
import { Button } from '@claimguardian/ui'
import { 
  BarChart3, 
  CheckCircle2, 
  AlertCircle, 
  XCircle,
  RefreshCw,
  Download,
  TrendingUp,
  DollarSign
} from 'lucide-react'
import { useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'
import { logger } from "@/lib/logger/production-logger"

import { getUserEnrichmentStats, checkEnrichmentHealth } from '@/actions/property-verification'
import { Badge } from '@/components/ui/badge'
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'

interface EnrichmentStats {
  totalProperties: number
  enrichedProperties: number
  enrichmentPercentage: number
  totalApiCost: number
  averageCompleteness: number
}

interface HealthCheckResult {
  totalProperties: number
  healthyProperties: number
  issues: Array<{
    propertyId: string
    propertyName: string
    issue: 'missing' | 'expired' | 'expiring_soon'
    expiresAt?: string
  }>
}

export function EnrichmentMonitor() {
  const [stats, setStats] = useState<EnrichmentStats | null>(null)
  const [healthData, setHealthData] = useState<HealthCheckResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const supabase = createClient()

  const fetchData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch enrichment statistics
      const statsResult = await getUserEnrichmentStats(user.id)
      if (statsResult.success && statsResult.data) {
        setStats(statsResult.data)
      }

      // Check enrichment health
      const healthResult = await checkEnrichmentHealth(user.id)
      if (healthResult.success && healthResult.data) {
        setHealthData(healthResult.data)
      }

    } catch (error) {
      logger.error('Error fetching enrichment data:', error)
      toast.error('Failed to load enrichment data')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  async function handleRefresh() {
    setRefreshing(true)
    await fetchData()
    setRefreshing(false)
    toast.success('Data refreshed')
  }

  async function exportData() {
    if (!stats || !healthData) return

    const report = {
      generatedAt: new Date().toISOString(),
      statistics: stats,
      health: healthData,
      summary: {
        totalProperties: stats.totalProperties,
        enrichedProperties: stats.enrichedProperties,
        missingEnrichments: healthData.issues.filter(i => i.issue === 'missing').length,
        expiredEnrichments: healthData.issues.filter(i => i.issue === 'expired').length,
        expiringEnrichments: healthData.issues.filter(i => i.issue === 'expiring_soon').length
      }
    }

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `enrichment-report-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    window.URL.revokeObjectURL(url)
    
    toast.success('Report exported')
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const missingCount = healthData?.issues.filter(i => i.issue === 'missing').length || 0
  const expiredCount = healthData?.issues.filter(i => i.issue === 'expired').length || 0
  const expiringSoonCount = healthData?.issues.filter(i => i.issue === 'expiring_soon').length || 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Property Enrichment Monitor</h2>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={exportData}
          >
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Properties
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalProperties || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Enriched Properties
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.enrichedProperties || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.enrichmentPercentage || 0}% coverage
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total API Cost
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(stats?.totalApiCost || 0).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              ${((stats?.totalApiCost || 0) / (stats?.enrichedProperties || 1)).toFixed(3)} per property
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Avg Completeness
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.averageCompleteness || 0}%</div>
            <p className="text-xs text-muted-foreground">
              Data quality score
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Health Status */}
      <Card>
        <CardHeader>
          <CardTitle>Enrichment Health Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Health Summary */}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-red-900">Missing Enrichment</p>
                  <p className="text-2xl font-bold text-red-700">{missingCount}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-500" />
              </div>

              <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-orange-900">Expired</p>
                  <p className="text-2xl font-bold text-orange-700">{expiredCount}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-orange-500" />
              </div>

              <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-yellow-900">Expiring Soon</p>
                  <p className="text-2xl font-bold text-yellow-700">{expiringSoonCount}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-yellow-500" />
              </div>
            </div>

            {/* Issues List */}
            {healthData && healthData.issues.length > 0 && (
              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Properties Requiring Attention</h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {healthData.issues.map((issue, index) => (
                    <div 
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {issue.issue === 'missing' && <XCircle className="h-5 w-5 text-red-500" />}
                        {issue.issue === 'expired' && <AlertCircle className="h-5 w-5 text-orange-500" />}
                        {issue.issue === 'expiring_soon' && <AlertCircle className="h-5 w-5 text-yellow-500" />}
                        <div>
                          <p className="font-medium">{issue.propertyName}</p>
                          <p className="text-sm text-gray-600">
                            {issue.issue === 'missing' && 'No enrichment data'}
                            {issue.issue === 'expired' && `Expired on ${new Date(issue.expiresAt!).toLocaleDateString()}`}
                            {issue.issue === 'expiring_soon' && `Expires on ${new Date(issue.expiresAt!).toLocaleDateString()}`}
                          </p>
                        </div>
                      </div>
                      <Badge 
                        variant={
                          issue.issue === 'missing' ? 'destructive' : 
                          issue.issue === 'expired' ? 'outline' : 
                          'secondary'
                        }
                      >
                        {issue.issue.replace('_', ' ')}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* All Good Message */}
            {healthData && healthData.issues.length === 0 && (
              <div className="text-center py-8">
                <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <p className="text-lg font-medium text-green-700">All Properties Healthy</p>
                <p className="text-gray-600">All property enrichments are up to date</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
