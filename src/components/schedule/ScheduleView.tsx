import { useState, useEffect, useMemo } from 'react';
import { ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { TripCard } from './TripCard';
import { api } from '@/lib/api';
import { Route, TripWithStops } from '@/types/metra';

interface ScheduleViewProps {
  route: Route;
  selectedDate: Date;
  selectedStopId?: string | null;
  onBack: () => void;
}

export function ScheduleView({
  route,
  selectedDate,
  selectedStopId,
  onBack,
}: ScheduleViewProps) {
  const [trips, setTrips] = useState<TripWithStops[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load trips when route or date changes
  useEffect(() => {
    const loadTrips = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await api.getTrips(route.route_id, selectedDate);
        setTrips(data);
      } catch (err) {
        console.error('Error loading trips:', err);
        setError('Failed to load schedule. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    loadTrips();
  }, [route.route_id, selectedDate]);

  // Separate trips by direction
  const { inboundTrips, outboundTrips } = useMemo(() => {
    const inbound = trips
      .filter((trip) => trip.direction_id === 0)
      .sort((a, b) => {
        const aTime = a.stopTimes[0]?.departure_time || '';
        const bTime = b.stopTimes[0]?.departure_time || '';
        return aTime.localeCompare(bTime);
      });

    const outbound = trips
      .filter((trip) => trip.direction_id === 1)
      .sort((a, b) => {
        const aTime = a.stopTimes[0]?.departure_time || '';
        const bTime = b.stopTimes[0]?.departure_time || '';
        return aTime.localeCompare(bTime);
      });

    return { inboundTrips: inbound, outboundTrips: outbound };
  }, [trips]);

  return (
    <div className="w-full space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back</span>
            </Button>
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2">
                <div
                  className="h-4 w-4 rounded-full"
                  style={{ backgroundColor: `#${route.route_color}` }}
                />
                {route.route_long_name}
              </CardTitle>
              <CardDescription>
                Schedule for {format(selectedDate, 'MMMM d, yyyy')}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {isLoading && (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      )}

      {error && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {!isLoading && !error && trips.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              No trips found for this date.
            </p>
          </CardContent>
        </Card>
      )}

      {!isLoading && !error && trips.length > 0 && (
        <Tabs defaultValue="inbound" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="inbound">
              Inbound ({inboundTrips.length})
            </TabsTrigger>
            <TabsTrigger value="outbound">
              Outbound ({outboundTrips.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="inbound" className="space-y-3 mt-4">
            {inboundTrips.length > 0 ? (
              inboundTrips.map((trip) => (
                <TripCard
                  key={trip.trip_id}
                  trip={trip}
                  selectedStopId={selectedStopId}
                />
              ))
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground">
                    No inbound trips for this date.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="outbound" className="space-y-3 mt-4">
            {outboundTrips.length > 0 ? (
              outboundTrips.map((trip) => (
                <TripCard
                  key={trip.trip_id}
                  trip={trip}
                  selectedStopId={selectedStopId}
                />
              ))
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground">
                    No outbound trips for this date.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
