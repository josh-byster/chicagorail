import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StationSelect } from '@/components/StationSelect/StationSelect';
import { ArrowLeftRight, Bookmark } from 'lucide-react';
import { SaveRouteDialog } from '@/components/SavedRoutes/SaveRouteDialog';
import { useStations } from '@/hooks/useStations';
import { saveRoute } from '@/services/saved-routes';
import { SavedRoute } from '@metra/shared';

interface RouteSearchProps {
  onSearch: (origin: string, destination: string) => void;
}

export function RouteSearch({ onSearch }: RouteSearchProps) {
  const [origin, setOrigin] = useState<string>('');
  const [destination, setDestination] = useState<string>('');
  const { data: stations } = useStations();

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

  const getStationName = (stationId: string) => {
    if (!stations) return stationId;
    const station = stations.find(s => s.station_id === stationId);
    return station ? station.station_name : stationId;
  };

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

        <div className="flex gap-2">
          <Button
            onClick={handleSearch}
            disabled={!isValid}
            className="flex-1"
          >
            Search Trains
          </Button>
          
          {isValid && (
            <SaveRouteDialog
              originStationId={origin}
              destinationStationId={destination}
              originStationName={getStationName(origin)}
              destinationStationName={getStationName(destination)}
              onSave={async (route: SavedRoute) => {
                try {
                  await saveRoute(route);
                } catch (err) {
                  console.error('Failed to save route:', err);
                }
              }}
            >
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Save route"
              >
                <Bookmark className="h-4 w-4" />
              </Button>
            </SaveRouteDialog>
          )}
        </div>

        {origin === destination && origin && (
          <p className="text-sm text-destructive">
            Origin and destination must be different
          </p>
        )}
      </CardContent>
    </Card>
  );
}
