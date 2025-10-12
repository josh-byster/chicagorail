# new-metra Development Guidelines

Auto-generated from all feature plans. Last updated: 2025-10-11

## Active Technologies
- TypeScript 5.x (both frontend and backend) (001-i-want-to)

## Project Structure
```
packages/
├── shared/          # Shared TypeScript types & Zod schemas
│   └── src/
├── backend/         # Node.js/Express API server
│   ├── src/
│   └── tests/
└── frontend/        # React PWA
    ├── src/
    └── tests/
```

**Monorepo**: This project uses pnpm workspaces. Always run `pnpm install` from the root.

## Commands
npm test [ONLY COMMANDS FOR ACTIVE TECHNOLOGIES][ONLY COMMANDS FOR ACTIVE TECHNOLOGIES] npm run lint

## Code Style
TypeScript 5.x (both frontend and backend): Follow standard conventions

## Recent Changes
- 001-i-want-to: Added TypeScript 5.x (both frontend and backend)

<!-- MANUAL ADDITIONS START -->

## MCP Tools (REQUIRED)

**IMPORTANT**: Always use the available MCP tools for this project. Do not search the web or make assumptions.

### Ref MCP (Documentation Search)

**When to use**: For ALL documentation lookups including ShadCN UI, libraries, frameworks, and APIs

```bash
# Search for documentation
mcp__Ref__ref_search_documentation query="ShadCN UI button component"
mcp__Ref__ref_search_documentation query="ShadCN UI select dropdown"
mcp__Ref__ref_search_documentation query="React TanStack Query useQuery"
mcp__Ref__ref_search_documentation query="node-gtfs library API"
mcp__Ref__ref_search_documentation query="Workbox service worker strategies"

# Read specific documentation URL
mcp__Ref__ref_read_url url="https://example.com/docs/page"
```

**Usage**:
- Search for ShadCN UI, React, TypeScript, Express, node-gtfs, TanStack Query, Workbox, Vite documentation
- Get up-to-date API references and best practices
- ALWAYS use Ref MCP for all documentation lookups - do not search the web

### Development Workflow with Ref MCP

1. **Before implementing a ShadCN component**:
   - Use Ref MCP to search for component documentation
   - Example: `mcp__Ref__ref_search_documentation query="ShadCN UI button component installation"`
   - Follow installation and usage instructions exactly

2. **When implementing new features**:
   - Use Ref MCP to search for library-specific patterns
   - Example: `mcp__Ref__ref_search_documentation query="TanStack Query setup TypeScript"`

3. **When debugging**:
   - Use Ref MCP to search for error messages or API issues
   - Example: `mcp__Ref__ref_search_documentation query="node-gtfs importGtfs configuration"`

## Technology Stack

### Frontend
- **Framework**: React 18+ with TypeScript 5.x
- **Build Tool**: Vite
- **UI Library**: ShadCN UI + Tailwind CSS (use Ref MCP for component docs)
- **State Management**: TanStack Query (server state), React Context (client state)
- **PWA**: Workbox (service worker), Dexie.js (IndexedDB)
- **Testing**: Vitest, React Testing Library, Playwright

### Backend
- **Runtime**: Node.js 20 LTS
- **Framework**: Express
- **Database**: SQLite with WAL mode
- **GTFS Integration**: node-gtfs library (use Ref MCP for docs)
- **Validation**: Zod (shared with frontend)

### Shared
- **Language**: TypeScript 5.x
- **Package Manager**: pnpm (monorepo workspaces)
- **Schema Validation**: Zod

## Environment Setup

**CRITICAL**: The `.env` file contains Metra GTFS API credentials. It is already configured and in `.gitignore`.

**⚠️ DO NOT commit .env to version control**

Key environment variables (see `.env.example` for full list):
- `METRA_API_USERNAME` & `METRA_API_PASSWORD`: GTFS API authentication
- `GTFS_STATIC_BASE_URL`: Base URL for static GTFS endpoints (https://gtfsapi.metrarail.com)
- `GTFS_REALTIME_*_URL`: Realtime endpoints (alerts, tripUpdates, positions)
- `PORT`: Backend server port (3000)
- `DATABASE_PATH`: SQLite database location (./data/gtfs.db)
- `VITE_API_URL`: Frontend connects to backend via this URL

## Development Commands

```bash
# From project root
pnpm install              # Install all dependencies
pnpm dev                  # Start all services (backend + frontend)
pnpm build                # Build all packages
pnpm test                 # Run all tests

# Backend-specific
cd packages/backend
pnpm gtfs:import          # Import GTFS static data from JSON endpoints (required first time)
pnpm dev                  # Start backend only (port 3000)

# Frontend-specific
cd packages/frontend
pnpm dev                  # Start frontend only (port 5173)

# Shared-specific
cd packages/shared
pnpm build                # Build shared types (required after changes)
pnpm build:watch          # Watch mode for development
```

## Key Development Guidelines

1. **Always use Ref MCP**: Use Ref MCP for ALL documentation lookups (ShadCN UI, libraries, frameworks, APIs)
2. **Monorepo workflow**: Changes to shared/ require rebuild before backend/frontend see them
3. **Type safety**: All entities defined in packages/shared with Zod schemas
4. **PWA focus**: Implement offline-first patterns, test service worker caching
5. **Performance targets**:
   - API p95 latency: <200ms reads, <500ms writes
   - Initial load: <2s
   - Bundle size: <500KB gzipped
6. **Accessibility**: WCAG 2.1 Level AA compliance required

<!-- MANUAL ADDITIONS END -->