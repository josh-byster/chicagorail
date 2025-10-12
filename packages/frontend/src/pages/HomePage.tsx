import { useState, useEffect } from 'react';
import { RouteSearch } from '@/components/RouteSearch/RouteSearch';
import { TrainList } from '@/components/TrainList/TrainList';
import { useTrains } from '@/hooks/useTrains';
import { SavedRoutesList } from '@/components/SavedRoutes/SavedRoutesList';
import {
  getSavedRoutes,
  updateLastUsed,
  deleteRoute,
} from '@/services/saved-routes';
import { useStations } from '@/hooks/useStations';
import { SavedRoute } from '@metra/shared';
import { Separator } from '@/components/ui/separator';
import { Train } from 'lucide-react';

export default function HomePage() {
  const [origin, setOrigin] = useState<string>('');
  const [destination, setDestination] = useState<string>('');
  const [hasSearched, setHasSearched] = useState(false);
  const [savedRoutes, setSavedRoutes] = useState<SavedRoute[]>([]);

  useStations();
  const {
    data: trains,
    isLoading,
    error,
  } = useTrains({
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
          const sortedRoutes = [...routes].sort(
            (a, b) =>
              new Date(b.last_used_at).getTime() -
              new Date(a.last_used_at).getTime()
          );

          const lastUsedRoute = sortedRoutes[0];
          handleSearch(
            lastUsedRoute.origin_station_id,
            lastUsedRoute.destination_station_id
          );
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
      await updateLastUsed(
        route.origin_station_id,
        route.destination_station_id
      );
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <header className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-primary rounded-lg">
              <Train className="h-7 w-7 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Metra Train Tracker
              </h1>
              <p className="text-muted-foreground text-base mt-0.5">
                Real-time train schedules at your fingertips
              </p>
            </div>
          </div>
        </header>

        <main className="space-y-8">
          {/* Saved Routes */}
          {savedRoutes.length > 0 && (
            <>
              <SavedRoutesList
                routes={savedRoutes}
                onRouteClick={handleSavedRouteClick}
                onRouteDelete={handleSavedRouteDelete}
              />
              <Separator className="my-6" />
            </>
          )}

          {/* Route Search */}
          <RouteSearch onSearch={handleSearch} />

          {/* Train Results */}
          {hasSearched && (
            <>
              <Separator className="my-6" />
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">
                    {origin && destination
                      ? 'Upcoming Trains'
                      : 'Select a route to see trains'}
                  </h2>
                </div>
                <TrainList
                  trains={trains}
                  isLoading={isLoading}
                  error={error}
                  isEmpty={!isLoading && (!trains || trains.length === 0)}
                />
              </div>
            </>
          )}
        </main>

        <footer className="mt-16 pb-8 text-center space-y-1">
          <p className="text-sm text-muted-foreground">
            Powered by Metra's official GTFS data
          </p>
          <p className="text-xs text-muted-foreground/70">
            Not affiliated with Metra or the Regional Transportation Authority
          </p>
        </footer>
      </div>
    </div>
  );
}
