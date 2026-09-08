import { describe, it, expect } from '@jest/globals';
import GtfsRealtimeBindings from 'gtfs-realtime-bindings';
import type { Departure, DirectTrip, GetTripDetailsResponse } from '@chicagorail/shared';
import {
  parseTripUpdates,
  parseVehiclePositions,
  type RealtimeSnapshot,
} from '../../src/services/realtimeService';
import {
  enrichDepartures,
  enrichDirectTrips,
  enrichTripDetails,
} from '../../src/services/realtimeEnrichment';

const { transit_realtime: transitRealtime } = GtfsRealtimeBindings;

/** Encode a feed the way Metra's endpoint would return it */
function encodeFeed(entities: unknown[]): Uint8Array {
  return transitRealtime.FeedMessage.encode(
    transitRealtime.FeedMessage.create({
      header: { gtfsRealtimeVersion: '2.0', timestamp: 1_757_000_000 },
      entity: entities as never,
    })
  ).finish();
}

function tripUpdateFeed(
  tripId: string,
  stopTimeUpdate: unknown[],
  extra: Record<string, unknown> = {}
): Uint8Array {
  return encodeFeed([
    {
      id: tripId,
      tripUpdate: { trip: { tripId }, stopTimeUpdate, ...extra },
    },
  ]);
}

const route = {
  route_id: 'BNSF',
  route_short_name: 'BNSF',
  route_long_name: 'Burlington Northern',
  route_desc: '',
  route_color: '29C233',
  route_text_color: '000000',
  route_url: '',
};

const stop = (stop_id: string, stop_name: string) => ({
  stop_id,
  stop_name,
  stop_desc: '',
  stop_lat: 41.8,
  stop_lon: -87.6,
  wheelchair_boarding: 1,
});

function snapshotOf(
  trips: Uint8Array = encodeFeed([]),
  vehicles: Uint8Array = encodeFeed([])
): RealtimeSnapshot {
  return {
    trips: parseTripUpdates(trips),
    vehicles: parseVehiclePositions(vehicles),
    fetchedAt: Date.now(),
  };
}

describe('parseTripUpdates', () => {
  it('indexes stop predictions by stop id and by sequence', () => {
    const trips = parseTripUpdates(
      tripUpdateFeed('BNSF_BN1201_V2_A', [
        { stopId: 'CUS', stopSequence: 1, departure: { delay: 240 } },
        { stopId: 'HINSDALE', stopSequence: 5, arrival: { delay: 300 } },
      ])
    );

    const trip = trips.get('BNSF_BN1201_V2_A');
    expect(trip?.byStopId.get('CUS')?.delay).toBe(240);
    expect(trip?.byStopSequence.get(5)?.delay).toBe(300);
    expect(trip?.canceled).toBe(false);
  });

  it('marks canceled trips', () => {
    const trips = parseTripUpdates(
      encodeFeed([
        {
          id: 'x',
          tripUpdate: {
            trip: {
              tripId: 'BNSF_BN1201_V2_A',
              scheduleRelationship:
                transitRealtime.TripDescriptor.ScheduleRelationship.CANCELED,
            },
            stopTimeUpdate: [],
          },
        },
      ])
    );

    expect(trips.get('BNSF_BN1201_V2_A')?.canceled).toBe(true);
  });

  it('ignores updates that identify no trip', () => {
    const trips = parseTripUpdates(
      encodeFeed([{ id: 'x', tripUpdate: { trip: { routeId: 'BNSF' }, stopTimeUpdate: [] } }])
    );
    expect(trips.size).toBe(0);
  });
});

describe('parseVehiclePositions', () => {
  it('reads position, sequence and status', () => {
    const vehicles = parseVehiclePositions(
      encodeFeed([
        {
          id: 'v1',
          vehicle: {
            trip: { tripId: 'BNSF_BN1201_V2_A' },
            position: { latitude: 41.87, longitude: -87.79 },
            currentStopSequence: 7,
            currentStatus: transitRealtime.VehiclePosition.VehicleStopStatus.IN_TRANSIT_TO,
            timestamp: 1_757_000_100,
          },
        },
      ])
    );

    const vehicle = vehicles.get('BNSF_BN1201_V2_A');
    expect(vehicle?.latitude).toBeCloseTo(41.87, 5);
    expect(vehicle?.currentStopSequence).toBe(7);
    expect(vehicle?.currentStatus).toBe('in_transit_to');
    expect(vehicle?.timestamp).toBe(1_757_000_100);
  });
});

describe('enrichDepartures', () => {
  const departure: Departure = {
    route,
    trip_headsign: 'Aurora',
    departure_time: '2026-09-08T22:14:00.000Z',
    arrival_time: '2026-09-08T22:14:00.000Z',
    direction: 'outbound',
    trip_id: 'BNSF_BN1201_V2_A',
  };

  it('applies the feed delay to the scheduled time', () => {
    const [enriched] = enrichDepartures(
      [departure],
      'CUS',
      snapshotOf(
        tripUpdateFeed('BNSF_BN1201_V2_A', [
          { stopId: 'CUS', stopSequence: 1, departure: { delay: 240 } },
        ])
      )
    );

    expect(enriched.realtime).toEqual({
      delay_seconds: 240,
      predicted_time: '2026-09-08T22:18:00.000Z',
      status: 'late',
    });
  });

  it('prefers an absolute predicted time when the feed sends one', () => {
    const [enriched] = enrichDepartures(
      [departure],
      'CUS',
      snapshotOf(
        tripUpdateFeed('BNSF_BN1201_V2_A', [
          { stopId: 'CUS', stopSequence: 1, departure: { delay: 240, time: 1_757_369_700 } },
        ])
      )
    );

    expect(enriched.realtime?.predicted_time).toBe(new Date(1_757_369_700_000).toISOString());
  });

  it('counts a sub-minute delay as on time, and a negative one as early', () => {
    const onTime = enrichDepartures(
      [departure],
      'CUS',
      snapshotOf(
        tripUpdateFeed('BNSF_BN1201_V2_A', [{ stopId: 'CUS', departure: { delay: 30 } }])
      )
    )[0];
    const early = enrichDepartures(
      [departure],
      'CUS',
      snapshotOf(
        tripUpdateFeed('BNSF_BN1201_V2_A', [{ stopId: 'CUS', departure: { delay: -120 } }])
      )
    )[0];

    expect(onTime.realtime?.status).toBe('on_time');
    expect(early.realtime?.status).toBe('early');
  });

  it('leaves rows untouched when the trip is canceled or absent from the feed', () => {
    const missing = enrichDepartures([departure], 'CUS', snapshotOf())[0];
    expect(missing.realtime).toBeUndefined();

    const canceled = enrichDepartures(
      [departure],
      'CUS',
      snapshotOf(
        tripUpdateFeed('BNSF_BN1201_V2_A', [{ stopId: 'CUS', departure: { delay: 600 } }], {
          trip: {
            tripId: 'BNSF_BN1201_V2_A',
            scheduleRelationship:
              transitRealtime.TripDescriptor.ScheduleRelationship.CANCELED,
          },
        })
      )
    )[0];
    expect(canceled.realtime).toBeUndefined();
  });

  it('returns the scheduled rows unchanged when no feed has been fetched', () => {
    const empty: RealtimeSnapshot = { trips: new Map(), vehicles: new Map(), fetchedAt: null };
    expect(enrichDepartures([departure], 'CUS', empty)[0]).toBe(departure);
  });
});

describe('enrichDirectTrips', () => {
  it('predicts both the origin departure and the destination arrival', () => {
    const trip: DirectTrip = {
      route,
      trip_id: 'BNSF_BN1201_V2_A',
      trip_headsign: 'Aurora',
      origin_departure: '2026-09-08T22:14:00.000Z',
      destination_arrival: '2026-09-08T22:52:00.000Z',
      duration_minutes: 38,
    };

    const [enriched] = enrichDirectTrips(
      [trip],
      'CUS',
      'NAPERVILLE',
      snapshotOf(
        tripUpdateFeed('BNSF_BN1201_V2_A', [
          { stopId: 'CUS', stopSequence: 1, departure: { delay: 120 } },
          { stopId: 'NAPERVILLE', stopSequence: 9, arrival: { delay: 180 } },
        ])
      )
    );

    expect(enriched.realtime?.delay_seconds).toBe(120);
    expect(enriched.realtime_arrival?.predicted_time).toBe('2026-09-08T22:55:00.000Z');
  });

  it('carries the origin delay to a destination the feed did not enumerate', () => {
    const trip: DirectTrip = {
      route,
      trip_id: 'BNSF_BN1201_V2_A',
      trip_headsign: 'Aurora',
      origin_departure: '2026-09-08T22:14:00.000Z',
      destination_arrival: '2026-09-08T22:52:00.000Z',
      duration_minutes: 38,
    };

    const [enriched] = enrichDirectTrips(
      [trip],
      'CUS',
      'NAPERVILLE',
      snapshotOf(
        tripUpdateFeed('BNSF_BN1201_V2_A', [
          { stopId: 'CUS', stopSequence: 1, departure: { delay: 240 } },
        ])
      )
    );

    expect(enriched.realtime_arrival).toEqual({
      delay_seconds: 240,
      predicted_time: '2026-09-08T22:56:00.000Z',
      status: 'late',
    });
  });
});

describe('enrichTripDetails', () => {
  const details: GetTripDetailsResponse = {
    trip_id: 'BNSF_BN1201_V2_A',
    route,
    trip_headsign: 'Aurora',
    direction: 'outbound',
    stops: [
      {
        stop: stop('CUS', 'Chicago Union Station'),
        arrival_time: '2026-09-08T22:14:00.000Z',
        departure_time: '2026-09-08T22:14:00.000Z',
        stop_sequence: 1,
      },
      {
        stop: stop('LAGRANGE', 'LaGrange Road'),
        arrival_time: '2026-09-08T22:26:00.000Z',
        departure_time: '2026-09-08T22:26:00.000Z',
        stop_sequence: 2,
      },
      {
        stop: stop('HINSDALE', 'Hinsdale'),
        arrival_time: '2026-09-08T22:33:00.000Z',
        departure_time: '2026-09-08T22:33:00.000Z',
        stop_sequence: 3,
      },
    ],
  };

  it('carries a delay forward to stops the feed did not enumerate', () => {
    const enriched = enrichTripDetails(
      details,
      snapshotOf(
        tripUpdateFeed('BNSF_BN1201_V2_A', [
          { stopId: 'CUS', stopSequence: 1, departure: { delay: 300, time: 1_757_369_700 } },
        ])
      )
    );

    // Later stops inherit the delay but not the first stop's absolute time
    expect(enriched.stops[1].realtime).toEqual({
      delay_seconds: 300,
      predicted_time: '2026-09-08T22:31:00.000Z',
      status: 'late',
    });
    expect(enriched.stops[2].realtime?.predicted_time).toBe('2026-09-08T22:38:00.000Z');
  });

  it('falls back to the trip-level delay when no stop is enumerated', () => {
    const enriched = enrichTripDetails(
      details,
      snapshotOf(tripUpdateFeed('BNSF_BN1201_V2_A', [], { delay: 60 }))
    );

    expect(enriched.stops[0].realtime?.delay_seconds).toBe(60);
    expect(enriched.stops[0].realtime?.status).toBe('late');
  });

  it('attaches the vehicle position', () => {
    const enriched = enrichTripDetails(
      details,
      snapshotOf(
        encodeFeed([]),
        encodeFeed([
          {
            id: 'v1',
            vehicle: {
              trip: { tripId: 'BNSF_BN1201_V2_A' },
              position: { latitude: 41.87, longitude: -87.79 },
              currentStopSequence: 2,
              currentStatus: transitRealtime.VehiclePosition.VehicleStopStatus.STOPPED_AT,
              timestamp: 1_757_000_100,
            },
          },
        ])
      )
    );

    expect(enriched.vehicle).toEqual({
      latitude: expect.closeTo(41.87, 5),
      longitude: expect.closeTo(-87.79, 5),
      current_stop_sequence: 2,
      current_status: 'stopped_at',
      timestamp: new Date(1_757_000_100_000).toISOString(),
    });
  });

  it('returns the scheduled trip unchanged when no feed has been fetched', () => {
    const empty: RealtimeSnapshot = { trips: new Map(), vehicles: new Map(), fetchedAt: null };
    expect(enrichTripDetails(details, empty)).toBe(details);
  });
});
