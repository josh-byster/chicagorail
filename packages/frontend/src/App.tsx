import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from './lib/query-client';
import { ErrorBoundary } from './components/ErrorBoundary';
import HomePage from './pages/HomePage';
import RoutePage from './pages/RoutePage';
import TrainDetailPage from './pages/TrainDetailPage';

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <div className="min-h-screen bg-background">
            <Routes>
              <Route
                path="/"
                element={
                  <ErrorBoundary>
                    <HomePage />
                  </ErrorBoundary>
                }
              />
              <Route
                path="/route"
                element={
                  <ErrorBoundary>
                    <RoutePage />
                  </ErrorBoundary>
                }
              />
              <Route
                path="/train/:tripId"
                element={
                  <ErrorBoundary>
                    <TrainDetailPage />
                  </ErrorBoundary>
                }
              />
            </Routes>
          </div>
        </BrowserRouter>
        {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
