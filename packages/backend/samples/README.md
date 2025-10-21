# Metra API Snapshots

This directory contains snapshots of the Metra GTFS API responses for regression testing purposes.

## Purpose

These JSON files represent real API responses from Metra's GTFS endpoints at a specific point in time. They serve as:

1. **Test fixtures** - Reference data for unit and integration tests
2. **Regression testing** - Verify API changes don't break existing functionality
3. **Development reference** - Understand the structure of API responses without making live requests

## Files

### GTFS Static Schedule Data

- `gtfs_schedule_agency.json` - Transit agency information
- `gtfs_schedule_routes.json` - Train route definitions (lines)
- `gtfs_schedule_stops.json` - Station locations and details
- `gtfs_schedule_trips.json` - Scheduled trips
- `gtfs_schedule_stop_times.json` - Arrival/departure times for each stop on each trip
- `gtfs_schedule_calendar.json` - Service schedules (weekday/weekend patterns)
- `gtfs_schedule_calendar_dates.json` - Service exceptions (holidays, special events)

### GTFS Realtime Data

- `gtfs_realtime_alerts.json` - Service alerts and disruptions
- `gtfs_realtime_trip_updates.json` - Real-time trip delay/cancellation information
- `gtfs_realtime_positions.json` - Current train positions

## Updating Snapshots

To create a fresh snapshot of all API endpoints:

```bash
cd packages/backend
pnpm gtfs:snapshot
```

This will:

1. Query all Metra GTFS API endpoints using credentials from `.env`
2. Save formatted JSON responses to this directory
3. Overwrite existing snapshot files

## Usage in Tests

Import snapshot data in your tests:

```typescript
import agency from './samples/gtfs_schedule_agency.json';
import routes from './samples/gtfs_schedule_routes.json';

// Use in your test assertions
expect(parsedData).toMatchObject(routes);
```

## Notes

- Snapshots should be committed to version control
- Update snapshots when API contract changes are expected
- Realtime data will vary each time the script runs (train positions, delays, etc.)
- Static schedule data should remain relatively stable between updates
- Large files (especially `stop_times.json` at ~21MB) are included for completeness

## Last Updated

Run `pnpm gtfs:snapshot` to update this timestamp:

- Last snapshot: 2025-10-20
