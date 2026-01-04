import type { DirectTrip } from '@chicagorail/shared';
import { utils } from '@chicagorail/shared';
import { TimeCard } from './TimeCard';

interface TripCardProps {
  trip: DirectTrip;
}

export function TripCard({ trip }: TripCardProps) {
  return (
    <TimeCard
      time={trip.origin_departure}
      routeColor={trip.route.route_color}
      subtitle={<>arr. {utils.formatTime(trip.destination_arrival)}</>}
    />
  );
}
