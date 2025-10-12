import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { TrainListItem } from './TrainListItem';
import { AlertCircle, Wifi, WifiOff } from 'lucide-react';
import type { Train } from '@metra/shared';

interface TrainListProps {
  trains?: Train[];
  isLoading: boolean;
  error: Error | null;
  isEmpty?: boolean;
}

export function TrainList({ trains, isLoading, error, isEmpty }: TrainListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (error) {
    const isOffline = !navigator.onLine;

    return (
      <Alert variant="destructive">
        {isOffline ? <WifiOff className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
        <AlertTitle>{isOffline ? 'No Connection' : 'Error'}</AlertTitle>
        <AlertDescription>
          {isOffline
            ? 'You appear to be offline. Showing cached data if available.'
            : error.message || 'Failed to load trains. Please try again.'}
        </AlertDescription>
      </Alert>
    );
  }

  if (isEmpty || !trains || trains.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>No Trains Found</AlertTitle>
        <AlertDescription>
          No upcoming trains found for this route. Try adjusting your search or check back later.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{trains.length} {trains.length === 1 ? 'train' : 'trains'} found</span>
        {navigator.onLine && (
          <div className="flex items-center gap-1">
            <Wifi className="h-3 w-3" />
            <span>Live updates</span>
          </div>
        )}
      </div>

      {trains.map((train) => (
        <TrainListItem key={train.trip_id} train={train} />
      ))}
    </div>
  );
}
