import { env } from '../config/env';

/**
 * GTFS Realtime Polling Service
 *
 * Polls Metra's GTFS realtime endpoints every 30 seconds
 * Uses If-Modified-Since headers for efficient polling
 * Fetches alerts, trip updates, and vehicle positions
 */

interface GTFSRealtimeConfig {
  username: string;
  password: string;
  alertsUrl: string;
  tripUpdatesUrl: string;
  positionsUrl: string;
  pollInterval: number;
}

// Lazy config getter - only access env when needed
const getConfig = (): GTFSRealtimeConfig => ({
  username: env.METRA_API_USERNAME,
  password: env.METRA_API_PASSWORD,
  alertsUrl: env.GTFS_REALTIME_ALERTS_URL,
  tripUpdatesUrl: env.GTFS_REALTIME_TRIP_UPDATES_URL,
  positionsUrl: env.GTFS_REALTIME_POSITIONS_URL,
  pollInterval: 30000, // 30 seconds
});

// Helper to create Basic Auth header
const getAuthHeader = (): { Authorization: string } => {
  const config = getConfig();
  const auth = Buffer.from(`${config.username}:${config.password}`).toString(
    'base64'
  );
  return { Authorization: `Basic ${auth}` };
};

// Fetch GTFS realtime data with If-Modified-Since header
const fetchRealtimeEndpoint = async (
  url: string,
  lastModified?: string | null
): Promise<{ data: any; lastModified: string | null }> => {
  const headers: any = {
    ...getAuthHeader(),
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

  const data = await response.json();
  return { data, lastModified: newLastModified };
};

// Store last modified timestamps for each endpoint
let lastAlertsModified: string | null = null;
let lastTripUpdatesModified: string | null = null;
let lastPositionsModified: string | null = null;

// Store realtime data in memory
let realtimeAlerts: any[] = [];
let realtimeTripUpdates: any[] = [];
let realtimeVehiclePositions: any[] = [];

/**
 * Poll GTFS realtime data
 * Fetches alerts, trip updates, and vehicle positions
 */
export const pollGTFSRealtimeData = async (): Promise<void> => {
  console.log('📡 Polling GTFS realtime data...');
  
  try {
    // Fetch alerts
    console.log('  ⏳ Fetching service alerts...');
    const alertsResponse = await fetchRealtimeEndpoint(
      getConfig().alertsUrl,
      lastAlertsModified
    );
    
    if (alertsResponse.data) {
      console.log('  💾 Processing alerts data...');
      // Process and store alerts data
      realtimeAlerts = alertsResponse.data.alerts || alertsResponse.data;
      lastAlertsModified = alertsResponse.lastModified;
    } else {
      console.log('  ⏩ Alerts not modified since last fetch');
    }

    // Fetch trip updates
    console.log('  ⏳ Fetching trip updates...');
    const tripUpdatesResponse = await fetchRealtimeEndpoint(
      getConfig().tripUpdatesUrl,
      lastTripUpdatesModified
    );
    
    if (tripUpdatesResponse.data) {
      console.log('  💾 Processing trip updates data...');
      // Process and store trip updates data
      realtimeTripUpdates = tripUpdatesResponse.data.tripUpdates || tripUpdatesResponse.data;
      lastTripUpdatesModified = tripUpdatesResponse.lastModified;
    } else {
      console.log('  ⏩ Trip updates not modified since last fetch');
    }

    // Fetch vehicle positions
    console.log('  ⏳ Fetching vehicle positions...');
    const positionsResponse = await fetchRealtimeEndpoint(
      getConfig().positionsUrl,
      lastPositionsModified
    );
    
    if (positionsResponse.data) {
      console.log('  💾 Processing vehicle positions data...');
      // Process and store vehicle positions data
      realtimeVehiclePositions = positionsResponse.data.vehiclePositions || positionsResponse.data;
      lastPositionsModified = positionsResponse.lastModified;
    } else {
      console.log('  ⏩ Vehicle positions not modified since last fetch');
    }

    console.log('✅ GTFS realtime polling cycle complete!');
  } catch (error) {
    console.error('❌ GTFS realtime polling failed:', error);
    throw error;
  }
};

/**
 * Get realtime alerts data
 * @returns Array of realtime alerts
 */
export const getRealtimeAlerts = (): any[] => {
  return realtimeAlerts;
};

/**
 * Get realtime trip updates data
 * @returns Array of realtime trip updates
 */
export const getRealtimeTripUpdates = (): any[] => {
  return realtimeTripUpdates;
};

/**
 * Get realtime vehicle positions data
 * @returns Array of realtime vehicle positions
 */
export const getRealtimeVehiclePositions = (): any[] => {
  return realtimeVehiclePositions;
};

/**
 * Start GTFS realtime polling service
 * Polls data every 30 seconds
 */
export const startGTFSRealtimePolling = (): void => {
  console.log('🚀 Starting GTFS realtime polling service...');
  
  // Initial poll
  pollGTFSRealtimeData().catch(console.error);
  
  // Set up interval polling
  setInterval(() => {
    pollGTFSRealtimeData().catch(console.error);
  }, getConfig().pollInterval);
  
  console.log(`⏱️  Polling interval set to ${getConfig().pollInterval}ms`);
};
