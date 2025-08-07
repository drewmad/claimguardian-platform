'use client'

/**
 * @fileMetadata
 * @purpose "Billing dashboard component with subscription management"
 * @dependencies ["@/components","@/config","@/lib","next","react"]
 * @owner billing-team
 * @status stable
 */

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CreditCard, Download, ExternalLink, Loader2, AlertCircle, Calendar, DollarSign } from 'lucide-react'
import {
  getSubscriptionDetails,
  createPortalSession,
  getPaymentMethods,
  cancelSubscription,
  resumeSubscription
} from '@/actions/stripe'
import { PRICING_PLANS } from '@/config/pricing'
import { formatCurrency, getSubscriptionStatus } from '@/lib/services/stripe-service'
import { toast } from 'sonner'
import Link from 'next/link'
import { Stripe } from 'stripe'

interface BillingDashboardProps {
  userId: string
}

export function BillingDashboard({ userId }: BillingDashboardProps) {
  const [loading, setLoading] = useState(true)
  const [subscription, setSubscription] = useState<any | null>(null)
  const [paymentMethods, setPaymentMethods] = useState<any[]>([])
  const [currentPlan, setCurrentPlan] = useState('free')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    loadBillingData()
  }, [])

  const loadBillingData = async () => {
    try {
      const [subDetails, methods] = await Promise.all([
        getSubscriptionDetails(),
        getPaymentMethods()
      ])

      if (!subDetails.error && subDetails.subscription) {
        setSubscription(subDetails.subscription)
        setCurrentPlan(subDetails.plan || 'free')
      }

      if (!methods.error) {
        setPaymentMethods(methods.paymentMethods || [])
      }
    } catch (error) {
      console.error('Error loading billing data:', error)
      toast.error('Failed to load billing information')
    } finally {
      setLoading(false)
    }
  }

  const handleManageSubscription = async () => {
    setActionLoading('portal')
    try {
      const result = await createPortalSession({
        returnUrl: `${window.location.origin}/dashboard/billing`
      })

      if (result.error) {
        toast.error(result.error)
        return
      }

      if (result.url) {
        window.location.href = result.url
      }
    } catch (error) {
      console.error('Error opening billing portal:', error)
      toast.error('Failed to open billing portal')
    } finally {
      setActionLoading(null)
    }
  }

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? You will retain access until the end of your billing period.')) {
      return
    }

    setActionLoading('cancel')
    try {
      const result = await cancelSubscription()

      if (result.error) {
        toast.error(result.error)
        return
      }

      toast.success('Subscription canceled. You retain access until ' + result.cancelAt?.toLocaleDateString())
      await loadBillingData()
    } catch (error) {
      console.error('Error canceling subscription:', error)
      toast.error('Failed to cancel subscription')
    } finally {
      setActionLoading(null)
    }
  }

  const handleResumeSubscription = async () => {
    setActionLoading('resume')
    try {
      const result = await resumeSubscription()

      if (result.error) {
        toast.error(result.error)
        return
      }

      toast.success('Subscription resumed successfully')
      await loadBillingData()
    } catch (error) {
      console.error('Error resuming subscription:', error)
      toast.error('Failed to resume subscription')
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  const plan = PRICING_PLANS[currentPlan]
  const status = subscription ? getSubscriptionStatus(subscription.status) : null

  return (
    <div className="space-y-6 p-6">
      {/* Current Plan */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader className="border-b border-gray-700">
          <CardTitle className="text-xl text-white">Current Plan</CardTitle>
          <CardDescription className="text-gray-400">Your subscription details and usage</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-3xl font-bold text-white">{plan.name}</h3>
                <p className="text-gray-400 mt-1">{plan.description}</p>
              </div>
              {status && (
                <Badge
                  className={`px-3 py-1 ${
                    status.color === 'green'
                      ? 'bg-green-500/20 text-green-400 border-green-500/50'
                      : status.color === 'red'
                      ? 'bg-red-500/20 text-red-400 border-red-500/50'
                      : 'bg-gray-500/20 text-gray-400 border-gray-500/50'
                  }`}
                >
                  {status.label}
                </Badge>
              )}
            </div>

            {subscription && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 p-6 bg-gray-900/50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <DollarSign className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Amount</p>
                    <p className="font-semibold text-white">
                      {formatCurrency(subscription.plan.amount)} / {subscription.plan.interval}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <Calendar className="h-5 w-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Next billing date</p>
                    <p className="font-semibold text-white">
                      {subscription.currentPeriodEnd.toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {subscription.cancelAtPeriodEnd && (
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-yellow-500/20 rounded-lg">
                      <AlertCircle className="h-5 w-5 text-yellow-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Cancels on</p>
                      <p className="font-semibold text-white">
                        {subscription.currentPeriodEnd.toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Usage Limits */}
            <div className="border-t border-gray-700 pt-6 mt-6">
              <h4 className="font-semibold text-white mb-4">Plan Limits</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-900/50 p-4 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Properties</p>
                  <p className="font-bold text-lg text-white">
                    {plan.limits.properties === -1 ? '∞' : plan.limits.properties}
                  </p>
                </div>
                <div className="bg-gray-900/50 p-4 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Claims</p>
                  <p className="font-bold text-lg text-white">
                    {plan.limits.claims === -1 ? '∞' : plan.limits.claims}
                  </p>
                </div>
                <div className="bg-gray-900/50 p-4 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">AI Requests</p>
                  <p className="font-bold text-lg text-white">
                    {plan.limits.aiRequests === -1 ? '∞' : `${plan.limits.aiRequests}`}
                  </p>
                  {plan.limits.aiRequests !== -1 && <p className="text-xs text-gray-500">per month</p>}
                </div>
                <div className="bg-gray-900/50 p-4 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Storage</p>
                  <p className="font-bold text-lg text-white">
                    {plan.limits.storage === -1 ? '∞' : `${plan.limits.storage} GB`}
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              {currentPlan !== 'free' && (
                <Button
                  onClick={handleManageSubscription}
                  disabled={actionLoading !== null}
                  variant="outline"
                >
                  {actionLoading === 'portal' ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <ExternalLink className="h-4 w-4 mr-2" />
                  )}
                  Manage in Stripe
                </Button>
              )}

              {subscription && !subscription.cancelAtPeriodEnd && currentPlan !== 'free' && (
                <Button
                  onClick={handleCancelSubscription}
                  disabled={actionLoading !== null}
                  variant="outline"
                  className="text-red-600 hover:text-red-700"
                >
                  {actionLoading === 'cancel' && (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  )}
                  Cancel Subscription
                </Button>
              )}

              {subscription?.cancelAtPeriodEnd && (
                <Button
                  onClick={handleResumeSubscription}
                  disabled={actionLoading !== null}
                >
                  {actionLoading === 'resume' && (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  )}
                  Resume Subscription
                </Button>
              )}

              <Link href="/pricing">
                <Button variant={currentPlan === 'free' ? 'default' : 'outline'}>
                  {currentPlan === 'free' ? 'Upgrade Plan' : 'Change Plan'}
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Methods & History Tabs */}
      <Tabs defaultValue="payment-methods" className="space-y-4">
        <TabsList className="bg-gray-800 border border-gray-700">
          <TabsTrigger value="payment-methods" className="data-[state=active]:bg-gray-700 text-gray-400 data-[state=active]:text-white">
            Payment Methods
          </TabsTrigger>
          <TabsTrigger value="billing-history" className="data-[state=active]:bg-gray-700 text-gray-400 data-[state=active]:text-white">
            Billing History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="payment-methods" className="space-y-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="border-b border-gray-700">
              <CardTitle className="text-white">Payment Methods</CardTitle>
              <CardDescription className="text-gray-400">Manage your payment methods</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {paymentMethods.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CreditCard className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-gray-400 mb-4">No payment methods on file</p>
                  <Button
                    onClick={handleManageSubscription}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Add Payment Method
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {paymentMethods.map((method) => (
                    <div key={method.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <CreditCard className="h-8 w-8 text-gray-400" />
                        <div>
                          <p className="font-medium">
                            {method.card.brand.charAt(0).toUpperCase() + method.card.brand.slice(1)} •••• {method.card.last4}
                          </p>
                          <p className="text-sm text-gray-600">
                            Expires {method.card.expMonth}/{method.card.expYear}
                          </p>
                        </div>
                      </div>
                      {method.isDefault && (
                        <Badge variant="secondary">Default</Badge>
                      )}
                    </div>
                  ))}
                  <Button
                    onClick={handleManageSubscription}
                    variant="outline"
                    className="w-full mt-4"
                  >
                    Manage Payment Methods
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing-history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Billing History</CardTitle>
              <CardDescription>Download invoices and receipts</CardDescription>
            </CardHeader>
            <CardContent>
              {currentPlan === 'free' ? (
                <div className="text-center py-8">
                  <Download className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">No billing history available</p>
                  <p className="text-sm text-gray-500 mt-2">Upgrade to a paid plan to see billing history</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Access your full billing history and download invoices from the Stripe billing portal.
                    </AlertDescription>
                  </Alert>
                  <Button onClick={handleManageSubscription} variant="outline" className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    View Billing History
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
