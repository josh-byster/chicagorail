import { useState } from 'react';
import { StationSearch } from '../components/StationSearch';
import { DepartureBoard } from '../components/DepartureBoard';
import { LineFilter } from '../components/LineFilter';
import type { Stop } from '@chicagorail/shared';

export function Arrivals() {
  const [selectedStop, setSelectedStop] = useState<Stop | null>(null);
  const [routeFilter, setRouteFilter] = useState<string | undefined>();

  return (
    <div className="min-h-[calc(100vh-73px)] bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">View Arrivals</h2>
          <p className="text-muted-foreground">
            Search for a station to see incoming train arrivals
          </p>
        </div>

        <div className="space-y-6">
          <StationSearch onSelectStation={setSelectedStop} />

          {selectedStop && (
            <div className="space-y-4">
              <div className="p-4 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  Note: Arrivals view currently shows departures. Backend support for arrivals filtering coming soon.
                </p>
              </div>

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
