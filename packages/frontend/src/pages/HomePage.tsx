import { useState, useEffect } from 'react';
import { RouteSearch } from '@/components/RouteSearch/RouteSearch';
import { TrainList } from '@/components/TrainList/TrainList';
import { useTrains } from '@/hooks/useTrains';
import { SavedRoutesList } from '@/components/SavedRoutes/SavedRoutesList';
import { getSavedRoutes, updateLastUsed, deleteRoute } from '@/services/saved-routes';
import { useStations } from '@/hooks/useStations';
import { SavedRoute } from '@metra/shared';

export default function HomePage() {
  const [origin, setOrigin] = useState<string>('');
  const [destination, setDestination] = useState<string>('');
  const [hasSearched, setHasSearched] = useState(false);
  const [savedRoutes, setSavedRoutes] = useState<SavedRoute[]>([]);

  const { data: stations } = useStations();
  const { data: trains, isLoading, error } = useTrains({
    origin,
    destination,
    enabled: hasSearched && !!origin && !!destination,
  });

  // Load saved routes on component mount and auto-display last used route
  useEffect(() => {
    const loadSavedRoutes = async () => {
      try {
        const routes = await getSavedRoutes();
        setSavedRoutes(routes);
        
        // Auto-display last-used route if user has saved routes
        if (routes.length > 0) {
          // Sort routes by last_used_at (most recent first)
          const sortedRoutes = [...routes].sort((a, b) => 
            new Date(b.last_used_at).getTime() - new Date(a.last_used_at).getTime()
          );
          
          const lastUsedRoute = sortedRoutes[0];
          handleSearch(lastUsedRoute.origin_station_id, lastUsedRoute.destination_station_id);
        }
      } catch (err) {
        console.error('Failed to load saved routes:', err);
      }
    };
    
    loadSavedRoutes();
  }, []);

  const handleSearch = (newOrigin: string, newDestination: string) => {
    setOrigin(newOrigin);
    setDestination(newDestination);
    setHasSearched(true);
  };

  const handleSavedRouteClick = async (route: SavedRoute) => {
    // Update last used timestamp and use count
    try {
      await updateLastUsed(route.origin_station_id, route.destination_station_id);
      const updatedRoutes = await getSavedRoutes();
      setSavedRoutes(updatedRoutes);
    } catch (err) {
      console.error('Failed to update saved route usage:', err);
    }
    
    // Perform search with saved route
    handleSearch(route.origin_station_id, route.destination_station_id);
  };

  const handleSavedRouteDelete = async (route: SavedRoute) => {
    try {
      await deleteRoute(route.origin_station_id, route.destination_station_id);
      const updatedRoutes = await getSavedRoutes();
      setSavedRoutes(updatedRoutes);
    } catch (err) {
      console.error('Failed to delete saved route:', err);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-primary">Fast Metra Train Tracker</h1>
        <p className="text-muted-foreground mt-2">Find your train in seconds</p>
      </header>

      <main className="space-y-6">
        {/* Saved Routes */}
        <SavedRoutesList
          routes={savedRoutes}
          onRouteClick={handleSavedRouteClick}
          onRouteDelete={handleSavedRouteDelete}
        />

        {/* Route Search */}
        <RouteSearch onSearch={handleSearch} />

        {/* Train Results */}
        {hasSearched && (
          <div>
            <h2 className="text-xl font-semibold mb-4">
              {origin && destination ? 'Upcoming Trains' : 'Select a route to see trains'}
            </h2>
            <TrainList
              trains={trains}
              isLoading={isLoading}
              error={error}
              isEmpty={!isLoading && (!trains || trains.length === 0)}
            />
          </div>
        )}
      </main>
    </div>
  );
}
