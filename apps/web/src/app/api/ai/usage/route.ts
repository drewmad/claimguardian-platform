/**
 * API route for getting user's AI usage and cost data
 */
import { NextRequest, NextResponse } from 'next/server'
import { costTrackingService } from '@/services/cost-tracking'
import { cacheable } from '@/lib/cache/api-cache-middleware'
import { createClient } from '@/lib/supabase/server'

export const GET = cacheable({ endpoint: 'ai_usage' })(async (request: NextRequest) => {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get current month usage
    const usage = await costTrackingService.getUserUsageCurrentMonth()
    
    // Get budget status
    const budgetStatus = await costTrackingService.checkBudgetStatus()

    // Get subscription status
    const subscription = await costTrackingService.getUserSubscriptionStatus()

    return NextResponse.json({
      totalCost: usage.total_cost,
      totalRequests: usage.total_requests,
      costByTool: usage.cost_by_tool,
      dailyUsage: usage.daily_usage,
      budgetStatus,
      subscription: {
        tier: subscription?.tier || 'free',
        monthlyBudget: subscription?.monthly_ai_budget || 5.00,
        dailyLimit: subscription?.daily_request_limit || 50,
        monthlyLimit: subscription?.monthly_request_limit || 1000,
        currentMonthRequests: subscription?.current_month_requests || 0,
        currentDayRequests: subscription?.current_day_requests || 0
      }
    })

  } catch (error) {
    console.error('Failed to get AI usage:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})