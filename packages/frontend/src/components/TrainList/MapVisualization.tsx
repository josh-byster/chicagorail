import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import type { Position, StopTime } from '@metra/shared';
import { fetchStation } from '@/services/api';

interface MapVisualizationProps {
  currentPosition: Position;
  stops: StopTime[];
  currentStationId?: string;
}

export function MapVisualization({
  currentPosition,
  stops,
  currentStationId,
}: MapVisualizationProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const stopMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const trainMarkerRef = useRef<mapboxgl.Marker | null>(null);

  // Initialize map and stop markers
  useEffect(() => {
    if (!mapContainer.current) return;

    // Initialize map only if access token is available
    const accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
    if (!accessToken) {
      return;
    }

    mapboxgl.accessToken = accessToken;

    // Clear the container before initializing
    mapContainer.current.innerHTML = '';

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [currentPosition.longitude, currentPosition.latitude],
      zoom: 12,
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Add markers for stops (fetch coordinates for each stop)
    stops.forEach(async (stop) => {
      try {
        const stationData = await fetchStation(stop.station_id);
        if (stationData.longitude && stationData.latitude) {
          const isCurrentStation = stop.station_id === currentStationId;

          // Create marker element
          const markerElement = document.createElement('div');
          markerElement.className =
            'w-3 h-3 rounded-full border-2 border-white shadow-lg';
          markerElement.style.backgroundColor = isCurrentStation
            ? '#0066cc'
            : '#666666';

          if (isCurrentStation) {
            markerElement.style.width = '12px';
            markerElement.style.height = '12px';
          }

          // Add marker to map
          const marker = new mapboxgl.Marker({ element: markerElement })
            .setLngLat([stationData.longitude, stationData.latitude])
            .addTo(map.current!);

          stopMarkersRef.current.push(marker);
        }
      } catch (error) {
        console.warn(
          `Failed to fetch station coordinates for ${stop.station_id}:`,
          error
        );
      }
    });

    // Create train marker (will be updated in position effect)
    const trainMarkerElement = document.createElement('div');
    trainMarkerElement.className =
      'w-4 h-4 rounded-full border-2 border-white shadow-lg bg-red-500 animate-pulse-slow';

    trainMarkerRef.current = new mapboxgl.Marker({
      element: trainMarkerElement,
    })
      .setLngLat([currentPosition.longitude, currentPosition.latitude])
      .addTo(map.current!);

    // Clean up
    return () => {
      stopMarkersRef.current.forEach((marker) => marker.remove());
      stopMarkersRef.current = [];
      trainMarkerRef.current?.remove();
      trainMarkerRef.current = null;
      map.current?.remove();
    };
  }, []);

  // Update train position only
  useEffect(() => {
    if (trainMarkerRef.current && map.current) {
      trainMarkerRef.current.setLngLat([
        currentPosition.longitude,
        currentPosition.latitude,
      ]);
    }
  }, [currentPosition.longitude, currentPosition.latitude]);

  return (
    <div className="w-full h-48 rounded-lg overflow-hidden border">
      <div ref={mapContainer} className="w-full h-full" />
    </div>
  );
}
