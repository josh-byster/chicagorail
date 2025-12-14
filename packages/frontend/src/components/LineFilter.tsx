import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import type { Route } from '@chicagorail/shared';

interface LineFilterProps {
  onFilterChange: (routeId: string | undefined) => void;
}

export function LineFilter({ onFilterChange }: LineFilterProps) {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<string | undefined>();

  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        const result = await api.getRoutes();
        setRoutes(result.routes);
      } catch (error) {
        console.error('Failed to fetch routes:', error);
      }
    };

    fetchRoutes();
  }, []);

  const handleFilterChange = (routeId: string | undefined) => {
    setSelectedRoute(routeId);
    onFilterChange(routeId);
  };

  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      <button
        className={`px-3 py-1 rounded-full text-sm whitespace-nowrap transition-colors ${
          !selectedRoute
            ? 'bg-primary text-primary-foreground'
            : 'bg-secondary hover:bg-secondary/80'
        }`}
        onClick={() => handleFilterChange(undefined)}
      >
        All Lines
      </button>
      {routes.map((route) => (
        <button
          key={route.route_id}
          className={`px-3 py-1 rounded-full text-sm whitespace-nowrap transition-colors ${
            selectedRoute === route.route_id
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary hover:bg-secondary/80'
          }`}
          onClick={() => handleFilterChange(route.route_id)}
        >
          {route.route_short_name}
        </button>
      ))}
    </div>
  );
}
