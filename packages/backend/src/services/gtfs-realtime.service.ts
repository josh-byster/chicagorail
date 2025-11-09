import { env } from '../config/env.js';
import GtfsRealtimeBindings from 'gtfs-realtime-bindings';

/**
 * GTFS Realtime Polling Service
 *
 * Polls Metra's GTFS realtime endpoints every 30 seconds
 * Uses If-Modified-Since headers for efficient polling
 * Fetches alerts, trip updates, and vehicle positions
 * Now uses Protocol Buffer format (GTFS-RT standard) instead of JSON
 */

interface GTFSRealtimeConfig {
  apiToken: string;
  alertsUrl: string;
  tripUpdatesUrl: string;
  positionsUrl: string;
  pollInterval: number;
}

/**
 * Check if realtime features are enabled (API token and URLs are configured)
 */
export const isRealtimeEnabled = (): boolean => {
  return !!(
    env.METRA_API_TOKEN &&
    env.GTFS_REALTIME_ALERTS_URL &&
    env.GTFS_REALTIME_TRIP_UPDATES_URL &&
    env.GTFS_REALTIME_POSITIONS_URL
  );
};

// Lazy config getter - only access env when needed
const getConfig = (): GTFSRealtimeConfig | null => {
  if (!isRealtimeEnabled()) {
    return null;
  }
  return {
    apiToken: env.METRA_API_TOKEN!,
    alertsUrl: env.GTFS_REALTIME_ALERTS_URL!,
    tripUpdatesUrl: env.GTFS_REALTIME_TRIP_UPDATES_URL!,
    positionsUrl: env.GTFS_REALTIME_POSITIONS_URL!,
    pollInterval: 30000, // 30 seconds
  };
};

// Helper to create Bearer token header
const getAuthHeader = (): { Authorization: string } | null => {
  const config = getConfig();
  if (!config) {
    return null;
  }
  return { Authorization: `Bearer ${config.apiToken}` };
};

// Fetch GTFS realtime data with If-Modified-Since header
// Now parses Protocol Buffer format instead of JSON
const fetchRealtimeEndpoint = async (
  url: string,
  lastModified?: string | null
): Promise<{
  data: GtfsRealtimeBindings.transit_realtime.FeedMessage | null;
  lastModified: string | null;
}> => {
  const authHeader = getAuthHeader();
  if (!authHeader) {
    throw new Error('Realtime features are not enabled (missing API token)');
  }

  const headers: Record<string, string> = {
    ...authHeader,
    Accept: 'application/x-protobuf', // Request protobuf format
  };

  // Add If-Modified-Since header if we have a previous timestamp
  if (lastModified) {
    headers['If-Modified-Since'] = lastModified;
  }

  const response = await fetch(url, { headers });

  if (response.status === 304) {
    // Not modified - no new data
    return { data: null, lastModified: null };
  }

  if (!response.ok) {
    throw new Error(
      `Failed to fetch realtime data: ${response.status} ${response.statusText}`
    );
  }

  // Get the Last-Modified header from response for next request
  const newLastModified = response.headers.get('Last-Modified');

  // Parse Protocol Buffer format
  const buffer = await response.arrayBuffer();
  const feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(
    new Uint8Array(buffer)
  );

  return { data: feed, lastModified: newLastModified };
};

// Store last modified timestamps for each endpoint
let lastAlertsModified: string | null = null;
let lastTripUpdatesModified: string | null = null;
let lastPositionsModified: string | null = null;

/**
 * Simplified interfaces for realtime data extraction
 * These represent the processed data from GTFS-RT entities
 */
export interface RealtimeAlert {
  id: string;
  alert: GtfsRealtimeBindings.transit_realtime.IAlert;
}

export interface RealtimeTripUpdate {
  tripId: string;
  delay?: number | null;
  stopTimeUpdates?:
    | GtfsRealtimeBindings.transit_realtime.TripUpdate.IStopTimeUpdate[]
    | null;
}

// Use the actual GTFS-RT VehiclePosition type from the protobuf library
export type RealtimeVehiclePosition =
  GtfsRealtimeBindings.transit_realtime.IVehiclePosition;

// Store realtime data in memory
// Extract the actual data from GTFS-RT entity structure
let realtimeAlerts: RealtimeAlert[] = [];
let realtimeTripUpdates: RealtimeTripUpdate[] = [];
let realtimeVehiclePositions: RealtimeVehiclePosition[] = [];

/**
 * Poll GTFS realtime data
 * Fetches alerts, trip updates, and vehicle positions
 */
export const pollGTFSRealtimeData = async (): Promise<void> => {
  if (!isRealtimeEnabled()) {
    console.log('⏩ Realtime features disabled (no API token configured)');
    return;
  }

  console.log('📡 Polling GTFS realtime data...');

  const config = getConfig();
  if (!config) {
    console.log('⏩ Realtime features disabled (no API token configured)');
    return;
  }

  try {
    // Fetch alerts
    console.log('  ⏳ Fetching service alerts...');
    const alertsResponse = await fetchRealtimeEndpoint(
      config.alertsUrl,
      lastAlertsModified
    );

    if (alertsResponse.data) {
      console.log('  💾 Processing alerts data...');
      // Extract alerts from protobuf structure
      // FeedMessage.entity[] -> each entity has an alert field
      realtimeAlerts = alertsResponse.data.entity
        .filter((e) => e.alert != null)
        .map((e) => ({ id: e.id || '', alert: e.alert! }));
      lastAlertsModified = alertsResponse.lastModified;
      console.log(`    ✓ Processed ${realtimeAlerts.length} alerts`);
    } else {
      console.log('  ⏩ Alerts not modified since last fetch');
    }

    // Fetch trip updates
    console.log('  ⏳ Fetching trip updates...');
    const tripUpdatesResponse = await fetchRealtimeEndpoint(
      config.tripUpdatesUrl,
      lastTripUpdatesModified
    );

    if (tripUpdatesResponse.data) {
      console.log('  💾 Processing trip updates data...');
      // Extract trip updates from protobuf structure
      // FeedMessage.entity[] -> each entity has a tripUpdate field
      realtimeTripUpdates = tripUpdatesResponse.data.entity
        .filter((e) => e.tripUpdate != null)
        .map((e) => ({
          tripId: e.tripUpdate?.trip?.tripId || '',
          delay: e.tripUpdate?.delay,
          stopTimeUpdates: e.tripUpdate?.stopTimeUpdate,
        }));
      lastTripUpdatesModified = tripUpdatesResponse.lastModified;
      console.log(`    ✓ Processed ${realtimeTripUpdates.length} trip updates`);
    } else {
      console.log('  ⏩ Trip updates not modified since last fetch');
    }

    // Fetch vehicle positions
    console.log('  ⏳ Fetching vehicle positions...');
    const positionsResponse = await fetchRealtimeEndpoint(
      config.positionsUrl,
      lastPositionsModified
    );

    if (positionsResponse.data) {
      console.log('  💾 Processing vehicle positions data...');
      // Extract vehicle positions from protobuf structure
      // FeedMessage.entity[] -> each entity has a vehicle field
      realtimeVehiclePositions = positionsResponse.data.entity
        .filter((e) => e.vehicle != null)
        .map((e) => e.vehicle!);
      lastPositionsModified = positionsResponse.lastModified;
      console.log(
        `    ✓ Processed ${realtimeVehiclePositions.length} vehicle positions`
      );
    } else {
      console.log('  ⏩ Vehicle positions not modified since last fetch');
    }

    console.log('✅ GTFS realtime polling cycle complete!');
  } catch (error) {
    console.error('❌ GTFS realtime polling failed:', error);
    // Don't throw - keep polling service running even if one cycle fails
  }
};

/**
 * Get realtime alerts data
 * @returns Array of realtime alerts
 */
export const getRealtimeAlerts = (): RealtimeAlert[] => {
  return realtimeAlerts;
};

/**
 * Get realtime trip updates data
 * @returns Array of realtime trip updates
 */
export const getRealtimeTripUpdates = (): RealtimeTripUpdate[] => {
  return realtimeTripUpdates;
};

/**
 * Get realtime vehicle positions data
 * @returns Array of realtime vehicle positions
 */
export const getRealtimeVehiclePositions = (): RealtimeVehiclePosition[] => {
  return realtimeVehiclePositions;
};

/**
 * Start GTFS realtime polling service
 * Polls data every 30 seconds
 */
export const startGTFSRealtimePolling = (): void => {
  if (!isRealtimeEnabled()) {
    console.log('⏩ Realtime polling disabled (no API token configured)');
    return;
  }

  const config = getConfig();
  if (!config) {
    console.log('⏩ Realtime polling disabled (no API token configured)');
    return;
  }

  console.log('🚀 Starting GTFS realtime polling service...');

  // Initial poll
  pollGTFSRealtimeData().catch(console.error);

  // Set up interval polling
  setInterval(() => {
    pollGTFSRealtimeData().catch(console.error);
  }, config.pollInterval);

  console.log(`⏱️  Polling interval set to ${config.pollInterval}ms`);
};
