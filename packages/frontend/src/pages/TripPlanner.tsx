import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { format, parse } from 'date-fns';
import { StationCommand } from '../components/StationCommand';
import { ChicagoSkyline } from '../components/ChicagoSkyline';
import { DatePicker } from '../components/DatePicker';
import { Button } from '../components/ui/button';
import { ArrowRight, ArrowDown } from 'lucide-react';
import type { Stop, DirectTrip } from '@chicagorail/shared';
import { api } from '../lib/api';

export function TripPlanner() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [origin, setOrigin] = useState<Stop | null>(null);
  const [destination, setDestination] = useState<Stop | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [trips, setTrips] = useState<DirectTrip[]>([]);
  const [routeFilter, setRouteFilter] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(false);

  // Load state from URL params on mount
  useEffect(() => {
    const originId = searchParams.get('origin');
    const destinationId = searchParams.get('destination');
    const dateParam = searchParams.get('date');

    // Sync date
    if (dateParam) {
      try {
        const parsedDate = parse(dateParam, 'yyyy-MM-dd', new Date());
        setSelectedDate(parsedDate);
      } catch {
        setSelectedDate(new Date());
      }
    } else {
      setSelectedDate(new Date());
    }

    if (!originId && !destinationId) return;

    setInitialLoading(true);
    const today = format(new Date(), 'yyyy-MM-dd');

    // Fetch both stops in parallel if they exist in URL
    const promises: Promise<void>[] = [];

    if (originId) {
      promises.push(
        api.getDepartures(originId, undefined, today)
          .then((response) => {
            setOrigin(response.stop);
          })
          .catch(() => {
            // Origin not found, clear the param
            const newParams = new URLSearchParams(searchParams);
            newParams.delete('origin');
            setSearchParams(newParams, { replace: true });
          })
      );
    }

    if (destinationId) {
      promises.push(
        api.getDepartures(destinationId, undefined, today)
          .then((response) => {
            setDestination(response.stop);
          })
          .catch(() => {
            // Destination not found, clear the param
            const newParams = new URLSearchParams(searchParams);
            newParams.delete('destination');
            setSearchParams(newParams, { replace: true });
          })
      );
    }

    Promise.all(promises).finally(() => setInitialLoading(false));
  }, []); // Only run on mount

  // Update URL when state changes
  const updateUrlParams = useCallback((orig: Stop | null, dest: Stop | null, date: Date, replace = false) => {
    const params = new URLSearchParams();

    if (orig) {
      params.set('origin', orig.stop_id);
    }
    if (dest) {
      params.set('destination', dest.stop_id);
    }

    const dateStr = format(date, 'yyyy-MM-dd');
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    if (dateStr !== todayStr) {
      params.set('date', dateStr);
    }

    setSearchParams(params, { replace });
  }, [setSearchParams]);

  // Wrapper to update both state and URL
  const handleSelectOrigin = useCallback((stop: Stop | null) => {
    setOrigin(stop);
    setRouteFilter(undefined); // Reset filter when changing stations
    updateUrlParams(stop, destination, selectedDate);
  }, [destination, selectedDate, updateUrlParams]);

  const handleSelectDestination = useCallback((stop: Stop | null) => {
    setDestination(stop);
    setRouteFilter(undefined); // Reset filter when changing stations
    updateUrlParams(origin, stop, selectedDate);
  }, [origin, selectedDate, updateUrlParams]);

  const handleDateChange = useCallback((date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      updateUrlParams(origin, destination, date, true);
    }
  }, [origin, destination, updateUrlParams]);

  const dateString = format(selectedDate, 'yyyy-MM-dd');
  const isToday = format(new Date(), 'yyyy-MM-dd') === dateString;

  const handleSearch = useCallback(async () => {
    if (!origin || !destination) return;

    setLoading(true);
    setError(null);
    setSearched(true);

    try {
      const result = await api.findDirectTrips(origin.stop_id, destination.stop_id, dateString, 50);
      setTrips(result.trips);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to find trips');
    } finally {
      setLoading(false);
    }
  }, [origin, destination, dateString]);

  // Auto-search when both origin and destination are selected, or date changes
  useEffect(() => {
    if (origin && destination) {
      handleSearch();
    }
  }, [origin, destination, handleSearch]);

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  // Loading state when loading from URL
  if (initialLoading) {
    return (
      <div className="min-h-[calc(100vh-57px)] flex items-center justify-center">
        <p className="text-muted-foreground">Loading trip...</p>
      </div>
    );
  }

  const hasRoute = origin && destination;

  return (
    <div className="min-h-[calc(100vh-57px)] relative overflow-x-hidden bg-gradient-to-b from-metra-blue/5 via-background to-background">

      {/* Skyline - fixed at bottom, always visible */}
      <div className="fixed bottom-0 left-0 right-0 pointer-events-none">
        <ChicagoSkyline className={`w-full opacity-10 ${!hasRoute ? 'animate-slide-up animation-delay-200' : ''}`} />
      </div>

      {/* Hero section - always at top */}
      <div className={`flex flex-col items-center pt-24 pb-8 px-4 transition-all duration-500 ${
        hasRoute ? 'pt-12 pb-4' : ''
      }`}>
        {/* Title */}
        <div className={`text-center mb-8 max-w-2xl ${!hasRoute ? 'animate-fade-in-up' : ''}`}>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {hasRoute ? (
              <span className="flex items-center justify-center gap-3 flex-wrap">
                <span>{origin.stop_name}</span>
                <ArrowRight className="h-8 w-8 text-metra-blue hidden md:block" />
                <ArrowDown className="h-8 w-8 text-metra-blue md:hidden" />
                <span>{destination.stop_name}</span>
              </span>
            ) : (
              'Plan your trip'
            )}
          </h1>
          <p className="text-lg text-muted-foreground">
            {hasRoute
              ? `${isToday ? 'Today' : format(selectedDate, 'EEEE, MMMM d')}'s departures`
              : 'Find direct trains between any two Metra stations'
            }
          </p>
        </div>

        {/* Search inputs */}
        <div className={`w-full max-w-xl space-y-3 ${!hasRoute ? 'animate-fade-in-up animation-delay-150' : ''}`}>
          <StationCommand
            onSelectStation={handleSelectOrigin}
            placeholder={origin ? 'Change origin...' : 'From...'}
            selectedStation={origin}
          />
          <div className="flex items-center justify-center">
            <ArrowDown className="h-5 w-5 text-muted-foreground" />
          </div>
          <StationCommand
            onSelectStation={handleSelectDestination}
            placeholder={destination ? 'Change destination...' : 'To...'}
            selectedStation={destination}
          />
        </div>

        {/* Hint text */}
        <p className={`mt-6 text-sm text-muted-foreground/60 transition-all duration-300 -z-10 relative ${
          hasRoute ? 'opacity-0 h-0 overflow-hidden' : 'opacity-100 animate-fade-in animation-delay-300'
        }`}>
          Select origin and destination to see available trains
        </p>
      </div>

      {/* Results panel - slides up from bottom */}
      <div className={`bg-background/80 backdrop-blur-sm border-t transition-all duration-500 ease-out ${
        hasRoute
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-full pointer-events-none'
      }`}>
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <DatePicker
                date={selectedDate}
                onDateChange={handleDateChange}
              />
              {!isToday && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDateChange(new Date())}
                >
                  Today
                </Button>
              )}
            </div>

            {loading && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Finding trains...</p>
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </div>
            )}

            {searched && !loading && trips.length === 0 && !error && (
              <div className="p-6 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <h3 className="font-semibold mb-2">No Direct Trains Found</h3>
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  There are no direct trains between {origin?.stop_name} and {destination?.stop_name}.
                  You may need to transfer at a connection point.
                </p>
              </div>
            )}

            {trips.length > 0 && !loading && (() => {
              const uniqueRoutes = Array.from(new Map(trips.map(t => [t.route.route_id, t.route])).values());
              const filteredTrips = routeFilter
                ? trips.filter(t => t.route.route_id === routeFilter)
                : trips;

              return (
                <>
                  {/* Route filter buttons */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    <button
                      className={`px-3 py-1 rounded-full text-sm whitespace-nowrap transition-colors ${
                        !routeFilter
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary hover:bg-secondary/80'
                      }`}
                      onClick={() => setRouteFilter(undefined)}
                    >
                      All Lines
                    </button>
                    {uniqueRoutes.map((route) => {
                      const isSelected = routeFilter === route.route_id;
                      return (
                        <button
                          key={route.route_id}
                          className={`px-3 py-1 rounded-full text-sm whitespace-nowrap transition-all ${
                            isSelected ? 'ring-2 ring-offset-2 ring-primary' : 'opacity-80 hover:opacity-100'
                          }`}
                          style={{
                            backgroundColor: `#${route.route_color}`,
                            color: `#${route.route_text_color || 'FFFFFF'}`,
                          }}
                          onClick={() => setRouteFilter(route.route_id)}
                        >
                          {route.route_short_name}
                        </button>
                      );
                    })}
                    <span className="text-sm text-muted-foreground self-center ml-2">
                      ~{filteredTrips[0]?.duration_minutes} min
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {filteredTrips.map((trip, index) => (
                      <div
                        key={`${trip.trip_id}-${index}`}
                        className="border rounded-lg px-3 py-2.5 hover:bg-accent transition-colors bg-background/50"
                      >
                        <div className="flex items-center gap-1.5 justify-center mb-0.5">
                          <div
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: `#${trip.route.route_color}` }}
                          />
                          <span className="font-semibold text-lg tabular-nums">
                            {formatTime(trip.origin_departure)}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground text-center">
                          arr. {formatTime(trip.destination_arrival)}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
