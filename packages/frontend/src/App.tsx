import { useState } from 'react';
import { StationSearch } from './components/StationSearch';
import { DepartureBoard } from './components/DepartureBoard';
import { LineFilter } from './components/LineFilter';
import type { Stop } from '@chicagorail/shared';

function App() {
  const [selectedStop, setSelectedStop] = useState<Stop | null>(null);
  const [routeFilter, setRouteFilter] = useState<string | undefined>();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Chicago Rail</h1>
          <p className="text-muted-foreground">
            Track Metra train departures in real-time
          </p>
        </header>

        <div className="space-y-6">
          <StationSearch onSelectStation={setSelectedStop} />

          {selectedStop && (
            <div className="space-y-4">
              <LineFilter onFilterChange={setRouteFilter} />
              <DepartureBoard
                stopId={selectedStop.stop_id}
                routeFilter={routeFilter}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
