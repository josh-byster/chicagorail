import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { StationSearch } from '@/components/search/StationSearch';
import { SearchResults } from '@/components/search/SearchResults';
import { RouteGrid } from '@/components/routes/RouteGrid';
import { ScheduleView } from '@/components/schedule/ScheduleView';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { Route, Stop } from '@/types/metra';

function App() {
  // State
  const [selectedStation, setSelectedStation] = useState<Stop | null>(null);
  const [stationRoutes, setStationRoutes] = useState<Route[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [allRoutes, setAllRoutes] = useState<Route[]>([]);
  const [isLoadingRoutes, setIsLoadingRoutes] = useState(true);

  // Load all routes on mount
  useEffect(() => {
    const loadRoutes = async () => {
      try {
        const routes = await api.getRoutes();
        setAllRoutes(routes);
      } catch (error) {
        console.error('Error loading routes:', error);
      } finally {
        setIsLoadingRoutes(false);
      }
    };

    loadRoutes();
  }, []);

  // Clear trips cache when date changes
  useEffect(() => {
    api.clearTripsCache();
  }, [selectedDate]);

  // Handlers
  const handleStationSelect = (station: Stop, routes: Route[]) => {
    setSelectedStation(station);
    setStationRoutes(routes);
    setSelectedRoute(null); // Reset route selection when station changes
  };

  const handleClearStation = () => {
    setSelectedStation(null);
    setStationRoutes([]);
    setSelectedRoute(null);
  };

  const handleRouteSelect = (route: Route) => {
    setSelectedRoute(route);
  };

  const handleBackFromSchedule = () => {
    setSelectedRoute(null);
  };

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header selectedDate={selectedDate} onDateChange={handleDateChange} />

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Test Input */}
        <div className="max-w-md space-y-2">
          <Input type="email" placeholder="Test Input - Email" />
          <Input type="text" placeholder="Test Input - Text" />
          <Input type="password" placeholder="Test Input - Password" />
        </div>

        {/* Station Search - Always visible */}
        <StationSearch
          onStationSelect={handleStationSelect}
          selectedStation={selectedStation}
        />

        {/* Conditional Content */}
        {isLoadingRoutes ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-40" />
              ))}
            </div>
          </div>
        ) : (
          <>
            {selectedRoute ? (
              // Show schedule view when route is selected
              <ScheduleView
                route={selectedRoute}
                selectedDate={selectedDate}
                selectedStopId={selectedStation?.stop_id}
                onBack={handleBackFromSchedule}
              />
            ) : selectedStation ? (
              // Show search results when station is selected (but no route yet)
              <SearchResults
                selectedStation={selectedStation}
                routes={stationRoutes}
                onRouteSelect={handleRouteSelect}
                onClearStation={handleClearStation}
              />
            ) : (
              // Show all routes grid when nothing is selected (browse mode)
              <RouteGrid routes={allRoutes} onRouteSelect={handleRouteSelect} />
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default App;
