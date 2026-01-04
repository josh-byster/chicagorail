/**
 * Trips results component
 *
 * Displays direct trips between two stations with route filtering.
 */

import type { DirectTrip, Route } from '@chicagorail/shared';
import { TripCard } from './TripCard';
import { RouteFilterButtons } from './RouteFilterButtons';

interface TripsResultsProps {
  trips: DirectTrip[];
  filteredTrips: DirectTrip[];
  tripRoutes: Route[];
  isLoading: boolean;
  error: string | null;
  selectedRoute: string | undefined;
  onRouteFilterChange: (routeId: string | undefined) => void;
}

export function TripsResults({
  trips,
  filteredTrips,
  tripRoutes,
  isLoading,
  error,
  selectedRoute,
  onRouteFilterChange,
}: TripsResultsProps) {
  if (isLoading) {
    return (
      <div className="text-center py-8" role="status" aria-label="Finding trains">
        <p className="text-muted-foreground">Finding trains...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg"
        role="alert"
      >
        <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
      </div>
    );
  }

  if (trips.length === 0) {
    return (
      <div className="p-6 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
        <h3 className="font-semibold mb-2">No Direct Trains Found</h3>
        <p className="text-sm text-yellow-800 dark:text-yellow-200">
          There are no direct trains between these stations. You may need to transfer at a
          connection point.
        </p>
      </div>
    );
  }

  return (
    <>
      <RouteFilterButtons
        routes={tripRoutes}
        selectedRoute={selectedRoute}
        onFilterChange={onRouteFilterChange}
        suffix={
          filteredTrips[0]?.duration_minutes && (
            <span className="text-sm text-muted-foreground self-center ml-2">
              ~{filteredTrips[0].duration_minutes} min
            </span>
          )
        }
      />

      <div
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2"
        role="list"
        aria-label="Trip times"
      >
        {filteredTrips.map((trip) => (
          <TripCard key={`${trip.trip_id}-${trip.origin_departure}`} trip={trip} />
        ))}
      </div>
    </>
  );
}
