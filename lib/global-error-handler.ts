/**
 * Global Error Handler for Production
 * Catches unhandled errors and provides graceful fallbacks
 */

'use client';

import { useEffect } from 'react';
import { AppErrorHandler } from '@/lib/error-handling';

export function GlobalErrorHandler() {
  useEffect(() => {
    // Handle unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled Promise Rejection:', event.reason);
      AppErrorHandler.handleClientError(event.reason, 'unhandled_promise_rejection');
      
      // Prevent the default browser behavior (logging to console)
      event.preventDefault();
    };

    // Handle uncaught errors
    const handleUncaughtError = (event: ErrorEvent) => {
      console.error('Uncaught Error:', event.error);
      AppErrorHandler.handleClientError(event.error, 'uncaught_error');
    };

    // Handle React error boundary fallbacks
    const handleResourceError = (event: Event) => {
      const target = event.target as HTMLElement;
      if (target?.tagName === 'IMG') {
        console.warn('Image failed to load:', (target as HTMLImageElement).src);
        // Set fallback image
        (target as HTMLImageElement).src = '/images/fallback-restaurant.jpg';
      } else if (target?.tagName === 'SCRIPT') {
        console.error('Script failed to load:', (target as HTMLScriptElement).src);
        AppErrorHandler.handleClientError(
          new Error(`Script failed to load: ${(target as HTMLScriptElement).src}`),
          'script_load_error'
        );
      }
    };

    // Add event listeners
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleUncaughtError);
    window.addEventListener('error', handleResourceError, true); // Capture phase for resource errors

    // Cleanup
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleUncaughtError);
      window.removeEventListener('error', handleResourceError, true);
    };
  }, []);

  // This component doesn't render anything
  return null;
}

/**
 * API Error Handler Middleware
 * Wraps API calls with consistent error handling
 */
export function withApiErrorHandling<T extends (...args: any[]) => Promise<Response>>(
  handler: T
): T {
  return (async (...args: any[]) => {
    try {
      return await handler(...args);
    } catch (error) {
      console.error('API Error:', error);
      return AppErrorHandler.handleApiError(error, handler.name || 'api_handler');
    }
  }) as T;
}

/**
 * Service Worker Error Handler
 * Handles service worker related errors
 */
export function handleServiceWorkerErrors() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('error', (event) => {
      console.error('Service Worker Error:', event);
      AppErrorHandler.handleClientError(
        new Error('Service Worker Error'),
        'service_worker_error'
      );
    });

    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data?.type === 'ERROR') {
        console.error('Service Worker Message Error:', event.data);
        AppErrorHandler.handleClientError(
          new Error(event.data.message || 'Service Worker Message Error'),
          'service_worker_message_error'
        );
      }
    });
  }
}

/**
 * Network Error Handler
 * Handles network connectivity issues
 */
export function useNetworkErrorHandler() {
  useEffect(() => {
    const handleOnline = () => {
      console.log('Network connection restored');
      // Optionally trigger data refresh or show notification
    };

    const handleOffline = () => {
      console.log('Network connection lost');
      AppErrorHandler.handleClientError(
        new Error('Network connection lost'),
        'network_offline'
      );
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
}

/**
 * Performance Error Handler
 * Monitors and reports performance issues
 */
export function usePerformanceErrorHandler() {
  useEffect(() => {
    // Monitor long tasks (over 50ms)
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) {
            console.warn('Long task detected:', entry.duration, 'ms');
            AppErrorHandler.handleClientError(
              new Error(`Long task: ${entry.duration}ms`),
              'performance_long_task'
            );
          }
        }
      });

      observer.observe({ entryTypes: ['longtask'] });

      return () => observer.disconnect();
    }
  }, []);
}

/**
 * Memory Error Handler
 * Monitors memory usage and handles out-of-memory situations
 */
export function useMemoryErrorHandler() {
  useEffect(() => {
    // Monitor memory usage if available
    const checkMemoryUsage = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        const usedJSHeapSizeMB = memory.usedJSHeapSize / 1048576;
        const totalJSHeapSizeLimitMB = memory.jsHeapSizeLimit / 1048576;
        const usage = usedJSHeapSizeMB / totalJSHeapSizeLimitMB;

        // Alert if memory usage is over 80%
        if (usage > 0.8) {
          console.warn('High memory usage detected:', Math.round(usage * 100), '%');
          AppErrorHandler.handleClientError(
            new Error(`High memory usage: ${Math.round(usage * 100)}%`),
            'memory_high_usage'
          );
        }
      }
    };

    // Check memory usage every 30 seconds
    const interval = setInterval(checkMemoryUsage, 30000);

    return () => clearInterval(interval);
  }, []);
}

/**
 * Error Recovery Utilities
 * Provides recovery mechanisms for common error scenarios
 */
export class ErrorRecovery {
  /**
   * Attempts to recover from a failed fetch request
   */
  static async retryFetch(
    url: string,
    options?: RequestInit,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<Response> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(url, options);
        if (!response.ok && attempt < maxRetries) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return response;
      } catch (error) {
        lastError = error as Error;
        console.warn(`Fetch attempt ${attempt} failed:`, error);

        if (attempt < maxRetries) {
          // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt - 1)));
        }
      }
    }

    throw lastError!;
  }

  /**
   * Attempts to recover from localStorage errors
   */
  static safeLocalStorage = {
    getItem(key: string): string | null {
      try {
        return localStorage.getItem(key);
      } catch (error) {
        console.warn('localStorage.getItem failed:', error);
        return null;
      }
    },

    setItem(key: string, value: string): boolean {
      try {
        localStorage.setItem(key, value);
        return true;
      } catch (error) {
        console.warn('localStorage.setItem failed:', error);
        return false;
      }
    },

    removeItem(key: string): boolean {
      try {
        localStorage.removeItem(key);
        return true;
      } catch (error) {
        console.warn('localStorage.removeItem failed:', error);
        return false;
      }
    },
  };

  /**
   * Graceful component unmounting
   */
  static createAbortController(): AbortController {
    const controller = new AbortController();
    
    // Auto-abort after 30 seconds
    setTimeout(() => {
      if (!controller.signal.aborted) {
        controller.abort();
      }
    }, 30000);

    return controller;
  }
}
