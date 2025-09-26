'use client';

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import ErrorBoundary from '@/components/error-boundary';
import { useMonitoring } from '@/lib/monitoring';

interface ClientBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<any>;
  name?: string;
  loading?: () => React.ReactElement;
}

// Default loading component
const DefaultLoading = () => (
  <div className="flex items-center justify-center p-4">
    <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
  </div>
);

export function ClientBoundary({
  children,
  name = 'ClientComponent',
  loading: Loading = DefaultLoading,
}: ClientBoundaryProps) {
  const { reportError } = useMonitoring();

  const handleError = (error: Error, errorInfo: any) => {
    reportError(error, {
      type: 'client_boundary_error',
      componentName: name,
      componentStack: errorInfo.componentStack,
    });
  };

  return (
    <ErrorBoundary onError={handleError} level="component">
      <Suspense fallback={<Loading />}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
}

// HOC for wrapping components with client boundary
export function withClientBoundary<P extends Record<string, any>>(
  Component: React.ComponentType<P>,
  options?: Omit<ClientBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ClientBoundary {...options}>
      <Component {...props} />
    </ClientBoundary>
  );

  WrappedComponent.displayName = `withClientBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
}

// Dynamic import wrapper with proper loading states
export function createDynamicComponent<P extends Record<string, any> = Record<string, any>>(
  importFn: () => Promise<{ default: React.ComponentType<P> }>,
  options?: {
    loading?: () => React.ReactElement;
    ssr?: boolean;
    name?: string;
  }
) {
  const DynamicComponent = dynamic(importFn, {
    loading: options?.loading,
    ssr: options?.ssr ?? false,
  });

  return withClientBoundary(DynamicComponent, {
    name: options?.name || 'DynamicComponent',
    loading: options?.loading,
  });
}

// Performance monitoring wrapper
export function PerformanceWrapper({
  children,
  name,
}: {
  children: React.ReactNode;
  name: string;
}) {
  const { startTransaction } = useMonitoring();

  React.useEffect(() => {
    const transaction = startTransaction(`component.${name}`);
    
    return () => {
      transaction.finish();
    };
  }, [name, startTransaction]);

  return <>{children}</>;
}
