/**
 * Saved trips (origin + destination pairs), persisted in localStorage.
 *
 * Backed by a module-level store so every component that saves or reads a
 * trip sees the same list — the home screen updates the moment the trip
 * results save one.
 */

import { useCallback, useSyncExternalStore } from 'react';
import type { Stop } from '@chicagorail/shared';
import { APP_CONFIG } from '@/config';
import { logger } from '@/shared/lib';

const { storage, limits } = APP_CONFIG;

export interface SavedTrip {
  origin: Stop;
  destination: Stop;
}

function isValidStop(value: unknown): value is Stop {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as Stop).stop_id === 'string' &&
    typeof (value as Stop).stop_name === 'string'
  );
}

function isValidTrip(value: unknown): value is SavedTrip {
  return (
    typeof value === 'object' &&
    value !== null &&
    isValidStop((value as SavedTrip).origin) &&
    isValidStop((value as SavedTrip).destination)
  );
}

export function tripKey(originId: string, destinationId: string): string {
  return `${originId}>${destinationId}`;
}

function readStoredTrips(): SavedTrip[] {
  try {
    const stored = localStorage.getItem(storage.savedTrips);
    if (!stored) return [];

    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];

    const valid = parsed.filter(isValidTrip);
    if (valid.length !== parsed.length) {
      localStorage.setItem(storage.savedTrips, JSON.stringify(valid));
    }
    return valid;
  } catch (error) {
    logger.error(
      'Failed to parse saved trips from localStorage',
      error instanceof Error ? error : undefined
    );
    localStorage.removeItem(storage.savedTrips);
    return [];
  }
}

let trips: SavedTrip[] | null = null;
const listeners = new Set<() => void>();

function getSnapshot(): SavedTrip[] {
  trips ??= readStoredTrips();
  return trips;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function setTrips(next: SavedTrip[]): void {
  trips = next;
  try {
    localStorage.setItem(storage.savedTrips, JSON.stringify(next));
  } catch (error) {
    logger.error(
      'Failed to save trips to localStorage',
      error instanceof Error ? error : undefined
    );
  }
  listeners.forEach((listener) => listener());
}

export interface UseSavedTripsResult {
  data: SavedTrip[];
  saveTrip: (trip: SavedTrip) => void;
  removeTrip: (originId: string, destinationId: string) => void;
  isSaved: (originId: string, destinationId: string) => boolean;
}

export function useSavedTrips(): UseSavedTripsResult {
  const savedTrips = useSyncExternalStore(subscribe, getSnapshot);

  const saveTrip = useCallback((trip: SavedTrip) => {
    const key = tripKey(trip.origin.stop_id, trip.destination.stop_id);
    const without = getSnapshot().filter(
      (t) => tripKey(t.origin.stop_id, t.destination.stop_id) !== key
    );
    setTrips([trip, ...without].slice(0, limits.maxSavedTrips));
  }, []);

  const removeTrip = useCallback((originId: string, destinationId: string) => {
    const key = tripKey(originId, destinationId);
    setTrips(
      getSnapshot().filter((t) => tripKey(t.origin.stop_id, t.destination.stop_id) !== key)
    );
  }, []);

  const isSaved = useCallback(
    (originId: string, destinationId: string) =>
      savedTrips.some(
        (t) => tripKey(t.origin.stop_id, t.destination.stop_id) === tripKey(originId, destinationId)
      ),
    [savedTrips]
  );

  return { data: savedTrips, saveTrip, removeTrip, isSaved };
}
