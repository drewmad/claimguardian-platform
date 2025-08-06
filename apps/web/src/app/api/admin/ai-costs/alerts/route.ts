/**
 * Admin API for AI cost alerts
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Get recent cost alerts
    const { data: costAlerts, error: costAlertsError } = await supabase
      .from('cost_alerts')
      .select(`
        id,
        alert_type,
        alert_level,
        message,
        current_spend,
        budget_amount,
        percentage_used,
        created_at,
        user_id
      `)
      .order('created_at', { ascending: false })
      .limit(50)

    if (costAlertsError) {
      throw costAlertsError
    }

    // Get high usage patterns (users with unusual activity)
    const { data: highUsageUsers } = await supabase
      .from('ai_usage_logs')
      .select(`
        user_id,
        cost_total,
        created_at,
        user_profiles!inner(email)
      `)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('cost_total', { ascending: false })
      .limit(10)

    // Detect potential model errors (high failure rates)
    const { data: modelErrors } = await supabase.rpc('get_model_error_rates', {
      hours_back: 24
    })

    // Process alerts
    const alerts = []

    // Add budget alerts
    costAlerts?.forEach(alert => {
      alerts.push({
        id: alert.id,
        type: alert.alert_type === 'limit_reached' ? 'budget_exceeded' : 'budget_warning',
        message: alert.message,
        severity: alert.alert_level === 'critical' ? 'high' : 
                 alert.alert_level === 'warning' ? 'medium' : 'low',
        timestamp: alert.created_at,
        affectedUsers: 1
      })
    })

    // Add high usage alerts
    const userUsageMap: Record<string, { cost: number; email: string }> = {}
    highUsageUsers?.forEach(log => {
      const key = log.user_id
      if (!userUsageMap[key]) {
        userUsageMap[key] = { 
          cost: 0, 
          email: log.user_profiles?.email || 'Unknown'
        }
      }
      userUsageMap[key].cost += log.cost_total || 0
    })

    Object.entries(userUsageMap).forEach(([userId, data]) => {
      if (data.cost > 5.0) { // Alert for users spending > $5/day
        alerts.push({
          id: `high_usage_${userId}`,
          type: 'high_usage',
          message: `High usage detected: ${data.email} spent $${data.cost.toFixed(2)} today`,
          severity: data.cost > 20 ? 'high' : 'medium',
          timestamp: new Date().toISOString(),
          affectedUsers: 1
        })
      }
    })

    // Add model error alerts
    modelErrors?.forEach((error: any) => {
      if (error.error_rate > 0.10) { // Alert for >10% error rate
        alerts.push({
          id: `model_error_${error.model_name}`,
          type: 'model_error',
          message: `${error.model_name} has ${(error.error_rate * 100).toFixed(1)}% error rate (${error.failed_requests}/${error.total_requests})`,
          severity: error.error_rate > 0.20 ? 'high' : 'medium',
          timestamp: new Date().toISOString(),
          affectedUsers: error.affected_users || 0
        })
      }
    })

    // Sort alerts by severity and timestamp
    alerts.sort((a, b) => {
      const severityOrder = { high: 3, medium: 2, low: 1 }
      if (severityOrder[a.severity] !== severityOrder[b.severity]) {
        return severityOrder[b.severity] - severityOrder[a.severity]
      }
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    })

    return NextResponse.json({
      alerts: alerts.slice(0, 20), // Return top 20 alerts
      summary: {
        total: alerts.length,
        critical: alerts.filter(a => a.severity === 'high').length,
        warnings: alerts.filter(a => a.severity === 'medium').length,
        info: alerts.filter(a => a.severity === 'low').length
      }
    })

  } catch (error) {
    console.error('Failed to get cost alerts:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}