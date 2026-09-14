import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { differenceInMinutes, format, parse } from 'date-fns';
import {
  ArrowRight,
  ChevronDown,
  Clock,
  MapPin,
  Ticket,
} from 'lucide-react';
import { Route, Stop, StopTimeWithStop, TripWithStops } from '../types/metra';
import { MetraService } from '../services/metraService';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ScheduleViewProps {
  selectedRoute: Route;
  selectedDate: Date;
  selectedStation: Stop | null;
}

const formatTrainTime = (time?: string) => {
  if (!time) return '—';
  const [rawHour, minute] = time.trim().split(':').map(Number);
  const hour = rawHour % 24;
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${String(minute).padStart(2, '0')} ${suffix}`;
};

const getDuration = (departure?: string, arrival?: string) => {
  if (!departure || !arrival) return '';
  const base = new Date(2000, 0, 1);
  const normalize = (value: string) => {
    const [rawHour, minute, second] = value.trim().split(':').map(Number);
    const date = parse(`${rawHour % 24}:${minute}:${second}`, 'H:m:s', base);
    if (rawHour >= 24) date.setDate(date.getDate() + 1);
    return date;
  };
  const minutes = differenceInMinutes(normalize(arrival), normalize(departure));
  if (minutes < 0) return '';
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)} hr ${minutes % 60} min`;
};

const TripCard = ({ trip, index, stationId }: { trip: TripWithStops; index: number; stationId?: string }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const stationIndex = stationId ? trip.stopTimes.findIndex((stop) => stop.stop_id === stationId) : 0;
  const relevantStops = trip.stopTimes.slice(Math.max(stationIndex, 0));
  const firstStop = relevantStops[0];
  const lastStop = trip.stopTimes[trip.stopTimes.length - 1];
  const destination = trip.trip_headsign || lastStop?.stopName || 'Final stop';

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.025, 0.18), duration: 0.2 }}
      className={`trip-card ${isExpanded ? 'is-expanded' : ''}`}
    >
      <button className="trip-summary" type="button" onClick={() => setIsExpanded((expanded) => !expanded)} aria-expanded={isExpanded}>
        <span className="departure-block"><small>Departs</small><strong>{formatTrainTime(firstStop?.departure_time)}</strong><span className="departure-origin">From {firstStop?.stopName || 'origin'}</span></span>
        <span className="trip-route-visual" aria-hidden="true"><span /><ArrowRight /></span>
        <span className="destination-block"><small>To</small><strong>{destination}</strong><span>{lastStop ? `Arrives ${formatTrainTime(lastStop.arrival_time)}` : ''}</span></span>
        <span className="trip-meta">
          <span><Clock /> {getDuration(firstStop?.departure_time, lastStop?.arrival_time)}</span>
          <span><MapPin /> {relevantStops.length} stops</span>
        </span>
        <span className="expand-control"><span>{isExpanded ? 'Hide stops' : 'View stops'}</span><ChevronDown /></span>
      </button>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="stop-details"
          >
            <div className="stop-list">
              {relevantStops.map((stop: StopTimeWithStop, stopIndex) => (
                <div className="stop-row" key={`${stop.stop_id}-${stop.stop_sequence}`}>
                  <div className="timeline-mark" aria-hidden="true"><span className={stopIndex === 0 || stopIndex === relevantStops.length - 1 ? 'endpoint' : ''} /></div>
                  <span className="stop-time">{formatTrainTime(stop.arrival_time)}</span>
                  <span className="stop-name">{stop.stopName}</span>
                  {(stopIndex === 0 || stopIndex === relevantStops.length - 1) && <Badge variant="outline">{stopIndex === 0 ? 'Board here' : 'Final stop'}</Badge>}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
};

export const ScheduleView = ({ selectedRoute, selectedDate, selectedStation }: ScheduleViewProps) => {
  const [trips, setTrips] = useState<TripWithStops[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [direction, setDirection] = useState<0 | 1>(0);
  const dateString = useMemo(() => format(selectedDate, 'yyyy-MM-dd'), [selectedDate]);

  const loadTrips = async () => {
    try {
      setLoading(true);
      setError(null);
      const service = MetraService.getInstance();
      service.setSelectedDate(selectedDate);
      setTrips(await service.getTripsByRoute(selectedRoute.route_id));
    } catch (loadError) {
      console.error('Error loading trips:', loadError);
      setError('We couldn’t load this schedule.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTrips(); }, [selectedRoute.route_id, dateString]);

  const departureValue = (trip: TripWithStops) => trip.stopTimes[0]?.departure_time?.trim() || '99:99:99';
  const servesSelectedStation = (trip: TripWithStops) => {
    if (!selectedStation) return true;
    const stationIndex = trip.stopTimes.findIndex((stop) => stop.stop_id === selectedStation.stop_id);
    return stationIndex >= 0 && stationIndex < trip.stopTimes.length - 1;
  };
  const tripDepartureValue = (trip: TripWithStops) => selectedStation
    ? trip.stopTimes.find((stop) => stop.stop_id === selectedStation.stop_id)?.departure_time?.trim() || '99:99:99'
    : departureValue(trip);
  const outboundTrips = trips.filter((trip) => trip.direction_id === 0 && servesSelectedStation(trip)).sort((a, b) => tripDepartureValue(a).localeCompare(tripDepartureValue(b)));
  const inboundTrips = trips.filter((trip) => trip.direction_id === 1 && servesSelectedStation(trip)).sort((a, b) => tripDepartureValue(a).localeCompare(tripDepartureValue(b)));
  const visibleTrips = direction === 0 ? outboundTrips : inboundTrips;
  const destinationSummary = (items: TripWithStops[]) => {
    const names = [...new Set(items.map((trip) => trip.trip_headsign || trip.stopTimes.at(-1)?.stopName).filter(Boolean))];
    return names.length ? names.slice(0, 2).join(' & ') : 'this direction';
  };

  return (
    <div>
      <header className="schedule-heading">
        <div className="line-identity">
          <span className="line-color" style={{ backgroundColor: `#${selectedRoute.route_color}` }} />
          <div><p className="eyebrow">{selectedStation ? `Departures from ${selectedStation.stop_name}` : 'Schedule for'}</p><h2>{selectedRoute.route_long_name}</h2><p>{selectedRoute.route_short_name} line · {format(selectedDate, 'EEEE, MMMM d')}</p></div>
        </div>
        <span className="step-number is-complete">2</span>
      </header>

      {!loading && !error && trips.length > 0 && (
        <Tabs value={String(direction)} onValueChange={(value) => setDirection(Number(value) as 0 | 1)}>
          <TabsList className="my-5 grid h-auto w-full grid-cols-2" aria-label="Travel direction">
            <TabsTrigger value="0" className="h-auto py-2">
              <span className="direction-tab-copy"><strong>Away from Chicago</strong><small>Toward {destinationSummary(outboundTrips)} · {outboundTrips.length} trains</small></span>
            </TabsTrigger>
            <TabsTrigger value="1" className="h-auto py-2">
              <span className="direction-tab-copy"><strong>Toward Chicago</strong><small>Toward {destinationSummary(inboundTrips)} · {inboundTrips.length} trains</small></span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      )}

      {loading && <div className="schedule-loading" aria-label="Loading train schedule"><Skeleton className="size-10 rounded-xl" /><p>Finding trains…</p><Skeleton className="h-1 w-28" /></div>}

      {error && (
        <Empty className="min-h-[390px]">
          <EmptyHeader><EmptyMedia variant="icon"><Ticket /></EmptyMedia><EmptyTitle>That schedule didn’t load</EmptyTitle><EmptyDescription>{error} Check the connection and try again.</EmptyDescription></EmptyHeader>
          <EmptyContent><Button variant="outline" onClick={loadTrips}>Try again</Button></EmptyContent>
        </Empty>
      )}

      {!loading && !error && trips.length === 0 && (
        <Empty className="min-h-[390px]">
          <EmptyHeader><EmptyMedia variant="icon"><Ticket /></EmptyMedia><EmptyTitle>No trains found for this date</EmptyTitle><EmptyDescription>There may be no scheduled service, or the local schedule data may not cover {format(selectedDate, 'MMMM d, yyyy')}.</EmptyDescription></EmptyHeader>
          <EmptyContent><p className="message-hint">Try another date using the controls above.</p></EmptyContent>
        </Empty>
      )}

      {!loading && !error && trips.length > 0 && visibleTrips.length === 0 && (
        <div className="schedule-message compact"><h3>No trains in this direction</h3><p>Try the other direction for available departures.</p></div>
      )}

      {!loading && !error && visibleTrips.length > 0 && (
        <motion.div key={direction} initial={{ opacity: 0, x: direction === 0 ? -6 : 6 }} animate={{ opacity: 1, x: 0 }} className="trips-section">
          <div className="list-heading"><span>Departure</span><span>Trip details</span><span>Duration</span></div>
          <div className="trip-list">{visibleTrips.map((trip, index) => <TripCard key={trip.trip_id} trip={trip} index={index} stationId={selectedStation?.stop_id} />)}</div>
        </motion.div>
      )}
    </div>
  );
};
