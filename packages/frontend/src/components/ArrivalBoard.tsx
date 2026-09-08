/**
 * Arrival board - trains coming into a station
 */

import { useArrivals } from '@/hooks/useArrivals';
import { ScheduleBoard, type BoardRow } from './ScheduleBoard';

interface ArrivalBoardProps {
  stopId: string | null;
  routeFilter?: string;
  date?: string;
  isToday?: boolean;
  contextSearch?: string;
}

export function ArrivalBoard({
  stopId,
  routeFilter,
  date,
  isToday = true,
  contextSearch,
}: ArrivalBoardProps) {
  const {
    data: { arrivals },
    isLoading,
    isError,
    error,
  } = useArrivals(stopId, { routeId: routeFilter, date });

  const rows: BoardRow[] = arrivals.map((arrival) => ({
    tripId: arrival.trip_id,
    time: arrival.arrival_time,
    route: arrival.route,
    place: arrival.origin_name,
    realtime: arrival.realtime,
  }));

  return (
    <ScheduleBoard
      rows={rows}
      timeHeading="Arrives"
      placeHeading="From"
      isLoading={isLoading}
      isError={isError}
      error={error}
      emptyMessage="No more arrivals into this station today"
      isToday={isToday}
      contextSearch={contextSearch}
    />
  );
}
