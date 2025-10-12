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

### ShadCN UI MCP

**When to use**: For ALL ShadCN UI component implementations

```bash
# List all available ShadCN components
mcp__shadcn__getComponents

# Get detailed component documentation
mcp__shadcn__getComponent component="button"
mcp__shadcn__getComponent component="select"
mcp__shadcn__getComponent component="dialog"
```

**Usage**:
- ALWAYS check component documentation via MCP before implementing
- Get installation commands, usage examples, and API reference
- Available for all ShadCN UI components in tasks.md (Button, Select, Card, Dialog, Input, Badge, Alert, etc.)

### Ref MCP (Documentation Search)

**When to use**: For searching documentation on libraries, frameworks, and APIs used in this project

```bash
# Search for documentation
mcp__Ref__ref_search_documentation query="React TanStack Query useQuery"
mcp__Ref__ref_search_documentation query="node-gtfs library API"
mcp__Ref__ref_search_documentation query="Workbox service worker strategies"

# Read specific documentation URL
mcp__Ref__ref_read_url url="https://example.com/docs/page"
```

**Usage**:
- Search for React, TypeScript, Express, node-gtfs, TanStack Query, Workbox, Vite documentation
- Get up-to-date API references and best practices
- Prefer Ref MCP over web search for technical documentation

### Development Workflow with MCPs

1. **Before implementing a ShadCN component**:
   - Run `mcp__shadcn__getComponent` to get latest docs
   - Follow installation and usage instructions exactly

2. **When implementing new features**:
   - Use Ref MCP to search for library-specific patterns
   - Example: "How to setup TanStack Query with TypeScript"

3. **When debugging**:
   - Use Ref MCP to search for error messages or API issues
   - Example: "node-gtfs importGtfs configuration"

## Technology Stack

### Frontend
- **Framework**: React 18+ with TypeScript 5.x
- **Build Tool**: Vite
- **UI Library**: ShadCN UI + Tailwind CSS (use shadcn MCP for all components)
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

1. **Always use MCPs**: Use shadcn MCP for UI components, Ref MCP for documentation
2. **Monorepo workflow**: Changes to shared/ require rebuild before backend/frontend see them
3. **Type safety**: All entities defined in packages/shared with Zod schemas
4. **PWA focus**: Implement offline-first patterns, test service worker caching
5. **Performance targets**:
   - API p95 latency: <200ms reads, <500ms writes
   - Initial load: <2s
   - Bundle size: <500KB gzipped
6. **Accessibility**: WCAG 2.1 Level AA compliance required

<!-- MANUAL ADDITIONS END -->