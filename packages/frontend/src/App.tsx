import { BrowserRouter, Routes, Route, Navigate, useSearchParams } from 'react-router-dom';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { StationPickerProvider } from './components/StationPicker';
import { Home } from './pages/Home';
import { Saved } from './pages/Saved';
import { TrainDetail } from './pages/TrainDetail';

// Redirect from old /departures route to unified home
function DeparturesRedirect() {
  const [searchParams] = useSearchParams();
  const stopId = searchParams.get('stop');
  const date = searchParams.get('date');
  const route = searchParams.get('route');

  const newParams = new URLSearchParams();
  if (stopId) newParams.set('from', stopId);
  if (date) newParams.set('date', date);
  if (route) newParams.set('route', route);

  const queryString = newParams.toString();
  return <Navigate to={queryString ? `/?${queryString}` : '/'} replace />;
}

// Redirect from old /trip-planner route to unified home
function TripPlannerRedirect() {
  const [searchParams] = useSearchParams();
  const origin = searchParams.get('origin');
  const destination = searchParams.get('destination');
  const date = searchParams.get('date');

  const newParams = new URLSearchParams();
  if (origin) newParams.set('from', origin);
  if (destination) newParams.set('to', destination);
  if (date) newParams.set('date', date);

  const queryString = newParams.toString();
  return <Navigate to={queryString ? `/?${queryString}` : '/'} replace />;
}

function App() {
  return (
    <BrowserRouter>
      <StationPickerProvider>
        <div className="flex min-h-screen flex-col bg-background">
          <Header />
          <main id="main-content" className="flex-1">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/saved" element={<Saved />} />
              <Route path="/train/:tripId" element={<TrainDetail />} />
              {/* Redirects from old routes for backwards compatibility */}
              <Route path="/departures" element={<DeparturesRedirect />} />
              <Route path="/trip-planner" element={<TripPlannerRedirect />} />
              <Route path="/arrivals" element={<Navigate to="/" replace />} />
              {/* Catch-all redirect to home */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </StationPickerProvider>
    </BrowserRouter>
  );
}

export default App;
