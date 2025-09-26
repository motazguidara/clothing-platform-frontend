'use client';

import React from 'react';
import { Heart } from 'lucide-react';
import { useWishlistItem } from '@/lib/wishlist';
import { OptimizedButton } from '@/components/ui/optimized-button';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface WishlistButtonProps {
  productId: number;
  variantId?: number | undefined;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'ghost' | 'outline';
  showLabel?: boolean;
  className?: string;
  'aria-label'?: string;
}

export function WishlistButton({
  productId,
  variantId,
  size = 'md',
  variant = 'ghost',
  showLabel = false,
  className,
  'aria-label': ariaLabel,
}: WishlistButtonProps) {
  const { isInWishlist, isLoading, toggle } = useWishlistItem(productId, variantId);
  const { toast } = useToast();

  const handleToggle = async () => {
    try {
      const wasInWishlist = isInWishlist;
      await toggle();

      toast({
        title: wasInWishlist ? 'Removed from wishlist' : 'Added to wishlist',
        description: wasInWishlist
          ? 'Item has been removed from your wishlist'
          : 'Item has been added to your wishlist',
        duration: 2000,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update wishlist. Please try again.',
        variant: 'destructive',
        duration: 3000,
      });
    }
  };

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  const buttonSizes = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
  };

  return (
    <OptimizedButton
      variant={variant}
      size={showLabel ? (size === 'md' ? 'default' : size) : 'icon'}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleToggle(); }}
      disabled={isLoading}
      className={cn(
        'relative transition-all duration-200',
        !showLabel && buttonSizes[size],
        'hover:scale-105 active:scale-95',
        isInWishlist && variant === 'ghost' && 'text-red-500 hover:text-red-600',
        className
      )}
      aria-label={
        ariaLabel || 
        (isInWishlist ? 'Remove from wishlist' : 'Add to wishlist')
      }
      aria-pressed={isInWishlist}
    >
      <Heart
        className={cn(
          iconSizes[size],
          'transition-all duration-200',
          isInWishlist ? 'fill-current' : 'fill-none',
          isLoading && 'animate-pulse'
        )}
        aria-hidden="true"
      />
      
      {showLabel && (
        <span className="ml-2">
          {isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
        </span>
      )}
      
      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-md">
          <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}
    </OptimizedButton>
  );
}

// Compact version for product cards
export function WishlistHeartButton({
  productId,
  variantId,
  className,
}: Pick<WishlistButtonProps, 'productId' | 'variantId' | 'className'>) {
  return (
    <WishlistButton
      productId={productId}
      variantId={variantId}
      size="sm"
      variant="ghost"
      className={cn(
        'absolute top-2 right-2 z-10',
        'bg-white/80 backdrop-blur-sm hover:bg-white/90',
        'shadow-sm hover:shadow-md',
        'border border-gray-200/50',
        className
      )}
    />
  );
}

// Accessible version with keyboard navigation
export function AccessibleWishlistButton({
  productId,
  variantId,
  productName,
  className,
}: WishlistButtonProps & { productName?: string }) {
  const { isInWishlist, isLoading, toggle } = useWishlistItem(productId, variantId);
  const { toast } = useToast();
  const [isFocused, setIsFocused] = React.useState(false);

  const handleToggle = async () => {
    try {
      await toggle();
      
      const message = isInWishlist 
        ? `${productName || 'Item'} removed from wishlist`
        : `${productName || 'Item'} added to wishlist`;
      
      toast({
        title: message,
        duration: 2000,
      });
      
      // Announce to screen readers
      const announcement = document.createElement('div');
      announcement.setAttribute('aria-live', 'polite');
      announcement.setAttribute('aria-atomic', 'true');
      announcement.className = 'sr-only';
      announcement.textContent = message;
      document.body.appendChild(announcement);
      
      setTimeout(() => {
        document.body.removeChild(announcement);
      }, 1000);
      
    } catch (error) {
      toast({
        title: 'Error updating wishlist',
        description: 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleToggle();
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      onKeyDown={handleKeyDown}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      disabled={isLoading}
      className={cn(
        'relative inline-flex items-center justify-center',
        'h-10 w-10 rounded-md',
        'transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
        'hover:scale-105 active:scale-95',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        isInWishlist 
          ? 'text-red-500 hover:text-red-600' 
          : 'text-gray-400 hover:text-gray-600',
        className
      )}
      aria-label={
        `${isInWishlist ? 'Remove' : 'Add'} ${productName || 'item'} ${isInWishlist ? 'from' : 'to'} wishlist`
      }
      aria-pressed={isInWishlist}
      aria-describedby={`wishlist-status-${productId}`}
    >
      <Heart
        className={cn(
          'h-5 w-5 transition-all duration-200',
          isInWishlist ? 'fill-current' : 'fill-none',
          isFocused && 'scale-110',
          isLoading && 'animate-pulse'
        )}
        aria-hidden="true"
      />
      
      {/* Screen reader status */}
      <span 
        id={`wishlist-status-${productId}`}
        className="sr-only"
      >
        {isInWishlist ? 'In wishlist' : 'Not in wishlist'}
      </span>
      
      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-md">
          <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}
    </button>
  );
}
