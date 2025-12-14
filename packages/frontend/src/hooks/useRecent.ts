import { useState, useEffect } from 'react';
import type { Stop } from '@chicagorail/shared';

const RECENT_STOPS_KEY = 'chicagorail:recent-stops';
const MAX_RECENT = 5;

export function useRecentStops() {
  const [recentStops, setRecentStops] = useState<Stop[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(RECENT_STOPS_KEY);
    if (stored) {
      try {
        setRecentStops(JSON.parse(stored));
      } catch (error) {
        console.error('Failed to parse recent stops:', error);
      }
    }
  }, []);

  const addRecentStop = (stop: Stop) => {
    setRecentStops(prev => {
      const filtered = prev.filter(s => s.stop_id !== stop.stop_id);
      const updated = [stop, ...filtered].slice(0, MAX_RECENT);
      localStorage.setItem(RECENT_STOPS_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const clearRecent = () => {
    setRecentStops([]);
    localStorage.removeItem(RECENT_STOPS_KEY);
  };

  return { recentStops, addRecentStop, clearRecent };
}
