import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RouteCard } from './RouteCard';
import { Route } from '@/types/metra';

interface RouteGridProps {
  routes: Route[];
  onRouteSelect: (route: Route) => void;
}

export function RouteGrid({ routes, onRouteSelect }: RouteGridProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredRoutes = useMemo(() => {
    if (!searchTerm.trim()) return routes;

    const term = searchTerm.toLowerCase();
    return routes.filter(
      (route) =>
        route.route_short_name.toLowerCase().includes(term) ||
        route.route_long_name.toLowerCase().includes(term) ||
        route.route_id.toLowerCase().includes(term)
    );
  }, [routes, searchTerm]);

  return (
    <div className="w-full space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>All Metra Lines</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search routes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {filteredRoutes.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredRoutes.map((route) => (
            <RouteCard key={route.route_id} route={route} onSelect={onRouteSelect} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              No routes found matching "{searchTerm}"
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
