import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Clock,
  ArrowRight,
  MapPin,
  Train as TrainIcon,
  ChevronDown,
  AlertCircle,
} from 'lucide-react';
import { useTrainDetail } from '@/hooks/useTrains';
import type { Train } from '@metra/shared';

interface TrainListItemProps {
  train: Train;
}

export function TrainListItem({ train }: TrainListItemProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Only fetch details when expanded
  const { data: trainDetail, isLoading: isLoadingDetail } = useTrainDetail(
    train.trip_id,
    isOpen
  );

  const departureTime = new Date(train.departure_time).toLocaleTimeString(
    'en-US',
    {
      hour: 'numeric',
      minute: '2-digit',
    }
  );

  const arrivalTime = new Date(train.arrival_time).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  const getStatusVariant = (
    status: string
  ): 'success' | 'warning' | 'destructive' | 'secondary' => {
    switch (status) {
      case 'on_time':
        return 'success';
      case 'delayed':
        return 'warning';
      case 'cancelled':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getStatusText = (status: string, delayMinutes: number) => {
    if (status === 'on_time') return 'On Time';
    if (status === 'cancelled') return 'Cancelled';
    if (status === 'delayed' && delayMinutes > 0) {
      return `Delayed ${delayMinutes} min`;
    }
    return 'Scheduled';
  };

  // Find user's specific origin and destination stops if available in detail
  const originStop = trainDetail?.stops?.find(
    (stop) => stop.station_id === train.origin_station_id
  );
  const destinationStop = trainDetail?.stops?.find(
    (stop) => stop.station_id === train.destination_station_id
  );

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="hover:shadow-lg hover:border-primary/50 transition-all duration-200 overflow-hidden">
        <CardContent className="p-0">
          <CollapsibleTrigger className="w-full text-left">
            <div className="flex items-stretch">
              {/* Line indicator with color */}
              <div
                className="w-2 flex-shrink-0"
                style={{ backgroundColor: train.line_color || '#000000' }}
                aria-label={`${train.line_name} line`}
              />

              <div className="flex-1 p-5">
                {/* Header with time and status */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-primary flex-shrink-0" />
                    <div className="flex items-center gap-2.5">
                      <span className="font-bold text-2xl tracking-tight">
                        {departureTime}
                      </span>
                      <ArrowRight className="h-5 w-5 text-muted-foreground" />
                      <span className="font-bold text-2xl tracking-tight text-muted-foreground">
                        {arrivalTime}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={getStatusVariant(train.status)}
                      className="ml-3 flex-shrink-0"
                    >
                      {getStatusText(train.status, train.delay_minutes)}
                    </Badge>
                    <ChevronDown
                      className={`h-5 w-5 text-muted-foreground transition-transform ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                </div>

                {/* Train details */}
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <div className="flex items-center gap-1.5 font-medium text-foreground">
                    <TrainIcon className="h-4 w-4" />
                    <span>{train.line_name}</span>
                  </div>

                  {train.train_number && (
                    <>
                      <span className="text-muted-foreground">•</span>
                      <span className="text-muted-foreground">
                        Train #{train.train_number}
                      </span>
                    </>
                  )}

                  {train.platform && (
                    <>
                      <span className="text-muted-foreground">•</span>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" />
                        <span>Platform {train.platform}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <div className="border-t bg-muted/20">
              {isLoadingDetail ? (
                <div className="p-5 space-y-4">
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-48 w-full" />
                </div>
              ) : trainDetail ? (
                <div className="p-5 space-y-6">
                  {/* Journey Details */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Your Journey</h3>
                    <div className="grid sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                          Departure
                        </p>
                        <div className="flex items-center gap-2.5">
                          <Clock className="h-5 w-5 text-primary" />
                          <span className="font-bold text-2xl">
                            {departureTime}
                          </span>
                        </div>
                        {originStop && (
                          <div className="flex items-center gap-2 mt-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">
                              {originStop.station_name || originStop.station_id}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                          Arrival
                        </p>
                        <div className="flex items-center gap-2.5">
                          <Clock className="h-5 w-5 text-primary" />
                          <span className="font-bold text-2xl">
                            {arrivalTime}
                          </span>
                        </div>
                        {destinationStop && (
                          <div className="flex items-center gap-2 mt-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">
                              {destinationStop.station_name ||
                                destinationStop.station_id}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {train.delay_minutes > 0 && (
                      <>
                        <Separator className="my-4" />
                        <Alert variant="destructive" className="border-2">
                          <AlertCircle className="h-5 w-5" />
                          <AlertTitle className="text-base">Delayed</AlertTitle>
                          <AlertDescription>
                            This train is running {train.delay_minutes} minutes
                            late
                          </AlertDescription>
                        </Alert>
                      </>
                    )}
                  </div>

                  {/* All Stops */}
                  <div>
                    <Separator className="mb-4" />
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">All Stops</h3>
                      <Badge
                        variant="secondary"
                        className="text-base px-3 py-1"
                      >
                        {trainDetail.stops?.length || 0} stops
                      </Badge>
                    </div>
                    {trainDetail.stops && trainDetail.stops.length > 0 ? (
                      <div className="space-y-1 max-h-96 overflow-y-auto">
                        {trainDetail.stops.map((stop, index) => {
                          const isOrigin =
                            stop.station_id === train.origin_station_id;
                          const isDestination =
                            stop.station_id === train.destination_station_id;
                          const isUserJourney = isOrigin || isDestination;

                          return (
                            <div
                              key={`${stop.station_id}-${stop.stop_sequence}`}
                              className={`flex items-center gap-4 p-3 rounded-lg transition-colors ${
                                isUserJourney
                                  ? 'bg-primary/10 border-2 border-primary/30'
                                  : 'hover:bg-accent/50'
                              }`}
                            >
                              <div
                                className={`flex items-center justify-center w-7 h-7 rounded-full font-semibold text-sm ${
                                  isUserJourney
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-primary/10 text-primary'
                                }`}
                              >
                                {index + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p
                                    className={`font-semibold text-sm ${isUserJourney ? 'text-foreground' : ''}`}
                                  >
                                    {stop.station_name || stop.station_id}
                                  </p>
                                  {isOrigin && (
                                    <Badge
                                      variant="default"
                                      className="text-xs"
                                    >
                                      Your Origin
                                    </Badge>
                                  )}
                                  {isDestination && (
                                    <Badge
                                      variant="default"
                                      className="text-xs"
                                    >
                                      Your Destination
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {new Date(
                                    stop.arrival_time
                                  ).toLocaleTimeString('en-US', {
                                    hour: 'numeric',
                                    minute: '2-digit',
                                  })}
                                </p>
                              </div>
                              {stop.delay_minutes > 0 && (
                                <Badge
                                  variant="warning"
                                  className="flex-shrink-0 text-xs"
                                >
                                  +{stop.delay_minutes} min
                                </Badge>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center text-muted-foreground py-8">
                        <AlertCircle className="h-10 w-10 mx-auto mb-2 opacity-50" />
                        <p className="text-sm font-medium">
                          No stop information available
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-5">
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>
                      Failed to load train details
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </div>
          </CollapsibleContent>
        </CardContent>
      </Card>
    </Collapsible>
  );
}
