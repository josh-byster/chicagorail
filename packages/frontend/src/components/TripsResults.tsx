/**
 * Trip results
 *
 * A trip is a single-answer question, so the next train gets the whole card
 * and everything after it is demoted to a thin "if you miss it" list.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { DirectTrip, Route, Stop } from '@chicagorail/shared';
import { utils } from '@chicagorail/shared';
import { RouteFilterButtons } from './RouteFilterButtons';
import { RouteBadge } from './RouteBadge';
import { useSavedTrips } from '@/hooks/useSavedTrips';
import {
  delayColor,
  delayLabel,
  effectiveTime,
  formatClock,
  formatDuration,
  relativeDeparture,
  trainNumber,
} from '@/lib/trainInfo';

/** Backups are a fallback, not the answer — only a few earn a row up front */
const BACKUPS_SHOWN = 5;

interface TripsResultsProps {
  trips: DirectTrip[];
  filteredTrips: DirectTrip[];
  tripRoutes: Route[];
  isLoading: boolean;
  error: string | null;
  selectedRoute: string | undefined;
  onRouteFilterChange: (routeId: string | undefined) => void;
  fromStop: Stop | null;
  toStop: Stop | null;
  dateLabel: string;
  isToday: boolean;
  /** Carried into train links so the detail page can offer a way back */
  contextSearch?: string;
}

export function TripsResults({
  trips,
  filteredTrips,
  tripRoutes,
  isLoading,
  error,
  selectedRoute,
  onRouteFilterChange,
  fromStop,
  toStop,
  dateLabel,
  isToday,
  contextSearch = '',
}: TripsResultsProps) {
  const navigate = useNavigate();
  const [visibleBackups, setVisibleBackups] = useState(BACKUPS_SHOWN);

  if (isLoading) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground" role="status">
        Finding trains&hellip;
      </p>
    );
  }

  if (error) {
    return (
      <div className="rounded-[14px] border border-destructive/40 p-4 text-sm text-destructive" role="alert">
        {error}
      </div>
    );
  }

  if (trips.length === 0) {
    return (
      <div className="rounded-[14px] border border-hairline bg-surface p-6">
        <h3 className="mb-2 text-sm font-semibold">No direct trains</h3>
        <p className="text-[13px] text-muted-foreground">
          Nothing runs straight through between these stations {dateLabel.toLowerCase()}. You may
          need to transfer downtown.
        </p>
      </div>
    );
  }

  const [next, ...backups] = filteredTrips;
  const lastTrip = filteredTrips[filteredTrips.length - 1];
  const onlyRoute = tripRoutes.length === 1 ? tripRoutes[0] : null;

  return (
    <div className="flex flex-col gap-4">
      <RouteFilterButtons
        routes={tripRoutes}
        selectedRoute={selectedRoute}
        onFilterChange={onRouteFilterChange}
        allLabel="All trains"
        suffix={
          <span className="ml-auto self-center text-xs text-muted-foreground">
            {filteredTrips.length} direct {filteredTrips.length === 1 ? 'train' : 'trains'}
            {onlyRoute && toStop
              ? ` · only ${onlyRoute.route_short_name} serves ${toStop.stop_name}`
              : ''}
          </span>
        }
      />

      {next && (
        <NextTrainCard
          trip={next}
          fromStop={fromStop}
          toStop={toStop}
          isToday={isToday}
          onTrack={() => navigate(`/train/${encodeURIComponent(next.trip_id)}`)}
        />
      )}

      {backups.length > 0 && (
        <>
          <div className="flex items-center justify-between pt-1">
            <span className="text-[10.5px] font-semibold uppercase tracking-[.1em] text-muted-foreground">
              If you miss it
            </span>
            <span className="text-[11.5px] text-muted-foreground">
              {backups.length} more {isToday ? 'today' : dateLabel.toLowerCase()}
            </span>
          </div>

          <ul>
            {backups.slice(0, visibleBackups).map((trip) => (
              <li key={`${trip.trip_id}-${trip.origin_departure}`}>
                <button
                  type="button"
                  onClick={() => navigate(`/train/${encodeURIComponent(trip.trip_id)}${contextSearch}`)}
                  className="grid w-full grid-cols-[auto_auto_minmax(0,1fr)_auto] items-center gap-3.5 border-t border-foreground/[.06] py-2.5 text-left transition-opacity hover:opacity-70"
                >
                  <span className="text-base font-semibold tabular-nums">
                    {utils.formatTime(effectiveTime(trip.origin_departure, trip.realtime))}
                  </span>
                  <span className="text-[13.5px] tabular-nums text-ink-subtle">
                    &rarr;{' '}
                    {utils.formatTime(
                      effectiveTime(trip.destination_arrival, trip.realtime_arrival)
                    )}
                  </span>
                  <span className="truncate text-[13px] text-muted-foreground">
                    {trip.realtime ? (
                      <span className={delayColor(trip.realtime)}>
                        {delayLabel(trip.realtime)}
                      </span>
                    ) : (
                      formatDuration(trip.duration_minutes)
                    )}
                  </span>
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {trainNumber(trip.trip_id) ? `#${trainNumber(trip.trip_id)}` : ''}
                  </span>
                </button>
              </li>
            ))}
          </ul>

          {backups.length > visibleBackups && (
            <button
              type="button"
              onClick={() => setVisibleBackups(backups.length)}
              className="w-fit text-[12.5px] font-medium transition-opacity hover:opacity-80"
            >
              Show all {backups.length}
            </button>
          )}
        </>
      )}

      {lastTrip && (
        <span className="text-[12.5px] text-muted-foreground">
          Last train {utils.formatTime(lastTrip.origin_departure)}
        </span>
      )}
    </div>
  );
}

interface NextTrainCardProps {
  trip: DirectTrip;
  fromStop: Stop | null;
  toStop: Stop | null;
  isToday: boolean;
  onTrack: () => void;
}

function NextTrainCard({ trip, fromStop, toStop, isToday, onTrack }: NextTrainCardProps) {
  const { saveTrip, removeTrip, isSaved } = useSavedTrips();
  const saved = !!fromStop && !!toStop && isSaved(fromStop.stop_id, toStop.stop_id);
  const number = trainNumber(trip.trip_id);

  const toggleSaved = () => {
    if (!fromStop || !toStop) return;
    if (saved) {
      removeTrip(fromStop.stop_id, toStop.stop_id);
    } else {
      saveTrip({ origin: fromStop, destination: toStop });
    }
  };

  return (
    <div className="flex flex-col gap-4 rounded-[14px] border border-border bg-surface-raised p-5">
      <div className="flex items-center gap-2.5">
        <RouteBadge route={trip.route} />
        <span className="text-[13px] tabular-nums text-ink-subtle">
          {number ? `#${number} · ` : ''}
          {trip.route.route_long_name}
        </span>
      </div>

      <div className="flex flex-wrap items-end gap-7">
        <div className="flex flex-col gap-1">
          <span className="text-[10.5px] font-semibold uppercase tracking-[.1em] text-muted-foreground">
            Departs
          </span>
          <span className="text-[44px] font-bold leading-none tracking-[-0.04em] tabular-nums">
            {formatClock(effectiveTime(trip.origin_departure, trip.realtime))}
          </span>
          {isToday && (
            <span className="text-[12.5px] text-emerald-500">
              {relativeDeparture(effectiveTime(trip.origin_departure, trip.realtime))}
              {trip.realtime && (
                <>
                  {' · '}
                  <span className={delayColor(trip.realtime)}>{delayLabel(trip.realtime)}</span>
                </>
              )}
            </span>
          )}
          {trip.realtime && trip.realtime.status !== 'on_time' && (
            <span className="text-[11.5px] tabular-nums text-muted-foreground line-through">
              {formatClock(trip.origin_departure)} scheduled
            </span>
          )}
        </div>
        <div className="flex flex-col gap-1 pb-1">
          <span className="text-[10.5px] font-semibold uppercase tracking-[.1em] text-muted-foreground">
            Arrives
          </span>
          <span className="text-[26px] font-bold tracking-[-0.03em] tabular-nums">
            {utils.formatTime(effectiveTime(trip.destination_arrival, trip.realtime_arrival))}
          </span>
          <span className="text-[12.5px] tabular-nums text-muted-foreground">
            {formatDuration(trip.duration_minutes)} ride
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-t border-hairline pt-3">
        <button
          type="button"
          onClick={onTrack}
          className="h-[34px] rounded-[9px] bg-foreground px-4 text-[13px] font-semibold text-background transition-opacity hover:opacity-85"
        >
          See every stop
        </button>
        <button
          type="button"
          onClick={toggleSaved}
          disabled={!fromStop || !toStop}
          className="h-[34px] rounded-[9px] border border-border px-4 text-[13px] font-medium text-ink-subtle transition-colors hover:bg-foreground/5 hover:text-foreground disabled:opacity-40"
        >
          {saved ? 'Saved' : 'Save trip'}
        </button>
      </div>
    </div>
  );
}
