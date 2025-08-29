/**
 * Enhanced Error Handling Utilities for Production
 * Provides comprehensive error handling, logging, and user-friendly error messages
 */

export enum ErrorType {
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  NOT_FOUND = 'NOT_FOUND',
  RATE_LIMIT = 'RATE_LIMIT',
  EXTERNAL_API = 'EXTERNAL_API',
  DATABASE = 'DATABASE',
  NETWORK = 'NETWORK',
  UNKNOWN = 'UNKNOWN',
}

export interface AppError {
  type: ErrorType;
  message: string;
  code: string;
  statusCode: number;
  details?: any;
  timestamp: string;
  requestId?: string;
  userId?: string;
}

export class AppErrorHandler {
  /**
   * Creates a standardized error object
   */
  static createError(
    type: ErrorType,
    message: string,
    code: string,
    statusCode: number = 500,
    details?: any
  ): AppError {
    return {
      type,
      message,
      code,
      statusCode,
      details,
      timestamp: new Date().toISOString(),
      requestId: this.generateRequestId(),
    };
  }

  /**
   * Handles API route errors consistently
   */
  static handleApiError(error: unknown, context?: string): Response {
    const appError = this.normalizeError(error, context);
    
    // Log error for monitoring
    this.logError(appError, context);

    // Return appropriate HTTP response
    return new Response(
      JSON.stringify({
        success: false,
        error: appError.message,
        code: appError.code,
        requestId: appError.requestId,
        ...(process.env.NODE_ENV === 'development' && {
          details: appError.details,
          stack: error instanceof Error ? error.stack : undefined,
        }),
      }),
      {
        status: appError.statusCode,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }

  /**
   * Handles client-side errors
   */
  static handleClientError(error: unknown, context?: string): void {
    const appError = this.normalizeError(error, context);
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error(`[${appError.type}] ${appError.message}`, {
        code: appError.code,
        details: appError.details,
        context,
      });
    }

    // In production, send to monitoring service
    if (process.env.NODE_ENV === 'production') {
      this.sendToMonitoring(appError, context);
    }
  }

  /**
   * Converts unknown errors to standardized AppError format
   */
  private static normalizeError(error: unknown, context?: string): AppError {
    if (error instanceof Error) {
      // Handle specific error types
      if (error.message.includes('unauthorized') || error.message.includes('authentication')) {
        return this.createError(
          ErrorType.AUTHENTICATION,
          'Authentication required',
          'AUTH_REQUIRED',
          401,
          { originalMessage: error.message, context }
        );
      }

      if (error.message.includes('forbidden') || error.message.includes('access denied')) {
        return this.createError(
          ErrorType.AUTHORIZATION,
          'Access denied',
          'ACCESS_DENIED',
          403,
          { originalMessage: error.message, context }
        );
      }

      if (error.message.includes('not found')) {
        return this.createError(
          ErrorType.NOT_FOUND,
          'Resource not found',
          'NOT_FOUND',
          404,
          { originalMessage: error.message, context }
        );
      }

      if (error.message.includes('validation') || error.message.includes('invalid')) {
        return this.createError(
          ErrorType.VALIDATION,
          'Invalid input provided',
          'VALIDATION_ERROR',
          400,
          { originalMessage: error.message, context }
        );
      }

      if (error.message.includes('rate limit') || error.message.includes('too many requests')) {
        return this.createError(
          ErrorType.RATE_LIMIT,
          'Too many requests',
          'RATE_LIMIT_EXCEEDED',
          429,
          { originalMessage: error.message, context }
        );
      }

      if (error.message.includes('network') || error.message.includes('fetch')) {
        return this.createError(
          ErrorType.NETWORK,
          'Network error occurred',
          'NETWORK_ERROR',
          503,
          { originalMessage: error.message, context }
        );
      }

      if (error.message.includes('database') || error.message.includes('supabase')) {
        return this.createError(
          ErrorType.DATABASE,
          'Database operation failed',
          'DATABASE_ERROR',
          500,
          { originalMessage: error.message, context }
        );
      }

      // Generic error
      return this.createError(
        ErrorType.UNKNOWN,
        'An unexpected error occurred',
        'UNKNOWN_ERROR',
        500,
        { originalMessage: error.message, context }
      );
    }

    // Handle non-Error objects
    return this.createError(
      ErrorType.UNKNOWN,
      'An unexpected error occurred',
      'UNKNOWN_ERROR',
      500,
      { error, context }
    );
  }

  /**
   * Logs errors for monitoring and debugging
   */
  private static logError(error: AppError, context?: string): void {
    const logData = {
      ...error,
      context,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
    };

    // In development, use console
    if (process.env.NODE_ENV === 'development') {
      console.error(`[ERROR] ${error.type}: ${error.message}`, logData);
      return;
    }

    // In production, send to logging service
    this.sendToLoggingService(logData);
  }

  /**
   * Generates unique request ID for error tracking
   */
  private static generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Sends error data to monitoring service (placeholder for production implementation)
   */
  private static sendToMonitoring(error: AppError, context?: string): void {
    // Placeholder for monitoring service integration
    // e.g., Sentry, DataDog, CloudWatch, etc.
    if (process.env.MONITORING_ENDPOINT) {
      fetch(process.env.MONITORING_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error, context, type: 'client_error' }),
      }).catch(() => {
        // Silently fail to avoid error loops
      });
    }
  }

  /**
   * Sends error data to logging service (placeholder for production implementation)
   */
  private static sendToLoggingService(logData: any): void {
    // Placeholder for logging service integration
    // e.g., Winston, Bunyan, or cloud logging services
    if (process.env.LOGGING_ENDPOINT) {
      fetch(process.env.LOGGING_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...logData, type: 'error_log' }),
      }).catch(() => {
        // Silently fail to avoid error loops
      });
    }
  }

  /**
   * Gets user-friendly error message based on error type
   */
  static getUserFriendlyMessage(error: AppError): string {
    switch (error.type) {
      case ErrorType.AUTHENTICATION:
        return 'Please log in to continue.';
      case ErrorType.AUTHORIZATION:
        return 'You don\'t have permission to perform this action.';
      case ErrorType.NOT_FOUND:
        return 'The requested information could not be found.';
      case ErrorType.VALIDATION:
        return 'Please check your input and try again.';
      case ErrorType.RATE_LIMIT:
        return 'You\'re sending requests too quickly. Please wait a moment and try again.';
      case ErrorType.NETWORK:
        return 'Please check your internet connection and try again.';
      case ErrorType.DATABASE:
        return 'We\'re experiencing technical difficulties. Please try again later.';
      case ErrorType.EXTERNAL_API:
        return 'We\'re having trouble connecting to external services. Please try again later.';
      default:
        return 'Something went wrong. Please try again later.';
    }
  }
}

/**
 * React hook for error handling in components
 */
export function useErrorHandler() {
  const handleError = (error: unknown, context?: string) => {
    AppErrorHandler.handleClientError(error, context);
  };

  const getErrorMessage = (error: unknown): string => {
    const appError = AppErrorHandler['normalizeError'](error);
    return AppErrorHandler.getUserFriendlyMessage(appError);
  };

  return { handleError, getErrorMessage };
}

/**
 * Async wrapper that handles errors automatically
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  context?: string
): Promise<T | null> {
  try {
    return await operation();
  } catch (error) {
    AppErrorHandler.handleClientError(error, context);
    return null;
  }
}

/**
 * API wrapper that handles errors consistently
 */
export async function apiCall<T>(
  url: string,
  options?: RequestInit,
  context?: string
): Promise<T> {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    AppErrorHandler.handleClientError(error, `API call to ${url} (${context})`);
    throw error;
  }
}
