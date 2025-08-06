'use client'

/**
 * @fileMetadata
 * @purpose "Pricing plans display component with Stripe integration"
 * @dependencies ["@/actions","@/components","@/config","@/hooks","@/lib"]
 * @owner billing-team
 * @status stable
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
      <div className="flex justify-center mb-12">
        <div className="bg-gray-800 p-1 rounded-lg border border-gray-700">
          <button
            onClick={() => setBillingInterval('monthly')}
            className={`px-6 py-3 rounded-md text-sm font-medium transition-all ${
              billingInterval === 'monthly'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingInterval('annually')}
            className={`px-6 py-3 rounded-md text-sm font-medium transition-all ${
              billingInterval === 'annually'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Annual
            <span className="ml-2 text-green-400 text-xs font-semibold">Save 17%</span>
          </button>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((planId) => {
          const plan = PRICING_PLANS[planId]
          const price = billingInterval === 'monthly' 
            ? plan.price.monthly 
            : Math.floor(plan.price.annually / 12)

          return (
            <Card 
              key={plan.id} 
              className={`relative bg-gray-800 border ${
                plan.popular 
                  ? 'border-blue-500 shadow-2xl shadow-blue-500/20 scale-105' 
                  : 'border-gray-700'
              } hover:border-gray-600 transition-all`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                  <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg">
                    MOST POPULAR
                  </span>
                </div>
              )}
              
              <CardHeader className="text-center pt-8">
                <CardTitle className="text-xl font-bold text-white">{plan.name}</CardTitle>
                <CardDescription className="text-gray-400 mt-2">{plan.description}</CardDescription>
                <div className="mt-6">
                  <span className="text-5xl font-bold text-white">${price}</span>
                  <span className="text-gray-400 ml-2">
                    /month
                  </span>
                  {billingInterval === 'annually' && plan.price.annually > 0 && (
                    <div className="text-sm text-gray-500 mt-2">
                      ${plan.price.annually} billed annually
                    </div>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="pt-6">
                <Button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={loading !== null}
                  className={`w-full mb-6 py-6 text-lg font-semibold transition-all ${
                    plan.popular 
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg' 
                      : plan.id === 'free'
                      ? 'bg-gray-700 hover:bg-gray-600 text-white'
                      : 'bg-transparent border-2 border-gray-600 hover:border-blue-500 hover:bg-gray-700 text-white'
                  }`}
                  variant="default"
                >
                  {loading === plan.id ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : plan.id === 'free' ? (
                    'Get Started'
                  ) : (
                    'Subscribe'
                  )}
                </Button>
                
                <ul className="space-y-4">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <Check className="h-5 w-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-300">{feature}</span>
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