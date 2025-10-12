import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StationSelect } from '@/components/StationSelect/StationSelect';
import { ArrowLeftRight, Bookmark, Search } from 'lucide-react';
import { SaveRouteDialog } from '@/components/SavedRoutes/SaveRouteDialog';
import { useStations } from '@/hooks/useStations';
import { saveRoute } from '@/services/saved-routes';
import { SavedRoute } from '@metra/shared';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
    <Card className="border-2 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-2xl">Find Your Train</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground">From</label>
          <StationSelect
            value={origin}
            onChange={setOrigin}
            placeholder="Select origin station"
          />
        </div>

        <div className="flex justify-center -my-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleSwap}
            disabled={!origin && !destination}
            aria-label="Swap stations"
            className="rounded-full border-2 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all"
          >
            <ArrowLeftRight className="h-5 w-5" />
          </Button>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground">To</label>
          <StationSelect
            value={destination}
            onChange={setDestination}
            placeholder="Select destination station"
          />
        </div>

        {origin === destination && origin && (
          <Alert variant="destructive" className="py-2">
            <AlertDescription className="text-sm">
              Origin and destination must be different
            </AlertDescription>
          </Alert>
        )}

        <div className="flex gap-3 pt-2">
          <Button
            onClick={handleSearch}
            disabled={!isValid}
            className="flex-1 h-11 text-base font-semibold"
            size="lg"
          >
            <Search className="h-5 w-5 mr-2" />
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
                className="h-11 w-11"
              >
                <Bookmark className="h-5 w-5" />
              </Button>
            </SaveRouteDialog>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
