import { useParams, Link } from 'react-router-dom';
import { useTrainDetail } from '@/hooks/useTrains';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Clock, MapPin, AlertCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function TrainDetailPage() {
  const { tripId } = useParams<{ tripId: string }>();
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

  const departureTime = new Date(train.departure_time).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  const arrivalTime = new Date(train.arrival_time).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Link to="/">
        <Button variant="ghost" size="sm" className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to home
        </Button>
      </Link>

      <header className="mb-8">
        <h1 className="text-3xl font-bold">{train.line_name}</h1>
        <p className="text-muted-foreground mt-2">
          Train {train.train_number || tripId}
        </p>
      </header>

      <main className="space-y-6">
        {/* Trip Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Trip Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Departure</p>
                <div className="flex items-center gap-2 mt-1">
                  <Clock className="h-4 w-4" />
                  <span className="font-semibold">{departureTime}</span>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Arrival</p>
                <div className="flex items-center gap-2 mt-1">
                  <Clock className="h-4 w-4" />
                  <span className="font-semibold">{arrivalTime}</span>
                </div>
              </div>
            </div>

            {train.platform && (
              <div>
                <p className="text-sm text-muted-foreground">Platform</p>
                <div className="flex items-center gap-2 mt-1">
                  <MapPin className="h-4 w-4" />
                  <span className="font-semibold">{train.platform}</span>
                </div>
              </div>
            )}

            {train.delay_minutes > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Delayed</AlertTitle>
                <AlertDescription>
                  This train is running {train.delay_minutes} minutes late
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* All Stops */}
        <Card>
          <CardHeader>
            <CardTitle>All Stops ({train.stops?.length || 0})</CardTitle>
          </CardHeader>
          <CardContent>
            {train.stops && train.stops.length > 0 ? (
              <div className="space-y-2">
                {train.stops.map((stop, index) => (
                  <div
                    key={`${stop.station_id}-${stop.stop_sequence}`}
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-accent/50"
                  >
                    <div className="text-sm text-muted-foreground w-8">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{stop.station_id}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(stop.arrival_time).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    {stop.delay_minutes > 0 && (
                      <span className="text-sm text-orange-600">
                        +{stop.delay_minutes} min
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No stop information available
              </p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
