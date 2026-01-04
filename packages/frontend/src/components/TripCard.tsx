import type { DirectTrip } from '@chicagorail/shared';
import { utils } from '@chicagorail/shared';

interface TripCardProps {
  trip: DirectTrip;
}

export function TripCard({ trip }: TripCardProps) {
  return (
    <div className="border rounded-lg px-3 py-2.5 hover:bg-accent transition-colors bg-background/50">
      <div className="flex items-center gap-1.5 justify-center mb-0.5">
        <div
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: `#${trip.route.route_color}` }}
        />
        <span className="font-semibold text-lg tabular-nums">
          {utils.formatTime(trip.origin_departure)}
        </span>
      </div>
      <div className="text-xs text-muted-foreground text-center">
        arr. {utils.formatTime(trip.destination_arrival)}
      </div>
    </div>
  );
}
