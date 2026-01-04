import type { Route } from '@chicagorail/shared';

interface RouteFilterButtonsProps {
  routes: Route[];
  selectedRoute: string | undefined;
  onFilterChange: (routeId: string | undefined) => void;
  /** Optional suffix content (e.g., duration display) */
  suffix?: React.ReactNode;
}

export function RouteFilterButtons({
  routes,
  selectedRoute,
  onFilterChange,
  suffix,
}: RouteFilterButtonsProps) {
  if (routes.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2 mb-3">
      <button
        className={`px-3 py-1 rounded-full text-sm whitespace-nowrap transition-colors ${
          !selectedRoute
            ? 'bg-primary text-primary-foreground'
            : 'bg-secondary hover:bg-secondary/80'
        }`}
        onClick={() => onFilterChange(undefined)}
      >
        All Lines
      </button>
      {routes.map((route) => {
        const isSelected = selectedRoute === route.route_id;
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
            onClick={() => onFilterChange(route.route_id)}
          >
            {route.route_short_name}
          </button>
        );
      })}
      {suffix}
    </div>
  );
}
