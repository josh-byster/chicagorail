/**
 * A saved trip, showing its next real departure.
 *
 * `hero` is the home screen's "your usual" card: the answer before you type.
 */

import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { utils } from '@chicagorail/shared';
import { useDirectTrips } from '@/hooks/useTrips';
import { APP_CONFIG } from '@/config';
import { formatClock, formatDuration, relativeDeparture } from '@/lib/trainInfo';
import { RouteBadge } from './RouteBadge';
import type { SavedTrip } from '@/hooks/useSavedTrips';

interface SavedTripCardProps {
  trip: SavedTrip;
  variant?: 'row' | 'hero';
}

export function SavedTripCard({ trip, variant = 'row' }: SavedTripCardProps) {
  const today = format(new Date(), APP_CONFIG.dateFormats.url);
  const { data: trips, isLoading } = useDirectTrips(
    trip.origin.stop_id,
    trip.destination.stop_id,
    today
  );

  const next = trips[0] ?? null;
  const href = `/?from=${encodeURIComponent(trip.origin.stop_id)}&to=${encodeURIComponent(trip.destination.stop_id)}`;
  const accent = next ? `#${next.route.route_color}` : 'var(--hairline-strong)';

  if (variant === 'hero') {
    return (
      <Link
        to={href}
        className="grid grid-cols-[3px_minmax(0,1fr)_auto] items-center gap-3.5 overflow-hidden rounded-[11px] border border-border bg-surface-raised transition-colors hover:bg-surface-raised/70"
      >
        <span className="h-full self-stretch" style={{ backgroundColor: accent }} />
        <div className="flex flex-col gap-[3px] py-3">
          <div className="flex items-center gap-2">
            {next && <RouteBadge route={next.route} />}
            <span className="truncate text-sm font-medium">
              Your usual &middot; to {trip.destination.stop_name}
            </span>
          </div>
          <span className="text-xs tabular-nums text-muted-foreground">
            {next
              ? `Arrives ${utils.formatTime(next.destination_arrival)} · ${formatDuration(next.duration_minutes)}`
              : isLoading
                ? 'Checking the schedule…'
                : 'No more direct trains today'}
          </span>
        </div>
        <div className="pr-4 text-right">
          <div className="text-[22px] font-bold tracking-[-0.03em] tabular-nums">
            {next ? formatClock(next.origin_departure) : '—'}
          </div>
          {next && (
            <div className="text-[11.5px] text-emerald-500">
              {relativeDeparture(next.origin_departure)}
            </div>
          )}
        </div>
      </Link>
    );
  }

  return (
    <Link
      to={href}
      className="grid grid-cols-[3px_minmax(0,1fr)_auto] items-center gap-3.5 overflow-hidden rounded-[11px] border border-hairline bg-surface transition-colors hover:bg-surface-raised"
    >
      <span className="h-full self-stretch" style={{ backgroundColor: accent }} />
      <div className="flex flex-col gap-0.5 py-3">
        <span className="truncate text-sm font-medium">
          {trip.origin.stop_name} &rarr; {trip.destination.stop_name}
        </span>
        <span className="truncate text-xs text-muted-foreground">
          {next
            ? `${next.route.route_short_name} · ${formatDuration(next.duration_minutes)}`
            : isLoading
              ? 'Checking the schedule…'
              : 'No more direct trains today'}
        </span>
      </div>
      <div className="pr-3.5 text-right">
        <div className="text-[15px] font-semibold tabular-nums">
          {next ? formatClock(next.origin_departure) : '—'}
        </div>
        {next && (
          <div className="text-[11.5px] text-muted-foreground">
            {relativeDeparture(next.origin_departure)}
          </div>
        )}
      </div>
    </Link>
  );
}
