'use client';

import { useEffect } from 'react';
import { useWishlistStore } from '@/lib/wishlist';
import { useAuth } from '@/auth/useAuth';
import { TooltipProvider } from '@/components/ui/tooltip';
import { WishlistErrorBoundary } from './wishlist-error-boundary';

interface WishlistProviderProps {
  children: React.ReactNode;
}

export function WishlistProvider({ children }: WishlistProviderProps) {
  const { isAuthenticated } = useAuth();
  const setAuthenticated = useWishlistStore((state) => state.setAuthenticated);
  const syncWithServer = useWishlistStore((state) => state.syncWithServer);

  // Keep wishlist auth-aware store aligned with current auth status
  useEffect(() => {
    setAuthenticated(isAuthenticated);
  }, [isAuthenticated, setAuthenticated]);

  // Sync wishlist with server on authentication state change
  useEffect(() => {
    if (isAuthenticated) {
      syncWithServer().catch(console.error);
    }
  }, [isAuthenticated, syncWithServer]);

  return (
    <WishlistErrorBoundary>
      <TooltipProvider>
        {children}
      </TooltipProvider>
    </WishlistErrorBoundary>
  );
}
