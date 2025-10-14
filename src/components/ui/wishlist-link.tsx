'use client';

import { Heart } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useWishlistStore } from '@/lib/wishlist';
import { useWishlistIds } from '@/hooks/useWishlist';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import * as React from 'react';

interface WishlistLinkProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'icon';
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
}

export function WishlistLink({ 
  className = '',
  size = 'icon',
  onClick
}: WishlistLinkProps) {
  const localCount = useWishlistStore((s) => s.items.length);
  const { isAuthenticated } = useAuth();
  const { data: server } = useWishlistIds();
  const serverCount = server?.ids?.length ?? 0;
  const count = isAuthenticated ? serverCount : localCount;
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  const displayCount = mounted ? count : 0;
  
  
  return (
    <Link 
      href="/wishlist" 
      className={cn(
        'relative inline-flex items-center justify-center',
        'rounded-md hover:bg-secondary/50',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        'transition-colors',
        {
          'h-10 w-10': size === 'icon',
          'h-9 px-3': size === 'sm',
          'h-10 px-4': size === 'md',
          'h-11 px-6': size === 'lg',
        },
        className
      )}
      {...(onClick ? { onClick } : {})}
      aria-label={`Wishlist (${displayCount} items)`}
    >
      <Heart 
        className={cn(
          'h-5 w-5',
          displayCount > 0 ? 'fill-destructive text-destructive' : 'text-foreground/70'
        )} 
        aria-hidden="true"
      />
      {displayCount > 0 && (
        <>
          <span className="sr-only">({displayCount} items)</span>
          <span 
            className={cn(
              'absolute -top-1 -right-1 bg-red-600 text-white rounded-full z-50',
              'flex items-center justify-center font-bold',
              size === 'sm' ? 'h-5 w-5 min-w-[20px]' : 'h-6 w-6 min-w-[24px]',
              size === 'sm' ? 'text-[11px]' : 'text-sm'
            )}
            aria-hidden="true"
            style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}
          >
            {displayCount > 9 ? '9+' : displayCount}
          </span>
        </>
      )}
    </Link>
  );
}
