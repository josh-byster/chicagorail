/**
 * Saved page - trips and stations you use most
 */

import { Link } from 'react-router-dom';
import { BackLink } from '@/components/BackLink';
import { SavedTripCard } from '@/components/SavedTripCard';
import { useSavedTrips } from '@/hooks/useSavedTrips';
import { useRecentStops } from '@/hooks/useRecent';
import { useSEO } from '@/hooks/useSEO';

export function Saved() {
  const { data: savedTrips } = useSavedTrips();
  const { data: recentStops } = useRecentStops();

  useSEO({ title: 'Saved trips - Chicago Rail' });

  return (
    <div className="mx-auto flex w-full max-w-[720px] flex-col gap-[18px] px-5 pb-16 pt-7">
      <BackLink />

      <div className="flex flex-col gap-[3px]">
        <h1 className="text-2xl font-bold tracking-[-0.03em]">Saved</h1>
        <p className="text-[13px] text-muted-foreground">Trips and stations you use most</p>
      </div>

      <section className="flex flex-col gap-2">
        <h2 className="text-[10.5px] font-semibold uppercase tracking-[.1em] text-muted-foreground">
          Trips
        </h2>
        {savedTrips.length === 0 ? (
          <p className="text-[13px] text-muted-foreground">
            Save a trip from any set of results and it shows up here, with its next train.
          </p>
        ) : (
          savedTrips.map((trip) => (
            <SavedTripCard
              key={`${trip.origin.stop_id}-${trip.destination.stop_id}`}
              trip={trip}
            />
          ))
        )}
      </section>

      {recentStops.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-[10.5px] font-semibold uppercase tracking-[.1em] text-muted-foreground">
            Stations
          </h2>
          <div className="flex flex-wrap gap-1.5">
            {recentStops.map((stop) => (
              <Link
                key={stop.stop_id}
                to={`/?from=${encodeURIComponent(stop.stop_id)}`}
                className="inline-flex h-[30px] items-center rounded-full border border-border px-3.5 text-[13px] font-medium transition-colors hover:bg-foreground/5"
              >
                {stop.stop_name}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
