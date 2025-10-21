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
  const mapInitialized = useRef(false);

  // Initialize map only once
  useEffect(() => {
    if (!mapContainer.current || mapInitialized.current) return;

    // Initialize map only if access token is available
    const accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
    if (!accessToken) {
      return;
    }

    mapboxgl.accessToken = accessToken;
    mapInitialized.current = true;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [currentPosition.longitude, currentPosition.latitude],
      zoom: 12,
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Clean up
    return () => {
      stopMarkersRef.current.forEach((marker) => marker.remove());
      stopMarkersRef.current = [];
      trainMarkerRef.current?.remove();
      trainMarkerRef.current = null;
      map.current?.remove();
      mapInitialized.current = false;
    };
  }, []);

  // Add/update stop markers when stops change
  useEffect(() => {
    if (!map.current || !mapInitialized.current) return;

    // Clear existing stop markers
    stopMarkersRef.current.forEach((marker) => marker.remove());
    stopMarkersRef.current = [];

    // Wait for map to be ready
    const addMarkers = async () => {
      for (const stop of stops) {
        try {
          const stationData = await fetchStation(stop.station_id);
          if (stationData.longitude && stationData.latitude && map.current) {
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

            // Add marker to map with anchor set to center
            const marker = new mapboxgl.Marker({
              element: markerElement,
              anchor: 'center',
            })
              .setLngLat([stationData.longitude, stationData.latitude])
              .addTo(map.current);

            stopMarkersRef.current.push(marker);
          }
        } catch (error) {
          console.warn(
            `Failed to fetch station coordinates for ${stop.station_id}:`,
            error
          );
        }
      }
    };

    if (map.current.loaded()) {
      addMarkers();
    } else {
      map.current.on('load', addMarkers);
    }
  }, [stops, currentStationId]);

  // Add/update train marker
  useEffect(() => {
    if (!map.current || !mapInitialized.current) return;

    const updateTrainMarker = () => {
      if (trainMarkerRef.current) {
        trainMarkerRef.current.setLngLat([
          currentPosition.longitude,
          currentPosition.latitude,
        ]);
      } else if (map.current) {
        const trainMarkerElement = document.createElement('div');
        trainMarkerElement.className =
          'w-4 h-4 rounded-full border-2 border-white shadow-lg bg-red-500 animate-pulse-slow';

        trainMarkerRef.current = new mapboxgl.Marker({
          element: trainMarkerElement,
          anchor: 'center',
        })
          .setLngLat([currentPosition.longitude, currentPosition.latitude])
          .addTo(map.current);
      }
    };

    if (map.current.loaded()) {
      updateTrainMarker();
    } else {
      map.current.on('load', updateTrainMarker);
    }
  }, [currentPosition.longitude, currentPosition.latitude]);

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
    <div className="w-full h-[400px] overflow-hidden">
      <div ref={mapContainer} className="w-full h-full" />
    </div>
  );
}
