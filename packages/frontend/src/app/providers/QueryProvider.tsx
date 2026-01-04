/**
 * TanStack Query provider with centralized configuration
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { QUERY_CONFIG } from '@/config';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: QUERY_CONFIG.defaults.staleTime,
      retry: QUERY_CONFIG.defaults.retry,
      refetchOnWindowFocus: QUERY_CONFIG.defaults.refetchOnWindowFocus,
    },
  },
});

interface QueryProviderProps {
  children: ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
