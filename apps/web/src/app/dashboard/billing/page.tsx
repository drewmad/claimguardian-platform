'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { AlertCircle, Check, CreditCard, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createBrowserSupabaseClient } from '@claimguardian/db'
import { redirectToCustomerPortal, createCheckoutSession, redirectToCheckout } from '@/lib/stripe/client'
import { STRIPE_PRICE_IDS } from '@/lib/stripe/server'

interface Profile {
  subscription_plan: string
  subscription_status: string
  subscription_current_period_end: string | null
  stripe_customer_id: string | null
}

interface Plan {
  name: string
  price: { monthly: number; annual: number }
  features: string[]
  priceIds: { monthly: string; annual: string }
}

const plans: Record<string, Plan> = {
  essential: {
    name: 'Guardian Essential',
    price: { monthly: 29, annual: 290 },
    features: [
      'More AI Damage Scans per month',
      'Advanced Policy Analysis & Q&A',
      'Settlement Analyzer',
      'Priority Email Support',
      '10GB Evidence Storage',
    ],
    priceIds: STRIPE_PRICE_IDS.essential,
  },
  plus: {
    name: 'Guardian Plus',
    price: { monthly: 49, annual: 490 },
    features: [
      'Everything in Essential',
      'Up to 3 Properties',
      '2 Team Members',
      'Even More AI Damage Scans',
      '25GB Evidence Storage',
      'Property Comparison Tools',
    ],
    priceIds: STRIPE_PRICE_IDS.plus,
  },
  pro: {
    name: 'Guardian Professional',
    price: { monthly: 99, annual: 990 },
    features: [
      'Everything in Plus',
      'Up to 10 Properties',
      '5 Team Members',
      'Maximum AI Damage Scans',
      'Unlimited AI Documents',
      'Priority Phone Support',
      '50GB Evidence Storage',
    ],
    priceIds: STRIPE_PRICE_IDS.pro,
  },
}

export default function BillingPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly')
  const [processingPlan, setProcessingPlan] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const supabase = createBrowserSupabaseClient()

  useEffect(() => {
    // Check for success/cancel from Stripe
    const success = searchParams.get('success')
    const canceled = searchParams.get('canceled')

    if (success === 'true') {
      toast.success('Subscription activated successfully!')
    } else if (canceled === 'true') {
      toast.info('Subscription canceled')
    }

    // Load user profile
    loadProfile()
  }, [searchParams])

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('profiles')
        .select('subscription_plan, subscription_status, subscription_current_period_end, stripe_customer_id')
        .eq('id', user.id)
        .single()

      if (error) throw error
      setProfile(data)
    } catch (error) {
      console.error('Error loading profile:', error)
      toast.error('Failed to load billing information')
    } finally {
      setLoading(false)
    }
  }

  const handleSubscribe = async (planKey: string) => {
    try {
      setProcessingPlan(planKey)
      const plan = plans[planKey]
      const priceId = billingCycle === 'annual' ? plan.priceIds.annual : plan.priceIds.monthly

      const { sessionId, error } = await createCheckoutSession(priceId, plan.name)
      
      if (error) {
        throw new Error(error)
      }

      if (sessionId) {
        const { error: redirectError } = await redirectToCheckout(sessionId)
        if (redirectError) {
          throw new Error(redirectError)
        }
      }
    } catch (error) {
      console.error('Error subscribing:', error)
      toast.error('Failed to start subscription process')
    } finally {
      setProcessingPlan(null)
    }
  }

  const handleManageSubscription = async () => {
    try {
      setLoading(true)
      const { error } = await redirectToCustomerPortal()
      if (error) {
        throw new Error(error)
      }
    } catch (error) {
      console.error('Error opening portal:', error)
      toast.error('Failed to open billing portal')
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  const currentPlan = profile?.subscription_plan || 'free'
  const isSubscribed = profile?.stripe_customer_id && profile?.subscription_status === 'active'

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Billing & Subscription</h1>
        <p className="text-gray-600">Manage your subscription and billing information</p>
      </div>

      {/* Current Plan */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
          <CardDescription>Your active subscription details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-semibold">
                  {currentPlan === 'free' ? 'Guardian Free' : plans[currentPlan]?.name || 'Unknown Plan'}
                </h3>
                <Badge variant={isSubscribed ? 'default' : 'secondary'}>
                  {profile?.subscription_status || 'Free'}
                </Badge>
              </div>
              {profile?.subscription_current_period_end && (
                <p className="text-sm text-gray-600 mt-1">
                  Renews on {new Date(profile.subscription_current_period_end).toLocaleDateString()}
                </p>
              )}
            </div>
            {isSubscribed && (
              <Button 
                onClick={handleManageSubscription}
                disabled={loading}
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Manage Subscription
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Billing Toggle */}
      {!isSubscribed && (
        <div className="flex justify-center mb-8">
          <div className="bg-gray-100 p-1 rounded-lg flex items-center gap-2">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${
                billingCycle === 'monthly' ? 'bg-primary text-white' : 'text-gray-700'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${
                billingCycle === 'annual' ? 'bg-primary text-white' : 'text-gray-700'
              }`}
            >
              Annual (Save 17%)
            </button>
          </div>
        </div>
      )}

      {/* Plans */}
      <div className="grid md:grid-cols-3 gap-6">
        {Object.entries(plans).map(([key, plan]) => {
          const isCurrentPlan = currentPlan === key
          const price = billingCycle === 'annual' ? plan.price.annual : plan.price.monthly
          const per = billingCycle === 'annual' ? 'year' : 'month'

          return (
            <Card 
              key={key} 
              className={isCurrentPlan ? 'border-primary border-2' : ''}
            >
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <div className="text-3xl font-bold">
                  ${price}
                  <span className="text-base font-normal text-gray-600">/{per}</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                {isCurrentPlan ? (
                  <Button className="w-full" variant="outline" disabled>
                    Current Plan
                  </Button>
                ) : (
                  <Button 
                    className="w-full" 
                    onClick={() => handleSubscribe(key)}
                    disabled={processingPlan === key}
                  >
                    {processingPlan === key ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      `Upgrade to ${plan.name}`
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Free Trial Notice */}
      {!isSubscribed && (
        <Alert className="mt-8">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>7-Day Free Trial</AlertTitle>
          <AlertDescription>
            All paid plans come with a 7-day free trial. Cancel anytime during the trial period and you won't be charged.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}