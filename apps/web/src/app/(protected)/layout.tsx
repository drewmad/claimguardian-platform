/**
 * @fileMetadata
 * @purpose "Protected routes layout with server-side auth validation"
 * @dependencies ["@/lib","next"]
 * @owner frontend-team
 * @status stable
 */

import { redirect } from 'next/navigation'

import { getServerSession } from '@/lib/supabase/server-auth'

interface ProtectedLayoutProps {
  children: React.ReactNode
}

export default async function ProtectedLayout({ children }: ProtectedLayoutProps) {
  // Validate session on server
  const session = await getServerSession()
  
  if (!session) {
    // No valid session, redirect to sign in
    redirect('/auth/signin?message=Please sign in to continue')
  }
  
  // User is authenticated, render protected content
  return <>{children}</>
}