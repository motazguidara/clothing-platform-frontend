'use client';

import * as React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

const defaultBlurDataURL = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxIiBoZWlnaHQ9IjEiPjwvc3ZnPg==';

type LazyImageProps = {
  src: string;
  alt: string;
  width?: number | `${number}`;
  height?: number | `${number}`;
  className?: string;
  priority?: boolean;
  quality?: number;
  placeholder?: 'blur' | 'empty' | `data:image/${string}`;
  blurDataURL?: string;
  onLoad?: () => void;
  onError?: () => void;
  fill?: boolean;
  sizes?: string;
};

export function LazyImage({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  sizes,
  fill = false,
  quality = 75,
  placeholder = 'empty',
  blurDataURL,
  onLoad,
  onError,
  ...props
}: LazyImageProps) {
  const [isLoading, setIsLoading] = React.useState(true);
  const [hasError, setHasError] = React.useState(false);

  const handleLoad = React.useCallback(() => {
    setIsLoading(false);
    onLoad?.();
  }, [onLoad]);

  const handleError = React.useCallback(() => {
    setHasError(true);
    onError?.();
  }, [onError]);

  if (hasError) {
    return (
      <div className={cn('bg-gray-100 flex items-center justify-center', className)}>
        <span className="sr-only">Image failed to load</span>
      </div>
    );
  }

  // Handle placeholder
  let placeholderProp: 'blur' | 'empty' | `data:image/${string}` = 'empty';
  let blurDataURLProp = blurDataURL;
  
  if (placeholder === 'blur') {
    placeholderProp = 'blur';
    blurDataURLProp = blurDataURL || defaultBlurDataURL;
  } else if (placeholder && placeholder !== 'empty') {
    placeholderProp = placeholder;
  }

  // Create separate props for fill and non-fill cases
  const commonProps = {
    src,
    alt,
    sizes,
    priority,
    quality,
    placeholder: placeholderProp as 'blur' | 'empty',
    // Provide a default empty string if blurDataURL is undefined
    blurDataURL: blurDataURLProp || '',
    onLoadingComplete: handleLoad,
    onError: handleError,
    className: cn(
      'transition-opacity duration-300',
      isLoading ? 'opacity-0' : 'opacity-100',
      className
    ),
  };

  const fillProps = fill
    ? { fill: true as const }
    : {
        width: width ? Number(width) : 0,
        height: height ? Number(height) : 0,
      };

  return (
    <div className={cn('relative overflow-hidden', !fill && 'inline-block')}>
      {fill ? (
        <Image {...commonProps} {...fillProps} />
      ) : (
        <Image {...commonProps} {...fillProps} />
      )}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-black rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}

// Optimized product image component
export function ProductImage({
  src,
  alt,
  className,
  priority = false,
}: {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
}) {
  return (
    <div className={cn('relative w-full h-full', className)}>
      <LazyImage
        src={src}
        alt={alt}
        width={400}
        height={500}
        className="object-cover w-full h-full"
        priority={priority}
        sizes="(max-width: 640px) 100vw, 400px"
      />
    </div>
  );
}

// Hero image component with optimized loading
export function HeroImage({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  return (
    <div className={cn('relative w-full h-full', className)}>
      <LazyImage
        src={src}
        alt={alt}
        fill
        className="object-cover w-full h-full"
        priority
        sizes="100vw"
      />
    </div>
  );
}
