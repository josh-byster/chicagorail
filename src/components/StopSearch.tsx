import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MetraService } from '../services/metraService';
import { Stop, Route } from '../types/metra';

interface StopSearchProps {
  onStopSelect: (stop: Stop) => void;
  onStopClear: () => void;
  selectedStop: Stop | null;
}

export const StopSearch: React.FC<StopSearchProps> = ({ onStopSelect, onStopClear, selectedStop }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ stops: Stop[]; routes: Route[] }>({ stops: [], routes: [] });
  const [selectedStopRoutes, setSelectedStopRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch routes for selected stop
  useEffect(() => {
    if (selectedStop) {
      const fetchStopRoutes = async () => {
        try {
          const metraService = MetraService.getInstance();
          const { routes } = await metraService.searchStops(selectedStop.stop_name);
          setSelectedStopRoutes(routes);
        } catch (error) {
          console.error('Error fetching stop routes:', error);
        }
      };
      fetchStopRoutes();
    } else {
      setSelectedStopRoutes([]);
    }
  }, [selectedStop]);

  // Handle click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Debounced search
  useEffect(() => {
    const searchStops = async () => {
      if (query.length < 2) {
        setResults({ stops: [], routes: [] });
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const metraService = MetraService.getInstance();
        const results = await metraService.searchStops(query);
        setResults(results);
      } catch (error) {
        console.error('Error searching stops:', error);
        setError('Failed to search stops');
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(searchStops, 300);
    return () => clearTimeout(timeoutId);
  }, [query]);

  return (
    <div ref={searchRef} className="relative">
      {selectedStop ? (
        <div className="inline-flex items-center space-x-2 bg-white rounded-lg shadow-sm border border-gray-200 px-4 py-2">
          <div className="flex items-center space-x-2">
            <div className="font-medium text-gray-900">{selectedStop.stop_name}</div>
            {selectedStopRoutes.map((route) => (
              <div
                key={route.route_id}
                className="flex items-center space-x-1"
                title={`${route.route_long_name} (${route.route_short_name})`}
              >
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: `#${route.route_color}` }}
                />
                <span className="text-xs text-gray-600 font-medium">{route.route_short_name}</span>
              </div>
            ))}
          </div>
          <button
            onClick={onStopClear}
            className="text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-50 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      ) : (
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            placeholder="Search for a station..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            className="w-64 input"
          />
          <AnimatePresence>
            {isOpen && (query.length >= 2 || loading) && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl z-50 border border-gray-100"
              >
                <div className="max-h-[60vh] overflow-y-auto">
                  {loading ? (
                    <div className="flex justify-center items-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                    </div>
                  ) : error ? (
                    <div className="p-4 text-red-600 text-center">{error}</div>
                  ) : results.stops.length === 0 ? (
                    <div className="p-4 text-gray-500 text-center">
                      {query.length < 2
                        ? 'Type at least 2 characters to search'
                        : 'No stations found'}
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {results.stops.map((stop) => (
                        <button
                          key={stop.stop_id}
                          onClick={async () => {
                            // Get routes specifically for this stop before selecting it
                            const metraService = MetraService.getInstance();
                            const { routes: stopRoutes } = await metraService.searchStops(stop.stop_name);
                            setSelectedStopRoutes(stopRoutes);
                            onStopSelect(stop);
                            setIsOpen(false);
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:outline-none focus:bg-gray-50"
                        >
                          <div className="flex items-center justify-between">
                            <div className="font-medium text-gray-900">{stop.stop_name}</div>
                            <div className="flex items-center space-x-2">
                              {/* Show loading indicator for routes */}
                              <div className="w-3 h-3 rounded-full bg-gray-200 animate-pulse"></div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}; 