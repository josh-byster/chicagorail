import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StationCombobox } from '@/components/StationCombobox/StationCombobox';
import { ArrowLeftRight, Bookmark, Search } from 'lucide-react';
import { SaveRouteDialog } from '@/components/SavedRoutes/SaveRouteDialog';
import { useStations } from '@/hooks/useStations';
import { useReachableStations } from '@/hooks/useReachableStations';
import { saveRoute } from '@/services/saved-routes';
import { SavedRoute } from '@metra/shared';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface RouteSearchProps {
  onSearch: (origin: string, destination: string) => void;
}

export function RouteSearch({ onSearch }: RouteSearchProps) {
  const [origin, setOrigin] = useState<string>('');
  const [destination, setDestination] = useState<string>('');

  // Fetch all stations for origin selection
  const { data: allStations, isLoading: isLoadingAll, error: errorAll } = useStations();

  // Fetch reachable stations for destination selection
  const { data: reachableStations, isLoading: isLoadingReachable, error: errorReachable } = useReachableStations(origin || null);

  const handleSwap = () => {
    const tempOrigin = origin;
    const tempDest = destination;
    setOrigin(tempDest);
    setDestination(tempOrigin);
  };

  const handleOriginChange = (value: string) => {
    setOrigin(value);
    // Clear destination when origin changes since reachable stations will change
    setDestination('');
  };

  const handleSearch = () => {
    if (origin && destination) {
      onSearch(origin, destination);
    }
  };

  const isValid = origin && destination && origin !== destination;

  const getStationName = (stationId: string) => {
    if (!allStations) return stationId;
    const station = allStations.find(s => s.station_id === stationId);
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
          <StationCombobox
            value={origin}
            onChange={handleOriginChange}
            placeholder="Search for origin station..."
            stations={allStations}
            isLoading={isLoadingAll}
            error={errorAll}
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
          <StationCombobox
            value={destination}
            onChange={setDestination}
            placeholder={origin ? "Search for destination..." : "Select origin first"}
            stations={origin ? reachableStations : []}
            isLoading={isLoadingReachable}
            error={errorReachable}
            disabled={!origin}
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
