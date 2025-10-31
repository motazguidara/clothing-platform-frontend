// Performance monitoring and optimization utilities

// Type declarations for Web Vitals
interface LayoutShift extends PerformanceEntry {
  value: number;
  hadRecentInput: boolean;
}

interface PerformanceEventTiming extends PerformanceEntry {
  processingStart: number;
}

declare global {
  interface Window {
    PerformanceObserver: typeof PerformanceObserver;
  }
  
  // Augment the PerformanceEntry interface to include our custom types
  interface PerformanceEntry {
    processingStart?: number;
    value?: number;
    hadRecentInput?: boolean;
  }
}


export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number> = new Map();

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // Measure component render time
  measureRender(componentName: string, renderFn: () => void) {
    const start = performance.now();
    renderFn();
    const end = performance.now();
    this.metrics.set(`render_${componentName}`, end - start);
  }

  // Measure API call time
  async measureApiCall<T>(apiName: string, apiCall: () => Promise<T>): Promise<T> {
    const start = performance.now();
    try {
      const result = await apiCall();
      const end = performance.now();
      this.metrics.set(`api_${apiName}`, end - start);
      return result;
    } catch (error) {
      const end = performance.now();
      this.metrics.set(`api_${apiName}_error`, end - start);
      throw error;
    }
  }

  // Get Core Web Vitals
  getCoreWebVitals() {
    return new Promise<{
      CLS: number;
      FID: number;
      FCP: number;
      LCP: number;
      TTFB: number;
    }>((resolve) => {
      const vitals = {
        CLS: 0,
        FID: 0,
        FCP: 0,
        LCP: 0,
        TTFB: 0,
      };

      // Largest Contentful Paint
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as PerformanceEntry & { startTime: number };
        if (lastEntry) {
          vitals.LCP = lastEntry.startTime;
        }
      }).observe({ type: 'largest-contentful-paint', buffered: true });

      // First Input Delay
      new PerformanceObserver((list) => {
        const entries = list.getEntries() as PerformanceEventTiming[];
        entries.forEach((entry) => {
          if ('processingStart' in entry) {
            vitals.FID = entry.processingStart - entry.startTime;
          }
        });
      }).observe({ type: 'first-input', buffered: true });

      // Cumulative Layout Shift
      new PerformanceObserver((list) => {
        const entries = list.getEntries() as LayoutShift[];
        entries.forEach((entry) => {
          if (!entry.hadRecentInput) {
            vitals.CLS += entry.value;
          }
        });
      }).observe({ type: 'layout-shift', buffered: true });

      // First Contentful Paint
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint');
        if (fcpEntry) {
          vitals.FCP = fcpEntry.startTime;
        }
      }).observe({ type: 'paint', buffered: true });

      // Time to First Byte (TTFB)
      if (typeof window !== 'undefined' && 'performance' in window) {
        try {
          const navigationEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
          if (navigationEntries.length > 0) {
            const navEntry = navigationEntries[0];
            if (navEntry && 'responseStart' in navEntry && 'requestStart' in navEntry) {
              const { responseStart, requestStart } = navEntry;
              if (typeof responseStart === 'number' && typeof requestStart === 'number') {
                vitals.TTFB = responseStart - requestStart;
              }
            }
          }
        } catch (error) {
          console.warn('Failed to measure TTFB:', error);
        }
      }

      setTimeout(() => resolve(vitals), 3000);
    });
  }

  // Report metrics to analytics
  reportMetrics() {
    const metricsData = Object.fromEntries(this.metrics);
    
    // Send to analytics service (replace with your analytics provider)
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'performance_metrics', {
        custom_map: metricsData,
      });
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.warn('[performance] metrics', metricsData);
    }
  }
}

// Image optimization utilities
export const imageOptimization = {
  // Generate responsive image props
  getResponsiveProps(src: string, alt: string, priority = false) {
    const safeSrc = typeof src === 'string' && src.trim().length > 0 ? src.trim() : '/file.svg';
    return {
      src: safeSrc,
      alt,
      priority,
      sizes: '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
      placeholder: 'blur' as const,
      blurDataURL: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q==',
    };
  },

  // Preload critical images
  preloadImage(src: string) {
    if (typeof window !== 'undefined') {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = src;
      document.head.appendChild(link);
    }
  },

  // Lazy load images with intersection observer
  lazyLoadImage(img: HTMLImageElement, src: string) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            img.src = src;
            img.classList.remove('lazy');
            observer.unobserve(img);
          }
        });
      },
      { threshold: 0.1 }
    );
    observer.observe(img);
  },
};

// Bundle size optimization
export const bundleOptimization = {
  // Dynamic import with error handling
  async dynamicImport<T>(importFn: () => Promise<T>): Promise<T> {
    try {
      return await importFn();
    } catch (error) {
      console.error('Dynamic import failed:', error);
      throw error;
    }
  },

  // Preload critical routes
  preloadRoute(route: string) {
    if (typeof window !== 'undefined') {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = route;
      document.head.appendChild(link);
    }
  },
};

// Memory management
export const memoryOptimization = {
  // Cleanup function for components
  cleanup(cleanupFns: (() => void)[]) {
    return () => {
      cleanupFns.forEach((fn) => {
        try {
          fn();
        } catch (error) {
          console.error('Cleanup error:', error);
        }
      });
    };
  },

  // Debounce function
  debounce<T extends (...args: unknown[]) => unknown>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  },

  // Throttle function
  throttle<T extends (...args: unknown[]) => unknown>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean;
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  },
};

// Cache management
export const cacheOptimization = {
  // Service worker cache strategies
  cacheFirst: 'cache-first',
  networkFirst: 'network-first',
  staleWhileRevalidate: 'stale-while-revalidate',

  // Local storage with expiration
  setWithExpiry<T>(key: string, value: T, ttl: number) {
    const item = {
      value,
      expiry: Date.now() + ttl,
    };
    localStorage.setItem(key, JSON.stringify(item));
  },

  getWithExpiry<T>(key: string): T | null {
    const itemStr = localStorage.getItem(key);
    if (!itemStr) {
      return null;
    }
    try {
      const item = JSON.parse(itemStr) as { value?: T; expiry?: number };
      if (typeof item?.expiry !== 'number') {
        localStorage.removeItem(key);
        return null;
      }
      if (Date.now() > item.expiry) {
        localStorage.removeItem(key);
        return null;
      }
      return item.value ?? null;
    } catch {
      localStorage.removeItem(key);
      return null;
    }
  },
};

// Performance hooks
export const usePerformance = () => {
  const monitor = PerformanceMonitor.getInstance();

  const measureComponent = (name: string, fn: () => void) => {
    monitor.measureRender(name, fn);
  };

  const measureApi = async <T>(name: string, apiCall: () => Promise<T>) => {
    return monitor.measureApiCall(name, apiCall);
  };

  return { measureComponent, measureApi };
};
