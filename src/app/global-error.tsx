'use client';

import React from 'react';
import { OptimizedButton } from '@/components/ui/optimized-button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  React.useEffect(() => {
    // Only log in development to avoid console spam in production
    if (process.env.NODE_ENV === 'development') {
      console.warn('[global-error] Application error', {
        message: error.message,
        digest: error.digest,
        stack: error.stack,
      });
    }
    
    // Report to monitoring service
    if (typeof window !== 'undefined') {
      const errorReport = {
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name,
        },
        context: {
          type: 'global_error',
          digest: error.digest,
          url: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
          severity: 'critical', // Global errors are critical
          buildVersion: process.env["NEXT_PUBLIC_BUILD_VERSION"] ?? 'unknown',
        },
      };

      // Send to monitoring endpoint
      fetch('/api/monitoring/errors', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Error-Source': 'global-error-boundary'
        },
        body: JSON.stringify(errorReport),
      }).catch((reportError) => {
        // Fallback: try to log to console if monitoring fails
        if (process.env.NODE_ENV === 'development') {
          console.error('Failed to report global error:', reportError);
          console.error('Original error that failed to report:', errorReport);
        }
      });

      // Also try to send to external services if configured
      if (process.env["NEXT_PUBLIC_SENTRY_DSN"]) {
        // Example: Send to Sentry or other error tracking service
        // This would be implemented based on your error tracking service
      }
    }
  }, [error]);

  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full text-center">
            <div className="flex justify-center mb-6">
              <div className="rounded-full bg-red-100 p-4">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Application Error
            </h1>
            
            <p className="text-gray-600 mb-8 leading-relaxed">
              We&apos;re sorry, but something went wrong with the application. 
              Our team has been notified and is working on a fix.
            </p>

            <div className="flex flex-col gap-4">
              <OptimizedButton
                onClick={reset}
                className="flex items-center justify-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Try Again
              </OptimizedButton>
              
              <OptimizedButton
                variant="outline"
                onClick={() => window.location.href = '/'}
              >
                Go to Homepage
              </OptimizedButton>
            </div>

            <p className="mt-8 text-xs text-gray-400">
              Error ID: {error.digest ?? 'N/A'}
            </p>
          </div>
        </div>
      </body>
    </html>
  );
}

