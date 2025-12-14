import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import type { Stop } from '@chicagorail/shared';

export function useStationSearch(query: string) {
  const [stops, setStops] = useState<Stop[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query.length < 2) {
      setStops([]);
      return;
    }

    const search = async () => {
      setLoading(true);
      try {
        const result = await api.searchStops(query);
        setStops(result.stops);
      } catch (error) {
        console.error('Search failed:', error);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(search, 150);
    return () => clearTimeout(debounce);
  }, [query]);

  return { stops, loading };
}
