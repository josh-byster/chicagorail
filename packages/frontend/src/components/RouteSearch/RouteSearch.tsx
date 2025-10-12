import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StationCombobox } from '@/components/StationCombobox/StationCombobox';
import { ArrowLeftRight, Bookmark } from 'lucide-react';
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
  const {
    data: allStations,
    isLoading: isLoadingAll,
    error: errorAll,
  } = useStations();

  // Fetch reachable stations for destination selection
  const {
    data: reachableStations,
    isLoading: isLoadingReachable,
    error: errorReachable,
  } = useReachableStations(origin || null);

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

  const isValid = origin && destination && origin !== destination;

  // Auto-trigger search when both stations are selected
  useEffect(() => {
    if (isValid) {
      onSearch(origin, destination);
    }
  }, [origin, destination, isValid, onSearch]);

  const getStationName = (stationId: string) => {
    if (!allStations) return stationId;
    const station = allStations.find((s) => s.station_id === stationId);
    return station ? station.station_name : stationId;
  };

  return (
    <Card className="border-2 shadow-xl bg-card/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
      <CardHeader className="pb-6 border-b bg-gradient-to-r from-primary/5 to-transparent">
        <CardTitle className="text-2xl font-bold flex items-center gap-2">
          <div className="h-8 w-1 bg-gradient-to-b from-primary to-blue-600 rounded-full"></div>
          Find Your Train
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5 pt-6">
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

        <div className="flex justify-center -my-2 relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-px w-full bg-gradient-to-r from-transparent via-border to-transparent"></div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleSwap}
            disabled={!origin && !destination}
            aria-label="Swap stations"
            className="relative z-10 rounded-full border-2 bg-background hover:bg-primary hover:text-primary-foreground hover:border-primary hover:scale-110 transition-all shadow-md"
          >
            <ArrowLeftRight className="h-5 w-5" />
          </Button>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground">To</label>
          <StationCombobox
            value={destination}
            onChange={setDestination}
            placeholder={
              origin ? 'Search for destination...' : 'Select origin first'
            }
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

        {isValid && (
          <div className="flex justify-end pt-2">
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
                size="sm"
                aria-label="Save route"
                className="gap-2"
              >
                <Bookmark className="h-4 w-4" />
                Save Route
              </Button>
            </SaveRouteDialog>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
