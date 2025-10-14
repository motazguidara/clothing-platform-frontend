'use client';

import { useEffect } from 'react';
import { useWishlistStore } from '@/lib/wishlist';
import { useAuth } from '@/hooks/useAuth';
import { TooltipProvider } from '@/components/ui/tooltip';
import { WishlistErrorBoundary } from './wishlist-error-boundary';

interface WishlistProviderProps {
  children: React.ReactNode;
}

export function WishlistProvider({ children }: WishlistProviderProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const setAuthenticated = useWishlistStore((state) => state.setAuthenticated);
  const syncWithServer = useWishlistStore((state) => state.syncWithServer);
  const mergeAnonymousWishlist = useWishlistStore((state) => state.mergeAnonymousWishlist);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    const store = useWishlistStore.getState();
    const wasAuthenticated = store.isAuthenticated;
    const hadAnonymousItems = !wasAuthenticated && store.items.length > 0;

    setAuthenticated(isAuthenticated);

    if (isAuthenticated && !wasAuthenticated) {
      const action = hadAnonymousItems ? mergeAnonymousWishlist : syncWithServer;
      action().catch((error) => {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[wishlist] Failed to finalise auth transition', error);
        }
      });
    }
  }, [isAuthenticated, isLoading, setAuthenticated, mergeAnonymousWishlist, syncWithServer]);

  return (
    <WishlistErrorBoundary>
      <TooltipProvider>
        {children}
      </TooltipProvider>
    </WishlistErrorBoundary>
  );
}
