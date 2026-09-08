/**
 * The dense board shared by departures and arrivals.
 *
 * One row per train: when it goes, which line, where it's headed (or where
 * it came from), and its train number.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { utils } from '@chicagorail/shared';
import type { RealtimePrediction, Route } from '@chicagorail/shared';
import { RouteBadge } from './RouteBadge';
import {
  delayColor,
  delayLabel,
  effectiveTime,
  relativeDeparture,
  trainNumber,
} from '@/lib/trainInfo';
import { APP_CONFIG } from '@/config';

export interface BoardRow {
  tripId: string;
  /** Scheduled time at this station */
  time: string;
  route: Route;
  /** Headsign for departures, origin station for arrivals */
  place: string;
  realtime?: RealtimePrediction;
}

interface ScheduleBoardProps {
  rows: BoardRow[];
  /** "Departs" / "Arrives" */
  timeHeading: string;
  /** "Destination" / "From" */
  placeHeading: string;
  isLoading: boolean;
  isError: boolean;
  error: string | null;
  emptyMessage: string;
  /** Countdowns and delays only make sense for today */
  isToday?: boolean;
  /** Carried into the train detail link so it can offer a way back */
  contextSearch?: string;
}

const gridClass =
  'grid grid-cols-[auto_auto_minmax(0,1fr)_auto] items-center gap-2.5 px-3 sm:grid-cols-[84px_62px_minmax(0,1fr)_52px] sm:gap-3.5 sm:px-[18px]';

export function ScheduleBoard({
  rows,
  timeHeading,
  placeHeading,
  isLoading,
  isError,
  error,
  emptyMessage,
  isToday = true,
  contextSearch = '',
}: ScheduleBoardProps) {
  const [visible, setVisible] = useState<number>(APP_CONFIG.limits.departuresPageSize);
  const navigate = useNavigate();

  if (isLoading && rows.length === 0) {
    return (
      <div className="py-12 text-center" role="status" aria-label={`Loading ${placeHeading}`}>
        <div className="mx-auto size-7 animate-spin rounded-full border-2 border-hairline-strong border-t-foreground" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-[14px] border border-destructive/40 p-4 text-sm text-destructive" role="alert">
        {error || 'Failed to load. Please try again.'}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-[14px] border border-hairline bg-panel py-12 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  const shown = rows.slice(0, visible);

  return (
    <div className="overflow-hidden rounded-[14px] border border-hairline bg-panel">
      <div
        className={`${gridClass} bg-foreground/[.02] py-[11px] text-[10px] font-semibold uppercase tracking-[.1em] text-muted-foreground sm:text-[10.5px]`}
      >
        <div>{timeHeading}</div>
        <div>Line</div>
        <div>{placeHeading}</div>
        <div className="text-right">Train</div>
      </div>

      <ul aria-label={placeHeading}>
        {shown.map((row) => (
          <li key={`${row.tripId}-${row.time}`}>
            <button
              type="button"
              onClick={() =>
                navigate(`/train/${encodeURIComponent(row.tripId)}${contextSearch}`)
              }
              className={`${gridClass} w-full border-t border-foreground/[.055] py-3 text-left transition-colors hover:bg-foreground/[.035]`}
            >
              <div className="flex flex-col gap-px">
                <span className="whitespace-nowrap text-base font-semibold tracking-[-0.02em] tabular-nums">
                  {utils.formatTime(effectiveTime(row.time, row.realtime))}
                </span>
                {isToday && (
                  <span className="whitespace-nowrap text-[11px] tabular-nums text-muted-foreground">
                    {relativeDeparture(effectiveTime(row.time, row.realtime))}
                  </span>
                )}
              </div>
              <div>
                <RouteBadge route={row.route} wide />
              </div>
              <div className="flex min-w-0 flex-col gap-px">
                <span className="truncate text-sm font-medium">{row.place}</span>
                {row.realtime && (
                  <span
                    className={`truncate text-[11.5px] tabular-nums ${delayColor(row.realtime)}`}
                  >
                    {delayLabel(row.realtime)}
                    {row.realtime.status !== 'on_time' && (
                      <span className="text-muted-foreground">
                        {' · '}
                        {utils.formatTime(row.time)} scheduled
                      </span>
                    )}
                  </span>
                )}
              </div>
              <div className="text-right text-sm tabular-nums text-ink-subtle">
                {trainNumber(row.tripId) ?? '—'}
              </div>
            </button>
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-between border-t border-hairline bg-foreground/[.02] px-3 py-3 sm:px-[18px]">
        <span className="text-[12.5px] text-muted-foreground">
          Showing {shown.length} of {rows.length}
        </span>
        {shown.length < rows.length && (
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
