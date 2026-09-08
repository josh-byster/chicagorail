/**
 * Departure board
 *
 * Dense table of upcoming departures from a station, one row per train.
 * Auto-refreshes; rows open the train's stop-by-stop detail.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { utils } from '@chicagorail/shared';
import { useDepartures } from '@/hooks/useDepartures';
import { RouteBadge } from './RouteBadge';
import {
  delayColor,
  delayLabel,
  effectiveTime,
  relativeDeparture,
  trainNumber,
} from '@/lib/trainInfo';
import { APP_CONFIG } from '@/config';

interface DepartureBoardProps {
  stopId: string | null;
  routeFilter?: string;
  date?: string;
  /** Trains are shown as scheduled for this day, not as "next N from now" */
  isToday?: boolean;
}

const gridClass =
  'grid grid-cols-[auto_auto_minmax(0,1fr)_auto] items-center gap-2.5 px-3 sm:grid-cols-[84px_62px_minmax(0,1fr)_52px] sm:gap-3.5 sm:px-[18px]';

export function DepartureBoard({ stopId, routeFilter, date, isToday = true }: DepartureBoardProps) {
  const [visible, setVisible] = useState<number>(APP_CONFIG.limits.departuresPageSize);
  const navigate = useNavigate();

  const {
    data: { departures },
    isLoading,
    isError,
    error,
  } = useDepartures(stopId, { routeId: routeFilter, date });

  if (isLoading && departures.length === 0) {
    return (
      <div className="py-12 text-center" role="status" aria-label="Loading departures">
        <div className="mx-auto size-7 animate-spin rounded-full border-2 border-hairline-strong border-t-foreground" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-[14px] border border-destructive/40 p-4 text-sm text-destructive" role="alert">
        {error || 'Failed to load departures. Please try again.'}
      </div>
    );
  }

  if (departures.length === 0) {
    return (
      <div className="rounded-[14px] border border-hairline bg-panel py-12 text-center text-sm text-muted-foreground">
        No departures found for this station
      </div>
    );
  }

  const shown = departures.slice(0, visible);

  return (
    <div className="overflow-hidden rounded-[14px] border border-hairline bg-panel">
      <div
        className={`${gridClass} bg-foreground/[.02] py-[11px] text-[10px] sm:text-[10.5px] font-semibold uppercase tracking-[.1em] text-muted-foreground`}
      >
        <div>Departs</div>
        <div>Line</div>
        <div>Destination</div>
        <div className="text-right">Train</div>
      </div>

      <ul aria-label="Departures">
        {shown.map((departure) => (
          <li key={`${departure.trip_id}-${departure.departure_time}`}>
            <button
              type="button"
              onClick={() => navigate(`/train/${encodeURIComponent(departure.trip_id)}${date ? `?date=${date}` : ''}`)}
              className={`${gridClass} w-full border-t border-foreground/[.055] py-3 text-left transition-colors hover:bg-foreground/[.035]`}
            >
              <div className="flex flex-col gap-px">
                <span className="whitespace-nowrap text-base font-semibold tracking-[-0.02em] tabular-nums">
                  {utils.formatTime(
                    effectiveTime(departure.departure_time, departure.realtime)
                  )}
                </span>
                {isToday && (
                  <span className="whitespace-nowrap text-[11px] tabular-nums text-muted-foreground">
                    {relativeDeparture(
                      effectiveTime(departure.departure_time, departure.realtime)
                    )}
                  </span>
                )}
              </div>
              <div>
                <RouteBadge route={departure.route} wide />
              </div>
              <div className="flex min-w-0 flex-col gap-px">
                <span className="truncate text-sm font-medium">{departure.trip_headsign}</span>
                {departure.realtime && (
                  <span
                    className={`truncate text-[11.5px] tabular-nums ${delayColor(departure.realtime)}`}
                  >
                    {delayLabel(departure.realtime)}
                    {departure.realtime.status !== 'on_time' && (
                      <span className="text-muted-foreground">
                        {' · '}
                        {utils.formatTime(departure.departure_time)} scheduled
                      </span>
                    )}
                  </span>
                )}
              </div>
              <div className="text-right text-sm tabular-nums text-ink-subtle">
                {trainNumber(departure.trip_id) ?? '—'}
              </div>
            </button>
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-between border-t border-hairline bg-foreground/[.02] px-3 py-3 sm:px-[18px]">
        <span className="text-[12.5px] text-muted-foreground">
          Showing {shown.length} of {departures.length}
        </span>
        {shown.length < departures.length && (
          <button
            type="button"
            onClick={() => setVisible((count) => count + APP_CONFIG.limits.departuresPageSize)}
            className="h-[26px] px-2.5 text-[12.5px] font-medium transition-opacity hover:opacity-80"
          >
            Show more
          </button>
        )}
      </div>
    </div>
  );
}
