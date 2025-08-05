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

interface BillingDashboardProps {
  userId: string
}

export function BillingDashboard({ userId }: BillingDashboardProps) {
  const [loading, setLoading] = useState(true)
  const [subscription, setSubscription] = useState<Stripe.Subscription | null>(null)
  const [paymentMethods, setPaymentMethods] = useState<Stripe.PaymentMethod[]>([])
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
    <div className="space-y-6">
      {/* Current Plan */}
      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
          <CardDescription>Your subscription details and usage</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold">{plan.name}</h3>
                <p className="text-gray-600">{plan.description}</p>
              </div>
              {status && (
                <Badge 
                  variant={status.color === 'green' ? 'default' : status.color === 'red' ? 'destructive' : 'secondary'}
                >
                  {status.label}
                </Badge>
              )}
            </div>

            {subscription && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="flex items-center space-x-3">
                  <DollarSign className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Amount</p>
                    <p className="font-medium">
                      {formatCurrency(subscription.plan.amount)} / {subscription.plan.interval}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Next billing date</p>
                    <p className="font-medium">
                      {subscription.currentPeriodEnd.toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {subscription.cancelAtPeriodEnd && (
                  <div className="flex items-center space-x-3">
                    <AlertCircle className="h-5 w-5 text-yellow-500" />
                    <div>
                      <p className="text-sm text-gray-600">Cancels on</p>
                      <p className="font-medium">
                        {subscription.currentPeriodEnd.toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Usage Limits */}
            <div className="border-t pt-4 mt-4">
              <h4 className="font-medium mb-3">Plan Limits</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Properties</p>
                  <p className="font-medium">
                    {plan.limits.properties === -1 ? 'Unlimited' : plan.limits.properties}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Claims</p>
                  <p className="font-medium">
                    {plan.limits.claims === -1 ? 'Unlimited' : plan.limits.claims}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">AI Requests</p>
                  <p className="font-medium">
                    {plan.limits.aiRequests === -1 ? 'Unlimited' : `${plan.limits.aiRequests}/mo`}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Storage</p>
                  <p className="font-medium">
                    {plan.limits.storage === -1 ? 'Unlimited' : `${plan.limits.storage} GB`}
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
        <TabsList>
          <TabsTrigger value="payment-methods">Payment Methods</TabsTrigger>
          <TabsTrigger value="billing-history">Billing History</TabsTrigger>
        </TabsList>

        <TabsContent value="payment-methods" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment Methods</CardTitle>
              <CardDescription>Manage your payment methods</CardDescription>
            </CardHeader>
            <CardContent>
              {paymentMethods.length === 0 ? (
                <div className="text-center py-8">
                  <CreditCard className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">No payment methods on file</p>
                  <Button onClick={handleManageSubscription}>
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