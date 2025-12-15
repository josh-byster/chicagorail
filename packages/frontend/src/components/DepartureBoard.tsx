import { useDepartures } from '../hooks/useDepartures';
import { DepartureRow } from './DepartureRow';

interface DepartureBoardProps {
  stopId: string | null;
  routeFilter?: string;
  date?: string;
}

export function DepartureBoard({ stopId, routeFilter, date }: DepartureBoardProps) {
  const { stop, departures, loading } = useDepartures(stopId, routeFilter, date);

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

  return (
    <div className="space-y-4">
      {stop && (
        <div className="border-b pb-4">
          <h2 className="text-2xl font-bold">{stop.stop_name}</h2>
          {stop.stop_desc && (
            <p className="text-sm text-muted-foreground">{stop.stop_desc}</p>
          )}
        </div>
      )}

      {departures.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No departures found for this station
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          {departures.map((departure, idx) => (
            <DepartureRow key={`${departure.trip_id}-${idx}`} departure={departure} />
          ))}
        </div>
      )}
    </div>
  );
}
