/**
 * Hook for managing recently viewed stops in localStorage
 */

import { useState, useEffect, useCallback } from 'react';
import type { Stop } from '@chicagorail/shared';
import { APP_CONFIG } from '@/config';
import { logger } from '@/shared/lib';

const { storage, limits } = APP_CONFIG;

export interface UseRecentStopsResult {
  data: Stop[];
  addRecentStop: (stop: Stop) => void;
  clearRecent: () => void;
}

/**
 * Manage recently viewed stops in localStorage
 *
 * Stores up to 5 most recent stops. New stops are added to the
 * front of the list, and duplicates are removed.
 */
export function useRecentStops(): UseRecentStopsResult {
  const [recentStops, setRecentStops] = useState<Stop[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storage.recentStops);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setRecentStops(parsed);
        }
      }
    } catch (error) {
      logger.error(
        'Failed to parse recent stops from localStorage',
        error instanceof Error ? error : undefined
      );
    }
  }, []);

  const addRecentStop = useCallback((stop: Stop) => {
    setRecentStops((prev) => {
      // Remove duplicate if exists
      const filtered = prev.filter((s) => s.stop_id !== stop.stop_id);
      // Add to front, limit to max
      const updated = [stop, ...filtered].slice(0, limits.maxRecentStops);

      // Persist to localStorage
      try {
        localStorage.setItem(storage.recentStops, JSON.stringify(updated));
      } catch (error) {
        logger.error(
          'Failed to save recent stops to localStorage',
          error instanceof Error ? error : undefined
        );
      }

      return updated;
    });
  }, []);

  const clearRecent = useCallback(() => {
    setRecentStops([]);
    try {
      localStorage.removeItem(storage.recentStops);
    } catch (error) {
      logger.error(
        'Failed to clear recent stops from localStorage',
        error instanceof Error ? error : undefined
      );
    }
  }, []);

  return {
    data: recentStops,
    addRecentStop,
    clearRecent,
  };
}
