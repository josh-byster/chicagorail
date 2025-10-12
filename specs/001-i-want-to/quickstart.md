# Quickstart: Fast Metra Train Tracker

**Date**: 2025-10-11
**Phase**: 1 - Setup & Development Guide
**Status**: Complete

## Prerequisites

- **Node.js**: 20 LTS or higher
- **pnpm**: 8.0+ (install via `npm install -g pnpm`)
- **Docker**: Latest (for local database testing, optional)
- **Git**: Latest
- **Metra API Key**: Required (see [API Key Setup](#api-key-setup))

---

## Project Setup

### 1. Initial Setup

```bash
# Clone repository
git clone <repository-url>
cd new-metra

# Install dependencies (monorepo)
pnpm install

# Copy environment variables
cp .env.example .env
```

### 2. Environment Configuration

The `.env` file has been pre-configured with Metra GTFS API credentials. Verify it exists:

```bash
# Check .env file exists (should already be created)
cat .env

# If missing, copy from example and add credentials:
cp .env.example .env
```

**⚠️ CRITICAL SECURITY**: The `.env` file contains API credentials and is in `.gitignore`. NEVER commit this file to version control.

**Environment Variables Configured**:
- `METRA_API_USERNAME` & `METRA_API_PASSWORD`: GTFS API credentials
- `GTFS_STATIC_BASE_URL`: Base URL for static GTFS data (https://gtfsapi.metrarail.com)
- `GTFS_REALTIME_*_URL`: Realtime endpoints for alerts, trip updates, and vehicle positions
- `PORT`: Backend server port (3000)
- `DATABASE_PATH`: SQLite database location (./data/gtfs.db)
- `VITE_API_URL`: Frontend API endpoint (http://localhost:3000/api)

**Available GTFS Static Endpoints**:
- `/gtfs/schedule/stops` - All station information
- `/gtfs/schedule/stop_times` - Stop times for all trips
- `/gtfs/schedule/trips` - Trip information
- `/gtfs/schedule/routes` - Line/route data
- `/gtfs/schedule/calendar` - Service calendar
- `/gtfs/schedule/agency` - Metra agency info
- `/gtfs/schedule/stop_times/<TRIP_ID>` - Stop times for specific trip

**Available GTFS Realtime Endpoints**:
- `https://gtfsapi.metrarail.com/gtfs/alerts` - Service alerts
- `https://gtfsapi.metrarail.com/gtfs/tripUpdates` - Trip delays/updates
- `https://gtfsapi.metrarail.com/gtfs/positions` - Real-time train positions

### 3. Authentication

API requests require HTTP Basic Authentication using the credentials in `.env`:
```typescript
const auth = btoa(`${METRA_API_USERNAME}:${METRA_API_PASSWORD}`);
fetch(url, {
  headers: {
    'Authorization': `Basic ${auth}`
  }
});
```

---

## Monorepo Structure

```
new-metra/
├── packages/
│   ├── shared/          # Shared TypeScript types & schemas
│   ├── backend/         # Node.js/Express API server
│   └── frontend/        # React PWA
├── package.json         # Workspace configuration
├── pnpm-workspace.yaml  # pnpm workspace config
├── tsconfig.base.json   # Shared TypeScript config
└── .env                 # Environment variables
```

---

## Development Workflow

### Start All Services (Recommended)

```bash
# From project root - starts backend + frontend concurrently
pnpm dev
```

This runs:
- Backend: http://localhost:3000
- Frontend: http://localhost:5173

### Individual Package Commands

```bash
# Backend only
cd packages/backend
pnpm dev

# Frontend only
cd packages/frontend
pnpm dev

# Shared types (build)
cd packages/shared
pnpm build
```

---

## Package-Specific Setup

### Shared Package (`packages/shared`)

Contains TypeScript interfaces and Zod schemas shared between frontend and backend.

```bash
cd packages/shared

# Build types (required before using in other packages)
pnpm build

# Watch mode during development
pnpm build:watch

# Run tests
pnpm test
```

**Structure**:
```
packages/shared/src/
├── types/
│   ├── station.ts
│   ├── train.ts
│   ├── line.ts
│   ├── route.ts
│   └── alert.ts
└── schemas/
    └── index.ts
```

### Backend Package (`packages/backend`)

Node.js/Express server with GTFS integration.

```bash
cd packages/backend

# First-time setup: Import GTFS static data
pnpm gtfs:import

# Start development server (with hot reload)
pnpm dev

# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Type check
pnpm type-check
```

**Key Files**:
- `src/server.ts`: Express app entry point
- `src/services/gtfs.service.ts`: GTFS API integration
- `src/services/train.service.ts`: Train data processing
- `src/api/`: REST endpoint handlers

**GTFS Import**:
```bash
# Import static GTFS data (run weekly or on deployment)
pnpm gtfs:import

# This will:
# 1. Download Metra GTFS schedule zip
# 2. Import into SQLite database (./data/gtfs.db)
# 3. Create indexes for performance
# 4. Takes ~30 seconds
```

**Start Realtime Polling**:
```bash
# Backend automatically polls GTFS Realtime API every 30s when running
pnpm dev
```

### Frontend Package (`packages/frontend`)

React PWA with ShadCN UI and Vite.

```bash
cd packages/frontend

# Start development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview

# Run tests
pnpm test

# Run E2E tests (Playwright)
pnpm test:e2e

# Type check
pnpm type-check

# Lint
pnpm lint
```

**Key Files**:
- `src/App.tsx`: Main React component
- `src/components/`: Reusable UI components
- `src/pages/`: Page components
- `src/services/api.ts`: Backend API client
- `src/services/storage.ts`: IndexedDB wrapper
- `public/manifest.json`: PWA manifest

**ShadCN UI Setup** (if components not yet added):
```bash
# Add ShadCN components as needed
npx shadcn-ui@latest add button
npx shadcn-ui@latest add select
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add drawer
```

---

## Testing

### Unit Tests

```bash
# Run all unit tests
pnpm test

# Run tests for specific package
cd packages/backend && pnpm test
cd packages/frontend && pnpm test

# Watch mode
pnpm test:watch

# Coverage report
pnpm test:coverage
```

### Integration Tests

```bash
# Backend API integration tests
cd packages/backend
pnpm test:integration
```

### E2E Tests

```bash
# Frontend E2E tests with Playwright
cd packages/frontend
pnpm test:e2e

# Interactive mode
pnpm test:e2e:ui

# Headed mode (see browser)
pnpm test:e2e:headed
```

---

## Database Management

### SQLite Database

Located at: `packages/backend/data/gtfs.db`

**Useful Commands**:
```bash
# Open SQLite CLI
sqlite3 packages/backend/data/gtfs.db

# View tables
.tables

# Describe table schema
.schema stops

# Query example
SELECT * FROM stops LIMIT 10;

# Enable column mode for readable output
.mode column
.headers on
```

**Database Maintenance**:
```bash
# Optimize database (run weekly)
sqlite3 packages/backend/data/gtfs.db "PRAGMA optimize;"

# Vacuum (compact database)
sqlite3 packages/backend/data/gtfs.db "VACUUM;"

# Check integrity
sqlite3 packages/backend/data/gtfs.db "PRAGMA integrity_check;"
```

---

## Common Development Tasks

### Adding a New API Endpoint

1. **Update OpenAPI spec**: `specs/001-i-want-to/contracts/api.openapi.yaml`
2. **Add route**: `packages/backend/src/api/<endpoint>.ts`
3. **Add service logic**: `packages/backend/src/services/<service>.ts`
4. **Write tests**: `packages/backend/tests/integration/<endpoint>.test.ts`
5. **Update frontend API client**: `packages/frontend/src/services/api.ts`

### Adding a New UI Component

1. **Add ShadCN component** (if needed):
   ```bash
   cd packages/frontend
   npx shadcn-ui@latest add <component-name>
   ```
2. **Create component**: `packages/frontend/src/components/<Component>/`
3. **Write tests**: `packages/frontend/src/components/<Component>/<Component>.test.tsx`
4. **Import and use**: `packages/frontend/src/pages/<Page>.tsx`

### Adding a New Entity Type

1. **Define TypeScript interface**: `packages/shared/src/types/<entity>.ts`
2. **Create Zod schema**: `packages/shared/src/schemas/<entity>.ts`
3. **Export**: `packages/shared/src/index.ts`
4. **Build shared package**: `cd packages/shared && pnpm build`
5. **Use in backend/frontend** (types will be available)

---

## Debugging

### Backend Debugging

**VS Code launch.json**:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Backend",
      "cwd": "${workspaceFolder}/packages/backend",
      "runtimeExecutable": "pnpm",
      "runtimeArgs": ["dev"],
      "skipFiles": ["<node_internals>/**"]
    }
  ]
}
```

**Console Logging**:
```typescript
// Use debug module for structured logging
import debug from 'debug';
const log = debug('metra:gtfs');
log('Fetching realtime data...');
```

### Frontend Debugging

**React DevTools**: Install browser extension
**Redux DevTools**: TanStack Query has devtools built-in (enabled in development)

```typescript
// Enable TanStack Query DevTools
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

<QueryClientProvider client={queryClient}>
  <App />
  <ReactQueryDevtools initialIsOpen={false} />
</QueryClientProvider>
```

---

## Performance Monitoring

### Backend

```bash
# Monitor API response times
# Add logging middleware in src/middleware/logger.ts

# Check database query performance
sqlite3 packages/backend/data/gtfs.db
.timer on
SELECT * FROM stop_times WHERE trip_id = 'UP-N_312_20251011';
```

### Frontend

```bash
# Lighthouse CI (PWA audit)
cd packages/frontend
pnpm lighthouse

# Bundle size analysis
pnpm build
pnpm analyze
```

**Target Metrics** (from constitution):
- Initial load: <2s
- Time to Interactive: <3s
- Bundle size: <500KB gzipped
- Lighthouse PWA score: 90+

---

## Deployment

### Build for Production

```bash
# Build all packages
pnpm build

# Or individually
cd packages/backend && pnpm build
cd packages/frontend && pnpm build
```

### Docker (Local Testing)

```bash
# Build Docker image
docker build -t metra-tracker .

# Run container
docker run -p 3000:3000 --env-file .env metra-tracker
```

### DigitalOcean App Platform

**Deploy via GitHub Actions**:
1. Push to `main` branch
2. GitHub Actions workflow triggers
3. Builds Docker image
4. Deploys to DigitalOcean App Platform

**Manual Deployment**:
```bash
# Install doctl CLI
brew install doctl

# Authenticate
doctl auth init

# Deploy
doctl apps create --spec .do/app.yaml
```

---

## Troubleshooting

### GTFS Import Fails

**Issue**: `Error: Unable to download GTFS file`

**Solution**:
1. Check `GTFS_STATIC_URL` in `.env`
2. Verify internet connection
3. Try downloading manually: `curl -O https://gtfsapi.metrarail.com/gtfs/schedule/metra_gtfs.zip`

### API Returns Stale Data

**Issue**: Train times are outdated

**Solution**:
1. Check backend logs for GTFS polling errors
2. Verify `METRA_API_KEY` is valid
3. Check Metra API status: https://metra.com/developers
4. Restart backend: `pnpm dev`

### PWA Not Installing

**Issue**: "Install App" prompt doesn't appear

**Solution**:
1. Check `manifest.json` is valid (use https://manifest-validator.appspot.com/)
2. Verify service worker is registered (Chrome DevTools > Application > Service Workers)
3. Ensure HTTPS (or localhost) - PWAs require secure context
4. Check Lighthouse PWA audit for specific issues

### TypeScript Errors After Adding Shared Type

**Issue**: `Cannot find module '@metra/shared'`

**Solution**:
```bash
# Rebuild shared package
cd packages/shared
pnpm build

# Restart TypeScript server in VS Code
# Command Palette > TypeScript: Restart TS Server
```

---

## Next Steps

1. **Set up Metra API key** (see [API Key Setup](#api-key-setup))
2. **Install dependencies**: `pnpm install`
3. **Import GTFS data**: `cd packages/backend && pnpm gtfs:import`
4. **Start development**: `pnpm dev`
5. **Open browser**: http://localhost:5173

For implementation tasks, see: `specs/001-i-want-to/tasks.md` (generated by `/speckit.tasks` command)

---

## Resources

- **Metra GTFS Documentation**: https://metra.com/developers
- **GTFS Realtime Specification**: https://developers.google.com/transit/gtfs-realtime
- **node-gtfs Library**: https://github.com/BlinkTagInc/node-gtfs
- **ShadCN UI Components**: https://ui.shadcn.com/
- **Workbox PWA Guide**: https://developer.chrome.com/docs/workbox/
- **Project Constitution**: `.specify/memory/constitution.md`
