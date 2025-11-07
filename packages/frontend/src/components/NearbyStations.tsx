import { useState } from 'react';
import { MapPin, Navigation, Loader2 } from 'lucide-react';
import { useGeolocation } from '../hooks/useGeolocation';
import { useNearbyStations } from '../hooks/useNearbyStations';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';

interface NearbyStationsProps {
  onStationSelect?: (stationId: string) => void;
}

export function NearbyStations({ onStationSelect }: NearbyStationsProps) {
  const [hasRequested, setHasRequested] = useState(false);
  const { latitude, longitude, error, loading, requestLocation } =
    useGeolocation();
  const { stations, isLoading: stationsLoading } = useNearbyStations(
    latitude,
    longitude,
    5
  );

  const handleRequestLocation = () => {
    setHasRequested(true);
    requestLocation();
  };

  const isLoading = loading || stationsLoading;

  if (!hasRequested) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Navigation className="h-5 w-5" />
            Nearby Stations
          </CardTitle>
          <CardDescription>
            Find the closest Metra stations to your current location
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleRequestLocation} className="w-full">
            <MapPin className="mr-2 h-4 w-4" />
            Find Nearby Stations
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Navigation className="h-5 w-5" />
            Nearby Stations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button
            variant="outline"
            onClick={handleRequestLocation}
            className="w-full mt-4"
          >
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Navigation className="h-5 w-5" />
            Nearby Stations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Navigation className="h-5 w-5" />
          Nearby Stations
        </CardTitle>
        <CardDescription>
          {stations.length} closest stations to your location
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {stations.map((station) => (
            <div
              key={station.station_id}
              className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
              onClick={() => onStationSelect?.(station.station_id)}
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium leading-tight">
                  {station.station_name}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {station.distance < 1
                    ? `${Math.round(station.distance * 1000)}m away`
                    : `${station.distance.toFixed(1)}km away`}
                </p>
              </div>
              <Badge variant="outline" className="flex-shrink-0">
                <MapPin className="h-3 w-3 mr-1" />
                {station.lines_served?.length || 0} lines
              </Badge>
            </div>
          ))}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRequestLocation}
          className="w-full mt-4"
        >
          Refresh Location
        </Button>
      </CardContent>
    </Card>
  );
}
