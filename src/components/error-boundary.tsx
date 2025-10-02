'use client';

import * as React from 'react';
import { OptimizedButton } from './ui/optimized-button';

interface ErrorInfo {
  componentStack: string;
  errorBoundary?: string;
  errorBoundaryStack?: string;
  timestamp?: string;
  userAgent?: string;
  url?: string;
  level?: 'page' | 'section' | 'component';
  retryCount?: number;
  [key: string]: any; // Allow additional properties
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
  retryCount: number;
  maxRetries: number;
  onReload: () => void;
  isolate: boolean;
}

// Extend from React's base Component class with proper type parameters
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryCount = 0;
  private maxRetries = 3;
  
  declare state: ErrorBoundaryState;
  
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    };
  }

  // @ts-ignore - We know this is a valid override
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
      errorInfo: {
        componentStack: '',
        timestamp: new Date().toISOString(),
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
        url: typeof window !== 'undefined' ? window.location.href : '',
      },
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  // @ts-ignore - We know this is a valid override
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    const { onError, level = 'component' } = this.props;
    
    const enhancedErrorInfo: ErrorInfo = {
      ...(this.state.errorInfo || {}),
      componentStack: errorInfo.componentStack || '',
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      url: typeof window !== 'undefined' ? window.location.href : '',
      level,
      retryCount: this.retryCount,
    };

    this.setState({
      error,
      errorInfo: enhancedErrorInfo,
      hasError: true,
    });

    this.logError(error, enhancedErrorInfo);
    onError?.(error, enhancedErrorInfo);
  }

  private logError = (error: Error, errorInfo: ErrorInfo): void => {
    if (process.env.NODE_ENV === 'development') {
      console.group(`🚨 Error Boundary (${this.props.level || 'component'}) Caught an Error`);
      console.error('Error:', error);
      console.error('Error Info:', errorInfo);
      console.error('Component Stack:', errorInfo.componentStack);
      console.error('Props:', this.props);
      console.groupEnd();
    }
  };

  private resetError = (): void => {
    this.retryCount += 1;
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    });
  };

  private reloadPage = (): void => {
    window.location.reload();
  };

  render() {
    const { children, fallback: FallbackComponent, level = 'component', isolate = false } = this.props;
    const { hasError, error, errorInfo, errorId } = this.state;

    if (!hasError || !error || !errorInfo || !errorId) {
      return children;
    }

    if (FallbackComponent) {
      return (
        <FallbackComponent
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

    return (
      <div className="error-boundary">
        <h2>Something went wrong</h2>
        <p>{error.message}</p>
        <pre>{error.stack}</pre>
        <OptimizedButton onClick={this.resetError}>
          Try again
        </OptimizedButton>
      </div>
    );
  }
}

export default ErrorBoundary;
