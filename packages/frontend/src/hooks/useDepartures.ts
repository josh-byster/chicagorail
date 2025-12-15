import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import type { Stop, Departure } from '@chicagorail/shared';

export function useDepartures(stopId: string | null, routeFilter?: string, date?: string) {
  const [departures, setDepartures] = useState<Departure[]>([]);
  const [stop, setStop] = useState<Stop | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!stopId) return;

    const fetchDepartures = async () => {
      setLoading(true);
      try {
        const result = await api.getDepartures(stopId, routeFilter, date);
        setStop(result.stop);
        setDepartures(result.departures);
      } catch (error) {
        console.error('Failed to fetch departures:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDepartures();
    const interval = setInterval(fetchDepartures, 30000); // Refresh every 30s

    return () => clearInterval(interval);
  }, [stopId, routeFilter, date]);

  return { stop, departures, loading };
}
