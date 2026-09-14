import { useEffect, useMemo, useState } from 'react';
import { Check, MapPin, Search } from 'lucide-react';
import { Route, Stop } from '../types/metra';
import { MetraService } from '../services/metraService';
import { Button } from '@/components/ui/button';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { Skeleton } from '@/components/ui/skeleton';

interface RouteListProps {
  onRouteSelect: (route: Route, station?: Stop) => void;
  selectedRoute: Route | null;
}

const RouteList = ({ onRouteSelect, selectedRoute }: RouteListProps) => {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [routeStops, setRouteStops] = useState<Record<string, Stop[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const loadRoutes = async () => {
    try {
      setLoading(true);
      setError(null);
      const service = MetraService.getInstance();
      const [loadedRoutes, loadedStops] = await Promise.all([
        service.getRoutes(),
        service.getRouteStops(),
      ]);
      setRoutes(loadedRoutes);
      setRouteStops(loadedStops);
    } catch (loadError) {
      console.error('Error loading routes:', loadError);
      setError('We couldn’t load the Metra lines and stations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadRoutes(); }, []);

  const query = searchQuery.trim().toLowerCase();
  const matchingStations = (route: Route) => {
    if (!query) return [];
    return (routeStops[route.route_id] || []).filter((stop) => stop.stop_name.toLowerCase().includes(query));
  };

  const filteredRoutes = useMemo(() => {
    if (!query) return routes;
    return routes.filter((route) => {
      const lineMatch = `${route.route_long_name} ${route.route_short_name}`.toLowerCase().includes(query);
      return lineMatch || matchingStations(route).length > 0;
    });
  }, [query, routeStops, routes]);

  if (loading) {
    return <div className="route-loading" aria-label="Loading Metra lines">{[0, 1, 2, 3, 4].map((item) => <Skeleton key={item} />)}</div>;
  }

  if (error) {
    return <div className="inline-error" role="alert"><p>{error}</p><Button variant="outline" size="sm" onClick={loadRoutes}>Try again</Button></div>;
  }

  return (
    <div>
      <InputGroup className="h-10">
        <InputGroupAddon><Search /></InputGroupAddon>
        <InputGroupInput
          type="search"
          aria-label="Search by line or station"
          placeholder="Line or station"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
        />
      </InputGroup>
      <p className="search-help"><MapPin /> Don’t know your line? Enter a station.</p>

      <div className="route-list">
        {filteredRoutes.map((route) => {
          const selected = selectedRoute?.route_id === route.route_id;
          const stationMatches = matchingStations(route);
          return (
            <Button
              key={route.route_id}
              type="button"
              variant={selected ? 'secondary' : 'ghost'}
              onClick={() => onRouteSelect(route, stationMatches[0])}
              className="route-row h-auto w-full justify-start"
              aria-pressed={selected}
            >
              <span className="route-swatch" style={{ backgroundColor: `#${route.route_color}` }} />
              <span className="route-copy">
                <strong>{route.route_long_name}</strong>
                <small>{stationMatches.length > 0 ? `Stops at ${stationMatches.slice(0, 2).map((stop) => stop.stop_name).join(' & ')}` : `${route.route_short_name} line`}</small>
              </span>
              {selected ? <Check data-icon="inline-end" className="selected-check" /> : <span className="row-arrow">›</span>}
            </Button>
          );
        })}

        {filteredRoutes.length === 0 && (
          <div className="no-results">
            <p>No lines or stations match “{searchQuery}”.</p>
            <Button variant="link" size="sm" onClick={() => setSearchQuery('')}>Clear search</Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RouteList;
