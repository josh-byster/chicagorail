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

// Helper function to calculate minutes from start
const calculateMinutesFromStart = (startTime: string, currentTime: string): number => {
  const [startHours, startMinutes] = startTime.split(':').map(Number);
  const [currentHours, currentMinutes] = currentTime.split(':').map(Number);
  
  let totalMinutes = (currentHours * 60 + currentMinutes) - (startHours * 60 + startMinutes);
  
  // Handle overnight trips
  if (totalMinutes < 0) {
    totalMinutes += 24 * 60;
  }
  
  return totalMinutes;
};

// Helper function to format minutes into hours and minutes
const formatMinutes = (minutes: number): string => {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
};

const TripCard = React.memo(({ trip, selectedStop }: { trip: TripWithStops; selectedStop: string }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const firstStop = trip.stopTimes[0];
  const lastStop = trip.stopTimes[trip.stopTimes.length - 1];
  const travelTime = firstStop && lastStop ? calculateTravelTime(firstStop, lastStop) : '';
  
  // Calculate travel time to selected stop if one is selected
  const selectedStopTime = useMemo(() => {
    if (selectedStop === 'all' || !firstStop) return null;
    const stop = trip.stopTimes.find(s => s.stopName === selectedStop);
    if (!stop) return null;
    return calculateMinutesFromStart(firstStop.departure_time, stop.arrival_time);
  }, [trip, selectedStop, firstStop]);

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
              {selectedStop === 'all' ? travelTime : `Total: ${travelTime}`}
            </span>
            {selectedStop !== 'all' && selectedStopTime !== null && (
              <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                To {selectedStop}: {formatMinutes(selectedStopTime)}
              </span>
            )}
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
              {trip.stopTimes.map((stop: StopTimeWithStop) => {
                const minutesFromStart = firstStop ? calculateMinutesFromStart(firstStop.departure_time, stop.arrival_time) : 0;
                return (
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
                    <div className="flex items-center space-x-4">
                      <span className="text-xs text-gray-400">
                        {formatMinutes(minutesFromStart)}
                      </span>
                      <span className="text-xs text-gray-400">
                        {stop.pickup_type === 1 ? 'Pickup' : ''} {stop.drop_off_type === 1 ? 'Drop-off' : ''}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

TripCard.displayName = 'TripCard';

export const ScheduleView: React.FC<ScheduleViewProps> = ({ selectedRoute, selectedDate }) => {
  const [trips, setTrips] = useState<TripWithStops[]>([]);
  const [loading, setLoading] = useState(false);
  const [showLoading, setShowLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [selectedStop, setSelectedStop] = useState<string>('all');
  const isLoadingRef = useRef(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const loadingTimeoutRef = useRef<number>();

  // Memoize the date string to prevent unnecessary re-renders
  const dateString = useMemo(() => {
    console.log('[ScheduleView] Date changed, memoizing new date string');
    return selectedDate.toISOString();
  }, [selectedDate]);

  // Get unique stops from all trips
  const uniqueStops = useMemo(() => {
    const stops = new Set<string>();
    trips.forEach(trip => {
      trip.stopTimes.forEach(stop => {
        stops.add(stop.stopName);
      });
    });
    return Array.from(stops).sort();
  }, [trips]);

  // Filter trips based on selected stop
  const filteredTrips = useMemo(() => {
    if (selectedStop === 'all') return trips;
    return trips.filter(trip => 
      trip.stopTimes.some(stop => stop.stopName === selectedStop)
    );
  }, [trips, selectedStop]);

  // Separate trips by direction
  const inboundTrips = filteredTrips.filter(trip => trip.direction_id === 1).sort((a, b) => {
    const timeA = a.stopTimes[0]?.departure_time || '';
    const timeB = b.stopTimes[0]?.departure_time || '';
    return timeA.localeCompare(timeB);
  });
  
  const outboundTrips = filteredTrips.filter(trip => trip.direction_id === 0).sort((a, b) => {
    const timeA = a.stopTimes[0]?.departure_time || '';
    const timeB = b.stopTimes[0]?.departure_time || '';
    return timeA.localeCompare(timeB);
  });

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
      
      // Set a timeout to show loading state after 300ms
      loadingTimeoutRef.current = setTimeout(() => {
        if (isMounted.current) {
          setShowLoading(true);
        }
      }, 300);
      
      const metraService = MetraService.getInstance();
      metraService.setSelectedDate(selectedDate);
      const trips = await metraService.getTripsByRoute(selectedRoute);
      
      if (isMounted.current) {
        console.log('[ScheduleView] Trips loaded successfully, updating state');
        setTrips(trips);
        setLoading(false);
        setShowLoading(false);
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
        setShowLoading(false);
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
      setShowLoading(false);
      if (contentRef.current) {
        contentRef.current.style.opacity = '1';
      }
      isLoadingRef.current = false;
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, [loadTrips]);

  // Log when component renders
  console.log('[ScheduleView] Render:', { 
    selectedRoute, 
    dateString, 
    loading, 
    showLoading,
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

  if (loading && showLoading) {
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

  const handleTabChange = (newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <div className="card">
      <div className="flex flex-col space-y-4 mb-6">
        <div className="flex space-x-4">
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
        <div className="flex items-center space-x-2">
          <label htmlFor="stop-filter" className="text-sm font-medium text-gray-700">
            Filter by stop:
          </label>
          <select
            id="stop-filter"
            value={selectedStop}
            onChange={(e) => setSelectedStop(e.target.value)}
            className="block w-full max-w-xs px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="all">All stops</option>
            {uniqueStops.map(stop => (
              <option key={stop} value={stop}>
                {stop}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div 
        ref={contentRef}
        className="transition-opacity duration-300"
        style={{ opacity: 1 }}
      >
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {tabValue === 0 ? (
              outboundTrips.map((trip) => (
                <motion.div
                  key={trip.trip_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <TripCard trip={trip} selectedStop={selectedStop} />
                </motion.div>
              ))
            ) : (
              inboundTrips.map((trip) => (
                <motion.div
                  key={trip.trip_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <TripCard trip={trip} selectedStop={selectedStop} />
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}; 