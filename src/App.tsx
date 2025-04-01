import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { DayPicker } from 'react-day-picker';
import { MetraService } from './services/metraService';
import RouteList from './components/RouteList';
import { ScheduleView } from './components/ScheduleView';
import { StopSearch } from './components/StopSearch';
import { Route, Stop } from './types/metra';

function App() {
  const today = format(new Date(), 'yyyy-MM-dd');
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [selectedStop, setSelectedStop] = useState<Stop | null>(null);
  const datePickerRef = useRef<HTMLDivElement>(null);
  const metraService = MetraService.getInstance();

  // Handle click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setIsDatePickerOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleRouteSelect = (route: Route) => {
    setSelectedRoute(route);
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      setIsDatePickerOpen(false);
    }
  };

  const handleStopSelect = (stop: Stop) => {
    setSelectedStop(stop);
  };

  const handleStopClear = () => {
    setSelectedStop(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <motion.h1 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-2xl font-bold text-gray-900"
            >
              Metra Schedule
            </motion.h1>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <StopSearch
                  onStopSelect={handleStopSelect}
                  selectedStop={selectedStop}
                  onStopClear={handleStopClear}
                />
              </div>
              <div className="relative" ref={datePickerRef}>
                <button
                  onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  {format(selectedDate, 'MMM d, yyyy')}
                </button>
                <AnimatePresence>
                  {isDatePickerOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 mt-2 bg-white rounded-lg shadow-xl z-50"
                    >
                      <DayPicker
                        mode="single"
                        selected={selectedDate}
                        onSelect={handleDateSelect}
                        modifiersClassNames={{
                          selected: "bg-primary-600 text-white",
                          today: "text-primary-600 font-bold",
                        }}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Route List */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-3"
          >
            <RouteList
              onRouteSelect={handleRouteSelect}
              selectedRoute={selectedRoute}
              selectedStop={selectedStop}
            />
          </motion.div>

          {/* Schedule View */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-9"
          >
            <AnimatePresence mode="wait">
              {selectedRoute ? (
                <motion.div
                  key={selectedRoute.route_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <ScheduleView
                    selectedRoute={selectedRoute.route_id}
                    selectedDate={selectedDate}
                    selectedStop={selectedStop}
                  />
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="card text-center py-12"
                >
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">Select a Route</h2>
                  <p className="text-gray-600">Choose a route from the list or search for a station to view its schedule</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </main>
    </div>
  );
}

export default App;
