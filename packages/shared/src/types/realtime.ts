// Realtime (GTFS-rt) domain types
//
// Every field here is optional on the responses that carry it: the realtime
// feed is credential-gated and can be down, in which case the API returns the
// same scheduled-only payloads it always has.

export type RealtimeStatus = 'on_time' | 'late' | 'early';

/** How a specific scheduled event (a departure or arrival) is actually running */
export interface RealtimePrediction {
  /** Seconds behind schedule; negative is early */
  delay_seconds: number;
  /** ISO datetime the train is now expected — schedule plus delay */
  predicted_time: string;
  status: RealtimeStatus;
}

export type VehicleStopStatus = 'incoming_at' | 'stopped_at' | 'in_transit_to';

/** Where a train reported itself to be */
export interface VehiclePosition {
  latitude: number;
  longitude: number;
  /** stop_sequence of the stop this status refers to */
  current_stop_sequence?: number;
  current_status?: VehicleStopStatus;
  /** ISO datetime the position was reported */
  timestamp: string;
}

/** Whether realtime data is configured and flowing */
export interface RealtimeStatusInfo {
  /** Credentials are configured */
  enabled: boolean;
  /** ISO datetime of the last successful feed fetch, null if never */
  lastUpdated: string | null;
}
