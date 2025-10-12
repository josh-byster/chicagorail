import { ServiceAlert, AlertType, AlertSeverity } from '@metra/shared';
import { getRealtimeAlerts } from './gtfs-realtime.service.js';

/**
 * Alert Service
 *
 * Queries active service alerts from GTFS realtime data
 * Filters alerts by line or station if specified
 */

/**
 * Get all active service alerts
 * @param lineId - Optional line ID to filter alerts (optional)
 * @param stationId - Optional station ID to filter alerts (optional)
 * @returns Array of active service alerts
 */
export const getActiveAlerts = (
  lineId?: string,
  stationId?: string
): ServiceAlert[] => {
  const realtimeAlerts = getRealtimeAlerts();

  // Filter and transform alerts
  let filteredAlerts = realtimeAlerts;

  if (lineId) {
    filteredAlerts = filteredAlerts.filter(
      (alert) =>
        alert.affectedLines?.includes(lineId) || alert.routeId === lineId
    );
  }

  if (stationId) {
    filteredAlerts = filteredAlerts.filter(
      (alert) =>
        alert.affectedStations?.includes(stationId) ||
        alert.stopId === stationId
    );
  }

  // Transform to ServiceAlert objects
  return filteredAlerts.map((alert) => {
    return {
      alert_id: alert.id || alert.alertId || '',
      affected_lines: alert.affectedLines || alert.routeIds || [],
      affected_stations: alert.affectedStations || alert.stopIds || [],
      affected_trips: alert.affectedTrips || alert.tripIds || [],
      alert_type: alert.alertType || AlertType.INFORMATION,
      severity: alert.severity || AlertSeverity.INFO,
      header: alert.header || alert.title || '',
      description: alert.description || alert.body || '',
      start_time: alert.startTime || new Date().toISOString(),
      end_time: alert.endTime || undefined,
      url: alert.url || undefined,
    } as ServiceAlert;
  });
};
