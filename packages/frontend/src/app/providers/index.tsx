/**
 * Combined providers for the application
 */

import type { ReactNode } from 'react';
import { QueryProvider } from './QueryProvider';
import { ErrorBoundaryProvider } from './ErrorBoundaryProvider';

interface AppProvidersProps {
  children: ReactNode;
}

/**
 * Composes all application providers
 *
 * Provider order (outside to inside):
 * 1. ErrorBoundaryProvider - catches React errors
 * 2. QueryProvider - TanStack Query
 */
export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ErrorBoundaryProvider>
      <QueryProvider>{children}</QueryProvider>
    </ErrorBoundaryProvider>
  );
}

export { QueryProvider } from './QueryProvider';
export { ErrorBoundaryProvider } from './ErrorBoundaryProvider';
