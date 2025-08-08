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

// Force dynamic rendering and prevent ALL caching
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';
export const preferredRegion = 'auto';

import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { unstable_noStore as noStore } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { SignInForm } from "./sign-in-form";

// Ensure no caching via metadata
export async function generateMetadata() {
  return { 
    other: { 
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    } 
  };
}

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  // Force dynamic rendering - opt into dynamic
  noStore();
  await headers();
  
  const params = await searchParams;

  // Check current auth state - if already signed in, go to dashboard
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (user && !error) {
      redirect('/dashboard');
    }
  } catch (error) {
    // If there's an error checking auth, continue to show sign-in form
    console.log('Auth check error:', error);
  }

  // Check if we have auth cookies but no valid user (stale session)  
  const cookieStore = await cookies();
  const hasAuthCookie = !!(cookieStore.get('sb-access-token') || 
                          cookieStore.get('sb-refresh-token') ||
                          cookieStore.get('supabase-auth-token'));

  const showResetOption = hasAuthCookie;

  return <SignInForm message={params?.message} showResetOption={showResetOption} />;
}
