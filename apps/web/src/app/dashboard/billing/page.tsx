/**
 * @fileMetadata
 * @purpose "Billing dashboard for subscription management"
 * @dependencies ["@/components","@/lib","next"]
 * @owner billing-team
 * @status stable
 */

import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BillingDashboard } from '@/components/billing/billing-dashboard'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'

export const metadata: Metadata = {
  title: 'Membership & Billing | ClaimGuardian',
  description: 'Manage your subscription, payment methods, and view invoices',
}

export default async function BillingPage() {
  const supabase = await createClient()
  
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    redirect('/auth/signin?redirect=/dashboard/billing')
  }

  return (
    <DashboardLayout>
      <div className="p-6 bg-gray-900 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Membership & Billing</h1>
            <p className="text-gray-400">Manage your subscription, payment methods, and view invoices.</p>
          </div>
          
          <BillingDashboard userId={user.id} />
        </div>
      </div>
    </DashboardLayout>
  )
}