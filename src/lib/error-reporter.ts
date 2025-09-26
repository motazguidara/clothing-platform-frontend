'use client';

// Centralized error reporting utility
export interface ErrorReport {
  error: {
    message: string;
    stack?: string;
    name: string;
  };
  context: {
    type: string;
    url?: string;
    userAgent?: string;
    timestamp: string;
    severity?: 'low' | 'medium' | 'high' | 'critical';
    buildVersion?: string;
    userId?: string;
    sessionId?: string;
    [key: string]: any;
  };
  errorId?: string;
}

export class ErrorReporter {
  private static instance: ErrorReporter;
  private userId?: string;
  private sessionId?: string;

  static getInstance(): ErrorReporter {
    if (!ErrorReporter.instance) {
      ErrorReporter.instance = new ErrorReporter();
    }
    return ErrorReporter.instance;
  }

  constructor() {
    this.sessionId = this.generateSessionId();
  }

  setUserId(userId: string) {
    this.userId = userId;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async reportError(
    error: Error,
    context: Partial<ErrorReport['context']> = {}
  ): Promise<string> {
    const errorId = this.generateErrorId();
    
    const errorReport: ErrorReport = {
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name,
      },
      context: {
        type: 'manual_report',
        url: typeof window !== 'undefined' ? window.location.href : undefined,
        userAgent: typeof window !== 'undefined' ? navigator.userAgent : undefined,
        timestamp: new Date().toISOString(),
        severity: 'medium',
        buildVersion: process.env.NEXT_PUBLIC_BUILD_VERSION || 'unknown',
        userId: this.userId,
        sessionId: this.sessionId,
        ...context,
      },
      errorId,
    };

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.group(`🚨 Error Report (${context.type || 'manual'})`);
      console.error('Error:', error);
      console.error('Context:', errorReport.context);
      console.error('Error ID:', errorId);
      console.groupEnd();
    }

    // Send to monitoring endpoint
    try {
      await fetch('/api/monitoring/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Error-Source': 'error-reporter',
          'X-Error-Type': context.type || 'manual',
        },
        body: JSON.stringify(errorReport),
      });
    } catch (reportError) {
      // Fallback: store in localStorage for later retry
      if (typeof window !== 'undefined') {
        try {
          const failedReports = JSON.parse(
            localStorage.getItem('failed_error_reports') || '[]'
          );
          failedReports.push(errorReport);
          
          // Keep only last 10 failed reports
          if (failedReports.length > 10) {
            failedReports.splice(0, failedReports.length - 10);
          }
          
          localStorage.setItem('failed_error_reports', JSON.stringify(failedReports));
        } catch (storageError) {
          // If localStorage fails, just log in development
          if (process.env.NODE_ENV === 'development') {
            console.error('Failed to store error report:', storageError);
          }
        }
      }
      
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to send error report:', reportError);
      }
    }

    return errorId;
  }

  // Retry failed reports when connection is restored
  async retryFailedReports(): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
      const failedReports = JSON.parse(
        localStorage.getItem('failed_error_reports') || '[]'
      );

      if (failedReports.length === 0) return;

      const retryPromises = failedReports.map((report: ErrorReport) =>
        fetch('/api/monitoring/errors', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Error-Source': 'error-reporter-retry',
          },
          body: JSON.stringify(report),
        }).catch(() => {
          // Keep failed reports for next retry
          return null;
        })
      );

      const results = await Promise.allSettled(retryPromises);
      
      // Remove successfully sent reports
      const stillFailedReports = failedReports.filter((_: any, index: number) => {
        const result = results[index];
        return result.status === 'rejected' || result.value === null;
      });

      localStorage.setItem('failed_error_reports', JSON.stringify(stillFailedReports));

      if (process.env.NODE_ENV === 'development') {
        const successCount = failedReports.length - stillFailedReports.length;
        console.log(`Retried ${failedReports.length} failed reports, ${successCount} succeeded`);
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to retry error reports:', error);
      }
    }
  }

  // Report different types of errors with appropriate context
  async reportNetworkError(error: Error, url: string, method: string): Promise<string> {
    return this.reportError(error, {
      type: 'network_error',
      severity: 'high',
      networkUrl: url,
      httpMethod: method,
    });
  }

  async reportUIError(error: Error, componentName: string): Promise<string> {
    return this.reportError(error, {
      type: 'ui_error',
      severity: 'medium',
      component: componentName,
    });
  }

  async reportPerformanceIssue(metric: string, value: number, threshold: number): Promise<string> {
    const error = new Error(`Performance threshold exceeded: ${metric}`);
    return this.reportError(error, {
      type: 'performance_issue',
      severity: 'medium',
      metric,
      value,
      threshold,
    });
  }

  async reportSecurityIssue(error: Error, details: Record<string, any>): Promise<string> {
    return this.reportError(error, {
      type: 'security_issue',
      severity: 'critical',
      ...details,
    });
  }
}

// Global instance
export const errorReporter = ErrorReporter.getInstance();

// React hook for easy usage
export function useErrorReporter() {
  return {
    reportError: errorReporter.reportError.bind(errorReporter),
    reportNetworkError: errorReporter.reportNetworkError.bind(errorReporter),
    reportUIError: errorReporter.reportUIError.bind(errorReporter),
    reportPerformanceIssue: errorReporter.reportPerformanceIssue.bind(errorReporter),
    reportSecurityIssue: errorReporter.reportSecurityIssue.bind(errorReporter),
    setUserId: errorReporter.setUserId.bind(errorReporter),
  };
}

// Initialize retry mechanism when online
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    errorReporter.retryFailedReports();
  });
  
  // Also retry on page load
  window.addEventListener('load', () => {
    setTimeout(() => errorReporter.retryFailedReports(), 1000);
  });
}
