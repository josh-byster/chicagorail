import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Stop, Route } from '@/types/metra';

interface SearchResultsProps {
  selectedStation: Stop;
  routes: Route[];
  onRouteSelect: (route: Route) => void;
  onClearStation: () => void;
}

export function SearchResults({
  selectedStation,
  routes,
  onRouteSelect,
  onClearStation,
}: SearchResultsProps) {
  return (
    <div className="w-full space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <CardTitle>{selectedStation.stop_name}</CardTitle>
              <CardDescription>
                {routes.length} {routes.length === 1 ? 'route' : 'routes'} serving this station
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClearStation}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Clear station</span>
            </Button>
          </div>
        </CardHeader>
      </Card>

      <Separator />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {routes.map((route) => (
          <Card
            key={route.route_id}
            className="cursor-pointer transition-colors hover:bg-accent"
            onClick={() => onRouteSelect(route)}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div
                  className="h-4 w-4 rounded-full"
                  style={{ backgroundColor: `#${route.route_color}` }}
                />
                {route.route_short_name}
              </CardTitle>
              <CardDescription className="line-clamp-2">
                {route.route_long_name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" size="sm" className="w-full">
                View Schedule
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {routes.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              No routes found for this station.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
