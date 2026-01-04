/**
 * Custom error classes for API error handling
 *
 * Provides typed error handling with proper error classification
 * and message extraction utilities.
 */

/**
 * Error thrown when API returns an error response
 */
export class ApiError extends Error {
  readonly name = 'ApiError';

  constructor(
    message: string,
    public readonly code: string,
    public readonly status: number,
    public readonly details?: unknown
  ) {
    super(message);
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

/**
 * Error thrown when network request fails (timeout, offline, etc.)
 */
export class NetworkError extends Error {
  readonly name = 'NetworkError';

  constructor(message: string = 'Network request failed') {
    super(message);
    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}

/**
 * Type guard to check if an error is an ApiError
 */
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

/**
 * Type guard to check if an error is a NetworkError
 */
export function isNetworkError(error: unknown): error is NetworkError {
  return error instanceof NetworkError;
}

/**
 * Extract a user-friendly error message from any error type
 */
export function getErrorMessage(error: unknown): string {
  if (isApiError(error)) {
    return error.message;
  }
  if (isNetworkError(error)) {
    return 'Unable to connect. Please check your internet connection.';
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
}

/**
 * Determine if an error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  if (isNetworkError(error)) {
    return true;
  }
  if (isApiError(error)) {
    // Retry server errors (5xx) but not client errors (4xx)
    return error.status >= 500;
  }
  return false;
}
