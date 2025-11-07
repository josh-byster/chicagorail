/**
 * Alert Mapper
 *
 * Transforms GTFS realtime alert data to domain objects.
 * Single Responsibility: Data transformation for service alerts
 */

import type { ServiceAlert, AlertType, AlertSeverity } from '@metra/shared';
import {
  AlertType as AlertTypeEnum,
  AlertSeverity as AlertSeverityEnum,
} from '@metra/shared';
import type { RealtimeAlert } from '../services/gtfs-realtime.service.js';

/**
 * Transform GTFS realtime alert to ServiceAlert domain object
 *
 * @param realtimeAlert - Raw GTFS realtime alert data
 * @returns ServiceAlert domain object
 */
export const transformRealtimeAlert = (
  realtimeAlert: RealtimeAlert
): ServiceAlert => {
  const alert = realtimeAlert.alert;

  // Extract affected entities
  const affectedLines: string[] = [];
  const affectedStations: string[] = [];
  const affectedTrips: string[] = [];

  if (alert.informedEntity) {
    for (const entity of alert.informedEntity) {
      if (entity.routeId) {
        affectedLines.push(entity.routeId);
      }
      if (entity.stopId) {
        affectedStations.push(entity.stopId);
      }
      if (entity.trip?.tripId) {
        affectedTrips.push(entity.trip.tripId);
      }
    }
  }

  // Get header text (try different text fields)
  const headerText = alert.headerText?.translation?.[0]?.text || '';

  // Get description text (try different text fields)
  const descriptionText = alert.descriptionText?.translation?.[0]?.text || '';

  // Get URL if available
  const url = alert.url?.translation?.[0]?.text;

  // Determine alert type and severity from cause/effect
  let alertType: AlertType = AlertTypeEnum.INFORMATION;
  let severity: AlertSeverity = AlertSeverityEnum.INFO;

  // Map GTFS cause to alert type
  if (alert.cause) {
    switch (alert.cause) {
      case 1: // UNKNOWN_CAUSE
      case 2: // OTHER_CAUSE
        alertType = AlertTypeEnum.INFORMATION;
        break;
      case 3: // TECHNICAL_PROBLEM
      case 4: // STRIKE
      case 5: // DEMONSTRATION
        alertType = AlertTypeEnum.SCHEDULE_CHANGE;
        severity = AlertSeverityEnum.WARNING;
        break;
      case 6: // ACCIDENT
      case 7: // HOLIDAY
        alertType = AlertTypeEnum.DELAY;
        severity = AlertSeverityEnum.WARNING;
        break;
      case 8: // WEATHER
        alertType = AlertTypeEnum.WEATHER;
        severity = AlertSeverityEnum.WARNING;
        break;
      case 9: // MAINTENANCE
      case 10: // CONSTRUCTION
        alertType = AlertTypeEnum.CONSTRUCTION;
        severity = AlertSeverityEnum.WARNING;
        break;
      case 11: // POLICE_ACTIVITY
      case 12: // MEDICAL_EMERGENCY
        alertType = AlertTypeEnum.INCIDENT;
        severity = AlertSeverityEnum.SEVERE;
        break;
    }
  }

  // Map GTFS effect to alert type (if more specific)
  if (alert.effect) {
    switch (alert.effect) {
      case 1: // NO_SERVICE
        alertType = AlertTypeEnum.CANCELLATION;
        severity = AlertSeverityEnum.SEVERE;
        break;
      case 2: // REDUCED_SERVICE
        alertType = AlertTypeEnum.SCHEDULE_CHANGE;
        severity = AlertSeverityEnum.WARNING;
        break;
      case 3: // SIGNIFICANT_DELAYS
        alertType = AlertTypeEnum.DELAY;
        severity = AlertSeverityEnum.WARNING;
        break;
      case 4: // DETOUR
        alertType = AlertTypeEnum.DETOUR;
        severity = AlertSeverityEnum.WARNING;
        break;
      case 5: // ADDITIONAL_SERVICE
      case 6: // MODIFIED_SERVICE
        alertType = AlertTypeEnum.SCHEDULE_CHANGE;
        severity = AlertSeverityEnum.INFO;
        break;
      case 7: // OTHER_EFFECT
      case 8: // UNKNOWN_EFFECT
      case 9: // STOP_MOVED
        alertType = AlertTypeEnum.INFORMATION;
        severity = AlertSeverityEnum.INFO;
        break;
    }
  }

  return {
    alert_id: realtimeAlert.id,
    affected_lines: affectedLines,
    affected_stations: affectedStations,
    affected_trips: affectedTrips,
    alert_type: alertType,
    severity,
    header: headerText,
    description: descriptionText,
    start_time: alert.activePeriod?.[0]?.start?.toString()
      ? new Date(Number(alert.activePeriod[0].start) * 1000).toISOString()
      : new Date().toISOString(),
    end_time: alert.activePeriod?.[0]?.end?.toString()
      ? new Date(Number(alert.activePeriod[0].end) * 1000).toISOString()
      : undefined,
    url,
  };
};

/**
 * Transform multiple GTFS realtime alerts to ServiceAlert domain objects
 *
 * @param realtimeAlerts - Array of raw GTFS realtime alert data
 * @returns Array of ServiceAlert domain objects
 */
export const transformRealtimeAlerts = (
  realtimeAlerts: RealtimeAlert[]
): ServiceAlert[] => realtimeAlerts.map(transformRealtimeAlert);
