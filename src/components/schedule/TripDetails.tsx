import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { StopTimeWithStop } from '@/types/metra';

interface TripDetailsProps {
  stopTimes: StopTimeWithStop[];
  selectedStopId?: string | null;
}

export function TripDetails({ stopTimes, selectedStopId }: TripDetailsProps) {
  return (
    <div className="space-y-2 pt-4">
      <Separator />
      <div className="space-y-1">
        {stopTimes.map((stopTime, index) => {
          const isSelected = selectedStopId && stopTime.stop_id === selectedStopId;

          return (
            <div
              key={`${stopTime.stop_id}-${stopTime.stop_sequence}`}
              className={cn(
                'flex items-center justify-between rounded-md px-3 py-2 text-sm transition-colors',
                isSelected && 'bg-primary/10 font-medium'
              )}
            >
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-8">
                  {stopTime.stop_sequence}.
                </span>
                <span className={cn(isSelected && 'font-semibold')}>
                  {stopTime.stopName}
                </span>
                {isSelected && (
                  <Badge variant="default" className="text-xs">
                    Selected
                  </Badge>
                )}
              </div>
              <span className="font-mono text-xs">
                {stopTime.arrival_time.substring(0, 5)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
