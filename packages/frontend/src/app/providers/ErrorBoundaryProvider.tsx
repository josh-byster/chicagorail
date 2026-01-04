/**
 * Error boundary provider for catching React errors
 *
 * Wraps the app with:
 * - Global ErrorBoundary for React rendering errors
 * - QueryErrorResetBoundary for TanStack Query errors
 */

import type { ReactNode } from 'react';
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary';
import { QueryErrorResetBoundary } from '@tanstack/react-query';
import { logger } from '@/shared/lib';

interface ErrorFallbackProps extends FallbackProps {
  title?: string;
}

function ErrorFallback({ error, resetErrorBoundary, title = 'Something went wrong' }: ErrorFallbackProps) {
  return (
    <div
      role="alert"
      className="min-h-screen flex items-center justify-center p-4 bg-background"
    >
      <div className="max-w-md w-full text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30">
          <svg
            className="w-8 h-8 text-red-600 dark:text-red-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-foreground">{title}</h2>
        <p className="text-muted-foreground">
          {error.message || 'An unexpected error occurred. Please try again.'}
        </p>
        <button
          onClick={resetErrorBoundary}
          className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

function handleError(error: Error, info: { componentStack?: string | null }) {
  logger.error('React error boundary caught error', error, {
    componentStack: info.componentStack,
  });
}

interface ErrorBoundaryProviderProps {
  children: ReactNode;
}

export function ErrorBoundaryProvider({ children }: ErrorBoundaryProviderProps) {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          onReset={reset}
          onError={handleError}
          FallbackComponent={ErrorFallback}
        >
          {children}
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
}
