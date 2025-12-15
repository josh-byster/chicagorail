import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import type { Route } from '@chicagorail/shared';

interface LineFilterProps {
  onFilterChange: (routeId: string | undefined) => void;
  stopId?: string;
  date?: string;
}

export function LineFilter({ onFilterChange, stopId, date }: LineFilterProps) {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<string | undefined>();

  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        if (stopId) {
          // Fetch departures to get unique routes that have service
          const result = await api.getDepartures(stopId, undefined, date);
          const uniqueRoutes = new Map<string, Route>();
          result.departures.forEach(dep => {
            if (!uniqueRoutes.has(dep.route.route_id)) {
              uniqueRoutes.set(dep.route.route_id, dep.route);
            }
          });
          setRoutes(Array.from(uniqueRoutes.values()));
        } else {
          const result = await api.getRoutes();
          setRoutes(result.routes);
        }
      } catch (error) {
        console.error('Failed to fetch routes:', error);
      }
    };

    fetchRoutes();
  }, [stopId, date]);

  const handleFilterChange = (routeId: string | undefined) => {
    setSelectedRoute(routeId);
    onFilterChange(routeId);
  };

  // Reset filter when routes change
  useEffect(() => {
    setSelectedRoute(undefined);
    onFilterChange(undefined);
  }, [stopId, date]);

  if (routes.length === 0) {
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
        onClick={() => handleFilterChange(undefined)}
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
            onClick={() => handleFilterChange(route.route_id)}
          >
            {route.route_short_name}
          </button>
        );
      })}
    </div>
  );
}
