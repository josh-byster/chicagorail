# Chicago Rail - Product Requirements Document

## Vision
A lightning-fast Metra schedule lookup tool for power users who ride the train daily. Optimized for one thing: **get me the next train times, now.**

## Target User
- Daily Metra commuters
- Riders who use multiple lines
- People checking schedules on-the-go (mobile-first)
- Users who know their stations and just need times

## Core Principle
**Speed over everything.** Every interaction should feel instant. No unnecessary steps between the user and the data they need.

---

## User Flow (Primary)

```
1. Open app
2. Type station name (autocomplete as you type)
3. See next departures immediately
```

That's it. Three steps max to see train times.

---

## Features

### 1. Quick Station Search (Primary Feature)
- **Instant autocomplete** - Results appear as user types (no submit button needed)
- **Fuzzy matching** - "ogil" matches "Ogilvie Transportation Center"
- **Recent stations** - Show last 3-5 stations used (localStorage)
- **Keyboard navigation** - Arrow keys + Enter to select

### 2. Departure Board View
Once a station is selected, show a clean departure board:

```
OGILVIE TRANSPORTATION CENTER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

BNSF Line          → Aurora           5 min
UP Northwest       → Crystal Lake     12 min
Milwaukee District → Fox Lake         18 min
BNSF Line          → Aurora           25 min
...
```

- **Relative times** - "5 min" not "3:47 PM" (with actual time on hover/tap)
- **Color-coded by line** - Use Metra's official route colors
- **Auto-refresh** - Update times every 30 seconds
- **Direction indicator** - Clear inbound/outbound designation

### 3. Line Filter (Quick Toggle)
- When viewing a station, quickly filter to show only specific lines
- Useful for stations served by multiple routes
- Toggle chips at top of departure board

### 4. Favorites/Pinned Stations
- Star stations for quick access
- Pinned stations appear at top when opening app
- Swipe to access from any screen

### 5. Date Picker (Secondary)
- Default: Today
- Simple date selector for checking future schedules
- Hidden by default, accessible via icon

---

## Technical Requirements

### API Integration
| Endpoint | Usage |
|----------|-------|
| `GET /api/routes` | Load all routes on app init, cache |
| `GET /api/search/stops?q=` | Autocomplete search |
| `GET /api/routes/:id/trips?date=` | Fetch departures for selected route |

### Performance Targets
- **First Contentful Paint**: < 1s
- **Search results**: < 100ms after typing stops
- **Time to departure view**: < 500ms after station select

### Caching Strategy
- Routes: Cache indefinitely (rarely change)
- Recent searches: localStorage
- Favorite stations: localStorage
- Trip data: Cache per route+date for session

---

## UI Components Needed

### shadcn/ui Components
- `Command` - For search/autocomplete (cmdk-based)
- `Card` - Departure cards
- `Badge` - Route line indicators
- `Button` - Actions
- `Popover` - Date picker
- `Calendar` - Date selection
- `Skeleton` - Loading states
- `ScrollArea` - Scrollable departure list

### Custom Components
1. **StationSearch** - Command-based autocomplete
2. **DepartureBoard** - List of upcoming departures
3. **DepartureRow** - Single departure with time, line, destination
4. **LineFilter** - Toggle chips for filtering routes
5. **RecentStations** - Quick access to recent/favorite stations

---

## Design Principles

1. **Dense information** - Show more data, less chrome
2. **High contrast** - Easy to read in sunlight or dark platforms
3. **Touch-friendly** - Large tap targets for mobile
4. **Dark mode default** - Easier on eyes, saves battery
5. **Minimal navigation** - Everything accessible from one screen

---

## MVP Scope (Phase 1)

1. Station search with autocomplete
2. Departure board showing next trains
3. Recent stations (localStorage)
4. Dark/light mode
5. Mobile-responsive

### Future Phases
- Trip planning (A → B)
- Push notifications for delays
- Offline support (PWA)
- Real-time delay integration (if API available)

---

## Success Metrics

- Time from app open to viewing departures: < 5 seconds
- User can find any station in < 3 keystrokes
- Zero loading spinners visible for cached data
