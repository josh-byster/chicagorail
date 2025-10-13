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
import { useRouteSearchStore } from '@/stores/routeSearchStore';
import { useUrlSync } from '@/hooks/useUrlSync';

export default function HomePage() {
  useUrlSync(); // Sync URL params with Zustand store

  const { origin, destination, date, time, hasSearched, setRoute } =
    useRouteSearchStore();
  const [savedRoutes, setSavedRoutes] = useState<SavedRoute[]>([]);

  useStations();
  const {
    data: trains,
    isLoading,
    error,
  } = useTrains({
    origin,
    destination,
    date: date ? formatDateForApi(date) : undefined,
    time,
    enabled: hasSearched && !!origin && !!destination,
  });

  // Helper function to format date as YYYY-MM-DD in local timezone
  function formatDateForApi(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Load saved routes on component mount and auto-display last used route
  useEffect(() => {
    const loadSavedRoutes = async () => {
      try {
        const routes = await getSavedRoutes();
        setSavedRoutes(routes);

        // Auto-display last-used route if user has saved routes and no route is currently selected
        // Only check on initial mount (when origin and destination are empty)
        const currentOrigin = useRouteSearchStore.getState().origin;
        const currentDestination = useRouteSearchStore.getState().destination;

        if (routes.length > 0 && !currentOrigin && !currentDestination) {
          // Sort routes by last_used_at (most recent first)
          const sortedRoutes = [...routes].sort(
            (a, b) =>
              new Date(b.last_used_at).getTime() -
              new Date(a.last_used_at).getTime()
          );

          const lastUsedRoute = sortedRoutes[0];
          setRoute(
            lastUsedRoute.origin_station_id,
            lastUsedRoute.destination_station_id
          );
        }
      } catch (err) {
        console.error('Failed to load saved routes:', err);
      }
    };

    loadSavedRoutes();
  }, []); // Only run once on mount

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
    setRoute(route.origin_station_id, route.destination_station_id);
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
    <div className="min-h-screen bg-gradient-to-br from-background via-blue-50/30 to-primary/5 dark:from-background dark:via-blue-950/20 dark:to-primary/10">
      {/* Animated background pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-br from-primary/5 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-gradient-to-tr from-blue-500/5 to-transparent rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-5xl relative z-10">
        <header className="mb-12 text-center">
          <div className="inline-flex items-center justify-center gap-4 mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full"></div>
              <div className="relative p-4 bg-gradient-to-br from-primary to-blue-600 rounded-2xl shadow-lg flex items-center justify-center">
                <img
                  src="/bsicon.svg"
                  alt="Metra Train Icon"
                  className="h-12 w-12"
                />
              </div>
            </div>
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold mb-3 bg-gradient-to-r from-primary via-blue-600 to-primary/70 bg-clip-text text-transparent">
            Metra Train Tracker
          </h1>
          <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto">
            Real-time train schedules at your fingertips
          </p>
          <div className="h-1 w-24 bg-gradient-to-r from-primary to-blue-600 mx-auto mt-4 rounded-full"></div>
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
          <RouteSearch />

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

        <footer className="mt-20 pb-8">
          <div className="h-px w-full bg-gradient-to-r from-transparent via-border to-transparent mb-8"></div>
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground font-medium">
              Powered by Metra's official GTFS data
            </p>
            <p className="text-xs text-muted-foreground/60">
              Not affiliated with Metra or the Regional Transportation Authority
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
