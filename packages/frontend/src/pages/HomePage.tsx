import * as React from 'react';
import { Check, Train } from 'lucide-react';
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
import { useRouteSearchStore } from '@/stores/routeSearchStore';
import { useUrlSync } from '@/hooks/useUrlSync';
import { SavedRoutesList } from '@/components/SavedRoutes/SavedRoutesList';
import {
  getSavedRoutes,
  updateLastUsed,
  deleteRoute,
} from '@/services/saved-routes';
import { SavedRoute } from '@metra/shared';
import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

export default function HomePage() {
  const [originSearchOpen, setOriginSearchOpen] = React.useState(false);
  const [destinationSearchOpen, setDestinationSearchOpen] =
    React.useState(false);
  const [originQuery, setOriginQuery] = React.useState('');
  const [destinationQuery, setDestinationQuery] = React.useState('');
  const [savedRoutes, setSavedRoutes] = useState<SavedRoute[]>([]);

  const { origin, destination } = useRouteSearchStore();
  const [, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Sync URL parameters with search state (one-way: URL -> store)
  useUrlSync();

  // Fetch all stations for origin selection
  const { data: allStations } = useStations();

  // Fetch reachable stations for destination selection
  const { data: reachableStations } = useReachableStations(origin || null);

  // Load saved routes on component mount
  useEffect(() => {
    const loadSavedRoutes = async () => {
      try {
        const routes = await getSavedRoutes();
        setSavedRoutes(routes);
      } catch (err) {
        console.error('Failed to load saved routes:', err);
      }
    };

    loadSavedRoutes();
  }, []);

  const handleOriginSelect = (stationId: string) => {
    // Update URL with origin only
    setSearchParams({ origin: stationId });
    setOriginQuery('');
    setOriginSearchOpen(false);
    setDestinationQuery('');
  };

  const handleDestinationSelect = (stationId: string) => {
    // Navigate to /route with both origin and destination
    navigate(`/route?origin=${origin}&destination=${stationId}`);
    setDestinationQuery('');
    setDestinationSearchOpen(false);
  };

  const handleChangeRoute = () => {
    // Navigate back to home to clear search
    navigate('/');
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

    // Navigate to /route with saved route
    navigate(
      `/route?origin=${route.origin_station_id}&destination=${route.destination_station_id}`
    );
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

      {/* Main Content - Search Interface */}
      <div className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-2xl space-y-12">
          {/* Header */}
          <div className="text-center space-y-8 animate-fade-in-down">
            <h1 className="text-6xl md:text-7xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Metra Tracker
            </h1>
          </div>

          {/* Saved Routes - only show when no origin selected */}
          {savedRoutes.length > 0 && !origin && (
            <div className="max-w-lg mx-auto w-full animate-fade-in-up animate-delay-200">
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
            <div className="relative max-w-2xl mx-auto w-full animate-fade-in-up animate-delay-300">
              <Command className="rounded-2xl overflow-hidden bg-white/70 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white/20 hover:shadow-[0_20px_60px_rgb(0,0,0,0.15)] hover:bg-white/80 focus-within:shadow-[0_20px_60px_rgb(0,0,0,0.15)] focus-within:bg-white/80 transition-all duration-500 hover:scale-[1.01] focus-within:scale-[1.01]">
                <CommandInput
                  placeholder="Search for a station"
                  value={originQuery}
                  onValueChange={(value) => {
                    setOriginQuery(value);
                    if (value.length > 0) {
                      setOriginSearchOpen(true);
                    } else {
                      setOriginSearchOpen(false);
                    }
                  }}
                  className="h-16 text-lg px-6"
                  autoFocus
                />
                {originSearchOpen && originQuery.length > 0 && (
                  <CommandList className="max-h-80">
                    <CommandEmpty>No stations found.</CommandEmpty>
                    <CommandGroup>
                      {originStationsToShow?.map((station) => (
                        <CommandItem
                          key={station.station_id}
                          value={station.station_id}
                          keywords={[station.station_name]}
                          onSelect={(value) => handleOriginSelect(value)}
                          className="cursor-pointer py-3 px-4 text-base aria-selected:bg-primary/10 hover:bg-primary/5 transition-colors duration-200"
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
              <div className="flex items-center gap-3 p-4 bg-white/60 backdrop-blur-md rounded-xl border border-white/30 shadow-md">
                <span className="text-sm text-muted-foreground">From:</span>
                <span className="font-semibold text-foreground text-lg flex-1">
                  {fromStationData?.station_name}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleChangeRoute}
                  className="text-xs hover:bg-primary/10 transition-colors"
                >
                  Change
                </Button>
              </div>

              <div className="relative">
                <div className="mb-3 text-sm font-medium text-muted-foreground">
                  Where to?
                </div>
                <Command className="rounded-2xl overflow-hidden bg-white/70 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white/20 hover:shadow-[0_20px_60px_rgb(0,0,0,0.15)] hover:bg-white/80 focus-within:shadow-[0_20px_60px_rgb(0,0,0,0.15)] focus-within:bg-white/80 transition-all duration-500 hover:scale-[1.01] focus-within:scale-[1.01]">
                  <CommandInput
                    placeholder="Search destinations..."
                    value={destinationQuery}
                    onValueChange={(value) => {
                      setDestinationQuery(value);
                      if (value.length > 0) {
                        setDestinationSearchOpen(true);
                      } else {
                        setDestinationSearchOpen(false);
                      }
                    }}
                    className="h-16 text-lg px-6"
                    autoFocus
                  />
                  {destinationSearchOpen && destinationQuery.length > 0 && (
                    <CommandList className="max-h-80">
                      <CommandEmpty>No stations found.</CommandEmpty>
                      <CommandGroup>
                        {destinationStationsToShow?.map((station) => (
                          <CommandItem
                            key={station.station_id}
                            value={station.station_id}
                            keywords={[station.station_name]}
                            onSelect={(value) => handleDestinationSelect(value)}
                            className="cursor-pointer py-3 px-4 text-base aria-selected:bg-primary/10 hover:bg-primary/5 transition-colors duration-200"
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
    </div>
  );
}
