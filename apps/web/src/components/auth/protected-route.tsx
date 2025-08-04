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

import { useRouter } from 'next/navigation';
import React, { useEffect } from 'react';
import { logger } from '@/lib/logger';

import { AuthLoading } from './auth-loading';
import { useAuth } from './auth-provider';
import { ClientOnlyAuth } from './client-only-auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

function ProtectedRouteInner({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Use secure debug logging only in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      import('@/lib/logger').then(({ logger }) => {
        logger.authDebug('ProtectedRoute', {
          loading,
          hasUser: !!user,
          pathname: typeof window !== 'undefined' ? window.location.pathname : 'server'
        })
      })
    }
  }, [user, loading])

  useEffect(() => {
    if (!loading && !user) {
      const redirectInfo = {
        loading,
        pathname: window.location.pathname,
        timestamp: new Date().toISOString(),
        referrer: document.referrer,
      };
      
      logger.info('Unauthenticated user attempted to access protected route', redirectInfo);
      logger.warn('Route blocked - unauthenticated user', {
        path: window.location.pathname,
        reason: 'unauthenticated',
        userId: undefined,
        ...redirectInfo
      });
      
      logger.warn('[ProtectedRoute] REDIRECT TO "/" - No authenticated user', redirectInfo);
      router.push('/');
    }
  }, [user, loading, router]);

  // Show loading state while checking authentication
  if (loading) {
    return <AuthLoading />;
  }

  // If no user after loading completes, show nothing (redirect will happen)
  if (!user) {
    return <AuthLoading />; // Show loading instead of null to prevent flashing
  }

  // User is authenticated, render children
  return <>{children}</>;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  return (
    <ClientOnlyAuth>
      <ProtectedRouteInner>{children}</ProtectedRouteInner>
    </ClientOnlyAuth>
  );
}
