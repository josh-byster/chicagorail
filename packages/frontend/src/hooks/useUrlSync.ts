import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useRouteSearchStore } from '@/stores/routeSearchStore';

/**
 * ONE-WAY sync: URL is the ONLY source of truth
 * - URL changes (navigation) -> update store
 * - Store NEVER updates URL automatically
 * - Components must update URL directly when user interacts
 */
export function useUrlSync() {
  const [searchParams] = useSearchParams();
  const { setRoute, clearRoute } = useRouteSearchStore();

  // Only sync FROM URL TO store
  useEffect(() => {
    const urlOrigin = searchParams.get('origin');
    const urlDestination = searchParams.get('destination');

    // Update store to match URL
    if (urlOrigin && urlDestination) {
      setRoute(urlOrigin, urlDestination);
    } else if (urlOrigin && !urlDestination) {
      setRoute(urlOrigin, '');
    } else {
      clearRoute();
    }
  }, [searchParams, setRoute, clearRoute]);
}
