/**
 * Departure board - trains leaving a station
 */

import { useDepartures } from '@/hooks/useDepartures';
import { ScheduleBoard, type BoardRow } from './ScheduleBoard';

interface DepartureBoardProps {
  stopId: string | null;
  routeFilter?: string;
  date?: string;
  /** Trains are shown as scheduled for this day, not as "next N from now" */
  isToday?: boolean;
  contextSearch?: string;
}

export function DepartureBoard({
  stopId,
  routeFilter,
  date,
  isToday = true,
  contextSearch,
}: DepartureBoardProps) {
  const {
    data: { departures },
    isLoading,
    isError,
    error,
  } = useDepartures(stopId, { routeId: routeFilter, date });

  const rows: BoardRow[] = departures.map((departure) => ({
    tripId: departure.trip_id,
    time: departure.departure_time,
    route: departure.route,
    place: departure.trip_headsign,
    realtime: departure.realtime,
  }));

  return (
    <ScheduleBoard
      rows={rows}
      timeHeading="Departs"
      placeHeading="Destination"
      isLoading={isLoading}
      isError={isError}
      error={error}
      emptyMessage="No more departures from this station today"
      isToday={isToday}
      contextSearch={contextSearch}
    />
  );
}
