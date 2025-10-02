'use client';

import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Button, type ButtonVariant } from '@/components/ui/button';

export class WishlistErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Wishlist Error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  override render() {
    if (this.state.hasError) {
      // Using type assertion for variant as a workaround for the type issue
      const variant: ButtonVariant = 'secondary';
      
      return (
        <div className="wishlist-error p-4 border border-destructive rounded-md bg-destructive/10">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <p>Something went wrong with the wishlist.</p>
          </div>
          <Button 
            variant={variant}
            size="sm" 
            onClick={this.handleRetry} 
            className="mt-2"
          >
            Retry
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
