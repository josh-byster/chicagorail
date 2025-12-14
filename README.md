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
