'use client'

/**
 * @fileMetadata
 * @purpose Pricing plans display component with Stripe integration
 * @owner billing-team
 * @status active
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PRICING_PLANS } from '@/config/pricing'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Check, Loader2 } from 'lucide-react'
import { createCheckoutSession } from '@/actions/stripe'
import { stripeClient } from '@/lib/services/stripe-service'
import { useAuth } from '@/hooks/use-auth'
import { toast } from 'sonner'

export function PricingPlans() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'annually'>('monthly')
  const [loading, setLoading] = useState<string | null>(null)

  const handleSubscribe = async (planId: string) => {
    if (authLoading) return
    
    if (!user) {
      router.push('/auth/signin?redirect=/pricing')
      return
    }

    if (planId === 'free') {
      router.push('/dashboard')
      return
    }

    setLoading(planId)
    
    try {
      const result = await createCheckoutSession({
        planId: planId as 'homeowner' | 'landlord' | 'enterprise',
        billingInterval,
        successUrl: `${window.location.origin}/dashboard?payment=success`,
        cancelUrl: `${window.location.origin}/pricing`
      })

      if (result.error) {
        toast.error(result.error)
        return
      }

      if (result.sessionId) {
        await stripeClient.redirectToCheckout(result.sessionId)
      }
    } catch (error) {
      console.error('Subscription error:', error)
      toast.error('Failed to start subscription process')
    } finally {
      setLoading(null)
    }
  }

  const plans = ['free', 'homeowner', 'landlord', 'enterprise']

  return (
    <div>
      {/* Billing Toggle */}
      <div className="flex justify-center mb-8">
        <div className="bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setBillingInterval('monthly')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              billingInterval === 'monthly'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingInterval('annually')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              billingInterval === 'annually'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Annual
            <span className="ml-2 text-green-600 text-xs">Save 17%</span>
          </button>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {plans.map((planId) => {
          const plan = PRICING_PLANS[planId]
          const price = billingInterval === 'monthly' 
            ? plan.price.monthly 
            : Math.floor(plan.price.annually / 12)

          return (
            <Card 
              key={plan.id} 
              className={`relative ${plan.popular ? 'border-blue-600 shadow-lg' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                </div>
              )}
              
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">${price}</span>
                  <span className="text-gray-600 ml-2">
                    /{billingInterval === 'monthly' ? 'mo' : 'mo'}
                  </span>
                  {billingInterval === 'annually' && plan.price.annually > 0 && (
                    <div className="text-sm text-gray-500 mt-1">
                      ${plan.price.annually} billed annually
                    </div>
                  )}
                </div>
              </CardHeader>
              
              <CardContent>
                <Button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={loading !== null}
                  className="w-full mb-6"
                  variant={plan.popular ? 'default' : 'outline'}
                >
                  {loading === plan.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : plan.id === 'free' ? (
                    'Get Started'
                  ) : (
                    'Subscribe'
                  )}
                </Button>
                
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <Check className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}