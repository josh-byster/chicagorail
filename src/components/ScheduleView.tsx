import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trip, Stop } from '../types/metra';
import { MetraService } from '../services/metraService';

interface ScheduleViewProps {
  selectedRoute: string;
  selectedDate: Date;
  selectedStop: Stop | null;
}

// Helper function to convert 24h time to 12h time
const formatTime = (timeStr: string): string => {
  const [hours, minutes] = timeStr.split(':');
  const hour = parseInt(hours) % 24; // Use modulo 24 to handle 24:00 correctly
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
};

// Helper function to calculate travel time
const calculateTravelTime = (departure: string | undefined, arrival: string | undefined): string => {
  if (!departure || !arrival) return '';
  const [depHours, depMinutes] = departure.split(':').map(Number);
  const [arrHours, arrMinutes] = arrival.split(':').map(Number);
  
  let totalMinutes = (arrHours * 60 + arrMinutes) - (depHours * 60 + depMinutes);
  if (totalMinutes < 0) totalMinutes += 24 * 60; // Handle overnight trips
  
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  
  if (hours === 0) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
};

// Helper function to calculate minutes from start
const calculateMinutesFromStart = (timeStr: string | undefined): number => {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

// Helper function to format minutes into hours and minutes
const formatMinutes = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

const TripCard = React.memo(({ trip, selectedStop }: { trip: Trip; selectedStop: Stop | null }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const firstStop = trip.stops[0];
  const lastStop = trip.stops[trip.stops.length - 1];
  const travelTime = firstStop?.arrival_time && lastStop?.arrival_time 
    ? calculateTravelTime(firstStop.arrival_time, lastStop.arrival_time) 
    : '';
  
  // Calculate travel time to selected stop if one is selected
  const selectedStopTime = useMemo(() => {
    if (!selectedStop || !firstStop?.arrival_time) return null;
    const stop = trip.stops.find(s => s.stop_id === selectedStop.stop_id);
    if (!stop?.arrival_time) return null;
    return calculateMinutesFromStart(stop.arrival_time);
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
        className="flex items-center justify-between cursor-pointer p-4"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-4">
          <div className="text-lg font-semibold text-gray-900">
            {firstStop?.arrival_time ? formatTime(firstStop.arrival_time) : ''}
          </div>
          <div className="text-sm text-gray-500">
            {firstStop?.stop_name} → {lastStop?.stop_name}
          </div>
          <div className="flex items-center space-x-2">
            <span className="px-2 py-1 text-xs font-medium bg-primary-100 text-primary-800 rounded-full">
              {trip.stops.length} stops
            </span>
            <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
              {travelTime}
            </span>
            {selectedStop && selectedStopTime !== null && (
              <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                To {selectedStop.stop_name}: {formatMinutes(selectedStopTime)}
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
            className="px-4 pb-4"
          >
            <div className="space-y-2">
              {trip.stops.map((stop: Stop, index: number) => {
                const minutesFromStart = firstStop?.arrival_time 
                  ? calculateMinutesFromStart(stop.arrival_time || '00:00:00') - calculateMinutesFromStart(firstStop.arrival_time)
                  : 0;
                const duration = minutesFromStart > 0 
                  ? `+${Math.floor(minutesFromStart / 60)}:${(minutesFromStart % 60).toString().padStart(2, '0')}`
                  : '0:00';
                return (
                  <div
                    key={stop.stop_id}
                    className={`flex items-center justify-between py-2 ${
                      index < trip.stops.length - 1 ? 'border-b border-gray-100' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="text-sm font-medium text-gray-900">
                        {stop.arrival_time ? formatTime(stop.arrival_time) : ''}
                      </div>
                      <div className={`text-sm ${
                        selectedStop && stop.stop_id === selectedStop.stop_id
                          ? 'font-medium text-primary-600'
                          : 'text-gray-500'
                      }`}>
                        {stop.stop_name}
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="text-xs text-gray-400">
                        {duration}
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

export const ScheduleView: React.FC<ScheduleViewProps> = ({
  selectedRoute,
  selectedDate,
  selectedStop,
}) => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const metraService = MetraService.getInstance();

  useEffect(() => {
    const fetchTrips = async () => {
      try {
        setLoading(true);
        setError(null);
        const trips = await metraService.getTripsByRoute(selectedRoute);
        console.log('Fetched trips:', trips);
        setTrips(trips || []); // Ensure we always set an array
      } catch (error) {
        console.error('Error fetching trips:', error);
        setError('Failed to load schedule');
        setTrips([]); // Set empty array on error
      } finally {
        setLoading(false);
      }
    };

    fetchTrips();
  }, [selectedRoute, selectedDate]);

  // Filter trips by selected stop if one is selected and sort by departure time
  const filteredTrips = useMemo(() => {
    console.log('Filtering trips:', { trips, selectedStop });
    if (!Array.isArray(trips) || trips.length === 0) {
      console.log('No trips to filter');
      return [];
    }

    // First filter by selected stop if one is selected
    const filtered = selectedStop
      ? trips.filter(trip => 
          trip.stops.some(stop => stop.stop_id === selectedStop.stop_id)
        )
      : trips;

    // Then sort by departure time
    return filtered.sort((a, b) => {
      const timeA = calculateMinutesFromStart(a.stops[0]?.arrival_time);
      const timeB = calculateMinutesFromStart(b.stops[0]?.arrival_time);
      return timeA - timeB;
    });
  }, [trips, selectedStop]);

  if (loading) {
    return (
      <div className="card">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <div className="text-center py-12 text-red-600">{error}</div>
      </div>
    );
  }

  if (!Array.isArray(filteredTrips) || filteredTrips.length === 0) {
    return (
      <div className="card">
        <div className="text-center py-12 text-gray-600">
          {selectedStop
            ? `No trips found for ${selectedStop.stop_name} on this date`
            : 'No trips found for this date'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {filteredTrips.map((trip) => (
        <TripCard 
          key={trip.trip_id} 
          trip={trip} 
          selectedStop={selectedStop} 
        />
      ))}
    </div>
  );
}; 