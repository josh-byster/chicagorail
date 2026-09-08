/**
 * Home page
 *
 * One surface, three answers, all driven by the URL:
 * - no origin      -> the planner (From / To / Date) and saved trips
 * - origin only    -> the departures board for that station
 * - origin + dest  -> the trip answer
 */

import { useMemo } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { DepartureBoard } from '@/components/DepartureBoard';
import { LineFilter } from '@/components/LineFilter';
import { TripPlanner } from '@/components/TripPlanner';
import { TripsResults } from '@/components/TripsResults';
import { SavedTripCard } from '@/components/SavedTripCard';
import { LiveStatus } from '@/components/LiveStatus';
import { BackLink } from '@/components/BackLink';
import { Chip } from '@/components/Chip';
import { useStationPicker } from '@/hooks/useStationPicker';
import { useStop } from '@/hooks/useStop';
import { useDepartures } from '@/hooks/useDepartures';
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
    isPlanning,
    planLink,
    showResults,
    showBoard,
    setTo,
    setDate,
    setRoute,
    swap,
  } = useTripParams();

  const openPicker = useStationPicker();
  const { data: fromStop } = useStop(fromId);
  const { data: toStop } = useStop(toId);
  const { data: savedTrips } = useSavedTrips();

  const { data: routesAtOrigin } = useRoutesFromDepartures(fromId, dateString);
  const { dataUpdatedAt, refetch, isFetching } = useDepartures(fromId, {
    routeId,
    date: dateString,
  });

  const {
    data: trips,
    isLoading: tripsLoading,
    error: tripsError,
  } = useDirectTrips(fromId, toId, dateString);

  const showTrips = !!fromId && !!toId && !isPlanning;
  const showDepartures = !!fromId && !toId && !isPlanning;

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
      return {};
    }, [showTrips, showDepartures, fromStop, toStop])
  );

  const filteredTrips = useMemo(
    () => (routeId ? trips.filter((t) => t.route.route_id === routeId) : trips),
    [trips, routeId]
  );

  const tripRoutes = useMemo(
    () => Array.from(new Map(trips.map((t) => [t.route.route_id, t.route])).values()),
    [trips]
  );

  if (showDepartures) {
    return (
      <Screen>
        <div className="flex flex-col gap-3">
          <BackLink to={planLink} />
          <div className="flex items-end justify-between gap-4">
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              {isToday && <LiveStatus updatedAt={dataUpdatedAt} />}
              <h1 className="text-[26px] font-bold tracking-[-0.03em]">
                {fromStop?.stop_name ?? ' '}
              </h1>
              <p className="text-[13px] text-muted-foreground">
                {dateLabel}&rsquo;s departures
                {routesAtOrigin.length > 0
                  ? ` · ${routesAtOrigin.length} ${routesAtOrigin.length === 1 ? 'line' : 'lines'}`
                  : ''}
              </p>
            </div>
            <button
              type="button"
              onClick={() => refetch()}
              aria-label="Refresh departures"
              className="flex size-8 shrink-0 items-center justify-center rounded-[9px] border border-border transition-colors hover:bg-foreground/5"
            >
              <RefreshCw
                className={`size-[15px] text-ink-subtle ${isFetching ? 'animate-spin' : ''}`}
              />
            </button>
          </div>

          <LineFilter
            selectedRoute={routeId}
            onFilterChange={setRoute}
            stopId={fromId}
            date={dateString}
            suffix={
              <Chip dashed onClick={() => openPicker('to')}>
                <Plus className="size-3" />
                Add destination
              </Chip>
            }
          />
        </div>

        <DepartureBoard
          stopId={fromId}
          routeFilter={routeId}
          date={dateString}
          isToday={isToday}
        />
      </Screen>
    );
  }

  if (showTrips) {
    return (
      <Screen>
        <BackLink to={planLink} />
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[17px] font-semibold tracking-[-0.02em]">
            {fromStop?.stop_name ?? ' '}
          </span>
          <span aria-hidden="true" className="text-muted-foreground">
            &rarr;
          </span>
          <span className="text-[17px] font-semibold tracking-[-0.02em]">
            {toStop?.stop_name ?? ' '}
          </span>
          <button
            type="button"
            onClick={swap}
            className="ml-auto h-[30px] rounded-lg border border-border px-3 text-[12.5px] font-medium text-ink-subtle transition-colors hover:bg-foreground/5 hover:text-foreground"
          >
            Swap
          </button>
        </div>

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
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <div className="flex flex-col gap-1.5">
        <h1 className="text-[28px] font-bold tracking-[-0.03em]">Where are you going?</h1>
        <p className="text-sm text-muted-foreground">
          Leave the destination empty to see every train from your station.
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

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => (fromId ? showResults() : openPicker('from'))}
          className="h-[38px] rounded-[10px] bg-foreground px-[18px] text-[13.5px] font-semibold text-background transition-opacity hover:opacity-85"
        >
          See trains
        </button>
        <button
          type="button"
          onClick={() => (fromId ? showBoard() : openPicker('from'))}
          className="h-[38px] rounded-[10px] border border-border px-4 text-[13.5px] font-medium text-ink-subtle transition-colors hover:bg-foreground/5 hover:text-foreground"
        >
          Departures board
        </button>
      </div>

      {savedTrips.length > 0 && (
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
    </Screen>
  );
}

function Screen({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-[720px] flex-col gap-[22px] px-5 pb-16 pt-7">
      {children}
    </div>
  );
}
