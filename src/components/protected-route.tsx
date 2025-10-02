// src/components/protected-route.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Loading } from '@/components/loading';

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
  requireAuth?: boolean;
  fallback?: React.ReactNode;
}

export function ProtectedRoute({
  children,
  redirectTo = '/login',
  requireAuth = true,
  fallback
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(!requireAuth);

  useEffect(() => {
    if (!isLoading) {
      if (requireAuth && !isAuthenticated) {
        router.push(redirectTo);
      } else if (!requireAuth && isAuthenticated) {
        router.push('/dashboard');
      } else {
        setIsAuthorized(true);
      }
    }
  }, [isAuthenticated, isLoading, redirectTo, requireAuth, router]);

  if (isLoading) {
    return fallback || <Loading variant="dots" text="Checking authentication..." />;
  }

  if (!isAuthorized) {
    return null;
  }

  return <>{children}</>;
}
