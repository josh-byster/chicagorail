import { useState } from 'react';
import { RouteSearch } from '@/components/RouteSearch/RouteSearch';
import { TrainList } from '@/components/TrainList/TrainList';
import { useTrains } from '@/hooks/useTrains';

export default function HomePage() {
  const [origin, setOrigin] = useState<string>('');
  const [destination, setDestination] = useState<string>('');
  const [hasSearched, setHasSearched] = useState(false);

  const { data: trains, isLoading, error } = useTrains({
    origin,
    destination,
    enabled: hasSearched && !!origin && !!destination,
  });

  const handleSearch = (newOrigin: string, newDestination: string) => {
    setOrigin(newOrigin);
    setDestination(newDestination);
    setHasSearched(true);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-primary">Fast Metra Train Tracker</h1>
        <p className="text-muted-foreground mt-2">Find your train in seconds</p>
      </header>

      <main className="space-y-6">
        {/* Route Search */}
        <RouteSearch onSearch={handleSearch} />

        {/* Train Results */}
        {hasSearched && (
          <div>
            <h2 className="text-xl font-semibold mb-4">
              {origin && destination ? 'Upcoming Trains' : 'Select a route to see trains'}
            </h2>
            <TrainList
              trains={trains}
              isLoading={isLoading}
              error={error}
              isEmpty={!isLoading && (!trains || trains.length === 0)}
            />
          </div>
        )}
      </main>
    </div>
  );
}
