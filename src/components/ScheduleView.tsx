import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TripWithStops, StopTimeWithStop } from '../types/metra';
import { MetraService } from '../services/metraService';

interface ScheduleViewProps {
  selectedRoute: string;
  selectedDate: Date;
}

export const ScheduleView: React.FC<ScheduleViewProps> = ({ selectedRoute, selectedDate }) => {
  const [trips, setTrips] = useState<TripWithStops[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    const loadTrips = async () => {
      if (!selectedRoute) return;
      
      try {
        setLoading(true);
        setError(null);
        const metraService = MetraService.getInstance();
        metraService.setSelectedDate(selectedDate);
        const trips = await metraService.getTripsByRoute(selectedRoute);
        setTrips(trips);
      } catch (error) {
        console.error('Error loading trips:', error);
        setError('Failed to load trips');
      } finally {
        setLoading(false);
      }
    };

    loadTrips();
  }, [selectedRoute, selectedDate]);

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
  const inboundTrips = trips.filter(trip => trip.direction_id === 1);
  const outboundTrips = trips.filter(trip => trip.direction_id === 0);

  const handleTabChange = (newValue: number) => {
    setTabValue(newValue);
  };

  const TripCard = ({ trip }: { trip: TripWithStops }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const firstStop = trip.stopTimes[0];
    const lastStop = trip.stopTimes[trip.stopTimes.length - 1];

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="card mb-4"
      >
        <div
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center space-x-4">
            <div className="text-lg font-semibold text-gray-900">
              {firstStop?.departure_time}
            </div>
            <div className="text-sm text-gray-500">
              {firstStop?.stopName} → {lastStop?.stopName}
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
                        {stop.arrival_time}
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

      <AnimatePresence mode="wait">
        <motion.div
          key={tabValue}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
        >
          {tabValue === 0 ? (
            outboundTrips.map((trip) => (
              <TripCard key={trip.trip_id} trip={trip} />
            ))
          ) : (
            inboundTrips.map((trip) => (
              <TripCard key={trip.trip_id} trip={trip} />
            ))
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}; 