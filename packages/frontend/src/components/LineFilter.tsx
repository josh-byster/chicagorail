import { useRoutesFromDepartures } from '../hooks/useRoutes';
import { RouteFilterButtons } from './RouteFilterButtons';

interface LineFilterProps {
  selectedRoute: string | undefined;
  onFilterChange: (routeId: string | undefined) => void;
  stopId?: string;
  date?: string;
}

export function LineFilter({ selectedRoute, onFilterChange, stopId, date }: LineFilterProps) {
  const { routes, loading } = useRoutesFromDepartures(stopId ?? null, date);

  if (loading || routes.length === 0) {
    return null;
  }

  return (
    <RouteFilterButtons
      routes={routes}
      selectedRoute={selectedRoute}
      onFilterChange={onFilterChange}
    />
  );
}
