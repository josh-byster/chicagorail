/**
 * Line filter component
 *
 * Shows route filter buttons based on available routes at a station.
 * Reads route data from the departures cache to avoid redundant API calls.
 */

import { useRoutesFromArrivals, useRoutesFromDepartures } from '@/hooks/useRoutes';
import { RouteFilterButtons } from './RouteFilterButtons';

interface LineFilterProps {
  selectedRoute: string | undefined;
  onFilterChange: (routeId: string | undefined) => void;
  stopId?: string;
  date?: string;
  /** Trailing content, shown even before routes are known */
  suffix?: React.ReactNode;
  /** Which cache to read the available lines from */
  mode?: 'departures' | 'arrivals';
}

export function LineFilter({
  selectedRoute,
  onFilterChange,
  stopId,
  date,
  suffix,
  mode = 'departures',
}: LineFilterProps) {
  const fromDepartures = useRoutesFromDepartures(mode === 'departures' ? (stopId ?? null) : null, date);
  const fromArrivals = useRoutesFromArrivals(mode === 'arrivals' ? (stopId ?? null) : null, date);
  const { data: routes, isLoading } = mode === 'arrivals' ? fromArrivals : fromDepartures;

  if (isLoading || routes.length === 0) {
    return suffix ? <div className="flex flex-wrap gap-1.5">{suffix}</div> : null;
  }

  return (
    <RouteFilterButtons
      routes={routes}
      selectedRoute={selectedRoute}
      onFilterChange={onFilterChange}
      suffix={suffix}
    />
  );
}
