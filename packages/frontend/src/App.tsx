import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Header } from './components/Header';
import { Home } from './pages/Home';
import { Departures } from './pages/Departures';
import { Arrivals } from './pages/Arrivals';
import { TripPlanner } from './pages/TripPlanner';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-background">
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/departures" element={<Departures />} />
          <Route path="/arrivals" element={<Arrivals />} />
          <Route path="/trip-planner" element={<TripPlanner />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
