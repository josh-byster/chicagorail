import { useDepartures } from '../hooks/useDepartures';
import { utils } from '@chicagorail/shared';

interface DepartureBoardProps {
  stopId: string | null;
  routeFilter?: string;
  date?: string;
}

export function DepartureBoard({ stopId, routeFilter, date }: DepartureBoardProps) {
  const { departures, loading } = useDepartures(stopId, routeFilter, date);

  if (!stopId) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Search for a station to see departures
      </div>
    );
  }

  if (loading && !departures.length) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
      </div>
    );
  }

  if (departures.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No departures found for this station
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
      {departures.map((departure, idx) => (
        <div
          key={`${departure.trip_id}-${idx}`}
          className="border rounded-lg px-3 py-2.5 hover:bg-accent transition-colors bg-background/50"
        >
          <div className="flex items-center gap-1.5 justify-center mb-0.5">
            <div
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: `#${departure.route.route_color}` }}
            />
            <span className="font-semibold text-lg tabular-nums">
              {utils.formatTime(departure.departure_time)}
            </span>
          </div>
          <div className="text-xs text-muted-foreground text-center truncate">
            to {departure.trip_headsign}
          </div>
        </div>
      ))}
    </div>
  );
}
