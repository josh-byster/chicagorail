# Data Model: Fast Metra Train Tracker

**Date**: 2025-10-11
**Phase**: 1 - Design
**Status**: Complete

## Overview

This document defines the data entities, relationships, and validation rules for the Metra train tracking application. All entities are defined as TypeScript interfaces in `packages/shared/src/types/` with corresponding Zod schemas in `packages/shared/src/schemas/` for runtime validation.

---

## Core Entities

### Station

Represents a Metra train station.

```typescript
interface Station {
  // Identifiers
  station_id: string;              // GTFS stop_id (e.g., "OTC" for Ogilvie Transportation Center)

  // Basic Info
  station_name: string;            // Human-readable name (e.g., "Ogilvie Transportation Center")
  station_code?: string;           // Optional short code displayed to users

  // Location
  latitude: number;                // Geographic coordinates (-90 to 90)
  longitude: number;               // Geographic coordinates (-180 to 180)

  // Service Info
  lines_served: string[];          // Array of line IDs serving this station
  zone?: string;                   // Fare zone (if applicable)

  // Accessibility
  wheelchair_accessible: boolean;  // ADA accessibility

  // Metadata
  platform_count?: number;         // Number of platforms/tracks
}
```

**Validation Rules** (Zod):
- `station_id`: Required, non-empty string
- `station_name`: Required, non-empty string
- `latitude`: Required, number between -90 and 90
- `longitude`: Required, number between -180 and 180
- `lines_served`: Required, array with at least one line
- `wheelchair_accessible`: Required boolean

**Relationships**:
- Referenced by `StopTime.station_id`
- Referenced by `SavedRoute.origin_station_id` and `destination_station_id`

---

### Line

Represents a Metra rail line (e.g., Union Pacific North, BNSF Railway).

```typescript
interface Line {
  // Identifiers
  line_id: string;                 // GTFS route_id (e.g., "UP-N")

  // Basic Info
  line_name: string;               // Full name (e.g., "Union Pacific North")
  line_short_name: string;         // Abbreviation (e.g., "UP-N")

  // Visual
  line_color: string;              // Hex color code (e.g., "#C60C30")
  line_text_color: string;         // Text color for contrast (e.g., "#FFFFFF")

  // Service Info
  stations: string[];              // Ordered array of station_ids on this line

  // Metadata
  line_url?: string;               // Link to Metra line schedule page
  description?: string;            // Line description/service area
}
```

**Validation Rules** (Zod):
- `line_id`: Required, non-empty string
- `line_name`: Required, non-empty string
- `line_short_name`: Required, non-empty string
- `line_color`: Required, valid hex color (regex: `/^#[0-9A-F]{6}$/i`)
- `line_text_color`: Required, valid hex color
- `stations`: Required, array with at least 2 stations

**Relationships**:
- Referenced by `Train.line_id`
- Contains multiple `Station` entities

---

### Train

Represents a scheduled train service with real-time position and status.

```typescript
interface Train {
  // Identifiers
  trip_id: string;                 // GTFS trip_id (unique for each train run)
  train_number?: string;           // Human-readable train number (e.g., "312")

  // Line Info
  line_id: string;                 // Foreign key to Line
  line_name: string;               // Denormalized for quick display

  // Schedule
  origin_station_id: string;       // Starting station
  destination_station_id: string;  // Ending station
  departure_time: string;          // ISO 8601 timestamp or HH:MM:SS
  arrival_time: string;            // ISO 8601 timestamp or HH:MM:SS

  // Real-time Status
  status: TrainStatus;             // Current status enum
  delay_minutes: number;           // Delay in minutes (0 if on time, negative if early)
  current_station_id?: string;     // Last known station or next station

  // Position
  current_position?: Position;     // GPS coordinates if available

  // Platform
  platform?: string;               // Platform/track number at origin

  // Metadata
  stops: StopTime[];               // All stops for this train
  service_id?: string;             // GTFS service calendar reference
  updated_at: string;              // ISO 8601 timestamp of last update
}

enum TrainStatus {
  SCHEDULED = 'scheduled',       // Not yet departed
  ON_TIME = 'on_time',           // Currently running on schedule
  DELAYED = 'delayed',           // Running behind schedule
  EARLY = 'early',               // Running ahead of schedule
  APPROACHING = 'approaching',   // Within 5 minutes of station
  DEPARTED = 'departed',         // Train has left
  ARRIVED = 'arrived',           // Reached destination
  CANCELLED = 'cancelled'        // Service cancelled
}

interface Position {
  latitude: number;
  longitude: number;
  bearing?: number;              // Direction of travel (0-359 degrees)
  speed?: number;                // Speed in mph (optional)
}
```

**Validation Rules** (Zod):
- `trip_id`: Required, non-empty string
- `line_id`: Required, non-empty string, must reference valid Line
- `origin_station_id`, `destination_station_id`: Required, must reference valid Stations
- `departure_time`, `arrival_time`: Required, valid ISO 8601 or HH:MM:SS format
- `status`: Required, must be valid TrainStatus enum value
- `delay_minutes`: Required number
- `stops`: Required, array with at least 2 stops
- `updated_at`: Required, valid ISO 8601 timestamp
- `current_position.latitude`: Number between -90 and 90
- `current_position.longitude`: Number between -180 and 180

**Relationships**:
- References `Line` via `line_id`
- References `Station` via `origin_station_id`, `destination_station_id`, `current_station_id`
- Contains multiple `StopTime` entities

**State Transitions**:
```
SCHEDULED → ON_TIME/DELAYED/EARLY → APPROACHING → DEPARTED → ARRIVED
         ↓                                                      ↑
         CANCELLED -----------------------------------------> (end)
```

---

### StopTime

Represents a train's scheduled and actual stop at a station.

```typescript
interface StopTime {
  // Identifiers
  trip_id: string;                 // Foreign key to Train
  station_id: string;              // Foreign key to Station

  // Schedule
  arrival_time: string;            // Scheduled arrival (ISO 8601 or HH:MM:SS)
  departure_time: string;          // Scheduled departure (ISO 8601 or HH:MM:SS)
  stop_sequence: number;           // Order in the trip (1, 2, 3...)

  // Real-time
  actual_arrival?: string;         // Actual/estimated arrival time
  actual_departure?: string;       // Actual/estimated departure time
  delay_minutes: number;           // Delay at this stop (0 if on time)

  // Display
  headsign?: string;               // Destination shown on train
  platform?: string;               // Platform/track at this station

  // Pickup/Drop-off
  pickup_type: number;             // 0=regular, 1=none, 2=phone, 3=driver
  drop_off_type: number;           // 0=regular, 1=none, 2=phone, 3=driver
}
```

**Validation Rules** (Zod):
- `trip_id`: Required, non-empty string
- `station_id`: Required, non-empty string, must reference valid Station
- `arrival_time`, `departure_time`: Required, valid time format
- `stop_sequence`: Required, positive integer
- `delay_minutes`: Required number (can be negative)
- `pickup_type`, `drop_off_type`: Required, integer 0-3

**Relationships**:
- References `Train` via `trip_id`
- References `Station` via `station_id`
- Multiple StopTimes form a Train's route

---

### SavedRoute

Represents a user's saved route (e.g., "Home to Work").

```typescript
interface SavedRoute {
  // Identifiers
  route_id: string;                // UUID generated client-side

  // Route Details
  origin_station_id: string;       // Foreign key to Station
  destination_station_id: string;  // Foreign key to Station

  // Customization
  label: string;                   // User-provided name (e.g., "Home to Work")

  // Metadata
  created_at: string;              // ISO 8601 timestamp
  last_used_at: string;            // ISO 8601 timestamp
  use_count: number;               // Number of times accessed
}
```

**Validation Rules** (Zod):
- `route_id`: Required, valid UUID v4
- `origin_station_id`, `destination_station_id`: Required, must reference valid Stations, must be different
- `label`: Required, non-empty string, max 50 characters
- `created_at`, `last_used_at`: Required, valid ISO 8601 timestamps
- `use_count`: Required, non-negative integer

**Relationships**:
- References `Station` via `origin_station_id` and `destination_station_id`

**Storage**:
- Persisted in browser LocalStorage (simple key-value)
- Also stored in IndexedDB for offline access

---

### ServiceAlert

Represents service disruptions, delays, or announcements.

```typescript
interface ServiceAlert {
  // Identifiers
  alert_id: string;                // GTFS alert ID

  // Scope
  affected_lines?: string[];       // Line IDs affected (empty = all lines)
  affected_stations?: string[];    // Station IDs affected (empty = all stations)
  affected_trips?: string[];       // Specific trip IDs affected

  // Content
  alert_type: AlertType;           // Type of alert
  severity: AlertSeverity;         // Severity level
  header: string;                  // Brief title
  description: string;             // Detailed description

  // Time
  start_time: string;              // ISO 8601 timestamp
  end_time?: string;               // ISO 8601 timestamp (null = ongoing)

  // Display
  url?: string;                    // Link to more info
}

enum AlertType {
  DELAY = 'delay',
  CANCELLATION = 'cancellation',
  DETOUR = 'detour',
  SCHEDULE_CHANGE = 'schedule_change',
  CONSTRUCTION = 'construction',
  WEATHER = 'weather',
  INCIDENT = 'incident',
  INFORMATION = 'information'
}

enum AlertSeverity {
  INFO = 'info',                   // Informational only
  WARNING = 'warning',             // May affect some users
  SEVERE = 'severe'                // Significant disruption
}
```

**Validation Rules** (Zod):
- `alert_id`: Required, non-empty string
- `alert_type`: Required, valid AlertType enum value
- `severity`: Required, valid AlertSeverity enum value
- `header`: Required, non-empty string, max 100 characters
- `description`: Required, non-empty string
- `start_time`: Required, valid ISO 8601 timestamp
- `end_time`: Optional, valid ISO 8601 timestamp, must be after start_time

**Relationships**:
- References `Line` via `affected_lines`
- References `Station` via `affected_stations`
- References `Train` via `affected_trips`

---

## Relationships Diagram

```
┌──────────┐         ┌──────────┐
│   Line   │ 1───n   │ Station  │
└─────┬────┘         └─────┬────┘
      │                    │
      │ 1                  │ 1
      │                    │
      │ n                  │ n
┌─────▼────┐         ┌─────▼──────┐
│  Train   │ 1───n   │  StopTime  │
└─────┬────┘         └────────────┘
      │
      │ n
      │
┌─────▼────────┐
│ ServiceAlert │
└──────────────┘

┌────────────┐        ┌──────────┐
│SavedRoute  │ n───2  │ Station  │
└────────────┘        └──────────┘
   (origin & destination)
```

---

## Indexes (SQLite)

For optimal query performance, the following indexes should be created:

```sql
-- Stations
CREATE INDEX idx_stations_lines ON stations(lines_served);
CREATE INDEX idx_stations_name ON stations(station_name);

-- Trains
CREATE INDEX idx_trains_line ON trains(line_id);
CREATE INDEX idx_trains_origin_dest ON trains(origin_station_id, destination_station_id);
CREATE INDEX idx_trains_departure ON trains(departure_time);
CREATE INDEX idx_trains_status ON trains(status);

-- StopTimes
CREATE INDEX idx_stoptimes_trip ON stop_times(trip_id);
CREATE INDEX idx_stoptimes_station ON stop_times(station_id);
CREATE INDEX idx_stoptimes_sequence ON stop_times(stop_sequence);
CREATE INDEX idx_stoptimes_arrival ON stop_times(arrival_time);

-- ServiceAlerts
CREATE INDEX idx_alerts_lines ON service_alerts(affected_lines);
CREATE INDEX idx_alerts_time ON service_alerts(start_time, end_time);
```

---

## Caching Strategy

### Client-Side (IndexedDB)

**Cached for offline use**:
- All `Station` entities (230 stations × ~200 bytes = 46KB)
- All `Line` entities (11 lines × ~500 bytes = 5.5KB)
- `SavedRoute` entities (user-specific, ~10 routes × 150 bytes = 1.5KB)
- Recent `Train` data (last 30 minutes, ~500 trains × 1KB = 500KB)

**Cache invalidation**:
- Stations/Lines: Update weekly or on app update
- Trains: Expire after 30 seconds (per research.md polling interval)
- SavedRoutes: Never expire (user data)

### Server-Side (SQLite)

**GTFS Static Data**:
- Imported weekly from Metra's GTFS schedule feed
- ~5MB uncompressed

**GTFS Realtime Data**:
- Updated every 30 seconds from Metra's GTFS Realtime API
- Kept in memory + SQLite with 1-hour retention

---

## Data Flow

### Initial Load (First Visit)
1. User opens app
2. Service worker caches app shell (HTML, CSS, JS)
3. IndexedDB check: empty
4. Fetch from backend: `/api/stations`, `/api/lines`
5. Store in IndexedDB
6. Display UI

### Typical User Journey (Route Search)
1. User selects origin "Ogilvie" and destination "Arlington Heights"
2. Query IndexedDB for station IDs
3. Fetch from backend: `/api/trains?origin=OTC&destination=AH`
4. Backend queries SQLite for matching trains
5. Return trains with real-time status
6. Display train list
7. Cache response in IndexedDB (30s TTL)

### Offline Scenario
1. User opens app (no network)
2. Service worker serves cached app shell
3. Query IndexedDB for stations, lines, saved routes
4. Query IndexedDB for trains (may be stale)
5. Display with "Last updated: 5 minutes ago" warning
6. User can still browse cached data

### Real-time Updates (Online)
1. User viewing train list
2. Frontend polls `/api/trains?origin=X&destination=Y` every 30 seconds
3. Backend returns updated trains with latest delays/positions
4. UI updates train list (highlighting changes)
5. Update IndexedDB cache

---

## Zod Schema Example

```typescript
// packages/shared/src/schemas/station.ts
import { z } from 'zod';

export const StationSchema = z.object({
  station_id: z.string().min(1),
  station_name: z.string().min(1),
  station_code: z.string().optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  lines_served: z.array(z.string()).min(1),
  zone: z.string().optional(),
  wheelchair_accessible: z.boolean(),
  platform_count: z.number().int().positive().optional()
});

export type Station = z.infer<typeof StationSchema>;
```

---

## Next Steps

With data model complete:
1. Generate API contracts (OpenAPI spec in `contracts/`)
2. Create quickstart.md with development setup
3. Update agent context file
