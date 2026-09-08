/**
 * Train detail
 *
 * Every scheduled stop for one train, with the schedule's own idea of where
 * the train is right now. Metra's GTFS feed is a timetable, not a live feed,
 * so nothing here claims to be a real-time position.
 */

import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { utils } from '@chicagorail/shared';
import type { TripStop } from '@chicagorail/shared';
import { BackLink } from '@/components/BackLink';
import { RouteBadge } from '@/components/RouteBadge';
import { useTripDetails } from '@/hooks/useTripDetails';
import { useSEO } from '@/hooks/useSEO';
import { formatClock, formatDuration, trainNumber } from '@/lib/trainInfo';
import { APP_CONFIG } from '@/config';
import { format, isSameDay, parse, isValid } from 'date-fns';

export function TrainDetail() {
  const { tripId } = useParams<{ tripId: string }>();
  const [searchParams] = useSearchParams();
  const dateParam = searchParams.get('date') ?? undefined;

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  const { data: trip, isLoading, error } = useTripDetails(tripId ?? null, dateParam);

  const scheduleDate = useMemo(() => {
    if (!dateParam) return new Date();
    const parsed = parse(dateParam, APP_CONFIG.dateFormats.url, new Date());
    return isValid(parsed) ? parsed : new Date();
  }, [dateParam]);

  const isToday = isSameDay(scheduleDate, new Date());
  const number = tripId ? trainNumber(tripId) : null;

  useSEO(
    useMemo(
      () =>
        trip
          ? {
              title: `${trip.route.route_short_name} train${number ? ` #${number}` : ''} to ${trip.trip_headsign} - Metra Schedule`,
              description: `Every scheduled stop for Metra ${trip.route.route_long_name} train${number ? ` #${number}` : ''} to ${trip.trip_headsign}.`,
            }
          : {},
      [trip, number]
    )
  );

  if (isLoading) {
    return (
      <Screen>
        <BackLink />
        <p className="py-8 text-sm text-muted-foreground" role="status">
          Loading train&hellip;
        </p>
      </Screen>
    );
  }

  if (error || !trip) {
    return (
      <Screen>
        <BackLink />
        <div className="rounded-[14px] border border-destructive/40 p-4 text-sm text-destructive" role="alert">
          {error || 'That train is not in the current schedule.'}
        </div>
      </Screen>
    );
  }

  const stops = trip.stops;
  const origin = stops[0];
  const terminus = stops[stops.length - 1];
  const startMs = origin ? new Date(origin.departure_time).getTime() : 0;
  const endMs = terminus ? new Date(terminus.arrival_time).getTime() : 0;
  const rideMinutes = Math.round((endMs - startMs) / 60000);

  // Index of the next stop the schedule has this train reaching
  const nextIndex = stops.findIndex((stop) => new Date(stop.arrival_time).getTime() >= now);
  const isRunning = isToday && now >= startMs && now <= endMs && nextIndex !== -1;
  const progress = endMs > startMs ? Math.min(1, Math.max(0, (now - startMs) / (endMs - startMs))) : 0;

  return (
    <Screen>
      <BackLink />

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2.5">
          <RouteBadge route={trip.route} />
          <span className="text-[13px] tabular-nums text-ink-subtle">
            {number ? `Train #${number}` : trip.route.route_long_name}
          </span>
          <span className="ml-auto text-xs text-muted-foreground">
            {isToday ? 'Today' : format(scheduleDate, APP_CONFIG.dateFormats.display)}
          </span>
        </div>
        <h1 className="text-2xl font-bold tracking-[-0.03em]">
          {origin?.stop.stop_name} &rarr; {trip.trip_headsign}
        </h1>
        <p className="text-[13px] tabular-nums text-muted-foreground">
          {stops.length} stops &middot; departs {utils.formatTime(origin.departure_time)} &middot;{' '}
          {formatDuration(rideMinutes)}
        </p>
      </div>

      {isRunning && (
        <div className="flex flex-col gap-3 rounded-[14px] border border-hairline bg-panel px-[18px] py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-col gap-0.5">
              <span className="text-[10.5px] font-semibold uppercase tracking-[.1em] text-muted-foreground">
                Next stop, on schedule
              </span>
              <span className="text-[17px] font-semibold">{stops[nextIndex].stop.stop_name}</span>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold tracking-[-0.03em] tabular-nums">
                {formatClock(stops[nextIndex].arrival_time)}
              </div>
              <div className="text-[11.5px] text-muted-foreground">
                {stops.length - nextIndex} stops to go
              </div>
            </div>
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-foreground/10">
            <div
              className="h-full"
              style={{
                width: `${Math.round(progress * 100)}%`,
                backgroundColor: `#${trip.route.route_color}`,
              }}
            />
          </div>
          <div className="flex justify-between text-[11.5px] tabular-nums text-muted-foreground">
            <span>
              {origin.stop.stop_name} &middot; {formatClock(origin.departure_time)}
            </span>
            <span>
              {terminus.stop.stop_name} &middot; {formatClock(terminus.arrival_time)}
            </span>
          </div>
        </div>
      )}

      <ol className="flex flex-col">
        {stops.map((stop, index) => (
          <StopRow
            key={`${stop.stop.stop_id}-${stop.stop_sequence}`}
            stop={stop}
            routeColor={trip.route.route_color}
            isLast={index === stops.length - 1}
            isPast={isRunning && index < nextIndex}
            isNext={isRunning && index === nextIndex}
          />
        ))}
      </ol>
    </Screen>
  );
}

interface StopRowProps {
  stop: TripStop;
  routeColor: string;
  isLast: boolean;
  isPast: boolean;
  isNext: boolean;
}

function StopRow({ stop, routeColor, isLast, isPast, isNext }: StopRowProps) {
  return (
    <li className="grid grid-cols-[56px_18px_minmax(0,1fr)] items-center gap-3 py-2.5">
      <span
        className={`text-[13.5px] font-semibold tabular-nums ${isPast ? 'text-muted-foreground' : ''}`}
      >
        {formatClock(stop.arrival_time)}
      </span>
      <div className="flex h-full flex-col items-center self-stretch">
        {isNext ? (
          <span
            className="size-[13px] rounded-full"
            style={{ backgroundColor: `#${routeColor}`, boxShadow: `0 0 0 4px #${routeColor}2e` }}
          />
        ) : isPast ? (
          <span className="size-[9px] rounded-full bg-muted-foreground/60" />
        ) : (
          <span className="size-[9px] rounded-full border-2 border-muted-foreground/60" />
        )}
        {!isLast && (
          <span
            className="mt-0.5 min-h-3.5 w-0.5 flex-1"
            style={{ backgroundColor: isPast ? `#${routeColor}` : 'var(--hairline-strong)' }}
          />
        )}
      </div>
      <div className="flex min-w-0 flex-col gap-0.5">
        <span
          className={`truncate text-[13.5px] ${isNext ? 'text-[15px] font-semibold' : isPast ? 'text-muted-foreground' : ''}`}
        >
          {stop.stop.stop_name}
        </span>
        {isNext && <span className="text-xs text-muted-foreground">Next, on schedule</span>}
      </div>
    </li>
  );
}

function Screen({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-[720px] flex-col gap-[18px] px-5 pb-16 pt-7">
      {children}
    </div>
  );
}
