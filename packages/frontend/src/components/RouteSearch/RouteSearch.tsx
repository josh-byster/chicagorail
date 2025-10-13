import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  ArrowLeft,
  Check,
  Bookmark,
  ChevronDown,
  CalendarIcon,
  X,
} from 'lucide-react';
import { SaveRouteDialog } from '@/components/SavedRoutes/SaveRouteDialog';
import { useStations } from '@/hooks/useStations';
import { useReachableStations } from '@/hooks/useReachableStations';
import { saveRoute } from '@/services/saved-routes';
import { SavedRoute } from '@metra/shared';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useRouteSearchStore } from '@/stores/routeSearchStore';

type Step = 'origin' | 'destination';

export function RouteSearch() {
  const { origin, destination, date, time, setRoute, setDate, setTime } =
    useRouteSearchStore();
  const [searchParams] = useSearchParams();
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  // Check URL params to determine initial collapsed state
  const urlOrigin = searchParams.get('origin');
  const urlDestination = searchParams.get('destination');
  const hasUrlRoute = Boolean(urlOrigin && urlDestination);

  const initialCollapsed = hasUrlRoute || Boolean(origin && destination);

  const [step, setStep] = useState<Step>(
    origin && destination ? 'destination' : 'origin'
  );
  const [isDestinationSearchOpen, setIsDestinationSearchOpen] =
    useState(!destination);
  const [isCollapsed, setIsCollapsed] = useState(initialCollapsed);

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

  const handleOriginSelect = (stationId: string) => {
    setRoute(stationId, ''); // Clear destination when changing origin
    setStep('destination');
    setIsDestinationSearchOpen(true);
  };

  const handleDestinationSelect = (stationId: string) => {
    setRoute(origin, stationId); // Set complete route
    setIsDestinationSearchOpen(false);
    setIsCollapsed(true);
  };

  const handleBack = () => {
    setStep('origin');
    setRoute('', ''); // Clear both
    setIsDestinationSearchOpen(true);
    setIsCollapsed(false);
  };

  const handleChangeDestination = () => {
    setRoute(origin, ''); // Keep origin, clear destination
    setIsDestinationSearchOpen(true);
    setIsCollapsed(false);
  };

  const handleExpand = () => {
    setIsCollapsed(false);
  };

  // Update step and search state when store values change
  useEffect(() => {
    if (origin && destination) {
      setStep('destination');
      setIsDestinationSearchOpen(false);
      setIsCollapsed(true);
    } else if (origin) {
      setStep('destination');
      setIsDestinationSearchOpen(true);
      setIsCollapsed(false);
    } else {
      setStep('origin');
      setIsDestinationSearchOpen(true);
      setIsCollapsed(false);
    }
  }, [origin, destination]);

  const isValid = origin && destination && origin !== destination;

  const getStationName = (stationId: string) => {
    if (!allStations) return stationId;
    const station = allStations.find((s) => s.station_id === stationId);
    return station ? station.station_name : stationId;
  };

  const originStation = allStations?.find((s) => s.station_id === origin);
  const destinationStation = reachableStations?.find(
    (s) => s.station_id === destination
  );

  // Collapsed view when route is complete (don't wait for station data to load)
  if (isCollapsed && isValid) {
    return (
      <Card className="border-2 shadow-xl bg-card/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-500">
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className="h-8 w-1 bg-gradient-to-b from-primary to-blue-600 rounded-full shrink-0"></div>
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="font-semibold text-foreground truncate">
                    {originStation?.station_name || origin}
                  </span>
                  <span className="text-muted-foreground shrink-0">→</span>
                  <span className="font-semibold text-foreground truncate">
                    {destinationStation?.station_name || destination}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
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
                  variant="ghost"
                  size="sm"
                  aria-label="Save route"
                  className="gap-2"
                >
                  <Bookmark className="h-4 w-4" />
                </Button>
              </SaveRouteDialog>
              <Button
                onClick={handleExpand}
                variant="ghost"
                size="sm"
                aria-label="Expand route search"
                className="gap-1"
              >
                <span className="text-sm">Change</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Date and Time Filters */}
          <div className="flex gap-3 flex-wrap">
            {/* Date Picker */}
            <div className="flex-1 min-w-[140px]">
              <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between font-normal"
                    size="sm"
                  >
                    {date ? format(date, 'MMM dd, yyyy') : 'Today'}
                    {date ? (
                      <X
                        className="h-3.5 w-3.5"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDate(undefined);
                        }}
                      />
                    ) : (
                      <CalendarIcon className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto overflow-hidden p-0"
                  align="start"
                >
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(newDate) => {
                      setDate(newDate);
                      setDatePickerOpen(false);
                    }}
                    disabled={(date) =>
                      date < new Date(new Date().setHours(0, 0, 0, 0))
                    }
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Time Input */}
            <div className="flex-1 min-w-[120px]">
              <div className="relative">
                <Input
                  type="time"
                  value={time || ''}
                  onChange={(e) => setTime(e.target.value || undefined)}
                  placeholder="Any time"
                  className="pr-8 h-9"
                />
                {time && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                    onClick={() => setTime(undefined)}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Expanded view
  return (
    <Card className="border-2 shadow-xl bg-card/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-500">
      <CardHeader className="pb-6 border-b bg-gradient-to-r from-primary/5 to-transparent">
        <CardTitle className="text-2xl font-bold flex items-center gap-2">
          <div className="h-8 w-1 bg-gradient-to-b from-primary to-blue-600 rounded-full"></div>
          Find Your Train
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        {step === 'origin' ? (
          <div className="space-y-4">
            <div className="text-center space-y-2">
              <h3 className="text-2xl md:text-3xl font-bold text-foreground">
                Where are you starting?
              </h3>
              {originStation && (
                <p className="text-sm text-muted-foreground">
                  Currently selected:{' '}
                  <span className="font-semibold text-foreground">
                    {originStation.station_name}
                  </span>
                </p>
              )}
            </div>

            {isLoadingAll && (
              <Skeleton className="h-[300px] w-full rounded-lg" />
            )}

            {errorAll && (
              <Alert variant="destructive">
                <AlertDescription>
                  Error loading stations. Please try again.
                </AlertDescription>
              </Alert>
            )}

            {!isLoadingAll && !errorAll && allStations && (
              <Command className="rounded-lg border shadow-md">
                <CommandInput
                  placeholder="Search for your station..."
                  className="text-base md:text-lg h-12"
                  autoFocus
                />
                <CommandList className="max-h-[400px]">
                  <CommandEmpty>No station found.</CommandEmpty>
                  <CommandGroup>
                    {allStations.map((station) => (
                      <CommandItem
                        key={station.station_id}
                        value={station.station_name}
                        onSelect={() => handleOriginSelect(station.station_id)}
                        className="cursor-pointer py-4 px-4 text-base md:text-lg aria-selected:bg-primary/10"
                      >
                        <Check
                          className={cn(
                            'mr-3 h-5 w-5',
                            origin === station.station_id
                              ? 'opacity-100'
                              : 'opacity-0'
                          )}
                        />
                        {station.station_name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            )}

            {originStation && (
              <Button
                onClick={() => setStep('destination')}
                className="w-full h-12 text-base md:text-lg"
                size="lg"
              >
                Continue to Destination
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBack}
                aria-label="Go back"
                className="shrink-0"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">From</p>
                <p className="font-semibold text-foreground">
                  {originStation?.station_name}
                </p>
              </div>
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-2xl md:text-3xl font-bold text-foreground">
                And where are you headed?
              </h3>
            </div>

            {isLoadingReachable && (
              <Skeleton className="h-[300px] w-full rounded-lg" />
            )}

            {errorReachable && (
              <Alert variant="destructive">
                <AlertDescription>
                  Error loading destinations. Please try again.
                </AlertDescription>
              </Alert>
            )}

            {!isLoadingReachable &&
              !errorReachable &&
              reachableStations &&
              reachableStations.length > 0 && (
                <>
                  {isDestinationSearchOpen ? (
                    <Command className="rounded-lg border shadow-md">
                      <CommandInput
                        placeholder="Search for your destination..."
                        className="text-base md:text-lg h-12"
                        autoFocus
                      />
                      <CommandList className="max-h-[400px]">
                        <CommandEmpty>No station found.</CommandEmpty>
                        <CommandGroup>
                          {reachableStations.map((station) => (
                            <CommandItem
                              key={station.station_id}
                              value={station.station_name}
                              onSelect={() =>
                                handleDestinationSelect(station.station_id)
                              }
                              className="cursor-pointer py-4 px-4 text-base md:text-lg aria-selected:bg-primary/10"
                            >
                              <Check
                                className={cn(
                                  'mr-3 h-5 w-5',
                                  destination === station.station_id
                                    ? 'opacity-100'
                                    : 'opacity-0'
                                )}
                              />
                              {station.station_name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  ) : (
                    destinationStation && (
                      <div className="space-y-3">
                        <div className="p-6 rounded-lg border-2 border-primary/20 bg-primary/5">
                          <p className="text-sm text-muted-foreground mb-1">
                            Destination
                          </p>
                          <p className="text-xl md:text-2xl font-bold text-foreground">
                            {destinationStation.station_name}
                          </p>
                        </div>
                        <Button
                          onClick={handleChangeDestination}
                          variant="outline"
                          className="w-full h-11 text-base"
                        >
                          Change Destination
                        </Button>
                      </div>
                    )
                  )}
                </>
              )}

            {origin === destination && destination && (
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
          </div>
        )}
      </CardContent>
    </Card>
  );
}
