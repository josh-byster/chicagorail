import { useState } from 'react';
import { ChevronDown, ChevronUp, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TripDetails } from './TripDetails';
import { TripWithStops } from '@/types/metra';

interface TripCardProps {
  trip: TripWithStops;
  selectedStopId?: string | null;
}

export function TripCard({ trip, selectedStopId }: TripCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Get first and last stop times
  const firstStop = trip.stopTimes[0];
  const lastStop = trip.stopTimes[trip.stopTimes.length - 1];

  // Calculate trip duration in minutes
  const getDuration = () => {
    const [startHours, startMinutes] = firstStop.departure_time.split(':').map(Number);
    const [endHours, endMinutes] = lastStop.arrival_time.split(':').map(Number);

    const startTotalMinutes = startHours * 60 + startMinutes;
    const endTotalMinutes = endHours * 60 + endMinutes;

    return endTotalMinutes - startTotalMinutes;
  };

  const duration = getDuration();

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-lg font-semibold">
                {firstStop.departure_time.substring(0, 5)}
              </span>
              <span className="text-muted-foreground">→</span>
              <span className="text-sm text-muted-foreground">
                {trip.trip_headsign}
              </span>
            </div>
            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{duration} min</span>
              <span>•</span>
              <span>{trip.stopTimes.length} stops</span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-4 w-4 mr-1" />
                Hide
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-1" />
                View
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent className="pt-0">
          <TripDetails stopTimes={trip.stopTimes} selectedStopId={selectedStopId} />
        </CardContent>
      )}
    </Card>
  );
}
