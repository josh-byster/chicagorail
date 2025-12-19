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

  // Load state from URL params on mount
  useEffect(() => {
    const stopId = searchParams.get('stop');
    const route = searchParams.get('route');
    const date = searchParams.get('date');

    if (route) {
      setRouteFilter(route);
    }

    if (date) {
      try {
        const parsedDate = parse(date, 'yyyy-MM-dd', new Date());
        setSelectedDate(parsedDate);
      } catch {
        // Invalid date, use today
      }
    }

    // Fetch stop data if stopId is in URL
    if (stopId && !selectedStop) {
      setLoading(true);
      api.getDepartures(stopId, undefined, date || format(new Date(), 'yyyy-MM-dd'))
        .then((response) => {
          setSelectedStop(response.stop);
        })
        .catch(() => {
          // Stop not found, clear the param
          const newParams = new URLSearchParams(searchParams);
          newParams.delete('stop');
          setSearchParams(newParams, { replace: true });
        })
        .finally(() => setLoading(false));
    }
  }, []); // Only run on mount

  // Update URL when state changes
  const updateUrlParams = useCallback((stop: Stop | null, route: string | undefined, date: Date) => {
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

    setSearchParams(params, { replace: true });
  }, [setSearchParams]);

  // Wrapper to update both state and URL
  const handleSelectStop = useCallback((stop: Stop | null) => {
    setSelectedStop(stop);
    setRouteFilter(undefined); // Reset route filter when changing station
    updateUrlParams(stop, undefined, selectedDate);
  }, [selectedDate, updateUrlParams]);

  const handleRouteFilterChange = useCallback((route: string | undefined) => {
    setRouteFilter(route);
    updateUrlParams(selectedStop, route, selectedDate);
  }, [selectedStop, selectedDate, updateUrlParams]);

  const handleDateChange = useCallback((date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      updateUrlParams(selectedStop, routeFilter, date);
    }
  }, [selectedStop, routeFilter, updateUrlParams]);

  const dateString = format(selectedDate, 'yyyy-MM-dd');
  const isToday = format(new Date(), 'yyyy-MM-dd') === dateString;

  // Loading state when loading from URL
  if (loading) {
    return (
      <div className="min-h-[calc(100vh-73px)] flex items-center justify-center">
        <p className="text-muted-foreground">Loading station...</p>
      </div>
    );
  }

  // Hero view when no station selected
  if (!selectedStop) {
    return (
      <div className="h-[calc(100vh-57px)] flex flex-col relative overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-metra-blue/5 via-background to-background" />

        {/* Main content - centered */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 relative z-10">
          <div className="text-center mb-8 max-w-2xl animate-fade-in-up">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 whitespace-nowrap">
              Where are you departing from?
            </h1>
            <p className="text-lg text-muted-foreground">
              Search for any Metra station to see real-time departures
            </p>
          </div>

          {/* Large search bar */}
          <div className="w-full max-w-xl animate-fade-in-up animation-delay-150">
            <StationCommand
              onSelectStation={handleSelectStop}
              selectedStation={selectedStop}
              placeholder="Search stations..."
            />
          </div>

          {/* Subtle hint */}
          <p className="mt-6 text-sm text-muted-foreground/60 animate-fade-in animation-delay-300 -z-10 relative">
            Try "Union Station", "Ogilvie", or "La Grange"
          </p>
        </div>

        {/* Skyline at bottom */}
        <div className="relative h-40 md:h-56 animate-slide-up animation-delay-200">
          <ChicagoSkyline className="absolute bottom-0 left-0 right-0 w-full opacity-10" />
        </div>
      </div>
    );
  }

  // Results view when station is selected
  return (
    <div className="min-h-[calc(100vh-73px)] bg-background">
      {/* Compact header with gradient accent */}
      <div className="border-b bg-gradient-to-r from-metra-blue/5 to-metra-orange/5">
        <div className="container mx-auto px-4 py-6 max-w-4xl">
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-2xl font-bold">{selectedStop.stop_name}</h2>
              <p className="text-sm text-muted-foreground">
                {isToday ? 'Today' : format(selectedDate, 'EEEE, MMMM d')}'s departures
              </p>
            </div>

            {/* Search bar to change station */}
            <StationCommand
              onSelectStation={handleSelectStop}
              selectedStation={selectedStop}
              placeholder="Change station..."
            />
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="container mx-auto px-4 py-6 max-w-4xl">
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
  );
}
