/**
 * @fileMetadata
 * @purpose Protected routes layout with server-side auth validation
 * @owner frontend-team
 * @status active
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