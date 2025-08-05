/**
 * @fileMetadata
 * @purpose "Auth layout with server-side authentication checks"
 * @dependencies ["@/lib","next"]
 * @owner frontend-team
 * @status stable
 */

import { redirect } from 'next/navigation'

import { getServerSession } from '@/lib/supabase/server-auth'

// Force dynamic rendering for auth pages since they use cookies
export const dynamic = 'force-dynamic'

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Check if user is already authenticated
  const session = await getServerSession()
  
  if (session) {
    // User is already signed in, redirect to dashboard
    redirect('/dashboard')
  }
  
  // User is not authenticated, show auth pages
  return (
    <div className="min-h-screen">
      {children}
    </div>
  )
}