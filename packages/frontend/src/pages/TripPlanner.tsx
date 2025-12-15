import { useState, useEffect } from 'react';
import { StationCommand } from '../components/StationCommand';
import { ArrowRight, Clock } from 'lucide-react';
import type { Stop, DirectTrip } from '@chicagorail/shared';
import { api } from '../lib/api';

export function TripPlanner() {
  const [origin, setOrigin] = useState<Stop | null>(null);
  const [destination, setDestination] = useState<Stop | null>(null);
  const [trips, setTrips] = useState<DirectTrip[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!origin || !destination) return;

    setLoading(true);
    setError(null);
    setSearched(true);

    try {
      const result = await api.findDirectTrips(origin.stop_id, destination.stop_id);
      setTrips(result.trips);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to find trips');
    } finally {
      setLoading(false);
    }
  };

  // Auto-search when both origin and destination are selected
  useEffect(() => {
    if (origin && destination) {
      handleSearch();
    }
  }, [origin, destination]);

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="min-h-[calc(100vh-73px)] bg-background">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-1">Plan Your Trip</h2>
          <p className="text-sm text-muted-foreground">
            Find direct trains between two stations
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-3 md:items-center">
            <div className="flex-1">
              <StationCommand
                onSelectStation={setOrigin}
                placeholder="Origin station..."
                selectedStation={origin}
              />
            </div>

            <ArrowRight className="h-5 w-5 text-muted-foreground flex-shrink-0 hidden md:block" />

            <div className="flex-1">
              <StationCommand
                onSelectStation={setDestination}
                placeholder="Destination station..."
                selectedStation={destination}
              />
            </div>

            {loading && (
              <div className="text-sm text-muted-foreground flex-shrink-0">
                Searching...
              </div>
            )}
          </div>

          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {searched && !loading && trips.length === 0 && !error && (
            <div className="p-6 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <h3 className="font-semibold mb-2">No Direct Trains Found</h3>
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                There are no direct trains between {origin?.stop_name} and {destination?.stop_name}.
                You may need to transfer at a connection point.
              </p>
            </div>
          )}

          {trips.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">
                Available Trains ({trips.length})
              </h3>

              {trips.map((trip, index) => (
                <div
                  key={`${trip.trip_id}-${index}`}
                  className="border rounded-lg p-4 hover:bg-accent transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: `#${trip.route.route_color}` }}
                      />
                      <div>
                        <div className="font-semibold">{trip.route.route_long_name}</div>
                        <div className="text-sm text-muted-foreground">
                          to {trip.trip_headsign}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {trip.duration_minutes} min
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Departs</div>
                      <div className="font-semibold text-lg">
                        {formatTime(trip.origin_departure)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {origin?.stop_name}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Arrives</div>
                      <div className="font-semibold text-lg">
                        {formatTime(trip.destination_arrival)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {destination?.stop_name}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <div className="p-4 bg-muted/50 rounded-lg text-center">
                <p className="text-xs text-muted-foreground">
                  Showing direct trains only • Times are approximate based on schedule
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
