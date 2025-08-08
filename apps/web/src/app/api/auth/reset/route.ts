/**
 * @fileMetadata
 * @purpose "Auth session reset endpoint to clear stale Supabase cookies"
 * @owner backend-team
 * @dependencies ["@/lib/supabase/server", "next/server", "next/headers"]
 * @exports ["GET"]
 * @complexity low
 * @tags ["auth", "reset", "cookies"]
 * @status stable
 * @notes Clears all Supabase auth cookies and redirects to sign-in
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function GET() {
  try {
    // Best-effort sign out from Supabase
    const supabase = await createClient();
    try { 
      await supabase.auth.signOut(); 
    } catch {
      // Ignore errors if already signed out or invalid session
    }

    // Explicitly clear all known Supabase cookie names
    const cookieStore = await cookies();
    const clearCookie = (name: string) => {
      cookieStore.set(name, '', {
        path: '/',
        maxAge: 0,
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      });
    };

    // Clear all common Supabase cookie variations
    const cookieNames = [
      'sb-access-token',
      'sb-refresh-token', 
      'supabase-auth-token',
      'supabase.auth.token',
      `sb-${process.env.NEXT_PUBLIC_SUPABASE_URL?.split('://')[1]?.split('.')[0]}-auth-token`,
    ];

    cookieNames.forEach(clearCookie);

    // Construct redirect URL with proper base URL handling
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 
                   (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3001');

    const redirectUrl = new URL('/auth/signin?message=Session%20reset%20successfully', baseUrl);
    
    const response = NextResponse.redirect(redirectUrl);
    
    // Also set cookies in response headers for immediate effect
    cookieNames.forEach(name => {
      response.cookies.set(name, '', {
        path: '/',
        maxAge: 0,
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      });
    });

    return response;

  } catch (error) {
    console.error('Error resetting auth session:', error);
    
    // Fallback redirect even if cookie clearing fails
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 
                   (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3001');
    
    return NextResponse.redirect(
      new URL('/auth/signin?message=Session%20reset%20attempted', baseUrl)
    );
  }
}