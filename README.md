# Chicago Rail

A modern monorepo for tracking Metra train departures in real-time.

## Project Structure

```
chicagorail/
├── packages/
│   ├── shared/          # Shared types and utilities
│   ├── backend/         # Express REST API
│   └── frontend/        # React SPA with ShadCN UI
└── schedule/            # GTFS data
```

## Tech Stack

- **Monorepo**: PNPM workspaces
- **Shared**: TypeScript types and utilities
- **Backend**: Express, Node.js, TypeScript
- **Frontend**: React, Vite, TailwindCSS, ShadCN UI

## Getting Started

### Prerequisites

- Node.js 20+
- PNPM 8+

### Installation

```bash
# Install dependencies for all packages
pnpm install

# Build the shared package first
pnpm run shared:build
```

### Development

```bash
# Run all packages in development mode
pnpm run dev

# Or run individually
pnpm run backend:dev   # Backend on :3000
pnpm run frontend:dev  # Frontend on :5173
```

### Environment Variables

#### Backend (`packages/backend/.env`)
```
PORT=3000
NODE_ENV=development
GTFS_UPDATE_INTERVAL=86400000
```

#### Frontend (`packages/frontend/.env`)
```
VITE_API_URL=http://localhost:3000/api
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/routes` | Get all Metra routes |
| GET | `/api/stops/search?q=` | Search stops by name |
| GET | `/api/stops/:stopId/departures` | Get departures for a stop |

## Features

- 🔍 **Station Search**: Fuzzy search for Metra stations
- 🚂 **Real-time Departures**: Live departure information
- 📍 **Recent Searches**: Quick access to recently viewed stations
- 🎨 **Line Filtering**: Filter departures by route
- 📱 **Mobile Responsive**: Works on all devices
- 🌙 **Dark Mode**: Coming soon

## Architecture

### Shared Package (`@chicagorail/shared`)
- GTFS domain types (Route, Stop, Trip, etc.)
- API request/response types
- Shared utilities (time formatting, search)

### Backend Package (`@chicagorail/backend`)
- GTFS data ingestion and caching
- REST API endpoints
- Type-safe responses using shared types

### Frontend Package (`@chicagorail/frontend`)
- React components with ShadCN UI
- Custom hooks for data fetching
- Type-safe API client

## Building for Production

```bash
# Build all packages
pnpm run build

# Start backend
cd packages/backend && pnpm start
```

## License

MIT

## Backend CI/CD

`.github/workflows/deploy-dokku.yml` checks backend-related pull requests and
pushes to `main`. It installs the locked dependencies, builds shared types and
both apps, and runs the station-picker and realtime regression tests. After a
successful `main` check, it pushes that exact commit to the existing Dokku app's
`main` branch. Production deployments run one at a time and are not cancelled
mid-deploy. Vercel deploys the frontend separately.

The GitHub repository's Actions secrets must contain `DOKKU_HOST`,
`DOKKU_APP_NAME`, and `DOKKU_SSH_PRIVATE_KEY`. The SSH key must already be
authorized on the Dokku server. These names match the original deployment
workflow; no new credentials are required if the existing key still works.

After deploying, the workflow checks `/api/health` and Northbrook's
`/api/stops/NBROOK/connections` endpoint in both directions. An unavailable or
outdated backend fails the workflow instead of appearing successfully deployed.
To run that same check locally:

```sh
node scripts/check-backend.mjs https://api.chicagorail.app/api
```

Use **Actions → Backend CI and Dokku deploy → Run workflow → main** to retry a
deployment without making an empty commit. Running it on another branch only
validates the code. If a deployment fails, inspect its first failing step:
missing secrets, rejected SSH authentication, a Dokku build/healthcheck error,
and a failed live endpoint check require different fixes. Do not force-push over
a newer deployment; fetch the current `main` and deploy that revision.
