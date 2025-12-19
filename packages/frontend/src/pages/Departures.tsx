import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { format, parse } from 'date-fns';
import { StationCommand } from '../components/StationCommand';
import { DepartureBoard } from '../components/DepartureBoard';
import { LineFilter } from '../components/LineFilter';
import { DatePicker } from '../components/DatePicker';
import { ChicagoSkyline } from '../components/ChicagoSkyline';
import { Button } from '../components/ui/button';
import { api } from '../lib/api';
import type { Stop } from '@chicagorail/shared';

export function Departures() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedStop, setSelectedStop] = useState<Stop | null>(null);
  const [routeFilter, setRouteFilter] = useState<string | undefined>();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  // Sync state with URL params (runs on mount and when URL changes via back/forward)
  useEffect(() => {
    const stopId = searchParams.get('stop');
    const route = searchParams.get('route');
    const date = searchParams.get('date');

    // Sync route filter
    setRouteFilter(route || undefined);

    // Sync date
    if (date) {
      try {
        const parsedDate = parse(date, 'yyyy-MM-dd', new Date());
        setSelectedDate(parsedDate);
      } catch {
        // Invalid date, use today
        setSelectedDate(new Date());
      }
    } else {
      setSelectedDate(new Date());
    }

    // Sync stop - need to fetch if we have a stopId but no matching selectedStop
    if (stopId && selectedStop?.stop_id !== stopId) {
      setLoading(true);
      api.getDepartures(stopId, undefined, date || format(new Date(), 'yyyy-MM-dd'))
        .then((response) => {
          setSelectedStop(response.stop);
        })
        .catch(() => {
          // Stop not found, clear state
          setSelectedStop(null);
        })
        .finally(() => {
          setLoading(false);
          setInitialLoad(false);
        });
    } else if (!stopId && selectedStop) {
      // URL has no stop but we have one selected - clear it (back button case)
      setSelectedStop(null);
      setInitialLoad(false);
    } else {
      setInitialLoad(false);
    }
  }, [searchParams]); // Re-run when URL changes

  // Update URL when state changes
  const updateUrlParams = useCallback((stop: Stop | null, route: string | undefined, date: Date, replace = false) => {
    const params = new URLSearchParams();

    if (stop) {
      params.set('stop', stop.stop_id);
    }
    if (route) {
      params.set('route', route);
    }

    const dateStr = format(date, 'yyyy-MM-dd');
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    if (dateStr !== todayStr) {
      params.set('date', dateStr);
    }

    setSearchParams(params, { replace });
  }, [setSearchParams]);

  // Wrapper to update both state and URL
  const handleSelectStop = useCallback((stop: Stop | null) => {
    setSelectedStop(stop);
    setRouteFilter(undefined); // Reset route filter when changing station
    updateUrlParams(stop, undefined, selectedDate);
  }, [selectedDate, updateUrlParams]);

  const handleRouteFilterChange = useCallback((route: string | undefined) => {
    setRouteFilter(route);
    updateUrlParams(selectedStop, route, selectedDate, true); // replace for filter changes
  }, [selectedStop, selectedDate, updateUrlParams]);

  const handleDateChange = useCallback((date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      updateUrlParams(selectedStop, routeFilter, date, true); // replace for date changes
    }
  }, [selectedStop, routeFilter, updateUrlParams]);

  const dateString = format(selectedDate, 'yyyy-MM-dd');
  const isToday = format(new Date(), 'yyyy-MM-dd') === dateString;

  // Loading state when loading from URL
  if (loading || initialLoad) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const hasStation = !!selectedStop;

  return (
    <div className="flex-1 relative overflow-x-hidden bg-gradient-to-b from-metra-blue/5 via-background to-background">

      {/* Skyline - fixed at bottom, always visible */}
      <div className="fixed bottom-0 left-0 right-0 pointer-events-none">
        <ChicagoSkyline className={`w-full opacity-10 ${!hasStation ? 'animate-slide-up-only' : ''}`} />
      </div>

      {/* Hero section - always at top */}
      <div className={`flex flex-col items-center pt-24 pb-8 px-4 transition-all duration-500 ${
        hasStation ? 'pt-12 pb-4' : ''
      }`}>
        {/* Title */}
        <div className={`text-center mb-8 max-w-2xl ${!hasStation ? 'animate-fade-in-up' : ''}`}>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 md:whitespace-nowrap">
            {hasStation ? selectedStop.stop_name : 'Where are you departing from?'}
          </h1>
          <p className="text-lg text-muted-foreground">
            {hasStation
              ? `${isToday ? 'Today' : format(selectedDate, 'EEEE, MMMM d')}'s departures`
              : 'Search for any Metra station to see real-time departures'
            }
          </p>
        </div>

        {/* Search bar */}
        <div className={`w-full max-w-xl ${!hasStation ? 'animate-fade-in-up animation-delay-150' : ''}`}>
          <StationCommand
            onSelectStation={handleSelectStop}
            selectedStation={selectedStop}
            placeholder={hasStation ? 'Change station...' : 'Search stations...'}
          />
        </div>

        {/* Hint text */}
        <p className={`mt-6 text-sm text-muted-foreground/60 transition-all duration-300 -z-10 relative ${
          hasStation ? 'opacity-0 h-0 overflow-hidden' : 'opacity-100 animate-fade-in animation-delay-300'
        }`}>
          Try "Union Station", "Ogilvie", or "La Grange"
        </p>
      </div>

      {/* Results panel - only rendered when station selected */}
      {hasStation && (
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
              stopId={selectedStop.stop_id}
              date={dateString}
            />
            <DepartureBoard
              stopId={selectedStop.stop_id}
              routeFilter={routeFilter}
              date={dateString}
            />
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
