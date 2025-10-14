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

export function TrainList({
  trains,
  isLoading,
  error,
  isEmpty,
}: TrainListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4 animate-fade-in animated">
        <Skeleton className="h-28 w-full rounded-lg animate-pulse" />
        <Skeleton className="h-28 w-full rounded-lg animate-pulse animate-delay-100" />
        <Skeleton className="h-28 w-full rounded-lg animate-pulse animate-delay-200" />
      </div>
    );
  }

  if (error) {
    const isOffline = !navigator.onLine;

    return (
      <Alert
        variant="destructive"
        className="border-2 animate-fade-in-up animated"
      >
        {isOffline ? (
          <WifiOff className="h-5 w-5 animate-fade-in" />
        ) : (
          <AlertCircle className="h-5 w-5 animate-fade-in" />
        )}
        <AlertTitle className="text-base animate-fade-in">
          {isOffline ? 'No Connection' : 'Error'}
        </AlertTitle>
        <AlertDescription className="animate-fade-in">
          {isOffline
            ? 'You appear to be offline. Showing cached data if available.'
            : error.message || 'Failed to load trains. Please try again.'}
        </AlertDescription>
      </Alert>
    );
  }

  if (isEmpty || !trains || trains.length === 0) {
    return (
      <Alert className="border-2 animate-fade-in-up animated">
        <AlertCircle className="h-5 w-5 animate-fade-in" />
        <AlertTitle className="text-base animate-fade-in">
          No Trains Found
        </AlertTitle>
        <AlertDescription className="animate-fade-in">
          No upcoming trains found for this route. Try adjusting your search or
          check back later.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in animated">
      <div className="flex items-center justify-between px-1 animate-slide-in-left">
        <div className="flex items-center gap-2">
          <Badge
            variant="secondary"
            className="text-base px-3 py-1 animate-scale-in"
          >
            {trains.length} {trains.length === 1 ? 'train' : 'trains'}
          </Badge>
          {navigator.onLine && (
            <div className="flex items-center gap-1.5 text-sm text-green-600 animate-fade-in">
              <Wifi className="h-4 w-4 animate-fade-in" />
              <span className="font-medium animate-fade-in">Live updates</span>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {trains.map((train, index) => (
          <div
            key={train.trip_id}
            className={`animate-fade-in-up ${index > 0 ? `animate-delay-${Math.min(index * 100, 500)}` : ''}`}
          >
            <TrainListItem train={train} />
          </div>
        ))}
      </div>
    </div>
  );
}
