/**
 * Home page
 *
 * One screen: the planner stays at the top and the answer appears under it
 * as soon as you've said enough to have one. What you fill in decides which
 * answer you get.
 *
 *   from only      -> everything leaving that station
 *   to only        -> everything arriving into that station
 *   from + to      -> the next train between them
 */

import { useMemo } from 'react';
import { RefreshCw } from 'lucide-react';
import { DepartureBoard } from '@/components/DepartureBoard';
import { ArrivalBoard } from '@/components/ArrivalBoard';
import { LineFilter } from '@/components/LineFilter';
import { TripPlanner } from '@/components/TripPlanner';
import { TripsResults } from '@/components/TripsResults';
import { SavedTripCard } from '@/components/SavedTripCard';
import { LiveStatus } from '@/components/LiveStatus';
import { useStop } from '@/hooks/useStop';
import { useDepartures } from '@/hooks/useDepartures';
import { useArrivals } from '@/hooks/useArrivals';
import { useDirectTrips } from '@/hooks/useTrips';
import { useRoutesFromDepartures } from '@/hooks/useRoutes';
import { useSavedTrips } from '@/hooks/useSavedTrips';
import { useTripParams } from '@/hooks/useTripParams';
import { useSEO } from '@/hooks/useSEO';

export function Home() {
  const {
    fromId,
    toId,
    routeId,
    selectedDate,
    dateString,
    isToday,
    isTomorrow,
    dateLabel,
    search,
    setTo,
    setDate,
    setRoute,
    swap,
  } = useTripParams();

  const { data: fromStop } = useStop(fromId);
  const { data: toStop } = useStop(toId);
  const { data: savedTrips } = useSavedTrips();
  const { data: routesAtOrigin } = useRoutesFromDepartures(fromId, dateString);

  const showTrips = !!fromId && !!toId;
  const showDepartures = !!fromId && !toId;
  const showArrivals = !fromId && !!toId;
  const isEmpty = !fromId && !toId;

  const departures = useDepartures(showDepartures ? fromId : null, {
    routeId,
    date: dateString,
  });
  const arrivals = useArrivals(showArrivals ? toId : null, { routeId, date: dateString });
  const board = showArrivals ? arrivals : departures;

  const {
    data: trips,
    isLoading: tripsLoading,
    error: tripsError,
  } = useDirectTrips(fromId, toId, dateString);

  useSEO(
    useMemo(() => {
      if (showTrips && fromStop && toStop) {
        return {
          title: `${fromStop.stop_name} to ${toStop.stop_name} - Metra Schedule`,
          description: `View Metra train schedule from ${fromStop.stop_name} to ${toStop.stop_name}. Find departure times, travel duration, and plan your Chicago commuter train trip.`,
        };
      }
      if (showDepartures && fromStop) {
        return {
          title: `${fromStop.stop_name} Departures - Metra Schedule`,
          description: `Metra departures from ${fromStop.stop_name} station. View upcoming trains, schedules, and plan your Chicago commuter rail connection.`,
        };
      }
      if (showArrivals && toStop) {
        return {
          title: `${toStop.stop_name} Arrivals - Metra Schedule`,
          description: `Metra trains arriving into ${toStop.stop_name} station, with live delays where Metra reports them.`,
        };
      }
      return {};
    }, [showTrips, showDepartures, showArrivals, fromStop, toStop])
  );

  const filteredTrips = useMemo(
    () => (routeId ? trips.filter((t) => t.route.route_id === routeId) : trips),
    [trips, routeId]
  );

  const tripRoutes = useMemo(
    () => Array.from(new Map(trips.map((t) => [t.route.route_id, t.route])).values()),
    [trips]
  );

  const boardStop = showArrivals ? toStop : fromStop;

  return (
    <div className="mx-auto flex w-full max-w-[720px] flex-col gap-[22px] px-5 pb-16 pt-7">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-[28px] font-bold tracking-[-0.03em]">Where are you going?</h1>
        <p className="text-sm text-muted-foreground">
          Fill in either end on its own for a whole board, or both for a trip.
        </p>
      </div>

      <TripPlanner
        fromStop={fromStop}
        toStop={toStop}
        fromRoutes={routesAtOrigin}
        selectedDate={selectedDate}
        isToday={isToday}
        isTomorrow={isTomorrow}
        onDateChange={setDate}
        onClearTo={() => setTo(null)}
        onSwap={swap}
      />

      {(showDepartures || showArrivals) && (
        // Keyed so the results animate again when the question changes
        <section
          key={`board-${fromId ?? ''}-${toId ?? ''}-${dateString}`}
          className="animate-results flex flex-col gap-3.5"
          aria-label={showArrivals ? 'Arrivals' : 'Departures'}
        >
          <div className="flex items-end justify-between gap-4">
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              {isToday && <LiveStatus updatedAt={board.dataUpdatedAt} />}
              <h2 className="text-[22px] font-bold tracking-[-0.03em]">
                {showArrivals ? 'Arriving into ' : 'Leaving '}
                {boardStop?.stop_name ?? '…'}
              </h2>
              <p className="text-[13px] text-muted-foreground">
                {dateLabel}
                {routesAtOrigin.length > 0 && showDepartures
                  ? ` · ${routesAtOrigin.length} ${routesAtOrigin.length === 1 ? 'line' : 'lines'}`
                  : ''}
              </p>
            </div>
            <button
              type="button"
              onClick={() => board.refetch()}
              aria-label="Refresh"
              className="flex size-8 shrink-0 items-center justify-center rounded-[9px] border border-border transition-colors hover:bg-foreground/5"
            >
              <RefreshCw
                className={`size-[15px] text-ink-subtle ${board.isFetching ? 'animate-spin' : ''}`}
              />
            </button>
          </div>

          <LineFilter
            selectedRoute={routeId}
            onFilterChange={setRoute}
            stopId={showArrivals ? (toId ?? undefined) : (fromId ?? undefined)}
            date={dateString}
            mode={showArrivals ? 'arrivals' : 'departures'}
          />

          {showArrivals ? (
            <ArrivalBoard
              stopId={toId}
              routeFilter={routeId}
              date={dateString}
              isToday={isToday}
              contextSearch={search}
            />
          ) : (
            <DepartureBoard
              stopId={fromId}
              routeFilter={routeId}
              date={dateString}
              isToday={isToday}
              contextSearch={search}
            />
          )}
        </section>
      )}

      {showTrips && (
        <section
          key={`trip-${fromId}-${toId}-${dateString}`}
          className="animate-results"
          aria-label={`Trains from ${fromStop?.stop_name ?? 'origin'} to ${toStop?.stop_name ?? 'destination'}`}
        >
          <TripsResults
            trips={trips}
            filteredTrips={filteredTrips}
            tripRoutes={tripRoutes}
            isLoading={tripsLoading}
            error={tripsError}
            selectedRoute={routeId}
            onRouteFilterChange={setRoute}
            fromStop={fromStop}
            toStop={toStop}
            dateLabel={dateLabel}
            isToday={isToday}
            contextSearch={search}
          />
        </section>
      )}

      {isEmpty && savedTrips.length > 0 && (
        <>
          <SavedTripCard trip={savedTrips[0]} variant="hero" />

          {savedTrips.length > 1 && (
            <section className="flex flex-col gap-2.5 pt-2.5">
              <h2 className="text-[10.5px] font-semibold uppercase tracking-[.1em] text-muted-foreground">
                Saved trips
              </h2>
              {savedTrips.slice(1).map((trip) => (
                <SavedTripCard
                  key={`${trip.origin.stop_id}-${trip.destination.stop_id}`}
                  trip={trip}
                />
              ))}
            </section>
          )}
        </>
      )}
    </div>
  );
}
