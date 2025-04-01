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
  const [selectedStopRoutes, setSelectedStopRoutes] = useState<Route[]>([]);
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
      // Set the time to noon to avoid timezone issues
      const localDate = new Date(date);
      localDate.setHours(12, 0, 0, 0);
      
      setSelectedDate(localDate);
      metraService.setSelectedDate(localDate);
      setIsDatePickerOpen(false);
    }
  };

  const handleStopSelect = (stop: Stop) => {
    setSelectedStop(stop);
  };

  const handleStopClear = () => {
    setSelectedStop(null);
    setSelectedStopRoutes([]);
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
              <StopSearch
                onStopSelect={handleStopSelect}
                onStopClear={handleStopClear}
                onRouteSelect={handleRouteSelect}
                onStopRoutesChange={setSelectedStopRoutes}
                selectedStop={selectedStop}
              />
              <div ref={datePickerRef} className="relative">
                <button
                  onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
                  className="flex items-center space-x-2 bg-white rounded-lg shadow-sm border border-gray-200 px-4 py-2 text-gray-900 hover:bg-gray-50 transition-colors"
                >
                  <span className="font-medium">
                    {format(selectedDate, 'MMM d, yyyy')}
                  </span>
                  <motion.svg
                    animate={{ rotate: isDatePickerOpen ? 180 : 0 }}
                    className="w-5 h-5 text-gray-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </motion.svg>
                </button>
                <AnimatePresence>
                  {isDatePickerOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-2 bg-white rounded-lg shadow-xl p-4 z-50 border border-gray-100"
                    >
                      <DayPicker
                        mode="single"
                        selected={selectedDate}
                        onSelect={handleDateSelect}
                        className="border-none"
                        classNames={{
                          months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                          month: "space-y-4 w-[280px]",
                          caption: "flex justify-center pt-1 relative items-center mb-4",
                          caption_label: "text-sm font-medium",
                          nav: "space-x-1 flex items-center",
                          nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
                          nav_button_previous: "absolute left-1",
                          nav_button_next: "absolute right-1",
                          table: "w-full border-collapse",
                          head_row: "grid grid-cols-7 mb-1",
                          head_cell: "text-gray-500 font-normal text-[0.8rem] h-9 flex items-center justify-center",
                          row: "grid grid-cols-7 gap-1 mb-1",
                          cell: "text-sm relative [&:has([aria-selected])]:bg-gray-100 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20 h-9",
                          day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-gray-100 flex items-center justify-center",
                          day_selected: "bg-primary-600 text-white hover:bg-primary-700 focus:bg-primary-700",
                          day_today: "bg-gray-100 text-gray-900",
                          day_outside: "text-gray-400 opacity-50",
                          day_disabled: "text-gray-400 opacity-50",
                          day_range_middle: "aria-selected:bg-gray-100 aria-selected:text-gray-900",
                          day_hidden: "invisible",
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
              selectedStopRoutes={selectedStopRoutes}
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
