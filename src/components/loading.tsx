// src/components/loading.tsx
'use client';

import { Loader2, ShoppingBag } from 'lucide-react';

interface LoadingProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'spinner' | 'dots' | 'pulse';
  text?: string;
}

export function Loading({
  className = '',
  size = 'md',
  variant = 'spinner',
  text = 'Loading...'
}: LoadingProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  const renderSpinner = () => (
    <div className={`flex items-center justify-center p-8 ${className}`}>
      <Loader2 className={`${sizeClasses[size]} animate-spin text-primary`} />
      {text && <span className="sr-only">{text}</span>}
    </div>
  );

  const renderDots = () => (
    <div className={`flex items-center justify-center p-8 ${className}`}>
      <div className="flex space-x-1">
        <div className={`w-2 h-2 bg-primary rounded-full animate-bounce`} style={{ animationDelay: '0ms' }}></div>
        <div className={`w-2 h-2 bg-primary rounded-full animate-bounce`} style={{ animationDelay: '150ms' }}></div>
        <div className={`w-2 h-2 bg-primary rounded-full animate-bounce`} style={{ animationDelay: '300ms' }}></div>
      </div>
    </div>
  );

  const renderPulse = () => (
    <div className={`flex items-center justify-center p-8 ${className}`}>
      <ShoppingBag className={`${sizeClasses[size]} text-primary animate-pulse`} />
    </div>
  );

  switch (variant) {
    case 'dots':
      return renderDots();
    case 'pulse':
      return renderPulse();
    default:
      return renderSpinner();
  }
}
