import { describe, it, expect, beforeEach } from '@jest/globals';
import { GTFSService } from '../../src/services/gtfsService.js';

// One branch runs Monday, a different branch runs Sunday, and the reverse
// train skips the middle station. Shared route membership is not enough.
describe('direct station connections', () => {
  const service = GTFSService.getInstance();
  beforeEach(() => {
    const stops = ['A', 'B', 'C', 'D'].map(stop_id => ({ stop_id, stop_name: stop_id, stop_lat: 0, stop_lon: 0 }));
    const trips = [
      { trip_id: 'weekday', service_id: 'weekday', route_id: 'line' },
      { trip_id: 'sunday', service_id: 'sunday', route_id: 'line' },
      { trip_id: 'reverse', service_id: 'weekday', route_id: 'line' },
    ];
    const stopTimes = [
      ...['A', 'B', 'C'].map((stop_id, stop_sequence) => ({ trip_id: 'weekday', stop_id, stop_sequence })),
      ...['A', 'D'].map((stop_id, stop_sequence) => ({ trip_id: 'sunday', stop_id, stop_sequence })),
      ...['C', 'A'].map((stop_id, stop_sequence) => ({ trip_id: 'reverse', stop_id, stop_sequence })),
    ];
    Object.assign(service, {
      data: { stops, trips, stopTimes, serviceExceptions: [], servicePeriods: [
        { service_id: 'weekday', monday: 1, sunday: 0, start_date: '20260101', end_date: '20261231' },
        { service_id: 'sunday', monday: 0, sunday: 1, start_date: '20260101', end_date: '20261231' },
      ] },
      stopsByIdMap: new Map(stops.map(stop => [stop.stop_id, stop])),
      tripsByIdMap: new Map(trips.map(trip => [trip.trip_id, trip])),
    });
  });
  it('includes downstream stops only, excluding same station and inactive branches', async () => {
    const result = await service.getStopConnections('B', 'to', new Date('2026-09-14T12:00:00Z'));
    expect(result?.eligibleStopIds).toEqual(['C']);
    expect(result?.stops).toHaveLength(4);
  });
  it('reverses the check when selecting an origin', async () => {
    expect((await service.getStopConnections('B', 'from', new Date('2026-09-14T12:00:00Z')))?.eligibleStopIds).toEqual(['A']);
  });
  it('uses the chosen service date', async () => {
    expect((await service.getStopConnections('A', 'to', new Date('2026-09-13T12:00:00Z')))?.eligibleStopIds).toEqual(['D']);
  });
  it('honors service removal exceptions', async () => {
    (await service.getData()).serviceExceptions.push({ service_id: 'weekday', date: '20260914', exception_type: 2 });
    expect((await service.getStopConnections('A', 'to', new Date('2026-09-14T12:00:00Z')))?.eligibleStopIds).toEqual([]);
  });
  it('returns no result for an unknown station', async () => {
    expect(await service.getStopConnections('missing', 'to', new Date())).toBeNull();
  });
});
