import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
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
      <div className="space-y-4">
        <Skeleton className="h-28 w-full rounded-lg" />
        <Skeleton className="h-28 w-full rounded-lg" />
        <Skeleton className="h-28 w-full rounded-lg" />
      </div>
    );
  }

  if (error) {
    const isOffline = !navigator.onLine;

    return (
      <Alert variant="destructive" className="border-2">
        {isOffline ? <WifiOff className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
        <AlertTitle className="text-base">{isOffline ? 'No Connection' : 'Error'}</AlertTitle>
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
      <Alert className="border-2">
        <AlertCircle className="h-5 w-5" />
        <AlertTitle className="text-base">No Trains Found</AlertTitle>
        <AlertDescription>
          No upcoming trains found for this route. Try adjusting your search or check back later.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-base px-3 py-1">
            {trains.length} {trains.length === 1 ? 'train' : 'trains'}
          </Badge>
          {navigator.onLine && (
            <div className="flex items-center gap-1.5 text-sm text-green-600">
              <Wifi className="h-4 w-4" />
              <span className="font-medium">Live updates</span>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {trains.map((train) => (
          <TrainListItem key={train.trip_id} train={train} />
        ))}
      </div>
    </div>
  );
}
