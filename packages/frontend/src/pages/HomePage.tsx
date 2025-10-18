import * as React from 'react';
import { Check, Train, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { useStations } from '@/hooks/useStations';
import { useReachableStations } from '@/hooks/useReachableStations';
import { useTrains } from '@/hooks/useTrains';
import { useRouteSearchStore } from '@/stores/routeSearchStore';
import { TrainList } from '@/components/TrainList/TrainList';
import { SavedRoutesList } from '@/components/SavedRoutes/SavedRoutesList';
import {
  getSavedRoutes,
  updateLastUsed,
  deleteRoute,
} from '@/services/saved-routes';
import { SavedRoute } from '@metra/shared';
import { useEffect, useState } from 'react';

export default function HomePage() {
  const [showResults, setShowResults] = React.useState(false);
  const [originSearchOpen, setOriginSearchOpen] = React.useState(false);
  const [destinationSearchOpen, setDestinationSearchOpen] =
    React.useState(false);
  const [originQuery, setOriginQuery] = React.useState('');
  const [destinationQuery, setDestinationQuery] = React.useState('');
  const [savedRoutes, setSavedRoutes] = useState<SavedRoute[]>([]);

  const { origin, destination, setRoute, hasSearched } = useRouteSearchStore();

  // Fetch all stations for origin selection
  const { data: allStations } = useStations();

  // Fetch reachable stations for destination selection
  const { data: reachableStations } = useReachableStations(origin || null);

  const {
    data: trains,
    isLoading,
    error,
  } = useTrains({
    origin,
    destination,
    enabled: hasSearched && !!origin && !!destination,
  });

  // Load saved routes on component mount
  useEffect(() => {
    const loadSavedRoutes = async () => {
      try {
        const routes = await getSavedRoutes();
        setSavedRoutes(routes);

        // Auto-display last-used route if no route is selected
        const currentOrigin = useRouteSearchStore.getState().origin;
        const currentDestination = useRouteSearchStore.getState().destination;

        if (routes.length > 0 && !currentOrigin && !currentDestination) {
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
          setShowResults(true);
        }
      } catch (err) {
        console.error('Failed to load saved routes:', err);
      }
    };

    loadSavedRoutes();
  }, []);

  const handleOriginSelect = (stationId: string) => {
    setRoute(stationId, '');
    setOriginQuery('');
    setOriginSearchOpen(false);
    setDestinationQuery('');
  };

  const handleDestinationSelect = (stationId: string) => {
    setRoute(origin, stationId);
    setDestinationQuery('');
    setDestinationSearchOpen(false);
    setShowResults(true);
  };

  const handleChangeRoute = () => {
    setShowResults(false);
    setRoute('', '');
    setOriginQuery('');
    setOriginSearchOpen(true);
    setDestinationQuery('');
    setDestinationSearchOpen(false);
  };

  const handleSavedRouteClick = async (route: SavedRoute) => {
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

    setRoute(route.origin_station_id, route.destination_station_id);
    setShowResults(true);
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

  const fromStationData = allStations?.find((s) => s.station_id === origin);
  const toStationData = reachableStations?.find(
    (s) => s.station_id === destination
  );

  // Filter stations based on search query
  const originStationsToShow = allStations?.filter((s) =>
    s.station_name.toLowerCase().includes(originQuery.toLowerCase())
  );

  const destinationStationsToShow = reachableStations?.filter(
    (s) =>
      s.station_id !== origin &&
      s.station_name.toLowerCase().includes(destinationQuery.toLowerCase())
  );

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-background via-blue-50/30 to-primary/5"
      style={{
        backgroundImage:
          'url("https://www.transparenttextures.com/patterns/absurdity.png")',
        backgroundBlendMode: 'multiply',
      }}
    >
      {/* Navigation Bar */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-2 font-bold text-lg">
            <Train className="h-5 w-5" />
            Metra Tracker
          </div>
        </div>
      </nav>

      {/* Main Content */}
      {!showResults && (
        <div className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center px-4 py-8">
          <div className="w-full max-w-2xl space-y-12">
            {/* Header */}
            <div className="text-center space-y-8">
              <h1 className="text-6xl md:text-7xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Metra Tracker
              </h1>
            </div>

            {/* Saved Routes - only show when no origin selected */}
            {savedRoutes.length > 0 && !origin && (
              <div className="max-w-lg mx-auto w-full">
                <SavedRoutesList
                  routes={savedRoutes}
                  onRouteClick={handleSavedRouteClick}
                  onRouteDelete={handleSavedRouteDelete}
                />
              </div>
            )}

            {/* Origin Selection or Display */}
            {!origin ? (
              // Big search bar for origin selection
              <div className="relative max-w-2xl mx-auto w-full">
                <Command className="rounded-xl overflow-hidden bg-white/60 backdrop-blur-md shadow-lg hover:shadow-2xl focus-within:shadow-2xl transition-shadow duration-300">
                  <CommandInput
                    placeholder="Search for a station"
                    value={originQuery}
                    onValueChange={(value) => {
                      setOriginQuery(value);
                      setOriginSearchOpen(true);
                    }}
                    onFocus={() => setOriginSearchOpen(true)}
                    className="h-16 text-lg px-6"
                    autoFocus
                  />
                  {originSearchOpen && (
                    <CommandList className="max-h-80">
                      <CommandEmpty>No stations found.</CommandEmpty>
                      <CommandGroup>
                        {originStationsToShow?.map((station) => (
                          <CommandItem
                            key={station.station_id}
                            value={station.station_name}
                            onSelect={() =>
                              handleOriginSelect(station.station_id)
                            }
                            className="cursor-pointer py-3 px-4 text-base aria-selected:bg-primary/10"
                          >
                            <Check
                              className={cn(
                                'mr-3 h-5 w-5 transition-all duration-200',
                                origin === station.station_id
                                  ? 'opacity-100 scale-100'
                                  : 'opacity-0 scale-75'
                              )}
                            />
                            {station.station_name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  )}
                </Command>
              </div>
            ) : (
              // Selected origin with destination search
              <div className="space-y-6 animate-in fade-in duration-300 max-w-2xl mx-auto w-full">
                <div className="flex items-center gap-3 p-4 bg-primary/10 rounded-lg">
                  <span className="text-sm text-muted-foreground">From:</span>
                  <span className="font-semibold text-foreground text-lg flex-1">
                    {fromStationData?.station_name}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleChangeRoute}
                    className="text-xs"
                  >
                    Change
                  </Button>
                </div>

                <div className="relative">
                  <div className="mb-3 text-sm font-medium text-muted-foreground">
                    Where to?
                  </div>
                  <Command className="rounded-xl overflow-hidden bg-white/60 backdrop-blur-md shadow-lg hover:shadow-2xl focus-within:shadow-2xl transition-shadow duration-300">
                    <CommandInput
                      placeholder="Search destinations..."
                      value={destinationQuery}
                      onValueChange={(value) => {
                        setDestinationQuery(value);
                        setDestinationSearchOpen(true);
                      }}
                      onFocus={() => setDestinationSearchOpen(true)}
                      className="h-16 text-lg px-6"
                      autoFocus
                    />
                    {destinationSearchOpen && (
                      <CommandList className="max-h-80">
                        <CommandEmpty>No stations found.</CommandEmpty>
                        <CommandGroup>
                          {destinationStationsToShow?.map((station) => (
                            <CommandItem
                              key={station.station_id}
                              value={station.station_name}
                              onSelect={() =>
                                handleDestinationSelect(station.station_id)
                              }
                              className="cursor-pointer py-3 px-4 text-base aria-selected:bg-primary/10"
                            >
                              <Check
                                className={cn(
                                  'mr-3 h-5 w-5 transition-all duration-200',
                                  destination === station.station_id
                                    ? 'opacity-100 scale-100'
                                    : 'opacity-0 scale-75'
                                )}
                              />
                              {station.station_name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    )}
                  </Command>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Results Section */}
      {showResults && (
        <div className="container mx-auto px-4 py-12 animate-in fade-in duration-300">
          <div className="max-w-5xl mx-auto">
            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
              <div>
                <Button
                  variant="ghost"
                  onClick={handleChangeRoute}
                  className="mb-4 gap-2"
                >
                  <span>Change route</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
                <h2 className="text-3xl font-bold">
                  {fromStationData?.station_name} →{' '}
                  {toStationData?.station_name}
                </h2>
              </div>
            </div>

            {/* Train Results */}
            <TrainList
              trains={trains}
              isLoading={isLoading}
              error={error}
              isEmpty={!isLoading && (!trains || trains.length === 0)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
