/**
 * Values the design shows that GTFS exposes only indirectly.
 */

import { utils } from '@chicagorail/shared';
import type { RealtimePrediction } from '@chicagorail/shared';

/**
 * Metra encodes the train number in the trip id's second segment,
 * e.g. `BNSF_BN1200_V4_A` is train 1200.
 */
export function trainNumber(tripId: string): string | null {
  const digits = tripId.split('_')[1]?.match(/\d+/)?.[0];
  return digits ?? null;
}

/** "5:21" — the meridiem is dropped where surrounding context already carries it */
export function formatClock(isoTime: string): string {
  return new Date(isoTime)
    .toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    .replace(/\s?[AP]M$/i, '');
}

export function minutesUntil(isoTime: string, now: Date = new Date()): number {
  return Math.round((new Date(isoTime).getTime() - now.getTime()) / 60000);
}

/** "Now" / "in 4 min" / "in 1 hr 5 min" */
export function relativeDeparture(isoTime: string): string {
  const relative = utils.getRelativeTime(isoTime);
  return relative === 'Now' ? 'Now' : `in ${relative}`;
}

/** "38 min" / "1 hr 12 min" */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} hr` : `${hours} hr ${rest} min`;
}

/**
 * How a realtime prediction should read, e.g. "On time" / "4 min late".
 * Rounds to the nearest minute, since the feed's second-level precision is
 * more than a rider needs.
 */
export function delayLabel(realtime: RealtimePrediction): string {
  if (realtime.status === 'on_time') return 'On time';
  const minutes = Math.max(1, Math.round(Math.abs(realtime.delay_seconds) / 60));
  return `${minutes} min ${realtime.status === 'late' ? 'late' : 'early'}`;
}

/** Tailwind text colour for a realtime status */
export function delayColor(realtime: RealtimePrediction): string {
  if (realtime.status === 'late') return 'text-amber-500';
  return 'text-emerald-500';
}

/** The time a rider should actually plan around */
export function effectiveTime(scheduled: string, realtime?: RealtimePrediction): string {
  return realtime?.predicted_time ?? scheduled;
}

export function secondsAgo(timestamp: number, now: number = Date.now()): number {
  return Math.max(0, Math.round((now - timestamp) / 1000));
}

/** "12s ago" / "3m ago" */
export function formatAgo(seconds: number): string {
  if (seconds < 60) return `${seconds}s ago`;
  return `${Math.floor(seconds / 60)}m ago`;
}
