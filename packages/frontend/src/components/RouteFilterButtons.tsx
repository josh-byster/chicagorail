import type { Route } from '@chicagorail/shared';
import { Chip } from './Chip';

interface RouteFilterButtonsProps {
  routes: Route[];
  selectedRoute: string | undefined;
  onFilterChange: (routeId: string | undefined) => void;
  /** Label for the unfiltered state */
  allLabel?: string;
  /** Trailing content (e.g. an "add destination" chip or a result count) */
  suffix?: React.ReactNode;
}

export function RouteFilterButtons({
  routes,
  selectedRoute,
  onFilterChange,
  allLabel = 'All lines',
  suffix,
}: RouteFilterButtonsProps) {
  if (routes.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      <Chip selected={!selectedRoute} onClick={() => onFilterChange(undefined)}>
        {allLabel}
      </Chip>
      {routes.map((route) => (
        <Chip
          key={route.route_id}
          selected={selectedRoute === route.route_id}
          onClick={() => onFilterChange(route.route_id)}
        >
          <span
            className="size-1.5 rounded-[2px]"
            style={{ backgroundColor: `#${route.route_color}` }}
            aria-hidden="true"
          />
          {route.route_short_name}
        </Chip>
      ))}
      {suffix}
    </div>
  );
}
