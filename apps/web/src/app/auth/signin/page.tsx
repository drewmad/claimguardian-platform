/**
 * @fileMetadata
 * @purpose "Sign-in page with robust authentication flow and stale session handling"
 * @owner frontend-team
 * @dependencies ["react", "./sign-in-form"]
 * @exports ["SignInPage"]
 * @complexity low
 * @tags ["auth", "signin", "server"]
 * @status stable
 * @notes Server-rendered with dynamic session detection and reset capability
 */

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { SignInForm } from "./sign-in-form";

// Force dynamic rendering to prevent stale auth state from being cached
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const runtime = 'nodejs';

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const params = await searchParams;

  // Check current auth state without throwing at import time
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  // If we have a valid user, redirect to dashboard
  if (user && !error) {
    redirect('/dashboard');
  }

  // Check if we have auth cookies but no valid user (stale session)
  const cookieStore = await cookies();
  const hasAuthCookie = !!(cookieStore.get('sb-access-token') || 
                          cookieStore.get('sb-refresh-token') ||
                          cookieStore.get('supabase-auth-token'));

  const showResetOption = !user && hasAuthCookie;

  return <SignInForm message={params?.message} showResetOption={showResetOption} />;
}
