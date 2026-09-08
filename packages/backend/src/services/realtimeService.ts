/**
 * Metra GTFS-realtime feed
 *
 * Metra publishes protobuf feeds (trip updates and vehicle positions) behind
 * an authenticated endpoint. Credentials come from GTFS_TOKEN; without them
 * this service reports itself unavailable and every caller falls back to the
 * static schedule.
 *
 * The feed is never allowed to break a request: fetch failures are logged,
 * cached, and backed off, and callers always get a snapshot object (an empty
 * one if nothing could be fetched).
 */

import fetch from 'node-fetch';
import GtfsRealtimeBindings from 'gtfs-realtime-bindings';
import { winstonLogger } from '../middleware/logger';

const { transit_realtime: transitRealtime } = GtfsRealtimeBindings;

/** How long a fetched feed is considered current */
const CACHE_TTL_MS = 30_000;
/** Wait this long after a failure before trying again */
const FAILURE_BACKOFF_MS = 60_000;
/** Wait this long after an auth rejection - retrying won't fix bad credentials */
const AUTH_FAILURE_BACKOFF_MS = 15 * 60_000;
const FETCH_TIMEOUT_MS = 10_000;

export interface StopPrediction {
  /** Seconds behind schedule; negative is early */
  delay: number;
  /** Absolute epoch seconds the feed gave, when it gave one */
  time?: number;
}

export interface TripRealtime {
  tripId: string;
  /** Trip-level delay, used for stops the feed didn't enumerate */
  delay?: number;
  /** Keyed by stop_id */
  byStopId: Map<string, StopPrediction>;
  /** Keyed by stop_sequence */
  byStopSequence: Map<number, StopPrediction>;
  /** Ordered stop updates, for propagating a delay to later stops */
  ordered: Array<{ stopSequence?: number; prediction: StopPrediction }>;
  canceled: boolean;
}

export interface VehicleRealtime {
  tripId: string;
  latitude: number;
  longitude: number;
  currentStopSequence?: number;
  currentStatus?: 'incoming_at' | 'stopped_at' | 'in_transit_to';
  /** Epoch seconds */
  timestamp: number;
}

export interface RealtimeSnapshot {
  trips: Map<string, TripRealtime>;
  vehicles: Map<string, VehicleRealtime>;
  /** Epoch ms of the fetch that produced this snapshot, null if none */
  fetchedAt: number | null;
}

const EMPTY_SNAPSHOT: RealtimeSnapshot = {
  trips: new Map(),
  vehicles: new Map(),
  fetchedAt: null,
};

const VEHICLE_STATUS: Record<number, VehicleRealtime['currentStatus']> = {
  0: 'incoming_at',
  1: 'stopped_at',
  2: 'in_transit_to',
};

export class RealtimeService {
  private static instance: RealtimeService;

  private snapshot: RealtimeSnapshot = EMPTY_SNAPSHOT;
  private inFlight: Promise<RealtimeSnapshot> | null = null;
  private retryAfter = 0;

  private readonly baseUrl: string;
  /** Complete Authorization header value, or undefined when unconfigured */
  private readonly authHeader?: string;

  private constructor() {
    this.baseUrl = (process.env.METRA_RT_URL || 'https://gtfsapi.metrarail.com/gtfs').replace(
      /\/$/,
      ''
    );
    this.authHeader = resolveAuthHeader();

    if (!this.isConfigured()) {
      winstonLogger.info(
        'Metra realtime credentials not set (GTFS_TOKEN) - serving scheduled times only'
      );
    } else {
      winstonLogger.info(
        `Metra realtime enabled (${this.authHeader?.split(' ')[0]} auth against ${this.baseUrl})`
      );
    }
  }

  public static getInstance(): RealtimeService {
    if (!RealtimeService.instance) {
      RealtimeService.instance = new RealtimeService();
    }
    return RealtimeService.instance;
  }

  public isConfigured(): boolean {
    return !!this.authHeader;
  }

  public getLastUpdated(): string | null {
    return this.snapshot.fetchedAt ? new Date(this.snapshot.fetchedAt).toISOString() : null;
  }

  /**
   * Current feed data, refetching if the cache has expired.
   * Resolves to an empty snapshot rather than throwing.
   */
  public async getSnapshot(): Promise<RealtimeSnapshot> {
    if (!this.isConfigured()) return EMPTY_SNAPSHOT;

    const now = Date.now();
    const isFresh = this.snapshot.fetchedAt !== null && now - this.snapshot.fetchedAt < CACHE_TTL_MS;
    if (isFresh) return this.snapshot;
    if (now < this.retryAfter) return this.snapshot;
    if (this.inFlight) return this.inFlight;

    this.inFlight = this.refresh().finally(() => {
      this.inFlight = null;
    });
    return this.inFlight;
  }

  private async refresh(): Promise<RealtimeSnapshot> {
    try {
      const [tripFeed, vehicleFeed] = await Promise.all([
        this.fetchFeed('/tripUpdates'),
        this.fetchFeed('/positions'),
      ]);

      this.snapshot = {
        trips: parseTripUpdates(tripFeed),
        vehicles: parseVehiclePositions(vehicleFeed),
        fetchedAt: Date.now(),
      };
      this.retryAfter = 0;

      winstonLogger.debug(
        `Realtime feed refreshed: ${this.snapshot.trips.size} trips, ${this.snapshot.vehicles.size} vehicles`
      );
    } catch (error) {
      const isAuth = error instanceof FeedHttpError && (error.status === 401 || error.status === 403);
      this.retryAfter = Date.now() + (isAuth ? AUTH_FAILURE_BACKOFF_MS : FAILURE_BACKOFF_MS);

      winstonLogger.error(
        isAuth
          ? 'Metra realtime rejected our credentials - check GTFS_TOKEN (and GTFS_AUTH_SCHEME if the feed wants Basic rather than Bearer)'
          : 'Failed to refresh Metra realtime feed - falling back to scheduled times',
        error
      );
    }

    return this.snapshot;
  }

  private async fetchFeed(path: string): Promise<Uint8Array> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        headers: { Authorization: this.authHeader as string },
        signal: controller.signal as never,
      });

      if (!response.ok) {
        throw new FeedHttpError(path, response.status);
      }

      return new Uint8Array(await response.buffer());
    } finally {
      clearTimeout(timeout);
    }
  }
}

/**
 * Build the Authorization header from the environment.
 *
 * Metra has issued credentials in two shapes over time: an API key/secret pair
 * for HTTP Basic, and a single opaque token. A value containing ":" is treated
 * as key:secret and sent as Basic; anything else is sent as a Bearer token.
 * Set GTFS_AUTH_SCHEME to "basic" or "bearer" to override the guess.
 */
function resolveAuthHeader(): string | undefined {
  const key = process.env.METRA_RT_KEY;
  const secret = process.env.METRA_RT_SECRET;
  const raw = process.env.GTFS_TOKEN?.trim() || (key && secret ? `${key}:${secret}` : '');
  if (!raw) return undefined;

  const override = process.env.GTFS_AUTH_SCHEME?.trim().toLowerCase();
  const scheme = override === 'basic' || override === 'bearer' ? override : raw.includes(':') ? 'basic' : 'bearer';

  return scheme === 'basic'
    ? `Basic ${Buffer.from(raw).toString('base64')}`
    : `Bearer ${raw}`;
}

class FeedHttpError extends Error {
  constructor(
    public readonly path: string,
    public readonly status: number
  ) {
    super(`Realtime feed ${path} responded ${status}`);
    this.name = 'FeedHttpError';
  }
}

function toNumber(value: unknown): number | undefined {
  if (value === null || value === undefined) return undefined;
  // protobufjs hands back Long for 64-bit fields
  const n = typeof value === 'object' ? Number((value as { toNumber?: () => number }).toNumber?.()) : Number(value);
  return Number.isFinite(n) ? n : undefined;
}

/**
 * Read a field only if the wire data actually carried it.
 *
 * protobufjs puts defaults on the prototype and assigns own properties only
 * for fields present in the message, so this distinguishes "delay: 0", which
 * means exactly on time, from a delay the producer never sent.
 */
function presentNumber(source: object | null | undefined, field: string): number | undefined {
  if (!source || !Object.prototype.hasOwnProperty.call(source, field)) return undefined;
  return toNumber((source as Record<string, unknown>)[field]);
}

export function parseTripUpdates(buffer: Uint8Array): Map<string, TripRealtime> {
  const feed = transitRealtime.FeedMessage.decode(buffer);
  const trips = new Map<string, TripRealtime>();

  for (const entity of feed.entity ?? []) {
    const update = entity.tripUpdate;
    const tripId = update?.trip?.tripId;
    if (!update || !tripId) continue;

    const trip: TripRealtime = {
      tripId,
      delay: presentNumber(update, 'delay'),
      byStopId: new Map(),
      byStopSequence: new Map(),
      ordered: [],
      canceled:
        update.trip?.scheduleRelationship ===
        transitRealtime.TripDescriptor.ScheduleRelationship.CANCELED,
    };

    for (const stopUpdate of update.stopTimeUpdate ?? []) {
      // A stop's own event wins; otherwise fall back to the other event on the
      // same stop, which the spec allows a producer to send alone.
      const event = stopUpdate.departure ?? stopUpdate.arrival;
      const delay = presentNumber(event, 'delay');
      const time = presentNumber(event, 'time');
      if (delay === undefined && time === undefined) continue;

      const prediction: StopPrediction = { delay: delay ?? 0, time };
      const stopSequence = presentNumber(stopUpdate, 'stopSequence');

      if (stopUpdate.stopId) trip.byStopId.set(stopUpdate.stopId, prediction);
      if (stopSequence !== undefined) trip.byStopSequence.set(stopSequence, prediction);
      trip.ordered.push({ stopSequence, prediction });
    }

    trip.ordered.sort((a, b) => (a.stopSequence ?? 0) - (b.stopSequence ?? 0));
    trips.set(tripId, trip);
  }

  return trips;
}

export function parseVehiclePositions(buffer: Uint8Array): Map<string, VehicleRealtime> {
  const feed = transitRealtime.FeedMessage.decode(buffer);
  const vehicles = new Map<string, VehicleRealtime>();

  for (const entity of feed.entity ?? []) {
    const vehicle = entity.vehicle;
    const tripId = vehicle?.trip?.tripId;
    const position = vehicle?.position;
    if (!vehicle || !tripId || !position) continue;

    vehicles.set(tripId, {
      tripId,
      latitude: position.latitude,
      longitude: position.longitude,
      currentStopSequence: presentNumber(vehicle, 'currentStopSequence'),
      currentStatus:
        vehicle.currentStatus === null || vehicle.currentStatus === undefined
          ? undefined
          : VEHICLE_STATUS[vehicle.currentStatus],
      timestamp: presentNumber(vehicle, 'timestamp') ?? Math.floor(Date.now() / 1000),
    });
  }

  return vehicles;
}
