# Tasks: Fast Metra Train Tracker

**Feature Branch**: `001-i-want-to`
**Input**: Design documents from `/specs/001-i-want-to/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api.openapi.yaml

**Tests**: Tests are NOT explicitly requested in the spec, so test tasks are omitted per template guidance.

**MCP Tools**: This project REQUIRES using MCP tools:
- **ShadCN UI MCP**: Use `mcp__shadcn__getComponent` before implementing ANY ShadCN component (see CLAUDE.md for details)
- **Ref MCP**: Use `mcp__Ref__ref_search_documentation` for searching library documentation (TanStack Query, node-gtfs, Workbox, etc.)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, Setup, Foundation)
- Include exact file paths in descriptions

## Path Conventions
This is a monorepo project with:
- **Shared types**: `packages/shared/src/`
- **Backend**: `packages/backend/src/`
- **Frontend**: `packages/frontend/src/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and monorepo structure

- [X] T001 [Setup] Create monorepo structure with packages/ directory containing shared/, backend/, and frontend/
- [X] T002 [Setup] Initialize pnpm workspace configuration in pnpm-workspace.yaml
- [X] T003 [Setup] Create root package.json with workspace references and dev scripts
- [X] T004 [P] [Setup] Create tsconfig.base.json with shared TypeScript configuration
- [X] T005 [P] [Setup] Setup ESLint configuration in .eslintrc.js for monorepo
- [X] T006 [P] [Setup] Setup Prettier configuration in .prettierrc
- [X] T007 [P] [Setup] Create .env.example with required environment variables (METRA_API_KEY, GTFS_STATIC_URL, GTFS_REALTIME_URL, PORT, NODE_ENV, DATABASE_PATH, VITE_API_URL)
- [X] T008 [P] [Setup] Create .gitignore with node_modules, dist, .env, data/*.db
- [X] T009 [P] [Setup] Setup GitHub Actions workflow in .github/workflows/ci-cd.yml for testing and deployment
- [X] T010 [P] [Setup] Create docker-compose.yml for local development

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Shared Package Foundation

- [X] T011 [P] [Foundation] Initialize packages/shared package.json with TypeScript, Zod dependencies
- [X] T012 [P] [Foundation] Create packages/shared/tsconfig.json extending base config
- [X] T013 [P] [Foundation] Setup packages/shared/src/index.ts as main export file

### Backend Package Foundation

- [X] T014 [P] [Foundation] Initialize packages/backend package.json with Express, node-gtfs, SQLite3, Zod dependencies
- [X] T015 [P] [Foundation] Create packages/backend/tsconfig.json extending base config
- [X] T016 [Foundation] Setup Express app structure in packages/backend/src/server.ts with middleware
- [X] T017 [P] [Foundation] Create packages/backend/src/middleware/error-handler.ts for centralized error handling
- [X] T018 [P] [Foundation] Create packages/backend/src/middleware/logger.ts for request logging
- [X] T019 [P] [Foundation] Create packages/backend/src/middleware/cors.ts for CORS configuration
- [X] T020 [Foundation] Setup environment configuration in packages/backend/src/config/env.ts
- [X] T021 [Foundation] Initialize SQLite database with node-gtfs in packages/backend/src/services/gtfs-init.service.ts (💡 Use Ref MCP: `mcp__Ref__ref_search_documentation query="node-gtfs library setup"`)
- [X] T022 [Foundation] Import GTFS static data (Metra schedule) using custom JSON endpoint integration (💡 Use Ref MCP: `mcp__Ref__ref_search_documentation query="node-gtfs importGtfs configuration"`)
- [X] T023 [Foundation] Enable SQLite WAL mode and create indexes per research.md in packages/backend/src/services/database.service.ts
- [ ] T024 [Foundation] Setup GTFS realtime polling service skeleton in packages/backend/src/services/gtfs-realtime.service.ts (30-second interval with If-Modified-Since headers) (💡 Use Ref MCP: `mcp__Ref__ref_search_documentation query="node-gtfs realtime API"`)

### Frontend Package Foundation

- [X] T025 [P] [Foundation] Initialize packages/frontend package.json with React 18, Vite, TypeScript, TanStack Query, Workbox dependencies
- [X] T026 [P] [Foundation] Create packages/frontend/tsconfig.json extending base config
- [X] T027 [P] [Foundation] Setup Vite configuration in packages/frontend/vite.config.ts with PWA plugin
- [X] T028 [P] [Foundation] Create packages/frontend/tailwind.config.js for Tailwind CSS
- [X] T029 [P] [Foundation] Install ShadCN UI and setup components.json configuration (💡 Use ShadCN MCP: `mcp__shadcn__getComponents` to see available components)
- [X] T030 [Foundation] Create packages/frontend/src/App.tsx main component with routing setup
- [X] T031 [P] [Foundation] Setup TanStack Query client in packages/frontend/src/lib/query-client.ts (💡 Use Ref MCP: `mcp__Ref__ref_search_documentation query="TanStack Query setup TypeScript"`)
- [X] T032 [P] [Foundation] Create packages/frontend/src/services/api.ts as backend API client
- [X] T033 [P] [Foundation] Setup Workbox service worker strategy in packages/frontend/src/service-worker.ts (Network First for API, Cache First for static assets) (💡 Use Ref MCP: `mcp__Ref__ref_search_documentation query="Workbox service worker strategies"`)
- [X] T034 [P] [Foundation] Create packages/frontend/src/services/storage.ts as IndexedDB wrapper using Dexie.js
- [X] T035 [P] [Foundation] Create packages/frontend/public/manifest.json for PWA configuration
- [X] T036 [P] [Foundation] Create app icons in various sizes in packages/frontend/public/icons/

### Shared Type Definitions (Required for all stories)

- [X] T037 [P] [Foundation] Define Station interface and Zod schema in packages/shared/src/types/station.ts
- [X] T038 [P] [Foundation] Define Line interface and Zod schema in packages/shared/src/types/line.ts
- [X] T039 [P] [Foundation] Define Train interface, TrainStatus enum, Position interface, and Zod schemas in packages/shared/src/types/train.ts
- [X] T040 [P] [Foundation] Define StopTime interface and Zod schema in packages/shared/src/types/stoptime.ts
- [X] T041 [P] [Foundation] Define ServiceAlert interface, AlertType enum, AlertSeverity enum, and Zod schemas in packages/shared/src/types/alert.ts
- [X] T042 [Foundation] Export all types and schemas from packages/shared/src/index.ts
- [X] T043 [Foundation] Build shared package (pnpm build in packages/shared/)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Quick Route Lookup (Priority: P1) 🎯 MVP

**Goal**: Users can instantly see upcoming trains from their current station to their destination without navigating through multiple menus.

**Independent Test**: User can input origin and destination stations and see upcoming train times within 3 seconds from app launch.

**Required Entities**: Station, Line, Train, StopTime
**Required Endpoints**: GET /stations, GET /trains (with origin & destination query params), GET /trains/{tripId}

### Backend Implementation for US1

- [ ] T044 [P] [US1] Create Station service in packages/backend/src/services/station.service.ts (query stations from SQLite, filter by line)
- [ ] T045 [P] [US1] Create Train service in packages/backend/src/services/train.service.ts (query trains by origin/destination, apply realtime delays)
- [ ] T046 [US1] Create GET /stations endpoint in packages/backend/src/api/stations.ts (list all stations, filter by line_id query param)
- [ ] T047 [US1] Create GET /stations/:stationId endpoint in packages/backend/src/api/stations.ts (get single station details)
- [ ] T048 [US1] Create GET /trains endpoint in packages/backend/src/api/trains.ts (requires origin, destination query params; optional limit, time; returns upcoming trains)
- [ ] T049 [US1] Create GET /trains/:tripId endpoint in packages/backend/src/api/trains.ts (detailed train info with all stops)
- [ ] T050 [US1] Register station and train routes in packages/backend/src/server.ts
- [ ] T051 [US1] Add request validation middleware for train query parameters in packages/backend/src/middleware/validate-trains.ts

### Frontend Implementation for US1

- [X] T052 [P] [US1] Install and configure ShadCN Select component for station selection (💡 Use ShadCN MCP: `mcp__shadcn__getComponent component="select"`)
- [X] T053 [P] [US1] Install and configure ShadCN Card component for train display (💡 Use ShadCN MCP: `mcp__shadcn__getComponent component="card"`)
- [X] T054 [P] [US1] Install and configure ShadCN Button component for interactions (💡 Use ShadCN MCP: `mcp__shadcn__getComponent component="button"`)
- [X] T055 [US1] Create StationSelect component in packages/frontend/src/components/StationSelect/StationSelect.tsx (searchable dropdown with station names)
- [X] T056 [US1] Create RouteSearch component in packages/frontend/src/components/RouteSearch/RouteSearch.tsx (origin/destination station selectors, swap button)
- [X] T057 [US1] Create TrainListItem component in packages/frontend/src/components/TrainList/TrainListItem.tsx (displays single train with departure/arrival times, line color, platform)
- [X] T058 [US1] Create TrainList component in packages/frontend/src/components/TrainList/TrainList.tsx (renders list of trains)
- [X] T059 [US1] Create HomePage component in packages/frontend/src/pages/HomePage.tsx (combines RouteSearch + TrainList)
- [X] T060 [US1] Create TrainDetailPage component in packages/frontend/src/pages/TrainDetailPage.tsx (shows all stops for selected train)
- [X] T061 [US1] Add API client methods in packages/frontend/src/services/api.ts (fetchStations, fetchTrains, fetchTrainDetail)
- [X] T062 [US1] Create TanStack Query hooks in packages/frontend/src/hooks/useStations.ts and packages/frontend/src/hooks/useTrains.ts
- [X] T063 [US1] Setup React Router in packages/frontend/src/App.tsx with routes for HomePage and TrainDetailPage
- [X] T064 [US1] Cache stations in IndexedDB on first load in packages/frontend/src/services/storage.ts
- [X] T065 [US1] Implement loading states for train queries (Skeleton components from ShadCN) (💡 Use ShadCN MCP: `mcp__shadcn__getComponent component="skeleton"`)
- [X] T066 [US1] Implement error handling UI for API failures (ShadCN Alert component) (💡 Use ShadCN MCP: `mcp__shadcn__getComponent component="alert"`)

**Checkpoint**: At this point, User Story 1 should be fully functional - users can search routes and see upcoming trains

---

## Phase 4: User Story 2 - Real-Time Train Status (Priority: P2)

**Goal**: Users can see the current location and status of their train to know if it's on time, delayed, or approaching their station.

**Independent Test**: User can see live train position updates and delay notifications for their selected route without manual refresh.

**Required Entities**: Train (with current_position, status, delay_minutes), ServiceAlert
**Required Endpoints**: GET /alerts, GET /trains (already implemented, but needs realtime enhancement), GET /lines

### Backend Implementation for US2

- [ ] T067 [P] [US2] Implement GTFS Realtime polling in packages/backend/src/services/gtfs-realtime.service.ts (fetch vehicle positions, trip updates every 30 seconds)
- [ ] T068 [US2] Update Train service in packages/backend/src/services/train.service.ts to merge realtime position and delay data
- [ ] T069 [P] [US2] Create ServiceAlert service in packages/backend/src/services/alert.service.ts (query active alerts from GTFS realtime)
- [ ] T070 [P] [US2] Create Line service in packages/backend/src/services/line.service.ts (query lines from SQLite)
- [ ] T071 [US2] Create GET /lines endpoint in packages/backend/src/api/lines.ts (list all lines)
- [ ] T072 [US2] Create GET /lines/:lineId endpoint in packages/backend/src/api/lines.ts (get single line details)
- [ ] T073 [US2] Create GET /alerts endpoint in packages/backend/src/api/alerts.ts (filter by line_id or station_id query params)
- [ ] T074 [US2] Create GET /health endpoint in packages/backend/src/api/health.ts (return status, gtfs_last_updated, gtfs_static_version)
- [ ] T075 [US2] Register alert, line, and health routes in packages/backend/src/server.ts
- [ ] T076 [US2] Add caching layer in packages/backend/src/services/cache.service.ts (cache trains for 30 seconds to reduce SQLite queries)

### Frontend Implementation for US2

- [ ] T077 [P] [US2] Install and configure ShadCN Badge component for status indicators (💡 Use ShadCN MCP: `mcp__shadcn__getComponent component="badge"`)
- [ ] T078 [P] [US2] Install and configure ShadCN Alert component for service alerts (💡 Use ShadCN MCP: `mcp__shadcn__getComponent component="alert"`)
- [ ] T079 [US2] Create TrainStatus component in packages/frontend/src/components/TrainStatus/TrainStatus.tsx (shows status badge: on_time/delayed/cancelled with color coding)
- [ ] T080 [US2] Update TrainListItem to display delay_minutes and status badge from TrainStatus component
- [ ] T081 [US2] Create TrainPosition component in packages/frontend/src/components/TrainDetail/TrainPosition.tsx (progress bar showing current position between origin and destination)
- [ ] T082 [US2] Update TrainDetailPage to include TrainPosition component and show current_station_id
- [ ] T083 [US2] Create ServiceAlertBanner component in packages/frontend/src/components/ServiceAlertBanner/ServiceAlertBanner.tsx (displays active alerts)
- [ ] T084 [US2] Add ServiceAlertBanner to HomePage (show alerts affecting searched route)
- [ ] T085 [US2] Implement auto-refresh using TanStack Query refetchInterval (30 seconds) for train data in packages/frontend/src/hooks/useTrains.ts
- [ ] T086 [US2] Add visual notification when train is approaching (within 5 minutes) in packages/frontend/src/components/TrainList/TrainList.tsx
- [ ] T087 [US2] Update IndexedDB storage to cache realtime train data with 30-second TTL in packages/frontend/src/services/storage.ts
- [ ] T088 [US2] Add "Last updated" timestamp display in packages/frontend/src/components/TrainList/TrainList.tsx
- [ ] T089 [US2] Handle offline scenario: show cached data with staleness indicator in packages/frontend/src/components/TrainList/TrainList.tsx

**Checkpoint**: At this point, User Stories 1 AND 2 should both work - users can search routes AND see realtime status

---

## Phase 5: User Story 3 - Saved Routes & Favorites (Priority: P3)

**Goal**: Users can save frequently used routes for instant one-tap access.

**Independent Test**: User can save routes and access them with a single tap from the home screen.

**Required Entities**: SavedRoute (client-side only)
**Required Endpoints**: None (fully client-side implementation)

### Backend Implementation for US3

No backend changes required - SavedRoute is stored entirely in client-side LocalStorage/IndexedDB per spec.

### Frontend Implementation for US3

- [X] T090 [P] [US3] Define SavedRoute interface in packages/shared/src/types/route.ts with Zod schema
- [ ] T091 [US3] Create SavedRoute storage service in packages/frontend/src/services/saved-routes.ts (CRUD operations using LocalStorage + IndexedDB)
- [ ] T092 [P] [US3] Install and configure ShadCN Dialog component for save route modal (💡 Use ShadCN MCP: `mcp__shadcn__getComponent component="dialog"`)
- [ ] T093 [P] [US3] Install and configure ShadCN Input component for route label input (💡 Use ShadCN MCP: `mcp__shadcn__getComponent component="input"`)
- [ ] T094 [US3] Create SaveRouteDialog component in packages/frontend/src/components/SavedRoutes/SaveRouteDialog.tsx (modal to label and save current route)
- [ ] T095 [US3] Create SavedRouteCard component in packages/frontend/src/components/SavedRoutes/SavedRouteCard.tsx (displays favorite route with next train time, origin → destination)
- [ ] T096 [US3] Create SavedRoutesList component in packages/frontend/src/components/SavedRoutes/SavedRoutesList.tsx (grid of SavedRouteCard components)
- [ ] T097 [US3] Update HomePage to show SavedRoutesList above RouteSearch
- [ ] T098 [US3] Add "Save Route" button to RouteSearch component that opens SaveRouteDialog
- [ ] T099 [US3] Implement route deletion: add delete button to SavedRouteCard
- [ ] T100 [US3] Implement "last used" tracking: update last_used_at and use_count when tapping a SavedRouteCard
- [ ] T101 [US3] Auto-display last-used route on app launch if user has saved routes in packages/frontend/src/pages/HomePage.tsx
- [ ] T102 [US3] Fetch and display next train time for each saved route in SavedRouteCard using useTrains hook

**Checkpoint**: All user stories should now be independently functional - MVP complete with all P1, P2, P3 features

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T103 [P] [Polish] Add loading states for all async operations (skeletons from ShadCN) (💡 Use ShadCN MCP: `mcp__shadcn__getComponent component="skeleton"`)
- [ ] T104 [P] [Polish] Implement user-friendly error messages across all components (no technical jargon)
- [ ] T105 [P] [Polish] Add keyboard navigation support to all interactive components
- [ ] T106 [P] [Polish] Test screen reader compatibility (WCAG 2.1 Level AA) across all pages
- [ ] T107 [P] [Polish] Optimize bundle size: lazy load TrainDetailPage and heavy components
- [ ] T108 [P] [Polish] Add performance monitoring: measure p95 latency for API calls in packages/backend/src/middleware/performance.ts
- [ ] T109 [P] [Polish] Run Lighthouse PWA audit: target score 90+ (check manifest, service worker, offline support)
- [ ] T110 [P] [Polish] Test on real mobile devices (iOS Safari, Android Chrome) for responsive design
- [ ] T111 [P] [Polish] Add "Install App" prompt for PWA installation
- [ ] T112 [P] [Polish] Setup error tracking (consider Sentry integration)
- [ ] T113 [Polish] Verify quickstart.md instructions by running through setup on fresh machine
- [ ] T114 [Polish] Update CLAUDE.md with any new commands or project structure changes
- [ ] T115 [P] [Polish] Create Docker production image with multi-stage build
- [ ] T116 [P] [Polish] Test Docker deployment locally
- [ ] T117 [Polish] Deploy to DigitalOcean App Platform and verify production environment
- [ ] T118 [P] [Polish] Setup weekly GTFS static data import cron job in packages/backend/src/services/gtfs-init.service.ts
- [ ] T119 [P] [Polish] Add rate limiting middleware to protect API endpoints in packages/backend/src/middleware/rate-limit.ts
- [ ] T120 [Polish] Final validation: test all user stories end-to-end in production environment

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational (Phase 2) completion
- **User Story 2 (Phase 4)**: Depends on Foundational (Phase 2) completion - CAN run in parallel with US1 with separate developer
- **User Story 3 (Phase 5)**: Depends on Foundational (Phase 2) and User Story 1 (needs train query functionality) - CAN run in parallel with US2
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: No dependencies on other stories - Can start after Foundational
- **User Story 2 (P2)**: No dependencies on US1 - Can start after Foundational (enhances existing train display)
- **User Story 3 (P3)**: Soft dependency on US1 (uses train query functionality) - Should start after US1 complete or run in parallel with coordination

### Within Each User Story

**Backend First Approach**:
1. Backend services before API endpoints
2. API endpoints before frontend integration
3. Core functionality before caching/optimization

**Frontend Flow**:
1. Install ShadCN components needed
2. Create atomic components (TrainListItem, StationSelect)
3. Create composite components (TrainList, RouteSearch)
4. Create pages (HomePage, TrainDetailPage)
5. Add routing and state management
6. Add caching and offline support

### Parallel Opportunities

**Phase 1 (Setup)**: T004, T005, T006, T007, T008, T009, T010 can all run in parallel

**Phase 2 (Foundation)**:
- Shared, Backend, Frontend package initialization can run in parallel (T011-T013, T014-T015, T025-T029)
- Type definitions (T037-T041) can all run in parallel
- Once Express app is setup (T016), middleware tasks (T017, T018, T019) can run in parallel

**Phase 3 (US1)**:
- Backend services (T044, T045) can run in parallel
- ShadCN component installations (T052, T053, T054) can run in parallel
- Frontend atomic components can run in parallel after ShadCN components ready

**Phase 4 (US2)**:
- Backend services (T069, T070) can run in parallel
- ShadCN component installations (T077, T078) can run in parallel

**Phase 5 (US3)**:
- ShadCN component installations (T092, T093) can run in parallel
- Frontend components can be built in parallel with coordination

**Phase 6 (Polish)**: Most polish tasks (T103-T112, T114-T119) can run in parallel

**Multi-Story Parallelization**:
- Once Foundational (Phase 2) is complete, US1 and US2 can be developed in parallel by different developers
- US3 can start once US1's train query functionality is complete

---

## Parallel Example: Foundation Phase

```bash
# After Express app setup (T016), launch middleware tasks together:
Task T017: "Create error-handler.ts middleware"
Task T018: "Create logger.ts middleware"
Task T019: "Create cors.ts middleware"

# Launch all type definition tasks together:
Task T037: "Define Station interface and schema"
Task T038: "Define Line interface and schema"
Task T039: "Define Train interface and schema"
Task T040: "Define StopTime interface and schema"
Task T041: "Define ServiceAlert interface and schema"
```

## Parallel Example: User Story 1

```bash
# Launch backend services together:
Task T044: "Create Station service"
Task T045: "Create Train service"

# Launch ShadCN installations together:
Task T052: "Install ShadCN Select component"
Task T053: "Install ShadCN Card component"
Task T054: "Install ShadCN Button component"

# After services ready, launch API endpoints together:
Task T046: "Create GET /stations endpoint"
Task T047: "Create GET /stations/:stationId endpoint"
Task T048: "Create GET /trains endpoint"
Task T049: "Create GET /trains/:tripId endpoint"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

**Fastest path to value**:

1. Complete Phase 1: Setup (~2-3 hours)
2. Complete Phase 2: Foundational (~1-2 days) - CRITICAL, blocks everything
3. Complete Phase 3: User Story 1 (~2-3 days)
4. **STOP and VALIDATE**: Test route lookup end-to-end
5. Deploy/demo if ready

**Total MVP Time Estimate**: 4-5 days for single developer

### Incremental Delivery

**Recommended approach for production**:

1. **Week 1**: Setup + Foundational → Foundation ready
2. **Week 2**: User Story 1 → Test independently → Deploy/Demo (MVP! 🎯)
   - Users can search routes and see train times
3. **Week 3**: User Story 2 → Test independently → Deploy/Demo
   - Adds realtime tracking and delay notifications
4. **Week 4**: User Story 3 → Test independently → Deploy/Demo
   - Adds saved routes for power users
5. **Week 5**: Polish → Production-ready system

Each user story adds value without breaking previous functionality.

### Parallel Team Strategy

**With 2-3 developers**:

1. **All developers**: Complete Setup + Foundational together (1 week)
2. Once Foundational is done:
   - **Developer A**: User Story 1 (route lookup)
   - **Developer B**: User Story 2 (realtime status) - requires coordination with A for train display components
   - **Developer C**: Setup Polish tasks (monitoring, performance, accessibility)
3. **Developer C**: User Story 3 (saved routes) once US1 is complete
4. **All developers**: Final integration, testing, and deployment polish

---

## Task Summary

**Total Tasks**: 120 tasks
**By Phase**:
- Phase 1 (Setup): 10 tasks
- Phase 2 (Foundation): 33 tasks
- Phase 3 (US1 - Quick Route Lookup): 23 tasks
- Phase 4 (US2 - Real-Time Status): 23 tasks
- Phase 5 (US3 - Saved Routes): 13 tasks
- Phase 6 (Polish): 18 tasks

**By User Story**:
- User Story 1 (P1 - Quick Route Lookup): 23 tasks → MVP core functionality
- User Story 2 (P2 - Real-Time Status): 23 tasks → Realtime enhancements
- User Story 3 (P3 - Saved Routes): 13 tasks → Power user feature

**Parallel Opportunities**: 50+ tasks marked [P] for parallel execution

**Independent Test Criteria**:
- **US1**: Can search origin/destination and see upcoming trains in <5 seconds
- **US2**: Can see train delays and position updates every 30 seconds automatically
- **US3**: Can save a route and access it with 1 tap showing current train times

**Suggested MVP Scope**: Phase 1 + Phase 2 + Phase 3 (User Story 1 only) = 66 tasks

---

## Notes

- **MCP Tools REQUIRED**: Always use `mcp__shadcn__getComponent` before implementing ShadCN components and `mcp__Ref__ref_search_documentation` for library documentation lookups (see CLAUDE.md for full details)
- Tests are omitted as they were not explicitly requested in the feature specification
- All [P] tasks indicate different files with no dependencies - safe for parallel execution
- Each user story is independently testable and deployable
- Foundation phase (Phase 2) is CRITICAL - must complete before any user story work begins
- User Story 1 delivers core MVP value - prioritize completing it first
- User Stories 2 and 3 are enhancements that can be added incrementally
- Commit after each task or logical group of tasks
- Use checkpoints to validate each story works independently before proceeding
- Monitor performance targets: API p95 <200ms, initial load <2s, bundle <500KB gzipped
- 💡 Look for emoji lightbulbs (💡) in tasks - they indicate where to use MCP tools
