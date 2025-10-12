# Implementation Plan: Fast Metra Train Tracker

**Branch**: `001-i-want-to` | **Date**: 2025-10-11 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-i-want-to/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Build a Progressive Web App for real-time Metra train tracking with emphasis on speed and accessibility. Users can quickly look up train times between stations (3-5 second target), view real-time train positions and delays, and save favorite routes for one-tap access. The application uses TypeScript monorepo architecture with shared data models between React frontend and Node.js backend, integrating with GTFS API for live train data.

## Technical Context

**Language/Version**: TypeScript 5.x (both frontend and backend)
**Primary Dependencies**:
- Frontend: React 18+, ShadCN UI, Vite, TanStack Query, Workbox (PWA)
- Backend: Node.js 20 LTS, Express, node-gtfs library
- Shared: Zod (schema validation), TypeScript path aliases for shared types

**Storage**:
- LocalStorage/IndexedDB (client-side: saved routes, cached train data)
- SQLite with WAL mode (backend: GTFS static + realtime data via node-gtfs library)

**Testing**:
- Frontend: Vitest, React Testing Library, Playwright (E2E)
- Backend: Vitest, Supertest (API testing)
- Shared: Type checking via tsc --noEmit

**Target Platform**:
- Frontend: PWA supporting modern browsers (Chrome 90+, Safari 14+, Firefox 88+)
- Backend: Linux server (DigitalOcean droplet)
- Deployment: Docker containers via GitHub Actions CI/CD

**Project Type**: Web application (monorepo with frontend + backend)

**Performance Goals**:
- Initial load: <2s (as per spec SC-003)
- API p95 latency: <200ms for reads (train data), <500ms for writes (save routes)
- Real-time updates: 30-second polling interval (spec SC-002)
- Bundle size: <500KB gzipped (constitution requirement)

**Constraints**:
- Offline-capable (PWA requirement)
- Mobile-first responsive design
- WCAG 2.1 Level AA accessibility
- GTFS API polling: 30-second intervals with If-Modified-Since headers
- Deployment platform: DigitalOcean App Platform

**Scale/Scope**:
- 11 Metra lines, ~230 stations
- Expected users: 100-1000 daily active users initially
- Real-time data for ~500 trains during peak hours
- 3 main screens (route search, train list, train detail)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Verify compliance with `.specify/memory/constitution.md` principles:

- [x] **Code Quality Standards**: Architecture supports readability, single responsibility, DRY, type safety
  - TypeScript provides full type safety across frontend/backend via shared types
  - Monorepo structure promotes DRY with shared models
  - ESLint + Prettier configured for consistent code style
  - Modular architecture: separate concerns (API, services, UI components)

- [x] **Testing Standards**: Test-first approach planned; coverage targets identified for critical paths
  - Critical paths (GTFS API integration, route lookup, real-time updates): 100% coverage target
  - Business logic (train filtering, delay calculations): 80% coverage target
  - Integration tests for primary user journeys (route search, train detail view)
  - E2E tests via Playwright for complete user workflows
  - CI/CD pipeline will run all tests on every commit

- [x] **User Experience Consistency**: Design system usage planned; accessibility requirements documented; responsive design considered
  - ShadCN UI provides consistent, accessible component library
  - Mobile-first responsive design planned
  - WCAG 2.1 Level AA compliance requirements documented in spec
  - Loading states for operations >200ms per constitution
  - Error messages will be user-friendly (no technical jargon)

- [x] **Performance Requirements**: Response time targets defined; resource constraints documented; scalability plan outlined
  - API p95 targets: <200ms reads, <500ms writes (meets constitution)
  - Initial load <2s, interactive <3s (meets constitution)
  - Bundle size <500KB gzipped (meets constitution)
  - Caching strategy: client-side (IndexedDB) + server-side (TBD in research)
  - 30-second polling interval balances freshness with API rate limits

**GATE STATUS**: ✅ PASSED - All constitutional principles satisfied. No violations to justify.

## Project Structure

### Documentation (this feature)

```
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```
packages/
├── shared/                    # Shared TypeScript types and schemas
│   ├── src/
│   │   ├── types/            # Shared TypeScript interfaces
│   │   │   ├── station.ts
│   │   │   ├── train.ts
│   │   │   ├── route.ts
│   │   │   └── alert.ts
│   │   └── schemas/          # Zod validation schemas
│   │       └── index.ts
│   ├── tests/
│   └── package.json
│
├── backend/                   # Node.js/Express API server
│   ├── src/
│   │   ├── models/           # Data models (if using ORM)
│   │   ├── services/         # Business logic
│   │   │   ├── gtfs.service.ts      # GTFS API integration
│   │   │   ├── train.service.ts     # Train data processing
│   │   │   └── cache.service.ts     # Caching logic
│   │   ├── api/              # Express routes/controllers
│   │   │   ├── routes.ts     # Route endpoints
│   │   │   ├── trains.ts     # Train endpoints
│   │   │   └── stations.ts   # Station endpoints
│   │   ├── middleware/       # Express middleware
│   │   └── server.ts         # Entry point
│   ├── tests/
│   │   ├── unit/
│   │   ├── integration/
│   │   └── contract/         # API contract tests
│   └── package.json
│
└── frontend/                  # React PWA
    ├── public/
    │   ├── manifest.json     # PWA manifest
    │   └── icons/            # App icons (various sizes)
    ├── src/
    │   ├── components/       # React components
    │   │   ├── ui/          # ShadCN UI components
    │   │   ├── RouteSearch/ # Route selection component
    │   │   ├── TrainList/   # Train schedule list
    │   │   └── TrainDetail/ # Train detail view
    │   ├── pages/           # Page components
    │   │   ├── HomePage.tsx
    │   │   └── TrainDetailPage.tsx
    │   ├── services/        # API client, PWA services
    │   │   ├── api.ts       # Backend API client
    │   │   └── storage.ts   # IndexedDB wrapper
    │   ├── hooks/           # Custom React hooks
    │   ├── lib/             # Utilities
    │   └── App.tsx
    ├── tests/
    │   ├── unit/
    │   ├── integration/
    │   └── e2e/             # Playwright tests
    └── package.json

# Monorepo root files
├── package.json             # Workspace configuration
├── pnpm-workspace.yaml      # pnpm workspace config
├── tsconfig.base.json       # Shared TypeScript config
├── .github/
│   └── workflows/
│       └── ci-cd.yml        # GitHub Actions workflow
└── docker-compose.yml       # Local development setup
```

**Structure Decision**: Monorepo with three packages (shared, backend, frontend) using pnpm workspaces. This architecture enables:
- Type-safe shared models between frontend and backend via `packages/shared`
- Independent testing and deployment of frontend/backend
- Simplified development with single repository
- CI/CD pipeline can build/test/deploy all packages together

## Complexity Tracking

*Fill ONLY if Constitution Check has violations that must be justified*

**No violations** - All constitutional principles are satisfied. No complexity justification required.

---

## Phase 1 Design Complete

### Constitution Check (Re-evaluated Post-Design)

- [x] **Code Quality Standards**: ✅ PASSED
  - TypeScript enforces type safety across monorepo
  - ShadCN component library promotes DRY and consistent patterns
  - ESLint + Prettier configured in all packages
  - Clear separation of concerns: shared types, backend services, frontend components

- [x] **Testing Standards**: ✅ PASSED
  - Test frameworks configured (Vitest for unit/integration, Playwright for E2E)
  - Coverage targets defined (100% critical paths, 80% business logic)
  - API contracts defined in OpenAPI spec enable contract testing
  - quickstart.md documents test execution workflow

- [x] **User Experience Consistency**: ✅ PASSED
  - ShadCN UI components (built on Radix UI) ensure WCAG 2.1 Level AA compliance
  - Mobile-first responsive design planned in architecture
  - PWA manifest and service worker strategy defined
  - Error handling and loading states documented in data model
  - Offline support via IndexedDB detailed in research.md

- [x] **Performance Requirements**: ✅ PASSED
  - 30-second polling interval meets data freshness requirement
  - SQLite with WAL mode supports target p95 latency <200ms
  - Frontend bundle size target <500KB via tree-shaking and lazy loading
  - Caching strategy (client + server) supports offline performance
  - Performance monitoring approach documented in quickstart.md

**FINAL GATE STATUS**: ✅ ALL GATES PASSED - Ready for implementation (`/speckit.tasks`)

---

## Generated Artifacts

All Phase 0 and Phase 1 artifacts have been created:

✅ **Phase 0 - Research**:
- `research.md`: Technical decisions with evidence-based recommendations
  - Backend storage: SQLite with node-gtfs
  - API polling: 30-second intervals with If-Modified-Since headers
  - GTFS library: node-gtfs for static + realtime data
  - PWA strategy: Workbox with hybrid caching
  - UI library: ShadCN UI with Tailwind CSS

✅ **Phase 1 - Design**:
- `data-model.md`: Complete entity definitions with TypeScript interfaces, Zod schemas, relationships, and validation rules
  - Station, Line, Train, StopTime, SavedRoute, ServiceAlert entities
  - State transitions for Train status
  - Caching strategy (client + server)
  - Data flow documentation
- `contracts/api.openapi.yaml`: Full OpenAPI 3.0 specification
  - 9 REST endpoints (stations, lines, trains, alerts, health)
  - Request/response schemas with examples
  - Error responses
- `quickstart.md`: Comprehensive development guide
  - Prerequisites and setup instructions
  - Monorepo workflow
  - Testing commands
  - Debugging tips
  - Troubleshooting guide

✅ **Agent Context**:
- `CLAUDE.md`: Updated with TypeScript monorepo structure

---

## Next Phase: Task Generation

With planning complete, the next command generates actionable implementation tasks:

```bash
/speckit.tasks
```

This will create `specs/001-i-want-to/tasks.md` with:
- Dependency-ordered tasks for each user story
- Parallel execution opportunities
- Test-first workflow integration
- Checkpoints for independent story validation
