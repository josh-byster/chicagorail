import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, ArrowRight, Clock } from 'lucide-react';
import { SavedRoute } from '@metra/shared';

export function SavedRouteCard({
  route,
  originStationName,
  destinationStationName,
  nextTrainTime,
  isLoading,
  isError,
  onClick,
  onDelete,
}: {
  route: SavedRoute;
  originStationName: string;
  destinationStationName: string;
  nextTrainTime?: string;
  isLoading?: boolean;
  isError?: boolean;
  onClick: () => void;
  onDelete: () => void;
}) {
  const formatTime = (timeString: string) => {
    // Convert "2025-10-12T17:32:00-05:00" to "5:32 PM"
    const date = new Date(timeString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <Card
      className="group hover:shadow-lg hover:border-primary/50 transition-all cursor-pointer relative overflow-hidden border-2"
      onClick={onClick}
    >
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 h-7 w-7 rounded-full opacity-0 group-hover:opacity-100 hover:bg-destructive hover:text-destructive-foreground transition-all z-10"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
      >
        <X className="h-4 w-4" />
      </Button>

      <div className="p-4 space-y-3">
        {/* Route Label */}
        <div className="pr-8">
          <h3 className="font-semibold text-lg text-foreground">
            {route.label}
          </h3>
        </div>

        {/* Station Names */}
        <div className="flex items-center gap-2 text-muted-foreground">
          <span className="text-sm font-medium truncate">
            {originStationName}
          </span>
          <ArrowRight className="h-4 w-4 flex-shrink-0" />
          <span className="text-sm font-medium truncate">
            {destinationStationName}
          </span>
        </div>

        {/* Next Train Time */}
        <div className="pt-2 border-t">
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4 animate-spin" />
              <span>Loading...</span>
            </div>
          ) : isError ? (
            <div className="text-sm text-destructive">
              Error loading train time
            </div>
          ) : nextTrainTime ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-muted-foreground">
                  Next train
                </span>
              </div>
              <span className="text-lg font-bold text-primary">
                {formatTime(nextTrainTime)}
              </span>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              No upcoming trains
            </div>
          )}
        </div>

        {/* Usage Count */}
        <div className="text-xs text-muted-foreground/70">
          Used {route.use_count} {route.use_count === 1 ? 'time' : 'times'}
        </div>
      </div>
    </Card>
  );
}
