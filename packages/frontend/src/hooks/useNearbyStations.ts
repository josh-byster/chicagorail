import { useMemo } from 'react';
import { useStations } from './useStations';
import { calculateDistance } from './useGeolocation';
import type { Station } from '@metra/shared';

interface StationWithDistance extends Station {
  distance: number; // in kilometers
}

export function useNearbyStations(
  latitude: number | null,
  longitude: number | null,
  limit: number = 5
) {
  const { data: stations, isLoading, error } = useStations();

  const nearbyStations = useMemo<StationWithDistance[]>(() => {
    if (!stations || !latitude || !longitude) {
      return [];
    }

    // Calculate distance for each station
    const stationsWithDistance = stations
      .map((station) => ({
        ...station,
        distance: calculateDistance(
          latitude,
          longitude,
          station.latitude,
          station.longitude
        ),
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, limit);

    return stationsWithDistance;
  }, [stations, latitude, longitude, limit]);

  return {
    stations: nearbyStations,
    isLoading,
    error,
  };
}
