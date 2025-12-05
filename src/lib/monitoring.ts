// Production-ready monitoring and error tracking system
'use client';

interface ErrorContext {
  userId?: string;
  sessionId?: string;
  url?: string;
  userAgent?: string;
  timestamp?: string;
  buildVersion?: string;
  environment?: string;
  [key: string]: any;
}

interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 'bytes' | 'count';
  timestamp: number;
  context?: Record<string, any>;
}

class MonitoringService {
  private static instance: MonitoringService;
  private context: ErrorContext = {};
  private performanceObserver?: PerformanceObserver;
  private errorQueue: Array<{ error: Error; context: ErrorContext }> = [];
  private metricsQueue: PerformanceMetric[] = [];
  private isOnline = true;

  static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }

  constructor() {
    this.initializeContext();
    this.setupPerformanceMonitoring();
    this.setupNetworkMonitoring();
    this.setupUnhandledErrorHandling();
  }

  private initializeContext() {
    if (typeof window !== 'undefined') {
      this.context = {
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        buildVersion: process.env["NEXT_PUBLIC_BUILD_VERSION"] || 'unknown',
        environment: process.env.NODE_ENV,
        sessionId: this.generateSessionId(),
      };
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private setupPerformanceMonitoring() {
    if (typeof window === 'undefined' || !window.PerformanceObserver) return;

    try {
      // Monitor Core Web Vitals
      this.performanceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordPerformanceMetric({
            name: entry.name,
            value: entry.startTime,
            unit: 'ms',
            timestamp: Date.now(),
            context: {
              entryType: entry.entryType,
              duration: (entry as any).duration,
            },
          });
        }
      });

      // Observe different types of performance entries
      this.performanceObserver.observe({ entryTypes: ['navigation', 'paint', 'largest-contentful-paint'] });

      // Monitor layout shifts
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            this.recordPerformanceMetric({
              name: 'cumulative-layout-shift',
              value: (entry as any).value,
              unit: 'count',
              timestamp: Date.now(),
            });
          }
        }
      }).observe({ entryTypes: ['layout-shift'] });

      // Monitor first input delay
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordPerformanceMetric({
            name: 'first-input-delay',
            value: (entry as any).processingStart - entry.startTime,
            unit: 'ms',
            timestamp: Date.now(),
          });
        }
      }).observe({ entryTypes: ['first-input'] });

    } catch (error) {
      console.warn('Performance monitoring setup failed:', error);
    }
  }

  private setupNetworkMonitoring() {
    if (typeof window === 'undefined') return;

    // Monitor online/offline status
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.flushQueues();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });

    // Monitor resource loading errors
    window.addEventListener('error', (event) => {
      try {
        const target = event.target as any;
        const isWindowTarget = target === window;
        const isElement =
          target &&
          (target instanceof HTMLImageElement ||
            target instanceof HTMLScriptElement ||
            target instanceof HTMLLinkElement ||
            target instanceof HTMLVideoElement ||
            target instanceof HTMLSourceElement);

        if (!target || isWindowTarget || !isElement) {
          return;
        }

        const source = target.src || target.href || target.currentSrc || '';
        if (!source) return;

        // Ignore known missing media placeholders to avoid noisy reports during local dev
        if (source.includes('/media/products/')) {
          return;
        }

        this.reportError(new Error(`Resource loading failed: ${source}`), {
          type: 'resource_error',
          element: target.tagName,
          source,
        });
      } catch (err) {
        // Swallow to avoid secondary errors during error handling
      }
    }, true);
  }

  private setupUnhandledErrorHandling() {
    if (typeof window === 'undefined') return;

    // Global error handler
    window.addEventListener('error', (event: ErrorEvent) => {
      const reportedError =
        event.error instanceof Error
          ? event.error
          : new Error(event.message || "Script error");

      this.reportError(reportedError, {
        type: 'unhandled_error',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    });

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.reportError(
        event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
        {
          type: 'unhandled_promise_rejection',
        }
      );
    });
  }

  setContext(context: Partial<ErrorContext>) {
    this.context = { ...this.context, ...context };
  }

  setUserId(userId: string) {
    this.context.userId = userId;
  }

  reportError(error: Error, additionalContext: Record<string, any> = {}) {
    // Ignore noisy browser ResizeObserver loop warnings that are not actionable
    const msg = error?.message || "";
    if (
      msg.includes("ResizeObserver loop") ||
      msg.includes("ResizeObserver loop limit exceeded")
    ) {
      return;
    }

    const errorContext: ErrorContext = {
      ...this.context,
      ...additionalContext,
      timestamp: new Date().toISOString(),
    };

    // Add to queue
    this.errorQueue.push({ error, context: errorContext });

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 Error Reported');
      console.error('Error:', error);
      console.log('Context:', errorContext);
      console.groupEnd();
    }

    // Try to send immediately if online
    if (this.isOnline) {
      this.flushErrorQueue();
    }
  }

  recordPerformanceMetric(metric: PerformanceMetric) {
    this.metricsQueue.push(metric);

    // Auto-flush metrics periodically
    if (this.metricsQueue.length >= 10) {
      this.flushMetricsQueue();
    }
  }

  private async flushErrorQueue() {
    if (this.errorQueue.length === 0) return;

    const errors = [...this.errorQueue];
    this.errorQueue = [];

    try {
      await fetch('/api/monitoring/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          errors: errors.map(({ error, context }) => ({
            message: error.message,
            stack: error.stack,
            name: error.name,
            context,
          })),
        }),
      });
    } catch (err) {
      // Re-queue errors if sending failed
      this.errorQueue.unshift(...errors);
      console.warn('Failed to send error reports:', err);
    }
  }

  private async flushMetricsQueue() {
    if (this.metricsQueue.length === 0) return;

    const metrics = [...this.metricsQueue];
    this.metricsQueue = [];

    try {
      await fetch('/api/monitoring/metrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ metrics }),
      });
    } catch (err) {
      // Re-queue metrics if sending failed
      this.metricsQueue.unshift(...metrics);
      console.warn('Failed to send performance metrics:', err);
    }
  }

  private flushQueues() {
    this.flushErrorQueue();
    this.flushMetricsQueue();
  }

  // Public API methods
  startTransaction(name: string): Transaction {
    return new Transaction(name, this);
  }

  recordCustomMetric(name: string, value: number, unit: 'ms' | 'bytes' | 'count' = 'count', context?: Record<string, any>) {
    this.recordPerformanceMetric({
      name,
      value,
      unit,
      timestamp: Date.now(),
      ...(context ? { context } : {}),
    });
  }

  // Cleanup method
  destroy() {
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }
    this.flushQueues();
  }
}

class Transaction {
  private startTime: number;
  private endTime?: number;
  private metrics: Record<string, number> = {};

  constructor(private name: string, private monitoring: MonitoringService) {
    this.startTime = performance.now();
  }

  setMetric(key: string, value: number) {
    this.metrics[key] = value;
  }

  finish() {
    this.endTime = performance.now();
    const duration = this.endTime - this.startTime;

    this.monitoring.recordPerformanceMetric({
      name: `transaction.${this.name}`,
      value: duration,
      unit: 'ms',
      timestamp: Date.now(),
      context: {
        metrics: this.metrics,
      },
    });
  }
}

// React hook for monitoring
export function useMonitoring() {
  const monitoring = MonitoringService.getInstance();

  const reportError = React.useCallback((error: Error, context?: Record<string, any>) => {
    monitoring.reportError(error, context);
  }, [monitoring]);

  const recordMetric = React.useCallback((name: string, value: number, unit?: 'ms' | 'bytes' | 'count', context?: Record<string, any>) => {
    monitoring.recordCustomMetric(name, value, unit, context);
  }, [monitoring]);

  const startTransaction = React.useCallback((name: string) => {
    return monitoring.startTransaction(name);
  }, [monitoring]);

  return {
    reportError,
    recordMetric,
    startTransaction,
    setContext: monitoring.setContext.bind(monitoring),
    setUserId: monitoring.setUserId.bind(monitoring),
  };
}

// Performance monitoring hooks
export function usePageLoadMetrics() {
  React.useEffect(() => {
    const monitoring = MonitoringService.getInstance();

    // Record page load metrics
    if (typeof window !== 'undefined' && window.performance) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      if (navigation) {
        monitoring.recordCustomMetric('page.load.dns', navigation.domainLookupEnd - navigation.domainLookupStart, 'ms');
        monitoring.recordCustomMetric('page.load.tcp', navigation.connectEnd - navigation.connectStart, 'ms');
        monitoring.recordCustomMetric('page.load.request', navigation.responseStart - navigation.requestStart, 'ms');
        monitoring.recordCustomMetric('page.load.response', navigation.responseEnd - navigation.responseStart, 'ms');
        monitoring.recordCustomMetric('page.load.dom', navigation.domContentLoadedEventEnd - navigation.responseEnd, 'ms');
        monitoring.recordCustomMetric('page.load.total', navigation.loadEventEnd - navigation.fetchStart, 'ms');
      }
    }
  }, []);
}

export function useApiMetrics() {
  const monitoring = MonitoringService.getInstance();

  const trackApiCall = React.useCallback(async <T>(
    apiCall: () => Promise<T>,
    endpoint: string
  ): Promise<T> => {
    const transaction = monitoring.startTransaction(`api.${endpoint}`);
    const startTime = performance.now();

    try {
      const result = await apiCall();
      const duration = performance.now() - startTime;
      
      monitoring.recordCustomMetric(`api.${endpoint}.success`, duration, 'ms');
      transaction.setMetric('status', 200);
      transaction.finish();
      
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      
      monitoring.recordCustomMetric(`api.${endpoint}.error`, duration, 'ms');
      monitoring.reportError(error as Error, {
        type: 'api_error',
        endpoint,
        duration,
      });
      
      transaction.setMetric('status', 500);
      transaction.finish();
      
      throw error;
    }
  }, [monitoring]);

  return { trackApiCall };
}

// Initialize monitoring
export const monitoring = MonitoringService.getInstance();

// React import for hooks
import React from 'react';

// Export for use in error boundaries and other components
export { MonitoringService };
