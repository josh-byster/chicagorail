import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import type { Stop } from '@chicagorail/shared';

interface UseStopResult {
  stop: Stop | null;
  loading: boolean;
  error: string | null;
}

export function useStop(stopId: string | null): UseStopResult {
  const [data, setData] = useState<{
    stopId: string;
    stop: Stop;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!stopId) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    api.getDepartures(stopId, undefined, undefined, 1)
      .then((response) => {
        if (!cancelled) {
          setData({ stopId, stop: response.stop });
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load stop');
          setData(null);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [stopId]);

  if (!stopId) {
    return { stop: null, loading: false, error: null };
  }

  const stop = data?.stopId === stopId ? data.stop : null;
  return { stop, loading, error };
}
