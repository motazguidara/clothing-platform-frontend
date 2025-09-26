// src/lib/errors.ts
import { ApiError, NetworkError, ValidationError } from './api/client-enhanced';
import { ErrorResponse } from './api/contracts';

export class AppError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function handleApiError(error: unknown): never {
  if (error instanceof ApiError) {
    if (error.status === 401) {
      throw new AppError(
        'Your session has expired. Please log in again.',
        'UNAUTHORIZED'
      );
    }

    if (error.status === 403) {
      throw new AppError(
        'You do not have permission to perform this action.',
        'FORBIDDEN'
      );
    }

    if (error.status === 404) {
      throw new AppError('The requested resource was not found.', 'NOT_FOUND');
    }

    if (error.status === 422) {
      const errorData = error.details as ErrorResponse;
      const message = errorData.message || 'Validation failed.';
      throw new ValidationError(message, errorData.details as Record<string, string[]>);
    }

    throw new AppError(
      error.message || 'An unexpected error occurred.',
      error.code || 'API_ERROR',
      error.details
    );
  }

  if (error instanceof NetworkError) {
    throw new AppError(
      'Unable to connect to the server. Please check your internet connection.',
      'NETWORK_ERROR'
    );
  }

  if (error instanceof Error) {
    throw new AppError(
      error.message || 'An unexpected error occurred.',
      'UNKNOWN_ERROR'
    );
  }

  throw new AppError('An unknown error occurred', 'UNKNOWN_ERROR');
}

// Error boundary helper
export function getErrorMessage(error: unknown): string {
  if (error instanceof AppError) {
    return error.message;
  }

  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected error occurred';
}

// Retry helper
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt === maxRetries - 1) {
        break;
      }

      // Don't retry on client errors (4xx)
      if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
        throw error;
      }

      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}
