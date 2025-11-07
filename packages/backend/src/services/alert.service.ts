import type { ServiceAlert } from '@metra/shared';
import { getRealtimeAlerts } from './gtfs-realtime.service.js';
import { transformRealtimeAlerts } from '../mappers/alert.mapper.js';

/**
 * Alert Service
 *
 * Queries active service alerts from GTFS realtime data
 * Filters alerts by line or station if specified
 */

/**
 * Get all active service alerts
 * @param lineId - Optional line ID to filter alerts
 * @param stationId - Optional station ID to filter alerts
 * @returns Array of active service alerts
 */
export const getActiveAlerts = (
  lineId?: string,
  stationId?: string
): ServiceAlert[] => {
  const realtimeAlerts = getRealtimeAlerts();

  // Transform to ServiceAlert objects first
  let alerts = transformRealtimeAlerts(realtimeAlerts);

  // Filter by line if specified
  if (lineId) {
    alerts = alerts.filter((alert) => alert.affected_lines?.includes(lineId));
  }

  // Filter by station if specified
  if (stationId) {
    alerts = alerts.filter((alert) =>
      alert.affected_stations?.includes(stationId)
    );
  }

  return alerts;
};
