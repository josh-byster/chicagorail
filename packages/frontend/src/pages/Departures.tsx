import { useState } from 'react';
import { StationSearch } from '../components/StationSearch';
import { DepartureBoard } from '../components/DepartureBoard';
import { LineFilter } from '../components/LineFilter';
import type { Stop } from '@chicagorail/shared';

export function Departures() {
  const [selectedStop, setSelectedStop] = useState<Stop | null>(null);
  const [routeFilter, setRouteFilter] = useState<string | undefined>();

  return (
    <div className="min-h-[calc(100vh-73px)] bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">View Departures</h2>
          <p className="text-muted-foreground">
            Search for a station to see upcoming train departures
          </p>
        </div>

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
