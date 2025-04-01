import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TripWithStops, StopTimeWithStop } from '../types/metra';
import { MetraService } from '../services/metraService';

interface ScheduleViewProps {
  selectedRoute: string;
  selectedDate: Date;
}

// Helper function to convert 24h time to 12h time
const formatTime = (timeStr: string): string => {
  const [hours, minutes] = timeStr.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
};

// Helper function to calculate travel time
const calculateTravelTime = (firstStop: StopTimeWithStop, lastStop: StopTimeWithStop): string => {
  const [firstHours, firstMinutes] = firstStop.departure_time.split(':').map(Number);
  const [lastHours, lastMinutes] = lastStop.arrival_time.split(':').map(Number);
  
  let totalMinutes = (lastHours * 60 + lastMinutes) - (firstHours * 60 + firstMinutes);
  
  // Handle overnight trips
  if (totalMinutes < 0) {
    totalMinutes += 24 * 60;
  }
  
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  
  if (hours === 0) {
    return `${minutes} min`;
  }
  return `${hours}h ${minutes}m`;
};

export const ScheduleView: React.FC<ScheduleViewProps> = ({ selectedRoute, selectedDate }) => {
  const [trips, setTrips] = useState<TripWithStops[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const isLoadingRef = useRef(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Memoize the date string to prevent unnecessary re-renders
  const dateString = useMemo(() => {
    console.log('[ScheduleView] Date changed, memoizing new date string');
    return selectedDate.toISOString();
  }, [selectedDate]);

  // Memoize the loadTrips function to prevent recreation on every render
  const loadTrips = useCallback(async (isMounted: { current: boolean }) => {
    console.log('[ScheduleView] loadTrips called with:', { selectedRoute, dateString });
    
    if (!selectedRoute || isLoadingRef.current) {
      console.log('[ScheduleView] Skipping loadTrips:', { 
        reason: !selectedRoute ? 'no route selected' : 'already loading' 
      });
      return;
    }
    
    try {
      console.log('[ScheduleView] Starting trip load');
      isLoadingRef.current = true;
      if (contentRef.current) {
        contentRef.current.style.opacity = '0.5';
      }
      setLoading(true);
      setError(null);
      
      const metraService = MetraService.getInstance();
      metraService.setSelectedDate(selectedDate);
      const trips = await metraService.getTripsByRoute(selectedRoute);
      
      if (isMounted.current) {
        console.log('[ScheduleView] Trips loaded successfully, updating state');
        setTrips(trips);
        setLoading(false);
        if (contentRef.current) {
          contentRef.current.style.opacity = '1';
        }
      } else {
        console.log('[ScheduleView] Component unmounted, skipping state updates');
      }
    } catch (error) {
      console.error('[ScheduleView] Error loading trips:', error);
      if (isMounted.current) {
        setError('Failed to load trips');
        setLoading(false);
        if (contentRef.current) {
          contentRef.current.style.opacity = '1';
        }
      }
    } finally {
      if (isMounted.current) {
        console.log('[ScheduleView] Resetting loading ref');
        isLoadingRef.current = false;
      }
    }
  }, [selectedRoute, selectedDate]);

  useEffect(() => {
    console.log('[ScheduleView] Effect triggered with:', { selectedRoute, dateString });
    const isMounted = { current: true };

    loadTrips(isMounted);

    return () => {
      console.log('[ScheduleView] Effect cleanup');
      isMounted.current = false;
      setLoading(false);
      if (contentRef.current) {
        contentRef.current.style.opacity = '1';
      }
      isLoadingRef.current = false;
    };
  }, [loadTrips]);

  // Log when component renders
  console.log('[ScheduleView] Render:', { 
    selectedRoute, 
    dateString, 
    loading, 
    tripsCount: trips.length 
  });

  if (!selectedRoute) {
    return (
      <div className="card text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Select a Route</h2>
        <p className="text-gray-600">Choose a route from the list to view its schedule</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="card">
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <div className="text-red-600 text-center">{error}</div>
      </div>
    );
  }

  // Separate trips by direction
  const inboundTrips = trips.filter(trip => trip.direction_id === 1).sort((a, b) => {
    const timeA = a.stopTimes[0]?.departure_time || '';
    const timeB = b.stopTimes[0]?.departure_time || '';
    return timeA.localeCompare(timeB);
  });
  
  const outboundTrips = trips.filter(trip => trip.direction_id === 0).sort((a, b) => {
    const timeA = a.stopTimes[0]?.departure_time || '';
    const timeB = b.stopTimes[0]?.departure_time || '';
    return timeA.localeCompare(timeB);
  });

  console.log('[ScheduleView] Filtered trips:', {
    total: trips.length,
    inbound: inboundTrips.length,
    outbound: outboundTrips.length,
    sampleInbound: inboundTrips[0]?.direction_id,
    sampleOutbound: outboundTrips[0]?.direction_id
  });

  const handleTabChange = (newValue: number) => {
    setTabValue(newValue);
  };

  const TripCard = ({ trip }: { trip: TripWithStops }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const firstStop = trip.stopTimes[0];
    const lastStop = trip.stopTimes[trip.stopTimes.length - 1];
    const travelTime = firstStop && lastStop ? calculateTravelTime(firstStop, lastStop) : '';

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.2 }}
        className="card mb-4"
      >
        <div
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center space-x-4">
            <div className="text-lg font-semibold text-gray-900">
              {firstStop?.departure_time ? formatTime(firstStop.departure_time) : ''}
            </div>
            <div className="text-sm text-gray-500">
              {firstStop?.stopName} → {lastStop?.stopName}
            </div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-1 text-xs font-medium bg-primary-100 text-primary-800 rounded-full">
                {trip.stopTimes.length} stops
              </span>
              <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                {travelTime}
              </span>
            </div>
          </div>
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <svg
              className="w-5 h-5 text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </motion.div>
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-4"
            >
              <div className="space-y-2">
                {trip.stopTimes.map((stop: StopTimeWithStop) => (
                  <div
                    key={stop.stop_id}
                    className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="text-sm font-medium text-gray-900">
                        {formatTime(stop.arrival_time)}
                      </div>
                      <div className="text-sm text-gray-500">{stop.stopName}</div>
                    </div>
                    <div className="text-xs text-gray-400">
                      {stop.pickup_type === 1 ? 'Pickup' : ''} {stop.drop_off_type === 1 ? 'Drop-off' : ''}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  return (
    <div className="card">
      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => handleTabChange(0)}
          className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
            tabValue === 0
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Outbound ({outboundTrips.length})
        </button>
        <button
          onClick={() => handleTabChange(1)}
          className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
            tabValue === 1
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Inbound ({inboundTrips.length})
        </button>
      </div>

      <div 
        ref={contentRef}
        className="transition-opacity duration-300"
        style={{ opacity: 1 }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={`${tabValue}-${dateString}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {tabValue === 0 ? (
              <div className="space-y-4">
                {outboundTrips.map((trip) => (
                  <TripCard key={trip.trip_id} trip={trip} />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {inboundTrips.map((trip) => (
                  <TripCard key={trip.trip_id} trip={trip} />
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}; 