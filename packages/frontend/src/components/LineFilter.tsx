import { useRoutesFromDepartures } from '../hooks/useRoutes';

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
    <div className="flex gap-2 overflow-x-auto py-1">
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
        const bgColor = `#${route.route_color || '000000'}`;
        const textColor = `#${route.route_text_color || 'FFFFFF'}`;

        return (
          <button
            key={route.route_id}
            className={`px-3 py-1 rounded-full text-sm whitespace-nowrap transition-all ${
              isSelected ? 'ring-2 ring-offset-2 ring-primary' : 'opacity-80 hover:opacity-100'
            }`}
            style={{
              backgroundColor: bgColor,
              color: textColor,
            }}
            onClick={() => onFilterChange(route.route_id)}
          >
            {route.route_short_name}
          </button>
        );
      })}
    </div>
  );
}
