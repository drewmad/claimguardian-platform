/**
 * @fileMetadata
 * @owner @ai-team
 * @purpose "Brief description of file purpose"
 * @dependencies ["package1", "package2"]
 * @status stable
 * @ai-integration multi-provider
 * @insurance-context claims
 * @supabase-integration edge-functions
 */
'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Database,
  Zap,
  HardDrive,
  Activity,
  RefreshCw,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import { createBrowserSupabaseClient } from '@claimguardian/db'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface PerformanceStats {
  total_tables: number
  total_rows: bigint
  total_dead_rows: bigint
  total_indexes: number
  total_index_scans: bigint
  cache_hit_ratio: number
}

interface TableSize {
  table_name: string
  total_size: string
  table_size: string
  indexes_size: string
  row_count: bigint
}

export default function PerformanceDashboard() {
  const [stats, setStats] = useState<PerformanceStats | null>(null)
  const [tableSizes, setTableSizes] = useState<TableSize[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const supabase = createBrowserSupabaseClient()

  const loadPerformanceData = async () => {
    try {
      setLoading(true)

      // Fetch performance stats
      const { data: perfStats, error: statsError } = await supabase
        .from('v_performance_dashboard')
        .select('*')
        .single()

      if (statsError) throw statsError
      setStats(perfStats)

      // Fetch table sizes
      const { data: sizes, error: sizesError } = await supabase
        .rpc('analyze_table_sizes')

      if (sizesError) throw sizesError
      setTableSizes(sizes || [])

    } catch (err) {
      console.error('Error loading performance data:', err)
      toast.error('Failed to load performance data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPerformanceData()
  }, [loadPerformanceData])

  const refreshMaterializedViews = async () => {
    try {
      setRefreshing(true)
      const { error } = await supabase.rpc('refresh_all_materialized_views')

      if (error) throw error

      toast.success('Materialized views refreshed successfully')
      await loadPerformanceData()
    } catch (err) {
      console.error('Error refreshing views:', err)
      toast.error('Failed to refresh materialized views')
    } finally {
      setRefreshing(false)
    }
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Loading performance data...</p>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  const cacheHitRatio = stats?.cache_hit_ratio || 0
  const deadRowRatio = stats ? (Number(stats.total_dead_rows) / Number(stats.total_rows) * 100) : 0

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-white">Database Performance</h1>
            <Button
              onClick={refreshMaterializedViews}
              disabled={refreshing}
              variant="outline"
              className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh Views
            </Button>
          </div>

          {/* Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Cache Hit Ratio</CardTitle>
                <Zap className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{cacheHitRatio.toFixed(1)}%</div>
                <Progress value={cacheHitRatio} className="mt-2" />
                <p className="text-xs text-gray-500 mt-1">
                  {cacheHitRatio > 95 ? 'Excellent' : cacheHitRatio > 90 ? 'Good' : 'Needs improvement'}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Total Indexes</CardTitle>
                <Database className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{stats?.total_indexes || 0}</div>
                <p className="text-xs text-gray-500 mt-1">
                  {Number(stats?.total_index_scans || 0).toLocaleString()} total scans
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Dead Rows</CardTitle>
                <HardDrive className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{deadRowRatio.toFixed(2)}%</div>
                <p className="text-xs text-gray-500 mt-1">
                  {Number(stats?.total_dead_rows || 0).toLocaleString()} dead rows
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Total Rows</CardTitle>
                <Activity className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {Number(stats?.total_rows || 0).toLocaleString()}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Across {stats?.total_tables || 0} tables
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Optimization Status */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Optimization Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-gray-300">Performance Indexes Applied</span>
                </div>
                <Badge className="bg-green-600 text-white">Active</Badge>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-gray-300">Materialized Views Created</span>
                </div>
                <Badge className="bg-green-600 text-white">3 Views</Badge>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-gray-300">AI Cost Tracking Active</span>
                </div>
                <Badge className="bg-green-600 text-white">Monitoring</Badge>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {deadRowRatio > 10 ? (
                    <AlertCircle className="w-5 h-5 text-yellow-500" />
                  ) : (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  )}
                  <span className="text-gray-300">Vacuum Status</span>
                </div>
                <Badge className={deadRowRatio > 10 ? "bg-yellow-600 text-white" : "bg-green-600 text-white"}>
                  {deadRowRatio > 10 ? 'Needs VACUUM' : 'Healthy'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Table Sizes */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Table Sizes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-2 text-gray-400">Table</th>
                      <th className="text-right py-2 text-gray-400">Rows</th>
                      <th className="text-right py-2 text-gray-400">Table Size</th>
                      <th className="text-right py-2 text-gray-400">Indexes</th>
                      <th className="text-right py-2 text-gray-400">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableSizes.slice(0, 10).map((table, idx) => (
                      <tr key={idx} className="border-b border-gray-700/50">
                        <td className="py-2 text-gray-300">{table.table_name}</td>
                        <td className="text-right py-2 text-gray-300">
                          {Number(table.row_count).toLocaleString()}
                        </td>
                        <td className="text-right py-2 text-gray-300">{table.table_size}</td>
                        <td className="text-right py-2 text-gray-300">{table.indexes_size}</td>
                        <td className="text-right py-2 text-gray-300 font-medium">{table.total_size}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Performance Tips */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Performance Improvements Applied</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm text-gray-300">
                <h4 className="font-semibold mb-1">✅ Indexes Added</h4>
                <p className="text-gray-400">Critical indexes on properties, claims, policies, and AI usage logs for faster queries</p>
              </div>
              <div className="text-sm text-gray-300">
                <h4 className="font-semibold mb-1">✅ Materialized Views</h4>
                <p className="text-gray-400">Pre-computed dashboard stats, property analytics, and claims summaries</p>
              </div>
              <div className="text-sm text-gray-300">
                <h4 className="font-semibold mb-1">✅ Cost Tracking</h4>
                <p className="text-gray-400">Real-time AI usage monitoring with automatic cost calculation</p>
              </div>
              <div className="text-sm text-gray-300">
                <h4 className="font-semibold mb-1">🔄 Next Steps</h4>
                <p className="text-gray-400">Schedule regular VACUUM operations and monitor query performance</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
