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
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-blue-50/30">
      {/* Navigation Bar */}
      <nav className="border-b border-gray-200 bg-white/95 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-2 font-semibold text-base text-gray-900">
            <Train className="h-5 w-5 text-blue-600" />
            Metra Tracker
          </div>
        </div>
      </nav>

      {/* Main Content - Search Interface */}
      <div className="h-[calc(100vh-80px)] flex flex-col items-center px-6 py-12 overflow-y-auto">
        <div className="w-full max-w-2xl flex flex-col">
          {/* Header - Fixed position */}
          <div className="text-center pt-8 pb-10 flex-shrink-0">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight">
              Metra Tracker
            </h1>
            <div className="mx-auto w-16 h-1 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full mt-5"></div>
            <p className="mt-5 text-gray-700 text-lg">
              Find your train schedule
            </p>
          </div>

          {/* Content area */}
          <div className="flex flex-col pb-8">
            {/* Saved Routes - only show when no origin selected */}
            {savedRoutes.length > 0 && !origin && (
              <div className="max-w-lg mx-auto w-full mb-8 flex-shrink-0">
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
              <div className="relative max-w-2xl mx-auto w-full flex-shrink-0">
                <Command className="rounded-xl overflow-hidden bg-white border border-gray-200 shadow-lg hover:shadow-xl focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all duration-200">
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
                    className="h-16 text-lg px-6 placeholder:text-gray-400"
                    autoFocus
                  />
                  {originSearchOpen && originQuery.length > 0 && (
                    <CommandList className="max-h-[35vh]">
                      <CommandEmpty>No stations found.</CommandEmpty>
                      <CommandGroup>
                        {originStationsToShow?.map((station) => (
                          <CommandItem
                            key={station.station_id}
                            value={station.station_id}
                            keywords={[station.station_name]}
                            onSelect={(value) => handleOriginSelect(value)}
                            className="cursor-pointer py-3 px-4 text-base aria-selected:bg-blue-50 hover:bg-gray-50 transition-colors"
                          >
                            <Check
                              className={cn(
                                'mr-3 h-5 w-5 transition-opacity',
                                origin === station.station_id
                                  ? 'opacity-100'
                                  : 'opacity-0'
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
              <div className="space-y-8 max-w-2xl mx-auto w-full flex-shrink-0">
                <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-200 shadow-md">
                  <span className="text-sm text-gray-500">From:</span>
                  <span className="font-semibold text-gray-900 text-lg flex-1">
                    {fromStationData?.station_name}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleChangeRoute}
                    className="text-sm hover:bg-gray-100 transition-colors"
                  >
                    Change
                  </Button>
                </div>

                <div className="relative">
                  <div className="mb-4 text-sm font-medium text-gray-700">
                    Where to?
                  </div>
                  <Command className="rounded-xl overflow-hidden bg-white border border-gray-200 shadow-lg hover:shadow-xl focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all duration-200">
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
                      className="h-16 text-lg px-6 placeholder:text-gray-400"
                      autoFocus
                    />
                    {destinationSearchOpen && destinationQuery.length > 0 && (
                      <CommandList className="max-h-[28vh]">
                        <CommandEmpty>No stations found.</CommandEmpty>
                        <CommandGroup>
                          {destinationStationsToShow?.map((station) => (
                            <CommandItem
                              key={station.station_id}
                              value={station.station_id}
                              keywords={[station.station_name]}
                              onSelect={(value) =>
                                handleDestinationSelect(value)
                              }
                              className="cursor-pointer py-3 px-4 text-base aria-selected:bg-blue-50 hover:bg-gray-50 transition-colors"
                            >
                              <Check
                                className={cn(
                                  'mr-3 h-5 w-5 transition-opacity',
                                  destination === station.station_id
                                    ? 'opacity-100'
                                    : 'opacity-0'
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
    </div>
  );
}
