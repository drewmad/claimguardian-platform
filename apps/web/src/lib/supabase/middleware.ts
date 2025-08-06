/**
 * @fileMetadata
 * @owner @ai-team
 * @purpose "Supabase middleware for Next.js with proper cookie handling"
 * @dependencies ["@supabase/ssr", "next"]
 * @status stable
 * @ai-integration multi-provider
 * @insurance-context claims
 * @supabase-integration edge-functions
 */
import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

interface CookieStore {
  get(name: string): { value: string } | undefined
  set(options: { name: string; value: string; [key: string]: unknown }): void
}

interface RequestWithCookies extends Omit<NextRequest, 'cookies'> {
  cookies: CookieStore
}

export function createClient(request: RequestWithCookies, response: NextResponse) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          const cookie = request.cookies.get(name)
          return cookie?.value
        },
        set(name: string, value: string, options: Record<string, unknown>) {
          const cookieOptions = { name, value, ...options }
          request.cookies.set(cookieOptions)
          response.cookies.set(cookieOptions)
        },
        remove(name: string, options: Record<string, unknown>) {
          const cookieOptions = { name, value: '', ...options }
          request.cookies.set(cookieOptions)
          response.cookies.set(cookieOptions)
        },
      },
    }
  )
}