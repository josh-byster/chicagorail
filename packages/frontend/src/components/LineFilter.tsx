/**
 * Line filter component
 *
 * Shows route filter buttons based on available routes at a station.
 * Reads route data from the departures cache to avoid redundant API calls.
 */

import { useRoutesFromDepartures } from '@/hooks/useRoutes';
import { RouteFilterButtons } from './RouteFilterButtons';

interface LineFilterProps {
  selectedRoute: string | undefined;
  onFilterChange: (routeId: string | undefined) => void;
  stopId?: string;
  date?: string;
}

export function LineFilter({ selectedRoute, onFilterChange, stopId, date }: LineFilterProps) {
  const { data: routes, isLoading } = useRoutesFromDepartures(stopId ?? null, date);

  if (isLoading || routes.length === 0) {
    return null;
  }

  return (
    <RouteFilterButtons routes={routes} selectedRoute={selectedRoute} onFilterChange={onFilterChange} />
  );
}
