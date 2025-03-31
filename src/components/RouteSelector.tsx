import React, { useEffect, useState } from 'react';
import { FormControl, InputLabel, MenuItem, Select, SelectChangeEvent } from '@mui/material';
import { Route } from '../types/metra';
import { MetraService } from '../services/metraService';

interface RouteSelectorProps {
  onRouteSelect: (routeId: string) => void;
}

export const RouteSelector: React.FC<RouteSelectorProps> = ({ onRouteSelect }) => {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadRoutes = async () => {
      try {
        setLoading(true);
        const metraService = MetraService.getInstance();
        const routes = await metraService.getRoutes();
        setRoutes(routes);
      } catch (error) {
        console.error('Error loading routes:', error);
        setError('Failed to load routes');
      } finally {
        setLoading(false);
      }
    };

    loadRoutes();
  }, []);

  const handleRouteChange = (event: SelectChangeEvent<string>) => {
    const routeId = event.target.value;
    setSelectedRoute(routeId);
    onRouteSelect(routeId);
  };

  if (loading) {
    return <div>Loading routes...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <FormControl fullWidth>
      <InputLabel>Select Route</InputLabel>
      <Select
        value={selectedRoute}
        label="Select Route"
        onChange={handleRouteChange}
      >
        {routes.map((route) => (
          <MenuItem key={route.route_id} value={route.route_id}>
            {route.route_long_name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}; 