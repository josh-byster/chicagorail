/**
 * Trip state lives in the URL: ?from=&to=&date=&route=
 */

import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { format, parse, isValid, addDays, isSameDay } from 'date-fns';
import { APP_CONFIG } from '@/config';
import { useRecentStops } from '@/hooks/useRecent';
import type { Stop } from '@chicagorail/shared';

type ParamUpdates = {
  from?: string | null;
  to?: string | null;
  date?: string | null;
  route?: string | null;
};

export interface UseTripParamsResult {
  fromId: string | null;
  toId: string | null;
  routeId: string | undefined;
  selectedDate: Date;
  dateString: string;
  isToday: boolean;
  isTomorrow: boolean;
  /** "Today" / "Tomorrow" / "Tuesday, September 8" */
  dateLabel: string;
  /** The current query as a query string, for links that come back to it */
  search: string;
  setFrom: (stop: Stop | null) => void;
  setTo: (stop: Stop | null) => void;
  setDate: (date: Date | undefined) => void;
  setRoute: (routeId: string | undefined) => void;
  swap: () => void;
}

export function useTripParams(): UseTripParamsResult {
  const [searchParams, setSearchParams] = useSearchParams();
  const { addRecentStop } = useRecentStops();

  const fromId = searchParams.get('from');
  const toId = searchParams.get('to');
  const dateParam = searchParams.get('date');
  const routeId = searchParams.get('route') ?? undefined;

  const selectedDate = useMemo(() => {
    if (!dateParam) return new Date();
    const parsed = parse(dateParam, APP_CONFIG.dateFormats.url, new Date());
    // parse() returns Invalid Date for malformed input rather than throwing
    return isValid(parsed) ? parsed : new Date();
  }, [dateParam]);

  const dateString = format(selectedDate, APP_CONFIG.dateFormats.url);
  const isToday = isSameDay(selectedDate, new Date());
  const isTomorrow = isSameDay(selectedDate, addDays(new Date(), 1));
  const dateLabel = isToday
    ? 'Today'
    : isTomorrow
      ? 'Tomorrow'
      : format(selectedDate, APP_CONFIG.dateFormats.display);

  const updateUrl = useCallback(
    (updates: ParamUpdates, replace = false) => {
      setSearchParams((prev) => {
        const params = new URLSearchParams(prev);

        Object.entries(updates).forEach(([key, value]) => {
          if (value === null) {
            params.delete(key);
          } else if (value !== undefined) {
            params.set(key, value);
          }
        });

        // Today is the default, so keep it out of the URL
        if (params.get('date') === format(new Date(), APP_CONFIG.dateFormats.url)) {
          params.delete('date');
        }

        return params;
      }, { replace });
    },
    [setSearchParams]
  );

  const setFrom = useCallback(
    (stop: Stop | null) => {
      if (stop) addRecentStop(stop);
      updateUrl({ from: stop?.stop_id ?? null, route: null });
    },
    [updateUrl, addRecentStop]
  );

  const setTo = useCallback(
    (stop: Stop | null) => {
      if (stop) addRecentStop(stop);
      updateUrl({ to: stop?.stop_id ?? null, route: null });
    },
    [updateUrl, addRecentStop]
  );

  const setDate = useCallback(
    (date: Date | undefined) => {
      if (date) updateUrl({ date: format(date, APP_CONFIG.dateFormats.url) }, true);
    },
    [updateUrl]
  );

  const setRoute = useCallback(
    (route: string | undefined) => updateUrl({ route: route ?? null }, true),
    [updateUrl]
  );

  const swap = useCallback(() => {
    updateUrl({ from: toId, to: fromId, route: null });
  }, [updateUrl, fromId, toId]);

  const search = useMemo(() => {
    const query = searchParams.toString();
    return query ? `?${query}` : '';
  }, [searchParams]);

  return {
    fromId,
    toId,
    routeId,
    selectedDate,
    dateString,
    isToday,
    isTomorrow,
    dateLabel,
    search,
    setFrom,
    setTo,
    setDate,
    setRoute,
    swap,
  };
}
