/**
 * Train detail
 *
 * Every stop for one train. When Metra's realtime feed reports the train's
 * position, the panel shows where it actually is and how late it is running;
 * without the feed it falls back to the schedule and says so.
 */

import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { utils } from '@chicagorail/shared';
import type { TripStop } from '@chicagorail/shared';
import { BackLink } from '@/components/BackLink';
import { RouteBadge } from '@/components/RouteBadge';
import { useTripDetails } from '@/hooks/useTripDetails';
import { useSEO } from '@/hooks/useSEO';
import {
  delayColor,
  delayLabel,
  effectiveTime,
  formatAgo,
  formatClock,
  formatDuration,
  secondsAgo,
  trainNumber,
} from '@/lib/trainInfo';
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

  // The train reported its own position, so trust that over the clock
  const vehicle = trip.vehicle;
  const reportedIndex = vehicle?.current_stop_sequence
    ? stops.findIndex((stop) => stop.stop_sequence === vehicle.current_stop_sequence)
    : -1;
  const isLive = reportedIndex >= 0;

  // Otherwise fall back to where the schedule says it should be
  const scheduledIndex = stops.findIndex(
    (stop) => new Date(effectiveTime(stop.arrival_time, stop.realtime)).getTime() >= now
  );
  const nextIndex = isLive ? reportedIndex : scheduledIndex;
  const isRunning = isLive || (isToday && now >= startMs && now <= endMs && nextIndex !== -1);

  const progress = isLive
    ? stops.length > 1
      ? reportedIndex / (stops.length - 1)
      : 0
    : endMs > startMs
      ? Math.min(1, Math.max(0, (now - startMs) / (endMs - startMs)))
      : 0;

  const nextStop = nextIndex >= 0 ? stops[nextIndex] : undefined;
  const positionLabel =
    vehicle?.current_status === 'stopped_at'
      ? 'Now at'
      : vehicle?.current_status === 'incoming_at'
        ? 'Arriving at'
        : isLive
          ? 'Now approaching'
          : 'Next stop, on schedule';

  return (
    <Screen>
      <BackLink />

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2.5">
          <RouteBadge route={trip.route} />
          <span className="text-[13px] tabular-nums text-ink-subtle">
            {number ? `Train #${number}` : trip.route.route_long_name}
          </span>
          {nextStop?.realtime ? (
            <span className="ml-auto flex items-center gap-1.5">
              <span className="size-[5px] animate-livepulse rounded-full bg-emerald-500" />
              <span className={`text-xs ${delayColor(nextStop.realtime)}`}>
                {delayLabel(nextStop.realtime)}
              </span>
            </span>
          ) : (
            <span className="ml-auto text-xs text-muted-foreground">
              {isToday ? 'Today' : format(scheduleDate, APP_CONFIG.dateFormats.display)}
            </span>
          )}
        </div>
        <h1 className="text-2xl font-bold tracking-[-0.03em]">
          {origin?.stop.stop_name} &rarr; {trip.trip_headsign}
        </h1>
        <p className="text-[13px] tabular-nums text-muted-foreground">
          {stops.length} stops &middot; departs {utils.formatTime(origin.departure_time)} &middot;{' '}
          {formatDuration(rideMinutes)}
        </p>
      </div>

      {isRunning && nextStop && (
        <div className="flex flex-col gap-3 rounded-[14px] border border-hairline bg-panel px-[18px] py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-col gap-0.5">
              <span className="text-[10.5px] font-semibold uppercase tracking-[.1em] text-muted-foreground">
                {positionLabel}
              </span>
              <span className="text-[17px] font-semibold">{nextStop.stop.stop_name}</span>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold tracking-[-0.03em] tabular-nums">
                {formatClock(effectiveTime(nextStop.arrival_time, nextStop.realtime))}
              </div>
              <div className="text-[11.5px] text-muted-foreground">
                {vehicle
                  ? `position ${formatAgo(secondsAgo(new Date(vehicle.timestamp).getTime(), now))}`
                  : `${stops.length - nextIndex} stops to go`}
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
              {origin.stop.stop_name} &middot;{' '}
              {formatClock(effectiveTime(origin.departure_time, origin.realtime))}
            </span>
            <span>
              {terminus.stop.stop_name} &middot;{' '}
              {formatClock(effectiveTime(terminus.arrival_time, terminus.realtime))}
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
        className={`flex flex-col text-[13.5px] font-semibold tabular-nums ${isPast ? 'text-muted-foreground' : ''}`}
      >
        {formatClock(effectiveTime(stop.arrival_time, stop.realtime))}
        {stop.realtime && stop.realtime.status !== 'on_time' && (
          <span className="text-[11px] font-normal text-muted-foreground line-through">
            {formatClock(stop.arrival_time)}
          </span>
        )}
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
        {isNext && (
          <span
            className={`text-xs ${stop.realtime ? delayColor(stop.realtime) : 'text-muted-foreground'}`}
          >
            {stop.realtime ? delayLabel(stop.realtime) : 'Next, on schedule'}
          </span>
        )}
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
