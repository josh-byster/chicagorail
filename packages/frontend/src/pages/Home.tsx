import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { format, parse } from 'date-fns';
import { StationCommand } from '../components/StationCommand';
import { DepartureBoard } from '../components/DepartureBoard';
import { LineFilter } from '../components/LineFilter';
import { DatePicker } from '../components/DatePicker';
import { ChicagoSkyline } from '../components/ChicagoSkyline';
import { Button } from '../components/ui/button';
import { useRecentStops } from '../hooks/useRecent';
import { api } from '../lib/api';
import type { Stop, DirectTrip } from '@chicagorail/shared';

export function Home() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [fromStop, setFromStop] = useState<Stop | null>(null);
  const [toStop, setToStop] = useState<Stop | null>(null);
  const [routeFilter, setRouteFilter] = useState<string | undefined>();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [initialLoading, setInitialLoading] = useState(true);

  // Trip-specific state (when both from and to are set)
  const [trips, setTrips] = useState<DirectTrip[]>([]);
  const [tripsLoading, setTripsLoading] = useState(false);
  const [tripsError, setTripsError] = useState<string | null>(null);

  const { recentStops, addRecentStop } = useRecentStops();

  // Sync state from URL on mount
  useEffect(() => {
    const fromId = searchParams.get('from');
    const toId = searchParams.get('to');
    const dateParam = searchParams.get('date');
    const routeParam = searchParams.get('route');

    // Sync date
    if (dateParam) {
      try {
        const parsedDate = parse(dateParam, 'yyyy-MM-dd', new Date());
        setSelectedDate(parsedDate);
      } catch {
        setSelectedDate(new Date());
      }
    }

    // Sync route filter
    setRouteFilter(routeParam || undefined);

    if (!fromId && !toId) {
      setInitialLoading(false);
      return;
    }

    const today = format(new Date(), 'yyyy-MM-dd');
    const promises: Promise<void>[] = [];

    if (fromId) {
      promises.push(
        api.getDepartures(fromId, undefined, today)
          .then((response) => {
            setFromStop(response.stop);
          })
          .catch(() => {
            const newParams = new URLSearchParams(searchParams);
            newParams.delete('from');
            setSearchParams(newParams, { replace: true });
          })
      );
    }

    if (toId) {
      promises.push(
        api.getDepartures(toId, undefined, today)
          .then((response) => {
            setToStop(response.stop);
          })
          .catch(() => {
            const newParams = new URLSearchParams(searchParams);
            newParams.delete('to');
            setSearchParams(newParams, { replace: true });
          })
      );
    }

    Promise.all(promises).finally(() => setInitialLoading(false));
  }, []); // Only run on mount

  // Update URL when state changes
  const updateUrlParams = useCallback((from: Stop | null, to: Stop | null, date: Date, route: string | undefined, replace = false) => {
    const params = new URLSearchParams();

    if (from) {
      params.set('from', from.stop_id);
    }
    if (to) {
      params.set('to', to.stop_id);
    }

    const dateStr = format(date, 'yyyy-MM-dd');
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    if (dateStr !== todayStr) {
      params.set('date', dateStr);
    }

    if (route) {
      params.set('route', route);
    }

    setSearchParams(params, { replace });
  }, [setSearchParams]);

  const handleSelectFrom = useCallback((stop: Stop | null) => {
    setFromStop(stop);
    setRouteFilter(undefined);
    if (stop) addRecentStop(stop);
    updateUrlParams(stop, toStop, selectedDate, undefined);
  }, [toStop, selectedDate, updateUrlParams, addRecentStop]);

  const handleSelectTo = useCallback((stop: Stop | null) => {
    setToStop(stop);
    setRouteFilter(undefined);
    if (stop) addRecentStop(stop);
    updateUrlParams(fromStop, stop, selectedDate, undefined);
  }, [fromStop, selectedDate, updateUrlParams, addRecentStop]);

  const handleRouteFilterChange = useCallback((route: string | undefined) => {
    setRouteFilter(route);
    updateUrlParams(fromStop, toStop, selectedDate, route, true);
  }, [fromStop, toStop, selectedDate, updateUrlParams]);

  const handleDateChange = useCallback((date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      updateUrlParams(fromStop, toStop, date, routeFilter, true);
    }
  }, [fromStop, toStop, routeFilter, updateUrlParams]);

  const handleRecentClick = useCallback((stop: Stop) => {
    setFromStop(stop);
    setRouteFilter(undefined);
    addRecentStop(stop);
    updateUrlParams(stop, toStop, selectedDate, undefined);
  }, [toStop, selectedDate, updateUrlParams, addRecentStop]);

  const dateString = format(selectedDate, 'yyyy-MM-dd');
  const isToday = format(new Date(), 'yyyy-MM-dd') === dateString;

  // Fetch trips when both from and to are selected
  useEffect(() => {
    if (!fromStop || !toStop) {
      setTrips([]);
      return;
    }

    const fetchTrips = async () => {
      setTripsLoading(true);
      setTripsError(null);
      try {
        const result = await api.findDirectTrips(fromStop.stop_id, toStop.stop_id, dateString, 50);
        setTrips(result.trips);
      } catch (err) {
        setTripsError(err instanceof Error ? err.message : 'Failed to find trips');
      } finally {
        setTripsLoading(false);
      }
    };

    fetchTrips();
  }, [fromStop, toStop, dateString]);

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  if (initialLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const hasFrom = !!fromStop;
  const hasTo = !!toStop;
  const showTrips = hasFrom && hasTo;
  const showDepartures = hasFrom && !hasTo;
  const showEmpty = !hasFrom;

  return (
    <div className="flex-1 relative overflow-x-hidden bg-gradient-to-b from-metra-blue/5 via-background to-background">
      {/* Skyline - fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 pointer-events-none">
        <ChicagoSkyline className={`w-full opacity-10 ${showEmpty ? 'animate-slide-up-only' : ''}`} />
      </div>

      {/* Hero section */}
      <div className={`flex flex-col items-center pt-24 pb-8 px-4 transition-all duration-500 ${
        hasFrom ? 'pt-12 pb-4' : ''
      }`}>
        {/* Title */}
        <div className={`text-center mb-8 max-w-2xl ${showEmpty ? 'animate-fade-in-up' : ''}`}>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {showEmpty ? 'Where are you traveling?' : fromStop.stop_name}
          </h1>
          <p className="text-lg text-muted-foreground">
            {showEmpty
              ? 'Search for any Metra station to see departures'
              : showTrips
                ? `to ${toStop.stop_name}`
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
      {showDepartures && (
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
                routeFilter={routeFilter}
                date={dateString}
              />
            </div>
          </div>
        </div>
      )}

      {/* Results panel - Trips mode */}
      {showTrips && (
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
                    There are no direct trains between {fromStop?.stop_name} and {toStop?.stop_name}.
                    You may need to transfer at a connection point.
                  </p>
                </div>
              )}

              {trips.length > 0 && !tripsLoading && (() => {
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
                        onClick={() => handleRouteFilterChange(undefined)}
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
