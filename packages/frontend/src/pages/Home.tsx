import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { format, parse } from 'date-fns';
import { StationCommand } from '../components/StationCommand';
import { DepartureBoard } from '../components/DepartureBoard';
import { LineFilter } from '../components/LineFilter';
import { DatePicker } from '../components/DatePicker';
import { ChicagoSkyline } from '../components/ChicagoSkyline';
import { Button } from '../components/ui/button';
import { useRecentStops } from '../hooks/useRecent';
import { useStop } from '../hooks/useStop';
import { api } from '../lib/api';
import type { Stop, DirectTrip } from '@chicagorail/shared';

export function Home() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { recentStops, addRecentStop } = useRecentStops();

  // URL is the source of truth
  const fromId = searchParams.get('from');
  const toId = searchParams.get('to');
  const dateParam = searchParams.get('date');
  const routeParam = searchParams.get('route');

  // Derive date from URL
  const selectedDate = useMemo(() => {
    if (dateParam) {
      try {
        return parse(dateParam, 'yyyy-MM-dd', new Date());
      } catch {
        return new Date();
      }
    }
    return new Date();
  }, [dateParam]);

  const dateString = format(selectedDate, 'yyyy-MM-dd');
  const isToday = format(new Date(), 'yyyy-MM-dd') === dateString;

  // Fetch stop data based on URL params
  const { stop: fromStop, loading: fromLoading } = useStop(fromId);
  const { stop: toStop, loading: toLoading } = useStop(toId);

  // Trip-specific state (when both from and to are set)
  const [trips, setTrips] = useState<DirectTrip[]>([]);
  const [tripsLoading, setTripsLoading] = useState(false);
  const [tripsError, setTripsError] = useState<string | null>(null);

  // URL update helper - uses functional update to avoid searchParams dependency
  const updateUrl = useCallback((updates: {
    from?: string | null;
    to?: string | null;
    date?: string | null;
    route?: string | null;
  }, replace = false) => {
    setSearchParams(prev => {
      const params = new URLSearchParams(prev);

      Object.entries(updates).forEach(([key, value]) => {
        if (value === null) {
          params.delete(key);
        } else if (value !== undefined) {
          params.set(key, value);
        }
      });

      // Remove date if it's today
      const dateVal = params.get('date');
      if (dateVal === format(new Date(), 'yyyy-MM-dd')) {
        params.delete('date');
      }

      return params;
    }, { replace });
  }, [setSearchParams]);

  const handleSelectFrom = useCallback((stop: Stop | null) => {
    if (stop) {
      addRecentStop(stop);
      updateUrl({ from: stop.stop_id, route: null });
    } else {
      updateUrl({ from: null, route: null });
    }
  }, [updateUrl, addRecentStop]);

  const handleSelectTo = useCallback((stop: Stop | null) => {
    if (stop) {
      addRecentStop(stop);
      updateUrl({ to: stop.stop_id, route: null });
    } else {
      updateUrl({ to: null, route: null });
    }
  }, [updateUrl, addRecentStop]);

  const handleRouteFilterChange = useCallback((route: string | undefined) => {
    updateUrl({ route: route || null }, true);
  }, [updateUrl]);

  const handleDateChange = useCallback((date: Date | undefined) => {
    if (date) {
      updateUrl({ date: format(date, 'yyyy-MM-dd') }, true);
    }
  }, [updateUrl]);

  const handleRecentClick = useCallback((stop: Stop) => {
    addRecentStop(stop);
    updateUrl({ from: stop.stop_id, route: null });
  }, [updateUrl, addRecentStop]);

  // Fetch trips when both from and to are selected
  useEffect(() => {
    if (!fromId || !toId) {
      setTrips([]);
      return;
    }

    let cancelled = false;

    const fetchTrips = async () => {
      setTripsLoading(true);
      setTripsError(null);
      try {
        const result = await api.findDirectTrips(fromId, toId, dateString, 50);
        if (!cancelled) {
          setTrips(result.trips);
        }
      } catch (err) {
        if (!cancelled) {
          setTripsError(err instanceof Error ? err.message : 'Failed to find trips');
        }
      } finally {
        if (!cancelled) {
          setTripsLoading(false);
        }
      }
    };

    fetchTrips();

    return () => {
      cancelled = true;
    };
  }, [fromId, toId, dateString]);

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const hasFrom = !!fromStop;
  const hasTo = !!toStop;
  const showTrips = hasFrom && hasTo;
  const showDepartures = hasFrom && !hasTo;
  const showEmpty = !fromId;

  return (
    <div className="flex-1 relative overflow-x-hidden bg-gradient-to-b from-metra-blue/5 via-background to-background">
      {/* Skyline - fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 pointer-events-none">
        <ChicagoSkyline className={`w-full opacity-10 ${showEmpty ? 'animate-slide-up-only' : ''}`} />
      </div>

      {/* Hero section */}
      <div className={`flex flex-col items-center pt-24 pb-8 px-4 transition-all duration-500 ${
        fromId ? 'pt-12 pb-4' : ''
      }`}>
        {/* Title */}
        <div className={`text-center mb-8 max-w-2xl ${showEmpty ? 'animate-fade-in-up' : ''}`}>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {showEmpty ? 'Where are you traveling?' : (fromStop?.stop_name || 'Loading...')}
          </h1>
          <p className="text-lg text-muted-foreground">
            {showEmpty
              ? 'Search for any Metra station to see departures'
              : showTrips
                ? `to ${toStop?.stop_name}`
                : `${isToday ? 'Today' : format(selectedDate, 'EEEE, MMMM d')}'s departures`
            }
          </p>
        </div>

        {/* Search inputs */}
        <div className={`w-full max-w-xl space-y-3 relative z-20 ${showEmpty ? 'animate-fade-in-up animation-delay-150' : ''}`}>
          <StationCommand
            onSelectStation={handleSelectFrom}
            selectedStation={fromStop}
            placeholder={hasFrom ? 'Change station...' : 'From...'}
            label="From"
          />
          <StationCommand
            onSelectStation={handleSelectTo}
            selectedStation={toStop}
            placeholder="Add destination..."
            label="To"
            variant="secondary"
          />
        </div>

        {/* Recent stations - only in empty state */}
        {showEmpty && recentStops.length > 0 && (
          <div className={`w-full max-w-xl mt-8 relative z-10 animate-fade-in animation-delay-300`}>
            <p className="text-sm font-medium text-muted-foreground mb-3">Recent</p>
            <div className="flex flex-wrap gap-2">
              {recentStops.map((stop) => (
                <button
                  key={stop.stop_id}
                  onClick={() => handleRecentClick(stop)}
                  className="px-4 py-2 rounded-full border bg-background hover:bg-muted transition-colors text-sm"
                >
                  {stop.stop_name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Results panel - Departures mode */}
      {showDepartures && fromStop && (
        <div className="bg-background/80 backdrop-blur-sm border-t min-h-[50vh]">
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
              <LineFilter
                onFilterChange={handleRouteFilterChange}
                stopId={fromStop.stop_id}
                date={dateString}
              />
              <DepartureBoard
                stopId={fromStop.stop_id}
                routeFilter={routeParam || undefined}
                date={dateString}
              />
            </div>
          </div>
        </div>
      )}

      {/* Results panel - Trips mode */}
      {showTrips && fromStop && toStop && (
        <div className="bg-background/80 backdrop-blur-sm border-t min-h-[50vh]">
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

              {tripsLoading && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Finding trains...</p>
                </div>
              )}

              {tripsError && (
                <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-800 dark:text-red-200">{tripsError}</p>
                </div>
              )}

              {!tripsLoading && trips.length === 0 && !tripsError && (
                <div className="p-6 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <h3 className="font-semibold mb-2">No Direct Trains Found</h3>
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    There are no direct trains between {fromStop.stop_name} and {toStop.stop_name}.
                    You may need to transfer at a connection point.
                  </p>
                </div>
              )}

              {trips.length > 0 && !tripsLoading && (() => {
                const uniqueRoutes = Array.from(new Map(trips.map(t => [t.route.route_id, t.route])).values());
                const filteredTrips = routeParam
                  ? trips.filter(t => t.route.route_id === routeParam)
                  : trips;

                return (
                  <>
                    {/* Route filter buttons */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      <button
                        className={`px-3 py-1 rounded-full text-sm whitespace-nowrap transition-colors ${
                          !routeParam
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary hover:bg-secondary/80'
                        }`}
                        onClick={() => handleRouteFilterChange(undefined)}
                      >
                        All Lines
                      </button>
                      {uniqueRoutes.map((route) => {
                        const isSelected = routeParam === route.route_id;
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
                            onClick={() => handleRouteFilterChange(route.route_id)}
                          >
                            {route.route_short_name}
                          </button>
                        );
                      })}
                      {filteredTrips[0]?.duration_minutes && (
                        <span className="text-sm text-muted-foreground self-center ml-2">
                          ~{filteredTrips[0].duration_minutes} min
                        </span>
                      )}
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
      )}
    </div>
  );
}
