/**
 * Custom render function with providers
 *
 * Wraps components with all necessary providers for testing.
 * Use this instead of @testing-library/react's render.
 */

import type { ReactElement, ReactNode } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

/**
 * Create a fresh QueryClient for each test
 */
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

interface TestProvidersProps {
  children: ReactNode;
  initialEntries?: string[];
}

/**
 * All providers needed for testing
 */
export function TestProviders({ children, initialEntries = ['/'] }: TestProvidersProps) {
  const queryClient = createTestQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
    </QueryClientProvider>
  );
}

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialEntries?: string[];
}

/**
 * Custom render with providers
 *
 * @example
 * const { getByText } = renderWithProviders(<MyComponent />);
 *
 * @example
 * // With initial route
 * renderWithProviders(<MyComponent />, { initialEntries: ['/departures?from=OGILVIE'] });
 */
export function renderWithProviders(
  ui: ReactElement,
  { initialEntries, ...options }: CustomRenderOptions = {}
) {
  return render(ui, {
    wrapper: ({ children }) => (
      <TestProviders initialEntries={initialEntries}>{children}</TestProviders>
    ),
    ...options,
  });
}

// Re-export everything from testing-library
export * from '@testing-library/react';
export { renderWithProviders as render };
