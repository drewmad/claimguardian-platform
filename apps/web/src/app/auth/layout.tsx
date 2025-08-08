/**
 * @fileMetadata
 * @purpose "Auth layout with server-side authentication checks"
 * @dependencies ["@/lib","next"]
 * @owner frontend-team
 * @status stable
 */

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { unstable_noStore as noStore } from 'next/cache';

import { getServerSession } from "@/lib/supabase/server-auth";

// Force dynamic rendering for auth pages since they use cookies
export const runtime = 'nodejs';
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = 'force-no-store';
export const preferredRegion = 'auto';

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

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Force dynamic rendering - opt into dynamic
  noStore();
  await headers();
  
  // Check if user is already authenticated
  const session = await getServerSession();

  if (session) {
    // User is already signed in, redirect to dashboard
    redirect("/dashboard");
  }

  // User is not authenticated, show auth pages
  return <div className="min-h-screen">{children}</div>;
}
