import { useEffect, useState } from 'react'
import { createBrowserSupabaseClient } from '@claimguardian/db'

export interface SubscriptionLimits {
  properties: number
  team_members: number
  ai_scans_per_month: number
  ai_documents_per_month: number
  storage_gb: number
}

export interface SubscriptionData {
  plan: string
  status: string
  isActive: boolean
  limits: SubscriptionLimits
  currentPeriodEnd: Date | null
}

export function useSubscription() {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const supabase = createBrowserSupabaseClient()

  useEffect(() => {
    loadSubscription()

    // Subscribe to profile changes
    const channel = supabase
      .channel('profile-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${supabase.auth.getUser().then(u => u.data.user?.id)}`,
        },
        () => {
          loadSubscription()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const loadSubscription = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setSubscription(null)
        return
      }

      // Get profile with subscription info
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('subscription_plan, subscription_status, subscription_current_period_end')
        .eq('id', user.id)
        .single()

      if (profileError) throw profileError

      // Get subscription limits
      const { data: limits, error: limitsError } = await supabase
        .rpc('get_subscription_limits', { user_id: user.id })

      if (limitsError) throw limitsError

      const isActive = profile.subscription_status === 'active' || profile.subscription_status === 'trialing'

      setSubscription({
        plan: profile.subscription_plan || 'free',
        status: profile.subscription_status || 'free',
        isActive,
        limits: limits as SubscriptionLimits,
        currentPeriodEnd: profile.subscription_current_period_end 
          ? new Date(profile.subscription_current_period_end)
          : null,
      })
    } catch (err) {
      console.error('Error loading subscription:', err)
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }

  const checkFeatureAccess = (feature: string): boolean => {
    if (!subscription) return false

    // Define feature access by plan
    const featureAccess: Record<string, string[]> = {
      free: ['basic_features'],
      essential: ['basic_features', 'ai_damage_scan', 'policy_analysis', 'settlement_analyzer'],
      plus: ['basic_features', 'ai_damage_scan', 'policy_analysis', 'settlement_analyzer', 'multi_property', 'team_members'],
      pro: ['basic_features', 'ai_damage_scan', 'policy_analysis', 'settlement_analyzer', 'multi_property', 'team_members', 'contractor_marketplace', 'bulk_operations'],
    }

    const planFeatures = featureAccess[subscription.plan] || []
    return planFeatures.includes(feature)
  }

  const checkLimit = (limitType: keyof SubscriptionLimits, currentUsage: number): boolean => {
    if (!subscription) return false
    const limit = subscription.limits[limitType]
    return limit === -1 || currentUsage < limit
  }

  return {
    subscription,
    loading,
    error,
    checkFeatureAccess,
    checkLimit,
    refresh: loadSubscription,
  }
}