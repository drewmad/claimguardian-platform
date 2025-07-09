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

import React, { useEffect, useState } from 'react';
import { useAuth } from './auth-provider';
import { useRouter } from 'next/navigation';
import { AuthLoading } from './auth-loading';
import { logger } from '@/lib/logger';
import { enhancedLogger } from '@/lib/logger/enhanced-logger';
import { ClientOnlyAuth } from './client-only-auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

function ProtectedRouteInner({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  
  // Debug logging
  if (typeof window !== 'undefined') {
    console.log('[ProtectedRoute] Rendered with user:', user?.id, 'loading:', loading, 'pathname:', window.location.pathname);
  }

  useEffect(() => {
    // Give auth provider time to initialize
    const checkAuth = async () => {
      // Wait a bit for auth to stabilize
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (!loading && !user) {
        logger.info('Unauthenticated user attempted to access protected route', {
          loading,
          user: user?.id,
          pathname: window.location.pathname
        });
        enhancedLogger.routeBlocked(window.location.pathname, 'unauthenticated', {
          userId: user?.id
        });
        router.push('/');
      }
      
      setIsChecking(false);
    };
    
    checkAuth();
  }, [user, loading, router]);

  // Show loading state while checking authentication
  if (loading || isChecking) {
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