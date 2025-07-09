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
import { AuthLoading } from './auth-loading';
import { logger } from '@/lib/logger';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      logger.info('Unauthenticated user attempted to access protected route');
      router.push('/');
    }
  }, [user, loading, router]);

  if (loading) {
    return <AuthLoading />;
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return <>{children}</>;
}