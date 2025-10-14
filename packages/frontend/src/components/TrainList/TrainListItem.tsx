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
      <Card className="hover:shadow-lg hover:border-primary/50 transition-all duration-200 overflow-hidden animate-fade-in animated">
        <CardContent className="p-0">
          <div className="flex items-stretch">
            {/* Line indicator with color - extends through entire card */}
            <div
              className="w-2 flex-shrink-0 animate-fade-in"
              style={{ backgroundColor: train.line_color || '#000000' }}
              aria-label={`${train.line_name} line`}
            />

            <div className="flex-1">
              <CollapsibleTrigger className="w-full text-left p-5 animate-fade-in">
                {/* Header with time and status */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-primary flex-shrink-0 animate-fade-in" />
                    <div className="flex items-center gap-2.5 animate-slide-in-left">
                      <span className="font-bold text-2xl tracking-tight animate-fade-in">
                        {departureTime}
                      </span>
                      <ArrowRight className="h-5 w-5 text-muted-foreground animate-fade-in" />
                      <span className="font-bold text-2xl tracking-tight text-muted-foreground animate-slide-in-right">
                        {arrivalTime}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={getStatusVariant(train.status)}
                      className="ml-3 flex-shrink-0 animate-scale-in"
                    >
                      {getStatusText(train.status, train.delay_minutes)}
                    </Badge>
                    <ChevronDown
                      className={`h-5 w-5 text-muted-foreground transition-transform duration-300 ${
                        isOpen ? 'rotate-180' : ''
                      } animate-fade-in`}
                    />
                  </div>
                </div>

                {/* Train details */}
                <div className="flex flex-wrap items-center gap-3 text-sm animate-fade-in">
                  <div className="flex items-center gap-1.5 font-medium text-foreground animate-slide-in-left">
                    <TrainIcon className="h-4 w-4 animate-fade-in" />
                    <span className="animate-fade-in">{train.line_name}</span>
                  </div>

                  {train.train_number && (
                    <>
                      <span className="text-muted-foreground animate-fade-in">
                        •
                      </span>
                      <span className="text-muted-foreground animate-fade-in">
                        Train #{train.train_number}
                      </span>
                    </>
                  )}

                  {train.platform && (
                    <>
                      <span className="text-muted-foreground animate-fade-in">
                        •
                      </span>
                      <div className="flex items-center gap-1.5 text-muted-foreground animate-slide-in-right">
                        <MapPin className="h-3.5 w-3.5 animate-fade-in" />
                        <span className="animate-fade-in">
                          Platform {train.platform}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </CollapsibleTrigger>

              <CollapsibleContent className="collapsible-content">
                <div className="border-t bg-muted/20 p-5">
                  {isLoadingDetail ? (
                    <div className="space-y-4 animate-fade-in">
                      <Skeleton className="h-32 w-full animate-pulse" />
                      <Skeleton className="h-48 w-full animate-pulse" />
                    </div>
                  ) : trainDetail ? (
                    <div className="space-y-6 animate-fade-in">
                      {/* Journey Details */}
                      <div className="animate-fade-in">
                        <h3 className="text-lg font-semibold mb-4 animate-slide-in-left">
                          Your Journey
                        </h3>
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1 animate-fade-in">
                            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide animate-fade-in">
                              Departure
                            </p>
                            <div className="flex items-center gap-2.5 animate-scale-in">
                              <Clock className="h-5 w-5 text-primary animate-fade-in" />
                              <span className="font-bold text-2xl animate-fade-in">
                                {departureTime}
                              </span>
                            </div>
                            {originStop && (
                              <div className="flex items-center gap-2 mt-2 animate-slide-in-left">
                                <MapPin className="h-4 w-4 text-muted-foreground animate-fade-in" />
                                <span className="text-sm font-medium animate-fade-in">
                                  {originStop.station_name ||
                                    originStop.station_id}
                                </span>
                              </div>
                            )}
                          </div>
                          <ArrowRight className="h-6 w-6 text-muted-foreground flex-shrink-0 animate-fade-in" />
                          <div className="flex-1 animate-fade-in">
                            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide animate-fade-in">
                              Arrival
                            </p>
                            <div className="flex items-center gap-2.5 animate-scale-in">
                              <Clock className="h-5 w-5 text-primary animate-fade-in" />
                              <span className="font-bold text-2xl animate-fade-in">
                                {arrivalTime}
                              </span>
                            </div>
                            {destinationStop && (
                              <div className="flex items-center gap-2 mt-2 animate-slide-in-right">
                                <MapPin className="h-4 w-4 text-muted-foreground animate-fade-in" />
                                <span className="text-sm font-medium animate-fade-in">
                                  {destinationStop.station_name ||
                                    destinationStop.station_id}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {train.delay_minutes > 0 && (
                          <>
                            <Separator className="my-4 animate-fade-in" />
                            <Alert
                              variant="destructive"
                              className="border-2 animate-fade-in-up"
                            >
                              <AlertCircle className="h-5 w-5 animate-fade-in" />
                              <AlertTitle className="text-base animate-fade-in">
                                Delayed
                              </AlertTitle>
                              <AlertDescription className="animate-fade-in">
                                This train is running {train.delay_minutes}{' '}
                                minutes late
                              </AlertDescription>
                            </Alert>
                          </>
                        )}
                      </div>

                      {/* All Stops */}
                      <div className="animate-fade-in">
                        <Separator className="mb-4 animate-fade-in" />
                        <div className="flex items-center justify-between mb-4 animate-slide-in-left">
                          <h3 className="text-lg font-semibold animate-fade-in">
                            All Stops
                          </h3>
                          <Badge
                            variant="secondary"
                            className="text-base px-3 py-1 animate-scale-in"
                          >
                            {trainDetail.stops?.length || 0} stops
                          </Badge>
                        </div>
                        {trainDetail.stops && trainDetail.stops.length > 0 ? (
                          <div className="space-y-3 max-h-64 overflow-y-auto animate-fade-in">
                            {trainDetail.stops.map((stop, index) => {
                              const isOrigin =
                                stop.station_id === train.origin_station_id;
                              const isDestination =
                                stop.station_id ===
                                train.destination_station_id;
                              const isUserJourney = isOrigin || isDestination;

                              return (
                                <div
                                  key={`${stop.station_id}-${stop.stop_sequence}`}
                                  className={`flex items-center gap-4 p-4 rounded-lg transition-colors ${
                                    isUserJourney
                                      ? 'bg-primary/10 border-2 border-primary/30'
                                      : 'hover:bg-accent/50'
                                  } animate-fade-in hover:animate-pulse-slow`}
                                >
                                  <div
                                    className={`flex items-center justify-center w-10 h-10 rounded-full font-bold text-lg ${
                                      isUserJourney
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-primary/10 text-primary'
                                    } animate-scale-in`}
                                  >
                                    {index + 1}
                                  </div>
                                  <div className="flex-1 min-w-0 animate-fade-in">
                                    <div className="flex items-center gap-3 flex-wrap">
                                      <p
                                        className={`font-bold text-base ${isUserJourney ? 'text-foreground' : 'text-muted-foreground'} animate-fade-in`}
                                      >
                                        {stop.station_name || stop.station_id}
                                      </p>
                                      {isOrigin && (
                                        <Badge
                                          variant="default"
                                          className="animate-scale-in"
                                        >
                                          Your Origin
                                        </Badge>
                                      )}
                                      {isDestination && (
                                        <Badge
                                          variant="default"
                                          className="animate-scale-in"
                                        >
                                          Your Destination
                                        </Badge>
                                      )}
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-1 animate-fade-in">
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
                                      className="flex-shrink-0 animate-scale-in"
                                    >
                                      +{stop.delay_minutes} min
                                    </Badge>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-center text-muted-foreground py-8 animate-fade-in">
                            <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-50 animate-bounce-slow" />
                            <p className="text-base font-medium animate-fade-in">
                              No stop information available
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <Alert
                      variant="destructive"
                      className="animate-fade-in-up animated"
                    >
                      <AlertCircle className="h-4 w-4 animate-fade-in" />
                      <AlertTitle className="animate-fade-in">Error</AlertTitle>
                      <AlertDescription className="animate-fade-in">
                        Failed to load train details
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CollapsibleContent>
            </div>
          </div>
        </CardContent>
      </Card>
    </Collapsible>
  );
}
