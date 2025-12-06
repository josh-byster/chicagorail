import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Route } from '@/types/metra';

interface RouteCardProps {
  route: Route;
  onSelect: (route: Route) => void;
}

export function RouteCard({ route, onSelect }: RouteCardProps) {
  return (
    <Card
      className="cursor-pointer transition-all hover:shadow-md hover:scale-[1.02]"
      onClick={() => onSelect(route)}
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div
            className="h-5 w-5 rounded-full border-2 border-white shadow-sm"
            style={{ backgroundColor: `#${route.route_color}` }}
          />
          {route.route_short_name}
        </CardTitle>
        <CardDescription className="line-clamp-1">
          {route.route_long_name}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button variant="outline" size="sm" className="w-full">
          View Schedule
        </Button>
      </CardContent>
    </Card>
  );
}
