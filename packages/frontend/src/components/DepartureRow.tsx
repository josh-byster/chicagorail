import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { utils } from '@chicagorail/shared';
import type { Departure, GetTripDetailsResponse } from '@chicagorail/shared';
import { api } from '@/lib/api';

interface DepartureRowProps {
  departure: Departure;
}

export function DepartureRow({ departure }: DepartureRowProps) {
  const { route, trip_headsign, departure_time, trip_id } = departure;
  const [isExpanded, setIsExpanded] = useState(false);
  const [tripDetails, setTripDetails] = useState<GetTripDetailsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async () => {
    if (!isExpanded && !tripDetails) {
      setIsLoading(true);
      try {
        const details = await api.getTripDetails(trip_id);
        setTripDetails(details);
      } catch (error) {
        console.error('Failed to fetch trip details:', error);
      } finally {
        setIsLoading(false);
      }
    }
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="border-b">
      <button
        onClick={handleToggle}
        className="w-full flex items-center justify-between py-3 px-4 hover:bg-accent/50 transition-colors"
      >
        <div className="flex items-center gap-3 flex-1">
          <div
            className="w-1 h-12 rounded"
            style={{ backgroundColor: `#${route.route_color}` }}
          />
          <div className="text-left">
            <div className="font-medium">{route.route_short_name}</div>
            <div className="text-sm text-muted-foreground">
              to {trip_headsign}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-right">
            <div className="font-bold text-lg">
              {utils.formatTime(departure_time)}
            </div>
          </div>
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 bg-muted/30">
          {isLoading ? (
            <div className="py-4 text-center text-muted-foreground">
              Loading stops...
            </div>
          ) : tripDetails ? (
            <div className="space-y-1 pt-2">
              <div className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                {tripDetails.stops.length} stops
              </div>
              {tripDetails.stops.map((tripStop, index) => (
                <div
                  key={tripStop.stop.stop_id}
                  className="flex items-center gap-3 py-1.5"
                >
                  <div className="relative flex flex-col items-center">
                    <div
                      className="w-2 h-2 rounded-full border-2"
                      style={{
                        borderColor: `#${route.route_color}`,
                        backgroundColor: index === 0 || index === tripDetails.stops.length - 1
                          ? `#${route.route_color}`
                          : 'transparent'
                      }}
                    />
                    {index < tripDetails.stops.length - 1 && (
                      <div
                        className="w-0.5 h-6 -mb-3"
                        style={{ backgroundColor: `#${route.route_color}40` }}
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm truncate">{tripStop.stop.stop_name}</div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {utils.formatTime(tripStop.departure_time)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-4 text-center text-muted-foreground">
              Failed to load stops
            </div>
          )}
        </div>
      )}
    </div>
  );
}
