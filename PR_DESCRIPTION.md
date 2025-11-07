# Fix GTFS API Integration - Migrate to ZIP-based System

## Summary

This PR completes the migration from Metra's old JSON-based GTFS API to their new standard GTFS ZIP format and Protocol Buffer realtime feeds. This fixes the currently broken API integration.

## What Changed

### Breaking API Changes from Metra

- ❌ **Old**: JSON endpoints at `gtfsapi.metrarail.com` with Basic Auth
- ✅ **New**: Standard GTFS ZIP at `schedules.metrarail.com` + Protocol Buffers at `gtfspublic.metrarr.com`

### Static Data Migration

- Downloads `schedule.zip` from new domain (no authentication required)
- Checks `published.txt` timestamp to avoid unnecessary re-downloads
- Extracts ZIP and parses standard GTFS CSV files (agency.txt, routes.txt, stops.txt, etc.)
- Added metadata table to track last imported timestamp
- **Database schema unchanged** - same SQLite tables and transformations

### Realtime Data Migration

- Updated endpoints to `gtfspublic.metrarr.com` with Bearer token authentication
- Implemented Protocol Buffer parsing using `gtfs-realtime-bindings`
- Extracts entities from GTFS-RT FeedMessage structure
- **Behavior unchanged** - same in-memory storage and 30-second polling

## Dependencies Added

- `adm-zip` - ZIP file extraction
- `gtfs-realtime-bindings` - Protocol Buffer parsing (GTFS-RT standard)
- `csv-parse` - GTFS CSV file parsing
- `@types/adm-zip` - TypeScript type definitions

## Configuration Changes

### Environment Variables (Breaking)

**Old variables (removed):**

```
METRA_API_USERNAME=...
METRA_API_PASSWORD=...
GTFS_STATIC_BASE_URL=https://gtfsapi.metrarail.com
```

**New variables (required):**

```
METRA_API_TOKEN=your_api_token_here
GTFS_STATIC_SCHEDULE_URL=https://schedules.metrarail.com/gtfs/schedule.zip
GTFS_STATIC_PUBLISHED_URL=https://schedules.metrarail.com/gtfs/published.txt
GTFS_REALTIME_ALERTS_URL=https://gtfspublic.metrarr.com/gtfs/public/alerts
GTFS_REALTIME_TRIP_UPDATES_URL=https://gtfspublic.metrarr.com/gtfs/public/tripupdates
GTFS_REALTIME_POSITIONS_URL=https://gtfspublic.metrarr.com/gtfs/public/positions
```

### Files Modified

- `.env.example` - Updated with new environment variables
- `packages/backend/src/config/env.ts` - Updated Zod schema
- `packages/backend/src/services/gtfs-init.service.ts` - Complete rewrite for ZIP format
- `packages/backend/src/services/gtfs-realtime.service.ts` - Updated for Protocol Buffers
- `packages/backend/src/scripts/snapshot-api.ts` - Updated for new endpoints
- `packages/backend/src/scripts/validate-gtfs-api.ts` - Updated for new endpoints
- `CLAUDE.md` - Updated documentation

## Testing

✅ TypeScript compilation successful for all packages
✅ Shared package builds successfully
✅ Backend package builds successfully
✅ Pre-commit hooks pass (ESLint + Prettier)

## Migration Notes

### For Production Deployment

1. **Obtain API token** from Metra (request at their developer portal)
2. **Update .env** with new variables (use `.env.example` as template)
3. **Delete existing database**: `rm packages/backend/data/gtfs.db` (forces fresh import)
4. **Deploy** - the app will automatically import GTFS data on startup

### Backward Compatibility

⚠️ **Breaking Changes**: Old environment variables no longer work. The app will fail to start without the new configuration.

✅ **Database Compatible**: Existing SQLite database schema is unchanged. However, a fresh import is recommended to ensure data is up-to-date.

✅ **API Compatible**: All public API routes (`/api/stations`, `/api/trains`, `/api/alerts`, etc.) remain unchanged. Frontend requires no modifications.

## Benefits of This Migration

1. **Standards Compliant**: Uses official GTFS and GTFS-RT formats
2. **Better Performance**: Only downloads when schedule actually changes (via published.txt check)
3. **More Reliable**: Standard formats have better library support
4. **Smaller Downloads**: ZIP compression reduces bandwidth usage
5. **Future Proof**: Aligned with GTFS community standards

## Related Documents

- Migration Plan: `MIGRATION_PLAN.md` (comprehensive implementation guide)
- See commit message for detailed technical breakdown

## Checklist

- [x] Environment configuration updated
- [x] Dependencies installed
- [x] Static data import refactored
- [x] Realtime service refactored
- [x] Scripts updated
- [x] Documentation updated
- [x] TypeScript compilation passes
- [x] Migration plan documented
