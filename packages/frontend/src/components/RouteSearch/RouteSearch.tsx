import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StationSelect } from '@/components/StationSelect/StationSelect';
import { ArrowLeftRight } from 'lucide-react';

interface RouteSearchProps {
  onSearch: (origin: string, destination: string) => void;
}

export function RouteSearch({ onSearch }: RouteSearchProps) {
  const [origin, setOrigin] = useState<string>('');
  const [destination, setDestination] = useState<string>('');

  const handleSwap = () => {
    setOrigin(destination);
    setDestination(origin);
  };

  const handleSearch = () => {
    if (origin && destination) {
      onSearch(origin, destination);
    }
  };

  const isValid = origin && destination && origin !== destination;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Find Your Train</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">From</label>
          <StationSelect
            value={origin}
            onChange={setOrigin}
            placeholder="Select origin station"
          />
        </div>

        <div className="flex justify-center">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleSwap}
            disabled={!origin && !destination}
            aria-label="Swap stations"
          >
            <ArrowLeftRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">To</label>
          <StationSelect
            value={destination}
            onChange={setDestination}
            placeholder="Select destination station"
          />
        </div>

        <Button
          onClick={handleSearch}
          disabled={!isValid}
          className="w-full"
        >
          Search Trains
        </Button>

        {origin === destination && origin && (
          <p className="text-sm text-destructive">
            Origin and destination must be different
          </p>
        )}
      </CardContent>
    </Card>
  );
}
