"use client";

import React from 'react';
import { OptimizedButton } from './ui/optimized-button';

interface ErrorInfo {
  componentStack: string;
  errorBoundary?: string;
  errorBoundaryStack?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  isolate?: boolean;
  level?: 'page' | 'section' | 'component';
}

interface ErrorFallbackProps {
  error: Error;
  errorInfo: ErrorInfo;
  resetError: () => void;
  errorId: string;
  level: string;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryCount = 0;
  private maxRetries = 3;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return {
      hasError: true,
      error,
      errorId,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { onError, level = 'component' } = this.props;
    
    // Enhanced error info
    const enhancedErrorInfo = {
      ...errorInfo,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      level,
      retryCount: this.retryCount,
    };

    this.setState({
      errorInfo: enhancedErrorInfo,
    });

    // Log error to monitoring service
    this.logError(error, enhancedErrorInfo);

    // Call custom error handler
    onError?.(error, enhancedErrorInfo);

    // Report to analytics
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'exception', {
        description: error.message,
        fatal: level === 'page',
        error_id: this.state.errorId,
      });
    }
  }

  private logError = (error: Error, errorInfo: any) => {
    // Log to console in development with better formatting
    if (process.env.NODE_ENV === 'development') {
      console.group(`🚨 Error Boundary (${this.props.level || 'component'}) Caught an Error`);
      console.error('Error:', error);
      console.error('Error Info:', errorInfo);
      console.error('Component Stack:', errorInfo.componentStack);
      console.error('Props:', this.props);
      console.groupEnd();
    }

    // Send to error monitoring service (e.g., Sentry, LogRocket)
    if (typeof window !== 'undefined') {
      // Example: Sentry integration
      // Sentry.captureException(error, {
      //   contexts: {
      //     errorBoundary: {
      //       componentStack: errorInfo.componentStack,
      //       errorBoundary: errorInfo.errorBoundary,
      //       level: this.props.level,
      //     },
      //   },
      //   tags: {
      //     errorBoundary: true,
      //     level: this.props.level,
      //   },
      // });

      // Send to monitoring endpoint with enhanced context
      const errorReport = {
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name,
        },
        errorInfo: {
          ...errorInfo,
          level: this.props.level || 'component',
          retryCount: this.retryCount,
        },
        errorId: this.state.errorId,
        timestamp: new Date().toISOString(),
        context: {
          url: window.location.href,
          userAgent: navigator.userAgent,
          buildVersion: process.env.NEXT_PUBLIC_BUILD_VERSION || 'unknown',
        },
      };

      fetch('/api/monitoring/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Error-Source': 'error-boundary',
          'X-Error-Level': this.props.level || 'component',
        },
        body: JSON.stringify(errorReport),
      }).catch((reportError) => {
        // Fallback logging in development
        if (process.env.NODE_ENV === 'development') {
          console.error('Failed to report error to monitoring:', reportError);
          console.error('Original error report:', errorReport);
        }
      });
    }
  };

  private resetError = () => {
    this.retryCount += 1;
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    });
  };

  private reloadPage = () => {
    window.location.reload();
  };

  render() {
    const { hasError, error, errorInfo, errorId } = this.state;
    const { children, fallback: Fallback, isolate = false, level = 'component' } = this.props;

    if (hasError && error && errorInfo && errorId) {
      // Use custom fallback if provided
      if (Fallback) {
        return (
          <Fallback
            error={error}
            errorInfo={errorInfo}
            resetError={this.resetError}
            errorId={errorId}
            level={level}
          />
        );
      }

      // Default fallback UI based on level
      return (
        <ErrorFallback
          error={error}
          errorInfo={errorInfo}
          resetError={this.resetError}
          errorId={errorId}
          level={level}
          retryCount={this.retryCount}
          maxRetries={this.maxRetries}
          onReload={this.reloadPage}
          isolate={isolate}
        />
      );
    }

    return children;
  }
}

// Default Error Fallback Component
interface DefaultErrorFallbackProps extends ErrorFallbackProps {
  retryCount: number;
  maxRetries: number;
  onReload: () => void;
  isolate: boolean;
}

const ErrorFallback: React.FC<DefaultErrorFallbackProps> = ({
  error,
  errorInfo,
  resetError,
  errorId,
  level,
  retryCount,
  maxRetries,
  onReload,
  isolate,
}) => {
  const [showDetails, setShowDetails] = React.useState(false);
  const [reportSent, setReportSent] = React.useState(false);

  const canRetry = retryCount < maxRetries;
  const isPageLevel = level === 'page';

  const sendReport = async () => {
    try {
      await fetch('/api/error-reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          errorId,
          userFeedback: 'User reported error',
          timestamp: new Date().toISOString(),
        }),
      });
      setReportSent(true);
    } catch {
      // Silently fail
    }
  };

  const getErrorIcon = () => {
    switch (level) {
      case 'page':
        return '🚨';
      case 'section':
        return '⚠️';
      default:
        return '❌';
    }
  };

  const getErrorTitle = () => {
    switch (level) {
      case 'page':
        return 'Page Error';
      case 'section':
        return 'Section Error';
      default:
        return 'Component Error';
    }
  };

  const getErrorMessage = () => {
    if (error.message.includes('ChunkLoadError') || error.message.includes('Loading chunk')) {
      return 'Failed to load application resources. This might be due to a network issue or an app update.';
    }
    
    if (error.message.includes('Network')) {
      return 'Network connection error. Please check your internet connection.';
    }

    return isPageLevel 
      ? 'Something went wrong with this page.' 
      : 'This component encountered an error.';
  };

  return (
    <div
      className={`
        ${isPageLevel ? 'min-h-screen flex items-center justify-center bg-gray-50' : 'p-4 bg-red-50 border border-red-200 rounded-lg'}
        ${isolate ? 'isolate' : ''}
      `}
    >
      <div className={`text-center ${isPageLevel ? 'max-w-md mx-auto' : 'max-w-sm'}`}>
        <div className="text-4xl mb-4">{getErrorIcon()}</div>
        
        <h2 className={`font-bold text-gray-900 mb-2 ${isPageLevel ? 'text-2xl' : 'text-lg'}`}>
          {getErrorTitle()}
        </h2>
        
        <p className="text-gray-600 mb-6">
          {getErrorMessage()}
        </p>

        <div className="space-y-3">
          {/* Primary Actions */}
          <div className="flex gap-3 justify-center">
            {canRetry && (
              <OptimizedButton onClick={resetError} variant="default">
                Try Again
              </OptimizedButton>
            )}
            
            {isPageLevel && (
              <OptimizedButton onClick={onReload} variant="outline">
                Reload Page
              </OptimizedButton>
            )}
          </div>

          {/* Secondary Actions */}
          <div className="flex gap-3 justify-center">
            <OptimizedButton
              onClick={() => setShowDetails(!showDetails)}
              variant="ghost"
              size="sm"
            >
              {showDetails ? 'Hide' : 'Show'} Details
            </OptimizedButton>
            
            <OptimizedButton
              onClick={sendReport}
              variant="ghost"
              size="sm"
              disabled={reportSent}
            >
              {reportSent ? 'Report Sent' : 'Report Issue'}
            </OptimizedButton>
          </div>
        </div>

        {/* Error Details */}
        {showDetails && (
          <div className="mt-6 p-4 bg-gray-100 rounded-lg text-left">
            <details className="text-sm">
              <summary className="cursor-pointer font-medium mb-2">
                Technical Details
              </summary>
              <div className="space-y-2 text-xs font-mono">
                <div>
                  <strong>Error ID:</strong> {errorId}
                </div>
                <div>
                  <strong>Error:</strong> {error.name}: {error.message}
                </div>
                <div>
                  <strong>Retry Count:</strong> {retryCount}/{maxRetries}
                </div>
                {process.env.NODE_ENV === 'development' && (
                  <>
                    <div>
                      <strong>Stack:</strong>
                      <pre className="mt-1 whitespace-pre-wrap break-all">
                        {error.stack}
                      </pre>
                    </div>
                    <div>
                      <strong>Component Stack:</strong>
                      <pre className="mt-1 whitespace-pre-wrap break-all">
                        {errorInfo.componentStack}
                      </pre>
                    </div>
                  </>
                )}
              </div>
            </details>
          </div>
        )}

        {/* Help Text */}
        <p className="text-xs text-gray-500 mt-4">
          If this problem persists, please contact support with Error ID: {errorId}
        </p>
      </div>
    </div>
  );
};

// Higher-order component for easy wrapping
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

// Hook for programmatic error reporting
export const useErrorReporting = () => {
  const reportError = React.useCallback((error: Error, context?: Record<string, any>) => {
    const errorId = `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Manual Error Report:', error, context);
    }

    // Send to monitoring service
    if (typeof window !== 'undefined') {
      fetch('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          error: {
            message: error.message,
            stack: error.stack,
            name: error.name,
          },
          context,
          errorId,
          timestamp: new Date().toISOString(),
          manual: true,
        }),
      }).catch(() => {
        // Silently fail
      });
    }

    return errorId;
  }, []);

  return { reportError };
};

export default ErrorBoundary;
