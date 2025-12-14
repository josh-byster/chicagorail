import { useState } from 'react';
import { StationSearch } from '../components/StationSearch';
import { Button } from '../components/ui/button';
import { ArrowRight } from 'lucide-react';
import type { Stop } from '@chicagorail/shared';

export function TripPlanner() {
  const [origin, setOrigin] = useState<Stop | null>(null);
  const [destination, setDestination] = useState<Stop | null>(null);

  const handleSearch = () => {
    // TODO: Implement trip planning logic
    console.log('Searching trips from', origin?.stop_name, 'to', destination?.stop_name);
  };

  return (
    <div className="min-h-[calc(100vh-73px)] bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Plan Your Trip</h2>
          <p className="text-muted-foreground">
            Find trains between two stations
          </p>
        </div>

        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-[1fr,auto,1fr] items-end">
            <div>
              <label className="block text-sm font-medium mb-2">
                Origin Station
              </label>
              <StationSearch
                onSelectStation={setOrigin}
                placeholder="Where are you starting from?"
              />
              {origin && (
                <p className="mt-2 text-sm text-muted-foreground">
                  Selected: {origin.stop_name}
                </p>
              )}
            </div>

            <div className="hidden md:flex items-center justify-center pb-3">
              <ArrowRight className="h-6 w-6 text-muted-foreground" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Destination Station
              </label>
              <StationSearch
                onSelectStation={setDestination}
                placeholder="Where are you going?"
              />
              {destination && (
                <p className="mt-2 text-sm text-muted-foreground">
                  Selected: {destination.stop_name}
                </p>
              )}
            </div>
          </div>

          <Button
            onClick={handleSearch}
            disabled={!origin || !destination}
            className="w-full"
            size="lg"
          >
            Find Trains
          </Button>

          {origin && destination && (
            <div className="p-6 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
              <h3 className="font-semibold mb-2">Coming Soon</h3>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Trip planning with multi-route connections is under development. For now, you can:
              </p>
              <ul className="mt-2 text-sm text-blue-700 dark:text-blue-300 list-disc list-inside space-y-1">
                <li>Check departures from {origin.stop_name}</li>
                <li>Check arrivals at {destination.stop_name}</li>
                <li>Plan your route based on the Metra system map</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
