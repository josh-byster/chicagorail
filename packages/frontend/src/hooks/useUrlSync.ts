import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useRouteSearchStore } from '@/stores/routeSearchStore';

/**
 * Syncs the route search store with URL parameters
 * - Reads URL params on mount and updates store
 * - Updates URL when store changes
 */
export function useUrlSync() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { origin, destination, setRoute } = useRouteSearchStore();

  // Sync URL params to store on mount
  useEffect(() => {
    const urlOrigin = searchParams.get('origin');
    const urlDestination = searchParams.get('destination');

    if (urlOrigin && urlDestination) {
      setRoute(urlOrigin, urlDestination);
    }
  }, []);

  // Sync store to URL params when store changes
  useEffect(() => {
    if (origin && destination) {
      setSearchParams({ origin, destination }, { replace: true });
    } else if (!origin && !destination) {
      setSearchParams({}, { replace: true });
    }
  }, [origin, destination, setSearchParams]);
}
