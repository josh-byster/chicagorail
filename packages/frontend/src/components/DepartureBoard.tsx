/**
 * Departure board component
 *
 * Displays a grid of upcoming departures from a station.
 * Uses auto-refresh to keep departures current.
 */

import { useDepartures } from '@/hooks/useDepartures';
import { TimeCard } from './TimeCard';

interface DepartureBoardProps {
  stopId: string | null;
  routeFilter?: string;
  date?: string;
}

export function DepartureBoard({ stopId, routeFilter, date }: DepartureBoardProps) {
  const {
    data: { departures },
    isLoading,
    isError,
    error,
  } = useDepartures(stopId, { routeId: routeFilter, date });

  if (!stopId) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Search for a station to see departures
      </div>
    );
  }

  if (isLoading && departures.length === 0) {
    return (
      <div className="text-center py-12" role="status" aria-label="Loading departures">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
      </div>
    );
  }

  if (isError) {
    return (
      <div
        className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg"
        role="alert"
      >
        <p className="text-sm text-red-800 dark:text-red-200">
          {error || 'Failed to load departures. Please try again.'}
        </p>
      </div>
    );
  }

  if (departures.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No departures found for this station
      </div>
    );
  }

  return (
    <div
      className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2"
      role="list"
      aria-label="Departure times"
    >
      {departures.map((departure) => (
        <TimeCard
          key={`${departure.trip_id}-${departure.departure_time}`}
          time={departure.departure_time}
          routeColor={departure.route.route_color}
          subtitle={<>to {departure.trip_headsign}</>}
        />
      ))}
    </div>
  );
}
