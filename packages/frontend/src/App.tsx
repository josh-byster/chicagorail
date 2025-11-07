import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from './lib/query-client';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ThemeProvider } from './components/ThemeProvider';
import { QuickActionsFAB } from './components/QuickActionsFAB';
import { KeyboardShortcutsHelp } from './components/KeyboardShortcutsHelp';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import HomePage from './pages/HomePage';
import RoutePage from './pages/RoutePage';
import TrainDetailPage from './pages/TrainDetailPage';
import AlertsPage from './pages/AlertsPage';
import LinesPage from './pages/LinesPage';
import LineDetailPage from './pages/LineDetailPage';
import StatisticsPage from './pages/StatisticsPage';

function AppContent() {
  const { showHelp, setShowHelp } = useKeyboardShortcuts();

  return (
    <>
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
          <Route
            path="/alerts"
            element={
              <ErrorBoundary>
                <AlertsPage />
              </ErrorBoundary>
            }
          />
          <Route
            path="/lines"
            element={
              <ErrorBoundary>
                <LinesPage />
              </ErrorBoundary>
            }
          />
          <Route
            path="/lines/:lineId"
            element={
              <ErrorBoundary>
                <LineDetailPage />
              </ErrorBoundary>
            }
          />
          <Route
            path="/statistics"
            element={
              <ErrorBoundary>
                <StatisticsPage />
              </ErrorBoundary>
            }
          />
        </Routes>
        {/* Floating Quick Actions Button for power users */}
        <QuickActionsFAB />
        {/* Keyboard shortcuts help dialog */}
        <KeyboardShortcutsHelp open={showHelp} onOpenChange={setShowHelp} />
      </div>
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
          {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
        </QueryClientProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
