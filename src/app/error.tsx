'use client';

import React from 'react';
import { useEffect } from 'react';
import { OptimizedButton } from '@/components/ui/optimized-button';
import { AlertTriangle, RefreshCw, Home, MessageCircle } from 'lucide-react';
import { useMonitoring } from '@/lib/monitoring';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  const { reportError } = useMonitoring();

  useEffect(() => {
    // Report the error to monitoring service
    reportError(error, {
      type: 'page_error',
      digest: error.digest,
      url: window.location.href,
      userAgent: navigator.userAgent,
    });
  }, [error, reportError]);

  const isChunkError = error.message.includes('ChunkLoadError') || 
                     error.message.includes('Loading chunk');
  
  const isNetworkError = error.message.includes('fetch') || 
                        error.message.includes('Network');

  const getErrorTitle = () => {
    if (isChunkError) return 'Update Required';
    if (isNetworkError) return 'Connection Problem';
    return 'Something went wrong';
  };

  const getErrorMessage = () => {
    if (isChunkError) {
      return 'The application has been updated. Please refresh the page to get the latest version.';
    }
    if (isNetworkError) {
      return 'Unable to connect to our servers. Please check your internet connection and try again.';
    }
    return 'We encountered an unexpected error. Our team has been notified and is working on a fix.';
  };

  const getErrorActions = () => {
    if (isChunkError) {
      return (
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <OptimizedButton
            onClick={() => window.location.reload()}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh Page
          </OptimizedButton>
        </div>
      );
    }

    return (
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <OptimizedButton
          onClick={reset}
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Try Again
        </OptimizedButton>
        
        <OptimizedButton
          onClick={() => window.location.href = '/'}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Home className="h-4 w-4" />
          Go Home
        </OptimizedButton>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center">
        {/* Error Icon */}
        <div className="flex justify-center mb-6">
          <div className="rounded-full bg-red-100 p-4">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
        </div>

        {/* Error Content */}
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          {getErrorTitle()}
        </h1>
        
        <p className="text-gray-600 mb-8 leading-relaxed">
          {getErrorMessage()}
        </p>

        {/* Actions */}
        {getErrorActions()}

        {/* Additional Help */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-4">
            Still having trouble?
          </p>
          
          <OptimizedButton
            variant="ghost"
            size="sm"
            onClick={() => {
              const subject = encodeURIComponent('Website Error Report');
              const body = encodeURIComponent(
                `I encountered an error on your website.\n\nError: ${error.message}\nPage: ${window.location.href}\nTime: ${new Date().toISOString()}`
              );
              window.location.href = `mailto:support@yourstore.com?subject=${subject}&body=${body}`;
            }}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
          >
            <MessageCircle className="h-4 w-4" />
            Contact Support
          </OptimizedButton>
        </div>

        {/* Error Details (Development Only) */}
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-8 text-left">
            <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
              Technical Details
            </summary>
            <div className="mt-4 p-4 bg-gray-100 rounded-lg">
              <div className="text-xs font-mono space-y-2">
                <div>
                  <strong>Error:</strong> {error.name}
                </div>
                <div>
                  <strong>Message:</strong> {error.message}
                </div>
                {error.digest && (
                  <div>
                    <strong>Digest:</strong> {error.digest}
                  </div>
                )}
                {error.stack && (
                  <div>
                    <strong>Stack:</strong>
                    <pre className="mt-1 whitespace-pre-wrap break-all text-xs">
                      {error.stack}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </details>
        )}

        {/* Error ID for Support */}
        <p className="mt-6 text-xs text-gray-400">
          Error ID: {error.digest ?? 'N/A'}
        </p>
      </div>
    </div>
  );
}
