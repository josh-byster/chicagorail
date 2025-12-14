import { utils } from '@chicagorail/shared';
import type { Departure } from '@chicagorail/shared';

interface DepartureRowProps {
  departure: Departure;
}

export function DepartureRow({ departure }: DepartureRowProps) {
  const { route, trip_headsign, departure_time } = departure;

  return (
    <div className="flex items-center justify-between py-3 px-4 border-b hover:bg-accent/50">
      <div className="flex items-center gap-3 flex-1">
        <div
          className="w-1 h-12 rounded"
          style={{ backgroundColor: `#${route.route_color}` }}
        />
        <div>
          <div className="font-medium">{route.route_short_name}</div>
          <div className="text-sm text-muted-foreground">
            {trip_headsign}
          </div>
        </div>
      </div>

      <div className="text-right">
        <div className="font-bold text-lg">
          {utils.getRelativeTime(departure_time)}
        </div>
        <div className="text-xs text-muted-foreground">
          {utils.formatTime(departure_time)}
        </div>
      </div>
    </div>
  );
}
