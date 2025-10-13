import { useParams, Link, useSearchParams } from 'react-router-dom';
import { useTrainDetail } from '@/hooks/useTrains';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Clock,
  MapPin,
  AlertCircle,
  ArrowLeft,
  Train as TrainIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function TrainDetailPage() {
  const { tripId } = useParams<{ tripId: string }>();
  const [searchParams] = useSearchParams();
  const originStationId = searchParams.get('origin');
  const destinationStationId = searchParams.get('destination');
  const { data: train, isLoading, error } = useTrainDetail(tripId || '');

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Skeleton className="h-8 w-32 mb-4" />
        <Skeleton className="h-10 w-64 mb-8" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !train) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Link to="/">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to home
          </Button>
        </Link>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error?.message || 'Train not found'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Find user's specific origin and destination stops if provided
  const originStop = originStationId
    ? train.stops?.find((stop) => stop.station_id === originStationId)
    : null;
  const destinationStop = destinationStationId
    ? train.stops?.find((stop) => stop.station_id === destinationStationId)
    : null;

  // Use user's journey times if available, otherwise use train's full journey
  const departureTime = new Date(
    originStop?.departure_time || train.departure_time
  ).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  const arrivalTime = new Date(
    destinationStop?.arrival_time || train.arrival_time
  ).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  const getStatusVariant = (
    status: string
  ): 'success' | 'warning' | 'destructive' | 'secondary' => {
    switch (status) {
      case 'on_time':
        return 'success';
      case 'delayed':
        return 'warning';
      case 'cancelled':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Link to="/">
          <Button variant="ghost" className="mb-6 hover:bg-accent">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to home
          </Button>
        </Link>

        <header className="mb-8">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary rounded-lg">
                <TrainIcon className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">{train.line_name}</h1>
                <p className="text-muted-foreground mt-1">
                  Train {train.train_number || tripId}
                </p>
              </div>
            </div>
            <Badge
              variant={getStatusVariant(train.status)}
              className="text-base px-4 py-1.5"
            >
              {train.status === 'on_time'
                ? 'On Time'
                : train.status === 'delayed'
                  ? `Delayed ${train.delay_minutes} min`
                  : train.status}
            </Badge>
          </div>
        </header>

        <main className="space-y-6">
          {/* Trip Overview */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-xl">
                {originStop && destinationStop
                  ? 'Your Journey'
                  : 'Trip Overview'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Departure
                  </p>
                  <div className="flex items-center gap-2.5">
                    <Clock className="h-5 w-5 text-primary" />
                    <span className="font-bold text-2xl">{departureTime}</span>
                  </div>
                  {originStop && (
                    <div className="flex items-center gap-2 mt-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        {originStop.station_name || originStop.station_id}
                      </span>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Arrival
                  </p>
                  <div className="flex items-center gap-2.5">
                    <Clock className="h-5 w-5 text-primary" />
                    <span className="font-bold text-2xl">{arrivalTime}</span>
                  </div>
                  {destinationStop && (
                    <div className="flex items-center gap-2 mt-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        {destinationStop.station_name ||
                          destinationStop.station_id}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {train.platform && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      Platform
                    </p>
                    <div className="flex items-center gap-2.5">
                      <MapPin className="h-5 w-5 text-primary" />
                      <span className="font-semibold text-lg">
                        {train.platform}
                      </span>
                    </div>
                  </div>
                </>
              )}

              {train.delay_minutes > 0 && (
                <>
                  <Separator />
                  <Alert variant="destructive" className="border-2">
                    <AlertCircle className="h-5 w-5" />
                    <AlertTitle className="text-base">Delayed</AlertTitle>
                    <AlertDescription>
                      This train is running {train.delay_minutes} minutes late
                    </AlertDescription>
                  </Alert>
                </>
              )}
            </CardContent>
          </Card>

          {/* All Stops */}
          <Card className="border-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-xl">All Stops</CardTitle>
              <Badge variant="secondary" className="text-base px-3 py-1">
                {train.stops?.length || 0} stops
              </Badge>
            </CardHeader>
            <CardContent>
              {train.stops && train.stops.length > 0 ? (
                <div className="space-y-1">
                  {train.stops.map((stop, index) => {
                    const isOrigin =
                      originStationId && stop.station_id === originStationId;
                    const isDestination =
                      destinationStationId &&
                      stop.station_id === destinationStationId;
                    const isUserJourney = isOrigin || isDestination;

                    return (
                      <div
                        key={`${stop.station_id}-${stop.stop_sequence}`}
                        className={`flex items-center gap-4 p-4 rounded-lg transition-colors ${
                          isUserJourney
                            ? 'bg-primary/10 border-2 border-primary/30 hover:bg-primary/15'
                            : 'hover:bg-accent/50'
                        }`}
                      >
                        <div
                          className={`flex items-center justify-center w-8 h-8 rounded-full font-semibold text-sm ${
                            isUserJourney
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-primary/10 text-primary'
                          }`}
                        >
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p
                              className={`font-semibold text-base ${isUserJourney ? 'text-foreground' : ''}`}
                            >
                              {stop.station_name || stop.station_id}
                            </p>
                            {isOrigin && (
                              <Badge variant="default" className="text-xs">
                                Your Origin
                              </Badge>
                            )}
                            {isDestination && (
                              <Badge variant="default" className="text-xs">
                                Your Destination
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {new Date(stop.arrival_time).toLocaleTimeString(
                              'en-US',
                              {
                                hour: 'numeric',
                                minute: '2-digit',
                              }
                            )}
                          </p>
                        </div>
                        {stop.delay_minutes > 0 && (
                          <Badge variant="warning" className="flex-shrink-0">
                            +{stop.delay_minutes} min
                          </Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-12">
                  <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="font-medium">No stop information available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
