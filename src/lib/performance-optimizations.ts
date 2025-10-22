// Advanced performance optimization utilities

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  Suspense,
  forwardRef,
  lazy
} from 'react';
import type { ComponentType } from 'react';

// Debounce hook with proper cleanup
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Throttle hook
export function useThrottle<T>(value: T, limit: number): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastRan = useRef<number>(Date.now());

  useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastRan.current >= limit) {
        setThrottledValue(value);
        lastRan.current = Date.now();
      }
    }, limit - (Date.now() - lastRan.current));

    return () => {
      clearTimeout(handler);
    };
  }, [value, limit]);

  return throttledValue;
}

// Intersection Observer hook for lazy loading
export function useIntersectionObserver(
  ref: React.RefObject<Element>,
  options: IntersectionObserverInit = {}
): IntersectionObserverEntry | null {
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);

  useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(([entry]) => {
      setEntry(entry || null);
    }, options);

    observer.observe(ref.current);

    return () => {
      observer.disconnect();
    };
  }, [ref, options.threshold, options.root, options.rootMargin]);

  return entry;
}

// Virtual scrolling hook for large lists
export function useVirtualScroll<T>({
  items,
  itemHeight,
  containerHeight,
  overscan = 5,
}: {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}) {
  const [scrollTop, setScrollTop] = React.useState(0);

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );

  const visibleItems = items.slice(startIndex, endIndex + 1);
  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return {
    visibleItems,
    totalHeight,
    offsetY,
    handleScroll,
    startIndex,
    endIndex,
  };
}

// Optimized image loading hook
export function useOptimizedImage(src: string, options: {
  lazy?: boolean;
  placeholder?: string;
  sizes?: string;
} = {}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(options.placeholder || '');
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!src) {
      setIsError(true);
      return;
    }

    const img = new Image();

    img.onload = () => {
      setCurrentSrc(src);
      setIsLoaded(true);
      setIsError(false);
    };

    img.onerror = () => {
      setIsError(true);
      setIsLoaded(false);
    };

    if (options.lazy && imgRef.current) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry && entry.isIntersecting) {
            img.src = src;
            observer.disconnect();
          }
        },
        { threshold: 0.1 }
      );

      observer.observe(imgRef.current);
      return () => observer.disconnect();
    } else {
      img.src = src;
      return; // Explicit return for non-lazy loading
    }
  }, [src, options.lazy]);

  return {
    src: currentSrc,
    isLoaded,
    isError,
    ref: imgRef,
  };
}

// Memory-efficient state management
export function useMemoryEfficientState<T>(
  initialState: T,
  options: {
    maxHistory?: number;
    serialize?: boolean;
  } = {}
) {
  const { maxHistory = 10, serialize = false } = options;
  const [state, setState] = useState<T>(initialState);
  const historyRef = useRef<T[]>([initialState]);

  const setStateWithHistory = useCallback((newState: T | ((prev: T) => T)) => {
    setState(prev => {
      const next = typeof newState === 'function' ? (newState as (prev: T) => T)(prev) : newState;
      
      // Manage history
      historyRef.current.push(serialize ? JSON.parse(JSON.stringify(next)) : next);
      if (historyRef.current.length > maxHistory) {
        historyRef.current.shift();
      }
      
      return next;
    });
  }, [maxHistory, serialize]);

  const undo = useCallback(() => {
    if (historyRef.current.length > 1) {
      historyRef.current.pop();
      const previous = historyRef.current[historyRef.current.length - 1];
      if (previous !== undefined) {
        setState(previous);
      }
    }
  }, []);

  const canUndo = historyRef.current.length > 1;

  return [state, setStateWithHistory, { undo, canUndo, history: historyRef.current }] as const;
}

// Optimized event handler
export function useOptimizedCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList
): T {
  const ref = useRef<T>(callback);
  
  useEffect(() => {
    ref.current = callback;
  }, deps);

  return useCallback((...args: Parameters<T>) => {
    return ref.current(...args);
  }, []) as T;
}

// Bundle splitting utilities
export function createLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallback?: ComponentType
) {
  const LazyComponent = lazy(importFn);
  
  const WrappedComponent = forwardRef<any, React.ComponentProps<T>>((props, ref) => {
    return React.createElement(
      Suspense,
      {
        fallback: fallback 
          ? React.createElement(fallback) 
          : React.createElement('div', { children: 'Loading...' })
      },
      React.createElement(LazyComponent as any, { ...props, ref })
    );
  });
  
  WrappedComponent.displayName = `LazyComponent(${(LazyComponent as any).displayName || (LazyComponent as any).name || 'Component'})`;
  
  return WrappedComponent;
}

// Resource preloading
export function useResourcePreloader() {
  const preloadedResources = useRef<Set<string>>(new Set());

  const preloadImage = useCallback((src: string) => {
    if (preloadedResources.current.has(src)) return;
    
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = src;
    document.head.appendChild(link);
    
    preloadedResources.current.add(src);
  }, []);

  const preloadScript = useCallback((src: string) => {
    if (preloadedResources.current.has(src)) return;
    
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'script';
    link.href = src;
    document.head.appendChild(link);
    
    preloadedResources.current.add(src);
  }, []);

  const preloadRoute = useCallback((href: string) => {
    if (preloadedResources.current.has(href)) return;
    
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = href;
    document.head.appendChild(link);
    
    preloadedResources.current.add(href);
  }, []);

  return { preloadImage, preloadScript, preloadRoute };
}

// Performance monitoring hook
export function usePerformanceMonitor(componentName: string) {
  const renderStartTime = useRef<number>(performance.now());
  const renderCount = useRef<number>(0);

  useEffect(() => {
    renderCount.current += 1;
    const renderTime = performance.now() - renderStartTime.current;
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`${componentName} render #${renderCount.current}: ${Number(renderTime || 0).toFixed(2)}ms`);
    }
    
    // Report to monitoring service
    if (typeof window !== 'undefined' && (window as any).monitoring) {
      (window as any).monitoring.recordCustomMetric(
        `component.${componentName}.render`,
        renderTime,
        'ms'
      );
    }
  });

  useEffect(() => {
    renderStartTime.current = performance.now();
  });
}

// Optimized list rendering
export function useOptimizedList<T>(
  items: T[],
  keyExtractor: (item: T, index: number) => string | number,
  renderItem: (item: T, index: number) => React.ReactNode,
  options: {
    windowSize?: number;
    threshold?: number;
  } = {}
) {
  const { windowSize = 10, threshold = 5 } = options;
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: windowSize });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;

    const { scrollTop, clientHeight } = containerRef.current;
    const itemHeight = clientHeight / windowSize;
    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - threshold);
    const end = Math.min(items.length, start + windowSize + threshold * 2);

    setVisibleRange({ start, end });
  }, [items.length, windowSize, threshold]);

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.start, visibleRange.end).map((item, index) => ({
      key: keyExtractor(item, visibleRange.start + index),
      element: renderItem(item, visibleRange.start + index),
      originalIndex: visibleRange.start + index,
    }));
  }, [items, visibleRange, keyExtractor, renderItem]);

  const [containerHeight, setContainerHeight] = useState(0);

  useEffect(() => {
    if (containerRef.current) {
      const updateHeight = () => {
        if (containerRef.current) {
          setContainerHeight(containerRef.current.clientHeight);
        }
      };

      updateHeight();
      window.addEventListener('resize', updateHeight);
      return () => window.removeEventListener('resize', updateHeight);
    }
    return undefined;
  }, []); // Empty dependency array since we only want to run once on mount

  return {
    visibleItems,
    containerRef,
    handleScroll,
    totalHeight: items.length * (containerHeight || windowSize * 50), // Use tracked height or fallback
  };
}

// Cache management
export function useCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: {
    ttl?: number;
    staleWhileRevalidate?: boolean;
  } = {}
) {
  const { ttl = 5 * 60 * 1000, staleWhileRevalidate = true } = options; // 5 minutes default
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const cacheRef = useRef<Map<string, { data: T; timestamp: number }>>(new Map());

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await fetcher();
      cacheRef.current.set(key, { data: result, timestamp: Date.now() });
      setData(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [key, fetcher]);

  const fetchDataRef = useRef(fetchData);
  fetchDataRef.current = fetchData;

  useEffect(() => {
    const cached = cacheRef.current.get(key);
    const now = Date.now();

    if (cached) {
      const isStale = now - cached.timestamp > ttl;

      if (!isStale) {
        setData(cached.data);
        return;
      }

      if (staleWhileRevalidate) {
        setData(cached.data);
        fetchDataRef.current();
        return;
      }
    }

    fetchDataRef.current();
  }, [key, ttl, staleWhileRevalidate]);

  const invalidate = useCallback(() => {
    cacheRef.current.delete(key);
    fetchData();
  }, [key, fetchData]);

  return { data, isLoading, error, invalidate };
}

// Component memoization helper
export function createMemoizedComponent<P extends object>(
  Component: React.ComponentType<P>,
  propsAreEqual?: (prevProps: P, nextProps: P) => boolean
) {
  const MemoizedComponent = React.memo(Component, propsAreEqual);
  MemoizedComponent.displayName = `Memoized(${Component.displayName || Component.name})`;
  return MemoizedComponent;
}
