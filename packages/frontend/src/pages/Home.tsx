/**
 * Home page - Main unified search interface
 *
 * Uses URL as the source of truth for all state:
 * - from: Origin station ID
 * - to: Destination station ID
 * - date: Selected date (YYYY-MM-DD)
 * - route: Route filter
 */

import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { format, parse, isValid } from 'date-fns';
import { StationCommand } from '@/components/StationCommand';
import { DepartureBoard } from '@/components/DepartureBoard';
import { LineFilter } from '@/components/LineFilter';
import { DateControls } from '@/components/DateControls';
import { ChicagoSkyline } from '@/components/ChicagoSkyline';
import { TripsResults } from '@/components/TripsResults';
import { useRecentStops } from '@/hooks/useRecent';
import { useStop } from '@/hooks/useStop';
import { useDirectTrips } from '@/hooks/useTrips';
import { APP_CONFIG } from '@/config';
import type { Stop } from '@chicagorail/shared';

export function Home() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: recentStops, addRecentStop } = useRecentStops();

  // URL is the source of truth
  const fromId = searchParams.get('from');
  const toId = searchParams.get('to');
  const dateParam = searchParams.get('date');
  const routeParam = searchParams.get('route');

  // Derive date from URL
  const selectedDate = useMemo(() => {
    if (dateParam) {
      const parsed = parse(dateParam, APP_CONFIG.dateFormats.url, new Date());
      // parse() returns Invalid Date for malformed input rather than throwing
      return isValid(parsed) ? parsed : new Date();
    }
    return new Date();
  }, [dateParam]);

  const dateString = format(selectedDate, APP_CONFIG.dateFormats.url);
  const isToday = format(new Date(), APP_CONFIG.dateFormats.url) === dateString;

  // Fetch stop data based on URL params
  const { data: fromStop } = useStop(fromId);
  const { data: toStop } = useStop(toId);

  // Fetch trips when both from and to are selected
  const {
    data: trips,
    isLoading: tripsLoading,
    error: tripsError,
  } = useDirectTrips(fromId, toId, dateString);

  // URL update helper - uses functional update to avoid searchParams dependency
  const updateUrl = useCallback(
    (
      updates: {
        from?: string | null;
        to?: string | null;
        date?: string | null;
        route?: string | null;
      },
      replace = false
    ) => {
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev);

          Object.entries(updates).forEach(([key, value]) => {
            if (value === null) {
              params.delete(key);
            } else if (value !== undefined) {
              params.set(key, value);
            }
          });

          // Remove date if it's today (cleaner URLs)
          const dateVal = params.get('date');
          if (dateVal === format(new Date(), APP_CONFIG.dateFormats.url)) {
            params.delete('date');
          }

          return params;
        },
        { replace }
      );
    },
    [setSearchParams]
  );

  const handleSelectFrom = useCallback(
    (stop: Stop | null) => {
      if (stop) {
        addRecentStop(stop);
        updateUrl({ from: stop.stop_id, route: null });
      } else {
        updateUrl({ from: null, route: null });
      }
    },
    [updateUrl, addRecentStop]
  );

  const handleSelectTo = useCallback(
    (stop: Stop | null) => {
      if (stop) {
        addRecentStop(stop);
        updateUrl({ to: stop.stop_id, route: null });
      } else {
        updateUrl({ to: null, route: null });
      }
    },
    [updateUrl, addRecentStop]
  );

  const handleRouteFilterChange = useCallback(
    (route: string | undefined) => {
      updateUrl({ route: route || null }, true);
    },
    [updateUrl]
  );

  const handleDateChange = useCallback(
    (date: Date | undefined) => {
      if (date) {
        updateUrl({ date: format(date, APP_CONFIG.dateFormats.url) }, true);
      }
    },
    [updateUrl]
  );

  const showTrips = !!fromId && !!toId;
  const showDepartures = !!fromId && !toId;
  const showEmpty = !fromId;

  // Filter trips by route if selected
  const filteredTrips = useMemo(() => {
    if (!routeParam) return trips;
    return trips.filter((t) => t.route.route_id === routeParam);
  }, [trips, routeParam]);

  // Get unique routes from trips for the filter
  const tripRoutes = useMemo(() => {
    return Array.from(new Map(trips.map((t) => [t.route.route_id, t.route])).values());
  }, [trips]);

  return (
    <div className="flex-1 relative overflow-x-hidden bg-gradient-to-b from-metra-blue/5 via-background to-background">
      {/* Skyline - fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 pointer-events-none">
        <ChicagoSkyline className={`w-full opacity-10 ${showEmpty ? 'animate-slide-up-only' : ''}`} />
      </div>

      {/* Hero section */}
      <div
        className={`flex flex-col items-center pt-24 pb-8 px-4 transition-all duration-500 ${
          fromId ? 'pt-12 pb-4' : ''
        }`}
      >
        {/* Title */}
        <div className={`text-center mb-8 max-w-2xl ${showEmpty ? 'animate-fade-in-up' : ''}`}>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {showEmpty ? 'Where are you traveling?' : fromStop?.stop_name || '\u00A0'}
          </h1>
          <p className="text-lg text-muted-foreground">
            {showEmpty
              ? 'Search for any Metra station to see departures'
              : showTrips
                ? toStop?.stop_name
                  ? `to ${toStop.stop_name}`
                  : '\u00A0'
                : `${isToday ? 'Today' : format(selectedDate, APP_CONFIG.dateFormats.display)}'s departures`}
          </p>
        </div>

        {/* Search inputs */}
        <div
          className={`w-full max-w-xl space-y-3 relative z-20 ${showEmpty ? 'animate-fade-in-up animation-delay-150' : ''}`}
        >
          <StationCommand
            onSelectStation={handleSelectFrom}
            selectedStation={fromStop}
            placeholder={fromId ? 'Change station...' : 'From...'}
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
          <div className="w-full max-w-xl mt-8 relative z-10 animate-fade-in animation-delay-300">
            <p className="text-sm font-medium text-muted-foreground mb-3">Recent</p>
            <div className="flex flex-wrap gap-2">
              {recentStops.map((stop) => (
                <button
                  key={stop.stop_id}
                  onClick={() => handleSelectFrom(stop)}
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
      {showDepartures && fromId && (
        <div className="bg-background/80 backdrop-blur-sm border-t min-h-[50vh]">
          <div className="max-w-4xl mx-auto px-4 py-6">
            <div className="space-y-4">
              <DateControls
                selectedDate={selectedDate}
                isToday={isToday}
                onDateChange={handleDateChange}
              />
              <LineFilter
                selectedRoute={routeParam || undefined}
                onFilterChange={handleRouteFilterChange}
                stopId={fromId}
                date={dateString}
              />
              <DepartureBoard stopId={fromId} routeFilter={routeParam || undefined} date={dateString} />
            </div>
          </div>
        </div>
      )}

      {/* Results panel - Trips mode */}
      {showTrips && (
        <div className="bg-background/80 backdrop-blur-sm border-t min-h-[50vh]">
          <div className="max-w-4xl mx-auto px-4 py-6">
            <div className="space-y-4">
              <DateControls
                selectedDate={selectedDate}
                isToday={isToday}
                onDateChange={handleDateChange}
              />
              <TripsResults
                trips={trips}
                filteredTrips={filteredTrips}
                tripRoutes={tripRoutes}
                isLoading={tripsLoading}
                error={tripsError}
                selectedRoute={routeParam || undefined}
                onRouteFilterChange={handleRouteFilterChange}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
