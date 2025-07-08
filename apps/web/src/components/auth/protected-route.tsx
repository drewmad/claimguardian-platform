/**
 * @fileMetadata
 * @purpose Higher-order component to protect routes that require authentication.
 * @owner frontend-team
 * @dependencies ["react", "@/components/auth/auth-provider"]
 * @exports ["ProtectedRoute"]
 * @complexity low
 * @tags ["auth", "route", "protection"]
 * @status active
 * @notes Redirects unauthenticated users to landing page.
 */
'use client'

import React, { useEffect } from 'react';
import { useAuth } from './auth-provider';
import { useRouter } from 'next/navigation';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto"></div>
          <p className="text-slate-400 mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return <>{children}</>;
}